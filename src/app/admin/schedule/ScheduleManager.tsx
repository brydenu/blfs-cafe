'use client';

import { useState, useTransition, useRef, useEffect, useImperativeHandle, forwardRef, useMemo, useCallback } from "react";
import { updateSchedule } from "../actions";

interface ScheduleManagerProps {
  dayOfWeek: number;
  dayName: string;
  dayAbbr: string;
  schedule: {
    id: number;
    dayOfWeek: number;
    openTime1: string;
    closeTime1: string;
    openTime2: string | null;
    closeTime2: string | null;
    isSecondPeriodActive: boolean;
    isOpen: boolean;
  };
  onUnsavedChange?: (hasUnsaved: boolean) => void;
}

export interface ScheduleManagerRef {
  save: () => Promise<boolean>;
  hasUnsavedChanges: () => boolean;
}

export const ScheduleManager = forwardRef<ScheduleManagerRef, ScheduleManagerProps>(
  ({ dayOfWeek, dayName, dayAbbr, schedule: initialSchedule, onUnsavedChange }, ref) => {
    const [schedule, setSchedule] = useState(initialSchedule);
    const [savedSchedule, setSavedSchedule] = useState(initialSchedule);
    const [isPending, startTransition] = useTransition();
    const savingRef = useRef(false);

    // Update savedSchedule when initialSchedule prop changes
    useEffect(() => {
      setSavedSchedule(initialSchedule);
      setSchedule(initialSchedule);
    }, [initialSchedule]);

    // Check if there are unsaved changes (memoized)
    const hasUnsavedChanges = useMemo(() => {
      return (
        schedule.openTime1 !== savedSchedule.openTime1 ||
        schedule.closeTime1 !== savedSchedule.closeTime1 ||
        schedule.openTime2 !== savedSchedule.openTime2 ||
        schedule.closeTime2 !== savedSchedule.closeTime2 ||
        schedule.isSecondPeriodActive !== savedSchedule.isSecondPeriodActive ||
        schedule.isOpen !== savedSchedule.isOpen
      );
    }, [schedule, savedSchedule]);

    // Notify parent of unsaved changes
    useEffect(() => {
      if (onUnsavedChange) {
        onUnsavedChange(hasUnsavedChanges);
      }
    }, [hasUnsavedChanges, onUnsavedChange]);

    // Function version for useImperativeHandle
    const hasUnsavedChangesFn = useCallback(() => hasUnsavedChanges, [hasUnsavedChanges]);

    // Save handler
    const handleSave = useCallback(async () => {
      if (savingRef.current || !hasUnsavedChanges) return true;
      
      savingRef.current = true;
      try {
        const result = await updateSchedule(
          dayOfWeek,
          schedule.openTime1,
          schedule.closeTime1,
          schedule.openTime2 || null,
          schedule.closeTime2 || null,
          schedule.isSecondPeriodActive,
          schedule.isOpen
        );
        
        if (result.success) {
          // Update savedSchedule to reflect saved state
          setSavedSchedule({ ...schedule });
          return true;
        } else {
          console.error('Failed to save schedule:', result.message);
          return false;
        }
      } finally {
        savingRef.current = false;
      }
    }, [dayOfWeek, schedule, hasUnsavedChanges]);

    // Expose save method and hasUnsavedChanges to parent via ref
    useImperativeHandle(ref, () => ({
      save: handleSave,
      hasUnsavedChanges: hasUnsavedChangesFn
    }), [handleSave, hasUnsavedChangesFn]);

    const handleToggleOpen = () => {
      if (isPending || savingRef.current) return;
      
      // Calculate new value
      const newValue = !schedule.isOpen;
      const newSchedule = { ...schedule, isOpen: newValue };
      
      // Update state only (no auto-save)
      setSchedule(newSchedule);
    };

    const handleToggleSecondPeriod = () => {
      if (isPending || savingRef.current) return;
      
      // Calculate new value
      const newValue = !schedule.isSecondPeriodActive;
      const newSchedule = { ...schedule, isSecondPeriodActive: newValue };
      
      // Update state only (no auto-save)
      setSchedule(newSchedule);
    };

    const handleTimeChange = (field: 'openTime1' | 'closeTime1' | 'openTime2' | 'closeTime2', value: string) => {
      setSchedule(prev => ({ ...prev, [field]: value }));
    };

  const timeInputClass =
    'bg-gray-800 text-white text-sm px-2 py-1.5 md:py-1 rounded border border-gray-700 focus:border-[#32A5DC] focus:outline-none disabled:opacity-50 flex-1 min-w-0 w-full md:w-auto md:flex-none';

  return (
    <div className={`bg-gray-900 p-4 rounded-xl border ${
      schedule.isOpen ? 'border-gray-700' : 'border-gray-800'
    } ${isPending ? 'opacity-50' : ''}`}>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        
        {/* Day Name & Toggle */}
        <div className="flex items-center justify-between gap-4 md:justify-start md:min-w-[120px]">
          <h3 className="font-bold text-white text-sm md:min-w-[80px]">{dayName}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 md:hidden">
              {schedule.isOpen ? 'Open' : 'Closed'}
            </span>
            <button
              onClick={handleToggleOpen}
              disabled={isPending}
              aria-label={schedule.isOpen ? `Mark ${dayName} as closed` : `Mark ${dayName} as open`}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                schedule.isOpen 
                  ? 'bg-green-500' 
                  : 'bg-gray-600'
              } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  schedule.isOpen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Schedule Display / Edit */}
        {schedule.isOpen ? (
          <div className="flex-1 flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 w-full min-w-0">
            
            {/* First Period */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
              <label className="text-xs text-gray-400 md:min-w-[60px]">Period 1:</label>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center w-full md:flex md:w-auto">
                <input
                  type="time"
                  value={schedule.openTime1}
                  onChange={(e) => handleTimeChange('openTime1', e.target.value)}
                  disabled={isPending}
                  className={timeInputClass}
                />
                <span className="text-gray-500 text-center">-</span>
                <input
                  type="time"
                  value={schedule.closeTime1}
                  onChange={(e) => handleTimeChange('closeTime1', e.target.value)}
                  disabled={isPending}
                  className={timeInputClass}
                />
              </div>
            </div>

            {/* Second Period */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
              <div className="flex items-center justify-between gap-2 md:justify-start md:min-w-[60px]">
                <label className="text-xs text-gray-400">Period 2:</label>
                <button
                  onClick={handleToggleSecondPeriod}
                  disabled={isPending}
                  aria-label={schedule.isSecondPeriodActive ? 'Disable second period' : 'Enable second period'}
                  className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                    schedule.isSecondPeriodActive 
                      ? 'bg-[#32A5DC]' 
                      : 'bg-gray-600'
                  } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                      schedule.isSecondPeriodActive ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {schedule.isSecondPeriodActive && (
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center w-full md:flex md:w-auto">
                  <input
                    type="time"
                    value={schedule.openTime2 || ''}
                    onChange={(e) => handleTimeChange('openTime2', e.target.value)}
                    disabled={isPending}
                    className={timeInputClass}
                  />
                  <span className="text-gray-500 text-center">-</span>
                  <input
                    type="time"
                    value={schedule.closeTime2 || ''}
                    onChange={(e) => handleTimeChange('closeTime2', e.target.value)}
                    disabled={isPending}
                    className={timeInputClass}
                  />
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 md:block">
            <span className="text-gray-500 text-sm">Closed</span>
          </div>
        )}

      </div>

    </div>
  );
});

ScheduleManager.displayName = 'ScheduleManager';
