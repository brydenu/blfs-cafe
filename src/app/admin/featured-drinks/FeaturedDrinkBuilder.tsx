'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createFeaturedDrink, updateFeaturedDrink } from "./actions";
import CustomizeForm from "@/app/menu/[id]/CustomizeForm";

interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  basePrice: number;
  imageUrl: string | null;
  requiresMilk: boolean;
  allowsShots: boolean;
  defaultShots: number;
  forceTemperature: string | null;
  isActive: boolean;
  isSeasonal: boolean;
  deletedAt: Date | null;
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
  priceMod: number;
  isAvailable: boolean;
  isShowing: boolean;
  rank: number;
}

interface FeaturedDrinkBuilderProps {
  products: Product[];
  ingredients: Ingredient[];
  featuredDrink?: {
    id: number;
    productId: number;
    name: string;
    description: string | null;
    configuration: any;
    isActive: boolean;
  };
}

export default function FeaturedDrinkBuilder({
  products,
  ingredients,
  featuredDrink
}: FeaturedDrinkBuilderProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    featuredDrink ? featuredDrink.productId : null
  );
  const [drinkName, setDrinkName] = useState(featuredDrink?.name || "");
  const [drinkDescription, setDrinkDescription] = useState(featuredDrink?.description || "");
  const [isActive, setIsActive] = useState(featuredDrink?.isActive ?? true);
  const [configuration, setConfiguration] = useState<any>(featuredDrink?.configuration || null);

  const selectedProduct = selectedProductId
    ? products.find(p => p.id === selectedProductId)
    : null;

  const handleSave = async () => {
    if (!selectedProductId) {
      alert("Please select a product");
      return;
    }

    if (!drinkName.trim()) {
      alert("Please enter a name for the featured drink");
      return;
    }

    if (!configuration) {
      alert("Please customize your drink first");
      return;
    }

    setIsSaving(true);

    try {
      if (featuredDrink) {
        // Update existing featured drink
        const result = await updateFeaturedDrink(
          featuredDrink.id,
          drinkName.trim(),
          drinkDescription.trim() || null,
          configuration,
          isActive
        );

        if (result.success) {
          router.push("/admin/featured-drinks");
        } else {
          alert(result.message || "Failed to update featured drink");
          setIsSaving(false);
        }
      } else {
        // Create new featured drink
        const result = await createFeaturedDrink(
          selectedProductId,
          drinkName.trim(),
          drinkDescription.trim() || null,
          configuration
        );

        if (result.success) {
          router.push("/admin/featured-drinks");
        } else {
          alert(result.message || "Failed to save featured drink");
          setIsSaving(false);
        }
      }
    } catch (error) {
      console.error("Error saving featured drink:", error);
      alert("An error occurred");
      setIsSaving(false);
    }
  };

  // If no product selected, show product selection
  if (!selectedProductId) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black text-white">
            {featuredDrink ? "Edit Featured Drink" : "Create Featured Drink"}
          </h1>
          <Link href="/admin/featured-drinks">
            <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer">
              ← Cancel
            </button>
          </Link>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">
            Select a Product
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className="p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl text-left transition-all cursor-pointer text-white"
              >
                <div className="font-bold">{product.name}</div>
                {product.description && (
                  <div className="text-sm text-gray-400 mt-1">{product.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Product selected, show customization form
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-white">
          {featuredDrink ? "Edit Featured Drink" : "Create Featured Drink"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedProductId(null)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer"
          >
            Change Product
          </button>
          <Link href="/admin/featured-drinks">
            <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer">
              Cancel
            </button>
          </Link>
        </div>
      </div>

      {/* Name, Description, and Active Toggle */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Featured Drink Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={drinkName}
            onChange={(e) => setDrinkName(e.target.value)}
            placeholder="e.g., Summer Special Latte"
            className="w-full p-3 rounded-xl border-2 border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:border-[#32A5DC] outline-none font-medium"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Description (Optional)
          </label>
          <textarea
            value={drinkDescription}
            onChange={(e) => setDrinkDescription(e.target.value)}
            placeholder="Add a description for this featured drink..."
            rows={2}
            className="w-full p-3 rounded-xl border-2 border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:border-[#32A5DC] outline-none font-medium resize-none"
          />
        </div>
        {featuredDrink && (
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-[#32A5DC] focus:ring-[#32A5DC] cursor-pointer"
              />
              <span className="text-sm font-bold text-white">Active (visible in menu)</span>
            </label>
          </div>
        )}
      </div>

      {/* Customize Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <FeaturedDrinkCustomizeForm
          product={selectedProduct!}
          ingredients={ingredients}
          initialConfig={featuredDrink?.configuration}
          onConfigurationChange={setConfiguration}
        />
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <Link href="/admin/featured-drinks" className="flex-1">
          <button className="w-full py-4 px-6 rounded-xl border-2 border-gray-700 text-white font-bold text-center hover:bg-gray-800 transition-all cursor-pointer">
            Cancel
          </button>
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving || !drinkName.trim() || !configuration}
          className="flex-1 bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? "Saving..." : featuredDrink ? "Update Featured Drink" : "Create Featured Drink"}
        </button>
      </div>
    </div>
  );
}

// Wrapper component to capture configuration from CustomizeForm
function FeaturedDrinkCustomizeForm({
  product,
  ingredients,
  initialConfig,
  onConfigurationChange
}: {
  product: Product;
  ingredients: Ingredient[];
  initialConfig?: any;
  onConfigurationChange: (config: any) => void;
}) {
  // Set initial config
  useEffect(() => {
    if (initialConfig) {
      onConfigurationChange(initialConfig);
    }
  }, [initialConfig, onConfigurationChange]);

  return (
    <CustomizeForm
      product={product}
      ingredients={ingredients}
      defaultName="Featured"
      defaultDisplayName="Featured"
      onConfigChange={onConfigurationChange}
      hideNameField={true}
      hideOrderButtons={true}
    />
  );
}
