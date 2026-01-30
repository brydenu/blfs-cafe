'use client';

import { ReactNode } from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message
}: ErrorModalProps) {
  if (!isOpen) return null;

  // Check if this is an out-of-stock error (ingredients or products)
  const isIngredientError = message.includes("out of the following ingredient(s):");
  const isProductError = message.includes("the following item(s) are currently unavailable:");
  
  // Parse the message for out-of-stock errors
  let formattedMessage: string | ReactNode = message;
  let displayTitle = title || "Order Error";
  
  if (isIngredientError) {
    displayTitle = "Out of stock";
    
    // Extract the parts of the message
    const parts = message.split("out of the following ingredient(s):");
    if (parts.length === 2) {
      const beforeIngredients = parts[0] + "out of the following ingredient(s):";
      const afterPart = parts[1];
      
      // Extract ingredient names (everything before the period)
      const ingredientPart = afterPart.split(".")[0].trim();
      const restOfMessage = afterPart.split(".").slice(1).join(".").trim();
      
      // Split ingredients by comma
      const ingredients = ingredientPart.split(",").map(ing => ing.trim());
      
      formattedMessage = (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {beforeIngredients}
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="text-gray-800 font-medium">{ingredient}</li>
            ))}
          </ul>
          {restOfMessage && (
            <p className="text-gray-700 leading-relaxed">
              {restOfMessage}
            </p>
          )}
        </div>
      );
    }
  } else if (isProductError) {
    displayTitle = "Item unavailable";
    
    // Extract the parts of the message
    const parts = message.split("the following item(s) are currently unavailable:");
    if (parts.length === 2) {
      const beforeItems = parts[0] + "the following item(s) are currently unavailable:";
      const afterPart = parts[1];
      
      // Extract product names (everything before the period)
      const itemPart = afterPart.split(".")[0].trim();
      const restOfMessage = afterPart.split(".").slice(1).join(".").trim();
      
      // Split items by comma
      const items = itemPart.split(",").map(item => item.trim());
      
      formattedMessage = (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {beforeItems}
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {items.map((item, index) => (
              <li key={index} className="text-gray-800 font-medium">{item}</li>
            ))}
          </ul>
          {restOfMessage && (
            <p className="text-gray-700 leading-relaxed">
              {restOfMessage}
            </p>
          )}
        </div>
      );
    }
  } else {
    formattedMessage = (
      <p className="text-gray-700 leading-relaxed">
        {message}
      </p>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto animate-in fade-in zoom-in duration-200">
        {/* Header with Icon */}
        <div className="flex flex-col items-center pt-8 px-6 pb-4">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-extrabold text-[#004876] text-center">
            {displayTitle}
          </h3>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-gray-700">
            {formattedMessage}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-center px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-[#004876] hover:bg-[#003355] text-white font-bold transition-all cursor-pointer shadow-md hover:shadow-lg min-w-[120px]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
