'use client';

import { useState, useTransition, useEffect } from "react";
import { 
  updateIngredientAvailability, 
  updateIngredientVisibility, 
  updateIngredientRank 
} from "../actions";

interface IngredientManagerProps {
  ingredient: {
    id: number;
    name: string;
    category: string;
    isAvailable: boolean;
    isShowing: boolean;
    rank: number;
  };
}

export function IngredientManager({ ingredient: initialIngredient }: IngredientManagerProps) {
  const [ingredient, setIngredient] = useState(initialIngredient);
  const [rankInputValue, setRankInputValue] = useState(initialIngredient.rank.toString());
  const [isPending, startTransition] = useTransition();

  // Sync local state when prop changes
  useEffect(() => {
    setIngredient(initialIngredient);
    setRankInputValue(initialIngredient.rank.toString());
  }, [initialIngredient.id, initialIngredient.rank]);

  const handleToggleAvailability = () => {
    const newValue = !ingredient.isAvailable;
    setIngredient(prev => ({ ...prev, isAvailable: newValue }));
    startTransition(() => {
      updateIngredientAvailability(ingredient.id, newValue);
    });
  };

  const handleToggleVisibility = () => {
    const newValue = !ingredient.isShowing;
    setIngredient(prev => ({ ...prev, isShowing: newValue }));
    startTransition(() => {
      updateIngredientVisibility(ingredient.id, newValue);
    });
  };

  const handleToggleFeatured = () => {
    const newRank = ingredient.rank > 0 ? 0 : 1; // Simple toggle: 0 = not featured, 1+ = featured
    setIngredient(prev => ({ ...prev, rank: newRank }));
    setRankInputValue(newRank.toString());
    startTransition(() => {
      updateIngredientRank(ingredient.id, newRank);
    });
  };

  const handleRankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRankInputValue(value);
  };

  const handleRankBlur = () => {
    const value = parseInt(rankInputValue);
    if (!isNaN(value) && value >= 1 && value !== ingredient.rank) {
      setIngredient(prev => ({ ...prev, rank: value }));
      startTransition(() => {
        updateIngredientRank(ingredient.id, value);
      });
    } else if (isNaN(value) || value < 1) {
      // Reset to current rank if invalid
      setRankInputValue(ingredient.rank.toString());
    }
  };

  const handleRankKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const isFeatured = ingredient.category === 'syrup' && ingredient.rank > 0;
  const isSyrup = ingredient.category === 'syrup';

  return (
    <div className={`bg-gray-900 p-4 rounded-xl border ${
      isFeatured ? 'border-[#32A5DC]' : 'border-gray-700'
    } ${isPending ? 'opacity-50' : ''}`}>
      
      {/* Ingredient Name */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-sm">{ingredient.name}</h3>
        {isFeatured && (
          <span className="text-[10px] uppercase font-bold text-[#32A5DC] bg-[#32A5DC]/20 px-2 py-0.5 rounded">
            Featured
          </span>
        )}
      </div>

      {/* Toggle Controls */}
      <div className="space-y-3">
        
        {/* In Stock / Out of Stock */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">In Stock</span>
          <button
            onClick={handleToggleAvailability}
            disabled={isPending}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              ingredient.isAvailable 
                ? 'bg-green-500' 
                : 'bg-gray-600'
            } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                ingredient.isAvailable ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Showing / Hidden */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Showing</span>
          <button
            onClick={handleToggleVisibility}
            disabled={isPending}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              ingredient.isShowing 
                ? 'bg-blue-500' 
                : 'bg-gray-600'
            } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                ingredient.isShowing ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Featured (for syrups only) */}
        {isSyrup && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Featured</span>
            <div className="flex items-center gap-2">
              {isFeatured && (
                <input
                  type="number"
                  min="1"
                  value={rankInputValue}
                  onChange={handleRankInputChange}
                  onBlur={handleRankBlur}
                  onKeyDown={handleRankKeyDown}
                  disabled={isPending}
                  className="w-16 px-2 py-1 text-xs bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:border-[#32A5DC] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
              <button
                onClick={handleToggleFeatured}
                disabled={isPending}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isFeatured 
                    ? 'bg-[#32A5DC]' 
                    : 'bg-gray-600'
                } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isFeatured ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
