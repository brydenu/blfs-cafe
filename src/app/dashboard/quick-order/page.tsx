import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import QuickOrderList from "./QuickOrderList";
import { getLastOrderedDrink } from "./actions";

export const dynamic = 'force-dynamic';

export default async function QuickOrderPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect("/");

  // Fetch user's favorites
  const rawFavorites = await prisma.savedOrder.findMany({
    where: { userId: user.id },
    include: {
      product: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter out favorites where product was deleted
  const validFavorites = rawFavorites.filter(fav => fav.product && (fav.product as any).deletedAt === null);

  const favorites = validFavorites.map(fav => ({
    ...fav,
    product: {
      ...fav.product!,
      basePrice: fav.product!.basePrice.toNumber()
    }
  }));

  // Get last ordered drink
  const lastDrink = await getLastOrderedDrink();

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl p-6 space-y-6 pb-20">
        
        {/* HEADER */}
        <header className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">
              Quick Order
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Order your favorites or last drink with one click
            </p>
          </div>
          <Link href="/dashboard">
            <button className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all shadow-lg hover:scale-105 cursor-pointer">
              ← Back
            </button>
          </Link>
        </header>

        {/* QUICK ORDER LIST */}
        <QuickOrderList favorites={favorites} lastDrink={lastDrink} />

      </div>
    </main>
  );
}
