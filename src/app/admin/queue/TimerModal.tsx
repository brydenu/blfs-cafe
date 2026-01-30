'use client';

import { useState, useRef, useEffect } from 'react';

interface TimerModalProps {
  onClose: () => void;
  onStart: (durationSeconds: number) => void;
}

export default function TimerModal({ onClose, onStart }: TimerModalProps) {
  const [minutes, setMinutes] = useState(4);
  const [seconds, setSeconds] = useState(0);
  const minutesRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const currentDraggingRef = useRef<'minutes' | 'seconds' | null>(null);

  // Generate arrays for minutes (0-60) and seconds (0-59)
  const minutesArray = Array.from({ length: 61 }, (_, i) => i);
  const secondsArray = Array.from({ length: 60 }, (_, i) => i);

  const handleStart = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds > 0) {
      onStart(totalSeconds);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle wheel scrolling for minutes
  const handleMinutesWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setMinutes((prev) => Math.max(0, Math.min(60, prev + delta)));
  };

  // Handle wheel scrolling for seconds
  const handleSecondsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setSeconds((prev) => {
      const newValue = prev + delta;
      if (newValue < 0) {
        if (minutes > 0) {
          setMinutes((m) => m - 1);
          return 59;
        }
        return 0;
      }
      if (newValue > 59) {
        if (minutes < 60) {
          setMinutes((m) => m + 1);
          return 0;
        }
        return 59;
      }
      return newValue;
    });
  };

  // Scroll to selected value on mount and when values change
  useEffect(() => {
    if (minutesRef.current && !isDragging.current) {
      const itemHeight = 60;
      // Center the item: viewport center is at 90px, item center is at 60 + i*60 + 30
      // So scrollTop = 60 + i*60 + 30 - 90 = i*60
      minutesRef.current.scrollTop = minutes * itemHeight;
    }
  }, [minutes]);

  useEffect(() => {
    if (secondsRef.current && !isDragging.current) {
      const itemHeight = 60;
      // Center the item: viewport center is at 90px, item center is at 60 + i*60 + 30
      // So scrollTop = 60 + i*60 + 30 - 90 = i*60
      secondsRef.current.scrollTop = seconds * itemHeight;
    }
  }, [seconds]);

  // Sync scroll position with selected value when scrolling ends
  const syncScrollToValue = (ref: HTMLDivElement, currentValue: number, maxValue: number, setValue: (val: number) => void) => {
    const itemHeight = 60;
    const scrollTop = ref.scrollTop;
    // Calculate which item is centered (scrollTop directly maps to item index)
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(maxValue, index));
    if (clampedIndex !== currentValue) {
      setValue(clampedIndex);
      ref.scrollTo({ top: clampedIndex * itemHeight, behavior: 'smooth' });
    }
  };

  // Debounce refs for scroll handlers
  const minutesScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const secondsScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll end for minutes (debounced)
  const handleMinutesScroll = () => {
    if (minutesScrollTimeoutRef.current) {
      clearTimeout(minutesScrollTimeoutRef.current);
    }
    minutesScrollTimeoutRef.current = setTimeout(() => {
      if (minutesRef.current) {
        syncScrollToValue(minutesRef.current, minutes, 60, setMinutes);
      }
    }, 150);
  };

  // Handle scroll end for seconds (debounced)
  const handleSecondsScroll = () => {
    if (secondsScrollTimeoutRef.current) {
      clearTimeout(secondsScrollTimeoutRef.current);
    }
    secondsScrollTimeoutRef.current = setTimeout(() => {
      if (secondsRef.current) {
        syncScrollToValue(secondsRef.current, seconds, 59, setSeconds);
      }
    }, 150);
  };

  // Touch drag handlers for minutes
  const handleMinutesTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
    currentDraggingRef.current = 'minutes';
    dragStartY.current = e.touches[0].clientY;
    if (minutesRef.current) {
      dragStartScroll.current = minutesRef.current.scrollTop;
    }
  };

  const handleMinutesTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || currentDraggingRef.current !== 'minutes' || !minutesRef.current) return;
    e.preventDefault();
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const newScrollTop = dragStartScroll.current + deltaY;
    minutesRef.current.scrollTop = Math.max(0, Math.min(60 * 60, newScrollTop));
  };

  const handleMinutesTouchEnd = () => {
    if (currentDraggingRef.current === 'minutes' && minutesRef.current) {
      syncScrollToValue(minutesRef.current, minutes, 60, setMinutes);
    }
    isDragging.current = false;
    currentDraggingRef.current = null;
  };

  // Touch drag handlers for seconds
  const handleSecondsTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
    currentDraggingRef.current = 'seconds';
    dragStartY.current = e.touches[0].clientY;
    if (secondsRef.current) {
      dragStartScroll.current = secondsRef.current.scrollTop;
    }
  };

  const handleSecondsTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || currentDraggingRef.current !== 'seconds' || !secondsRef.current) return;
    e.preventDefault();
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const newScrollTop = dragStartScroll.current + deltaY;
    secondsRef.current.scrollTop = Math.max(0, Math.min(59 * 60, newScrollTop));
  };

  const handleSecondsTouchEnd = () => {
    if (currentDraggingRef.current === 'seconds' && secondsRef.current) {
      syncScrollToValue(secondsRef.current, seconds, 59, setSeconds);
    }
    isDragging.current = false;
    currentDraggingRef.current = null;
  };

  // Mouse drag handlers for minutes
  const handleMinutesMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    currentDraggingRef.current = 'minutes';
    dragStartY.current = e.clientY;
    if (minutesRef.current) {
      dragStartScroll.current = minutesRef.current.scrollTop;
    }
  };

  const handleMinutesMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || currentDraggingRef.current !== 'minutes' || !minutesRef.current) return;
    const deltaY = dragStartY.current - e.clientY;
    const newScrollTop = dragStartScroll.current + deltaY;
    minutesRef.current.scrollTop = Math.max(0, Math.min(60 * 60, newScrollTop));
  };

  const handleMinutesMouseUp = () => {
    if (currentDraggingRef.current === 'minutes' && minutesRef.current) {
      syncScrollToValue(minutesRef.current, minutes, 60, setMinutes);
    }
    isDragging.current = false;
    currentDraggingRef.current = null;
  };

  // Mouse drag handlers for seconds
  const handleSecondsMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    currentDraggingRef.current = 'seconds';
    dragStartY.current = e.clientY;
    if (secondsRef.current) {
      dragStartScroll.current = secondsRef.current.scrollTop;
    }
  };

  const handleSecondsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || currentDraggingRef.current !== 'seconds' || !secondsRef.current) return;
    const deltaY = dragStartY.current - e.clientY;
    const newScrollTop = dragStartScroll.current + deltaY;
    secondsRef.current.scrollTop = Math.max(0, Math.min(59 * 60, newScrollTop));
  };

  const handleSecondsMouseUp = () => {
    if (currentDraggingRef.current === 'seconds' && secondsRef.current) {
      syncScrollToValue(secondsRef.current, seconds, 59, setSeconds);
    }
    isDragging.current = false;
    currentDraggingRef.current = null;
  };

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current) {
        if (currentDraggingRef.current === 'minutes' && minutesRef.current) {
          syncScrollToValue(minutesRef.current, minutes, 60, setMinutes);
        } else if (currentDraggingRef.current === 'seconds' && secondsRef.current) {
          syncScrollToValue(secondsRef.current, seconds, 59, setSeconds);
        }
        isDragging.current = false;
        currentDraggingRef.current = null;
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      if (currentDraggingRef.current === 'minutes' && minutesRef.current) {
        const deltaY = dragStartY.current - e.clientY;
        const newScrollTop = dragStartScroll.current + deltaY;
        minutesRef.current.scrollTop = Math.max(0, Math.min(60 * 60, newScrollTop));
      } else if (currentDraggingRef.current === 'seconds' && secondsRef.current) {
        const deltaY = dragStartY.current - e.clientY;
        const newScrollTop = dragStartScroll.current + deltaY;
        secondsRef.current.scrollTop = Math.max(0, Math.min(59 * 60, newScrollTop));
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [minutes, seconds]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (minutesScrollTimeoutRef.current) {
        clearTimeout(minutesScrollTimeoutRef.current);
      }
      if (secondsScrollTimeoutRef.current) {
        clearTimeout(secondsScrollTimeoutRef.current);
      }
    };
  }, []);


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-black text-white">Create Timer</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center gap-4">
            {/* Minutes Picker */}
            <div className="flex flex-col items-center">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Minutes
              </label>
              <div className="relative">
                {/* Selection highlight */}
                <div className="absolute top-1/2 left-0 right-0 h-[60px] -translate-y-1/2 bg-[#32A5DC]/20 border-y-2 border-[#32A5DC]/50 pointer-events-none rounded-lg"></div>
                
                {/* Scrollable minutes list */}
                <div
                  ref={minutesRef}
                  onWheel={handleMinutesWheel}
                  onScroll={handleMinutesScroll}
                  onMouseDown={handleMinutesMouseDown}
                  onMouseUp={handleMinutesMouseUp}
                  onTouchStart={handleMinutesTouchStart}
                  onTouchMove={handleMinutesTouchMove}
                  onTouchEnd={handleMinutesTouchEnd}
                  className="h-[180px] overflow-y-scroll scrollbar-hide snap-y snap-mandatory select-none touch-none"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {/* Padding at top */}
                  <div className="h-[60px]"></div>
                  {minutesArray.map((min) => (
                    <div
                      key={min}
                      className="h-[60px] flex items-center justify-center text-3xl font-black text-white snap-center"
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      {min}
                    </div>
                  ))}
                  {/* Padding at bottom */}
                  <div className="h-[60px]"></div>
                </div>
              </div>
            </div>

            <div className="text-3xl font-black text-[#32A5DC] pt-8">:</div>

            {/* Seconds Picker */}
            <div className="flex flex-col items-center">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Seconds
              </label>
              <div className="relative">
                {/* Selection highlight */}
                <div className="absolute top-1/2 left-0 right-0 h-[60px] -translate-y-1/2 bg-[#32A5DC]/20 border-y-2 border-[#32A5DC]/50 pointer-events-none rounded-lg"></div>
                
                {/* Scrollable seconds list */}
                <div
                  ref={secondsRef}
                  onWheel={handleSecondsWheel}
                  onScroll={handleSecondsScroll}
                  onMouseDown={handleSecondsMouseDown}
                  onMouseUp={handleSecondsMouseUp}
                  onTouchStart={handleSecondsTouchStart}
                  onTouchMove={handleSecondsTouchMove}
                  onTouchEnd={handleSecondsTouchEnd}
                  className="h-[180px] overflow-y-scroll scrollbar-hide snap-y snap-mandatory select-none touch-none"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {/* Padding at top */}
                  <div className="h-[60px]"></div>
                  {secondsArray.map((sec) => (
                    <div
                      key={sec}
                      className="h-[60px] flex items-center justify-center text-3xl font-black text-white snap-center"
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      {sec.toString().padStart(2, '0')}
                    </div>
                  ))}
                  {/* Padding at bottom */}
                  <div className="h-[60px]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Display total time */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Total: {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors border border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={minutes === 0 && seconds === 0}
              className="flex-1 px-6 py-3 bg-[#32A5DC] hover:bg-[#288bba] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors uppercase tracking-wider"
            >
              Start Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
