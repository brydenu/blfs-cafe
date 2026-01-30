'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { fetchSingleOrder, getQueuePosition, cancelOrderItem, updateOrderNotificationPreferences } from "./actions";
import { CoffeeIcon, TeaIcon, DrinkIcon } from "@/components/icons";

interface RecentOrderTrackerProps {
  order: any;
}

export default function RecentOrderTracker({ order }: RecentOrderTrackerProps) {
  const [activeOrder, setActiveOrder] = useState(order);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [queuePositionAnimating, setQueuePositionAnimating] = useState(false);
  const [prevQueuePosition, setPrevQueuePosition] = useState<number | null>(null);
  const completedItemsRef = useRef<Set<number>>(new Set());
  const cancelledItemsRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());
  const [cancellingItems, setCancellingItems] = useState<Set<number>>(new Set());
  const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [updatingNotif, setUpdatingNotif] = useState(false);

  // --- Helper to refresh data (Order + Queue Position) ---
  const refreshData = useCallback(async () => {
    // 1. Update Order Details
    const updatedOrder = await fetchSingleOrder(activeOrder.publicId);
    if (updatedOrder) {
      // On initial load, just set the refs without triggering animations
      if (isInitialLoadRef.current) {
        const initialCompletedSet = new Set<number>();
        const initialCancelledSet = new Set<number>();
        updatedOrder.items.forEach((item: any) => {
          if (item.completed_at !== null && !item.cancelled) {
            initialCompletedSet.add(item.id);
          }
          if (item.cancelled === true) {
            initialCancelledSet.add(item.id);
          }
        });
        completedItemsRef.current = initialCompletedSet;
        cancelledItemsRef.current = initialCancelledSet;
        isInitialLoadRef.current = false;
        setActiveOrder(updatedOrder);
      } else {
        // After initial load, detect changes and trigger animations
        const newlyCompleted: number[] = [];
        const newlyCancelled: number[] = [];
        
        updatedOrder.items.forEach((item: any) => {
          const wasCompleted = completedItemsRef.current.has(item.id);
          const wasCancelled = cancelledItemsRef.current.has(item.id);
          const isNowCompleted = item.completed_at !== null && !item.cancelled;
          const isNowCancelled = item.cancelled === true;
          
          // Only animate if transitioning from not-completed to completed
          if (isNowCompleted && !wasCompleted && !wasCancelled) {
            newlyCompleted.push(item.id);
          }
          
          // Only animate if transitioning from not-cancelled to cancelled
          if (isNowCancelled && !wasCancelled) {
            newlyCancelled.push(item.id);
          }
        });

        // Update completed items ref
        const newCompletedSet = new Set<number>();
        updatedOrder.items.forEach((item: any) => {
          if (item.completed_at !== null && !item.cancelled) {
            newCompletedSet.add(item.id);
          }
        });
        completedItemsRef.current = newCompletedSet;

        // Update cancelled items ref
        const newCancelledSet = new Set<number>();
        updatedOrder.items.forEach((item: any) => {
          if (item.cancelled === true) {
            newCancelledSet.add(item.id);
          }
        });
        cancelledItemsRef.current = newCancelledSet;

        // Trigger animations for newly completed items
        if (newlyCompleted.length > 0) {
          setAnimatingItems(new Set(newlyCompleted));
          setTimeout(() => {
            setAnimatingItems((prev) => {
              const next = new Set(prev);
              newlyCompleted.forEach(id => next.delete(id));
              return next;
            });
          }, 600);
        }

        // Trigger animations for newly cancelled items
        if (newlyCancelled.length > 0) {
          setCancellingItems(new Set(newlyCancelled));
          setTimeout(() => {
            setCancellingItems((prev) => {
              const next = new Set(prev);
              newlyCancelled.forEach(id => next.delete(id));
              return next;
            });
          }, 500);
        }

        setActiveOrder(updatedOrder);
      }
    }

    // 2. Update Queue Position (Only if not complete)
    if (updatedOrder && updatedOrder.status !== 'completed') {
      const pos = await getQueuePosition(updatedOrder.id);
      setQueuePosition(pos);
    } else {
      setQueuePosition(null);
    }
  }, [activeOrder.publicId]);

  // Detect queue position changes and trigger animation
  useEffect(() => {
    // Only animate if both positions are non-null and different (not on initial load)
    if (queuePosition !== null && prevQueuePosition !== null && queuePosition !== prevQueuePosition) {
      setQueuePositionAnimating(true);
      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setQueuePositionAnimating(false);
      }, 600); // Match animation duration
      return () => clearTimeout(timer);
    }
    // Update previous position after checking
    if (queuePosition !== null) {
      setPrevQueuePosition(queuePosition);
    }
  }, [queuePosition, prevQueuePosition]);

  // Update activeOrder when order prop changes
  useEffect(() => {
    setActiveOrder(order);
    // Initialize completed and cancelled items refs and reset initial load flag
    const initialCompleted = new Set<number>();
    const initialCancelled = new Set<number>();
    order.items.forEach((item: any) => {
      if (item.completed_at !== null && !item.cancelled) {
        initialCompleted.add(item.id);
      }
      if (item.cancelled === true) {
        initialCancelled.add(item.id);
      }
    });
    completedItemsRef.current = initialCompleted;
    cancelledItemsRef.current = initialCancelled;
    isInitialLoadRef.current = true; // Reset on new order
  }, [order]);

  // --- Initial Load ---
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- Update Notification Preferences Handler ---
  const handleUpdateNotifications = async (enabled: boolean, emailEnabled?: boolean, smsEnabled?: boolean) => {
    if (updatingNotif) return;
    setUpdatingNotif(true);
    
    try {
      const methods = {
        email: emailEnabled ?? true,
        sms: smsEnabled ?? false
      };
      
      const result = await updateOrderNotificationPreferences(activeOrder.id, {
        notificationsEnabled: enabled,
        notificationMethods: methods,
      });
      
      if (result.success) {
        await refreshData();
      } else {
        alert(result.message || 'Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      alert('Failed to update notification preferences');
    } finally {
      setUpdatingNotif(false);
    }
  };

  // --- Cancel Item Handler ---
  const handleCancelItem = async (itemId: number) => {
    if (isCancelling) return;
    setIsCancelling(true);
    
    try {
      const result = await cancelOrderItem(itemId);
      if (result.success) {
        setConfirmingItemId(null);
        await refreshData();
      } else {
        alert(result.message || 'Failed to cancel item');
      }
    } catch (error) {
      console.error('Error cancelling item:', error);
      alert('Failed to cancel item');
    } finally {
      setIsCancelling(false);
    }
  };

  // --- WebSocket Logic ---
  useEffect(() => {
    if (activeOrder.status === 'completed' || activeOrder.status === 'cancelled') return;

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    const socket = io(url, { transports: ["websocket"] });

    // 1. Listen for MY order updates
    socket.on("order-update", (data: any) => {
      if (String(data.orderId) === String(activeOrder.id) || data.publicId === activeOrder.publicId) {
        refreshData();
      }
    });

    // 2. Listen for GLOBAL queue updates (To update the # position number)
    socket.on("refresh-queue", () => {
      refreshData();
    });

    return () => {
      socket.disconnect();
    };
  }, [activeOrder.id, activeOrder.publicId, activeOrder.status, refreshData]);

  if (!activeOrder) return null;

  const isOrderComplete = activeOrder.status === 'completed';
  const isOrderCancelled = activeOrder.status === 'cancelled';

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl relative overflow-hidden animate-fade-in group">
        
        {/* Header - Mobile: Stacked, Desktop: Side by side */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 md:mb-6 gap-3 md:gap-0">
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                
                {/* NEW: Queue Position Box (Matches your White/Gray Theme) */}
                {!isOrderComplete && !isOrderCancelled && queuePosition !== null && (
                    <div className={`relative bg-gray-50 border border-gray-100 p-2 md:p-3 rounded-xl md:rounded-2xl text-center min-w-[60px] md:min-w-[70px] flex flex-col justify-center flex-shrink-0 ${
                        queuePositionAnimating ? 'animate-queue-burst' : ''
                    }`}>
                        <div className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400 leading-none mb-0.5 md:mb-1">Queue</div>
                        <div className={`relative inline-block text-xl md:text-2xl font-black leading-none transition-all duration-300 ${
                            queuePositionAnimating ? 'text-green-600 scale-110' : 'text-[#004876] scale-100'
                        }`}>
                            #{queuePosition}
                        </div>
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <h3 className="text-[#004876] font-black text-lg md:text-2xl tracking-tight truncate">
                        {isOrderComplete ? "Order Ready" : isOrderCancelled ? "Order Cancelled" : "In Progress"}
                    </h3>
                    <p className="text-gray-500 text-xs md:text-sm font-bold mt-0.5 md:mt-1">
                        {activeOrder.items.length} Item{activeOrder.items.length !== 1 ? 's' : ''} • {new Date(activeOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            </div>
            
            {/* Status Badge - Mobile: Full width, Desktop: Auto */}
            {isOrderComplete ? (
                <div className="bg-green-500 text-white px-4 md:px-5 py-2 rounded-xl font-bold text-xs md:text-sm shadow-md shadow-green-200 flex items-center justify-center md:justify-start gap-2 w-full md:w-auto flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    COMPLETED
                </div>
            ) : isOrderCancelled ? (
                <div className="bg-red-500 text-white px-4 md:px-5 py-2 rounded-xl font-bold text-xs md:text-sm shadow-md shadow-red-200 flex items-center justify-center md:justify-start gap-2 w-full md:w-auto flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    CANCELLED
                </div>
            ) : (
                <div className="bg-[#32A5DC] text-white px-4 md:px-5 py-2 rounded-xl font-bold text-xs md:text-sm shadow-md shadow-blue-200 flex items-center justify-center md:justify-start gap-2 w-full md:w-auto flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    IN-PROGRESS
                </div>
            )}
        </div>

        {/* Drinks List - Mobile: Stacked, Desktop: Side by side */}
        <div className="space-y-2 md:space-y-3">
            {activeOrder.items.map((item: any) => {
                // Prioritize cancelled over completed - check cancelled first
                const isCancelled = item.cancelled === true;
                const isItemDone = item.completed_at !== null && !isCancelled;
                const isInProgress = item.completed_at === null && !isCancelled;
                const showCancelButton = isInProgress;
                const details = [];
                if (item.milkName && item.milkName !== "No Milk") details.push(item.milkName);
                if (item.shots > 0) details.push(`${item.shots} Shots`);
                item.modifiers.forEach((m:any) => details.push(`${m.ingredient.name}`));

                const isAnimating = animatingItems.has(item.id);
                const isCancellingAnim = cancellingItems.has(item.id);

                return (
                    <div key={item.id} className={`relative flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl border hover:bg-gray-100 transition-colors gap-3 md:gap-0 ${
                        isCancelled ? 'bg-red-50/30' : 'border-gray-100'
                    } ${isAnimating ? 'animate-drink-completed' : ''} ${isCancellingAnim ? 'animate-drink-cancelled' : ''}`}>
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base md:text-lg shadow-sm flex-shrink-0 ${
                                isCancelled ? 'bg-red-100 text-red-600' :
                                isItemDone ? 'bg-green-100 text-green-600' : 
                                'bg-white text-gray-400 border border-gray-200'
                            }`}>
                                {item.product.category === 'coffee' ? (
                                    <CoffeeIcon size={24} className="text-gray-400" />
                                ) : item.product.category === 'tea' ? (
                                    <TeaIcon size={24} className="text-gray-400" />
                                ) : (
                                    <DrinkIcon size={24} className="text-gray-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`font-bold text-sm md:text-base truncate ${
                                    isCancelled ? 'text-red-600 line-through opacity-70' :
                                    isItemDone ? 'text-green-600 line-through opacity-60' : 
                                    'text-gray-800'
                                }`}>
                                    {item.product.name}
                                </p>
                                {details.length > 0 && (
                                    <p className={`text-[10px] md:text-xs mt-0.5 font-bold line-clamp-2 ${
                                        isCancelled ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                        {details.join(" • ")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
                            {/* Cancel Button - Two states: initial (small secondary) and confirming (red with Go Back) */}
                            {showCancelButton && (
                                <>
                                    {confirmingItemId === item.id ? (
                                        <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                            <button
                                                onClick={() => handleCancelItem(item.id)}
                                                disabled={isCancelling}
                                                className="px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex-1 md:flex-initial"
                                            >
                                                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmingItemId(null)}
                                                disabled={isCancelling}
                                                className="px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex-1 md:flex-initial"
                                            >
                                                Go Back
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmingItemId(item.id)}
                                            className="px-2 py-1 text-[10px] md:text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors cursor-pointer whitespace-nowrap"
                                            disabled={isCancelling}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Item Status Icon - Mobile: Text tag, Desktop: Symbol */}
                            {isCancelled ? (
                                <>
                                    <span className="md:hidden bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                                        Cancelled
                                    </span>
                                    <div className="hidden md:flex bg-red-500 text-white w-6 h-6 rounded-full items-center justify-center text-[10px] md:text-xs shadow-md font-bold flex-shrink-0">✕</div>
                                </>
                            ) : isItemDone ? (
                                <>
                                    <span className="md:hidden bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                                        Completed
                                    </span>
                                    <div className="hidden md:flex bg-green-500 text-white w-6 h-6 rounded-full items-center justify-center text-[10px] md:text-xs shadow-md flex-shrink-0">✓</div>
                                </>
                            ) : (
                                <>
                                    <span className="md:hidden bg-[#32A5DC]/10 text-[#32A5DC] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                                        In Progress
                                    </span>
                                    <div className="hidden md:flex bg-[#32A5DC]/20 text-[#32A5DC] w-6 h-6 rounded-full items-center justify-center animate-pulse flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Notification Preferences */}
        {!isOrderComplete && !isOrderCancelled && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
                <NotificationControls
                    order={activeOrder}
                    onUpdate={handleUpdateNotifications}
                    isUpdating={updatingNotif}
                />
            </div>
        )}
    </div>
  );
}

// Notification Controls Component
function NotificationControls({ order, onUpdate, isUpdating }: { order: any; onUpdate: (enabled: boolean, emailEnabled?: boolean, smsEnabled?: boolean) => void; isUpdating: boolean }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(order.notificationsEnabled ?? false);
  const [emailEnabled, setEmailEnabled] = useState((order.notificationMethods as any)?.email ?? true);
  const [smsEnabled, setSmsEnabled] = useState((order.notificationMethods as any)?.sms ?? false);
  const [showMethods, setShowMethods] = useState(notificationsEnabled);

  // Sync state when order changes
  useEffect(() => {
    setNotificationsEnabled(order.notificationsEnabled ?? false);
    setEmailEnabled((order.notificationMethods as any)?.email ?? true);
    setSmsEnabled((order.notificationMethods as any)?.sms ?? false);
    setShowMethods(order.notificationsEnabled ?? false);
  }, [order.notificationsEnabled, order.notificationMethods]);

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      // When enabling notifications, automatically enable email
      setNotificationsEnabled(true);
      setEmailEnabled(true);
      setShowMethods(true);
      onUpdate(true, true, smsEnabled);
    } else {
      // When disabling notifications, collapse the options
      setNotificationsEnabled(false);
      setShowMethods(false);
      onUpdate(false, emailEnabled, smsEnabled);
    }
  };

  const handleEmailToggle = (enabled: boolean) => {
    setEmailEnabled(enabled);
    if (notificationsEnabled) {
      // If turning off email and SMS is also off, disable notifications entirely
      if (!enabled && !smsEnabled) {
        setNotificationsEnabled(false);
        setShowMethods(false);
        onUpdate(false, false, false);
      } else {
        onUpdate(true, enabled, smsEnabled);
      }
    }
  };

  const handleSmsToggle = (enabled: boolean) => {
    setSmsEnabled(enabled);
    if (notificationsEnabled) {
      // If turning off SMS and email is also off, disable notifications entirely
      if (!enabled && !emailEnabled) {
        setNotificationsEnabled(false);
        setShowMethods(false);
        onUpdate(false, false, false);
      } else {
        onUpdate(true, emailEnabled, enabled);
      }
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <label className="flex items-center justify-between cursor-pointer gap-2">
        <span className="text-xs md:text-sm font-bold text-[#004876] flex-1">Notify me when this order is completed</span>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={isUpdating}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#32A5DC]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#32A5DC]"></div>
        </label>
      </label>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showMethods ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-2 md:ml-4 space-y-2 md:space-y-3 pl-2 md:pl-4 border-l-2 border-gray-200 pt-2">
          <label className="flex items-center justify-between cursor-pointer gap-2">
            <span className="text-xs md:text-sm font-bold text-gray-700 flex-1">Email</span>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => handleEmailToggle(e.target.checked)}
                disabled={isUpdating}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#32A5DC]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#32A5DC]"></div>
            </label>
          </label>
          
          <label className="flex items-center justify-between cursor-not-allowed opacity-50 gap-2">
            <span className="text-xs md:text-sm font-bold text-gray-500 flex-1">SMS</span>
            <label className="relative inline-flex items-center cursor-not-allowed flex-shrink-0">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => handleSmsToggle(e.target.checked)}
                disabled={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
            </label>
          </label>
        </div>
      </div>
      
      {isUpdating && (
        <div className="text-center">
          <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-[#32A5DC] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}