'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

  // 2. Count ONLY items that are NOT completed, from orders OLDER than mine
  const itemsAhead = await prisma.orderItem.count({
    where: {
      status: { not: 'completed' }, // strictly items yet to be made
      order: {
        createdAt: { lt: currentOrder.createdAt }, // strictly older orders
        status: { in: ['queued', 'preparing'] } // from active orders only
      }
    }
  });

  // 3. My position is (Items Ahead) + 1
  return itemsAhead + 1;
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