'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { triggerSocketEvent } from "@/lib/socket";

export async function updateOrderStatus(orderId: number, newStatus: string) {
  try {
    // 1. Update the DB
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    // 2. SIGNAL THE NETWORK (Event-Driven)
    // This tells other iPads/screens to refresh
    try {
        triggerSocketEvent("status-update", { 
            orderId, 
            status: newStatus 
        });
    } catch (socketError) {
        console.error("Socket trigger failed:", socketError);
    }

    // 3. Revalidate Server Cache for the user triggering the action
    revalidatePath('/admin/queue');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update order:", error);
    return { success: false, message: "Database error" };
  }
}

// --- INGREDIENT MANAGEMENT ---

export async function updateIngredientAvailability(ingredientId: number, isAvailable: boolean) {
  try {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { isAvailable }
    });
    revalidatePath('/admin/inventory');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update ingredient availability:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateIngredientVisibility(ingredientId: number, isShowing: boolean) {
  try {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { isShowing }
    });
    revalidatePath('/admin/inventory');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update ingredient visibility:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateIngredientRank(ingredientId: number, rank: number) {
  try {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { rank }
    });
    revalidatePath('/admin/inventory');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update ingredient rank:", error);
    return { success: false, message: "Database error" };
  }
}

// --- SCHEDULE MANAGEMENT ---

export async function updateSchedule(
  dayOfWeek: number,
  openTime1: string,
  closeTime1: string,
  openTime2: string | null,
  closeTime2: string | null,
  isSecondPeriodActive: boolean,
  isOpen: boolean
) {
  try {
    await prisma.schedule.upsert({
      where: { dayOfWeek },
      update: {
        openTime1,
        closeTime1,
        openTime2,
        closeTime2,
        isSecondPeriodActive,
        isOpen
      },
      create: {
        dayOfWeek,
        openTime1,
        closeTime1,
        openTime2,
        closeTime2,
        isSecondPeriodActive,
        isOpen
      }
    });
    revalidatePath('/admin/schedule');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return { success: false, message: "Database error" };
  }
}

// --- STATISTICS ---

