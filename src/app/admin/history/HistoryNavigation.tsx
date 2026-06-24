'use client';

import { useSearchParams } from 'next/navigation';

interface HistoryNavigationProps {
  /** Selected date as a YYYY-MM-DD string in Pacific Time. */
  selectedDateStr: string;
}

export function HistoryNavigation({ selectedDateStr }: HistoryNavigationProps) {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');

  // Get today's date in Pacific Time as a YYYY-MM-DD string.
  // Runs client-side so the user's browser timezone doesn't matter here —
  // we always anchor to Pacific explicitly.
  const getTodayPacific = (): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());

  const navigateToDate = (dateStr: string) => {
    const url = userIdParam
      ? `/admin/history?date=${dateStr}&userId=${userIdParam}`
      : `/admin/history?date=${dateStr}`;
    window.location.href = url;
  };

  // Shift a YYYY-MM-DD string by `delta` days without timezone distortion.
  // We create a local-midnight Date from the components, which is safe for
  // arithmetic even if the environment timezone differs from Pacific.
  const shiftDate = (dateStr: string, delta: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const shifted = new Date(y, m - 1, d + delta);
    const sy = shifted.getFullYear();
    const sm = String(shifted.getMonth() + 1).padStart(2, '0');
    const sd = String(shifted.getDate()).padStart(2, '0');
    return `${sy}-${sm}-${sd}`;
  };

  const goToPreviousDay = () => navigateToDate(shiftDate(selectedDateStr, -1));
  const goToNextDay     = () => navigateToDate(shiftDate(selectedDateStr, +1));

  const todayStr = getTodayPacific();
  const isToday  = selectedDateStr === todayStr;

  const goToToday = () => navigateToDate(todayStr);

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      navigateToDate(value);
    }
  };

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
          value={selectedDateStr}
          onChange={handleDatePickerChange}
          max={todayStr}
          className="px-4 py-2 bg-gray-700 border border-gray-600 text-white font-medium rounded-lg focus:ring-2 focus:ring-[#32A5DC] focus:border-[#32A5DC] outline-none cursor-pointer"
        />
      </div>
    </div>
  );
}
