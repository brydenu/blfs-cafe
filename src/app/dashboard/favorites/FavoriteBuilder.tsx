'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/providers/ToastProvider";
import { createFavorite, updateFavorite } from "./actions";
import CustomizeForm from "@/app/menu/[id]/CustomizeForm";

interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  requiresMilk: boolean;
  allowsShots: boolean;
  defaultShots: number;
  forceTemperature: string | null;
  isActive: boolean;
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
  isAvailable: boolean;
  isShowing: boolean;
  rank: number;
}

interface FavoriteBuilderProps {
  products: Product[];
  ingredients: Ingredient[];
  userFirstName: string;
  userLastName: string | null;
  favorite?: {
    id: number;
    productId: number;
    name: string;
    description: string | null;
    configuration: any;
  };
}

export default function FavoriteBuilder({
  products,
  ingredients,
  userFirstName,
  userLastName,
  favorite
}: FavoriteBuilderProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    favorite ? favorite.productId : null
  );
  const [favoriteName, setFavoriteName] = useState(favorite?.name || "");
  const [favoriteDescription, setFavoriteDescription] = useState(favorite?.description || "");
  const [configuration, setConfiguration] = useState<any>(favorite?.configuration || null);

  const selectedProduct = selectedProductId
    ? products.find(p => p.id === selectedProductId)
    : null;

  const handleSave = async () => {
    if (!selectedProductId) {
      showToast("Please select a product");
      return;
    }

    if (!favoriteName.trim()) {
      showToast("Please enter a name for your favorite");
      return;
    }

    if (!configuration) {
      showToast("Please customize your drink first");
      return;
    }

    setIsSaving(true);

    try {
      if (favorite) {
        // Update existing favorite
        const result = await updateFavorite(
          favorite.id,
          favoriteName.trim(),
          favoriteDescription.trim() || null,
          configuration
        );

        if (result.success) {
          showToast("Favorite updated!");
          router.push("/dashboard/favorites");
        } else {
          showToast(result.message || "Failed to update favorite");
          setIsSaving(false);
        }
      } else {
        // Create new favorite
        const result = await createFavorite(
          selectedProductId,
          favoriteName.trim(),
          favoriteDescription.trim() || null,
          configuration
        );

        if (result.success) {
          showToast("Favorite saved!");
          router.push("/dashboard/favorites");
        } else {
          showToast(result.message || "Failed to save favorite");
          setIsSaving(false);
        }
      }
    } catch (error) {
      console.error("Error saving favorite:", error);
      showToast("An error occurred");
      setIsSaving(false);
    }
  };

  // If no product selected, show product selection
  if (!selectedProductId) {
    return (
      <main className="min-h-screen relative overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 z-0 bg-[#004876] fixed">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-3xl p-6 space-y-6 pb-20">
          <header className="mb-2 flex items-center justify-between">
            <h1 className="text-3xl font-black text-white">
              {favorite ? "Edit Favorite" : "Create New Favorite"}
            </h1>
            <Link href="/dashboard/favorites">
              <button className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all shadow-lg hover:scale-105 cursor-pointer">
                ← Cancel
              </button>
            </Link>
          </header>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-widest block mb-3">
              Select a Product
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-left transition-all cursor-pointer text-white"
                >
                  <div className="font-bold">{product.name}</div>
                  {product.description && (
                    <div className="text-sm text-blue-200 mt-1">{product.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Product selected, show customization form
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl p-6 space-y-6 pb-20">
        <header className="mb-2 flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">
            {favorite ? "Edit Favorite" : "Create New Favorite"}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedProductId(null)}
              className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              Change Product
            </button>
            <Link href="/dashboard/favorites">
              <button className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all shadow-lg hover:scale-105 cursor-pointer">
                Cancel
              </button>
            </Link>
          </div>
        </header>

        {/* Name and Description Inputs */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-widest block mb-2">
              Favorite Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={favoriteName}
              onChange={(e) => setFavoriteName(e.target.value)}
              placeholder="e.g., My Morning Latte"
              className="w-full p-3 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-[#32A5DC] outline-none font-medium"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-widest block mb-2">
              Description (Optional)
            </label>
            <textarea
              value={favoriteDescription}
              onChange={(e) => setFavoriteDescription(e.target.value)}
              placeholder="Add a description to help you remember this favorite..."
              rows={2}
              className="w-full p-3 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-[#32A5DC] outline-none font-medium resize-none"
            />
          </div>
        </div>

        {/* Customize Form - Pass config via URL and use a modified approach */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <FavoriteCustomizeForm
            product={selectedProduct!}
            ingredients={ingredients}
            defaultName={userFirstName}
            defaultDisplayName={userFirstName}
            userLastName={userLastName}
            initialConfig={favorite?.configuration}
            onConfigurationChange={setConfiguration}
          />
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <Link href="/dashboard/favorites" className="flex-1">
            <button className="w-full py-4 px-6 rounded-xl border-2 border-white/20 text-white font-bold text-center hover:bg-white/10 transition-all cursor-pointer">
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || !favoriteName.trim() || !configuration}
            className="flex-1 bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? "Saving..." : favorite ? "Update Favorite" : "Save Favorite"}
          </button>
        </div>
      </div>
    </main>
  );
}

// Wrapper component to capture configuration from CustomizeForm
function FavoriteCustomizeForm({
  product,
  ingredients,
  defaultName,
  defaultDisplayName,
  userLastName,
  initialConfig,
  onConfigurationChange
}: {
  product: Product;
  ingredients: Ingredient[];
  defaultName: string;
  defaultDisplayName: string;
  userLastName: string | null;
  initialConfig?: any;
  onConfigurationChange: (config: any) => void;
}) {
  // Set initial config when it changes (for editing)
  useEffect(() => {
    if (initialConfig) {
      onConfigurationChange(initialConfig);
    }
  }, [initialConfig, onConfigurationChange]);

  return (
    <CustomizeForm
      product={product}
      ingredients={ingredients}
      defaultName={defaultName}
      defaultDisplayName={defaultDisplayName}
      userLastName={userLastName}
      onConfigChange={onConfigurationChange}
      hideNameField={true}
      hideOrderButtons={true}
      initialConfigProp={initialConfig}
    />
  );
}
