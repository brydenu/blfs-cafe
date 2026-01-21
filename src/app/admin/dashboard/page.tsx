import { prisma } from "@/lib/db";
import Link from "next/link";
import { getTodayStatistics } from "../actions";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const startOfDay = new Date(`${todayStr}T00:00:00`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999`);

  // --- Quick Stats ---
  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: { not: 'cancelled' } }
  });

  const statsResult = await getTodayStatistics();
  const stats = statsResult.success ? statsResult.data : {
    totalDrinks: 0,
    totalHot: 0,
    totalIced: 0,
    totalCafShots: 0,
    totalDecafShots: 0
  };

  // Queue count
  const queueCount = await prisma.order.count({
    where: { status: { in: ['queued', 'preparing'] } }
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-gray-400 font-medium">Admin Control Center</p>
        </div>
        <Link href="/dashboard" className="bg-gray-800 border border-gray-700 hover:border-[#32A5DC] text-white px-6 py-3 rounded-2xl font-medium transition-all">
          User Dashboard
        </Link>
      </div>

      {/* --- QUICK STATS WIDGETS --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Orders Today</p>
          <p className="text-3xl font-black text-white">{totalOrders}</p>
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
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">In Queue</p>
          <p className="text-3xl font-black text-[#32A5DC]">{queueCount}</p>
        </div>

      </div>

      {/* --- NAVIGATION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Queue Card */}
        <Link href="/admin/queue" className="order-1 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center text-3xl group-hover:bg-[#32A5DC]/30 transition-colors">
                🔥
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Active Queue</h2>
                <p className="text-sm text-gray-400">Manage current orders</p>
              </div>
            </div>
            {queueCount > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-[#32A5DC] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {queueCount} {queueCount === 1 ? 'order' : 'orders'}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Observer Screen Card */}
        <Link href="/admin/observer" className="order-6 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center text-3xl group-hover:bg-[#32A5DC]/30 transition-colors">
                📺
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Observer Screen</h2>
                <p className="text-sm text-gray-400">Customer-facing queue display</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Schedule Card */}
        <Link href="/admin/schedule" className="order-2 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center text-3xl group-hover:bg-[#32A5DC]/30 transition-colors">
                📅
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Schedule</h2>
                <p className="text-sm text-gray-400">Manage store hours</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Inventory Card */}
        <Link href="/admin/inventory" className="order-3 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center text-3xl group-hover:bg-[#32A5DC]/30 transition-colors">
                📦
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Inventory</h2>
                <p className="text-sm text-gray-400">Manage ingredients</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Order History Card */}
        <Link href="/admin/history" className="order-4 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center text-3xl group-hover:bg-[#32A5DC]/30 transition-colors">
                📜
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Order History</h2>
                <p className="text-sm text-gray-400">View past orders</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Statistics Card */}
        <Link href="/admin/statistics" className="order-5 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center text-3xl group-hover:bg-[#32A5DC]/30 transition-colors">
                📊
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Statistics</h2>
                <p className="text-sm text-gray-400">View detailed analytics</p>
              </div>
            </div>
          </div>
        </Link>

      </div>

    </div>
  );
}
