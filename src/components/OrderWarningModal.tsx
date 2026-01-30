'use client';

import { CafeStatus } from '@/lib/schedule-status';

interface OrderWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  status: CafeStatus;
}

export default function OrderWarningModal({
  isOpen,
  onClose,
  onContinue,
  status
}: OrderWarningModalProps) {
  if (!isOpen) return null;

  // Don't show modal if cafe is open
  if (status.type === 'open') {
    return null;
  }

  // Determine icon and styling based on status type
  const getModalStyles = () => {
    switch (status.type) {
      case 'not-opened-yet':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          buttonBg: 'bg-amber-500 hover:bg-amber-600'
        };
      case 'closed-between-periods':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'closed-for-day':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700'
        };
      case 'not-scheduled':
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          buttonBg: 'bg-gray-600 hover:bg-gray-700'
        };
      default:
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          buttonBg: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const styles = getModalStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto animate-in fade-in zoom-in duration-200">
        {/* Header with Icon */}
        <div className="flex flex-col items-center pt-8 px-6 pb-4">
          <div className={`${styles.iconBg} rounded-full w-16 h-16 flex items-center justify-center mb-4`}>
            <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-extrabold text-[#004876] text-center">
            Cafe Status Notice
          </h3>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-700 leading-relaxed text-center">
            {status.message}
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex justify-center gap-4 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition-all cursor-pointer shadow-md hover:shadow-lg min-w-[120px]"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className={`px-6 py-3 rounded-xl ${styles.buttonBg} text-white font-bold transition-all cursor-pointer shadow-md hover:shadow-lg min-w-[120px]`}
          >
            Continue with Order
          </button>
        </div>
      </div>
    </div>
  );
}
