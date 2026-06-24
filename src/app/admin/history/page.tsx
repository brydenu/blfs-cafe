import { prisma } from "@/lib/db";
import Link from "next/link";
import { HistoryNavigation } from "./HistoryNavigation";
import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Order History");
export const dynamic = 'force-dynamic';

interface OrderHistoryPageProps {
  searchParams: Promise<{ date?: string; userId?: string; page?: string }>;
}

export default async function OrderHistoryPage({ searchParams }: OrderHistoryPageProps) {
  // Await searchParams for Next.js 15+
  const resolvedSearchParams = await searchParams;
  const dateParam = resolvedSearchParams?.date;
  const userIdParam = resolvedSearchParams?.userId;
  const pageParam = resolvedSearchParams?.page;
  
  // Parse pagination
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const pageSize = 20;
  const skip = (currentPage - 1) * pageSize;
  
  // Fetch user info if userIdParam is present
  let userInfo: { firstName: string | null; lastName: string | null } | null = null;
  if (userIdParam) {
    const user = await prisma.user.findUnique({
      where: { id: userIdParam },
      select: {
        firstName: true,
        lastName: true
      }
    });
    if (user) {
      userInfo = user;
    }
  }
  
  // Get today's date in Pacific Time as a YYYY-MM-DD string.
  // The server may run in UTC, so we must not use `new Date()` directly for the
  // "today" default — that would return tomorrow's date for Pacific users in the
  // evening (e.g. 6 PM PDT = 1 AM UTC next day).
  const getTodayPacific = (): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());

  // Resolve and validate the date string (YYYY-MM-DD)
  let dateStr: string;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const [y, m, d] = dateParam.split('-').map(Number);
    const probe = new Date(y, m - 1, d);
    dateStr = isNaN(probe.getTime()) ? getTodayPacific() : dateParam;
  } else {
    dateStr = getTodayPacific();
  }

  // Compute UTC boundaries for the selected Pacific calendar day.
  // We use Intl to handle DST automatically — no manual offset math required.
  // Strategy: start with a UTC approximation, ask Intl what Pacific wall-clock
  // time that corresponds to, then shift by the difference.
  const pacificWallToUTC = (wallTime: string): Date => {
    const approx = new Date(`${dateStr}T${wallTime}Z`);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = fmt.formatToParts(approx).reduce<Record<string, string>>((a, p) => {
      a[p.type] = p.value; return a;
    }, {});
    const actualWall = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`;
    const skew = approx.getTime() - new Date(actualWall).getTime();
    return new Date(approx.getTime() + skew);
  };

  const startOfDay = pacificWallToUTC('00:00:00');
  const endOfDay   = pacificWallToUTC('23:59:59');

  // Build where clause
  let whereClause: any = { status: { not: 'cancelled' } };
  
  if (userIdParam) {
    whereClause.userId = userIdParam;
    // If dateParam is also present, filter by both user and date
    if (dateParam) {
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
  } else {
    // Normal admin history - filter by date
    whereClause.createdAt = {
      gte: startOfDay,
      lte: endOfDay
    };
  }
  
  // Get total count for pagination (only when viewing user-specific history without date filter)
  const totalCount = userIdParam && !dateParam
    ? await prisma.order.count({ where: whereClause })
    : 0;
  
  // If filtering by userId, show all orders for that user, not just today's
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      items: {
        include: {
          product: true,
          modifiers: {
            include: {
              ingredient: true
            }
          }
        },
        orderBy: { id: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' },
    // Apply pagination only for user-specific history without date filter
    ...(userIdParam && !dateParam ? { skip, take: pageSize } : {})
  });

  // Serialize orders (no price fields to remove)
  const serializedOrders = orders;

  // Calculate total number of drinks (sum of all item quantities)
  const totalDrinks = serializedOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    }).format(date);
  };

  const formatDuration = (startDate: Date, endDate: Date) => {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const getOrderCompletionInfo = (order: any) => {
    if (order.status !== 'completed') {
      return {
        completedAt: null,
        duration: null
      };
    }

    // Find the latest completed_at from all items
    const completedItems = order.items.filter((item: any) => item.completed_at);
    if (completedItems.length === 0) {
      // Fallback to updatedAt if no items have completed_at
      return {
        completedAt: order.updatedAt,
        duration: formatDuration(order.createdAt, order.updatedAt)
      };
    }

    const latestCompleted = completedItems.reduce((latest: any, item: any) => {
      const itemTime = new Date(item.completed_at).getTime();
      const latestTime = latest ? new Date(latest.completed_at).getTime() : 0;
      return itemTime > latestTime ? item : latest;
    });

    return {
      completedAt: latestCompleted.completed_at,
      duration: formatDuration(order.createdAt, latestCompleted.completed_at)
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/50 text-green-400 border-green-800';
      case 'preparing':
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-800';
      case 'ready':
        return 'bg-blue-900/50 text-blue-400 border-blue-800';
      case 'queued':
        return 'bg-gray-700/50 text-gray-400 border-gray-600';
      default:
        return 'bg-gray-700/50 text-gray-400 border-gray-600';
    }
  };

  // Format date for display (only show if not user-specific or if date filter is present)
  const showDateHeader = !userIdParam || dateParam;
  let dateDisplay: string | null = null;
  
  if (showDateHeader) {
    const [displayYear, displayMonth, displayDay] = dateStr.split('-').map(Number);
    const displayDate = new Date(displayYear, displayMonth - 1, displayDay);
    
    dateDisplay = displayDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Calculate pagination info
  const totalPages = userIdParam && !dateParam ? Math.ceil(totalCount / pageSize) : 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Back to User Link - only show for user-specific history */}
      {userIdParam && (
        <div className="mb-2">
          <Link
            href={`/admin/users/${userIdParam}`}
            className="text-sm text-[#32A5DC] hover:text-[#5bc0de] font-bold transition-colors inline-flex items-center gap-1"
          >
            ← Back to User Statistics
          </Link>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">
            {userIdParam && userInfo
              ? `Order History: ${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
              : 'Order History'}
          </h1>
          {dateDisplay && (
            <p className="text-gray-400 font-medium">{dateDisplay}</p>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {userIdParam && !dateParam
            ? `Showing ${skip + 1}-${Math.min(skip + serializedOrders.length, totalCount)} of ${totalCount} ${totalCount === 1 ? 'order' : 'orders'}`
            : `Showing ${serializedOrders.length} ${serializedOrders.length === 1 ? 'order' : 'orders'} (${totalDrinks} ${totalDrinks === 1 ? 'drink' : 'drinks'})`}
        </span>
      </div>

      {/* Navigation - only show if not user-specific total history */}
      {(!userIdParam || dateParam) && (
        <HistoryNavigation selectedDateStr={dateStr} />
      )}
      
      {/* Pagination - only show for user-specific total history */}
      {userIdParam && !dateParam && totalPages > 1 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {hasPrevPage && (
              <Link
                href={`/admin/history?userId=${userIdParam}&page=${currentPage - 1}`}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
              >
                ← Previous page
              </Link>
            )}
            {hasNextPage && (
              <Link
                href={`/admin/history?userId=${userIdParam}&page=${currentPage + 1}`}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
              >
                Next page →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Orders List */}
      {serializedOrders.length === 0 ? (
        <div className="bg-gray-800 p-12 rounded-2xl shadow-lg border border-gray-700 text-center">
          <div className="text-6xl mb-4 opacity-30">📜</div>
          <h3 className="text-xl font-bold text-white mb-2">No Orders Found</h3>
          <p className="text-gray-400">Orders will appear here once they are placed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {serializedOrders.map((order) => {
            const customerName = order.user 
              ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Guest'
              : order.guestName || 'Guest';
            
            return (
              <div
                key={order.id}
                className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-400">
                        Order ID: {order.publicId}
                      </h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{customerName}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>

                {/* Timing Information */}
                {(() => {
                  const completionInfo = getOrderCompletionInfo(order);
                  return (
                    <div className="mb-4 pb-4 border-b border-gray-700 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time Placed</p>
                        <p className="text-white font-medium">{formatTime(order.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time Completed</p>
                        <p className="text-white font-medium">
                          {completionInfo.completedAt ? formatTime(completionInfo.completedAt) : 'In Progress'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time to Complete</p>
                        <p className="text-white font-medium">
                          {completionInfo.duration || 'In Progress'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const details: string[] = [];
                    if (item.milkName && item.milkName !== "No Milk") {
                      const milkDisplay = item.milkAmount ? `${item.milkAmount} ${item.milkName}` : item.milkName;
                      details.push(milkDisplay);
                    }
                    if (item.shots > 0) {
                      details.push(`${item.shots} ${item.shots === 1 ? 'Shot' : 'Shots'}`);
                    }
                    item.modifiers.forEach((mod: any) => {
                      details.push(`${mod.ingredient.name}${mod.quantity > 1 ? ` (${mod.quantity})` : ''}`);
                    });
                    if (item.temperature) {
                      details.push(item.temperature);
                    }
                    if (item.foamLevel) {
                      details.push(`Foam: ${item.foamLevel}`);
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between bg-gray-900 p-3 rounded-lg border border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{item.product.name}</p>
                          {item.recipientName && (
                            <p className="text-xs text-gray-400 mt-0.5">For: {item.recipientName}</p>
                          )}
                          {details.length > 0 && (
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                              {details.join(' • ')}
                            </p>
                          )}
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-xs text-gray-400 font-bold ml-2">
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer */}
                <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                  <Link
                    href={`/admin/history/${order.publicId}`}
                    className="text-sm text-[#32A5DC] hover:text-[#5bc0de] font-bold transition-colors"
                  >
                    View Details →
                  </Link>
                  <span className="text-xs text-gray-500">
                    {order.user?.email || order.guestEmail || 'No email'}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
