'use client';

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { fetchDailyHistory } from "./actions"; 

interface LiveOrderWidgetProps {
  initialOrders: any[]; 
}

export default function LiveOrderWidget({ initialOrders }: LiveOrderWidgetProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [currentDateString, setCurrentDateString] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-CA');
  const isToday = currentDateString === todayStr;

  const handleDateChange = async (days: number) => {
    if (loading) return;
    setLoading(true);
    
    const [year, month, day] = currentDateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    const nextDateStr = `${nextY}-${nextM}-${nextD}`;

    setCurrentDateString(nextDateStr);
    const newOrders = await fetchDailyHistory(nextDateStr);
    setOrders(newOrders);
    setLoading(false);
  };

  useEffect(() => {
    if (!isToday) return;

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const url = `${protocol}//${hostname}:3001`;

    const socket = io(url, { transports: ["websocket"] });

    socket.on("order-update", async (data: any) => {
      const freshOrders = await fetchDailyHistory(todayStr);
      setOrders(freshOrders);
    });

    return () => {
      socket.disconnect();
    };
  }, [isToday, todayStr]);

  const prettyDate = new Date(currentDateString + 'T12:00:00').toLocaleDateString('en-US', {
     weekday: 'short', month: 'short', day: 'numeric'
  });

  return (
    <div className="bg-white rounded-3xl shadow-xl w-full flex flex-col h-full overflow-hidden transition-all duration-300">
      
      {/* HEADER */}
      <div className="p-5 border-b border-gray-100 bg-gray-50">
         <div className="flex justify-between items-center mb-4">
             <h2 className="text-[#004876] font-black text-lg">Daily History</h2>
             <span className="bg-white text-gray-500 text-xs px-2.5 py-1 rounded-full font-bold border border-gray-200 shadow-sm">
                {orders.length} Total
             </span>
         </div>

         {/* Date Controls */}
         <div className="flex items-center justify-between bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
             <button 
                type="button"
                onClick={() => handleDateChange(-1)}
                className={`w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#32A5DC] hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}
             >
                ←
             </button>
             
             <span className="text-sm font-bold text-gray-700 min-w-[80px] text-center">
                {loading ? <span className="animate-pulse">...</span> : (isToday ? "Today" : prettyDate)}
             </span>

             <button 
                type="button"
                onClick={() => handleDateChange(1)}
                className={`w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#32A5DC] hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ${loading || isToday ? 'opacity-20 pointer-events-none' : ''}`}
             >
                →
             </button>
         </div>
      </div>

      {/* SCROLLABLE LIST */}
      <div className="max-h-[500px] overflow-y-auto p-4 space-y-4 flex-1 custom-scrollbar relative">
        
        {loading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center transition-opacity duration-300">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#32A5DC] rounded-full animate-spin"></div>
            </div>
        )}

        {orders.length === 0 ? (
           <div className="text-center py-12 opacity-40">
               <div className="text-4xl mb-2 grayscale">☕</div>
               <p className="text-sm text-gray-400 font-bold">No orders found.</p>
           </div>
        ) : (
            orders.map((order: any) => {
                const isFullyComplete = order.status === 'completed';

                return (
                    <div key={order.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative overflow-hidden group w-full hover:bg-gray-100 transition-colors animate-fade-in">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-gray-800 font-black text-base leading-none mb-1">
                                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    #{order.publicId.split('-')[0]}
                                </p>
                            </div>
                            
                            {/* Status Badge */}
                            {isFullyComplete ? (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold uppercase border border-green-200">
                                    Completed
                                </span>
                            ) : (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase border border-blue-100">
                                    Preparing
                                </span>
                            )}
                        </div>

                        {/* Items */}
                        <div className="space-y-2 border-t border-gray-200 pt-3">
                            {order.items.map((item: any) => {
                                const details = [];
                                if (item.milkName && item.milkName !== "No Milk") details.push(item.milkName);
                                if (item.shots > 0) details.push(`${item.shots} Shots`);
                                item.modifiers.forEach((m:any) => details.push(`${m.ingredient.name} (${m.quantity})`));

                                return (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">
                                                {item.product.name}
                                            </p>
                                            {details.length > 0 && (
                                                <p className="text-[11px] text-gray-400 font-bold leading-tight mt-0.5">
                                                    {details.join(" • ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
}