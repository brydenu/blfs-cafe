'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createFeaturedDrink(
  productId: number,
  name: string,
  description: string | null,
  configuration: any
) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== 'admin') {
    return { success: false, message: "Unauthorized" };
  }

  try {
    // Verify product exists and is not deleted
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ...({ deletedAt: null } as any)
      }
    });

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    await prisma.featuredDrink.create({
      data: {
        productId,
        name,
        description: description || null,
        configuration,
        isActive: true
      }
    });

    revalidatePath('/admin/featured-drinks');
    revalidatePath('/menu');

    return { success: true };
  } catch (error) {
    console.error("Failed to create featured drink:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateFeaturedDrink(
  featuredDrinkId: number,
  name: string,
  description: string | null,
  configuration: any,
  isActive: boolean
) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== 'admin') {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.featuredDrink.update({
      where: { id: featuredDrinkId },
      data: {
        name,
        description: description || null,
        configuration,
        isActive
      }
    });

    revalidatePath('/admin/featured-drinks');
    revalidatePath('/menu');

    return { success: true };
  } catch (error) {
    console.error("Failed to update featured drink:", error);
    return { success: false, message: "Database error" };
  }
}

export async function deleteFeaturedDrink(featuredDrinkId: number) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== 'admin') {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.featuredDrink.delete({
      where: { id: featuredDrinkId }
    });

    revalidatePath('/admin/featured-drinks');
    revalidatePath('/menu');

    return { success: true };
  } catch (error) {
    console.error("Failed to delete featured drink:", error);
    return { success: false, message: "Database error" };
  }
}

export async function toggleFeaturedDrinkActive(featuredDrinkId: number, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== 'admin') {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.featuredDrink.update({
      where: { id: featuredDrinkId },
      data: { isActive }
    });

    revalidatePath('/admin/featured-drinks');
    revalidatePath('/menu');

    return { success: true };
  } catch (error) {
    console.error("Failed to toggle featured drink:", error);
    return { success: false, message: "Database error" };
  }
}
