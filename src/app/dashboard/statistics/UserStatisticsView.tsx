"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChartIcon, CoffeeIcon, StarIcon } from "@/components/icons";
import type { UserDashboardStatistics, UserStatsTimeframe } from "@/lib/user-statistics";
import {
  getFavoriteDrinkLabel,
} from "@/lib/user-statistics";
import { buildPersonalWrappedInsights } from "@/lib/personal-wrapped-insights";

interface UserStatisticsViewProps {
  stats: UserDashboardStatistics;
  currentTimeframe: UserStatsTimeframe;
  firstName: string | null;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

const WRAPPED_GRADIENTS = [
  "from-[#004876] to-[#32A5DC]",
  "from-[#003355] to-[#32A5DC]/90",
  "from-[#32A5DC] to-[#004876]",
  "from-[#004876]/90 to-[#003355]",
  "from-[#288bba] to-[#004876]",
  "from-[#003355] to-[#288bba]",
  "from-[#32A5DC]/90 to-[#003355]",
] as const;

const TIMEFRAME_OPTIONS: { value: UserStatsTimeframe; label: string; shortLabel: string }[] = [
  { value: "today", label: "Today", shortLabel: "Today" },
  { value: "week", label: "This Week", shortLabel: "Week" },
  { value: "month", label: "This Month", shortLabel: "Month" },
  { value: "all", label: "All Time", shortLabel: "All" },
];

function formatPacificDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function StatCard({
  label,
  value,
  subValue,
  accent,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  accent?: "hot" | "iced" | "accent";
}) {
  const valueColor =
    accent === "hot"
      ? "text-red-500"
      : accent === "iced"
        ? "text-[#32A5DC]"
        : accent === "accent"
          ? "text-[#004876]"
          : "text-[#004876]";

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center transition-all hover:shadow-md">
      <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-black ${valueColor}`}>{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5 truncate">{subValue}</p>}
    </div>
  );
}

function ProgressBar({
  percentage,
  colorClass = "bg-[#32A5DC]",
}: {
  percentage: number;
  colorClass?: string;
}) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.max(percentage, percentage > 0 ? 4 : 0)}%` }}
      />
    </div>
  );
}

