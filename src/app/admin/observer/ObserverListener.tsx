'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function ObserverListener() {
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
    
    console.log("🔌 Observer Screen connecting to:", socketUrl);

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("✅ Observer Screen Connected to WebSocket");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Observer Screen Disconnected");
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

  // No visual indicator - just handles socket connection
  return null;
}