import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Security Check
  if (!session || session.user.role !== "admin") {
    redirect("/"); // Kick them out to home
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Admin Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
           {/* Wrapped logo in Link to Dashboard for convenience */}
           <Link href="/admin/dashboard" className="relative w-8 h-8 cursor-pointer">
             <Image src="/logo.png" alt="Logo" fill className="object-contain" />
           </Link>
           <h1 className="font-bold text-xl tracking-wide">Barista<span className="text-[#32A5DC]">OS</span></h1>
        </div>
        
        <nav className="flex gap-6 text-sm font-medium text-gray-400">
           {/* Added Dashboard link so you can get back to it */}
           <Link href="/admin/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
           <Link href="/admin/queue" className="hover:text-white transition-colors">Active Queue</Link>
           <Link href="/admin/history" className="hover:text-white transition-colors">History</Link>
           <Link href="/" className="text-[#32A5DC] hover:text-white transition-colors">Exit to Menu</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}