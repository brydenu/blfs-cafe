'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ToastContextType = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const showToast = (message: string) => {
    // If a toast is already exiting or active, reset the exit state immediately
    setIsExiting(false);
    setToast({ message, id: Date.now() });
  };

  useEffect(() => {
    // 1. If toast exists and NOT exiting, wait 3 seconds then start exit
    if (toast && !isExiting) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, 3000); 
      return () => clearTimeout(timer);
    }

    // 2. If toast IS exiting, wait for animation (300ms) then remove from DOM
    if (toast && isExiting) {
      const timer = setTimeout(() => {
        setToast(null);
        setIsExiting(false);
      }, 300); // Matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [toast, isExiting]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {toast && (
        <div 
            // Apply different class based on state
            className={`fixed bottom-6 left-1/2 z-[100] w-full max-w-sm px-4 pointer-events-none ${isExiting ? 'toast-exit' : 'toast-enter'}`}
        >
          <div className="bg-[#004876] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
             <div className="bg-[#32A5DC] text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
               ✓
             </div>
             <p className="font-bold text-sm tracking-wide leading-tight">{toast.message}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}