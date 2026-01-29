'use client';

import { useState } from 'react';

interface Schedule {
  id: number;
  dayOfWeek: number;
  openTime1: string;
  closeTime1: string;
  openTime2: string | null;
  closeTime2: string | null;
  isSecondPeriodActive: boolean;
  isOpen: boolean;
}

interface ScheduleDisplayProps {
  schedules: Schedule[];
}

const DAYS_OF_WEEK = [
  { dayOfWeek: 1, name: 'Monday', abbr: 'Mon' },
  { dayOfWeek: 2, name: 'Tuesday', abbr: 'Tue' },
  { dayOfWeek: 3, name: 'Wednesday', abbr: 'Wed' },
  { dayOfWeek: 4, name: 'Thursday', abbr: 'Thu' },
  { dayOfWeek: 5, name: 'Friday', abbr: 'Fri' },
];

export default function ScheduleDisplay({ schedules }: ScheduleDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dayOfWeek: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = dayOfWeek - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    
    const month = targetDate.toLocaleString('en-US', { month: 'long' });
    const day = targetDate.getDate();
    return `${month} ${day}`;
  };

  const formatDateShort = (dayOfWeek: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = dayOfWeek - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    return `${month}/${day}`;
  };

  const getTodaySchedule = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    return schedules.find(s => s.dayOfWeek === currentDayOfWeek);
  };

  const getDisplayPeriods = (schedule: Schedule | undefined): string[] => {
    if (!schedule || !schedule.isOpen) {
      return [];
    }
    
    const periods: string[] = [];
    periods.push(`${formatTime(schedule.openTime1)} - ${formatTime(schedule.closeTime1)}`);
    
    if (schedule.isSecondPeriodActive && schedule.openTime2 && schedule.closeTime2) {
      periods.push(`${formatTime(schedule.openTime2)} - ${formatTime(schedule.closeTime2)}`);
    }
    
    return periods;
  };

  const todaySchedule = getTodaySchedule();
  const todayDayOfWeek = new Date().getDay();
  const todayDayInfo = DAYS_OF_WEEK.find(d => d.dayOfWeek === todayDayOfWeek);

  // Create schedule map for quick lookup
  const scheduleMap = new Map(schedules.map(s => [s.dayOfWeek, s]));

  return (
    <div className="bg-[#32A5DC]/20 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-4xl overflow-hidden">
      {/* Header - Floating */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-white font-black text-base drop-shadow-sm">Today's Schedule</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/80 hover:text-white font-medium text-xs transition-colors drop-shadow-sm"
        >
          {isExpanded ? 'Close Full Week' : 'View Full Week'}
        </button>
      </div>

      {/* Collapsed State - Today Only */}
      {!isExpanded && (
        <div className="px-5 pb-4">
          {todaySchedule && todaySchedule.isOpen ? (
            <div className="rounded-lg p-3 bg-white/15 backdrop-blur-sm">
              <div className="text-white font-bold text-base mb-0.5 drop-shadow-sm">
                {todayDayInfo?.name}, {formatDate(todayDayOfWeek)}
              </div>
              <div className="text-white/90 font-medium text-sm drop-shadow-sm space-y-0.5">
                {getDisplayPeriods(todaySchedule).map((period, index) => (
                  <div key={index}>{period}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg p-3 bg-white/10 backdrop-blur-sm">
              <div className="text-white/80 font-bold text-base mb-0.5 drop-shadow-sm">
                {todayDayInfo?.name}, {formatDate(todayDayOfWeek)}
              </div>
              <div className="text-white/70 font-medium text-sm drop-shadow-sm">
                Out
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expanded State - Full Week */}
      {isExpanded && (
        <div className="px-5 pb-4 space-y-3">
          {/* Today's Schedule - Highlighted */}
          {todaySchedule && todaySchedule.isOpen && (
            <div className="rounded-lg p-3 bg-white/20 backdrop-blur-sm">
              <div className="text-white font-bold text-base mb-0.5 drop-shadow-sm">
                {todayDayInfo?.name}, {formatDate(todayDayOfWeek)}
              </div>
              <div className="text-white/90 font-medium text-sm drop-shadow-sm">
                {getDisplaySchedule(todaySchedule)}
              </div>
            </div>
          )}

          {/* Full Week Schedule */}
          <div className="flex flex-col gap-2 md:grid md:grid-cols-5 md:gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const schedule = scheduleMap.get(day.dayOfWeek);
              const isToday = day.dayOfWeek === todayDayOfWeek;
              const isClosed = !schedule || !schedule.isOpen;

              return (
                <div
                  key={day.dayOfWeek}
                  className={`p-3 rounded-lg backdrop-blur-sm border border-white/10 transition-all duration-200 ${
                    isToday && !isClosed
                      ? 'bg-white/25 shadow-md shadow-black/20 scale-[1.01]'
                      : isClosed
                      ? 'bg-white/5'
                      : 'bg-white/15'
                  }`}
                >
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shadow-sm"
                        style={{
                          backgroundColor: isClosed
                            ? 'rgba(255,255,255,0.4)'
                            : isToday
                            ? '#32A5DC'
                            : 'rgba(255,255,255,0.8)',
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white/90 drop-shadow-sm">
                          {day.name}
                        </span>
                        <span className="text-[11px] text-white/70 drop-shadow-sm">
                          {formatDateShort(day.dayOfWeek)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start xs:items-end gap-0.5 text-xs font-medium drop-shadow-sm text-white/90">
                      {isClosed ? (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                          Out
                        </span>
                      ) : (
                        getDisplayPeriods(schedule).map((period, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5"
                          >
                            {period}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
