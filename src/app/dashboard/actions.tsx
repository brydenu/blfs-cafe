'use server';

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { triggerSocketEvent } from "@/lib/socket";

// --- EXISTING: Fetch Daily History ---
export async function fetchDailyHistory(dateStr: string) {
  const session = await auth();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) return [];

  const startOfDay = new Date(`${dateStr}T00:00:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999`);

  const rawOrders = await prisma.order.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: { not: 'cancelled' }
    },
    include: {
        items: {
            include: { 
                product: true,
                modifiers: { include: { ingredient: true } }
            },
            orderBy: { id: 'asc' }
        }
    },
    orderBy: { createdAt: 'desc' }
  });

  return serializeOrders(rawOrders);
}

// --- NEW: Fetch Single Order (For Recent Tracker) ---
export async function fetchSingleOrder(publicId: string) {
  const session = await auth();
  if (!session?.user?.email) return null;

  const rawOrder = await prisma.order.findUnique({
    where: { publicId },
    include: {
        items: {
            include: { 
                product: true,
                modifiers: { include: { ingredient: true } }
            },
            orderBy: { id: 'asc' }
        }
    }
  });

  if (!rawOrder) return null;
  return serializeOrders([rawOrder])[0];
}

// --- CANCEL ORDER ITEM ---
export async function cancelOrderItem(itemId: number) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: 'Not authenticated' };
    }

    // 1. Get the item with order and product info
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: { user: true }
        },
        product: true
      }
    });

    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    // 2. Verify the user owns this order
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || item.order.userId !== user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // 3. Don't allow cancelling if already completed (has completed_at) or already cancelled
    if (item.completed_at !== null || item.cancelled) {
      return { success: false, message: 'Item already completed or cancelled' };
    }

    // 4. Mark the item as cancelled
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { cancelled: true }
    });

    // 5. Check if all items in the order are cancelled or completed
    const remainingItems = await prisma.orderItem.count({
      where: {
        orderId: item.orderId,
        completed_at: null,
        cancelled: false
      }
    });

    // 6. If all items are cancelled/completed, update order status
    if (remainingItems === 0) {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status: 'cancelled' }
      });

      // Emit order cancelled event
      triggerSocketEvent("order-update", {
        type: 'order-cancelled',
        orderId: item.orderId,
        publicId: item.order.publicId,
        userId: item.order.userId
      });
    } else {
      // Emit item cancelled event
      triggerSocketEvent("order-update", {
        type: 'item-cancelled',
        orderId: item.orderId,
        itemId: itemId,
        itemName: item.product.name,
        recipientName: item.recipientName || "Guest",
        userId: item.order.userId,
        publicId: item.order.publicId
      });
    }

    // 7. Trigger admin queue refresh
    triggerSocketEvent("refresh-queue", { type: 'refresh' });

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel item:", error);
    return { success: false, message: 'Failed to cancel item' };
  }
}

// --- STRICT QUEUE POSITION LOGIC ---
export async function getQueuePosition(orderId: number) {
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
}

// --- Sign Out ---
export async function handleSignOut() {
  await signOut({ redirect: false });
  redirect("/");
}

// --- Fetch Schedule ---
export async function fetchSchedule() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { dayOfWeek: 'asc' }
  });
  return schedules;
}

// --- Update Order Notification Preferences ---
export async function updateOrderNotificationPreferences(
  orderId: number,
  data: {
    notificationsEnabled: boolean;
    notificationMethods: { email: boolean; sms: boolean };
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: 'Not authenticated' };
    }

    // Verify the user owns this order
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.userId !== user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update order notification preferences (this is per-order, doesn't affect user defaults)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        notificationsEnabled: data.notificationsEnabled,
        notificationMethods: data.notificationMethods,
      }
    });

    return { success: true, message: 'Notification preferences updated' };
  } catch (error) {
    console.error("Failed to update order notification preferences:", error);
    return { success: false, message: 'Failed to update preferences' };
  }
}

// --- Helper ---
function serializeOrders(orders: any[]) {
  return orders.map(order => ({
    ...order,
    total: Number(order.total),
    items: order.items.map((item: any) => ({
        ...item,
        product: {
            ...item.product,
            basePrice: Number(item.product.basePrice)
        },
        modifiers: item.modifiers.map((mod: any) => ({
            ...mod,
            ingredient: {
                ...mod.ingredient,
                priceMod: Number(mod.ingredient.priceMod)
            }
        }))
    }))
  }));
}