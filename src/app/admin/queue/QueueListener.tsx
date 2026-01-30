'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function QueueListener() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Dynamic Connection URL
    // Support environment variable for AWS/deployment scenarios
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Allow override via environment variable or default to port 3001
    const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || '3001';
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `${protocol}//${hostname}:${socketPort}`;
    
    console.log("🔌 Admin Queue connecting to:", socketUrl);

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
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
      console.error("Socket URL attempted:", socketUrl);
      setIsConnected(false);
    });

    // Log reconnection attempts
    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Failed to reconnect to WebSocket server");
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