function TimeframeSelector({
  currentTimeframe,
  getTimeframeUrl,
  variant = "page",
}: {
  currentTimeframe: UserStatsTimeframe;
  getTimeframeUrl: (timeframe: string) => string;
  variant?: "page" | "card";
}) {
  const isCard = variant === "card";

  return (
    <div
      className={
        isCard
          ? "bg-gray-50 border border-gray-100 rounded-2xl p-2 sm:p-3"
          : "bg-[#003355]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4"
      }
    >
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {TIMEFRAME_OPTIONS.map((option) => {
          const isActive = currentTimeframe === option.value;
          return (
            <Link
              key={option.value}
              href={getTimeframeUrl(option.value)}
              scroll={false}
              className={`px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-center transition-all ${
                isActive
                  ? "bg-[#32A5DC] text-white shadow-md"
                  : isCard
                    ? "text-gray-500 hover:text-[#004876] hover:bg-white"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-5 sm:p-8 border border-white/10">
      <h2 className="text-lg sm:text-xl font-black text-[#004876] mb-3 border-b border-gray-100 pb-3 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg font-black text-[#32A5DC] mb-5">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

export default function UserStatisticsView({
  stats,
  currentTimeframe,
  firstName,
}: UserStatisticsViewProps) {
  const searchParams = useSearchParams();

  const getTimeframeUrl = (timeframe: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("timeframe", timeframe);
    return `?${params.toString()}`;
  };

  const topProducts = Object.entries(stats.productCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topCategories = Object.entries(stats.categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topSyrups = Object.entries(stats.syrupCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topMilk = Object.entries(stats.milkCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalDayOrders = Object.values(stats.dayOfWeekDistribution).reduce((a, b) => a + b, 0);
  const maxDayDrinks = Math.max(...WEEKDAYS.map((d) => stats.drinksPerDayByWeekday[d] || 0), 1);

  const hasOrders = stats.totalOrders > 0;
  const { comparative } = stats;
  const personalInsights = buildPersonalWrappedInsights(stats, comparative);

  const funInsights: ReactNode[] = [];

  // Ranking — always shown when the user has ordered drinks
  if (comparative.rankByDrinks !== null && stats.totalDrinks > 0) {
    const peopleContext =
      comparative.totalOrderers > 1
        ? ` out of ${comparative.totalOrderers} people`
        : "";
    const rankMessage =
      comparative.rankByDrinks === 1
        ? `You're the #1 drink orderer${peopleContext}!`
        : `You're ranked #${comparative.rankByDrinks} for drinks ordered${peopleContext}.`;

    funInsights.push(
      <div key="drink-rank" className="flex items-start gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#32A5DC] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white font-black text-xl sm:text-2xl">
            #{comparative.rankByDrinks}
          </span>
        </div>
        <div className="min-w-0 pt-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Drink Orderer Rank
          </p>
          <p className="text-base sm:text-lg font-black text-[#004876] leading-snug">
            {rankMessage}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.totalDrinks} drinks ordered by you
          </p>
        </div>
      </div>
    );
  }

  if (
    comparative.rankByOrders !== null &&
    stats.totalOrders > 0 &&
    comparative.rankByOrders !== comparative.rankByDrinks
  ) {
    const peopleContext =
      comparative.totalOrderers > 1
        ? ` out of ${comparative.totalOrderers} people`
        : "";
    const orderRankMessage =
      comparative.rankByOrders === 1
        ? `You're #1 by order frequency${peopleContext}!`
        : `You're ranked #${comparative.rankByOrders} by order frequency${peopleContext}.`;

    funInsights.push(
      <div key="order-rank" className="flex items-start gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#004876] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white font-black text-xl sm:text-2xl">
            #{comparative.rankByOrders}
          </span>
        </div>
        <div className="min-w-0 pt-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Order Frequency Rank
          </p>
          <p className="text-base sm:text-lg font-black text-[#004876] leading-snug">
            {orderRankMessage}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.totalOrders} separate orders placed
          </p>
        </div>
      </div>
    );
  }

  if (comparative.globalTotalDrinks > 0 && comparative.userDrinkSharePercent !== null) {
    funInsights.push(
      <div key="drink-share">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          Individual Drinks
        </p>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          You ordered{" "}
          <span className="font-black text-[#32A5DC]">{stats.totalDrinks}</span> of{" "}
          <span className="font-black text-[#004876]">{comparative.globalTotalDrinks}</span> total
          drinks served — that&apos;s{" "}
          <span className="font-black text-[#32A5DC]">{comparative.userDrinkSharePercent}%</span>.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Counts each drink in an order separately (e.g. 2 lattes in one order = 2 drinks).
        </p>
      </div>
    );
  }

  if (comparative.globalTotalOrders > 0 && comparative.userOrderSharePercent !== null) {
    funInsights.push(
      <div key="order-share">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          Order Checkouts
        </p>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          You placed{" "}
          <span className="font-black text-[#32A5DC]">{stats.totalOrders}</span> of{" "}
          <span className="font-black text-[#004876]">{comparative.globalTotalOrders}</span> total
          orders — that&apos;s{" "}
          <span className="font-black text-[#32A5DC]">{comparative.userOrderSharePercent}%</span>.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Counts each trip to order separately, regardless of how many drinks were in it.
        </p>
      </div>
    );
  }

  if (stats.mostOrderedProduct.name && comparative.globalMostOrderedProduct.name) {
    funInsights.push(
      <p key="cafe-favorite" className="text-sm sm:text-base text-gray-600 leading-relaxed">
        {comparative.matchesCafeFavorite ? (
          <>
            Your go-to drink matches the cafe favorite —{" "}
            <span className="font-black text-[#32A5DC]">{stats.mostOrderedProduct.name}</span>!
          </>
        ) : (
          <>
            Your favorite is{" "}
            <span className="font-black text-[#004876]">{stats.mostOrderedProduct.name}</span>,
            while the cafe favorite is{" "}
            <span className="font-black text-[#32A5DC]">
              {comparative.globalMostOrderedProduct.name}
            </span>
            .
          </>
        )}
      </p>
    );
  }

  if (
    comparative.userIcedPercent !== null &&
    comparative.globalIcedPercent !== null &&
    stats.totalDrinks > 0
  ) {
    funInsights.push(
      <p key="iced" className="text-sm sm:text-base text-gray-600 leading-relaxed">
        You go iced{" "}
        <span className="font-black text-[#32A5DC]">{comparative.userIcedPercent}%</span> of the
        time — the cafe average is{" "}
        <span className="font-black text-[#004876]">{comparative.globalIcedPercent}%</span>.
      </p>
    );
  }

  if (
    comparative.globalDrinksPerDay !== null &&
    stats.totalDrinks > 0 &&
    comparative.globalTotalDrinks > 0
  ) {
    funInsights.push(
      <p key="drinks-per-day" className="text-sm sm:text-base text-gray-600 leading-relaxed">
        You average{" "}
        <span className="font-black text-[#32A5DC]">{comparative.userDrinksPerDay}</span> drinks per
        weekday vs the cafe average of{" "}
        <span className="font-black text-[#004876]">{comparative.globalDrinksPerDay}</span>.
      </p>
    );
  }

  if (comparative.uniqueDrinksTried > 0 && comparative.globalUniqueDrinks > 0) {
    funInsights.push(
      <p key="variety" className="text-sm sm:text-base text-gray-600 leading-relaxed">
        You&apos;ve tried{" "}
        <span className="font-black text-[#32A5DC]">{comparative.uniqueDrinksTried}</span> different
        drinks — the cafe has served{" "}
        <span className="font-black text-[#004876]">{comparative.globalUniqueDrinks}</span> unique
        drinks.
      </p>
    );
  }

  if (stats.averageDrinksPerOrder > 0 && comparative.globalTotalOrders > 0) {
    const globalAvg =
      Math.round((comparative.globalTotalDrinks / comparative.globalTotalOrders) * 10) / 10;
    if (globalAvg > 0) {
      funInsights.push(
        <p key="order-size" className="text-sm sm:text-base text-gray-600 leading-relaxed">
          You order{" "}
          <span className="font-black text-[#32A5DC]">{stats.averageDrinksPerOrder}</span> drinks
          per order on average — the cafe average is{" "}
          <span className="font-black text-[#004876]">{globalAvg}</span>.
        </p>
      );
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center p-4 sm:p-6">
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl space-y-5 sm:space-y-6 pt-4 sm:pt-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
              My Statistics
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              {firstName ? `${firstName}'s` : "Your"} ordering insights
            </p>
          </div>
          <Link href="/dashboard" className="flex-shrink-0">
            <button className="w-full sm:w-auto bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
              <span>←</span> Back
            </button>
          </Link>
        </div>

        {/* Timeframe selector */}
        <TimeframeSelector
          currentTimeframe={currentTimeframe}
          getTimeframeUrl={getTimeframeUrl}
          variant="page"
        />

        {!hasOrders ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/10 text-center">
            <div className="flex justify-center mb-4">
              <ChartIcon size={48} className="text-[#32A5DC]" />
            </div>
            <h2 className="text-xl font-black text-[#004876] mb-2">No orders yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Place your first order to start tracking your drink preferences and ordering patterns.
            </p>
            <Link href="/menu">
              <button className="bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]">
                Order Now
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Overview */}
            <SectionCard title="Overview" icon={<ChartIcon size={20} className="text-[#32A5DC]" />}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Total Drinks" value={stats.totalDrinks} accent="accent" />
                <StatCard label="Total Orders" value={stats.totalOrders} />
                <StatCard label="Drinks / Order" value={stats.averageDrinksPerOrder} />
                <StatCard label="Drinks / Day" value={stats.averageDrinksPerDay} />
                <StatCard label="Hot" value={stats.totalHot} accent="hot" />
                <StatCard label="Iced" value={stats.totalIced} accent="iced" />
              </div>

              {stats.mostOrderedProduct.name && (
                <div className="mt-5 p-4 bg-[#32A5DC]/10 border border-[#32A5DC]/20 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#32A5DC]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CoffeeIcon size={24} className="text-[#004876]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {getFavoriteDrinkLabel(currentTimeframe)}
                    </p>
                    <p className="text-lg font-black text-[#004876] truncate">
                      {stats.mostOrderedProduct.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Ordered {stats.mostOrderedProduct.count}{" "}
                      {stats.mostOrderedProduct.count === 1 ? "time" : "times"}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Day of week */}
            {totalDayOrders > 0 && (
              <SectionCard
                title="Ordering by Day of Week"
                icon={<StarIcon size={18} className="text-yellow-500" />}
              >
                {stats.favoriteDay.name && (
                  <p className="text-sm text-gray-500 mb-4">
                    Your favorite day to order is{" "}
                    <span className="font-bold text-[#32A5DC]">{stats.favoriteDay.name}</span> with{" "}
                    {stats.favoriteDay.count} {stats.favoriteDay.count === 1 ? "order" : "orders"}.
                  </p>
                )}

                <div className="space-y-4">
                  {WEEKDAYS.map((day) => {
                    const orderCount = stats.dayOfWeekDistribution[day] || 0;
                    const orderPct =
                      totalDayOrders > 0 ? Math.round((orderCount / totalDayOrders) * 100) : 0;
                    const drinksPerDay = stats.drinksPerDayByWeekday[day] || 0;
                    const drinksPct = Math.round((drinksPerDay / maxDayDrinks) * 100);
                    const isFavorite = stats.favoriteDay.name === day;

                    return (
                      <div key={day}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`font-bold text-sm sm:text-base truncate ${
                                isFavorite ? "text-[#32A5DC]" : "text-[#004876]"
                              }`}
                            >
                              {day}
                            </span>
                            {isFavorite && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                <StarIcon size={10} className="text-yellow-500" />
                                Favorite
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs sm:text-sm flex-shrink-0">
                            <span className="text-gray-400">
                              {drinksPerDay} drinks/day
                            </span>
                            <span className="font-bold text-gray-600">
                              {orderCount} orders ({orderPct}%)
                            </span>
                          </div>
                        </div>
                        <ProgressBar
                          percentage={drinksPct}
                          colorClass={isFavorite ? "bg-[#32A5DC]" : "bg-[#004876]/40"}
                        />
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Top products */}
            {topProducts.length > 0 && (
              <SectionCard title="Top Drinks">
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 sm:w-8 sm:h-8 bg-[#32A5DC]/15 text-[#32A5DC] rounded-lg flex items-center justify-center text-xs sm:text-sm font-black flex-shrink-0">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-[#004876] text-sm sm:text-base truncate">
                          {product.name}
                        </span>
                      </div>
                      <span className="font-black text-[#004876] text-sm sm:text-base flex-shrink-0 ml-2">
                        {product.count}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Temperature */}
            {Object.keys(stats.temperatureCounts).length > 0 && (
              <SectionCard title="Temperature Preference">
                <div className="space-y-3">
                  {Object.entries(stats.temperatureCounts).map(([temp, count]) => {
                    const pct =
                      stats.totalDrinks > 0
                        ? Math.round((count / stats.totalDrinks) * 100)
                        : 0;
                    return (
                      <div key={temp}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#004876]">{temp}</span>
                          <span className="text-sm font-bold text-gray-500">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <ProgressBar
                          percentage={pct}
                          colorClass={temp === "Hot" ? "bg-red-400" : "bg-[#32A5DC]"}
                        />
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Categories */}
            {topCategories.length > 0 && (
              <SectionCard title="Drink Categories">
                <div className="space-y-3">
                  {topCategories.map((category) => {
                    const pct =
                      stats.totalDrinks > 0
                        ? Math.round((category.count / stats.totalDrinks) * 100)
                        : 0;
                    return (
                      <div key={category.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#004876] capitalize">{category.name}</span>
                          <span className="text-sm font-bold text-gray-500">
                            {category.count} ({pct}%)
                          </span>
                        </div>
                        <ProgressBar percentage={pct} />
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Syrups & milk */}
            {(topSyrups.length > 0 || topMilk.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {topSyrups.length > 0 && (
                  <SectionCard title="Top Syrups">
                    <div className="space-y-2">
                      {topSyrups.map((syrup) => (
                        <div
                          key={syrup.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-bold text-[#004876] truncate mr-2">
                            {syrup.name}
                          </span>
                          <span className="font-black text-gray-500 flex-shrink-0">
                            {syrup.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
                {topMilk.length > 0 && (
                  <SectionCard title="Milk Preferences">
                    <div className="space-y-2">
                      {topMilk.map((milk) => (
                        <div key={milk.name} className="flex items-center justify-between text-sm">
                          <span className="font-bold text-[#004876] truncate mr-2">{milk.name}</span>
                          <span className="font-black text-gray-500 flex-shrink-0">{milk.count}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {/* Caffeine & shots */}
            {(Object.keys(stats.caffeineTypeCounts).length > 0 ||
              Object.keys(stats.shotDistribution).length > 0) && (
              <SectionCard title="Customization Preferences">
                {Object.keys(stats.caffeineTypeCounts).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Caffeine
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.caffeineTypeCounts).map(([type, count]) => (
                        <span
                          key={type}
                          className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-sm font-bold text-[#004876]"
                        >
                          {type}{" "}
                          <span className="text-gray-400 font-black ml-1">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(stats.shotDistribution).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Espresso Shots
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.shotDistribution)
                        .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
                        .map(([shots, count]) => (
                          <span
                            key={shots}
                            className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-sm font-bold text-[#004876]"
                          >
                            {shots} {shots === "1" ? "Shot" : "Shots"}{" "}
                            <span className="text-gray-400 font-black ml-1">{count}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Order history dates */}
            {(stats.firstOrderDate || stats.lastOrderDate) && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.firstOrderDate && (
                  <div>
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                      First Order
                    </p>
                    <p className="text-white font-bold">{formatPacificDate(stats.firstOrderDate)}</p>
                  </div>
                )}
                {stats.lastOrderDate && (
                  <div>
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                      Latest Order
                    </p>
                    <p className="text-white font-bold">{formatPacificDate(stats.lastOrderDate)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Cafe comparison fun facts — bottom of page */}
            {funInsights.length > 0 && (
              <SectionCard title="How You Compare">
                <div className="mb-5">
                  <TimeframeSelector
                    currentTimeframe={currentTimeframe}
                    getTimeframeUrl={getTimeframeUrl}
                    variant="card"
                  />
                </div>
                <div className="space-y-4">
                  {funInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-[#32A5DC]/5 to-transparent border border-[#32A5DC]/10 rounded-2xl transition-all hover:border-[#32A5DC]/25"
                    >
                      {insight}
                    </div>
                  ))}
                </div>

                {personalInsights.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-base sm:text-lg font-black text-[#004876] mb-1">
                      Your Sip Story
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Personalized highlights based on your ordering style
                    </p>
                    <div className="space-y-3">
                      {personalInsights.map((insight, index) => (
                        <div
                          key={insight.id}
                          className={`p-5 rounded-2xl bg-gradient-to-br ${WRAPPED_GRADIENTS[index % WRAPPED_GRADIENTS.length]} text-white shadow-lg transition-all hover:scale-[1.01]`}
                        >
                          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
                            {insight.title}
                          </p>
                          <p className="text-sm sm:text-base font-bold leading-relaxed">
                            {insight.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
