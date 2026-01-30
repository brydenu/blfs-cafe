'use server';

import { prisma } from "@/lib/db";
import { triggerSocketEvent } from "@/lib/socket";
import { sendNotification } from "@/lib/notifications"; // Import your new notification system
import { auth } from "@/auth";
import { generateOrderId } from "@/lib/order-id";

export async function completeOrderItem(itemId: number) {
  try {
    // 1. Mark the specific item as completed by setting completed_at timestamp
    // We include 'product' so we can use the name in notifications
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { completed_at: new Date() },
      include: { 
        order: true,
        product: true 
      } 
    });

    // 2. Check if the parent Order has any items LEFT to do
    // We count items in the SAME order that are NOT completed (completed_at IS NULL)
    const remainingItems = await prisma.orderItem.count({
      where: {
        orderId: updatedItem.orderId,
        completed_at: null
      }
    });

    // 3. LOGIC FOR NOTIFICATIONS & ORDER COMPLETION
    if (remainingItems === 0) {
      // --- SCENARIO: ORDER COMPLETE (Solo or Last Item of Group) ---
      
      // A. Update Order Status in DB
      const completedOrder = await prisma.order.update({
        where: { id: updatedItem.orderId },
        data: { status: 'completed' },
        include: { 
          user: {
            select: {
              notificationsEnabled: true,
              notificationDefaultType: true,
              notificationMethods: true,
              firstName: true,
              email: true,
            }
          },
          items: {
            include: {
              product: true,
              modifiers: {
                include: {
                  ingredient: true
                }
              }
            },
            orderBy: { id: 'asc' }
          }
        }
      });

      // B. CHECK NOTIFICATION PREFERENCES AND SEND EMAIL
      // Determine effective notification preferences (order override or user default)
      // If order has explicit notification preference, use it; otherwise check user default
      const effectiveNotificationsEnabled = completedOrder.notificationsEnabled !== null 
        ? completedOrder.notificationsEnabled 
        : (completedOrder.user?.notificationsEnabled ?? false);
      
      const effectiveNotificationMethods = completedOrder.notificationMethods || completedOrder.user?.notificationMethods || { email: true };

      // Try to find an email (User Account Email OR Guest Email)
      const recipientEmail = completedOrder.user?.email || completedOrder.guestEmail;

      if (effectiveNotificationsEnabled && recipientEmail && (effectiveNotificationMethods as any)?.email) {
        // We don't await this because we don't want to slow down the UI 
        // while the email sends. It runs in the background.
        sendNotification('ORDER_COMPLETED', recipientEmail, {
            name: completedOrder.guestName || completedOrder.user?.firstName || "Guest",
            items: completedOrder.items,
            publicIdFull: completedOrder.publicId // Full ID for links
        }).catch(err => console.error("Background email failed:", err));
      }

      // C. Emit "Order Completed" Socket Event (For Tracker)
      triggerSocketEvent("order-update", { 
        type: 'order-completed', 
        orderId: updatedItem.orderId,
        publicId: updatedItem.order.publicId,
        userId: updatedItem.order.userId,
      });

    } else {
      // --- SCENARIO: ITEM COMPLETE (Group Order, items remaining) ---
      // No notifications sent for individual items - only when entire order is complete
      
      // Emit "Item Completed" Socket Event
      triggerSocketEvent("order-update", { 
        type: 'item-completed',
        orderId: updatedItem.orderId,
        itemName: updatedItem.product.name,
        recipientName: updatedItem.recipientName || "Guest",
        userId: updatedItem.order.userId,
      });
    }

    // 4. Always trigger Admin Queue Refresh (Barista Screen)
    triggerSocketEvent("refresh-queue", { type: 'refresh' });

    return { success: true };
  } catch (error) {
    console.error("Failed to complete item:", error);
    return { success: false };
  }
}

// Verify admin permissions helper
async function verifyAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// Search users for queue utilities
export async function searchUsersForQueue(query: string) {
  try {
    await verifyAdmin();

    if (!query || query.trim().length === 0) {
      return { success: true, data: [] };
    }

    const searchTerm = query.trim();

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit to 10 results
    });

    return {
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        displayName: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.name || user.email || 'Unknown',
      })),
    };
  } catch (error) {
    console.error("Failed to search users:", error);
    return { success: false, message: error instanceof Error ? error.message : "Database error", data: [] };
  }
}

