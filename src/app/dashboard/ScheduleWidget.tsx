'use client';

import { useEffect, useState } from "react";

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

interface ScheduleWidgetProps {
  initialSchedules: Schedule[];
}

const DAYS_OF_WEEK = [
  { dayOfWeek: 1, name: 'Monday', abbr: 'Mon' },
  { dayOfWeek: 2, name: 'Tuesday', abbr: 'Tue' },
  { dayOfWeek: 3, name: 'Wednesday', abbr: 'Wed' },
  { dayOfWeek: 4, name: 'Thursday', abbr: 'Thu' },
  { dayOfWeek: 5, name: 'Friday', abbr: 'Fri' },
];

export default function ScheduleWidget({ initialSchedules }: ScheduleWidgetProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [loading, setLoading] = useState(false);

  // Sync with props when they change (after server refresh)
  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCurrentDaySchedule = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    return schedules.find(s => s.dayOfWeek === currentDayOfWeek);
  };

  const getStatusMessage = (): string => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const schedule = schedules.find(s => s.dayOfWeek === currentDayOfWeek);

    if (!schedule || !schedule.isOpen) {
      return "Not in today";
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const currentMinutes = parseTime(currentTime);
    const open1Minutes = parseTime(schedule.openTime1);
    const close1Minutes = parseTime(schedule.closeTime1);
    const open2Minutes = schedule.openTime2 ? parseTime(schedule.openTime2) : null;
    const close2Minutes = schedule.closeTime2 ? parseTime(schedule.closeTime2) : null;

    // During period 1
    if (currentMinutes >= open1Minutes && currentMinutes < close1Minutes) {
      return "Accepting orders";
    }

    // Before period 1 opens
    if (currentMinutes < open1Minutes) {
      return "Not open yet";
    }

    // Between period 1 and period 2 (if period 2 is active)
    if (schedule.isSecondPeriodActive && open2Minutes && close2Minutes) {
      if (currentMinutes >= close1Minutes && currentMinutes < open2Minutes) {
        return "Will be back later";
      }
      // During period 2
      if (currentMinutes >= open2Minutes && currentMinutes < close2Minutes) {
        return "Accepting orders";
      }
      // After period 2
      if (currentMinutes >= close2Minutes) {
        return "Cleaned up for the day";
      }
    }

    // After period 1 and period 2 is not active OR after period 2
    if (currentMinutes >= close1Minutes) {
      return "Cleaned up for the day";
    }

    return "Accepting orders";
  };

  const getStatusColor = (status: string): string => {
    if (status === "Accepting orders") return "text-green-600 bg-green-50 border-green-200";
    if (status === "Not in today") return "text-gray-500 bg-gray-50 border-gray-200";
    if (status === "Not open yet") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (status === "Will be back later") return "text-blue-600 bg-blue-50 border-blue-200";
    if (status === "Cleaned up for the day") return "text-gray-500 bg-gray-50 border-gray-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getDisplaySchedule = (schedule: Schedule): string => {
    if (!schedule.isOpen) {
      return 'Closed';
    }
    
    let display = `${formatTime(schedule.openTime1)} - ${formatTime(schedule.closeTime1)}`;
    
    if (schedule.isSecondPeriodActive && schedule.openTime2 && schedule.closeTime2) {
      display += `, ${formatTime(schedule.openTime2)} - ${formatTime(schedule.closeTime2)}`;
    }
    
    return display;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl w-full p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#32A5DC] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const currentSchedule = getCurrentDaySchedule();
  const statusMessage = getStatusMessage();

  return (
    <div className="bg-white rounded-3xl shadow-xl w-full overflow-hidden">
      
      {/* HEADER */}
      <div className="p-5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-[#004876] font-black text-lg mb-4">Cafe Hours</h2>
        
        {/* Status Message */}
        <div className={`px-4 py-3 rounded-xl border-2 font-bold text-sm text-center ${getStatusColor(statusMessage)}`}>
          {statusMessage}
        </div>
      </div>

      {/* SCHEDULE LIST */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {DAYS_OF_WEEK.map((day) => {
          const schedule = schedules.find(s => s.dayOfWeek === day.dayOfWeek);
          const isToday = day.dayOfWeek === new Date().getDay();
          
          // If no schedule exists in DB, show as closed
          if (!schedule) {
            return (
              <div
                key={day.dayOfWeek}
                className={`p-3 rounded-xl border ${
                  isToday
                    ? 'bg-[#32A5DC]/10 border-[#32A5DC] border-2'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${isToday ? 'text-[#004876]' : 'text-gray-600'}`}>
                    {day.name}
                    {isToday && <span className="ml-2 text-xs text-[#32A5DC]">(Today)</span>}
                  </span>
                  <span className="text-sm text-gray-400">Closed</span>
                </div>
              </div>
            );
          }

          // If schedule exists but isOpen is false, show as closed
          if (!schedule.isOpen) {
            return (
              <div
                key={day.dayOfWeek}
                className={`p-3 rounded-xl border ${
                  isToday
                    ? 'bg-[#32A5DC]/10 border-[#32A5DC] border-2'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${isToday ? 'text-[#004876]' : 'text-gray-600'}`}>
                    {day.name}
                    {isToday && <span className="ml-2 text-xs text-[#32A5DC]">(Today)</span>}
                  </span>
                  <span className="text-xs text-gray-400">Closed</span>
                </div>
              </div>
            );
          }

          // Show schedule with periods that stack on mobile
          const hasSecondPeriod = schedule.isSecondPeriodActive && schedule.openTime2 && schedule.closeTime2;

          return (
            <div
              key={day.dayOfWeek}
              className={`p-3 rounded-xl border ${
                isToday
                  ? 'bg-[#32A5DC]/10 border-[#32A5DC] border-2'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className={`font-bold text-sm ${isToday ? 'text-[#004876]' : 'text-gray-600'}`}>
                  {day.name}
                  {isToday && <span className="ml-2 text-xs text-[#32A5DC]">(Today)</span>}
                </span>
                <div className="flex flex-col items-end sm:items-end gap-1">
                  <span className={`text-xs font-semibold ${isToday ? 'text-[#004876]' : 'text-gray-600'}`}>
                    {formatTime(schedule.openTime1)} - {formatTime(schedule.closeTime1)}
                  </span>
                  {hasSecondPeriod && (
                    <span className={`text-xs font-semibold ${isToday ? 'text-[#004876]' : 'text-gray-600'}`}>
                      {formatTime(schedule.openTime2)} - {formatTime(schedule.closeTime2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
