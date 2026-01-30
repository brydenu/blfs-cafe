'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import CreateProductForm from './CreateProductForm';
import EditProductModal from './EditProductModal';
import DeleteProductModal from './DeleteProductModal';
import { CoffeeIcon, TeaIcon, DrinkIcon } from '@/components/icons';

interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  isActive: boolean;
  isSeasonal: boolean;
  requiresMilk: boolean;
  allowsShots: boolean;
  defaultShots: number;
  forceTemperature: string | null;
}

interface MenuManagerProps {
  products: Product[];
}

export default function MenuManager({ products }: MenuManagerProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categories = ['all', ...Object.keys(productsByCategory).sort()];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const getCategoryIcon = (category: string, size: number = 32) => {
    switch (category.toLowerCase()) {
      case 'coffee':
        return <CoffeeIcon size={size} className="text-gray-400" />;
      case 'tea':
        return <TeaIcon size={size} className="text-gray-400" />;
      default:
        return <DrinkIcon size={size} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === category
                ? 'bg-[#32A5DC] text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category === 'all' ? 'All' : (
              <span className="flex items-center gap-2">
                {getCategoryIcon(category, 20)}
                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold px-6 py-3 rounded-lg transition-colors"
        >
          + Create New Menu Item
        </button>
      </div>

      {/* Products Grid */}
      {activeCategory === 'all' ? (
        // Show by category when "all" is selected
        <div className="space-y-8">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <div key={category} className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div>{getCategoryIcon(category, 24)}</div>
                {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryProducts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onDelete={() => setDeletingProduct(product)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show filtered products when a specific category is selected
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onDelete={() => setDeletingProduct(product)}
            />
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateProductForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            window.location.reload(); // Refresh to show new product
          }}
        />
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            window.location.reload();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <DeleteProductModal
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onSuccess={() => {
            setDeletingProduct(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
