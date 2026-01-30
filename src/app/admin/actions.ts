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

export async function createIngredient(
  name: string,
  category: string,
  isAvailable: boolean = true,
  isShowing: boolean = true
) {
  try {
    await prisma.ingredient.create({
      data: {
        name,
        category,
        isAvailable,
        isShowing,
        rank: 0, // Default rank is 0 (not featured)
        priceMod: 0.00
      }
    });
    revalidatePath('/admin/inventory');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to create ingredient:", error);
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

        // Shots (count shots for any drink, regardless of category)
        const shots = item.shots || 0;
        if (shots > 0) {
          // Check caffeineType for accurate shot counting
          if (item.caffeineType === 'Decaf') {
            totalDecafShots += shots * item.quantity;
          } else if (item.caffeineType === 'Half-Caff') {
            // Half-caff: divide shots by 2, add half to each total
            const halfShots = (shots * item.quantity) / 2;
            totalDecafShots += halfShots;
            totalCafShots += halfShots;
          } else {
            // Normal or null caffeineType counts as regular caff shots
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

        // Shots (count shots for any drink, regardless of category)
        const shots = item.shots || 0;
        if (shots > 0) {
          // Check caffeineType for accurate shot counting
          if (item.caffeineType === 'Decaf') {
            stats.totalDecafShots += shots * item.quantity;
          } else if (item.caffeineType === 'Half-Caff') {
            // Half-caff: divide shots by 2, add half to each total
            const halfShots = (shots * item.quantity) / 2;
            stats.totalDecafShots += halfShots;
            stats.totalCafShots += halfShots;
          } else {
            // Normal or null caffeineType counts as regular caff shots
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

// --- INGREDIENT USAGE STATISTICS ---

export async function getIngredientUsageStats() {
  try {
    const now = new Date();
    
    // Define timeframes
    const todayStr = now.toLocaleDateString('en-CA');
    const todayStart = new Date(`${todayStr}T00:00:00`);
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);
    
    const allTimeStart = new Date(0);

    // Fetch all ingredients
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    });

    // Fetch all orders with items and modifiers for all timeframes
    const allOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: allTimeStart },
        status: { not: 'cancelled' }
      },
      include: {
        items: {
          include: {
            modifiers: {
              include: { ingredient: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total drinks for each timeframe
    const getTotalDrinks = (orders: typeof allOrders) => {
      return orders.reduce((total, order) => {
        return total + order.items.reduce((sum, item) => sum + item.quantity, 0);
      }, 0);
    };

    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= todayStart);
    const weekOrders = allOrders.filter(o => new Date(o.createdAt) >= weekStart);
    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart);

    const totalDrinksToday = getTotalDrinks(todayOrders);
    const totalDrinksWeek = getTotalDrinks(weekOrders);
    const totalDrinksMonth = getTotalDrinks(monthOrders);
    const totalDrinksAllTime = getTotalDrinks(allOrders);

    // Helper to check if a drink item has any ingredient from a specific category
    const hasCategoryIngredient = (item: typeof allOrders[0]['items'][0], category: string, allIngredients: typeof ingredients) => {
      // Check modifiers for ingredients in this category
      const hasModifier = item.modifiers.some(mod => {
        const modIngredient = allIngredients.find(ing => ing.id === mod.ingredientId);
        return modIngredient?.category === category;
      });
      
      // Check milkName for milk category
      const hasMilk = category === 'milk' && item.milkName && item.milkName !== "No Milk";
      
      return hasModifier || hasMilk;
    };

    // Helper to count drinks with any ingredient from a specific category
    const countDrinksWithCategory = (orders: typeof allOrders, category: string) => {
      let count = 0;
      orders.forEach(order => {
        order.items.forEach(item => {
          if (hasCategoryIngredient(item, category, ingredients)) {
            count += item.quantity;
          }
        });
      });
      return count;
    };

    // Calculate drinks with category ingredients for each timeframe
    const categoryTotalsByTimeframe: Record<string, { today: number; week: number; month: number; allTime: number }> = {};
    
    // Get unique categories
    const categories = [...new Set(ingredients.map(ing => ing.category))];
    
    categories.forEach(category => {
      categoryTotalsByTimeframe[category] = {
        today: countDrinksWithCategory(todayOrders, category),
        week: countDrinksWithCategory(weekOrders, category),
        month: countDrinksWithCategory(monthOrders, category),
        allTime: countDrinksWithCategory(allOrders, category)
      };
    });

    // Process each ingredient
    const ingredientStats = ingredients.map(ingredient => {
      // Helper to count drinks using this specific ingredient
      const countDrinksWithIngredient = (orders: typeof allOrders, ingredientId: number, ingredientName: string, ingredientCategory: string) => {
        let count = 0;
        orders.forEach(order => {
          order.items.forEach(item => {
            // Check if ingredient is used via Modifier
            const hasModifier = item.modifiers.some(mod => mod.ingredientId === ingredientId);
            
            // Check if ingredient is used via milkName (for milk category)
            const hasMilkName = ingredientCategory === 'milk' && 
                               item.milkName && 
                               item.milkName.toLowerCase() === ingredientName.toLowerCase();
            
            if (hasModifier || hasMilkName) {
              count += item.quantity;
            }
          });
        });
        return count;
      };

      const drinksToday = countDrinksWithIngredient(todayOrders, ingredient.id, ingredient.name, ingredient.category);
      const drinksWeek = countDrinksWithIngredient(weekOrders, ingredient.id, ingredient.name, ingredient.category);
      const drinksMonth = countDrinksWithIngredient(monthOrders, ingredient.id, ingredient.name, ingredient.category);
      const drinksAllTime = countDrinksWithIngredient(allOrders, ingredient.id, ingredient.name, ingredient.category);

      // Calculate usage percentages based on category totals
      const categoryTotals = categoryTotalsByTimeframe[ingredient.category];
      const usagePercentToday = categoryTotals.today > 0 ? (drinksToday / categoryTotals.today) * 100 : 0;
      const usagePercentWeek = categoryTotals.week > 0 ? (drinksWeek / categoryTotals.week) * 100 : 0;
      const usagePercentMonth = categoryTotals.month > 0 ? (drinksMonth / categoryTotals.month) * 100 : 0;
      const usagePercentAllTime = categoryTotals.allTime > 0 ? (drinksAllTime / categoryTotals.allTime) * 100 : 0;

      return {
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category,
        today: {
          drinks: drinksToday,
          usagePercent: Math.round(usagePercentToday * 10) / 10
        },
        week: {
          drinks: drinksWeek,
          usagePercent: Math.round(usagePercentWeek * 10) / 10
        },
        month: {
          drinks: drinksMonth,
          usagePercent: Math.round(usagePercentMonth * 10) / 10
        },
        allTime: {
          drinks: drinksAllTime,
          usagePercent: Math.round(usagePercentAllTime * 10) / 10
        }
      };
    });

    // Sort by all-time usage (descending)
    ingredientStats.sort((a, b) => b.allTime.drinks - a.allTime.drinks);

    return {
      success: true,
      data: {
        ingredients: ingredientStats,
        totalDrinks: {
          today: totalDrinksToday,
          week: totalDrinksWeek,
          month: totalDrinksMonth,
          allTime: totalDrinksAllTime
        }
      }
    };
  } catch (error) {
    console.error("Failed to get ingredient usage statistics:", error);
    return { success: false, message: "Database error" };
  }
}