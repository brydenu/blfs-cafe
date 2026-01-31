import { prisma } from "@/lib/db";
import Link from "next/link";
import { HistoryNavigation } from "./HistoryNavigation";

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
  
  // Parse date from searchParams, default to today (only if not viewing user-specific history)
  let selectedDate: Date;
  if (dateParam) {
    // Parse date string (YYYY-MM-DD) and create date in local timezone
    const parts = dateParam.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      selectedDate = new Date(year, month - 1, day);
      // Validate date
      if (isNaN(selectedDate.getTime())) {
        selectedDate = new Date();
      }
    } else {
      selectedDate = new Date();
    }
  } else {
    selectedDate = new Date();
  }

  // Create date range for the selected day in Pacific Time
  // Get the date string in YYYY-MM-DD format
  const dateStr = dateParam || (() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  
  // Parse the date string
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Helper function to get Pacific Time offset in hours for a given date
  // PST is UTC-8, PDT is UTC-7
  // DST typically runs from second Sunday in March to first Sunday in November
  const getPacificOffset = (date: Date): number => {
    const month = date.getMonth(); // 0-11
    
    // DST starts: Second Sunday in March (typically around March 10-14)
    // DST ends: First Sunday in November (typically around November 3-7)
    
    // Before March or after November: PST (UTC-8)
    if (month < 2 || month > 10) {
      return -8;
    }
    
    // April through October: definitely PDT (UTC-7)
    if (month > 2 && month < 10) {
      return -7;
    }
    
    // March: Check if after second Sunday
    if (month === 2) {
      const day = date.getDate();
      // Find second Sunday
      const firstDay = new Date(year, 2, 1).getDay();
      const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
      const secondSunday = firstSunday + 7;
      return day >= secondSunday ? -7 : -8; // PDT if after second Sunday
    }
    
    // November: Check if before first Sunday
    if (month === 10) {
      const day = date.getDate();
      // Find first Sunday
      const firstDay = new Date(year, 10, 1).getDay();
      const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
      return day < firstSunday ? -7 : -8; // PDT if before first Sunday
    }
    
    return -8; // Default to PST
  };
  
  // Create start and end of day in Pacific Time
  const pacificStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const pacificEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  
  // Get Pacific Time offset for this date
  const pacificOffset = getPacificOffset(new Date(year, month - 1, day));
  
  // Convert Pacific Time to UTC for database query
  // Pacific is behind UTC, so we subtract the offset (which is negative)
  // Example: PST is UTC-8, so to convert PST to UTC: UTC = PST - (-8) = PST + 8
  const startOfDay = new Date(pacificStart.getTime() - (pacificOffset * 60 * 60 * 1000));
  const endOfDay = new Date(pacificEnd.getTime() - (pacificOffset * 60 * 60 * 1000));

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
        <HistoryNavigation selectedDate={selectedDate} />
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
