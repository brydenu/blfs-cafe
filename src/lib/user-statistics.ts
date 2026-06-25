import { prisma } from "@/lib/db";
import {
  getPacificStartOfDay,
  getPacificEndOfDay,
  getPacificStartOfDaysAgo,
  getPacificDateString,
  getPacificDateStringDaysAgo,
  getPacificDateStringForTimestamp,
  getPacificHourMinute,
  getPacificWeekday,
  countPacificWeekdaysInRange,
} from "@/lib/pacific-time";

export type UserStatsTimeframe = "today" | "week" | "month" | "all";

export interface UserComparativeStatistics {
  globalTotalDrinks: number;
  globalTotalOrders: number;
  userDrinkSharePercent: number | null;
  userOrderSharePercent: number | null;
  rankByDrinks: number | null;
  rankByOrders: number | null;
  totalOrderers: number;
  globalMostOrderedProduct: { name: string; count: number };
  matchesCafeFavorite: boolean;
  userIcedPercent: number | null;
  globalIcedPercent: number | null;
  userDrinksPerDay: number;
  globalDrinksPerDay: number | null;
  uniqueDrinksTried: number;
  globalUniqueDrinks: number;
}

export interface UserDashboardStatistics extends UserOrderStatistics {
  comparative: UserComparativeStatistics;
}

export function getTimeframePeriodPhrase(timeframe: UserStatsTimeframe): string {
  switch (timeframe) {
    case "today":
      return "today";
    case "week":
      return "this week";
    case "month":
      return "this month";
    case "all":
      return "all time";
  }
}

export function getFavoriteDrinkLabel(timeframe: UserStatsTimeframe): string {
  switch (timeframe) {
    case "today":
      return "Favorite drink today";
    case "week":
      return "Favorite drink this week";
    case "month":
      return "Favorite drink this month";
    case "all":
      return "Favorite drink all time";
  }
}

