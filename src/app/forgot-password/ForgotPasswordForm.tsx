'use client';

import { useState } from "react";
import Link from "next/link";
import { handleForgotPassword } from "./actions";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [message, setMessage] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setStatus('loading');
    setMessage("");

    const result = await handleForgotPassword(formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message || "If that email exists, we sent a link.");
    } else {
      setStatus('idle');
      setMessage(result.message || "An error occurred.");
    }
  };

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
            <h1 className="text-3xl font-black text-[#004876] mb-2">Forgot Password?</h1>
            <p className="text-gray-500 text-sm">
                No worries! Enter your email and we will send you a reset link.
            </p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
            <div className="text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                    ✓
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Check your email</h3>
                    <p className="text-gray-500 text-sm">{message}</p>
                </div>
                <Link href="/login">
                    <button className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-4 rounded-xl transition-colors">
                        Back to Login
                    </button>
                </Link>
            </div>
        ) : (
            /* Form State */
            <form action={handleSubmit} className="space-y-6">
                
                {/* Email Input */}
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
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
                    className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Sending...
                        </>
                    ) : (
                        "Send Reset Link"
                    )}
                </button>

                {/* Back Link */}
                <div className="text-center pt-2">
                    <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-[#004876] transition-colors">
                        ← Back to Login
                    </Link>
                </div>
            </form>
        )}
      </div>
    </main>
  );
}