import { prisma } from "@/lib/db";
import MenuGrid from "./MenuGrid";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic'; 

export default async function MenuPage() {
  const session = await auth();

  // 1. Fetch Products
  const rawProducts = await prisma.product.findMany({
    orderBy: { category: 'asc' }
  });

  const products = rawProducts.map((p) => ({
    ...p,
    basePrice: p.basePrice.toNumber(), 
  }));

  // 2. Fetch Ingredients
  const rawIngredients = await prisma.ingredient.findMany({
    orderBy: { rank: 'desc' } 
  });

  const ingredients = rawIngredients.map((i) => ({
    ...i,
    priceMod: i.priceMod.toNumber()
  }));

  // 3. Fetch Favorites & User Name
  let favorites: any[] = [];
  let userName = "Guest";

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    
    if (user) {
        // Get the name for the MenuGrid to use as default
        userName = user.firstName || "Guest";

        const rawFavorites = await prisma.savedOrder.findMany({
            where: { userId: user.id },
            include: { product: true }
        });

        favorites = rawFavorites.map(fav => ({
            ...fav,
            customName: fav.name, 
            product: {
                ...fav.product,
                basePrice: fav.product.basePrice.toNumber()
            }
        }));
    }
  }

  return (
    <main className="relative min-h-screen p-6 overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-12 mt-8">
           <div className="relative w-20 h-20 mx-auto mb-4">
             <Image src="/logo.png" alt="Logo" fill className="object-contain drop-shadow-lg" />
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
             Our Menu
           </h1>
           <p className="text-blue-100 text-lg font-light">
             Hand-crafted beverages made fresh.
           </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-200 hover:text-white underline underline-offset-4 text-sm font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        {/* 4. Pass everything (INCLUDING USER NAME) to Grid */}
        <MenuGrid 
            products={products} 
            favorites={favorites} 
            ingredients={ingredients}
            userName={userName} // <--- THIS WAS MISSING
        />

      </div>
    </main>
  );
}