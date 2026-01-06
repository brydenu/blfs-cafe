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