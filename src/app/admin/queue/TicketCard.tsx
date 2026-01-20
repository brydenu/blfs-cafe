'use client';

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation"; // Added for manual refresh backup
import { completeOrderItem } from "./actions"; // New Action

const MILK_COLORS: Record<string, string> = {
    'Whole': 'bg-red-500 text-white',
    'Nonfat': 'bg-blue-500 text-white',
    'Half and Half': 'bg-purple-500 text-white',
    'Breve': 'bg-purple-500 text-white',
    'Oat': 'bg-teal-500 text-white',
    'Almond': 'bg-[#a3e635] text-black',
    'Soy': 'bg-yellow-600 text-white',
    'Hemp': 'bg-green-800 text-white',
};

// Helper function to format order time (e.g., "2:45 PM")
function formatOrderTime(timestamp: Date | string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Helper function to format relative time
function formatTimeAgo(timestamp: Date | string): string {
  const now = new Date();
  const orderTime = new Date(timestamp);
  const diffMs = now.getTime() - orderTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  // Less than 1 minute
  if (diffMinutes < 1) {
    return "< 1 minute ago";
  }

  // 1-59 minutes: show exact minutes
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }

  // 60+ minutes: show in 0.5 hour increments
  const diffHours = diffMs / (1000 * 60 * 60);
  const halfHours = Math.round(diffHours * 2) / 2;
  
  if (halfHours === 1) {
    return "1 hour ago";
  } else if (halfHours % 1 === 0) {
    return `${halfHours} hours ago`;
  } else {
    return `${halfHours} hours ago`;
  }
}

// Helper function to convert topping quantity to label
function getToppingLabel(quantity: number): string | null {
  if (quantity === 0) return null;
  if (quantity === 1) return "Light";
  if (quantity === 2) return "Medium";
  if (quantity === 3) return "Extra";
  // Fallback for unexpected values
  return `${quantity}`;
}

