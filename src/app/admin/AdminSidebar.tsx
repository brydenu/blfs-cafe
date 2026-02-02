'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChartIcon, ScrollIcon, CoffeeIcon, StarIcon, BoxIcon, CalendarIcon, FireIcon } from "@/components/icons";

interface AdminSidebarProps {
  queueCount: number;
}

export default function AdminSidebar({ queueCount }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/admin", icon: ChartIcon },
    { label: "Order History", href: "/admin/history", icon: ScrollIcon },
    { label: "Menu", href: "/admin/menu", icon: CoffeeIcon },
    { label: "Featured Drinks", href: "/admin/featured-drinks", icon: StarIcon },
    { label: "Inventory", href: "/admin/inventory", icon: BoxIcon },
    { label: "Schedule", href: "/admin/schedule", icon: CalendarIcon },
  ];

  return (
    <aside 
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-[#004876] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out z-20 shrink-0 relative`}
    >
        
        {/* --- TOGGLE BUTTON --- */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-20 bg-[#32A5DC] text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform z-30 border-2 border-[#004876]"
        >
            {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            )}
        </button>

        {/* --- BRAND HEADER --- */}
        <div className={`h-20 flex items-center ${isCollapsed ? "justify-center" : "px-6 gap-3"} border-b border-white/10 bg-[#003355]`}>
             <div className="relative w-8 h-8 shrink-0 max-w-[32px] max-h-[32px]">
               <Image src="/logo.png" alt="Logo" fill className="object-contain" sizes="32px" />
             </div>
             {!isCollapsed && (
                 <h1 className="font-bold text-xl tracking-wide whitespace-nowrap overflow-hidden">
                    Barista<span className="text-[#32A5DC]">OS</span>
                 </h1>
             )}
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.href} href={item.href}>
                        <div 
                            className={`flex items-center ${isCollapsed ? "justify-center px-0" : "px-4 gap-3"} py-3 rounded-xl transition-all duration-200 cursor-pointer group relative
                            ${isActive ? "bg-[#32A5DC] text-white shadow-lg" : "hover:bg-white/10 text-blue-100 hover:text-white"}`}
                        >
                            <span className="shrink-0">
                              <item.icon size={20} className="text-current" />
                            </span>
                            
                            {!isCollapsed && (
                                <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>
                            )}

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="absolute left-14 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                                    {item.label}
                                </div>
                            )}
                        </div>
                    </Link>
                );
            })}

            {/* --- LIVE QUEUE BUTTON --- */}
            <div className="pt-4 border-t border-white/10 mt-2">
                <Link href="/admin/queue"> 
                    <div 
                        className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} py-3 rounded-xl cursor-pointer group transition-all duration-300
                        ${isCollapsed ? "bg-transparent" : "bg-gradient-to-r from-[#32A5DC] to-[#288bba] shadow-lg border border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`${isCollapsed ? "animate-pulse" : ""} shrink-0`}>
                              <FireIcon size={isCollapsed ? 24 : 18} className="text-current" />
                            </span>
                            {!isCollapsed && <span className="font-bold text-sm text-white">Live Queue</span>}
                        </div>
                        
                        {/* Badge Logic */}
                        {queueCount > 0 && (
                            <span className={`
                                flex items-center justify-center font-black shadow-sm
                                ${isCollapsed 
                                    ? "absolute top-2 right-2 bg-red-500 text-white w-5 h-5 text-[10px] rounded-full border-2 border-[#004876]" 
                                    : "bg-white text-[#004876] text-xs px-2 py-0.5 rounded-full"
                                }
                            `}>
                                {queueCount}
                            </span>
                        )}
                    </div>
                </Link>
            </div>
        </nav>

        {/* --- FOOTER --- */}
        <div className="p-4 border-t border-white/10 bg-[#003355]">
            <Link href="/dashboard">
                <button 
                    className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2"} text-xs font-bold text-blue-300 hover:text-white transition-colors py-2 rounded-lg hover:bg-white/5`}
                    title="Exit to App"
                >
                    <span className="text-lg">↩</span>
                    {!isCollapsed && <span>Exit to App</span>}
                </button>
            </Link>
        </div>
    </aside>
  );
}