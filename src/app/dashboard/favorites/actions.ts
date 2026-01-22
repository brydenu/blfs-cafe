'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createFavorite(
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

  if (!user) {
    return { success: false, message: "User not found" };
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

    await prisma.savedOrder.create({
      data: {
        userId: user.id,
        productId,
        name,
        description: description || null,
        configuration
      }
    });

    revalidatePath('/dashboard/favorites');
    revalidatePath('/menu');
    revalidatePath('/dashboard/quick-order');

    return { success: true };
  } catch (error) {
    console.error("Failed to create favorite:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateFavorite(
  favoriteId: number,
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

  if (!user) {
    return { success: false, message: "User not found" };
  }

  try {
    // Verify the favorite belongs to the user
    const favorite = await prisma.savedOrder.findFirst({
      where: {
        id: favoriteId,
        userId: user.id
      }
    });

    if (!favorite) {
      return { success: false, message: "Favorite not found" };
    }

    await prisma.savedOrder.update({
      where: { id: favoriteId },
      data: {
        name,
        description: description || null,
        configuration
      }
    });

    revalidatePath('/dashboard/favorites');
    revalidatePath('/menu');
    revalidatePath('/dashboard/quick-order');

    return { success: true };
  } catch (error) {
    console.error("Failed to update favorite:", error);
    return { success: false, message: "Database error" };
  }
}

export async function deleteFavorite(favoriteId: number) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  try {
    // Verify the favorite belongs to the user
    const favorite = await prisma.savedOrder.findFirst({
      where: {
        id: favoriteId,
        userId: user.id
      }
    });

    if (!favorite) {
      return { success: false, message: "Favorite not found" };
    }

    await prisma.savedOrder.delete({
      where: { id: favoriteId }
    });

    revalidatePath('/dashboard/favorites');
    revalidatePath('/menu');
    revalidatePath('/dashboard/quick-order');

    return { success: true };
  } catch (error) {
    console.error("Failed to delete favorite:", error);
    return { success: false, message: "Database error" };
  }
}
