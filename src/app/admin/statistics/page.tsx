import { getStatistics } from "../actions";

export const dynamic = 'force-dynamic';

interface StatisticsPageProps {
  searchParams: { timeframe?: string };
}

export default async function StatisticsPage({ searchParams }: StatisticsPageProps) {
  const timeframe = (searchParams.timeframe as 'today' | 'week' | 'month' | 'all') || 'today';
  
  const statsResult = await getStatistics(timeframe);
  
  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-red-900/20 border border-red-700 p-4 rounded-xl">
          <p className="text-red-400">Failed to load statistics. Please try again.</p>
        </div>
      </div>
    );
  }

  const stats = statsResult.data;

  // Sort products by popularity
  const topProducts = Object.entries(stats.productCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sort categories by popularity
  const topCategories = Object.entries(stats.categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Sort milk by popularity
  const topMilk = Object.entries(stats.milkCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sort syrups by popularity
  const topSyrups = Object.entries(stats.syrupCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Prepare hourly distribution for display
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: stats.hourlyDistribution[i] || 0
  }));

  // Prepare daily distribution (last 7 days for week view, last 30 for month view)
  const dailyEntries = Object.entries(stats.dailyDistribution)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-(timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365));

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Statistics</h1>
          <p className="text-gray-400 font-medium">Detailed Analytics & Insights</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex gap-2 bg-gray-800 p-1 rounded-xl border border-gray-700">
          <a
            href="?timeframe=today"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              timeframe === 'today'
                ? 'bg-[#32A5DC] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Today
          </a>
          <a
            href="?timeframe=week"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              timeframe === 'week'
                ? 'bg-[#32A5DC] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Week
          </a>
          <a
            href="?timeframe=month"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              timeframe === 'month'
                ? 'bg-[#32A5DC] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Month
          </a>
          <a
            href="?timeframe=all"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              timeframe === 'all'
                ? 'bg-[#32A5DC] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            All Time
          </a>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-3xl font-black text-white">{stats.totalOrders}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Drinks</p>
          <p className="text-3xl font-black text-white">{stats.totalDrinks}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hot</p>
          <p className="text-3xl font-black text-red-400">{stats.totalHot}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Iced</p>
          <p className="text-3xl font-black text-blue-400">{stats.totalIced}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Caf Shots</p>
          <p className="text-3xl font-black text-orange-400">{stats.totalCafShots}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Decaf Shots</p>
          <p className="text-3xl font-black text-gray-400">{stats.totalDecafShots}</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Avg Items per Order</p>
          <p className="text-4xl font-black text-white">{stats.averageItemsPerOrder}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Most Popular Product</p>
          <p className="text-xl font-black text-white truncate">{stats.mostPopularProduct.name || 'N/A'}</p>
          <p className="text-sm text-gray-400 mt-1">{stats.mostPopularProduct.count} ordered</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Busiest Hour</p>
          <p className="text-4xl font-black text-white">
            {stats.busiestHour.hour}:00 {stats.busiestHour.hour < 12 ? 'AM' : 'PM'}
          </p>
          <p className="text-sm text-gray-400 mt-1">{stats.busiestHour.count} orders</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-black text-white mb-4">Top Products</h2>
        <div className="space-y-3">
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-[#32A5DC]/20 text-[#32A5DC] rounded-lg flex items-center justify-center text-sm font-black">
                    #{index + 1}
                  </span>
                  <span className="text-white font-bold">{product.name}</span>
                </div>
                <span className="text-gray-300 font-black text-lg">{product.count}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">No products ordered yet</p>
          )}
        </div>
      </div>

      {/* Category & Milk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-black text-white mb-4">Category Breakdown</h2>
          <div className="space-y-3">
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

        {/* Milk Preferences */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-black text-white mb-4">Milk Preferences</h2>
          <div className="space-y-3">
            {topMilk.length > 0 ? (
              topMilk.map((milk) => {
                const totalMilk = Object.values(stats.milkCounts).reduce((a, b) => a + b, 0);
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
              })
            ) : (
              <p className="text-gray-400 text-center py-4">No milk preferences recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Syrups (if any) */}
      {topSyrups.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-black text-white mb-4">Popular Syrups</h2>
          <div className="flex flex-wrap gap-3">
            {topSyrups.map((syrup) => (
              <div
                key={syrup.name}
                className="bg-gray-900 px-4 py-2 rounded-xl border border-gray-700"
              >
                <span className="text-white font-bold">{syrup.name}</span>
                <span className="text-gray-400 ml-2 font-black">{syrup.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Distribution */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-black text-white mb-4">Hourly Distribution</h2>
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-2">
          {hourlyData.map((data) => {
            const maxCount = Math.max(...hourlyData.map(d => d.count), 1);
            const heightPercentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
            return (
              <div key={data.hour} className="flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[#32A5DC] rounded-t transition-all min-h-[4px]"
                  style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                  title={`${data.hour}:00 - ${data.count} orders`}
                />
                <span className="text-xs text-gray-500 font-bold">
                  {data.hour % 4 === 0 ? data.hour : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Distribution */}
      {dailyEntries.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-black text-white mb-4">
            Daily Distribution {timeframe === 'week' ? '(Last 7 Days)' : timeframe === 'month' ? '(Last 30 Days)' : ''}
          </h2>
          <div className="space-y-2">
            {dailyEntries.map((day) => {
              const maxCount = Math.max(...dailyEntries.map(d => d.count), 1);
              const widthPercentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const date = new Date(day.date);
              const isToday = day.date === new Date().toLocaleDateString('en-CA');
              return (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 font-bold w-24">
                    {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-900 rounded-full h-6 relative">
                    <div
                      className={`h-6 rounded-full transition-all flex items-center justify-end pr-2 ${
                        isToday ? 'bg-[#32A5DC]' : 'bg-gray-700'
                      }`}
                      style={{ width: `${Math.max(widthPercentage, 2)}%` }}
                    >
                      {day.count > 0 && (
                        <span className="text-xs text-white font-black">{day.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Status Breakdown */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-black text-white mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <div key={status} className="bg-gray-900 p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 capitalize">{status}</p>
              <p className="text-2xl font-black text-white">{count}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
