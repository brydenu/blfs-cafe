'use client';

import { useState } from 'react';
import CreateOrderForm from './CreateOrderForm';

interface QueueUtilitiesModalProps {
  onClose: () => void;
}

type UtilityTab = 'create-order' | 'future-utilities';

export default function QueueUtilitiesModal({ onClose }: QueueUtilitiesModalProps) {
  const [activeTab, setActiveTab] = useState<UtilityTab>('create-order');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-black text-white">Queue Utilities</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setActiveTab('create-order')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'create-order'
                ? 'text-[#32A5DC] border-b-2 border-[#32A5DC] bg-gray-900'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Create Walk-Up Order
          </button>
          <button
            onClick={() => setActiveTab('future-utilities')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'future-utilities'
                ? 'text-[#32A5DC] border-b-2 border-[#32A5DC] bg-gray-900'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            disabled
          >
            More Utilities (Coming Soon)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'create-order' && (
            <CreateOrderForm onSuccess={onClose} onCancel={onClose} />
          )}
          {activeTab === 'future-utilities' && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                Additional queue utilities coming soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
