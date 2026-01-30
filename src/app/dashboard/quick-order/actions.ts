'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { placeOrder } from "@/app/cart/actions";
import { CartItem } from "@/providers/CartProvider";

export async function getLastOrderedDrink() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return null;
  }

  // Get the most recent order item for this user
  const lastOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: { not: 'cancelled' }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true,
          modifiers: {
            include: {
              ingredient: true
            }
          }
        },
        orderBy: { id: 'asc' },
        take: 1 // Get the first item from the most recent order
      }
    }
  });

  if (!lastOrder || lastOrder.items.length === 0) {
    return null;
  }

  const item = lastOrder.items[0];

  // Build configuration from order item
  const modifiers: Record<number, number> = {};
  item.modifiers.forEach(mod => {
    modifiers[mod.ingredientId] = mod.quantity;
  });

  const config = {
    shots: item.shots,
    temperature: item.temperature || "Hot",
    milkId: item.milkName && item.milkName !== "No Milk" 
      ? (await prisma.ingredient.findFirst({ where: { name: item.milkName, category: 'milk' } }))?.id || null
      : null,
    modifiers: modifiers,
    cupType: item.cupType || 'to-go',
    caffeineType: item.caffeineType || undefined,
    milkSteamed: item.milkSteamed || undefined,
    foamLevel: item.foamLevel || undefined,
    milkAmount: item.milkAmount || undefined,
    notes: item.specialInstructions || undefined,
  };

  return {
    product: {
      id: item.product.id,
      name: item.product.name,
      category: item.product.category,
      imageUrl: item.product.imageUrl
    },
    configuration: config,
    recipientName: item.recipientName || "Last Order"
  };
}

export async function placeQuickOrder(
  productId: number,
  configuration: any,
  cupType: string,
  notes?: string
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

  // Verify product exists
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      ...({ deletedAt: null } as any)
    }
  });

  if (!product) {
    return { success: false, message: "Product not found" };
  }

  // Get ingredients for milk name resolution
  const ingredients = await prisma.ingredient.findMany();

  // Build cart item from configuration
  let milkName = "No Milk";
  if (configuration.milkId) {
    const milk = ingredients.find(i => i.id === configuration.milkId);
    if (milk) milkName = milk.name;
  }

  const syrupDetails: string[] = [];
  if (configuration.modifiers) {
    Object.entries(configuration.modifiers).forEach(([idStr, count]: [string, any]) => {
      if (count > 0) {
        const ing = ingredients.find(i => i.id === parseInt(idStr));
        if (ing) syrupDetails.push(`${ing.name} (${count})`);
      }
    });
  }

  const cartItem: CartItem = {
    internalId: Date.now().toString(),
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    recipientName: user.firstName || "Guest",
    shots: configuration.shots || 0,
    temperature: configuration.temperature || "Hot",
    milkName: milkName,
    syrupDetails: syrupDetails,
    modifiers: configuration.modifiers || {},
    milkId: configuration.milkId || undefined,
    cupType: cupType || 'to-go',
    caffeineType: configuration.caffeineType,
    milkSteamed: configuration.milkSteamed,
    foamLevel: configuration.foamLevel,
    milkAmount: configuration.milkAmount,
    notes: notes || configuration.notes
  };

  // Place the order
  const result = await placeOrder([cartItem]);

  return result;
}
