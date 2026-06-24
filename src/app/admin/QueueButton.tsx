'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAdminQueueCount } from "@/providers/AdminQueueCountProvider";

export default function QueueButton() {
  const pathname = usePathname();
  const { drinkCount } = useAdminQueueCount();

  if (pathname === '/admin/queue' || drinkCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/admin/queue">
        {/* Desktop: Full button with text */}
        <button className="hidden md:flex bg-[#32A5DC] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:scale-105 transition-transform items-center gap-3 cursor-pointer">
          <span className="bg-white text-[#004876] w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold">
            {drinkCount}
          </span>
          <span>Queue</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
        
        {/* Mobile: Circle with number only */}
        <button className="md:hidden w-14 h-14 bg-[#32A5DC] text-white font-bold rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center cursor-pointer">
          <span className="text-lg font-extrabold">{drinkCount}</span>
        </button>
      </Link>
    </div>
  );
}
