import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderTrackerClient from "./OrderTrackerClient";

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function OrderConfirmationPage({ params }: Props) {
  // Await params for Next.js 15+
  const { id } = await Promise.resolve(params);

  // 1. Fetch Order with Items
  const rawOrder = await prisma.order.findUnique({
    where: { publicId: id },
    include: { 
        items: {
            include: { product: true },
            orderBy: { id: 'asc' }
        } 
    }
  });

  if (!rawOrder) notFound();

  // 2. FIX: Serialize Decimals (total & basePrice) -> Numbers
  const order = {
    ...rawOrder,
    total: Number(rawOrder.total),
    items: rawOrder.items.map((item) => ({
        ...item,
        product: {
            ...item.product,
            basePrice: Number(item.product.basePrice)
        }
    }))
  };

  // 3. Calculate Queue Info
  const ordersAhead = await prisma.order.count({
    where: {
      status: { in: ['queued', 'preparing'] },
      createdAt: { lt: rawOrder.createdAt },
    }
  });

  const estimatedMinutes = (ordersAhead * 3) + 3;

  return (
    <main className="min-h-screen relative p-6 flex items-center justify-center overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-8 text-center max-w-lg w-full shadow-2xl relative z-10 animate-fade-in">
        
        {/* CLIENT COMPONENT: Handles Socket Listening & Live Updates */}
        <OrderTrackerClient 
            order={order} 
            ordersAhead={ordersAhead} 
            estimatedMinutes={estimatedMinutes} 
        />

        {/* Actions */}
        <div className="space-y-4 mt-8">
            <Link href="/dashboard" className="block">
                <button className="w-full bg-[#004876] hover:bg-[#32A5DC] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer">
                    Track in Dashboard
                </button>
            </Link>
            <Link href="/menu" className="block">
                <button className="w-full bg-transparent text-[#32A5DC] hover:text-[#004876] font-bold py-2 text-sm transition-colors cursor-pointer">
                    Order Something Else
                </button>
            </Link>
        </div>

      </div>
    </main>
  );
}