export async function getTodayStatistics() {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const startOfDay = new Date(`${todayStr}T00:00:00`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999`);

    const ordersToday = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'cancelled' }
      },
      include: {
        items: {
          include: {
            product: true,
            modifiers: {
              include: { ingredient: true }
            }
          }
        }
      }
    });

    let totalDrinks = 0;
    let totalHot = 0;
    let totalIced = 0;
    let totalCafShots = 0;
    let totalDecafShots = 0;

    ordersToday.forEach(order => {
      order.items.forEach(item => {
        totalDrinks += item.quantity;

        // Temperature
        const temp = (item.temperature || "").toLowerCase();
        if (temp.includes('iced')) {
          totalIced += item.quantity;
        } else {
          totalHot += item.quantity;
        }

        // Shots
        const shots = item.shots || 0;
        if (item.product.category === 'coffee' && shots > 0) {
          const isDecaf = item.product.name.toLowerCase().includes('decaf') ||
                         item.modifiers.some(m => m.ingredient.name.toLowerCase().includes('decaf'));
          if (isDecaf) {
            totalDecafShots += shots * item.quantity;
          } else {
            totalCafShots += shots * item.quantity;
          }
        }
      });
    });

    return {
      success: true,
      data: {
        totalDrinks,
        totalHot,
        totalIced,
        totalCafShots,
        totalDecafShots
      }
    };
  } catch (error) {
    console.error("Failed to get today statistics:", error);
    return { success: false, message: "Database error" };
  }
}

// --- QUEUE DRINK COUNT ---

export async function getQueueDrinkCount() {
  try {
    const drinkCount = await prisma.orderItem.count({
      where: {
        completed_at: null,
        order: {
          status: { in: ['queued', 'preparing'] }
        }
      }
    });

    return { success: true, count: drinkCount };
  } catch (error) {
    console.error("Failed to get queue drink count:", error);
    return { success: false, message: "Database error", count: 0 };
  }
}

// --- COMPREHENSIVE STATISTICS ---

export async function getStatistics(timeframe: 'today' | 'week' | 'month' | 'all') {
  try {
    let startDate: Date;
    const now = new Date();
    
    switch (timeframe) {
      case 'today':
        const todayStr = now.toLocaleDateString('en-CA');
        startDate = new Date(`${todayStr}T00:00:00`);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' }
      },
      include: {
        items: {
          include: {
            product: true,
            modifiers: {
              include: { ingredient: true }
            }
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Initialize stats
    const stats = {
      totalOrders: orders.length,
      totalDrinks: 0,
      totalHot: 0,
      totalIced: 0,
      totalCafShots: 0,
      totalDecafShots: 0,
      productCounts: {} as Record<string, number>,
      categoryCounts: {} as Record<string, number>,
      milkCounts: {} as Record<string, number>,
      syrupCounts: {} as Record<string, number>,
      hourlyDistribution: {} as Record<number, number>,
      dailyDistribution: {} as Record<string, number>,
      averageItemsPerOrder: 0,
      mostPopularProduct: { name: '', count: 0 },
      mostPopularCategory: { name: '', count: 0 },
      busiestHour: { hour: 0, count: 0 },
      ordersByStatus: {} as Record<string, number>
    };

    // Process orders
    orders.forEach(order => {
      // Track order status
      stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;

      // Hourly distribution
      const orderHour = new Date(order.createdAt).getHours();
      stats.hourlyDistribution[orderHour] = (stats.hourlyDistribution[orderHour] || 0) + 1;

      // Daily distribution
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA');
      stats.dailyDistribution[orderDate] = (stats.dailyDistribution[orderDate] || 0) + 1;

      // Process items
      order.items.forEach(item => {
        stats.totalDrinks += item.quantity;

        // Temperature
        const temp = (item.temperature || "").toLowerCase();
        if (temp.includes('iced')) {
          stats.totalIced += item.quantity;
        } else {
          stats.totalHot += item.quantity;
        }

        // Product counts
        const productName = item.product.name;
        stats.productCounts[productName] = (stats.productCounts[productName] || 0) + item.quantity;

        // Category counts
        const category = item.product.category;
        stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + item.quantity;

        // Shots
        const shots = item.shots || 0;
        if (item.product.category === 'coffee' && shots > 0) {
          const isDecaf = item.product.name.toLowerCase().includes('decaf') ||
                         item.modifiers.some(m => m.ingredient.name.toLowerCase().includes('decaf'));
          if (isDecaf) {
            stats.totalDecafShots += shots * item.quantity;
          } else {
            stats.totalCafShots += shots * item.quantity;
          }
        }

        // Milk counts
        if (item.milkName && item.milkName !== "No Milk") {
          stats.milkCounts[item.milkName] = (stats.milkCounts[item.milkName] || 0) + item.quantity;
        }

        // Check modifiers for milk and syrups
        item.modifiers.forEach(mod => {
          if (mod.ingredient.category === 'milk') {
            stats.milkCounts[mod.ingredient.name] = (stats.milkCounts[mod.ingredient.name] || 0) + (item.quantity * mod.quantity);
          } else if (mod.ingredient.category === 'syrup') {
            stats.syrupCounts[mod.ingredient.name] = (stats.syrupCounts[mod.ingredient.name] || 0) + (item.quantity * mod.quantity);
          }
        });
      });
    });

    // Calculate averages
    if (stats.totalOrders > 0) {
      stats.averageItemsPerOrder = Math.round((stats.totalDrinks / stats.totalOrders) * 10) / 10;
    }

    // Find most popular product
    Object.entries(stats.productCounts).forEach(([name, count]) => {
      if (count > stats.mostPopularProduct.count) {
        stats.mostPopularProduct = { name, count };
      }
    });

    // Find most popular category
    Object.entries(stats.categoryCounts).forEach(([name, count]) => {
      if (count > stats.mostPopularCategory.count) {
        stats.mostPopularCategory = { name, count };
      }
    });

    // Find busiest hour
    Object.entries(stats.hourlyDistribution).forEach(([hour, count]) => {
      const hourNum = parseInt(hour);
      if (count > stats.busiestHour.count) {
        stats.busiestHour = { hour: hourNum, count };
      }
    });

    return {
      success: true,
      data: stats,
      timeframe
    };
  } catch (error) {
    console.error("Failed to get statistics:", error);
    return { success: false, message: "Database error" };
  }
}