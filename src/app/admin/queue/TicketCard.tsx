'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { completeOrderItem } from "./actions"; // New Action
import TimerModal from "./TimerModal";

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

// Helper function to format timer as MM:SS
function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Timer state interface
interface TimerState {
  startTime: number;
  duration: number;
  isRunning: boolean;
  isCompleted: boolean;
}

export default function TicketCard({ item }: { item: any }) {
  const [loading, setLoading] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer localStorage key
  const timerKey = `tea-timer-${item.id}`;

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(timerKey);
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        // Check if timer is still valid (not expired)
        const elapsed = Date.now() - state.startTime;
        const remaining = Math.max(0, state.duration - elapsed);
        
        if (remaining > 0 && state.isRunning) {
          setTimerState(state);
          setRemainingSeconds(Math.ceil(remaining / 1000));
        } else if (state.isCompleted) {
          // Timer completed, show animation
          setTimerState({ ...state, isCompleted: true, isRunning: false });
          setRemainingSeconds(0);
        } else {
          // Timer expired, clear it
          localStorage.removeItem(timerKey);
        }
      } catch (e) {
        console.error('Failed to parse timer state:', e);
        localStorage.removeItem(timerKey);
      }
    }
  }, [timerKey]);

  // Timer countdown effect
  useEffect(() => {
    if (timerState && timerState.isRunning && !timerState.isCompleted) {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - timerState.startTime;
        const remaining = Math.max(0, timerState.duration - elapsed);
        const seconds = Math.ceil(remaining / 1000);
        
        setRemainingSeconds(seconds);
        
        if (remaining <= 0) {
          // Timer completed
          const completedState: TimerState = {
            ...timerState,
            isCompleted: true,
            isRunning: false
          };
          setTimerState(completedState);
          localStorage.setItem(timerKey, JSON.stringify(completedState));
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 100);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [timerState, timerKey]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle timer start
  const handleStartTimer = (durationSeconds: number) => {
    const duration = durationSeconds * 1000; // Convert to milliseconds
    const newState: TimerState = {
      startTime: Date.now(),
      duration,
      isRunning: true,
      isCompleted: false
    };
    setTimerState(newState);
    setRemainingSeconds(durationSeconds);
    localStorage.setItem(timerKey, JSON.stringify(newState));
  };

  // Handle timer cancel
  const handleCancelTimer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState(null);
    setRemainingSeconds(0);
    localStorage.removeItem(timerKey);
  };

  // Handle timer area click
  const handleTimerAreaClick = () => {
    if (timerState?.isCompleted) {
      // Dismiss completed timer
      setTimerState(null);
      setRemainingSeconds(0);
      localStorage.removeItem(timerKey);
    } else if (timerState?.isRunning) {
      // Cancel running timer
      handleCancelTimer({ stopPropagation: () => {} } as React.MouseEvent);
    } else {
      // Open timer modal
      setShowTimerModal(true);
    }
  };

  // Calculate time displays
  const orderTime = useMemo(() => formatOrderTime(item.orderCreatedAt), [item.orderCreatedAt]);
  const timeAgo = useMemo(() => formatTimeAgo(item.orderCreatedAt), [item.orderCreatedAt]);

  const handleComplete = async () => {
    // Start exit animation immediately (optimistic UI)
    setIsExiting(true);
    setIsPressing(false);
    setLoading(true);
    
    // Call Server Action immediately (don't wait for animation)
    // The socket event will trigger a refresh via QueueListener
    try {
      const result = await completeOrderItem(item.id);
      
      if (!result.success) {
        // Error: Reset state and alert
        alert("Failed to complete item. Check server console for errors.");
        setIsExiting(false);
        setLoading(false);
      }
      // If successful, the socket event will handle the refresh
      // No need to call router.refresh() manually
    } catch (error) {
      // Error: Reset state and alert
      console.error("Error completing item:", error);
      alert("Failed to complete item. Check server console for errors.");
      setIsExiting(false);
      setLoading(false);
    }
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
  const isGuestOrder = item.isGuestOrder === true;
  const timerCompleted = timerState?.isCompleted ?? false;

  return (
    <>
      {showTimerModal && (
        <TimerModal
          onClose={() => setShowTimerModal(false)}
          onStart={handleStartTimer}
        />
      )}
      <div 
        ref={cardRef}
        className={`bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border-2 relative ${pressClass} ${exitClass} ${isExiting ? 'pointer-events-none' : ''} ${
          isCancelled ? 'border-red-500 border-opacity-60' : isGuestOrder ? 'border-[#32A5DC] border-opacity-60' : timerCompleted ? 'timer-completed-border' : 'border-gray-700'
        }`}
        style={{
          transition: isPressing ? 'none' : 'transform 0.15s ease-out'
        }}
      >
      
      {/* --- HEADER --- */}
      <div className={`bg-gray-750 p-4 border-b flex justify-between items-start ${isCancelled ? 'border-red-500 border-opacity-40' : isGuestOrder ? 'border-[#32A5DC] border-opacity-40' : 'border-gray-700'}`}>
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
            <div className="mt-2 flex flex-wrap gap-2">
                {isGuestOrder && (
                    <span className="inline-block px-2 py-0.5 bg-[#32A5DC] text-white text-xs font-bold uppercase rounded border border-[#32A5DC]">
                        Guest
                    </span>
                )}
                {isCancelled && (
                    <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-xs font-bold uppercase rounded border border-red-400">
                        Cancelled
                    </span>
                )}
            </div>
            <div className="mt-2.5 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400">
                    {orderTime}
                </span>
                <span className="text-xs font-bold text-gray-500">
                    {timeAgo}
                </span>
            </div>
         </div>

         {/* SHOT BOX / TIMER AREA */}
         <div className="flex flex-col items-end gap-2">
           {activeShots > 0 || item.product.category === 'coffee' ? (
             // Shot box - always show with gray border/background (never orange)
             <button
               onClick={handleTimerAreaClick}
               className="bg-gray-900 border-2 border-gray-600 rounded-xl w-20 h-20 flex flex-col items-center justify-center shrink-0 shadow-inner relative hover:bg-gray-800 transition-colors cursor-pointer"
               type="button"
             >
               <span className="text-3xl font-black text-white leading-none">{activeShots}</span>
               <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Shots</span>
               {/* Caffeine Type Badge */}
               {item.caffeineType && item.caffeineType !== "Normal" && (
                 <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                   {item.caffeineType === "Decaf" ? "Decaf" : "Half-Caff"}
                 </span>
               )}
             </button>
           ) : (
             // Timer area for drinks without shots
             timerState && (timerState.isRunning || timerState.isCompleted) ? (
               // Timer is active - show box with orange border
               <button
                 onClick={handleTimerAreaClick}
                 className="bg-gray-900 border-2 border-orange-400 rounded-xl w-20 h-20 flex flex-col items-center justify-center shrink-0 shadow-inner relative hover:bg-gray-800 transition-colors cursor-pointer"
                 type="button"
               >
                 {timerState.isRunning && !timerState.isCompleted ? (
                   // Timer running - show countdown
                   <div className="flex flex-col items-center">
                     <span className="text-2xl font-black text-orange-400 leading-none">
                       {formatTimer(remainingSeconds)}
                     </span>
                     <button
                       onClick={handleCancelTimer}
                       className="mt-1 text-[10px] text-gray-400 hover:text-red-400 uppercase font-bold tracking-wider transition-colors"
                       type="button"
                     >
                       Cancel
                     </button>
                   </div>
                 ) : (
                   // Timer completed - show alert icon
                   <div className="flex flex-col items-center">
                     <svg
                       xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       viewBox="0 0 24 24"
                       strokeWidth={2}
                       stroke="currentColor"
                       className="w-8 h-8 text-orange-400 animate-pulse"
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                       />
                     </svg>
                     <button
                       onClick={handleCancelTimer}
                       className="mt-1 text-[10px] text-orange-400 hover:text-white uppercase font-bold tracking-wider transition-colors"
                       type="button"
                     >
                       Dismiss
                     </button>
                   </div>
                 )}
               </button>
             ) : (
               // No timer - just show cog icon without box
               <button
                 onClick={handleTimerAreaClick}
                 className="w-20 h-20 flex items-center justify-center shrink-0 cursor-pointer"
                 type="button"
               >
                 <svg
                   xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   viewBox="0 0 24 24"
                   strokeWidth={2}
                   stroke="currentColor"
                   className="w-8 h-8 text-slate-500"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                   />
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
               </button>
             )
           )}
         
         {/* Timer display below shot box (for drinks with shots) */}
         {(activeShots > 0 || item.product.category === 'coffee') && timerState && (
           <div className="w-20 flex flex-col items-center">
             {timerState.isRunning && !timerState.isCompleted ? (
               <div className="bg-gray-900 border-2 border-orange-400 rounded-xl px-3 py-2 flex flex-col items-center min-w-[80px]">
                 <span className="text-xl font-black text-orange-400 leading-none">
                   {formatTimer(remainingSeconds)}
                 </span>
                 <button
                   onClick={handleCancelTimer}
                   className="mt-1 text-[10px] text-gray-400 hover:text-red-400 uppercase font-bold tracking-wider transition-colors"
                   type="button"
                 >
                   Cancel
                 </button>
               </div>
             ) : timerState.isCompleted ? (
               <button
                 onClick={handleCancelTimer}
                 className="bg-gray-900 border-2 border-orange-400 rounded-xl px-3 py-2 flex flex-col items-center min-w-[80px] animate-pulse hover:bg-gray-800 transition-colors cursor-pointer"
                 type="button"
               >
                 <span className="text-xl font-black text-orange-400 leading-none">
                   Done!
                 </span>
                 <span className="mt-1 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                   Dismiss
                 </span>
               </button>
             ) : null}
           </div>
         )}
       </div>
      </div>

      {/* --- DRINK BODY --- */}
      <div className="p-5 flex-1 flex flex-col gap-4">
         
         <div className={`border-b pb-3 ${isCancelled ? 'border-red-500 border-opacity-40' : isGuestOrder ? 'border-[#32A5DC] border-opacity-40' : 'border-gray-700'}`}>
             <div className="flex items-start justify-between gap-2">
                 <div className="flex-1">
                     <h3 className={`text-xl font-extrabold leading-tight ${
                         isCancelled ? 'text-red-300 line-through' : isGuestOrder ? 'text-[#32A5DC]' : 'text-[#32A5DC]'
                     }`}>
                         {item.product.name}
                     </h3>
                     <p className={`text-base font-semibold mt-1 ${
                         isCancelled ? 'text-red-400' : item.temperature?.includes('Iced') ? 'text-blue-300' : 'text-orange-300'
                     }`}>
                         {item.temperature}
                     </p>
                 </div>
                 {/* Cup Type Badge */}
                 {item.cupType && item.cupType !== 'to-go' && (
                     <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
                         {item.cupType === 'for-here' ? 'For-Here' : item.cupType === 'personal' ? 'Personal Cup' : item.cupType}
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

                 // Add milk amount if present and not "Normal"
                 const milkDisplay = item.milkAmount && item.milkAmount !== "Normal" 
                     ? `${item.milkAmount} ${finalMilkName}` 
                     : finalMilkName;

                 return (
                    <li className="flex">
                         <span className={`${colorClass} px-3 py-1.5 rounded-lg text-sm font-bold uppercase shadow-sm`}>
                             {milkDisplay}
                         </span>
                    </li>
                 );
               })()
            )}

            {/* FOAM LEVEL DISPLAY (only show if not "Normal") */}
            {item.foamLevel && item.foamLevel !== "Normal" && (
                <li className="text-lg font-semibold text-gray-300 flex items-start gap-2.5">
                    <span className="mt-2 w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0"></span>
                    <span>
                        {item.foamLevel} foam
                    </span>
                </li>
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
              : isGuestOrder
              ? 'bg-[#32A5DC] hover:bg-[#288bba] active:bg-[#1f7aa3] text-white border-2 border-[#32A5DC]'
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
    </>
  );
}