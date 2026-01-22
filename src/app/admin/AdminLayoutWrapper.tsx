'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import QueueButton from "./QueueButton";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isObserverRoute = pathname?.includes('/admin/observer');

  // If observer route, render without admin layout wrapper
  if (isObserverRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col w-full overflow-x-hidden">
      {/* Admin Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-50 w-full">
        <div className="flex items-center gap-4">
           {/* Wrapped logo in Link to Dashboard for convenience */}
           <Link href="/admin/dashboard" className="relative w-8 h-8 cursor-pointer">
             <Image src="/logo.png" alt="Logo" fill className="object-contain" />
           </Link>
           <h1 className="font-bold text-xl tracking-wide">Barista<span className="text-[#32A5DC]">OS</span></h1>
        </div>
        
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400 items-center">
           <Link href="/admin/queue" className="hover:text-white transition-colors">Active Queue</Link>
           <Link href="/admin/history" className="hover:text-white transition-colors">History</Link>
           <Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin Dashboard</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto w-full">
        <div className="w-full max-w-full">
          {children}
        </div>
      </main>

      {/* Fixed Queue Button */}
      <QueueButton />
    </div>
  );
}