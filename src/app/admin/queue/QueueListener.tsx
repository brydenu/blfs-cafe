'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

const REFRESH_DEBOUNCE_MS = 800;

export default function QueueListener() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    };

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("refresh-queue", scheduleRefresh);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("refresh-queue", scheduleRefresh);

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [router]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-black/80 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-white/10">
       <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 animate-pulse'}`}></div>
       <span className="text-xs font-bold uppercase tracking-wider">
         {isConnected ? 'Live' : 'Offline'}
       </span>
    </div>
  );
}
