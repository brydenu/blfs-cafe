'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { lookupOrderByCode } from './actions';

export default function TrackOrderPage() {
  const [orderCode, setOrderCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!orderCode.trim()) {
      setError('Please enter an order code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await lookupOrderByCode(orderCode.trim());
      
      if (result.success && result.order) {
        router.push(`/track/${orderCode.trim()}`);
      } else {
        setError(result.message || 'Order not found. Please check your order code.');
      }
    } catch (error) {
      console.error('Error looking up order:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        
        {/* Logo Section */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter mb-4 drop-shadow-xl">
            Track Your Order
          </h1>
          <p className="text-lg md:text-xl text-blue-100 font-light">
            Enter your order code to view order status
          </p>
        </div>

        {/* Order Code Form */}
        <div className="bg-white rounded-3xl p-8 w-full shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="orderCode" className="block text-sm font-bold text-gray-700 mb-2 text-left">
                Order Code
              </label>
              <input
                id="orderCode"
                type="text"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                placeholder="Enter order code"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#32A5DC] focus:outline-none text-lg font-mono text-center tracking-wider uppercase text-gray-900"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !orderCode.trim()}
              className="w-full bg-[#004876] hover:bg-[#32A5DC] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {isLoading ? 'Looking up...' : 'Track Order'}
            </button>
          </form>

          {/* Back to Home Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link 
              href="/" 
              className="text-[#32A5DC] hover:text-[#004876] font-medium text-sm transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
