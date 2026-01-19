import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function OrderHistoryPage() {
  const orders = await prisma.order.findMany({
    where: { status: { not: 'cancelled' } },
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
    take: 100 // Limit to recent 100 orders for performance
  });

  // Serialize orders
  const serializedOrders = orders.map(order => ({
    ...order,
    total: Number(order.total),
    items: order.items.map(item => ({
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
  }));

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Order History</h1>
          <p className="text-gray-400 font-medium">View all past orders</p>
        </div>
        <span className="text-sm text-gray-500">Showing {serializedOrders.length} orders</span>
      </div>

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
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-white">
                        Order #{order.publicId.split('-')[0]}
                      </h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{customerName}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const details: string[] = [];
                    if (item.milkName && item.milkName !== "No Milk") {
                      details.push(item.milkName);
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
                    href={`/order-confirmation/${order.publicId}`}
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
