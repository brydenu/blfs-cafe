'use client';

import { CafeStatus } from '@/lib/schedule-status';

interface CafeStatusBannerProps {
  status: CafeStatus;
}

export default function CafeStatusBanner({ status }: CafeStatusBannerProps) {
  // Don't show banner if cafe is open
  if (status.type === 'open') {
    return null;
  }

  // Determine styling based on status type
  const getBannerStyles = () => {
    switch (status.type) {
      case 'not-opened-yet':
        return 'bg-amber-500 text-white';
      case 'closed-between-periods':
        return 'bg-blue-500 text-white';
      case 'closed-for-day':
        return 'bg-red-600 text-white';
      case 'not-scheduled':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getBannerStyles()} shadow-lg transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center text-center">
          <p className="text-sm md:text-base font-semibold leading-relaxed">
            {status.message}
          </p>
        </div>
      </div>
    </div>
  );
}
