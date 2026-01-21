'use client';

import { useState, useTransition } from "react";
import { createIngredient } from "../actions";

const INGREDIENT_CATEGORIES = [
  'milk',
  'syrup',
  'topping',
  'tea',
  'sweetener',
  'decaf'
] as const;

export function CreateIngredientForm() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('milk');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isShowing, setIsShowing] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Ingredient name is required' });
      return;
    }

    if (!category) {
      setMessage({ type: 'error', text: 'Category is required' });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await createIngredient(name.trim(), category, isAvailable, isShowing);
      if (result.success) {
        setName('');
        setCategory('milk');
        setIsAvailable(true);
        setIsShowing(true);
        setMessage({ type: 'success', text: 'Ingredient created successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to create ingredient' });
      }
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6">Create New Ingredient</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ingredient Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Ingredient Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-[#32A5DC] disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="e.g., Vanilla, Oat Milk, etc."
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
            Type / Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-[#32A5DC] disabled:opacity-50 disabled:cursor-not-allowed"
            required
          >
            {INGREDIENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-gray-900">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* In Stock Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="isAvailable" className="text-sm font-medium text-gray-300">
            In Stock
          </label>
          <button
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            disabled={isPending}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isAvailable 
                ? 'bg-green-500' 
                : 'bg-gray-600'
            } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isAvailable ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Showing Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="isShowing" className="text-sm font-medium text-gray-300">
            Showing
          </label>
          <button
            type="button"
            onClick={() => setIsShowing(!isShowing)}
            disabled={isPending}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isShowing 
                ? 'bg-blue-500' 
                : 'bg-gray-600'
            } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isShowing ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
              : 'bg-red-500/20 text-red-400 border border-red-500/50'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="w-full px-4 py-2 bg-[#32A5DC] text-white font-medium rounded-lg hover:bg-[#2a8fc0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating...' : 'Create Ingredient'}
        </button>
      </form>
    </div>
  );
}
