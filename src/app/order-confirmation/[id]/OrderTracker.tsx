'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useToast } from "@/providers/ToastProvider";
import { cancelOrderItem, updateOrderNotificationPreferences } from "@/app/dashboard/actions";
import { cancelGuestOrderItem, updateGuestOrderNotifications } from "@/app/track/actions";
import { updateGuestEmail } from "../actions";

export default function OrderTracker({ order, ordersAhead, estimatedMinutes }: any) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [activeOrder, setActiveOrder] = useState(order);
  const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [updatingNotif, setUpdatingNotif] = useState(false);
  
  // Email input state for guest orders
  const [email, setEmail] = useState(order.guestEmail || '');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(!!order.guestEmail);

  // Detect if this is a guest order
  const isGuestOrder = !order.userId;

  // Update activeOrder when order prop changes
  useEffect(() => {
    setActiveOrder(order);
    setEmail(order.guestEmail || '');
    setEmailSubmitted(!!order.guestEmail);
  }, [order]);

  const isOrderComplete = activeOrder.status === 'completed';

  // --- Update Notification Preferences Handler ---
  const handleUpdateNotifications = async (enabled: boolean, emailEnabled?: boolean, smsEnabled?: boolean) => {
    if (updatingNotif) return;
    setUpdatingNotif(true);
    
    try {
      const methods = {
        email: emailEnabled ?? true,
        sms: smsEnabled ?? false
      };
      
      let result;
      if (isGuestOrder) {
        result = await updateGuestOrderNotifications(activeOrder.id, {
          notificationsEnabled: enabled,
          notificationMethods: methods,
        });
      } else {
        result = await updateOrderNotificationPreferences(activeOrder.id, {
          notificationsEnabled: enabled,
          notificationMethods: methods,
        });
      }
      
      if (result.success) {
        showToast('Notification preferences updated');
        router.refresh();
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
      let result;
      if (isGuestOrder) {
        result = await cancelGuestOrderItem(itemId, activeOrder.publicId);
      } else {
        result = await cancelOrderItem(itemId);
      }
      
      if (result.success) {
        setConfirmingItemId(null);
        showToast('Item cancelled');
        router.refresh();
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

  // --- Email Submit Handler (Guest Only) ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || emailSubmitted || !isGuestOrder) return;

    setIsSubmittingEmail(true);
    try {
      const result = await updateGuestEmail(activeOrder.id, email.trim());
      if (result.success) {
        setEmailSubmitted(true);
        router.refresh();
      } else {
        alert(result.message || 'Failed to save email');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      alert('Failed to save email');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // Socket.io connection for live updates
  useEffect(() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const url = `${protocol}//${hostname}:3001`;

    console.log("🔌 Order Tracker connecting to:", url);

    const socket = io(url, {
        transports: ["websocket"], 
        reconnectionAttempts: 5
    });

    socket.on("connect", () => {
      console.log("✅ Order Tracker Connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Order Tracker Disconnected");
      setIsConnected(false);
    });

    socket.on("order-update", (data: any) => {
      console.log("🔔 Order Update Received:", data);

      // Match by orderId or publicId
      if (String(data.orderId) !== String(activeOrder.id) && data.publicId !== activeOrder.publicId) return;

      if (data.type === 'item-completed') {
        showToast(`☕ ${data.recipientName}'s ${data.itemName} is ready!`);
        router.refresh();
      }

      if (data.type === 'order-completed') {
        showToast(`✅ Order Complete!`);
        router.refresh();
      }

      if (data.type === 'item-cancelled' || data.type === 'order-cancelled') {
        router.refresh();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeOrder.id, activeOrder.publicId, router, showToast]);

  return (
    <div className="relative w-full">
        
        {/* CONNECTION STATUS DOT (Top Right of Card) */}
        <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full border border-gray-200 z-10">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-bold text-gray-600 uppercase">
                {isConnected ? 'Live' : 'Offline'}
            </span>
        </div>

        {/* STATUS HEADER */}
        {isOrderComplete ? (
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500 rounded-full flex items-center justify-center text-3xl md:text-4xl text-white mx-auto mb-4 md:mb-6 shadow-lg shadow-green-500/20 animate-bounce-in">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>
        ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#32A5DC] rounded-full flex items-center justify-center text-3xl md:text-4xl text-white mx-auto mb-4 md:mb-6 shadow-lg shadow-blue-500/20 animate-pulse">
                ⏳
            </div>
        )}

        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#004876] mb-2 px-2">
            {isOrderComplete ? "Order Ready!" : "Order Received"}
        </h1>
        <p className="text-gray-600 text-xs md:text-sm lg:text-base mb-6 md:mb-8 font-medium px-2">
            {isOrderComplete 
                ? "Please head to the pickup counter." 
                : "Your order has been added to the queue and will be prepared shortly."}
        </p>

        {/* ORDER ID - Prominently Displayed for Guests */}
        {isGuestOrder && (
          <div className="bg-[#32A5DC]/10 border-2 border-[#32A5DC] rounded-xl p-3 md:p-4 mb-4 md:mb-6 mx-2 md:mx-0">
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Your Order Code
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#004876] font-mono tracking-wider break-all">
              {activeOrder.publicId}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-2">
              Save this code to track your order later
            </p>
          </div>
        )}

        {/* STATS (Hide if complete) */}
        {!isOrderComplete && (
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 px-2 md:px-0">
                <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200">
                    <span className="block text-gray-500 text-[9px] md:text-[10px] uppercase font-extrabold tracking-widest mb-1">Queue Position</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-[#004876] leading-none">
                        {ordersAhead === 0 ? "1st" : `#${ordersAhead + 1}`}
                    </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200">
                    <span className="block text-gray-500 text-[9px] md:text-[10px] uppercase font-extrabold tracking-widest mb-1">Est. Wait</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-[#004876] leading-none">
                        {estimatedMinutes} <span className="text-xs md:text-sm font-bold text-gray-500">min</span>
                    </span>
                </div>
            </div>
        )}

        {/* DRINK LIST */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 mb-6 md:mb-8 text-left overflow-hidden mx-2 md:mx-0">
            <div className="bg-white p-2 md:p-3 border-b border-gray-200 flex justify-between items-center">
                 <p className="text-[9px] md:text-[10px] text-gray-500 uppercase font-extrabold tracking-widest">
                    Items ({activeOrder.items.length})
                </p>
                <span className="text-[9px] md:text-[10px] text-gray-400 font-mono truncate ml-2">#{activeOrder.publicId}</span>
            </div>
            
            <div className="divide-y divide-gray-200">
                {activeOrder.items.map((item: any) => {
                    // Prioritize cancelled over completed
                    const isCancelled = item.cancelled === true;
                    const isItemDone = item.completed_at !== null && !isCancelled;
                    const isInProgress = item.completed_at === null && !isCancelled;
                    const showCancelButton = isInProgress;
                    return (
                        <div key={item.id} className={`relative p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 transition-colors hover:bg-gray-100 bg-white ${
                            isCancelled ? 'border-l-4 border-red-400 bg-red-50/30' : ''
                        }`}>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-xs md:text-sm truncate ${
                                    isCancelled ? 'text-red-600 line-through opacity-70' :
                                    isItemDone ? 'text-green-600 line-through opacity-70' : 
                                    'text-[#004876]'
                                }`}>
                                    {item.product.name}
                                </p>
                                <p className={`text-[10px] md:text-xs ${
                                    isCancelled ? 'text-red-500' : 'text-gray-600'
                                }`}>
                                    For: {item.recipientName || "Guest"}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Cancel Button - Two states: initial (small secondary) and confirming (red with Go Back) */}
                                {showCancelButton && (
                                    <>
                                        {confirmingItemId === item.id ? (
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleCancelItem(item.id)}
                                                    disabled={isCancelling}
                                                    className="px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingItemId(null)}
                                                    disabled={isCancelling}
                                                    className="px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
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

                                {/* Status Icon - Prioritize cancelled */}
                                {isCancelled ? (
                                    <span className="bg-red-100 text-red-600 px-1.5 md:px-2 py-1 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wide border border-red-200 whitespace-nowrap">
                                        Cancelled
                                    </span>
                                ) : isItemDone ? (
                                    <span className="bg-green-100 text-green-600 p-1 md:p-1.5 rounded-full flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </span>
                                ) : (
                                    <span className="bg-[#32A5DC]/10 text-[#32A5DC] px-1.5 md:px-2 py-1 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                                        In-progress
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* EMAIL INPUT FORM (Guest Only) */}
        {isGuestOrder && !emailSubmitted && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 mx-2 md:mx-0">
            <p className="text-xs md:text-sm font-bold text-[#004876] mb-3">
              Get notified when your order is ready
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:border-[#32A5DC] focus:outline-none text-gray-900"
                disabled={isSubmittingEmail}
                required
              />
              <button
                type="submit"
                disabled={isSubmittingEmail || !email.trim()}
                className="w-full bg-[#32A5DC] hover:bg-[#004876] text-white font-bold py-2 text-sm md:text-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingEmail ? 'Saving...' : 'Save Email'}
              </button>
            </form>
          </div>
        )}

        {isGuestOrder && emailSubmitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 mx-2 md:mx-0">
            <p className="text-xs md:text-sm font-bold text-green-700">
              ✓ Email saved! You'll receive notifications when your order is ready.
            </p>
          </div>
        )}

        {/* Notification Preferences - Only show for logged-in users */}
        {!isOrderComplete && !isGuestOrder && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200 mx-2 md:mx-0">
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
