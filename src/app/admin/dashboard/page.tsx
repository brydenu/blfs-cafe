import { prisma } from "@/lib/db";
import Link from "next/link";
import { getTodayStatistics } from "../actions";
import SuggestionsBadgeInline from "./SuggestionsBadgeInline";
import { FireIcon, TVIcon, CalendarIcon, CoffeeIcon, StarIcon, BoxIcon, ScrollIcon, ChartIcon, UsersIcon, MegaphoneIcon, LightbulbIcon } from "@/components/icons";

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
  const stats = statsResult.success && statsResult.data ? statsResult.data : {
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
        <Link href="/dashboard" className="bg-[#32A5DC] hover:bg-[#288bba] text-white px-6 py-3 rounded-2xl font-medium transition-colors">
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
          <p className="text-3xl font-black text-white">{stats?.totalDrinks ?? 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hot</p>
          <p className="text-3xl font-black text-red-400">{stats?.totalHot ?? 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Iced</p>
          <p className="text-3xl font-black text-blue-400">{stats?.totalIced ?? 0}</p>
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
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <FireIcon size={32} className="text-[#32A5DC]" />
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
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <TVIcon size={32} className="text-[#32A5DC]" />
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
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <CalendarIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Schedule</h2>
                <p className="text-sm text-gray-400">Manage store hours</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Menu Card */}
        <Link href="/admin/menu" className="order-3 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <CoffeeIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Menu</h2>
                <p className="text-sm text-gray-400">Manage menu items</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Featured Drinks Card */}
        <Link href="/admin/featured-drinks" className="order-9 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <StarIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Featured Drinks</h2>
                <p className="text-sm text-gray-400">Create featured drink combinations</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Inventory Card */}
        <Link href="/admin/inventory" className="order-4 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <BoxIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Inventory</h2>
                <p className="text-sm text-gray-400">Manage ingredients</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Order History Card */}
        <Link href="/admin/history" className="order-5 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <ScrollIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Order History</h2>
                <p className="text-sm text-gray-400">View past orders</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Statistics Card */}
        <Link href="/admin/statistics" className="order-6 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <ChartIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Statistics</h2>
                <p className="text-sm text-gray-400">View detailed analytics</p>
              </div>
            </div>
          </div>
        </Link>

        {/* User Manager Card */}
        <Link href="/admin/users" className="order-7 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <UsersIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">User Manager</h2>
                <p className="text-sm text-gray-400">Manage users and statistics</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Communications Card */}
        <Link href="/admin/communications" className="order-8 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <MegaphoneIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Communications</h2>
                <p className="text-sm text-gray-400">Manage announcements and messages</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Suggestions Card */}
        <Link href="/admin/suggestions" className="order-9 md:order-none">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 hover:border-[#32A5DC] transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#32A5DC]/20 text-[#32A5DC] rounded-xl flex items-center justify-center group-hover:bg-[#32A5DC]/30 transition-colors">
                <LightbulbIcon size={32} className="text-[#32A5DC]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">Suggestions</h2>
                  <SuggestionsBadgeInline />
                </div>
                <p className="text-sm text-gray-400">View user suggestions and feedback</p>
              </div>
            </div>
          </div>
        </Link>

      </div>

    </div>
  );
}
