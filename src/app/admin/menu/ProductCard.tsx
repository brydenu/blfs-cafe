'use client';

import { updateProductAvailability } from './actions';
import { useToast } from '@/providers/ToastProvider';

interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  isActive: boolean;
  isSeasonal: boolean;
}

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { showToast } = useToast();

  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case 'coffee':
        return '☕';
      case 'tea':
        return '🍵';
      default:
        return '🥤';
    }
  };

  const handleToggleAvailability = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = await updateProductAvailability(product.id, e.target.checked);
    if (!result.success) {
      showToast('Failed to update availability', 'error');
    }
    // No success toast - silent update
  };

  return (
    <div className={`bg-gray-700 p-4 rounded-xl border-2 transition-all ${
      product.isActive 
        ? 'border-gray-600 hover:border-[#32A5DC]' 
        : 'border-gray-800 opacity-60'
    }`}>
      {/* Image/Emoji */}
      <div className="w-full h-32 bg-gray-600 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{getCategoryEmoji(product.category)}</span>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-white text-lg flex-1">{product.name}</h3>
          {product.isSeasonal && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded">
              Seasonal
            </span>
          )}
        </div>
        
        {product.description && (
          <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
        )}

        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {product.category}
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={product.isActive}
              onChange={handleToggleAvailability}
              className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2"
            />
            <span className={`text-sm font-medium ${
              product.isActive ? 'text-green-400' : 'text-red-400'
            }`}>
              {product.isActive ? 'Available' : 'Unavailable'}
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
