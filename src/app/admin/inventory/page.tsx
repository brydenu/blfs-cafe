import { prisma } from "@/lib/db";
import { IngredientManager } from "./IngredientManager";
import { CreateIngredientForm } from "./CreateIngredientForm";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  // Helper function to check if a name contains "sugar free"
  const isSugarFree = (name: string) => name.toLowerCase().includes('sugar free');

  // Group by category and apply custom sorting
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

  // Apply custom sorting for each category
  Object.keys(ingredientsByCategory).forEach(category => {
    if (category === 'syrup') {
      // For syrups: featured first (by rank ascending), then non-featured alphabetical (sugar-free last)
      const syrups = ingredientsByCategory[category];
      const featuredSyrups = syrups.filter(s => s.rank > 0).sort((a, b) => a.rank - b.rank);
      const nonFeaturedSyrups = syrups.filter(s => s.rank === 0).sort((a, b) => {
        const aIsSugarFree = isSugarFree(a.name);
        const bIsSugarFree = isSugarFree(b.name);
        if (aIsSugarFree && !bIsSugarFree) return 1;
        if (!aIsSugarFree && bIsSugarFree) return -1;
        return a.name.localeCompare(b.name);
      });
      ingredientsByCategory[category] = [...featuredSyrups, ...nonFeaturedSyrups];
    } else {
      // For other categories: alphabetical
      ingredientsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
    }
  });

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

      {/* Create New Ingredient Form */}
      <CreateIngredientForm />

    </div>
  );
}
