'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { placeQuickOrder } from "./actions";

interface QuickOrderModalProps {
  item: {
    type: 'favorite' | 'last';
    data: any;
  };
  onClose: () => void;
}

export default function QuickOrderModal({ item, onClose }: QuickOrderModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [personalCup, setPersonalCup] = useState(false);
  const [notes, setNotes] = useState(item.data.configuration?.notes || "");
  const [isOrdering, setIsOrdering] = useState(false);

  const product = item.data.product;
  const config = item.data.configuration;
  const name = item.type === 'favorite' ? item.data.name : item.data.recipientName;

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
        { ...config, personalCup, notes: notes.trim() || undefined },
        personalCup,
        notes.trim() || undefined
      );

      if (result.success && result.orderId) {
        showToast("Order placed!");
        router.push(`/order-confirmation/${result.orderId}`);
      } else {
        showToast(result.message || "Failed to place order");
        setIsOrdering(false);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      showToast("An error occurred");
      setIsOrdering(false);
    }
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

          {/* Personal Cup Option */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={personalCup}
                onChange={(e) => setPersonalCup(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#32A5DC] focus:ring-[#32A5DC] cursor-pointer"
              />
              <span className="text-sm font-bold text-[#004876]">Personal Cup</span>
            </label>
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
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleOrder}
              disabled={isOrdering}
              className="flex-1 bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isOrdering ? "Placing Order..." : "Order Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
