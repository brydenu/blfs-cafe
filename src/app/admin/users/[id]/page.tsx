import { getUser, getUserStats } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import UserActions from "./UserActions";
import UserStatistics from "./UserStatistics";

export const dynamic = 'force-dynamic';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ timeframe?: string }>;
}

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const userId = resolvedParams.id;
  const timeframe = (resolvedSearchParams.timeframe as 'today' | 'week' | 'month' | 'all') || 'all';

  const userResult = await getUser(userId);
  if (!userResult.success || !userResult.data) {
    notFound();
  }

  const user = userResult.data;
  const statsResult = await getUserStats(userId, timeframe);
  const stats = statsResult.success && statsResult.data ? statsResult.data : null;

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name || user.email || 'Unknown';

  const isDeleted = !!user.deletedAt;

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/users"
              className="text-[#32A5DC] hover:text-[#5bc0de] font-bold transition-colors"
            >
              ← Back to Users
            </Link>
          </div>
          <h1 className="text-3xl font-black text-white">{displayName}</h1>
          <p className="text-gray-400 font-medium">
            {isDeleted ? 'Deleted User' : 'User Details & Statistics'}
          </p>
        </div>
        {!isDeleted && (
          <Link
            href={`/admin/history?userId=${userId}`}
            className="px-6 py-3 bg-[#32A5DC] hover:bg-[#288bba] text-white rounded-xl font-bold transition-colors"
          >
            View Order History
          </Link>
        )}
      </div>

      {/* User Information */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-black text-white mb-4">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
            <p className="text-white font-bold">{user.email || 'No email'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
            <span className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${
              user.role === 'admin'
                ? 'bg-[#32A5DC]/20 text-[#32A5DC] border border-[#32A5DC]/50'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}>
              {user.role}
            </span>
          </div>
          {user.phone && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-white font-bold">{user.phone}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Created</p>
            <p className="text-white font-bold">
              {new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }).format(new Date(user.createdAt))}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-white font-bold">{user.totalOrders}</p>
          </div>
          {isDeleted && user.deletedAt && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Deleted At</p>
              <p className="text-red-400 font-bold">
                {new Intl.DateTimeFormat('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                }).format(new Date(user.deletedAt))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {stats && !isDeleted && (
        <UserStatistics 
          userId={userId} 
          stats={stats} 
          currentTimeframe={timeframe}
        />
      )}

      {/* Administrative Actions */}
      {!isDeleted && (
        <UserActions user={user} />
      )}

    </div>
  );
}
