'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
}

export default function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/admin/dashboard');
  };

  return (
    <button
      onClick={handleBack}
      className={className || "w-12 h-12 bg-white/90 backdrop-blur-sm text-[#004876] rounded-full shadow-lg border-2 border-[#32A5DC]/30 hover:bg-white hover:border-[#32A5DC] transition-all flex items-center justify-center"}
      aria-label="Go back to admin dashboard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
    </button>
  );
}