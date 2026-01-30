'use client';

import { useState } from 'react';
import { deleteProduct } from './actions';
import { useToast } from '@/providers/ToastProvider';

interface Product {
  id: number;
  name: string;
}

interface DeleteProductModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteProductModal({ product, onClose, onSuccess }: DeleteProductModalProps) {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== product.name) {
      showToast('Please type the product name to confirm');
      return;
    }

    setIsDeleting(true);
    const result = await deleteProduct(product.id);
    setIsDeleting(false);

    if (result.success) {
      showToast('Product deleted successfully');
      onSuccess();
    } else {
      showToast(result.message || 'Failed to delete product');
      if (result.message?.includes('Cannot delete')) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Delete Product</h2>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-white">{product.name}</span>?
            </p>
            
            <p className="text-sm text-red-400">
              This action will soft-delete the product. It will be hidden from the menu but can still be viewed in order history.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type <span className="font-mono text-white">{product.name}</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={product.name}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== product.name}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
