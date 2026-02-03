'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getPacificStartOfDay, getPacificEndOfDay } from "@/lib/pacific-time";

// Verify admin permissions helper
async function verifyAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// Get users with search and filter
export async function getUsers(search?: string, includeDeleted: boolean = false) {
  try {
    await verifyAdmin();

    const where: any = {};
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        orders: {
          where: {
            status: { not: 'cancelled' }
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true
          }
        },
        _count: {
          select: {
            orders: {
              where: {
                status: { not: 'cancelled' }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to 100 users for performance
    });

    // Get first/last order dates and total drinks for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const userOrders = await prisma.order.findMany({
        where: {
          userId: user.id,
          status: { not: 'cancelled' }
        },
        include: {
          items: {
            select: {
              quantity: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      const firstOrderDate = userOrders[0]?.createdAt || null;
      const lastOrderDate = userOrders[userOrders.length - 1]?.createdAt || null;
      const totalDrinks = userOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);

      // Calculate drinks/day (weekdays only)
      let drinksPerDay = 0;
      if (totalDrinks === 0) {
        drinksPerDay = 0;
      } else if (firstOrderDate && lastOrderDate) {
        const firstDate = new Date(firstOrderDate);
        const lastDate = new Date(lastOrderDate);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        let weekdayCount = 0;
        const currentDate = new Date(firstDate);
        while (currentDate <= lastDate) {
          const dayOfWeek = dayNames[currentDate.getDay()];
          if (dayOfWeek !== 'Saturday' && dayOfWeek !== 'Sunday') {
            weekdayCount++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // If no weekdays in range (all orders on weekends), use 1 to avoid division by 0
        weekdayCount = Math.max(1, weekdayCount);
        drinksPerDay = Math.round((totalDrinks / weekdayCount) * 10) / 10;
      } else if (totalDrinks > 0) {
        // Single order - check if it's a weekday
        const orderDate = firstOrderDate || lastOrderDate!;
        const dayOfWeek = new Date(orderDate).getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (dayNames[dayOfWeek] !== 'Saturday' && dayNames[dayOfWeek] !== 'Sunday') {
          drinksPerDay = totalDrinks;
        }
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
        totalOrders: user._count.orders,
        lastOrderDate: user.orders[0]?.createdAt || null,
        drinksPerDay
      };
    }));

    return {
      success: true,
      data: usersWithStats
    };
  } catch (error) {
    console.error("Failed to get users:", error);
    return { success: false, message: error instanceof Error ? error.message : "Database error" };
  }
}

// Get comprehensive user statistics
export async function getUserStats(userId: string, timeframe: 'today' | 'week' | 'month' | 'all') {
  try {
    await verifyAdmin();

    // Calculate date range
    let startDate: Date;
    const now = new Date();
    
    switch (timeframe) {
      case 'today':
        startDate = getPacificStartOfDay();
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
        startDate = new Date(0);
        break;
    }

    // Get user's orders
    const orders = await prisma.order.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        status: { not: 'cancelled' }
      },
      include: {
        items: {
          include: {
            product: true,
            modifiers: {
              include: {
                ingredient: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Initialize stats
    const stats = {
      totalOrders: orders.length,
      totalDrinks: 0,
      totalHot: 0,
      totalIced: 0,
      categoryCounts: {} as Record<string, number>,
      temperatureCounts: {} as Record<string, number>,
      syrupCounts: {} as Record<string, number>,
      milkCounts: {} as Record<string, number>,
      caffeineTypeCounts: {} as Record<string, number>,
      shotDistribution: {} as Record<number, number>,
      productCounts: {} as Record<string, number>,
      firstOrderDate: orders[0]?.createdAt || null,
      lastOrderDate: orders[orders.length - 1]?.createdAt || null,
      averageDrinksPerOrder: 0,
      averageDrinksPerDay: 0,
      drinksPerDayByWeekday: {} as Record<string, number>, // "Monday": 1.4, "Tuesday": 0.5, etc.
      mostOrderedProduct: { name: '', count: 0 },
      timeOfDayDistribution: {} as Record<string, number>, // "6:00", "6:30", etc.
      dayOfWeekDistribution: {} as Record<string, number>, // "Sunday", "Monday", etc.
      favoriteDay: { name: '', count: 0 }
    };

    // Track drinks by weekday for drinks/day calculation
    const drinksByWeekday: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0
    };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Process orders
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      // Get time components in Pacific Time
      const pacificTimeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'long'
      });
      const pacificParts = pacificTimeFormatter.formatToParts(orderDate);
      const orderHour = parseInt(pacificParts.find(p => p.type === 'hour')?.value || '0', 10);
      const orderMinute = parseInt(pacificParts.find(p => p.type === 'minute')?.value || '0', 10);
      const pacificDayName = pacificParts.find(p => p.type === 'weekday')?.value || 'Sunday';
      const dayOfWeek = dayNames.indexOf(pacificDayName);
      
      // Calculate time slot for this order (round up to end of 30-minute interval)
      let targetHour = orderHour;
      let targetMinute: string;
      
      if (orderMinute < 30) {
        // Round up to :30 of current hour
        targetMinute = '30';
      } else {
        // Round up to :00 of next hour
        targetHour = orderHour + 1;
        targetMinute = '00';
      }
      
      // Day of week distribution (excluding weekends)
      // Only count weekdays
      if (pacificDayName !== 'Saturday' && pacificDayName !== 'Sunday') {
        stats.dayOfWeekDistribution[pacificDayName] = (stats.dayOfWeekDistribution[pacificDayName] || 0) + 1;
      }

      // Count drinks per weekday
      const orderDrinks = order.items.reduce((sum, item) => sum + item.quantity, 0);
      if (pacificDayName !== 'Saturday' && pacificDayName !== 'Sunday') {
        drinksByWeekday[pacificDayName] = (drinksByWeekday[pacificDayName] || 0) + orderDrinks;
      }

      order.items.forEach(item => {
        const quantity = item.quantity;
        
        // Time of day distribution (6am-6pm, per half hour)
        // Count each drink in the appropriate time slot
        if (orderHour >= 6 && orderHour < 18) {
          // Only count if still within 6am-6pm range after rounding
          if (targetHour < 18) {
            const timeKey = `${targetHour.toString().padStart(2, '0')}:${targetMinute}`;
            stats.timeOfDayDistribution[timeKey] = (stats.timeOfDayDistribution[timeKey] || 0) + quantity;
          }
        }
        
        stats.totalDrinks += quantity;

        // Temperature
        const temp = (item.temperature || "").toLowerCase();
        if (temp.includes('iced')) {
          stats.totalIced += quantity;
          stats.temperatureCounts['Iced'] = (stats.temperatureCounts['Iced'] || 0) + quantity;
        } else {
          stats.totalHot += quantity;
          stats.temperatureCounts['Hot'] = (stats.temperatureCounts['Hot'] || 0) + quantity;
        }

        // Category
        const category = item.product.category;
        stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + quantity;

        // Product
        const productName = item.product.name;
        stats.productCounts[productName] = (stats.productCounts[productName] || 0) + quantity;

        // Shots
        const shots = item.shots || 0;
        if (shots > 0) {
          stats.shotDistribution[shots] = (stats.shotDistribution[shots] || 0) + quantity;
        }

        // Caffeine type
        if (item.caffeineType) {
          stats.caffeineTypeCounts[item.caffeineType] = (stats.caffeineTypeCounts[item.caffeineType] || 0) + quantity;
        }

        // Milk
        if (item.milkName && item.milkName !== "No Milk") {
          stats.milkCounts[item.milkName] = (stats.milkCounts[item.milkName] || 0) + quantity;
        }

        // Modifiers (syrups and additional milk)
        item.modifiers.forEach(mod => {
          if (mod.ingredient.category === 'syrup') {
            stats.syrupCounts[mod.ingredient.name] = (stats.syrupCounts[mod.ingredient.name] || 0) + (quantity * mod.quantity);
          } else if (mod.ingredient.category === 'milk') {
            stats.milkCounts[mod.ingredient.name] = (stats.milkCounts[mod.ingredient.name] || 0) + (quantity * mod.quantity);
          }
        });
      });
    });

    // Calculate averages
    if (stats.totalOrders > 0) {
      stats.averageDrinksPerOrder = Math.round((stats.totalDrinks / stats.totalOrders) * 10) / 10;
    }

    // Calculate drinks per day based on the selected timeframe
    let timeframeStartDate: Date;
    let timeframeEndDate: Date = now;
    
    switch (timeframe) {
      case 'today':
        timeframeStartDate = getPacificStartOfDay();
        timeframeEndDate = getPacificEndOfDay();
        break;
      case 'week':
        timeframeStartDate = new Date(now);
        timeframeStartDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        timeframeStartDate = new Date(now);
        timeframeStartDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        // For all-time, use first and last order dates
        if (stats.firstOrderDate && stats.lastOrderDate) {
          timeframeStartDate = new Date(stats.firstOrderDate);
          timeframeEndDate = new Date(stats.lastOrderDate);
        } else {
          timeframeStartDate = now;
          timeframeEndDate = now;
        }
        break;
      default:
        timeframeStartDate = now;
        timeframeEndDate = now;
    }

    // Count weekdays (Monday-Friday) in the timeframe
    const weekdayCounts: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0
    };
    
    const currentDate = new Date(timeframeStartDate);
    while (currentDate <= timeframeEndDate) {
      const dayOfWeek = dayNames[currentDate.getDay()];
      if (dayOfWeek !== 'Saturday' && dayOfWeek !== 'Sunday') {
        weekdayCounts[dayOfWeek]++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate drinks/day for each weekday
    Object.keys(weekdayCounts).forEach(day => {
      const count = weekdayCounts[day];
      if (count > 0) {
        stats.drinksPerDayByWeekday[day] = Math.round((drinksByWeekday[day] / count) * 10) / 10;
      } else {
        stats.drinksPerDayByWeekday[day] = 0;
      }
    });
    
    // Calculate overall average drinks per day
    const totalWeekdays = Object.values(weekdayCounts).reduce((a, b) => a + b, 0);
    if (totalWeekdays > 0) {
      stats.averageDrinksPerDay = Math.round((stats.totalDrinks / totalWeekdays) * 10) / 10;
    } else {
      stats.averageDrinksPerDay = 0;
    }

    // Find most ordered product
    Object.entries(stats.productCounts).forEach(([name, count]) => {
      if (count > stats.mostOrderedProduct.count) {
        stats.mostOrderedProduct = { name, count };
      }
    });

    // Find favorite day
    Object.entries(stats.dayOfWeekDistribution).forEach(([day, count]) => {
      if (count > stats.favoriteDay.count) {
        stats.favoriteDay = { name: day, count };
      }
    });

    return {
      success: true,
      data: stats,
      timeframe
    };
  } catch (error) {
    console.error("Failed to get user stats:", error);
    return { success: false, message: error instanceof Error ? error.message : "Database error" };
  }
}

// Get time of day distribution for graph (all time or filtered by day/week/month)
export async function getUserTimeDistribution(
  userId: string,
  timeFilter: 'all' | 'week' | 'month' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
) {
  try {
    await verifyAdmin();

    let startDate: Date = new Date(0); // All time by default
    const now = new Date();
    
    // If filtering by a specific day, we still need to fetch all orders (or a large range)
    // to find all instances of that day. For week/month filters, apply date range.
    const isDayFilter = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(timeFilter);
    
    if (timeFilter === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeFilter === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (isDayFilter) {
      // For day filters, fetch all orders (we'll filter by day in JavaScript)
      startDate = new Date(0);
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        status: { not: 'cancelled' }
      },
      include: {
        items: {
          select: {
            quantity: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const timeDistribution: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Initialize all time slots to 0 (6am-6pm, every 30 minutes = 24 slots)
    for (let hour = 6; hour < 18; hour++) {
      timeDistribution[`${hour.toString().padStart(2, '0')}:00`] = 0;
      timeDistribution[`${hour.toString().padStart(2, '0')}:30`] = 0;
    }

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      // Get time components in Pacific Time
      const pacificTimeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'long'
      });
      const pacificParts = pacificTimeFormatter.formatToParts(orderDate);
      const orderHour = parseInt(pacificParts.find(p => p.type === 'hour')?.value || '0', 10);
      const orderMinute = parseInt(pacificParts.find(p => p.type === 'minute')?.value || '0', 10);
      const pacificDayName = pacificParts.find(p => p.type === 'weekday')?.value || 'Sunday';
      const dayOfWeek = dayNames.indexOf(pacificDayName);

      // Filter by day of week if specified
      if (isDayFilter) {
        if (pacificDayName !== timeFilter) {
          return;
        }
      }

      // Calculate total drinks in this order
      if (!order.items || order.items.length === 0) {
        return; // Skip orders with no items
      }
      
      const totalDrinks = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      if (totalDrinks === 0) {
        return; // Skip orders with no drinks
      }

      // Time of day distribution (6am-6pm, per half hour)
      // Round up to the end of each 30-minute interval
      // 10:00-10:30 → 10:30, 10:30-11:00 → 11:00
      if (orderHour >= 6 && orderHour < 18) {
        let targetHour = orderHour;
        let targetMinute: string;
        
        if (orderMinute < 30) {
          // Round up to :30 of current hour
          targetMinute = '30';
        } else {
          // Round up to :00 of next hour
          targetHour = orderHour + 1;
          targetMinute = '00';
        }
        
        // Only count if still within 6am-6pm range
        if (targetHour < 18) {
          const timeKey = `${targetHour.toString().padStart(2, '0')}:${targetMinute}`;
          timeDistribution[timeKey] = (timeDistribution[timeKey] || 0) + totalDrinks;
        }
      }
    });

    // Ensure all time slots are present in the response (even if 0)
    const completeTimeDistribution: Record<string, number> = {};
    for (let hour = 6; hour < 18; hour++) {
      completeTimeDistribution[`${hour.toString().padStart(2, '0')}:00`] = timeDistribution[`${hour.toString().padStart(2, '0')}:00`] || 0;
      completeTimeDistribution[`${hour.toString().padStart(2, '0')}:30`] = timeDistribution[`${hour.toString().padStart(2, '0')}:30`] || 0;
    }

    return {
      success: true,
      data: completeTimeDistribution
    };
  } catch (error) {
    console.error("Failed to get user time distribution:", error);
    return { success: false, message: error instanceof Error ? error.message : "Database error" };
  }
}

// Update user email
export async function updateUserEmail(userId: string, newEmail: string) {
  try {
    await verifyAdmin();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return { success: false, message: "Invalid email format" };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (existingUser && existingUser.id !== userId) {
      return { success: false, message: "Email already in use" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail }
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error("Failed to update user email:", error);
    return { success: false, message: "Database error" };
  }
}

// Soft delete user
export async function deleteUser(userId: string) {
  try {
    await verifyAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Anonymize email to maintain uniqueness
    const anonymizedEmail = `deleted-${Date.now()}@deleted.local`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: anonymizedEmail,
        firstName: null,
        lastName: null,
        name: null,
        phone: null
      }
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, message: "Database error" };
  }
}

// Update user role
export async function updateUserRole(userId: string, newRole: 'admin' | 'customer') {
  try {
    await verifyAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, message: "Database error" };
  }
}

// Get single user details
export async function getUser(userId: string) {
  try {
    await verifyAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: { not: 'cancelled' }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
        totalOrders: user._count.orders
      }
    };
  } catch (error) {
    console.error("Failed to get user:", error);
    return { success: false, message: error instanceof Error ? error.message : "Database error" };
  }
}
