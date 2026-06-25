"use client";

import { useEffect, useRef, useState } from "react";
import { CoffeeIcon } from "@/components/icons";
import { useQueueDrinkCount } from "@/hooks/useQueueDrinkCount";
import { formatQueueIndicatorLabel } from "@/lib/queue-subtext";

interface QueueStatusIndicatorProps {
  initialQueueCount: number;
}

export default function QueueStatusIndicator({
  initialQueueCount,
}: QueueStatusIndicatorProps) {
  const drinkCount = useQueueDrinkCount(initialQueueCount);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevCountRef = useRef(drinkCount);

  useEffect(() => {
    if (prevCountRef.current === drinkCount) return;

    prevCountRef.current = drinkCount;
    setIsHighlighted(true);

    const timer = setTimeout(() => setIsHighlighted(false), 700);
    return () => clearTimeout(timer);
  }, [drinkCount]);

  return (
    <div
      className="fixed bottom-6 left-4 sm:left-6 z-40 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`flex items-center gap-2.5 bg-[#003355]/90 backdrop-blur-md text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-xl border border-white/10 transition-all duration-500 ${
          isHighlighted ? "scale-[1.03] border-[#32A5DC]/40 shadow-[0_0_20px_rgba(50,165,220,0.25)]" : ""
        }`}
      >
        <CoffeeIcon
          size={18}
          className={`text-[#32A5DC] shrink-0 transition-transform duration-500 ${
            isHighlighted ? "scale-110" : ""
          }`}
        />
        <span className="text-xs sm:text-sm font-semibold text-white/90 whitespace-nowrap">
          {formatQueueIndicatorLabel(drinkCount)}
        </span>
      </div>
    </div>
  );
}
