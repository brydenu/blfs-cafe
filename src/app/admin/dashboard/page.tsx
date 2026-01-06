import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic'; 

export default async function AdminDashboard() {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const startOfDay = new Date(`${todayStr}T00:00:00`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999`);

  // --- Data Fetching ---
  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: { not: 'cancelled' } }
  });

  const allItemsToday = await prisma.orderItem.groupBy({
    by: ['productName'],
    where: { order: { createdAt: { gte: startOfDay, lte: endOfDay }, status: { not: 'cancelled' } } },
    _count: { productName: true },
    orderBy: { _count: { productName: 'desc' } },
    take: 1
  });
  
  // Logic to handle missing products safely
  const popularItem = allItemsToday[0] ? allItemsToday[0].productName : "N/A";
  const popularCount = allItemsToday[0] ? allItemsToday[0]._count.productName : 0;

  const ordersToday = await prisma.order.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: { not: 'cancelled' } },
    select: { createdAt: true }
  });

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
  const hourlyData = hours.map(h => ({
    hour: h,
    count: ordersToday.filter(o => o.createdAt.getHours() === h).length
  }));
  const maxHourly = Math.max(...hourlyData.map(d => d.count), 1); 

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true } } }
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
            <h1 className="text-3xl font-black text-white">Overview</h1>
            <p className="text-gray-400 font-medium">Statistics for {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* --- WIDGETS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Orders */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-700 text-[#32A5DC] rounded-xl flex items-center justify-center text-2xl">
                ☕
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Orders Today</p>
                <p className="text-4xl font-black text-white">{totalOrders}</p>
            </div>
        </div>

        {/* Popular Item */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-700 text-orange-400 rounded-xl flex items-center justify-center text-2xl">
                🏆
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Top Seller</p>
                <div className="flex flex-col">
                    <span className="text-lg font-black text-white truncate max-w-[150px]" title={popularItem}>
                        {popularItem}
                    </span>
                    <span className="text-xs font-bold text-gray-500">{popularCount} sold</span>
                </div>
            </div>
        </div>

        {/* System Status */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-700 text-green-400 rounded-xl flex items-center justify-center text-2xl">
                ⚡
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">System Status</p>
                <p className="text-lg font-black text-white">Operational</p>
                <p className="text-xs font-bold text-green-400">All systems go</p>
            </div>
        </div>
      </div>

      {/* --- CHART & HISTORY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart */}
          <div className="lg:col-span-2 bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-8">Hourly Activity</h2>
            <div className="h-64 flex items-end gap-3">
                {hourlyData.map((data) => {
                    const heightPercent = (data.count / maxHourly) * 100;
                    return (
                        <div key={data.hour} className="flex-1 flex flex-col items-center gap-3 group">
                            <div className="w-full relative h-full flex items-end bg-gray-700/50 rounded-t-md overflow-hidden">
                                <div 
                                    style={{ height: `${heightPercent}%` }} 
                                    className="w-full bg-[#32A5DC] group-hover:bg-[#5bc0de] transition-all duration-300 rounded-t-md relative min-h-[4px]"
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        {data.count}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-gray-500">
                                {data.hour > 12 ? `${data.hour - 12}p` : `${data.hour}a`}
                            </span>
                        </div>
                    );
                })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
             <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
             <div className="space-y-4">
                {recentOrders.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No orders yet today.</p>
                ) : (
                    recentOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                            <div>
                                <p className="font-bold text-white text-sm">
                                    {order.user.firstName} {order.user.lastName?.charAt(0)}.
                                </p>
                                <p className="text-xs text-gray-500">
                                    {/* FIXED: toString() added before slicing */}
                                    Order #{order.id.toString().slice(-4)}
                                </p>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                                order.status === 'completed' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                                order.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' :
                                'bg-blue-900/50 text-blue-400 border border-blue-800'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                    ))
                )}
             </div>
          </div>

      </div>
    </div>
  );
}