export default function TicketCard({ item }: { item: any }) {
  const [loading, setLoading] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate time displays
  const orderTime = useMemo(() => formatOrderTime(item.orderCreatedAt), [item.orderCreatedAt]);
  const timeAgo = useMemo(() => formatTimeAgo(item.orderCreatedAt), [item.orderCreatedAt]);

  const handleComplete = async () => {
    // Start exit animation immediately (optimistic UI)
    setIsExiting(true);
    setIsPressing(false);
    setLoading(true);
    
    // Wait for animation to complete before removing from DOM
    setTimeout(async () => {
      // Call Server Action
      const result = await completeOrderItem(item.id);
      
      if (result.success) {
        // Force a refresh after animation completes
        router.refresh(); 
      } else {
        // Error: Reset state and alert
        alert("Failed to complete item. Check server console for errors.");
        setIsExiting(false);
        setLoading(false);
      }
    }, 500); // Match animation duration
  };

  const handleMouseDown = () => {
    if (!loading && !isExiting) {
      setIsPressing(true);
    }
  };

  const handleMouseUp = () => {
    if (isPressing && !loading && !isExiting) {
      setIsPressing(false);
    }
  };

  const handleMouseLeave = () => {
    if (isPressing) {
      setIsPressing(false);
    }
  };

  // --- NAME PRIORITY ---
  // 1. Recipient Name (Group Order / Edit)
  // 2. Legacy Parsed Name
  // 3. Account Owner Name (Default)
  const primaryName = item.recipientName || item.parsedName || item.orderOwnerName;
  
  // Only show secondary if it's different from primary
  const secondaryName = (item.orderOwnerName !== primaryName) ? `Ordered by ${item.orderOwnerName}` : null;

  // --- PARSED VALUES ---
  const activeShots = item.parsedShots || item.shots || 0;
  
  // Helper to resolve Milk Name from 3 potential sources:
  // 1. Modifiers (Ingredient Table)
  // 2. Direct Column (New Cart Logic)
  // 3. Legacy Parsed String
  const resolveMilkName = () => {
    const modMilk = item.modifiers.find((m:any) => m.ingredient.category === 'milk');
    if (modMilk) return modMilk.ingredient.name;
    
    if (item.milkName && item.milkName !== "No Milk") return item.milkName;
    
    return item.parsedMilk;
  };
  const finalMilkName = resolveMilkName();

  // Check if specialInstructions looks like a system dump
  const isSystemDump = item.specialInstructions?.includes("Milk:") && item.specialInstructions?.includes("|");

  // Determine animation classes
  const pressClass = isPressing ? 'card-pressing' : '';
  const exitClass = isExiting ? 'card-exit-liftoff' : '';
  const isCancelled = item.cancelled === true;

  return (
    <div 
      ref={cardRef}
      className={`bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border-2 relative ${pressClass} ${exitClass} ${isExiting ? 'pointer-events-none' : ''} ${
        isCancelled ? 'border-red-500 border-opacity-60' : 'border-gray-700'
      }`}
      style={{
        transition: isPressing ? 'none' : 'transform 0.15s ease-out'
      }}
    >
      
      {/* --- HEADER --- */}
      <div className={`bg-gray-750 p-4 border-b flex justify-between items-start ${isCancelled ? 'border-red-500 border-opacity-40' : 'border-gray-700'}`}>
         <div className="flex-1 min-w-0 pr-2">
            <h2 className={`text-2xl font-black leading-tight truncate uppercase tracking-tight ${
                isCancelled ? 'text-red-300 line-through' : 'text-white'
            }`}>
                {primaryName}
            </h2>
            {secondaryName && (
                <p className={`text-xs font-semibold uppercase mt-1 tracking-wide ${
                    isCancelled ? 'text-red-400' : 'text-gray-400'
                }`}>
                    {secondaryName}
                </p>
            )}
            {isCancelled && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold uppercase rounded border border-red-400">
                    Cancelled
                </span>
            )}
            <div className="mt-2.5 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400">
                    {orderTime}
                </span>
                <span className="text-xs font-bold text-gray-500">
                    {timeAgo}
                </span>
            </div>
         </div>

         {/* SHOT BOX */}
         {(item.product.category === 'coffee' || activeShots > 0) && (
             <div className="bg-gray-900 border-2 border-gray-600 rounded-xl w-20 h-20 flex flex-col items-center justify-center shrink-0 shadow-inner relative">
                <span className="text-3xl font-black text-white leading-none">{activeShots}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Shots</span>
                {/* Caffeine Type Badge */}
                {item.caffeineType && item.caffeineType !== "Normal" && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        {item.caffeineType === "Decaf" ? "Decaf" : "Half-Caff"}
                    </span>
                )}
             </div>
         )}
      </div>

      {/* --- DRINK BODY --- */}
      <div className="p-5 flex-1 flex flex-col gap-4">
         
         <div className="border-b border-gray-700 pb-3">
             <div className="flex items-start justify-between gap-2">
                 <div className="flex-1">
                     <h3 className={`text-xl font-extrabold leading-tight ${
                         isCancelled ? 'text-red-300 line-through' : 'text-[#32A5DC]'
                     }`}>
                         {item.product.name}
                     </h3>
                     <p className={`text-base font-semibold mt-1 ${
                         isCancelled ? 'text-red-400' : item.temperature?.includes('Iced') ? 'text-blue-300' : 'text-orange-300'
                     }`}>
                         {item.temperature}
                     </p>
                 </div>
                 {/* Personal Cup Badge */}
                 {item.personalCup && (
                     <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
                         Personal Cup
                     </span>
                 )}
             </div>
         </div>

         {/* --- CUSTOMIZATIONS LIST --- */}
         <ul className="space-y-2.5">
            
            {/* 1. MILK DISPLAY */}
            {finalMilkName && (
               (() => {
                 // Determine Color
                 let colorClass = 'bg-gray-600 text-white';
                 const key = Object.keys(MILK_COLORS).find(k => finalMilkName.includes(k));
                 if (key) colorClass = MILK_COLORS[key];

                 return (
                    <li className="flex">
                         <span className={`${colorClass} px-3 py-1.5 rounded-lg text-sm font-bold uppercase shadow-sm`}>
                             {finalMilkName}
                         </span>
                    </li>
                 );
               })()
            )}

            {/* 2. OTHER MODIFIERS (Syrups, Toppings, etc.) */}
            {item.modifiers.map((mod: any) => {
                if (mod.ingredient.category === 'milk') return null; // Handled above
                
                // Handle toppings/drizzles specially (Light/Medium/Extra)
                const isTopping = mod.ingredient.category === 'topping';
                const toppingLabel = isTopping ? getToppingLabel(mod.quantity) : null;
                const displayQuantity = isTopping && toppingLabel 
                  ? toppingLabel 
                  : mod.quantity > 1 ? `(${mod.quantity})` : null;
                
                return (
                    <li key={mod.id} className="text-lg font-semibold text-gray-300 flex items-start gap-2.5">
                        <span className="mt-2 w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0"></span>
                        <span>
                            {mod.ingredient.name}
                            {displayQuantity && (
                                <span className="ml-2 text-gray-400 font-normal">
                                    {displayQuantity}
                                </span>
                            )}
                        </span>
                    </li>
                );
            })}

            {/* 3. SPECIAL INSTRUCTIONS (Hide if it's just the system dump) */}
            {item.specialInstructions && !isSystemDump && (
                <li className="bg-pink-900/20 border border-pink-900/50 p-3 rounded-lg mt-2">
                    <p className="text-pink-300 text-sm font-medium italic">
                        "{item.specialInstructions}"
                    </p>
                </li>
            )}
         </ul>
      </div>

      {/* --- FOOTER BUTTON --- */}
      <div className="p-4 pt-2">
        <button 
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleComplete}
          disabled={loading || isExiting}
          className={`w-full font-black text-xl py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${
            isCancelled 
              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-2 border-red-500' 
              : 'bg-[#32A5DC] hover:bg-[#288bba] active:bg-[#1f7aa3] text-white'
          }`}
        >
          {loading || isExiting ? (
               <span className="animate-pulse">Processing...</span>
          ) : (
              <>
                  <span>Complete Drink</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
              </>
          )}
        </button>
      </div>

    </div>
  );
}