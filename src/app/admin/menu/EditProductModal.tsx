'use client';

import { useState } from 'react';
import { updateProduct } from './actions';
import { useToast } from '@/providers/ToastProvider';
import { CoffeeIcon, TeaIcon, DrinkIcon } from '@/components/icons';

interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  requiresMilk: boolean;
  allowsShots: boolean;
  defaultShots: number;
  forceTemperature: string | null;
  isSeasonal: boolean;
}

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductModal({ product, onClose, onSuccess }: EditProductModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(product.imageUrl);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    imageUrl: product.imageUrl || '',
    category: product.category,
    requiresMilk: product.requiresMilk,
    allowsShots: product.allowsShots,
    defaultShots: product.defaultShots,
    forceTemperature: product.forceTemperature || '',
    isSeasonal: product.isSeasonal,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setFormData({ ...formData, imageUrl: data.url });
      setImagePreview(data.url);
      showToast('Image uploaded successfully');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await updateProduct(product.id, {
      name: formData.name,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null,
      category: formData.category,
      requiresMilk: formData.requiresMilk,
      allowsShots: formData.allowsShots,
      defaultShots: formData.defaultShots,
      forceTemperature: formData.forceTemperature || null,
      isSeasonal: formData.isSeasonal,
    });

    setIsSubmitting(false);

    if (result.success) {
      showToast('Product updated successfully');
      onSuccess();
    } else {
      showToast(result.message || 'Failed to update product', 'error');
    }
  };

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
              >
                <option value="coffee">Coffee</option>
                <option value="tea">Tea</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Image Upload/URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Image
              </label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                  />
                </div>
              )}

              {/* File Upload */}
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">
                  Upload Image (or use URL below)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#32A5DC] file:text-white hover:file:bg-[#288bba] file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {isUploading && (
                  <p className="text-xs text-gray-400 mt-1">Uploading...</p>
                )}
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Or enter image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setImagePreview(e.target.value || null);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
                />
              </div>

              {/* Remove Image Button */}
              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, imageUrl: '' });
                    setImagePreview(null);
                  }}
                  className="mt-2 text-sm text-red-400 hover:text-red-300"
                >
                  Remove Image (use emoji instead)
                </button>
              )}

              {!formData.imageUrl && (
                <p className="text-sm text-gray-400 mt-1">
                  Default icon: {getCategoryIcon(formData.category, 24)}
                </p>
              )}
            </div>

            {/* Temperature Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Temperature Options
              </label>
              <select
                value={formData.forceTemperature}
                onChange={(e) => setFormData({ ...formData, forceTemperature: e.target.value || null })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
              >
                <option value="">Both Hot & Iced</option>
                <option value="Hot">Hot Only</option>
                <option value="Iced">Iced Only</option>
              </select>
            </div>

            {/* Requires Milk */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresMilk"
                checked={formData.requiresMilk}
                onChange={(e) => setFormData({ ...formData, requiresMilk: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2"
              />
              <label htmlFor="requiresMilk" className="text-sm font-medium text-gray-300">
                Requires Milk by Default
              </label>
            </div>

            {/* Allows Shots */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowsShots"
                checked={formData.allowsShots}
                onChange={(e) => setFormData({ ...formData, allowsShots: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2"
              />
              <label htmlFor="allowsShots" className="text-sm font-medium text-gray-300">
                Allows Espresso Shots
              </label>
            </div>

            {/* Default Shots */}
            {formData.allowsShots && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Shots
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.defaultShots}
                  onChange={(e) => setFormData({ ...formData, defaultShots: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
                />
              </div>
            )}

            {/* Seasonal */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isSeasonal"
                checked={formData.isSeasonal}
                onChange={(e) => setFormData({ ...formData, isSeasonal: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2"
              />
              <label htmlFor="isSeasonal" className="text-sm font-medium text-gray-300">
                Seasonal Item
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#32A5DC] hover:bg-[#288bba] text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
