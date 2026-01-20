'use client';

import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { fetchSingleOrder, getQueuePosition, cancelOrderItem } from "./actions";

interface RecentOrderTrackerProps {
  order: any;
}

export default function RecentOrderTracker({ order }: RecentOrderTrackerProps) {
  const [activeOrder, setActiveOrder] = useState(order);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // --- Helper to refresh data (Order + Queue Position) ---
  const refreshData = useCallback(async () => {
    // 1. Update Order Details
    const updatedOrder = await fetchSingleOrder(activeOrder.publicId);
    if (updatedOrder) setActiveOrder(updatedOrder);

    // 2. Update Queue Position (Only if not complete)
    if (updatedOrder && updatedOrder.status !== 'completed') {
      const pos = await getQueuePosition(updatedOrder.id);
      setQueuePosition(pos);
    } else {
      setQueuePosition(null);
    }
  }, [activeOrder.publicId]);

  // --- Initial Load ---
  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
    const url = `${protocol}//${hostname}:3001`;

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
    <div className="bg-white rounded-3xl p-6 shadow-xl relative overflow-hidden animate-fade-in group">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                
                {/* NEW: Queue Position Box (Matches your White/Gray Theme) */}
                {!isOrderComplete && !isOrderCancelled && queuePosition !== null && (
                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl text-center min-w-[70px] flex flex-col justify-center">
                        <div className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Queue</div>
                        <div className="text-2xl font-black text-[#004876] leading-none">#{queuePosition}</div>
                    </div>
                )}

                <div>
                    <h3 className="text-[#004876] font-black text-2xl tracking-tight">
                        {isOrderComplete ? "Order Ready" : isOrderCancelled ? "Order Cancelled" : "In Progress"}
                    </h3>
                    <p className="text-gray-500 text-sm font-bold mt-1">
                        {activeOrder.items.length} Item{activeOrder.items.length !== 1 ? 's' : ''} • {new Date(activeOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            </div>
            
            {/* Status Badge */}
            {isOrderComplete ? (
                <div className="bg-green-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-green-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    COMPLETED
                </div>
            ) : isOrderCancelled ? (
                <div className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-red-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    CANCELLED
                </div>
            ) : (
                <div className="bg-[#32A5DC] text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    IN-PROGRESS
                </div>
            )}
        </div>

        {/* Drinks List */}
        <div className="space-y-3">
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

                return (
                    <div key={item.id} className={`relative flex justify-between items-center bg-gray-50 p-4 rounded-2xl border hover:bg-gray-100 transition-colors ${
                        isCancelled ? 'border-red-300 bg-red-50/30' : 'border-gray-100'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${
                                isCancelled ? 'bg-red-100 text-red-600' :
                                isItemDone ? 'bg-green-100 text-green-600' : 
                                'bg-white text-gray-400 border border-gray-200'
                            }`}>
                                {item.product.category === 'coffee' ? '☕' : '🥤'}
                            </div>
                            <div>
                                <p className={`font-bold text-base ${
                                    isCancelled ? 'text-red-600 line-through opacity-70' :
                                    isItemDone ? 'text-green-600 line-through opacity-60' : 
                                    'text-gray-800'
                                }`}>
                                    {item.product.name}
                                </p>
                                {details.length > 0 && (
                                    <p className={`text-xs mt-0.5 font-bold ${
                                        isCancelled ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                        {details.join(" • ")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Cancel Button - Two states: initial (small secondary) and confirming (red with Go Back) */}
                            {showCancelButton && (
                                <>
                                    {confirmingItemId === item.id ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCancelItem(item.id)}
                                                disabled={isCancelling}
                                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmingItemId(null)}
                                                disabled={isCancelling}
                                                className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                Go Back
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmingItemId(item.id)}
                                            className="px-2 py-1 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors cursor-pointer"
                                            disabled={isCancelling}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Item Status Icon - Prioritize cancelled */}
                            {isCancelled ? (
                                <div className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md font-bold">✕</div>
                            ) : isItemDone ? (
                                <div className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">✓</div>
                            ) : (
                                <div className="bg-[#32A5DC]/20 text-[#32A5DC] w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
}