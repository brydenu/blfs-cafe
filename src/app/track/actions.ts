'use server';

import { prisma } from "@/lib/db";

// Lookup order by publicId (no auth required - for guest tracking)
export async function lookupOrderByCode(publicId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { publicId },
      include: {
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

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // Serialize Decimals
    const serializedOrder = {
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        product: item.product,
        modifiers: item.modifiers
      }))
    };

    return { success: true, order: serializedOrder };
  } catch (error) {
    console.error("Failed to lookup order:", error);
    return { success: false, message: 'Failed to lookup order' };
  }
}

// Update guest email on order
export async function updateGuestEmail(orderId: number, email: string) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Verify order exists and is a guest order (userId is null)
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // Update guest email and enable notifications by default
    await prisma.order.update({
      where: { id: orderId },
      data: {
        guestEmail: email,
        notificationsEnabled: true,
        notificationMethods: { email: true, sms: false }
      }
    });

    return { success: true, message: 'Email updated successfully' };
  } catch (error) {
    console.error("Failed to update guest email:", error);
    return { success: false, message: 'Failed to update email' };
  }
}

// Update notification preferences for guest orders
export async function updateGuestOrderNotifications(
  orderId: number,
  data: {
    notificationsEnabled: boolean;
    notificationMethods: { email: boolean; sms: boolean };
  }
) {
  try {
    // Verify order exists and is a guest order (userId is null)
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // Only allow updates for guest orders (no userId) or if guestEmail is set
    if (order.userId !== null && !order.guestEmail) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update order notification preferences
    await prisma.order.update({
      where: { id: orderId },
      data: {
        notificationsEnabled: data.notificationsEnabled,
        notificationMethods: data.notificationMethods,
      }
    });

    return { success: true, message: 'Notification preferences updated' };
  } catch (error) {
    console.error("Failed to update guest order notifications:", error);
    return { success: false, message: 'Failed to update preferences' };
  }
}

// Get queue position for any order (works for both authenticated and guest orders)
export async function getQueuePositionForOrder(orderId: number) {
  try {
    // 1. Get current order info
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { createdAt: true, status: true }
    });

    if (!currentOrder) return null;
    
    // If my order is done, I don't have a queue position
    if (currentOrder.status === 'completed' || currentOrder.status === 'cancelled') return null;

    // 2. Count ONLY items that are NOT completed (completed_at IS NULL) and NOT cancelled, from orders OLDER than mine
    const itemsAhead = await prisma.orderItem.count({
      where: {
        completed_at: null, // strictly items yet to be made
        cancelled: false, // exclude cancelled items
        order: {
          createdAt: { lt: currentOrder.createdAt }, // strictly older orders
          status: { in: ['queued', 'preparing'] } // from active orders only
        }
      }
    });

    // 3. My position is (Items Ahead) + 1
    return itemsAhead + 1;
  } catch (error) {
    console.error("Failed to get queue position:", error);
    return null;
  }
}

// Cancel order item for guest orders
export async function cancelGuestOrderItem(itemId: number, publicId: string) {
  try {
    // Get the item with order info
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: true,
        product: true
      }
    });

    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    // Verify the order publicId matches (security check)
    if (item.order.publicId !== publicId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Don't allow cancelling if already completed or cancelled
    if (item.completed_at !== null || item.cancelled) {
      return { success: false, message: 'Item already completed or cancelled' };
    }

    // Mark the item as cancelled
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { cancelled: true }
    });

    // Check if all items in the order are cancelled or completed
    const remainingItems = await prisma.orderItem.count({
      where: {
        orderId: item.orderId,
        completed_at: null,
        cancelled: false
      }
    });

    // If all items are cancelled/completed, update order status
    if (remainingItems === 0) {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status: 'cancelled' }
      });
    }

    // Trigger socket event for admin queue refresh
    const { triggerSocketEvent } = await import("@/lib/socket");
    triggerSocketEvent("refresh-queue", { type: 'refresh' });
    triggerSocketEvent("order-update", {
      type: 'item-cancelled',
      orderId: item.orderId,
      itemId: itemId,
      itemName: item.product.name,
      recipientName: item.recipientName || "Guest",
      publicId: item.order.publicId
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel guest order item:", error);
    return { success: false, message: 'Failed to cancel item' };
  }
}
