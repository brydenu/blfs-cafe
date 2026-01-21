'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCommunication(
  title: string,
  content: string,
  startDate: Date,
  endDate: Date,
  visibilityLocations: string[]
) {
  try {
    await prisma.communication.create({
      data: {
        title,
        content,
        startDate,
        endDate,
        visibilityLocations: visibilityLocations,
      },
    });
    revalidatePath('/admin/communications');
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to create communication:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateCommunication(
  id: number,
  title: string,
  content: string,
  startDate: Date,
  endDate: Date,
  visibilityLocations: string[]
) {
  try {
    await prisma.communication.update({
      where: { id },
      data: {
        title,
        content,
        startDate,
        endDate,
        visibilityLocations: visibilityLocations,
      },
    });
    revalidatePath('/admin/communications');
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update communication:", error);
    return { success: false, message: "Database error" };
  }
}

export async function deleteCommunication(id: number) {
  try {
    await prisma.communication.delete({
      where: { id },
    });
    revalidatePath('/admin/communications');
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete communication:", error);
    return { success: false, message: "Database error" };
  }
}

export async function getCommunications() {
  try {
    const communications = await prisma.communication.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: communications };
  } catch (error) {
    console.error("Failed to get communications:", error);
    return { success: false, message: "Database error" };
  }
}

export async function getCommunication(id: number) {
  try {
    const communication = await prisma.communication.findUnique({
      where: { id },
    });
    return { success: true, data: communication };
  } catch (error) {
    console.error("Failed to get communication:", error);
    return { success: false, message: "Database error" };
  }
}
