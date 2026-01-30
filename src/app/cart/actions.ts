'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth"; // Assuming you use NextAuth/Auth.js
import { CartItem } from "@/providers/CartProvider";
import { triggerSocketEvent } from "@/lib/socket"; // <--- 1. Import this
import { generateOrderId } from "@/lib/order-id";

export async function placeOrder(items: CartItem[]) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (items.length === 0) {
    return { success: false, message: "Cart is empty" };
  }

  try {
    // 1. Validate product availability
    // Collect all unique product IDs from items
    const productIds = new Set<number>();
    items.forEach(item => {
      productIds.add(item.productId);
    });

    // Check availability of all products
    if (productIds.size > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: Array.from(productIds) } },
        select: { id: true, name: true, isActive: true, deletedAt: true }
      });

      const unavailableProducts = products.filter(p => !p.isActive || p.deletedAt !== null);
      
      if (unavailableProducts.length > 0) {
        const productNames = unavailableProducts.map(p => p.name).join(', ');
        return { 
          success: false, 
          message: `We're sorry, but the following item(s) are currently unavailable: ${productNames}. Please remove them from your order and try again.` 
        };
      }
    }

    // 2. Validate ingredient availability
    // Collect all ingredient IDs from modifiers and milk selections
    const ingredientIds = new Set<number>();
    items.forEach(item => {
      // Add modifier ingredient IDs
      Object.keys(item.modifiers || {}).forEach(idStr => {
        ingredientIds.add(parseInt(idStr));
      });
      // Add milk ID if selected
      if (item.milkId && item.milkId !== -1) {
        ingredientIds.add(item.milkId);
      }
    });

    // Check availability of all ingredients
    if (ingredientIds.size > 0) {
      const ingredients = await prisma.ingredient.findMany({
        where: { id: { in: Array.from(ingredientIds) } },
        select: { id: true, name: true, isAvailable: true }
      });

      const unavailableIngredients = ingredients.filter(ing => !ing.isAvailable);
      
      if (unavailableIngredients.length > 0) {
        const ingredientNames = unavailableIngredients.map(ing => ing.name).join(', ');
        return { 
          success: false, 
          message: `We're sorry, but the cafe is currently out of the following ingredient(s): ${ingredientNames}. Please remove them from your order and try again.` 
        };
      }
    }

    // 3. Resolve User
    let userId = null;
    let guestEmail = null;
    let guestName = null; // We could capture this from a form if needed

    let user = null;
    if (userEmail) {
      user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) userId = user.id;
    }

    // 2. Create the Order
    // We calculate total roughly here, or trust the client (better to recalc in real app)
    const total = items.reduce((sum, item) => sum + (item.basePrice || 0), 0);

    // Copy user notification preferences to order (if user exists and has preferences)
    // Note: Setting these on the order allows per-order override without changing user defaults
    const orderNotificationData: {
      notificationsEnabled?: boolean;
      notificationMethods?: any;
    } = {};
    
    if (user) {
      orderNotificationData.notificationsEnabled = user.notificationsEnabled;
      orderNotificationData.notificationMethods = user.notificationMethods;
    }

    // Generate the date-based order ID with retry logic for race conditions
    let order;
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const publicId = await generateOrderId();

        order = await prisma.order.create({
          data: {
            publicId, // Explicitly set the generated ID
            userId,
            guestEmail, // If you had a guest email input
            guestName,  // If you had a guest name input
            status: 'queued',
            total: total,
            ...orderNotificationData,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: 1,
                shots: item.shots,
                temperature: item.temperature,
                milkName: item.milkName,
                recipientName: item.recipientName,
                specialInstructions: item.notes || "", // Use notes field
                cupType: item.cupType || 'to-go',
                caffeineType: item.caffeineType || null,
                milkSteamed: item.milkSteamed ?? null,
                foamLevel: item.foamLevel || null,
                milkAmount: item.milkAmount || null,
                // completed_at defaults to null (not completed)
                // cancelled defaults to false
                modifiers: {
                  create: Object.entries(item.modifiers).map(([ingId, qty]) => ({
                    ingredientId: parseInt(ingId),
                    quantity: qty
                  }))
                }
              }))
            }
          }
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

    // 3. TRIGGER SOCKET EVENT
    // This tells the Admin Screen to refresh immediately
    triggerSocketEvent("refresh-queue", { 
        type: 'new-order', 
        orderId: order.id 
    });

    return { success: true, orderId: order.publicId };

  } catch (error) {
    console.error("Order placement failed:", error);
    return { success: false, message: "Database error" };
  }
}