'use client';

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

const REFRESH_DEBOUNCE_MS = 800;

export default function ObserverListener() {
  const router = useRouter();
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

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("refresh-queue", scheduleRefresh);

    return () => {
      socket.off("refresh-queue", scheduleRefresh);

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [router]);

  return null;
}
