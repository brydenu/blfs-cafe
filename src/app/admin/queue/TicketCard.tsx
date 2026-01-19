'use client';

import { useState } from "react";
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

export default function TicketCard({ item }: { item: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const minutesElapsed = Math.floor(
    (new Date().getTime() - new Date(item.orderCreatedAt).getTime()) / 60000
  );

  const handleComplete = async () => {
    setLoading(true);
    
    // 1. Call Server Action
    const result = await completeOrderItem(item.id);
    
    if (result.success) {
        // 2. Success: Force a refresh immediately (Backup for Socket)
        router.refresh(); 
    } else {
        // 3. Error: Alert user (Likely DB schema mismatch)
        alert("Failed to complete item. Check server console for errors.");
        setLoading(false);
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

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border border-gray-700 relative animate-fade-in">
      
      {/* --- HEADER --- */}
      <div className="bg-gray-750 p-4 border-b border-gray-700 flex justify-between items-start">
         <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-3xl font-black text-white leading-none truncate uppercase tracking-tight">
                {primaryName}
            </h2>
            {secondaryName && (
                <p className="text-gray-400 text-xs font-bold uppercase mt-1 tracking-wide">
                    {secondaryName}
                </p>
            )}
            <div className="mt-2 text-xs font-mono text-gray-500 flex gap-2">
                <span>#{item.parentPublicId.split('-')[0]}</span>
                <span className={minutesElapsed > 10 ? 'text-red-400 font-bold animate-pulse' : ''}>
                    • {minutesElapsed}m ago
                </span>
            </div>
         </div>

         {/* SHOT BOX */}
         {(item.product.category === 'coffee' || activeShots > 0) && (
             <div className="bg-gray-900 border-2 border-gray-600 rounded-xl w-20 h-20 flex flex-col items-center justify-center shrink-0 shadow-inner relative">
                <span className="text-4xl font-black text-white leading-none">{activeShots}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Shots</span>
                {/* Caffeine Type Badge */}
                {item.caffeineType && item.caffeineType !== "Normal" && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
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
                     <h3 className="text-2xl font-extrabold text-[#32A5DC] leading-tight">
                         {item.product.name}
                     </h3>
                     <p className={`text-lg font-bold mt-1 ${item.temperature?.includes('Iced') ? 'text-blue-300' : 'text-orange-300'}`}>
                         {item.temperature}
                     </p>
                 </div>
                 {/* Personal Cup Badge */}
                 {item.personalCup && (
                     <span className="bg-green-600 text-white text-xs font-black px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                         Personal Cup
                     </span>
                 )}
             </div>
         </div>

         {/* --- CUSTOMIZATIONS LIST --- */}
         <ul className="space-y-3">
            
            {/* 1. MILK DISPLAY */}
            {finalMilkName && (
               (() => {
                 // Determine Color
                 let colorClass = 'bg-gray-600 text-white';
                 const key = Object.keys(MILK_COLORS).find(k => finalMilkName.includes(k));
                 if (key) colorClass = MILK_COLORS[key];

                 return (
                    <li className="flex">
                         <span className={`${colorClass} px-3 py-1.5 rounded text-lg font-black uppercase shadow-sm`}>
                             {finalMilkName}
                         </span>
                    </li>
                 );
               })()
            )}

            {/* 2. OTHER MODIFIERS (Syrups) */}
            {item.modifiers.map((mod: any) => {
                if (mod.ingredient.category === 'milk') return null; // Handled above
                return (
                    <li key={mod.id} className="text-xl font-bold text-yellow-400 flex items-start gap-3">
                        <span className="mt-2 w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0"></span>
                        <span>{mod.ingredient.name} {mod.quantity > 1 && `(${mod.quantity})`}</span>
                    </li>
                );
            })}

            {/* 3. SPECIAL INSTRUCTIONS (Hide if it's just the system dump) */}
            {item.specialInstructions && !isSystemDump && (
                <li className="bg-pink-900/20 border border-pink-900/50 p-3 rounded-lg mt-2">
                    <p className="text-pink-300 text-lg font-medium italic">
                        "{item.specialInstructions}"
                    </p>
                </li>
            )}
         </ul>
      </div>

      {/* --- FOOTER BUTTON --- */}
      <button 
        onClick={handleComplete}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black text-xl py-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-widest border-t border-green-500 flex items-center justify-center gap-2"
      >
        {loading ? (
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
  );
}