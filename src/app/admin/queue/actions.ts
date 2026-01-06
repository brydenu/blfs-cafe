'use server';

import { prisma } from "@/lib/db";
import { triggerSocketEvent } from "@/lib/socket";
import { sendNotification } from "@/lib/notifications"; // Import your new notification system

export async function completeOrderItem(itemId: number) {
  try {
    // 1. Mark the specific item as completed
    // We include 'product' so we can use the name in notifications
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: 'completed' },
      include: { 
        order: true,
        product: true 
      } 
    });

    // 2. Check if the parent Order has any items LEFT to do
    // We count items in the SAME order that are NOT completed
    const remainingItems = await prisma.orderItem.count({
      where: {
        orderId: updatedItem.orderId,
        status: { not: 'completed' }
      }
    });

    // 3. LOGIC FOR NOTIFICATIONS & ORDER COMPLETION
    if (remainingItems === 0) {
      // --- SCENARIO: ORDER COMPLETE (Solo or Last Item of Group) ---
      
      // A. Update Order Status in DB
      const completedOrder = await prisma.order.update({
        where: { id: updatedItem.orderId },
        data: { status: 'completed' },
        include: { user: true } // Need user to access email
      });

      // B. TRIGGER EMAIL NOTIFICATION
      // Try to find an email (User Account Email OR Guest Email)
      const recipientEmail = completedOrder.user?.email || completedOrder.guestEmail;

      if (recipientEmail) {
        // We don't await this because we don't want to slow down the UI 
        // while the email sends. It runs in the background.
        sendNotification('ORDER_COMPLETED', recipientEmail, {
            name: completedOrder.guestName || completedOrder.user?.firstName || "Guest",
            publicId: completedOrder.publicId.split('-')[0], // Short ID (e.g., c123)
            publicIdFull: completedOrder.publicId // Full ID for links
        }).catch(err => console.error("Background email failed:", err));
      }

      // C. Emit "Order Completed" Socket Event (For Tracker)
      triggerSocketEvent("order-update", { 
        type: 'order-completed', 
        orderId: updatedItem.orderId,
        publicId: updatedItem.order.publicId,
        userId: updatedItem.order.userId,
      });

    } else {
      // --- SCENARIO: ITEM COMPLETE (Group Order, items remaining) ---
      
      // Emit "Item Completed" Socket Event
      triggerSocketEvent("order-update", { 
        type: 'item-completed',
        orderId: updatedItem.orderId,
        itemName: updatedItem.product.name,
        recipientName: updatedItem.recipientName || "Guest",
        userId: updatedItem.order.userId,
      });
    }

    // 4. Always trigger Admin Queue Refresh (Barista Screen)
    triggerSocketEvent("refresh-queue", { type: 'refresh' });

    return { success: true };
  } catch (error) {
    console.error("Failed to complete item:", error);
    return { success: false };
  }
}