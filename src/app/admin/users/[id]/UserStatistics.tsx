'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface UserStatisticsProps {
  userId: string;
  stats: {
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
  };
  currentTimeframe: 'today' | 'week' | 'month' | 'all';
  timeDistribution: Record<string, number>;
  currentTimeFilter: 'all' | 'week' | 'month' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
}

export default function UserStatistics({ userId, stats, currentTimeframe }: UserStatisticsProps) {
  const searchParams = useSearchParams();

  const getTimeframeUrl = (timeframe: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('timeframe', timeframe);
    return `?${params.toString()}`;
  };

  // Sort and prepare data for display
  const topProducts = Object.entries(stats.productCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topSyrups = Object.entries(stats.syrupCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topMilk = Object.entries(stats.milkCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topCategories = Object.entries(stats.categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalSyrups = Object.values(stats.syrupCounts).reduce((a, b) => a + b, 0);
  const totalMilk = Object.values(stats.milkCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white">Statistics</h2>
          <div className="flex gap-2 bg-gray-900 p-1 rounded-xl border border-gray-700">
            <Link
              href={getTimeframeUrl('today')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                currentTimeframe === 'today'
                  ? 'bg-[#32A5DC] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Today
            </Link>
            <Link
              href={getTimeframeUrl('week')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                currentTimeframe === 'week'
                  ? 'bg-[#32A5DC] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Week
            </Link>
            <Link
              href={getTimeframeUrl('month')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                currentTimeframe === 'month'
                  ? 'bg-[#32A5DC] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Month
            </Link>
            <Link
              href={getTimeframeUrl('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                currentTimeframe === 'all'
                  ? 'bg-[#32A5DC] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              All Time
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Orders</p>
            <p className="text-2xl font-black text-white">{stats.totalOrders}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Drinks</p>
            <p className="text-2xl font-black text-white">{stats.totalDrinks}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hot</p>
            <p className="text-2xl font-black text-red-400">{stats.totalHot}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Iced</p>
            <p className="text-2xl font-black text-blue-400">{stats.totalIced}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Drinks/Order</p>
            <p className="text-2xl font-black text-white">{stats.averageDrinksPerOrder}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Drinks/Day</p>
            <p className="text-2xl font-black text-white">{stats.averageDrinksPerDay}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Top Product</p>
            <p className="text-sm font-black text-white truncate" title={stats.mostOrderedProduct.name}>
              {stats.mostOrderedProduct.name || 'N/A'}
            </p>
            <p className="text-xs text-gray-400">{stats.mostOrderedProduct.count}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {topCategories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Category Breakdown</h3>
            <div className="space-y-2">
              {topCategories.map((category) => {
                const percentage = stats.totalDrinks > 0
                  ? Math.round((category.count / stats.totalDrinks) * 100)
                  : 0;
                return (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold capitalize">{category.name}</span>
                      <span className="text-gray-300 font-black">{category.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-2">
                      <div
                        className="bg-[#32A5DC] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Temperature Breakdown */}
        {Object.keys(stats.temperatureCounts).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Temperature Preference</h3>
            <div className="space-y-2">
              {Object.entries(stats.temperatureCounts).map(([temp, count]) => {
                const percentage = stats.totalDrinks > 0
                  ? Math.round((count / stats.totalDrinks) * 100)
                  : 0;
                return (
                  <div key={temp}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">{temp}</span>
                      <span className="text-gray-300 font-black">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          temp === 'Hot' ? 'bg-red-400' : 'bg-blue-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Top Products</h3>
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#32A5DC]/20 text-[#32A5DC] rounded-lg flex items-center justify-center text-sm font-black">
                      #{index + 1}
                    </span>
                    <span className="text-white font-bold">{product.name}</span>
                  </div>
                  <span className="text-gray-300 font-black text-lg">{product.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Syrups */}
        {topSyrups.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Top Syrups</h3>
            <div className="space-y-2">
              {topSyrups.map((syrup) => {
                const percentage = totalSyrups > 0
                  ? Math.round((syrup.count / totalSyrups) * 100)
                  : 0;
                return (
                  <div key={syrup.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">{syrup.name}</span>
                      <span className="text-gray-300 font-black">{syrup.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-2">
                      <div
                        className="bg-[#32A5DC] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Milk Preferences */}
        {topMilk.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Milk Preferences</h3>
            <div className="space-y-2">
              {topMilk.map((milk) => {
                const percentage = totalMilk > 0
                  ? Math.round((milk.count / totalMilk) * 100)
                  : 0;
                return (
                  <div key={milk.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">{milk.name}</span>
                      <span className="text-gray-300 font-black">{milk.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-2">
                      <div
                        className="bg-[#32A5DC] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Caffeine Type */}
        {Object.keys(stats.caffeineTypeCounts).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Caffeine Preferences</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.caffeineTypeCounts).map(([type, count]) => (
                <div
                  key={type}
                  className="bg-gray-900 px-4 py-2 rounded-xl border border-gray-700"
                >
                  <span className="text-white font-bold">{type}</span>
                  <span className="text-gray-400 ml-2 font-black">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shot Distribution */}
        {Object.keys(stats.shotDistribution).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Shot Preferences</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.shotDistribution)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([shots, count]) => (
                  <div
                    key={shots}
                    className="bg-gray-900 px-4 py-2 rounded-xl border border-gray-700"
                  >
                    <span className="text-white font-bold">{shots} {shots === '1' ? 'Shot' : 'Shots'}</span>
                    <span className="text-gray-400 ml-2 font-black">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}


        {/* Day of Week Distribution */}
        {Object.keys(stats.dayOfWeekDistribution).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-white mb-3">Orders by Day of Week</h3>
            <div className="space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                const count = stats.dayOfWeekDistribution[day] || 0;
                const totalDays = Object.values(stats.dayOfWeekDistribution).reduce((a, b) => a + b, 0);
                const percentage = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
                const isFavorite = stats.favoriteDay.name === day;
                const drinksPerDay = stats.drinksPerDayByWeekday[day] || 0;
                
                return (
                  <div key={day}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-white font-bold ${isFavorite ? 'text-[#32A5DC]' : ''}`}>
                          {day}
                          {isFavorite && <span className="ml-2 text-xs">⭐ Favorite</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm">{drinksPerDay} drinks/day</span>
                        <span className="text-gray-300 font-black">{count} orders ({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFavorite ? 'bg-[#32A5DC]' : 'bg-gray-700'
                        }`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Dates */}
        {(stats.firstOrderDate || stats.lastOrderDate) && (
          <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.firstOrderDate && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">First Order</p>
                <p className="text-white font-bold">
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }).format(new Date(stats.firstOrderDate))}
                </p>
              </div>
            )}
            {stats.lastOrderDate && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Order</p>
                <p className="text-white font-bold">
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }).format(new Date(stats.lastOrderDate))}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

