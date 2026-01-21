import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function AdminHistoryDetailPage({ params }: Props) {
  const { id } = await Promise.resolve(params);

  // Fetch order with all relations
  const rawOrder = await prisma.order.findUnique({
    where: { publicId: id },
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
    }
  });

  if (!rawOrder) notFound();

  // Serialize order
  const order = {
    ...rawOrder,
    total: Number(rawOrder.total),
    items: rawOrder.items.map(item => ({
      ...item,
      product: {
        ...item.product,
        basePrice: Number(item.product.basePrice)
      },
      modifiers: item.modifiers.map(mod => ({
        ...mod,
        ingredient: {
          ...mod.ingredient,
          priceMod: Number(mod.ingredient.priceMod)
        }
      }))
    }))
  };

  // Helper functions
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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

  // Calculate order completion info
  const getOrderCompletionInfo = () => {
    if (order.status !== 'completed') {
      return {
        completedAt: null,
        duration: null
      };
    }

    const completedItems = order.items.filter(item => item.completed_at);
    if (completedItems.length === 0) {
      return {
        completedAt: order.updatedAt,
        duration: formatDuration(order.createdAt, order.updatedAt)
      };
    }

    const latestCompleted = completedItems.reduce((latest, item) => {
      const itemTime = new Date(item.completed_at!).getTime();
      const latestTime = latest ? new Date(latest.completed_at!).getTime() : 0;
      return itemTime > latestTime ? item : latest;
    }, completedItems[0]);

    return {
      completedAt: latestCompleted.completed_at!,
      duration: formatDuration(order.createdAt, latestCompleted.completed_at!)
    };
  };

  const completionInfo = getOrderCompletionInfo();

  // Calculate statistics
  const stats = {
    totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    hot: 0,
    iced: 0,
    milkTypes: {} as Record<string, number>,
    syrups: {} as Record<string, number>,
    caffeineTypes: {} as Record<string, number>,
    completedItems: order.items.filter(item => item.completed_at).length,
    cancelledItems: order.items.filter(item => item.cancelled).length
  };

  order.items.forEach(item => {
    const temp = (item.temperature || "").toLowerCase();
    if (temp.includes('iced')) {
      stats.iced += item.quantity;
    } else {
      stats.hot += item.quantity;
    }

    if (item.milkName && item.milkName !== "No Milk") {
      stats.milkTypes[item.milkName] = (stats.milkTypes[item.milkName] || 0) + item.quantity;
    }

    item.modifiers.forEach(mod => {
      if (mod.ingredient.category === 'syrup') {
        stats.syrups[mod.ingredient.name] = (stats.syrups[mod.ingredient.name] || 0) + (item.quantity * mod.quantity);
      }
    });

    const caffeineType = item.caffeineType || 'Normal';
    stats.caffeineTypes[caffeineType] = (stats.caffeineTypes[caffeineType] || 0) + item.quantity;
  });

  const customerName = order.user 
    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Guest'
    : order.guestName || 'Guest';

  const customerEmail = order.user?.email || order.guestEmail || 'No email';

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/history"
          className="text-[#32A5DC] hover:text-[#5bc0de] font-bold transition-colors flex items-center gap-2"
        >
          ← Back to History
        </Link>
      </div>

      {/* Order Header */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-white">Order {order.publicId}</h1>
              <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-lg text-gray-400">{customerName}</p>
            <p className="text-sm text-gray-500 mt-1">{customerEmail}</p>
          </div>
        </div>

        {/* Timing Information */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Time Placed</p>
            <p className="text-white font-medium text-lg">{formatTime(order.createdAt)}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Time Completed</p>
            <p className="text-white font-medium text-lg">
              {completionInfo.completedAt ? formatTime(completionInfo.completedAt) : 'In Progress'}
            </p>
            {completionInfo.completedAt && (
              <p className="text-xs text-gray-500 mt-1">{formatDateTime(completionInfo.completedAt)}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Time to Complete</p>
            <p className="text-white font-medium text-lg">
              {completionInfo.duration || 'In Progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-black text-white mb-6">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            const isCompleted = !!item.completed_at;
            const isCancelled = item.cancelled;

            // Build customization details
            const customizations: string[] = [];
            
            if (item.milkName && item.milkName !== "No Milk") {
              customizations.push(`Milk: ${item.milkName}`);
            }
            
            if (item.shots > 0) {
              customizations.push(`${item.shots} ${item.shots === 1 ? 'Shot' : 'Shots'}`);
            }
            
            if (item.temperature) {
              customizations.push(item.temperature);
            }
            
            if (item.caffeineType && item.caffeineType !== 'Normal') {
              customizations.push(item.caffeineType);
            }
            
            if (item.personalCup) {
              customizations.push('Personal Cup');
            }

            // Modifiers (syrups, toppings, etc.)
            item.modifiers.forEach(mod => {
              if (mod.ingredient.category !== 'milk') {
                const label = mod.quantity > 1 
                  ? `${mod.ingredient.name} (${mod.quantity})`
                  : mod.ingredient.name;
                customizations.push(label);
              }
            });

            return (
              <div
                key={item.id}
                className={`bg-gray-900 p-4 rounded-lg border ${
                  isCancelled 
                    ? 'border-red-800/50 bg-red-900/10' 
                    : isCompleted 
                    ? 'border-green-800/50' 
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white">{item.product.name}</h3>
                      {item.quantity > 1 && (
                        <span className="text-sm text-gray-400 font-bold">x{item.quantity}</span>
                      )}
                      {isCancelled && (
                        <span className="text-xs uppercase font-bold px-2 py-1 rounded-full border border-red-800 text-red-400 bg-red-900/50">
                          Cancelled
                        </span>
                      )}
                      {isCompleted && !isCancelled && (
                        <span className="text-xs uppercase font-bold px-2 py-1 rounded-full border border-green-800 text-green-400 bg-green-900/50">
                          Completed
                        </span>
                      )}
                    </div>
                    {item.recipientName && (
                      <p className="text-sm text-[#32A5DC] font-medium mb-2">For: {item.recipientName}</p>
                    )}
                    {customizations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {customizations.map((custom, idx) => (
                          <span
                            key={idx}
                            className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700"
                          >
                            {custom}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Special Instructions: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
                {isCompleted && item.completed_at && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      Completed at: {formatDateTime(item.completed_at)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Statistics */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-black text-white mb-6">Order Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Total Items</p>
            <p className="text-3xl font-black text-white">{stats.totalItems}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Hot Drinks</p>
            <p className="text-3xl font-black text-white">{stats.hot}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Iced Drinks</p>
            <p className="text-3xl font-black text-white">{stats.iced}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Completed Items</p>
            <p className="text-3xl font-black text-white">{stats.completedItems}</p>
          </div>
        </div>

        {/* Milk Types */}
        {Object.keys(stats.milkTypes).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-3 uppercase font-bold">Milk Types</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.milkTypes).map(([milk, count]) => (
                <span
                  key={milk}
                  className="text-sm text-gray-300 bg-gray-900 px-3 py-1 rounded border border-gray-700"
                >
                  {milk}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Syrups */}
        {Object.keys(stats.syrups).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-3 uppercase font-bold">Syrups</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.syrups).map(([syrup, count]) => (
                <span
                  key={syrup}
                  className="text-sm text-gray-300 bg-gray-900 px-3 py-1 rounded border border-gray-700"
                >
                  {syrup}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Caffeine Types */}
        {Object.keys(stats.caffeineTypes).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-3 uppercase font-bold">Caffeine Types</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.caffeineTypes).map(([type, count]) => (
                <span
                  key={type}
                  className="text-sm text-gray-300 bg-gray-900 px-3 py-1 rounded border border-gray-700"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
