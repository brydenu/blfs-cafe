'use client';

import { useState, useTransition, useRef } from "react";
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
}

export function ScheduleManager({ dayOfWeek, dayName, dayAbbr, schedule: initialSchedule }: ScheduleManagerProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [isPending, startTransition] = useTransition();
  const savingRef = useRef(false);

  const handleSave = async (scheduleToSave: typeof schedule) => {
    if (savingRef.current) return; // Prevent duplicate saves
    
    savingRef.current = true;
    try {
      const result = await updateSchedule(
        dayOfWeek,
        scheduleToSave.openTime1,
        scheduleToSave.closeTime1,
        scheduleToSave.openTime2 || null,
        scheduleToSave.closeTime2 || null,
        scheduleToSave.isSecondPeriodActive,
        scheduleToSave.isOpen
      );
      
      if (!result.success) {
        console.error('Failed to save schedule:', result.message);
        // Revert the state change on error
        setSchedule(initialSchedule);
      }
    } finally {
      savingRef.current = false;
    }
  };

  const handleToggleOpen = () => {
    if (isPending || savingRef.current) return;
    
    // Calculate new value
    const newValue = !schedule.isOpen;
    const newSchedule = { ...schedule, isOpen: newValue };
    
    // Update state
    setSchedule(newSchedule);
    
    // Save with the new value
    startTransition(async () => {
      await handleSave(newSchedule);
    });
  };

  const handleToggleSecondPeriod = () => {
    if (isPending || savingRef.current) return;
    
    // Calculate new value
    const newValue = !schedule.isSecondPeriodActive;
    const newSchedule = { ...schedule, isSecondPeriodActive: newValue };
    
    // Update state
    setSchedule(newSchedule);
    
    // Save with the new value
    startTransition(async () => {
      await handleSave(newSchedule);
    });
  };

  const handleTimeChange = (field: 'openTime1' | 'closeTime1' | 'openTime2' | 'closeTime2', value: string) => {
    setSchedule(prev => ({ ...prev, [field]: value }));
    // Debounce save - could add debouncing here if needed
    // For now, saving on blur or toggle is fine
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDisplaySchedule = () => {
    if (!schedule.isOpen) {
      return 'Closed';
    }
    
    let display = `${formatTime(schedule.openTime1)} - ${formatTime(schedule.closeTime1)}`;
    
    if (schedule.isSecondPeriodActive && schedule.openTime2 && schedule.closeTime2) {
      display += `, ${formatTime(schedule.openTime2)} - ${formatTime(schedule.closeTime2)}`;
    }
    
    return display;
  };

  return (
    <div className={`bg-gray-900 p-4 rounded-xl border ${
      schedule.isOpen ? 'border-gray-700' : 'border-gray-800'
    } ${isPending ? 'opacity-50' : ''}`}>
      
      <div className="flex items-start justify-between gap-4">
        
        {/* Day Name & Toggle */}
        <div className="flex items-center gap-4 min-w-[120px]">
          <h3 className="font-bold text-white text-sm min-w-[80px]">{dayName}</h3>
          <button
            onClick={handleToggleOpen}
            disabled={isPending}
            className={`relative w-11 h-6 rounded-full transition-colors ${
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

        {/* Schedule Display / Edit */}
        {schedule.isOpen ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* First Period */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 min-w-[60px]">Period 1:</label>
              <input
                type="time"
                value={schedule.openTime1}
                onChange={(e) => handleTimeChange('openTime1', e.target.value)}
                onBlur={() => startTransition(async () => { await handleSave(); })}
                disabled={isPending}
                className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700 focus:border-[#32A5DC] focus:outline-none disabled:opacity-50"
              />
              <span className="text-gray-500">-</span>
              <input
                type="time"
                value={schedule.closeTime1}
                onChange={(e) => handleTimeChange('closeTime1', e.target.value)}
                onBlur={() => startTransition(async () => { await handleSave(); })}
                disabled={isPending}
                className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700 focus:border-[#32A5DC] focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Second Period */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-[60px]">
                <label className="text-xs text-gray-400">Period 2:</label>
                <button
                  onClick={handleToggleSecondPeriod}
                  disabled={isPending}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
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
                <>
                  <input
                    type="time"
                    value={schedule.openTime2 || ''}
                    onChange={(e) => handleTimeChange('openTime2', e.target.value)}
                    onBlur={() => startTransition(async () => { await handleSave(); })}
                    disabled={isPending}
                    className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700 focus:border-[#32A5DC] focus:outline-none disabled:opacity-50"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="time"
                    value={schedule.closeTime2 || ''}
                    onChange={(e) => handleTimeChange('closeTime2', e.target.value)}
                    onBlur={() => startTransition(async () => { await handleSave(); })}
                    disabled={isPending}
                    className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700 focus:border-[#32A5DC] focus:outline-none disabled:opacity-50"
                  />
                </>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1">
            <span className="text-gray-500 text-sm">Closed</span>
          </div>
        )}

        {/* Display Summary (mobile view) */}
        <div className="md:hidden w-full mt-2 pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-400">{getDisplaySchedule()}</span>
        </div>

      </div>

    </div>
  );
}
