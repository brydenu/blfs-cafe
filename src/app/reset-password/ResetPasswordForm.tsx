'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "./actions";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [message, setMessage] = useState("");
  
  // Guard clause for missing token
  useEffect(() => {
    if (!token) {
        setMessage("Missing or invalid token.");
    }
  }, [token]);

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    setStatus('loading');
    setMessage("");

    const result = await resetPassword(token, formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
    } else {
      setStatus('idle');
      setMessage(result.message);
    }
  };

  if (!token) {
     return (
        <main className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
             {/* Background */}
            <div className="absolute inset-0 z-0 bg-[#004876] fixed">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/10 text-center">
                <h1 className="text-2xl font-black text-red-500 mb-2">Invalid Link</h1>
                <p className="text-gray-500 mb-6">This password reset link is missing or invalid.</p>
                <Link href="/forgot-password">
                    <button className="bg-[#003355] text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.97] active:translate-y-[2px]">
                        Request New Link
                    </button>
                </Link>
            </div>
        </main>
     );
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
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#004876] mb-2">Reset Password</h1>
            <p className="text-gray-500 text-sm">
                Enter your new password below.
            </p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
            <div className="text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                    ✓
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Password Updated!</h3>
                    <p className="text-gray-500 text-sm">You can now sign in with your new password.</p>
                </div>
                <Link href="/login">
                    <button className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.97] active:translate-y-[2px] shadow-lg">
                        Login Now
                    </button>
                </Link>
            </div>
        ) : (
            /* Form State */
            <form action={handleSubmit} className="space-y-6">
                
                {/* New Password */}
                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                        New Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 focus:border-[#32A5DC] transition-all"
                    />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 focus:border-[#32A5DC] transition-all"
                    />
                </div>

                {/* Error Message */}
                {message && status !== 'success' && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold text-center">
                        {message}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] active:translate-y-[2px] disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100 disabled:active:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Updating...
                        </>
                    ) : (
                        "Set New Password"
                    )}
                </button>
            </form>
        )}
      </div>
    </main>
  );
}