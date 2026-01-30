import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import FavoritesList from "./FavoritesList";

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
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
    product: (() => {
      const { basePrice, ...productWithoutPrice } = fav.product!;
      return productWithoutPrice;
    })()
  }));

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
              My Favorites
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Save your favorite drink customizations for quick ordering
            </p>
          </div>
          <Link href="/dashboard">
            <button className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all shadow-lg hover:scale-105 active:scale-[0.97] active:translate-y-[2px] cursor-pointer">
              ← Back
            </button>
          </Link>
        </header>

        {/* ADD NEW BUTTON */}
        <div className="mb-6">
          <Link href="/dashboard/favorites/new">
            <button className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white p-4 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.97] active:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add New Favorite
            </button>
          </Link>
        </div>

        {/* FAVORITES LIST */}
        <FavoritesList favorites={favorites} />

      </div>
    </main>
  );
}
