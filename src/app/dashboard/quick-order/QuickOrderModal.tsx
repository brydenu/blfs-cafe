'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { placeQuickOrder } from "./actions";
import ErrorModal from "@/components/ErrorModal";

interface QuickOrderModalProps {
  item: {
    type: 'favorite' | 'last';
    data: any;
  };
  onClose: () => void;
}

export default function QuickOrderModal({ item, onClose }: QuickOrderModalProps) {
  const router = useRouter();
  const [cupType, setCupType] = useState('to-go');
  const [notes, setNotes] = useState(item.data.configuration?.notes || "");
  const [isOrdering, setIsOrdering] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const product = item.data.product;
  const rawConfig = item.data.configuration;
  const name = item.type === 'favorite' ? item.data.name : item.data.recipientName;

  // Parse config if it's a string (from savedOrder JSON field)
  const config = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;

  // Get ingredients for display (we'll need to fetch these or pass them)
  // For now, we'll display what we can from the config
  const formatSpecifications = () => {
    const specs: string[] = [];

    // Temperature
    if (config.temperature) {
      specs.push(`Temperature: ${config.temperature}`);
    }

    // Shots
    if (config.shots && config.shots > 0) {
      specs.push(`${config.shots} shot${config.shots > 1 ? 's' : ''}`);
      if (config.caffeineType && config.caffeineType !== 'Normal') {
        specs.push(`(${config.caffeineType})`);
      }
    }

    // Milk
    if (config.milkId) {
      // We'd need ingredient data to show milk name, but we can show it's customized
      specs.push('Custom milk');
    } else if (config.milkId === null) {
      specs.push('No milk');
    }

    // Modifiers
    if (config.modifiers && Object.keys(config.modifiers).length > 0) {
      const modifierCount = Object.values(config.modifiers).reduce((sum: number, count: any) => sum + count, 0);
      if (modifierCount > 0) {
        specs.push(`${modifierCount} modifier${modifierCount > 1 ? 's' : ''}`);
      }
    }

    // Additional options
    if (config.milkSteamed) specs.push('Milk steamed');
    if (config.foamLevel && config.foamLevel !== 'Normal') specs.push(`Foam: ${config.foamLevel}`);
    if (config.milkAmount && config.milkAmount !== 'Normal') specs.push(`Milk: ${config.milkAmount}`);
    if (config.notes) specs.push('Special notes');

    return specs;
  };

  const handleOrder = async () => {
    setIsOrdering(true);

    try {
      const result = await placeQuickOrder(
        product.id,
        { ...config, cupType, notes: notes.trim() || undefined },
        cupType,
        notes.trim() || undefined
      );

      if (result.success && result.orderId) {
        router.push(`/order-confirmation/${result.orderId}`);
      } else {
        setErrorModal({ isOpen: true, message: result.message || "Failed to place order" });
        setIsOrdering(false);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setErrorModal({ isOpen: true, message: "An error occurred. Please try again." });
      setIsOrdering(false);
    }
  };

  const handleCustomize = () => {
    // Config is already parsed at component level
    // Build the configuration object with all fields needed by CustomizeForm
    const customizeConfig = {
      shots: config.shots || 0,
      temperature: config.temperature || "Hot",
      milkId: config.milkId || null,
      modifiers: config.modifiers || {},
      cupType: cupType || config.cupType || 'to-go',
      caffeineType: config.caffeineType || undefined,
      milkSteamed: config.milkSteamed || undefined,
      foamLevel: config.foamLevel || undefined,
      milkAmount: config.milkAmount || undefined,
      notes: notes.trim() || config.notes || undefined,
      recipientName: item.type === 'favorite' ? name : config.recipientName || undefined,
    };

    // Encode the config as a URL parameter
    const configStr = encodeURIComponent(JSON.stringify(customizeConfig));
    
    // Navigate to the customize page with the config
    router.push(`/menu/${product.id}?config=${configStr}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#004876]">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
              {product.category === 'coffee' ? '☕' : product.category === 'tea' ? '🍵' : '🥤'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#004876]">{name}</h3>
              <p className="text-gray-600">{product.name}</p>
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
              Specifications
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {formatSpecifications().length > 0 ? (
                formatSpecifications().map((spec, idx) => (
                  <div key={idx} className="text-sm text-gray-700">
                    • {spec}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">Standard preparation</div>
              )}
            </div>
          </div>

          {/* Cup Type Selection */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Cup Type
            </label>
            <select
              value={cupType}
              onChange={(e) => setCupType(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-[#004876] focus:border-[#32A5DC] outline-none bg-gray-50 focus:bg-white transition-all cursor-pointer"
            >
              <option value="to-go">To-Go Cup</option>
              <option value="for-here">For-Here {(config.temperature || "Hot").startsWith("Iced") ? "Glass" : "Mug"}</option>
              <option value="personal">Personal Cup</option>
            </select>
          </div>

          {/* Notes Field */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Special Instructions / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-[#004876] focus:border-[#32A5DC] outline-none bg-gray-50 focus:bg-white transition-all placeholder-gray-300 resize-none"
              placeholder="Add any special instructions or notes here..."
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            {/* Cancel & Customize: share a row on mobile, all three inline on desktop */}
            <button
              onClick={onClose}
              className="py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomize}
              className="py-3 px-6 rounded-xl border-2 border-[#32A5DC] text-[#32A5DC] font-bold hover:bg-[#32A5DC] hover:text-white transition-all cursor-pointer"
            >
              Customize
            </button>
            {/* Order Now: full-width row on mobile (rightmost), single column on desktop */}
            <button
              onClick={handleOrder}
              disabled={isOrdering}
              className="col-span-2 md:col-span-1 md:col-start-3 bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isOrdering ? "Placing Order..." : "Order Now"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        message={errorModal.message}
      />
    </div>
  );
}
