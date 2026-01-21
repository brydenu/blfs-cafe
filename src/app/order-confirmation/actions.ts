'use server';

import { prisma } from "@/lib/db";

// Update guest email on order (from confirmation page)
export async function updateGuestEmail(orderId: number, email: string) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // Update guest email and enable notifications by default
    await prisma.order.update({
      where: { id: orderId },
      data: {
        guestEmail: email,
        notificationsEnabled: true,
        notificationMethods: { email: true, sms: false }
      }
    });

    return { success: true, message: 'Email updated successfully' };
  } catch (error) {
    console.error("Failed to update guest email:", error);
    return { success: false, message: 'Failed to update email' };
  }
}
