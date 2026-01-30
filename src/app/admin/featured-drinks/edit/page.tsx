import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FeaturedDrinkBuilder from "../FeaturedDrinkBuilder";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditFeaturedDrinkPage({ searchParams }: Props) {
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

  const resolvedSearchParams = await searchParams;
  const featuredDrinkId = resolvedSearchParams.id ? parseInt(resolvedSearchParams.id as string) : null;

  if (!featuredDrinkId) {
    redirect("/admin/featured-drinks");
  }

  // Fetch the featured drink
  const featuredDrink = await prisma.featuredDrink.findUnique({
    where: { id: featuredDrinkId },
    include: {
      product: true
    }
  });

  if (!featuredDrink) {
    redirect("/admin/featured-drinks");
  }

  // Fetch all products for selection
  const rawProducts = await prisma.product.findMany({
    where: {
      ...({ deletedAt: null } as any)
    },
    orderBy: { name: 'asc' }
  });

  const products = rawProducts;

  // Fetch ingredients
  const rawIngredients = await prisma.ingredient.findMany({
    where: {
      isAvailable: true,
      isShowing: true
    },
    orderBy: { rank: 'desc' }
  });

  const ingredients = rawIngredients;

  return (
    <FeaturedDrinkBuilder
      products={products}
      ingredients={ingredients}
      featuredDrink={{
        id: featuredDrink.id,
        productId: featuredDrink.productId,
        name: featuredDrink.name,
        description: featuredDrink.description,
        configuration: featuredDrink.configuration as any,
        isActive: featuredDrink.isActive
      }}
    />
  );
}
