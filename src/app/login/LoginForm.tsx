'use client';

import { useActionState, useEffect } from 'react';
import { authenticate } from './actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [result, formAction, isPending] = useActionState(authenticate, undefined);
  
  // Handle successful login with client-side redirect
  // This is more reliable in production than server-side redirects with useActionState
  useEffect(() => {
    if (result && typeof result === 'object' && 'success' in result && (result as { success: boolean }).success) {
      router.push('/dashboard');
      router.refresh(); // Ensure the page updates with new session
    }
  }, [result, router]);
  
  // Extract error message from result
  const errorMessage = typeof result === 'string' ? result : undefined;

  return (
    <>
      {/* Form */}
      <form
        action={formAction}
        className="space-y-5"
      >
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
          <input 
            name="email" 
            type="email" 
            required 
            disabled={isPending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 focus:border-[#32A5DC] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isPending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 focus:border-[#32A5DC] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit"
          disabled={isPending}
          className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold text-lg py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.97] active:translate-y-[2px] mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isPending ? 'Signing In...' : 'Sign In'}
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
    </>
  );
}
