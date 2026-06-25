"use client";

import Link from "next/link";
import { CoffeeIcon } from "@/components/icons";
import { useQueueDrinkCount } from "@/hooks/useQueueDrinkCount";
import { formatQueueSubtext } from "@/lib/queue-subtext";

interface OrderNowButtonProps {
  initialQueueCount: number;
}

export default function OrderNowButton({ initialQueueCount }: OrderNowButtonProps) {
  const drinkCount = useQueueDrinkCount(initialQueueCount);

  return (
    <Link href="/menu" className="block h-full">
      <button className="w-full h-full min-h-[110px] bg-[#32A5DC] hover:bg-[#288bba] text-white p-4 md:p-6 rounded-3xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.97] active:translate-y-[2px] flex flex-col items-center justify-center gap-2 cursor-pointer group border border-white/10">
        <CoffeeIcon size={48} className="group-hover:scale-110 transition-transform duration-300" />
        <div className="flex flex-col items-center gap-0">
          <span className="font-black text-sm md:text-lg text-center leading-tight">Order Now</span>
          <span className="text-[10px] md:text-xs italic font-medium text-white/75 text-center leading-tight transition-opacity duration-300">
            {formatQueueSubtext(drinkCount)}
          </span>
        </div>
      </button>
    </Link>
  );
}
