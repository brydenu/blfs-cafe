import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FeaturedDrinksList from "./FeaturedDrinksList";

export const dynamic = 'force-dynamic';

export default async function AdminFeaturedDrinksPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== 'admin') {
    redirect("/");
  }

  // Fetch all featured drinks
  const rawFeaturedDrinks = await prisma.featuredDrink.findMany({
    include: {
      product: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter out featured drinks where product was deleted
  const validFeaturedDrinks = rawFeaturedDrinks.filter(fd => fd.product && (fd.product as any).deletedAt === null);

  const featuredDrinks = validFeaturedDrinks.map(fd => ({
    ...fd,
    product: (() => {
      const { basePrice, ...productWithoutPrice } = fd.product!;
      return productWithoutPrice;
    })()
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Featured Drinks</h1>
          <p className="text-gray-400 font-medium">Manage featured drinks that appear in the menu</p>
        </div>
      </div>

      <FeaturedDrinksList featuredDrinks={featuredDrinks} />
    </div>
  );
}
