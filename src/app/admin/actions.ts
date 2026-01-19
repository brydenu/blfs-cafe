'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { triggerSocketEvent } from "@/lib/socket";

export async function updateOrderStatus(orderId: number, newStatus: string) {
  try {
    // 1. Update the DB
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    // 2. SIGNAL THE NETWORK (Event-Driven)
    // This tells other iPads/screens to refresh
    try {
        triggerSocketEvent("status-update", { 
            orderId, 
            status: newStatus 
        });
    } catch (socketError) {
        console.error("Socket trigger failed:", socketError);
    }

    // 3. Revalidate Server Cache for the user triggering the action
    revalidatePath('/admin/queue');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update order:", error);
    return { success: false, message: "Database error" };
  }
}

// --- INGREDIENT MANAGEMENT ---

export async function updateIngredientAvailability(ingredientId: number, isAvailable: boolean) {
  try {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { isAvailable }
    });
    revalidatePath('/admin/inventory');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update ingredient availability:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateIngredientVisibility(ingredientId: number, isShowing: boolean) {
  try {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { isShowing }
    });
    revalidatePath('/admin/inventory');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update ingredient visibility:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateIngredientRank(ingredientId: number, rank: number) {
  try {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { rank }
    });
    revalidatePath('/admin/inventory');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to update ingredient rank:", error);
    return { success: false, message: "Database error" };
  }
}

// --- SCHEDULE MANAGEMENT ---

export async function updateSchedule(
  dayOfWeek: number,
  openTime1: string,
  closeTime1: string,
  openTime2: string | null,
  closeTime2: string | null,
  isSecondPeriodActive: boolean,
  isOpen: boolean
) {
  try {
    await prisma.schedule.upsert({
      where: { dayOfWeek },
      update: {
        openTime1,
        closeTime1,
        openTime2,
        closeTime2,
        isSecondPeriodActive,
        isOpen
      },
      create: {
        dayOfWeek,
        openTime1,
        closeTime1,
        openTime2,
        closeTime2,
        isSecondPeriodActive,
        isOpen
      }
    });
    revalidatePath('/admin/schedule');
    return { success: true };
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return { success: false, message: "Database error" };
  }
}

// --- STATISTICS ---

export async function getTodayStatistics() {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const startOfDay = new Date(`${todayStr}T00:00:00`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999`);

    const ordersToday = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'cancelled' }
      },
      include: {
        items: {
          include: {
            product: true,
            modifiers: {
              include: { ingredient: true }
            }
          }
        }
      }
    });

    let totalDrinks = 0;
    let totalHot = 0;
    let totalIced = 0;
    let totalCafShots = 0;
    let totalDecafShots = 0;

    ordersToday.forEach(order => {
      order.items.forEach(item => {
        totalDrinks += item.quantity;

        // Temperature
        const temp = (item.temperature || "").toLowerCase();
        if (temp.includes('iced')) {
          totalIced += item.quantity;
        } else {
          totalHot += item.quantity;
        }

        // Shots
        const shots = item.shots || 0;
        if (item.product.category === 'coffee' && shots > 0) {
          const isDecaf = item.product.name.toLowerCase().includes('decaf') ||
                         item.modifiers.some(m => m.ingredient.name.toLowerCase().includes('decaf'));
          if (isDecaf) {
            totalDecafShots += shots * item.quantity;
          } else {
            totalCafShots += shots * item.quantity;
          }
        }
      });
    });

    return {
      success: true,
      data: {
        totalDrinks,
        totalHot,
        totalIced,
        totalCafShots,
        totalDecafShots
      }
    };
  } catch (error) {
    console.error("Failed to get today statistics:", error);
    return { success: false, message: "Database error" };
  }
}