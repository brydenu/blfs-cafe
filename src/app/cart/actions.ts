'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth"; // Assuming you use NextAuth/Auth.js
import { CartItem } from "@/providers/CartProvider";
import { triggerSocketEvent } from "@/lib/socket"; // <--- 1. Import this

export async function placeOrder(items: CartItem[]) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (items.length === 0) {
    return { success: false, message: "Cart is empty" };
  }

  try {
    // 1. Resolve User
    let userId = null;
    let guestEmail = null;
    let guestName = null; // We could capture this from a form if needed

    if (userEmail) {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) userId = user.id;
    }

    // 2. Create the Order
    // We calculate total roughly here, or trust the client (better to recalc in real app)
    const total = items.reduce((sum, item) => sum + (item.basePrice || 0), 0);

    const order = await prisma.order.create({
      data: {
        userId,
        guestEmail, // If you had a guest email input
        guestName,  // If you had a guest name input
        status: 'queued',
        total: total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: 1,
            shots: item.shots,
            temperature: item.temperature,
            milkName: item.milkName,
            recipientName: item.recipientName,
            specialInstructions: item.notes || "", // Use notes field
            personalCup: item.personalCup || false,
            caffeineType: item.caffeineType || null,
            // completed_at defaults to null (not completed)
            // cancelled defaults to false
            modifiers: {
              create: Object.entries(item.modifiers).map(([ingId, qty]) => ({
                ingredientId: parseInt(ingId),
                quantity: qty
              }))
            }
          }))
        }
      }
    });

    // 3. TRIGGER SOCKET EVENT
    // This tells the Admin Screen to refresh immediately
    triggerSocketEvent("refresh-queue", { 
        type: 'new-order', 
        orderId: order.id 
    });

    return { success: true, orderId: order.publicId };

  } catch (error) {
    console.error("Order placement failed:", error);
    return { success: false, message: "Database error" };
  }
}