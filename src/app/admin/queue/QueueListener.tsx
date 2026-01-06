'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function QueueListener() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Dynamic Connection URL
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const url = `${protocol}//${hostname}:3001`;

    console.log("🔌 Admin Queue connecting to:", url);

    const socket = io(url, {
      transports: ["websocket"], // Force websocket for speed
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Admin Connected to WebSocket");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Admin Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection Error:", err.message);
      setIsConnected(false);
    });

    // LISTENER: Only listens for 'refresh-queue'
    socket.on("refresh-queue", (data: any) => {
      console.log("🔔 Queue Refresh Signal Received");
      router.refresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  // Visual Status Indicator (Bottom Right of Screen)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-black/80 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-white/10">
       <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 animate-pulse'}`}></div>
       <span className="text-xs font-bold uppercase tracking-wider">
         {isConnected ? 'Live' : 'Offline'}
       </span>
    </div>
  );
}