'use client';

import { useState } from 'react';
import { createProduct } from './actions';
import { useToast } from '@/providers/ToastProvider';
import { CoffeeIcon, TeaIcon, DrinkIcon } from '@/components/icons';

interface CreateProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProductForm({ onClose, onSuccess }: CreateProductFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'coffee',
    imageUrl: '',
    canBeHotAndIced: true,
    forceTemperature: '' as string | null,
    requiresMilk: false,
    allowsShots: false,
    defaultShots: 0,
    isSeasonal: false,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB');
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
      showToast(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for step 2
    if (step === 2 && !formData.canBeHotAndIced && (!formData.forceTemperature || formData.forceTemperature === '')) {
      showToast('Please select a temperature option');
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);

    const result = await createProduct({
      name: formData.name,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null,
      category: formData.category,
      requiresMilk: formData.requiresMilk,
      allowsShots: formData.allowsShots,
      defaultShots: formData.defaultShots,
      forceTemperature: formData.canBeHotAndIced ? null : (formData.forceTemperature || null),
      isSeasonal: formData.isSeasonal,
    });

    setIsSubmitting(false);

    if (result.success) {
      showToast('Product created successfully');
      onSuccess();
    } else {
      showToast(result.message || 'Failed to create product');
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
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Menu Item</h2>
              <p className="text-sm text-gray-400 mt-1">Step {step} of 4</p>
            </div>
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
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                
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
                    placeholder="e.g., Latte, Americano"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
                    placeholder="Optional description"
                  />
                </div>

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
              </div>
            )}

            {/* Step 2: Temperature Options */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Temperature Options</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Can this drink be served both hot and iced? *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="canBeHotAndIced"
                        checked={formData.canBeHotAndIced}
                        onChange={() => {
                          setFormData({ ...formData, canBeHotAndIced: true, forceTemperature: null });
                        }}
                        className="w-4 h-4 text-[#32A5DC] focus:ring-[#32A5DC]"
                      />
                      <span className="text-gray-300">Yes, both hot and iced</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="canBeHotAndIced"
                        checked={!formData.canBeHotAndIced}
                        onChange={() => {
                          setFormData({ ...formData, canBeHotAndIced: false, forceTemperature: '' });
                        }}
                        className="w-4 h-4 text-[#32A5DC] focus:ring-[#32A5DC]"
                      />
                      <span className="text-gray-300">No, only one temperature</span>
                    </label>
                  </div>
                </div>

                {!formData.canBeHotAndIced && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Which temperature? *
                    </label>
                    <select
                      required={!formData.canBeHotAndIced}
                      value={formData.forceTemperature || ''}
                      onChange={(e) => setFormData({ ...formData, forceTemperature: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-[#32A5DC] focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="Hot">Hot Only</option>
                      <option value="Iced">Iced Only</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Milk & Shots */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Milk & Espresso Options</h3>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requiresMilk"
                    checked={formData.requiresMilk}
                    onChange={(e) => setFormData({ ...formData, requiresMilk: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2"
                  />
                  <label htmlFor="requiresMilk" className="text-sm font-medium text-gray-300">
                    Does this drink have milk by default? *
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allowsShots"
                    checked={formData.allowsShots}
                    onChange={(e) => setFormData({ ...formData, allowsShots: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2"
                  />
                  <label htmlFor="allowsShots" className="text-sm font-medium text-gray-300">
                    Can customers add espresso shots?
                  </label>
                </div>

                {formData.allowsShots && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default number of shots
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
              </div>
            )}

            {/* Step 4: Image & Final Details */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Image & Final Details</h3>
                
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

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isSeasonal"
                    checked={formData.isSeasonal}
                    onChange={(e) => setFormData({ ...formData, isSeasonal: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2"
                  />
                  <label htmlFor="isSeasonal" className="text-sm font-medium text-gray-300">
                    Mark as seasonal item
                  </label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
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
                {step < 4 ? 'Next' : isSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
