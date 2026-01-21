import { getIngredientUsageStats } from "../../actions";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function IngredientUsagePage() {
  const result = await getIngredientUsageStats();
  
  if (!result.success || !result.data) {
    return (
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-red-900/20 border border-red-700 p-4 rounded-xl">
          <p className="text-red-400">Failed to load ingredient usage statistics. Please try again.</p>
        </div>
      </div>
    );
  }

  const { ingredients, totalDrinks } = result.data;

  // Group ingredients by category
  const ingredientsByCategory = ingredients.reduce((acc, ingredient) => {
    const category = ingredient.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ingredient);
    return acc;
  }, {} as Record<string, typeof ingredients>);

  // Get sorted categories
  const categories = Object.keys(ingredientsByCategory).sort();

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/admin/statistics"
        className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium"
      >
        ← Back to Statistics
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Ingredient Usage Statistics</h1>
          <p className="text-gray-400 font-medium">Detailed ingredient usage across all timeframes</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Drinks (Today)</p>
          <p className="text-2xl font-black text-white">{totalDrinks.today}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Drinks (Week)</p>
          <p className="text-2xl font-black text-white">{totalDrinks.week}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Drinks (Month)</p>
          <p className="text-2xl font-black text-white">{totalDrinks.month}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Drinks (All Time)</p>
          <p className="text-2xl font-black text-white">{totalDrinks.allTime}</p>
        </div>
      </div>

      {/* Ingredients Tables by Category */}
      {categories.map((category) => (
        <div key={category} className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 overflow-x-auto">
          <h2 className="text-xl font-black text-white mb-4 capitalize">{category} Ingredients</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-black text-gray-400 uppercase tracking-wider">
                    Ingredient
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-black text-gray-400 uppercase tracking-wider">
                    Today
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-black text-gray-400 uppercase tracking-wider">
                    Last Week
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-black text-gray-400 uppercase tracking-wider">
                    Last Month
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-black text-gray-400 uppercase tracking-wider">
                    All Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {ingredientsByCategory[category].map((ingredient) => (
                  <tr
                    key={ingredient.id}
                    className="border-b border-gray-900 hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="text-white font-bold">{ingredient.name}</span>
                    </td>
                    {/* Today */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white font-black text-lg">{ingredient.today.drinks}</span>
                        <span className="text-gray-400 text-xs font-bold">
                          {ingredient.today.usagePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    {/* Week */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white font-black text-lg">{ingredient.week.drinks}</span>
                        <span className="text-gray-400 text-xs font-bold">
                          {ingredient.week.usagePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    {/* Month */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white font-black text-lg">{ingredient.month.drinks}</span>
                        <span className="text-gray-400 text-xs font-bold">
                          {ingredient.month.usagePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    {/* All Time */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white font-black text-lg">{ingredient.allTime.drinks}</span>
                        <span className="text-gray-400 text-xs font-bold">
                          {ingredient.allTime.usagePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <p className="text-gray-400 text-center py-4">No ingredients found</p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <p className="text-xs text-gray-400 font-medium">
          <span className="font-black text-gray-300">Usage %</span> represents the percentage of drinks that included this ingredient within the specified timeframe.
          <br />
          <span className="font-black text-gray-300">Drinks</span> represents the total number of drinks (counting quantity) that included this ingredient.
        </p>
      </div>
    </div>
  );
}
