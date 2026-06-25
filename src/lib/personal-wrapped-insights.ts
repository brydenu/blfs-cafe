import type { UserComparativeStatistics, UserOrderStatistics } from "@/lib/user-statistics";

export interface PersonalWrappedInsight {
  id: string;
  title: string;
  body: string;
  priority: number;
}

interface InsightCandidate extends PersonalWrappedInsight {
  applies: boolean;
}

const MAX_INSIGHTS = 7;

function formatTimeSlot(slot: string): string {
  const [hourStr, minuteStr] = slot.split(":");
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function getPeakTimeSlot(
  timeOfDayDistribution: Record<string, number>
): { slot: string; count: number; periodLabel: string } | null {
  const entries = Object.entries(timeOfDayDistribution).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  const [slot, count] = entries.sort((a, b) => b[1] - a[1])[0];
  const hour = parseInt(slot.split(":")[0], 10);

  let periodLabel = "late afternoon";
  if (hour < 9) periodLabel = "early morning";
  else if (hour < 11) periodLabel = "mid-morning";
  else if (hour < 14) periodLabel = "lunchtime";
  else if (hour < 16) periodLabel = "afternoon";

  return { slot, count, periodLabel };
}

function topProductShare(stats: UserOrderStatistics): number {
  if (stats.totalDrinks === 0 || !stats.mostOrderedProduct.count) return 0;
  return (stats.mostOrderedProduct.count / stats.totalDrinks) * 100;
}

function topCategoryShare(stats: UserOrderStatistics): { name: string; percent: number } | null {
  if (stats.totalDrinks === 0) return null;
  const top = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return { name: top[0], percent: (top[1] / stats.totalDrinks) * 100 };
}

function hotPercent(stats: UserOrderStatistics): number {
  if (stats.totalDrinks === 0) return 0;
  return (stats.totalHot / stats.totalDrinks) * 100;
}

function decafPercent(stats: UserOrderStatistics): number {
  if (stats.totalDrinks === 0) return 0;
  const decaf =
    (stats.caffeineTypeCounts["Decaf"] || 0) +
    (stats.caffeineTypeCounts["Half-Caff"] || 0);
  return (decaf / stats.totalDrinks) * 100;
}

function multiShotPercent(stats: UserOrderStatistics): number {
  const espressoDrinks = Object.values(stats.shotDistribution).reduce((a, b) => a + b, 0);
  if (espressoDrinks === 0) return 0;
  const multi = Object.entries(stats.shotDistribution)
    .filter(([shots]) => parseInt(shots, 10) >= 2)
    .reduce((sum, [, count]) => sum + count, 0);
  return (multi / espressoDrinks) * 100;
}

function totalSyrupUses(stats: UserOrderStatistics): number {
  return Object.values(stats.syrupCounts).reduce((a, b) => a + b, 0);
}

function favoriteDayShare(stats: UserOrderStatistics): number {
  const total = Object.values(stats.dayOfWeekDistribution).reduce((a, b) => a + b, 0);
  if (total === 0 || !stats.favoriteDay.count) return 0;
  return (stats.favoriteDay.count / total) * 100;
}

export function buildPersonalWrappedInsights(
  stats: UserOrderStatistics,
  comparative: UserComparativeStatistics
): PersonalWrappedInsight[] {
  const peakTime = getPeakTimeSlot(stats.timeOfDayDistribution);
  const productShare = topProductShare(stats);
  const categoryShare = topCategoryShare(stats);
  const hotPct = hotPercent(stats);
  const icedPct = stats.totalDrinks > 0 ? (stats.totalIced / stats.totalDrinks) * 100 : 0;
  const decafPct = decafPercent(stats);
  const multiShotPct = multiShotPercent(stats);
  const syrupUses = totalSyrupUses(stats);
  const dayShare = favoriteDayShare(stats);
  const globalAvgPerOrder =
    comparative.globalTotalOrders > 0
      ? comparative.globalTotalDrinks / comparative.globalTotalOrders
      : 0;
  const syrupTypes = Object.keys(stats.syrupCounts).length;
  const milkTypes = Object.keys(stats.milkCounts).length;

  const candidates: InsightCandidate[] = [
    {
      id: "creature-of-habit",
      title: "Creature of Habit",
      body: `${Math.round(productShare)}% of your drinks were ${stats.mostOrderedProduct.name}. When you find what works, you stick with it.`,
      priority: 92,
      applies: productShare >= 50 && stats.totalDrinks >= 3,
    },
    {
      id: "menu-explorer",
      title: "Menu Explorer",
      body: `You've sampled ${comparative.uniqueDrinksTried} different drinks — you're not afraid to branch out and try something new.`,
      priority: 88,
      applies:
        comparative.uniqueDrinksTried >= 4 ||
        (comparative.globalUniqueDrinks > 0 &&
          comparative.uniqueDrinksTried / comparative.globalUniqueDrinks >= 0.5),
    },
    {
      id: "tried-it-all",
      title: "Full Menu Club",
      body: `You've ordered every drink the cafe has served. Consider yourself an honorary barista.`,
      priority: 96,
      applies:
        comparative.globalUniqueDrinks >= 3 &&
        comparative.uniqueDrinksTried >= comparative.globalUniqueDrinks,
    },
    {
      id: "hidden-gem",
      title: "Hidden Gem",
      body: `Your go-to ${stats.mostOrderedProduct.name} isn't the crowd favorite — you've got your own taste.`,
      priority: 84,
      applies:
        !comparative.matchesCafeFavorite &&
        stats.mostOrderedProduct.count >= 2 &&
        !!stats.mostOrderedProduct.name,
    },
    {
      id: "early-bird",
      title: "Early Bird",
      body: peakTime
        ? `Your peak ordering window is ${formatTimeSlot(peakTime.slot)} — you're fueling up in the ${peakTime.periodLabel}.`
        : "You tend to order earlier than most — the morning crew knows your name.",
      priority: 78,
      applies: peakTime !== null && parseInt(peakTime.slot.split(":")[0], 10) < 9,
    },
    {
      id: "lunchtime-regular",
      title: "Lunchtime Regular",
      body: peakTime
        ? `${formatTimeSlot(peakTime.slot)} is your power hour — right when the midday rush hits.`
        : "You show up around lunchtime more than any other window.",
      priority: 76,
      applies:
        peakTime !== null &&
        parseInt(peakTime.slot.split(":")[0], 10) >= 11 &&
        parseInt(peakTime.slot.split(":")[0], 10) < 14,
    },
    {
      id: "afternoon-anchorer",
      title: "Afternoon Anchor",
      body: peakTime
        ? `You come alive in the ${peakTime.periodLabel}, with ${peakTime.count} drinks around ${formatTimeSlot(peakTime.slot)}.`
        : "Afternoons are your sweet spot for grabbing a drink.",
      priority: 74,
      applies:
        peakTime !== null && parseInt(peakTime.slot.split(":")[0], 10) >= 14,
    },
    {
      id: "iced-devotee",
      title: "Iced Devotee",
      body: `${Math.round(icedPct)}% of your drinks were iced. Rain or shine, you keep it cold.`,
      priority: 72,
      applies: icedPct >= 75 && stats.totalDrinks >= 2,
    },
    {
      id: "heat-seeker",
      title: "Heat Seeker",
      body: `${Math.round(hotPct)}% of your drinks were hot. You like your cup warm and your pace steady.`,
      priority: 72,
      applies: hotPct >= 75 && stats.totalDrinks >= 2,
    },
    {
      id: "temperature-rebel",
      title: "Temperature Rebel",
      body:
        icedPct > hotPct
          ? `You lean iced (${Math.round(icedPct)}%) while most of the cafe goes hot — you march to your own beat.`
          : `You lean hot (${Math.round(hotPct)}%) while most of the cafe goes iced — a warm cup loyalist.`,
      priority: 70,
      applies:
        comparative.globalIcedPercent !== null &&
        Math.abs(icedPct - comparative.globalIcedPercent) >= 30 &&
        stats.totalDrinks >= 3,
    },
    {
      id: "round-for-the-team",
      title: "Round for the Team",
      body: `You average ${stats.averageDrinksPerOrder} drinks per order — often grabbing more than one at a time.`,
      priority: 80,
      applies: stats.averageDrinksPerOrder >= 2 && stats.totalOrders >= 2,
    },
    {
      id: "one-perfect-cup",
      title: "One Perfect Cup",
      body: "You usually order one drink at a time — one order, one mission, one perfect sip.",
      priority: 66,
      applies: stats.averageDrinksPerOrder <= 1.05 && stats.totalOrders >= 3,
    },
    {
      id: "extra-shot-energy",
      title: "Extra Shot Energy",
      body: `${Math.round(multiShotPct)}% of your espresso drinks go extra — you don't do half measures.`,
      priority: 68,
      applies: multiShotPct >= 40 && stats.totalDrinks >= 2,
    },
    {
      id: "syrup-sommelier",
      title: "Syrup Sommelier",
      body: `You've explored ${syrupTypes} different syrups — customization is part of the experience for you.`,
      priority: 65,
      applies: syrupTypes >= 3,
    },
    {
      id: "milk-maven",
      title: "Milk Maven",
      body: `${milkTypes} milk types on your record — you know exactly how you like it.`,
      priority: 64,
      applies: milkTypes >= 3,
    },
    {
      id: "calm-caffeine",
      title: "Calm Caffeine",
      body: `${Math.round(decafPct)}% of your drinks were decaf or half-caff — energy on your own terms.`,
      priority: 63,
      applies: decafPct >= 40 && stats.totalDrinks >= 2,
    },
    {
      id: "weekday-ritual",
      title: "Weekday Ritual",
      body: `${Math.round(dayShare)}% of your orders land on ${stats.favoriteDay.name}s — it's practically part of your routine.`,
      priority: 62,
      applies: dayShare >= 40 && stats.favoriteDay.name !== "",
    },
    {
      id: "cafe-regular",
      title: "Cafe Regular",
      body:
        comparative.rankByDrinks === 1
          ? "You're at the top of the leaderboard — the baristas definitely know your order."
          : `You're a top-${comparative.rankByDrinks} drink orderer — a familiar face around here.`,
      priority: 90,
      applies:
        comparative.rankByDrinks !== null &&
        comparative.rankByDrinks <= 3 &&
        comparative.totalOrderers >= 3,
    },
    {
      id: "category-captain",
      title: "Category Captain",
      body: categoryShare
        ? `${Math.round(categoryShare.percent)}% of your drinks were ${categoryShare.name} — that's your lane.`
        : "You've got a clear favorite drink category.",
      priority: 60,
      applies: categoryShare !== null && categoryShare.percent >= 65 && stats.totalDrinks >= 3,
    },
    {
      id: "flavor-architect",
      title: "Flavor Architect",
      body: "You build your drinks with syrups and add-ins — every order is a little bit custom.",
      priority: 61,
      applies: syrupUses >= stats.totalDrinks * 0.4 && stats.totalDrinks >= 2,
    },
    {
      id: "above-average-pace",
      title: "Above the Fold",
      body: `You average ${comparative.userDrinksPerDay} drinks per weekday — outpacing the cafe average of ${comparative.globalDrinksPerDay}.`,
      priority: 58,
      applies:
        comparative.globalDrinksPerDay !== null &&
        comparative.userDrinksPerDay > comparative.globalDrinksPerDay &&
        stats.totalDrinks >= 3,
    },
    {
      id: "big-order-energy",
      title: "Bigger Than Average",
      body: `Your ${stats.averageDrinksPerOrder} drinks per order beats the cafe's ${Math.round(globalAvgPerOrder * 10) / 10} — you don't travel light.`,
      priority: 57,
      applies:
        globalAvgPerOrder > 0 &&
        stats.averageDrinksPerOrder > globalAvgPerOrder + 0.3 &&
        stats.totalOrders >= 2,
    },
    // Fallbacks — broader conditions so everyone gets a few
    {
      id: "signature-sip",
      title: "Signature Sip",
      body: stats.mostOrderedProduct.name
        ? `${stats.mostOrderedProduct.name} is your most-ordered drink — your personal classic.`
        : "You've started building a drink identity.",
      priority: 48,
      applies: !!stats.mostOrderedProduct.name && stats.totalDrinks >= 1,
    },
    {
      id: "your-vibe",
      title: icedPct >= hotPct ? "Iced Energy" : "Warm Vibes",
      body:
        icedPct >= hotPct
          ? `About ${Math.round(icedPct)}% of your drinks were iced — cool cups, cool customer.`
          : `About ${Math.round(hotPct)}% of your drinks were hot — comfort in a cup.`,
      priority: 46,
      applies: stats.totalDrinks >= 1,
    },
    {
      id: "day-rhythm",
      title: "Your Day, Your Drink",
      body: stats.favoriteDay.name
        ? `${stats.favoriteDay.name} is when you order most — that's your cafe day.`
        : "You're building a weekly ordering rhythm.",
      priority: 44,
      applies: !!stats.favoriteDay.name && stats.favoriteDay.count >= 1,
    },
    {
      id: "curious-palate",
      title: "Curious Palate",
      body: `You've tried ${comparative.uniqueDrinksTried} different drinks so far — the menu is your playground.`,
      priority: 42,
      applies: comparative.uniqueDrinksTried >= 2,
    },
    {
      id: "showing-up",
      title: "Showing Up",
      body: `${stats.totalOrders} orders and counting — you're officially part of the cafe crew.`,
      priority: 40,
      applies: stats.totalOrders >= 2,
    },
    {
      id: "on-the-board",
      title: "On the Board",
      body: `You've logged ${stats.totalDrinks} drink${stats.totalDrinks === 1 ? "" : "s"} — your stats are officially live.`,
      priority: 38,
      applies: stats.totalDrinks >= 1,
    },
    {
      id: "first-chapter",
      title: "First Chapter",
      body: "Your stats story is just getting started — every order adds a new page.",
      priority: 35,
      applies: stats.totalOrders === 1,
    },
  ];

  const qualifying = candidates
    .filter((candidate) => candidate.applies)
    .sort((a, b) => b.priority - a.priority);

  return qualifying.slice(0, MAX_INSIGHTS).map(({ id, title, body, priority }) => ({
    id,
    title,
    body,
    priority,
  }));
}
