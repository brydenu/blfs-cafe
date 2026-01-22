import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FavoriteBuilder from "../FavoriteBuilder";

export const dynamic = 'force-dynamic';

export default async function NewFavoritePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect("/");

  // Fetch all products for selection
  const rawProducts = await prisma.product.findMany({
    where: {
      ...({ deletedAt: null } as any)
    },
    orderBy: { name: 'asc' }
  });

  const products = rawProducts.map(p => ({
    ...p,
    basePrice: p.basePrice.toNumber()
  }));

  // Fetch ingredients
  const rawIngredients = await prisma.ingredient.findMany({
    where: {
      isAvailable: true,
      isShowing: true
    },
    orderBy: { rank: 'desc' }
  });

  const ingredients = rawIngredients.map(i => ({
    ...i,
    priceMod: i.priceMod.toNumber()
  }));

  return (
    <FavoriteBuilder
      products={products}
      ingredients={ingredients}
      userFirstName={user.firstName || "Guest"}
      userLastName={user.lastName}
    />
  );
}
