'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- PRODUCT AVAILABILITY ---

export async function updateProductAvailability(productId: number, isActive: boolean) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive }
    });
    revalidatePath('/admin/menu');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update product availability:", error);
    return { success: false, message: "Database error" };
  }
}

// --- PRODUCT UPDATE ---

export async function updateProduct(
  productId: number,
  data: {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    category?: string;
    requiresMilk?: boolean;
    allowsShots?: boolean;
    defaultShots?: number;
    forceTemperature?: string | null;
    isSeasonal?: boolean;
  }
) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data
    });
    revalidatePath('/admin/menu');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, message: "Database error" };
  }
}

// --- PRODUCT CREATE ---

export async function createProduct(data: {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  requiresMilk: boolean;
  allowsShots: boolean;
  defaultShots: number;
  forceTemperature: string | null;
  isSeasonal?: boolean;
}) {
  try {
    await prisma.product.create({
      data: {
        ...data,
        isActive: true
      }
    });
    revalidatePath('/admin/menu');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, message: "Database error" };
  }
}

// --- PRODUCT DELETE ---

export async function deleteProduct(productId: number) {
  try {
    // Soft delete: Set deletedAt timestamp instead of hard deleting
    // This allows deletion even if product has been ordered
    await prisma.product.update({
      where: { id: productId },
      data: { 
        ...({ deletedAt: new Date() } as any), // Type assertion until Prisma client is regenerated
        isActive: false // Also deactivate it
      }
    });
    revalidatePath('/admin/menu');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, message: "Database error" };
  }
}
