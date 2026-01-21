'use client';

import { useSearchParams } from 'next/navigation';

interface HistoryNavigationProps {
  selectedDate: Date;
}

export function HistoryNavigation({ selectedDate }: HistoryNavigationProps) {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  
  const formatDateForUrl = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const navigateToDate = (date: Date) => {
    const dateStr = formatDateForUrl(date);
    // Preserve userId parameter if present
    const url = userIdParam
      ? `/admin/history?date=${dateStr}&userId=${userIdParam}`
      : `/admin/history?date=${dateStr}`;
    // Use window.location for full page reload
    window.location.href = url;
  };

  const goToPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    navigateToDate(prevDate);
  };

  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    navigateToDate(nextDate);
  };

  const goToToday = () => {
    navigateToDate(new Date());
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      if (!isNaN(newDate.getTime())) {
        navigateToDate(newDate);
      }
    }
  };

  const today = new Date();
  const todayStr = formatDateForUrl(today);
  const selectedDateStr = formatDateForUrl(selectedDate);
  const isToday = selectedDateStr === todayStr;

  // Format date for date picker input (YYYY-MM-DD)
  const datePickerValue = formatDateForUrl(selectedDate);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
      {/* Previous/Next Day Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors cursor-pointer"
        >
          ← Previous Day
        </button>
        <button
          onClick={goToNextDay}
          disabled={isToday}
          className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${
            isToday
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          Next Day →
        </button>
        {!isToday && (
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
        )}
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-3">
        <label htmlFor="date-picker" className="text-sm font-bold text-gray-400">
          Jump to Date:
        </label>
        <input
          id="date-picker"
          type="date"
          value={datePickerValue}
          onChange={handleDatePickerChange}
          max={todayStr}
          className="px-4 py-2 bg-gray-700 border border-gray-600 text-white font-medium rounded-lg focus:ring-2 focus:ring-[#32A5DC] focus:border-[#32A5DC] outline-none cursor-pointer"
        />
      </div>
    </div>
  );
}
