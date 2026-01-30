import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  // 1. Redirect if already logged in
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      
      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 z-0 bg-[#004876]">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* --- CARD --- */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/10">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-gray-100 flex flex-col items-center text-center mb-2">
          <div className="w-16 h-16 relative mb-4">
            <Image src="/logo.png" alt="BioLife Cafe Logo" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#004876]">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your BioLife account</p>
        </div>

        <LoginForm />

      </div>
    </main>
  );
}