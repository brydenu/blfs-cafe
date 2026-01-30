'use client';

import { useState } from "react";
import QuickOrderModal from "./QuickOrderModal";
import { CoffeeIcon, TeaIcon, DrinkIcon, LightningIcon, ClockIcon } from "@/components/icons";

interface Favorite {
  id: number;
  name: string;
  description: string | null;
  product: {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
  };
  configuration: any;
}

interface LastDrink {
  product: {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
  };
  configuration: any;
  recipientName: string;
}

interface QuickOrderListProps {
  favorites: Favorite[];
  lastDrink: LastDrink | null;
}

export default function QuickOrderList({ favorites, lastDrink }: QuickOrderListProps) {
  const [selectedItem, setSelectedItem] = useState<{
    type: 'favorite' | 'last';
    data: Favorite | LastDrink;
  } | null>(null);

  if (favorites.length === 0 && !lastDrink) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
        <div className="mb-4"><LightningIcon size={64} className="text-[#32A5DC]" /></div>
        <h3 className="text-xl font-bold text-white mb-2">No quick order options</h3>
        <p className="text-blue-200 text-sm mb-6">
          Create favorites or place an order to see quick order options here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last Drink Section */}
      {lastDrink && (
        <div>
          <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2 opacity-90">
            <ClockIcon size={16} className="text-[#32A5DC]" /> Last Ordered
          </h2>
          <div
            onClick={() => setSelectedItem({ type: 'last', data: lastDrink })}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg shrink-0">
                {lastDrink.product.category === 'coffee' ? <CoffeeIcon size={32} className="text-gray-400" /> : lastDrink.product.category === 'tea' ? <TeaIcon size={32} className="text-gray-400" /> : <DrinkIcon size={32} className="text-gray-400" />}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{lastDrink.product.name}</h3>
                <p className="text-blue-200 text-sm">Your last order</p>
              </div>
              <div className="text-white text-2xl">→</div>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div>
          <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2 opacity-90">
            <span className="text-yellow-400">★</span> Your Favorites
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                onClick={() => setSelectedItem({ type: 'favorite', data: favorite })}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-lg shrink-0">
                    {favorite.product.category === 'coffee' ? <CoffeeIcon size={32} className="text-gray-400" /> : favorite.product.category === 'tea' ? <TeaIcon size={32} className="text-gray-400" /> : <DrinkIcon size={32} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate">{favorite.name}</h3>
                    <p className="text-blue-200 text-xs truncate">{favorite.product.name}</p>
                  </div>
                  <div className="text-white text-xl">→</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <QuickOrderModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
