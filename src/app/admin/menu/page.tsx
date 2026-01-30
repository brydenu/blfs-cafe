import { prisma } from "@/lib/db";
import MenuManager from "./MenuManager";

export const dynamic = 'force-dynamic';

export default async function AdminMenuPage() {
  const products = await prisma.product.findMany({
    where: {
      ...({ deletedAt: null } as any) // Type assertion until Prisma client is regenerated
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  const serializedProducts = products.map(p => {
    const { basePrice, ...productWithoutPrice } = p;
    return productWithoutPrice;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Menu Management</h1>
          <p className="text-gray-400 font-medium">Manage menu items, availability, and product details</p>
        </div>
      </div>

      <MenuManager products={serializedProducts} />
    </div>
  );
}
