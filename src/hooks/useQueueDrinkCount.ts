"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import {
  getLastKnownQueueCount,
  setLastKnownQueueCount,
} from "@/lib/queue-count-client";

interface RefreshQueuePayload {
  drinkCount?: number;
}

export function useQueueDrinkCount(initialCount: number): number {
  const [drinkCount, setDrinkCount] = useState(
    () => getLastKnownQueueCount() ?? initialCount
  );

  useEffect(() => {
    const knownCount = getLastKnownQueueCount();
    if (knownCount !== null) {
      setDrinkCount(knownCount);
      return;
    }

    setLastKnownQueueCount(initialCount);
    setDrinkCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const onRefresh = (data: RefreshQueuePayload) => {
      if (typeof data?.drinkCount === "number") {
        setLastKnownQueueCount(data.drinkCount);
        setDrinkCount(data.drinkCount);
      }
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const knownCount = getLastKnownQueueCount();
      if (knownCount !== null) {
        setDrinkCount(knownCount);
      }
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("refresh-queue", onRefresh);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      socket.off("refresh-queue", onRefresh);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return drinkCount;
}
