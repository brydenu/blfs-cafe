'use server'

import { prisma } from "@/lib/db"

export type MenuCategory = 'coffee' | 'tea' | 'other'

export async function getMenu() {
  // 1. Fetch all active products (not deleted)
  const products = await prisma.product.findMany({
    where: { 
      isActive: true,
      ...({ deletedAt: null } as any) // Type assertion until Prisma client is regenerated
    },
    orderBy: { name: 'asc' }
  })

  // 2. Group them by category manually (Simple modular logic)
  const menu = {
    coffee: products.filter(p => p.category === 'coffee'),
    tea: products.filter(p => p.category === 'tea'),
    other: products.filter(p => p.category === 'other'),
  }

  return menu
}