export function getTimeframeDateFilter(
  timeframe: UserStatsTimeframe
): { gte: Date; lte?: Date } {
  let startDate: Date;
  let endDate: Date | undefined;

  switch (timeframe) {
    case "today":
      startDate = getPacificStartOfDay();
      endDate = getPacificEndOfDay();
      break;
    case "week":
      startDate = getPacificStartOfDaysAgo(6);
      break;
    case "month":
      startDate = getPacificStartOfDaysAgo(29);
      break;
    case "all":
      startDate = new Date(0);
      break;
  }

  const filter: { gte: Date; lte?: Date } = { gte: startDate };
  if (endDate) {
    filter.lte = endDate;
  }
  return filter;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function getWeekdayCountsForTimeframe(
  timeframe: UserStatsTimeframe,
  firstOrderDate: Date | null,
  lastOrderDate: Date | null
): Record<string, number> {
  switch (timeframe) {
    case "today": {
      const todayWeekday = getPacificWeekday(getPacificDateString());
      const weekdayCounts = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
      if (todayWeekday in weekdayCounts) {
        weekdayCounts[todayWeekday as keyof typeof weekdayCounts] = 1;
      }
      return weekdayCounts;
    }
    case "week":
      return countPacificWeekdaysInRange(
        getPacificDateStringDaysAgo(6),
        getPacificDateString()
      );
    case "month":
      return countPacificWeekdaysInRange(
        getPacificDateStringDaysAgo(29),
        getPacificDateString()
      );
    case "all":
      if (firstOrderDate && lastOrderDate) {
        return countPacificWeekdaysInRange(
          getPacificDateStringForTimestamp(new Date(firstOrderDate)),
          getPacificDateStringForTimestamp(new Date(lastOrderDate))
        );
      }
      return { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
    default:
      return { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
  }
}

export interface UserOrderStatistics {
  totalOrders: number;
  totalDrinks: number;
  totalHot: number;
  totalIced: number;
  categoryCounts: Record<string, number>;
  temperatureCounts: Record<string, number>;
  syrupCounts: Record<string, number>;
  milkCounts: Record<string, number>;
  caffeineTypeCounts: Record<string, number>;
  shotDistribution: Record<number, number>;
  productCounts: Record<string, number>;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  averageDrinksPerOrder: number;
  averageDrinksPerDay: number;
  drinksPerDayByWeekday: Record<string, number>;
  mostOrderedProduct: { name: string; count: number };
  timeOfDayDistribution: Record<string, number>;
  dayOfWeekDistribution: Record<string, number>;
  favoriteDay: { name: string; count: number };
}

export async function computeUserStatistics(
  userId: string,
  timeframe: UserStatsTimeframe
): Promise<UserOrderStatistics> {
  const createdAtFilter = getTimeframeDateFilter(timeframe);

  const orders = await prisma.order.findMany({
    where: {
      userId,
      createdAt: createdAtFilter,
      status: { not: "cancelled" },
    },
    include: {
      items: {
        include: {
          product: true,
          modifiers: {
            include: {
              ingredient: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const stats: UserOrderStatistics = {
    totalOrders: orders.length,
    totalDrinks: 0,
    totalHot: 0,
    totalIced: 0,
    categoryCounts: {},
    temperatureCounts: {},
    syrupCounts: {},
    milkCounts: {},
    caffeineTypeCounts: {},
    shotDistribution: {},
    productCounts: {},
    firstOrderDate: orders[0]?.createdAt || null,
    lastOrderDate: orders[orders.length - 1]?.createdAt || null,
    averageDrinksPerOrder: 0,
    averageDrinksPerDay: 0,
    drinksPerDayByWeekday: {},
    mostOrderedProduct: { name: "", count: 0 },
    timeOfDayDistribution: {},
    dayOfWeekDistribution: {},
    favoriteDay: { name: "", count: 0 },
  };

  const drinksByWeekday: Record<string, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
  };

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const { hour: orderHour, minute: orderMinute } = getPacificHourMinute(orderDate);
    const pacificDayName = getPacificWeekday(getPacificDateStringForTimestamp(orderDate));

    let targetHour = orderHour;
    let targetMinute: string;

    if (orderMinute < 30) {
      targetMinute = "30";
    } else {
      targetHour = orderHour + 1;
      targetMinute = "00";
    }

    if (pacificDayName !== "Saturday" && pacificDayName !== "Sunday") {
      stats.dayOfWeekDistribution[pacificDayName] =
        (stats.dayOfWeekDistribution[pacificDayName] || 0) + 1;
    }

    const orderDrinks = order.items.reduce((sum, item) => sum + item.quantity, 0);
    if (pacificDayName !== "Saturday" && pacificDayName !== "Sunday") {
      drinksByWeekday[pacificDayName] = (drinksByWeekday[pacificDayName] || 0) + orderDrinks;
    }

    order.items.forEach((item) => {
      const quantity = item.quantity;

      if (orderHour >= 6 && orderHour < 18 && targetHour < 18) {
        const timeKey = `${targetHour.toString().padStart(2, "0")}:${targetMinute}`;
        stats.timeOfDayDistribution[timeKey] =
          (stats.timeOfDayDistribution[timeKey] || 0) + quantity;
      }

      stats.totalDrinks += quantity;

      const temp = (item.temperature || "").toLowerCase();
      if (temp.includes("iced")) {
        stats.totalIced += quantity;
        stats.temperatureCounts["Iced"] = (stats.temperatureCounts["Iced"] || 0) + quantity;
      } else {
        stats.totalHot += quantity;
        stats.temperatureCounts["Hot"] = (stats.temperatureCounts["Hot"] || 0) + quantity;
      }

      const category = item.product.category;
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + quantity;

      const productName = item.product.name;
      stats.productCounts[productName] = (stats.productCounts[productName] || 0) + quantity;

      const shots = item.shots || 0;
      if (shots > 0) {
        stats.shotDistribution[shots] = (stats.shotDistribution[shots] || 0) + quantity;
      }

      if (item.caffeineType) {
        stats.caffeineTypeCounts[item.caffeineType] =
          (stats.caffeineTypeCounts[item.caffeineType] || 0) + quantity;
      }

      if (item.milkName && item.milkName !== "No Milk") {
        stats.milkCounts[item.milkName] = (stats.milkCounts[item.milkName] || 0) + quantity;
      }

      item.modifiers.forEach((mod) => {
        if (mod.ingredient.category === "syrup") {
          stats.syrupCounts[mod.ingredient.name] =
            (stats.syrupCounts[mod.ingredient.name] || 0) + quantity * mod.quantity;
        } else if (mod.ingredient.category === "milk") {
          stats.milkCounts[mod.ingredient.name] =
            (stats.milkCounts[mod.ingredient.name] || 0) + quantity * mod.quantity;
        }
      });
    });
  });

  if (stats.totalOrders > 0) {
    stats.averageDrinksPerOrder = Math.round((stats.totalDrinks / stats.totalOrders) * 10) / 10;
  }

  const weekdayCounts = getWeekdayCountsForTimeframe(
    timeframe,
    stats.firstOrderDate,
    stats.lastOrderDate
  );

  Object.keys(weekdayCounts).forEach((day) => {
    const count = weekdayCounts[day];
    stats.drinksPerDayByWeekday[day] =
      count > 0 ? Math.round((drinksByWeekday[day] / count) * 10) / 10 : 0;
  });

  const totalWeekdays = Object.values(weekdayCounts).reduce((a, b) => a + b, 0);
  stats.averageDrinksPerDay =
    totalWeekdays > 0 ? Math.round((stats.totalDrinks / totalWeekdays) * 10) / 10 : 0;

  Object.entries(stats.productCounts).forEach(([name, count]) => {
    if (count > stats.mostOrderedProduct.count) {
      stats.mostOrderedProduct = { name, count };
    }
  });

  Object.entries(stats.dayOfWeekDistribution).forEach(([day, count]) => {
    if (count > stats.favoriteDay.count) {
      stats.favoriteDay = { name: day, count };
    }
  });

  return stats;
}

export async function computeComparativeStatistics(
  userId: string,
  timeframe: UserStatsTimeframe,
  userStats: UserOrderStatistics
): Promise<UserComparativeStatistics> {
  const createdAtFilter = getTimeframeDateFilter(timeframe);

  const globalOrders = await prisma.order.findMany({
    where: {
      createdAt: createdAtFilter,
      status: { not: "cancelled" },
    },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let globalTotalDrinks = 0;
  let globalTotalIced = 0;
  const globalProductCounts: Record<string, number> = {};
  const globalProductsOrdered = new Set<string>();
  const userProductsOrdered = new Set<string>();
  const drinksByUser: Record<string, number> = {};
  const ordersByUser: Record<string, number> = {};

  let globalFirstOrderDate: Date | null = globalOrders[0]?.createdAt || null;
  let globalLastOrderDate: Date | null =
    globalOrders[globalOrders.length - 1]?.createdAt || null;

  globalOrders.forEach((order) => {
    const orderDrinks = order.items.reduce((sum, item) => sum + item.quantity, 0);
    globalTotalDrinks += orderDrinks;

    if (order.userId) {
      drinksByUser[order.userId] = (drinksByUser[order.userId] || 0) + orderDrinks;
      ordersByUser[order.userId] = (ordersByUser[order.userId] || 0) + 1;
    }

    order.items.forEach((item) => {
      const quantity = item.quantity;
      const productName = item.product.name;

      globalProductCounts[productName] = (globalProductCounts[productName] || 0) + quantity;
      globalProductsOrdered.add(productName);

      if (order.userId === userId) {
        userProductsOrdered.add(productName);
      }

      const temp = (item.temperature || "").toLowerCase();
      if (temp.includes("iced")) {
        globalTotalIced += quantity;
      }
    });
  });

  const globalMostOrderedProduct = { name: "", count: 0 };
  Object.entries(globalProductCounts).forEach(([name, count]) => {
    if (count > globalMostOrderedProduct.count) {
      globalMostOrderedProduct.name = name;
      globalMostOrderedProduct.count = count;
    }
  });

  const sortedByDrinks = Object.entries(drinksByUser).sort((a, b) => b[1] - a[1]);
  const drinkRankIndex = sortedByDrinks.findIndex(([id]) => id === userId);
  const rankByDrinks = drinkRankIndex >= 0 ? drinkRankIndex + 1 : null;

  const sortedByOrders = Object.entries(ordersByUser).sort((a, b) => b[1] - a[1]);
  const orderRankIndex = sortedByOrders.findIndex(([id]) => id === userId);
  const rankByOrders = orderRankIndex >= 0 ? orderRankIndex + 1 : null;

  const globalWeekdayCounts = getWeekdayCountsForTimeframe(
    timeframe,
    globalFirstOrderDate,
    globalLastOrderDate
  );
  const globalWeekdays = Object.values(globalWeekdayCounts).reduce((a, b) => a + b, 0);
  const globalDrinksPerDay =
    globalWeekdays > 0 ? Math.round((globalTotalDrinks / globalWeekdays) * 10) / 10 : null;

  const userDrinkSharePercent =
    globalTotalDrinks > 0
      ? roundPercent((userStats.totalDrinks / globalTotalDrinks) * 100)
      : null;
  const userOrderSharePercent =
    globalOrders.length > 0
      ? roundPercent((userStats.totalOrders / globalOrders.length) * 100)
      : null;
  const userIcedPercent =
    userStats.totalDrinks > 0
      ? roundPercent((userStats.totalIced / userStats.totalDrinks) * 100)
      : null;
  const globalIcedPercent =
    globalTotalDrinks > 0 ? roundPercent((globalTotalIced / globalTotalDrinks) * 100) : null;

  const matchesCafeFavorite =
    !!userStats.mostOrderedProduct.name &&
    userStats.mostOrderedProduct.name === globalMostOrderedProduct.name;

  return {
    globalTotalDrinks,
    globalTotalOrders: globalOrders.length,
    userDrinkSharePercent,
    userOrderSharePercent,
    rankByDrinks,
    rankByOrders,
    totalOrderers: sortedByDrinks.length,
    globalMostOrderedProduct,
    matchesCafeFavorite,
    userIcedPercent,
    globalIcedPercent,
    userDrinksPerDay: userStats.averageDrinksPerDay,
    globalDrinksPerDay,
    uniqueDrinksTried: userProductsOrdered.size,
    globalUniqueDrinks: globalProductsOrdered.size,
  };
}

export async function computeUserDashboardStatistics(
  userId: string,
  timeframe: UserStatsTimeframe
): Promise<UserDashboardStatistics> {
  const stats = await computeUserStatistics(userId, timeframe);
  const comparative = await computeComparativeStatistics(userId, timeframe, stats);
  return { ...stats, comparative };
}
