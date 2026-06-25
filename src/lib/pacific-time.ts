const PACIFIC_TZ = 'America/Los_Angeles';

/**
 * Get the current time in Pacific Timezone
 * Returns an object with the Pacific time and day of week
 */
export function getPacificTime(): { date: Date; hours: number; minutes: number; dayOfWeek: number } {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });
  
  const parts = formatter.formatToParts(now);
  
  const getPart = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  
  const hours = getPart('hour');
  const minutes = getPart('minute');
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  
  const weekdayPart = parts.find(p => p.type === 'weekday');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = weekdayPart?.value || 'Sunday';
  const dayOfWeek = dayNames.indexOf(dayName);
  
  const pacificDate = new Date(year, month - 1, day, hours, minutes);
  
  return {
    date: pacificDate,
    hours,
    minutes,
    dayOfWeek
  };
}

/**
 * Convert a Pacific calendar date + wall-clock time to a UTC Date.
 * Handles DST automatically via Intl.
 */
export function pacificWallTimeToUTC(dateStr: string, wallTime: string): Date {
  const approx = new Date(`${dateStr}T${wallTime}Z`);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: PACIFIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = fmt.formatToParts(approx).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
  const actualWall = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`;
  const skew = approx.getTime() - new Date(actualWall).getTime();
  return new Date(approx.getTime() + skew);
}

/**
 * Get the current date string in Pacific Time (YYYY-MM-DD format)
 */
export function getPacificDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PACIFIC_TZ }).format(new Date());
}

/**
 * Get a Pacific calendar date string N days before today (in Pacific Time)
 */
export function getPacificDateStringDaysAgo(daysAgo: number): string {
  const todayStr = getPacificDateString();
  const [year, month, day] = todayStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - daysAgo);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get an ordered list of Pacific calendar date strings for the last N days (inclusive of today)
 */
export function getPacificDateRange(dayCount: number): string[] {
  const dates: string[] = [];
  for (let daysAgo = dayCount - 1; daysAgo >= 0; daysAgo--) {
    dates.push(getPacificDateStringDaysAgo(daysAgo));
  }
  return dates;
}

/**
 * Get the weekday name for a YYYY-MM-DD Pacific calendar date
 */
export function getPacificWeekday(dateStr: string): string {
  const noonUTC = pacificWallTimeToUTC(dateStr, '12:00:00');
  return new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TZ,
    weekday: 'long'
  }).format(noonUTC);
}

/**
 * Count how many times each weekday (Mon–Fri) appears in a Pacific calendar date range (inclusive)
 */
export function countPacificWeekdaysInRange(startDateStr: string, endDateStr: string): Record<string, number> {
  const weekdayCounts: Record<string, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0
  };

  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
  const current = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));

  while (current <= end) {
    const dateStr = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}-${String(current.getUTCDate()).padStart(2, '0')}`;
    const weekday = getPacificWeekday(dateStr);
    if (weekday in weekdayCounts) {
      weekdayCounts[weekday]++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return weekdayCounts;
}

/**
 * Format a YYYY-MM-DD Pacific calendar date for display
 */
export function formatPacificDateLabel(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const noonUTC = pacificWallTimeToUTC(dateStr, '12:00:00');
  return new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TZ,
    ...options
  }).format(noonUTC);
}

/**
 * Get the start of today (00:00:00) in Pacific Time as a UTC Date object
 */
export function getPacificStartOfDay(): Date {
  return pacificWallTimeToUTC(getPacificDateString(), '00:00:00');
}

/**
 * Get the start of a Pacific calendar day N days before today (00:00:00 Pacific)
 */
export function getPacificStartOfDaysAgo(daysAgo: number): Date {
  return pacificWallTimeToUTC(getPacificDateStringDaysAgo(daysAgo), '00:00:00');
}

/**
 * Get the end of today (23:59:59.999) in Pacific Time as a UTC Date object
 */
export function getPacificEndOfDay(): Date {
  const end = pacificWallTimeToUTC(getPacificDateString(), '23:59:59');
  return new Date(end.getTime() + 999);
}

/**
 * Get the end of a specific Pacific calendar day (23:59:59.999)
 */
export function getPacificEndOfDayForDate(dateStr: string): Date {
  const end = pacificWallTimeToUTC(dateStr, '23:59:59');
  return new Date(end.getTime() + 999);
}

/**
 * Get Pacific hour and minute components from a UTC timestamp
 */
export function getPacificHourMinute(date: Date): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  return {
    hour: parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10),
    minute: parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)
  };
}

/**
 * Get the Pacific calendar date string (YYYY-MM-DD) for a UTC timestamp
 */
export function getPacificDateStringForTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PACIFIC_TZ }).format(date);
}
