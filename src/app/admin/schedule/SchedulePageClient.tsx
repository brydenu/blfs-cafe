'use client';

import { useState, useRef, useEffect } from "react";
import { ScheduleManager, ScheduleManagerRef } from "./ScheduleManager";

interface ScheduleData {
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

interface SchedulePageClientProps {
  scheduleData: ScheduleData[];
}

export function SchedulePageClient({ scheduleData }: SchedulePageClientProps) {
  const scheduleRefs = useRef<Map<number, ScheduleManagerRef>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track unsaved changes from all schedule managers
  const handleUnsavedChange = () => {
    // Check if any schedule has unsaved changes
    const anyUnsaved = Array.from(scheduleRefs.current.values()).some(
      ref => ref.hasUnsavedChanges()
    );
    
    setHasUnsavedChanges(anyUnsaved);
  };

  // Warn user if they try to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return ''; // Required for Safari
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const savePromises = Array.from(scheduleRefs.current.values()).map(
        ref => ref.save()
      );
      
      const results = await Promise.all(savePromises);
      const allSucceeded = results.every(result => result === true);
      
      if (allSucceeded) {
        setHasUnsavedChanges(false);
        // Optionally show a success message
      } else {
        console.error('Some schedules failed to save');
        // Optionally show an error message
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Store Schedule</h1>
          <p className="text-gray-400 font-medium">Manage operating hours for each day</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            hasUnsavedChanges && !isSaving
              ? 'bg-[#32A5DC] text-white hover:bg-[#2a8fc4] cursor-pointer'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">
            You have unsaved changes. Make sure to click "Save Changes" before leaving this page.
          </p>
        </div>
      )}

      {/* Schedule Form */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <div className="space-y-4">
          {scheduleData.map(({ dayOfWeek, dayName, dayAbbr, schedule }) => (
            <ScheduleManager
              key={dayOfWeek}
              ref={(ref) => {
                if (ref) {
                  scheduleRefs.current.set(dayOfWeek, ref);
                } else {
                  scheduleRefs.current.delete(dayOfWeek);
                }
              }}
              dayOfWeek={dayOfWeek}
              dayName={dayName}
              dayAbbr={dayAbbr}
              schedule={schedule}
              onUnsavedChange={handleUnsavedChange}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
