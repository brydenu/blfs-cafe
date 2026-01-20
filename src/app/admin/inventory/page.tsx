import { prisma } from "@/lib/db";
import { IngredientManager } from "./IngredientManager";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: [
      { category: 'asc' },
      { rank: 'desc' },
      { name: 'asc' }
    ]
  });

  // Group by category
  const ingredientsByCategory = ingredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push({
      ...ingredient,
      priceMod: Number(ingredient.priceMod)
    });
    return acc;
  }, {} as Record<string, typeof ingredients>);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Inventory Management</h1>
          <p className="text-gray-400 font-medium">Manage ingredients, stock, and featured flavors</p>
        </div>
      </div>

      {/* Ingredients by Category */}
      <div className="space-y-8">
        {Object.entries(ingredientsByCategory).map(([category, categoryIngredients]) => (
          <div key={category} className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6 capitalize">
              {category} ({categoryIngredients.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIngredients.map((ingredient) => (
                <IngredientManager key={ingredient.id} ingredient={ingredient} />
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
