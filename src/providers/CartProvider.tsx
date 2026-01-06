'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type CartItem = {
  internalId: string;
  productId: number;
  productName: string;
  productCategory: string;
  recipientName: string;
  shots: number;
  temperature: string;
  milkName: string;
  syrupDetails: string[];
  modifiers: Record<number, number>;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (internalId: string) => void;
  clearCart: () => void;
  cartCount: number;
  orderMode: 'single' | 'multi';
  setOrderMode: (mode: 'single' | 'multi') => void;
  
  // --- NEW FUNCTION ---
  updateItemName: (internalId: string, newName: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderMode, setOrderMode] = useState<'single' | 'multi'>('single');

  const addToCart = (item: CartItem) => {
    // If adding an item, force multi mode if count > 0 (logic handled in UI, but good safety)
    setItems((prev) => [...prev, item]);
  };

  const removeFromCart = (internalId: string) => {
    setItems((prev) => prev.filter((item) => item.internalId !== internalId));
  };

  const clearCart = () => {
    setItems([]);
    setOrderMode('single'); // Reset mode on clear
  };

  // --- NEW FUNCTION IMPLEMENTATION ---
  const updateItemName = (internalId: string, newName: string) => {
    setItems((prev) => prev.map(item => 
      item.internalId === internalId 
        ? { ...item, recipientName: newName } 
        : item
    ));
  };

  return (
    <CartContext.Provider value={{ 
      items, addToCart, removeFromCart, clearCart, cartCount: items.length, 
      orderMode, setOrderMode, updateItemName 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}