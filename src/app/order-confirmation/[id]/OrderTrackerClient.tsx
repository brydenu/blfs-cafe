'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useToast } from "@/providers/ToastProvider";

export default function OrderTrackerClient({ order, ordersAhead, estimatedMinutes }: any) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(false); // <--- New State

  const isOrderComplete = order.status === 'completed';

  useEffect(() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const url = `${protocol}//${hostname}:3001`;

    console.log("🔌 Tracker connecting to:", url);

    const socket = io(url, {
        transports: ["websocket"], 
        reconnectionAttempts: 5
    });

    socket.on("connect", () => {
      console.log("✅ Tracker Connected");
      setIsConnected(true); // <--- Set Green
    });

    socket.on("disconnect", () => {
      console.log("❌ Tracker Disconnected");
      setIsConnected(false); // <--- Set Red
    });

    socket.on("order-update", (data: any) => {
      console.log("🔔 Order Update Received:", data);

      if (String(data.orderId) !== String(order.id)) return;

      if (data.type === 'item-completed') {
        showToast(`☕ ${data.recipientName}'s ${data.itemName} is ready!`);
        router.refresh();
      }

      if (data.type === 'order-completed') {
        showToast(`✅ Order Complete!`);
        router.refresh();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order.id, router, showToast]);

  return (
    <div className="relative">
        
        {/* CONNECTION STATUS DOT (Top Right of Card) */}
        <div className="absolute -top-4 -right-4 flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-bold text-white/50 uppercase">
                {isConnected ? 'Live' : 'Offline'}
            </span>
        </div>

        {/* STATUS HEADER */}
        {isOrderComplete ? (
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl text-white mx-auto mb-6 shadow-lg shadow-green-500/20 animate-bounce-in">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>
        ) : (
            <div className="w-20 h-20 bg-[#32A5DC] rounded-full flex items-center justify-center text-4xl text-white mx-auto mb-6 shadow-lg shadow-blue-500/20 animate-pulse">
                ⏳
            </div>
        )}

        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            {isOrderComplete ? "Order Ready!" : "Order Received"}
        </h1>
        <p className="text-blue-100/80 text-sm md:text-base mb-8 font-medium">
            {isOrderComplete 
                ? "Please head to the pickup counter." 
                : "Sit tight, the baristas are working their magic."}
        </p>

        {/* STATS (Hide if complete) */}
        {!isOrderComplete && (
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#003355]/50 rounded-xl p-4 border border-white/5">
                    <span className="block text-blue-300 text-[10px] uppercase font-extrabold tracking-widest mb-1">Queue Position</span>
                    <span className="text-3xl font-extrabold text-white leading-none">
                        {ordersAhead === 0 ? "1st" : `#${ordersAhead + 1}`}
                    </span>
                </div>
                <div className="bg-[#003355]/50 rounded-xl p-4 border border-white/5">
                    <span className="block text-blue-300 text-[10px] uppercase font-extrabold tracking-widest mb-1">Est. Wait</span>
                    <span className="text-3xl font-extrabold text-white leading-none">
                        {estimatedMinutes} <span className="text-sm font-bold opacity-70">min</span>
                    </span>
                </div>
            </div>
        )}

        {/* DRINK LIST */}
        <div className="bg-[#003355]/30 rounded-xl border border-white/10 mb-8 text-left overflow-hidden">
            <div className="bg-white/5 p-3 border-b border-white/10 flex justify-between items-center">
                 <p className="text-[10px] text-blue-300 uppercase font-extrabold tracking-widest">
                    Items ({order.items.length})
                </p>
                <span className="text-[10px] text-white font-mono opacity-50">#{order.publicId.split('-')[0]}</span>
            </div>
            
            <div className="divide-y divide-white/5">
                {order.items.map((item: any) => {
                    const isItemDone = item.completed === true;
                    return (
                        <div key={item.id} className="p-4 flex items-center justify-between transition-colors hover:bg-white/5">
                            <div>
                                <p className={`font-bold text-sm ${isItemDone ? 'text-green-400 line-through opacity-70' : 'text-white'}`}>
                                    {item.product.name}
                                </p>
                                <p className="text-xs text-blue-200">
                                    For: {item.recipientName || "Guest"}
                                </p>
                            </div>
                            
                            {/* Status Icon */}
                            {isItemDone ? (
                                <span className="bg-green-500/20 text-green-400 p-1.5 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </span>
                            ) : (
                                <span className="bg-white/10 text-blue-200 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                                    Prep
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
}