import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FavoriteBuilder from "../FavoriteBuilder";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditFavoritePage({ searchParams }: Props) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect("/");

  const resolvedSearchParams = await searchParams;
  const favoriteId = resolvedSearchParams.id ? parseInt(resolvedSearchParams.id as string) : null;

  if (!favoriteId) {
    redirect("/dashboard/favorites");
  }

  // Fetch the favorite
  const favorite = await prisma.savedOrder.findFirst({
    where: {
      id: favoriteId,
      userId: user.id
    },
    include: {
      product: true
    }
  });

  if (!favorite) {
    redirect("/dashboard/favorites");
  }

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
      favorite={{
        id: favorite.id,
        productId: favorite.productId,
        name: favorite.name,
        description: favorite.description,
        configuration: favorite.configuration as any
      }}
    />
  );
}
