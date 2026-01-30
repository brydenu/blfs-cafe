import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderTracker from "@/app/order-confirmation/[id]/OrderTracker";

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function GuestTrackerPage({ params }: Props) {
  // Await params for Next.js 15+
  const { id } = await Promise.resolve(params);

  // 1. Fetch Order with Items and User (if exists)
  const rawOrder = await prisma.order.findUnique({
    where: { publicId: id },
    include: { 
        items: {
            include: { product: true },
            orderBy: { id: 'asc' }
        },
        user: {
          select: {
            notificationsEnabled: true,
            notificationDefaultType: true,
            notificationMethods: true,
          }
        }
    }
  });

  if (!rawOrder) notFound();

  // 2. Serialize (remove price fields)
  const order = {
    ...rawOrder,
    items: rawOrder.items.map((item) => {
      const { basePrice, ...productWithoutPrice } = item.product;
      return {
        ...item,
        product: productWithoutPrice
      };
    })
  };

  // 3. Calculate Queue Info (based on drinks/items ahead, not orders)
  const itemsAhead = await prisma.orderItem.count({
    where: {
      completed_at: null, // Only count items that haven't been completed
      cancelled: false, // Exclude cancelled items
      order: {
        createdAt: { lt: rawOrder.createdAt }, // Only orders older than this one
        status: { in: ['queued', 'preparing'] } // Only active orders
      }
    }
  });

  const estimatedMinutes = (itemsAhead * 3) + 3;

  return (
    <main className="min-h-screen relative p-6 flex items-center justify-center overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-4 md:p-6 lg:p-8 text-center max-w-lg w-full shadow-2xl relative z-10 animate-fade-in mx-2 md:mx-0">
        
        {/* CLIENT COMPONENT: Handles Socket Listening & Live Updates */}
        <OrderTracker 
            order={order} 
            ordersAhead={itemsAhead} 
            estimatedMinutes={estimatedMinutes} 
        />

        {/* Actions */}
        <div className="space-y-4 mt-8">
            <Link href="/menu" className="block">
                <button className="w-full bg-transparent text-[#32A5DC] hover:text-[#004876] font-bold py-2 text-sm transition-colors cursor-pointer">
                    Order Something Else
                </button>
            </Link>
            <Link href="/" className="block">
                <button className="w-full bg-transparent text-gray-400 hover:text-gray-600 font-bold py-2 text-xs transition-colors cursor-pointer">
                    Back to Home
                </button>
            </Link>
        </div>

      </div>
    </main>
  );
}
