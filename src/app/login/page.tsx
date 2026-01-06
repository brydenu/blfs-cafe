import { auth, signIn } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage() {
  // 1. Redirect if already logged in
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
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

        {/* Form */}
        <form
            action={async (formData) => {
              "use server";
              await signIn("credentials", formData);
            }}
            className="space-y-5"
        >
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                <input 
                    name="email" 
                    type="email" 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 focus:border-[#32A5DC] transition-all"
                    placeholder="you@example.com"
                />
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-bold text-gray-700">Password</label>
                    <Link href="/forgot-password">
                        <span className="text-xs font-bold text-[#32A5DC] hover:text-[#004876] transition-colors cursor-pointer">
                            Forgot Password?
                        </span>
                    </Link>
                </div>
                <input 
                    name="password" 
                    type="password" 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 focus:border-[#32A5DC] transition-all"
                    placeholder="••••••••"
                />
            </div>

            <button className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold text-lg py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] mt-4">
                Sign In
            </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400 uppercase font-bold tracking-widest">or</span>
            </div>
        </div>

        {/* Footer */}
        <div className="text-center">
            <p className="text-gray-500 font-medium text-sm">
                Don't have an account?{' '}
                <Link href="/register" className="text-[#32A5DC] font-bold hover:underline">
                    Sign Up
                </Link>
            </p>
        </div>

      </div>
    </main>
  );
}