// Create walk-up order from admin queue
export async function createWalkUpOrder(data: {
  productId: number;
  recipientName: string;
  userId?: string | null;
  shots: number;
  temperature: string;
  milkId?: number | null;
  modifiers: Record<number, number>;
  cupType?: string;
  caffeineType?: string | null;
  milkSteamed?: boolean | null;
  foamLevel?: string | null;
  milkAmount?: string | null;
  notes?: string;
}) {
  try {
    await verifyAdmin();

    // Validate product exists and is available
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        deletedAt: null,
      },
    });

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    if (!product.isActive) {
      return { success: false, message: "Product is currently unavailable" };
    }

    // Validate user if provided
    let user = null;
    if (data.userId) {
      user = await prisma.user.findUnique({
        where: { id: data.userId },
      });
      if (!user || user.deletedAt) {
        return { success: false, message: "User not found" };
      }
    }

    // Get milk name if milkId is provided
    let milkName = "No Milk";
    if (data.milkId && data.milkId !== -1) {
      const milkIngredient = await prisma.ingredient.findUnique({
        where: { id: data.milkId },
      });
      if (milkIngredient) {
        milkName = milkIngredient.name;
      }
    }

    // Create order notification data if user exists
    const orderNotificationData: {
      notificationsEnabled?: boolean;
      notificationMethods?: any;
    } = {};
    
    if (user) {
      orderNotificationData.notificationsEnabled = user.notificationsEnabled;
      orderNotificationData.notificationMethods = user.notificationMethods;
    }

    // Generate order ID and create order with retry logic
    let order;
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const publicId = await generateOrderId();

        order = await prisma.order.create({
          data: {
            publicId,
            userId: data.userId || null,
            guestName: data.userId ? null : data.recipientName,
            status: 'queued',
            total: 0, // Free service, no cost
            ...orderNotificationData,
            items: {
              create: {
                productId: data.productId,
                quantity: 1,
                shots: data.shots,
                temperature: data.temperature,
                milkName: milkName,
                recipientName: data.recipientName,
                specialInstructions: data.notes || "",
                cupType: data.cupType || 'to-go',
                caffeineType: data.caffeineType || null,
                milkSteamed: data.milkSteamed ?? null,
                foamLevel: data.foamLevel || null,
                milkAmount: data.milkAmount || null,
                modifiers: {
                  create: Object.entries(data.modifiers).map(([ingId, qty]) => ({
                    ingredientId: parseInt(ingId),
                    quantity: qty,
                  })),
                },
              },
            },
          },
        });

        // Success - break out of retry loop
        break;
      } catch (error: any) {
        // Check if it's a unique constraint violation on publicId
        if (error?.code === 'P2002' && error?.meta?.target?.includes('publicId')) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(`Failed to create order after ${maxRetries} attempts due to ID conflicts`);
          }
          // Retry with a new ID
          continue;
        }
        // If it's not a unique constraint error, re-throw it
        throw error;
      }
    }

    if (!order) {
      throw new Error('Failed to create order after retries');
    }

    // Trigger socket event to refresh queue
    triggerSocketEvent("refresh-queue", {
      type: 'new-order',
      orderId: order.id,
    });

    return { success: true, orderId: order.publicId };
  } catch (error: any) {
    console.error("Failed to create walk-up order:", error);
    return { success: false, message: error instanceof Error ? error.message : "Database error" };
  }
}

// Get products and ingredients for order form
export async function getProductsAndIngredients() {
  try {
    await verifyAdmin();

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { category: 'asc' },
    });

    const ingredients = await prisma.ingredient.findMany({
      where: {
        isShowing: true,
      },
      orderBy: { rank: 'desc' },
    });

    return {
      success: true,
      data: {
        products: products.map(p => {
          const { basePrice, ...productWithoutPrice } = p;
          return productWithoutPrice;
        }),
        ingredients: ingredients.map(i => {
          const { priceMod, ...ingredientWithoutPrice } = i;
          return ingredientWithoutPrice;
        }),
      },
    };
  } catch (error) {
    console.error("Failed to get products and ingredients:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Database error",
      data: { products: [], ingredients: [] },
    };
  }
}