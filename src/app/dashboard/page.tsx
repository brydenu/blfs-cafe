import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import LiveOrderWidget from "./LiveOrderWidget";
import RecentOrderTracker from "./RecentOrderTracker"; 
import ScheduleWidget from "./ScheduleWidget";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import CommunicationBanner from "@/components/CommunicationBanner";
import { CoffeeIcon, LightningIcon, LightbulbIcon } from "@/components/icons";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  // 1. Get User
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect("/");

  // 2. Fetch Orders for TODAY (Initial State)
  const todayStr = new Date().toLocaleDateString('en-CA');
  const startOfDay = new Date(`${todayStr}T00:00:00`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999`);

  const rawOrders = await prisma.order.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: { not: 'cancelled' }
    },
    include: {
        items: {
            include: { 
                product: true,
                modifiers: { include: { ingredient: true } }
            },
            orderBy: { id: 'asc' }
        }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Fetch Latest Order (including cancelled orders)
  const latestRawOrder = await prisma.order.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
        items: {
            include: { 
                product: true,
                modifiers: { include: { ingredient: true } }
            },
            orderBy: { id: 'asc' }
        }
    }
  });

  // Serialization (remove price fields and Decimal fields)
  const serializeOrder = (order: any) => {
    const { total, ...orderWithoutTotal } = order;
    return {
      ...orderWithoutTotal,
      items: order.items.map((item: any) => {
        const { basePrice, ...productWithoutPrice } = item.product;
        return {
          ...item,
          product: productWithoutPrice,
          modifiers: item.modifiers.map((mod: any) => {
            const { priceMod, ...ingredientWithoutPrice } = mod.ingredient;
            return {
              ...mod,
              ingredient: ingredientWithoutPrice
            };
          })
        };
      })
    };
  };

  const orders = rawOrders.map(serializeOrder);
  const latestOrder = latestRawOrder ? serializeOrder(latestRawOrder) : null;

  // Fetch schedule data
  const schedules = await prisma.schedule.findMany({
    orderBy: { dayOfWeek: 'asc' }
  });

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl p-6 space-y-6 pb-20">
        
        {/* Communications Banner */}
        <CommunicationBanner location="dashboard" />
        
        {/* HEADER */}
        <header className="mb-2 flex items-center justify-between">
            <h1 className="text-3xl font-black text-white">
                Hi, {user.firstName || "Friend"}!
            </h1>
            
            <div className="flex items-center gap-3">
                {user.role === "admin" && (
                    <Link href="/admin/dashboard">
                        <button className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all shadow-lg hover:scale-105 active:scale-[0.97] active:translate-y-[2px] cursor-pointer">
                            Barista<span className="text-[#32A5DC]">OS</span>
                        </button>
                    </Link>
                )}
                <SignOutButton />
            </div>
        </header>

        {/* --- ROW 1: ACTION BUTTONS (Blue) --- */}
        <div className="grid grid-cols-2 gap-4">
            <Link href="/menu" className="block">
                <button className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white p-4 md:p-6 rounded-3xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.97] active:translate-y-[2px] flex flex-col items-center justify-center gap-2 cursor-pointer group border border-white/10 h-[110px] md:h-auto md:min-h-[120px]">
                    <CoffeeIcon size={48} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-black text-sm md:text-lg text-center leading-tight">Order Now</span>
                </button>
            </Link>
            
            <Link href="/dashboard/quick-order" className="block">
                <button className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white p-4 md:p-6 rounded-3xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.97] active:translate-y-[2px] flex flex-col items-center justify-center gap-2 cursor-pointer group border border-white/10 h-[110px] md:h-auto md:min-h-[120px]">
                    <LightningIcon size={48} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-black text-sm md:text-lg text-center leading-tight">Quick Order</span>
                </button>
            </Link>
        </div>

        {/* --- ROW 2: LATEST ORDER TRACKER (White) --- */}
        {latestOrder && (
            <RecentOrderTracker order={latestOrder} />
        )}

        {/* --- ROW 3: SECONDARY ACTIONS (Navy Blue) --- */}
        {/* On mobile, stack and give Suggestions its own full-width row for better readability */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Favorites: full-width row on mobile, single column on desktop */}
            <Link href="/dashboard/favorites" className="block col-span-2 md:col-span-1">
                <button className="w-full bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white p-4 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.97] active:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-yellow-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    Edit Favorites
                </button>
            </Link>
            
            {/* Suggestions & Settings: share a row on mobile, all three inline on desktop */}
            <Link href="/dashboard/suggestions" className="block">
                <button className="w-full bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white p-4 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.97] active:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer">
                    <LightbulbIcon size={20} />
                    Suggestions
                </button>
            </Link>
            
            {/* LINKED SETTINGS BUTTON */}
            <Link href="/dashboard/settings" className="block">
                <button className="w-full bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white p-4 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.97] active:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                </button>
            </Link>
        </div>

        {/* --- SCHEDULE WIDGET (White) --- */}
        <ScheduleWidget initialSchedules={schedules} />

        {/* --- ROW 4: DAILY TRACKER WIDGET (White) --- */}
        <section>
            <LiveOrderWidget 
                initialOrders={orders} 
            />
        </section>

      </div>
    </main>
  );
}