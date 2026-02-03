/**
 * Get the current time in Pacific Timezone
 * Returns an object with the Pacific time and day of week
 */
export function getPacificTime(): { date: Date; hours: number; minutes: number; dayOfWeek: number } {
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get Pacific time components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });
  
  const parts = formatter.formatToParts(now);
  
  // Extract values from formatted parts
  const getPart = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  
  const hours = getPart('hour');
  const minutes = getPart('minute');
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  
  // Get day of week (0 = Sunday, 6 = Saturday)
  const weekdayPart = parts.find(p => p.type === 'weekday');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = weekdayPart?.value || 'Sunday';
  const dayOfWeek = dayNames.indexOf(dayName);
  
  // Create a date object representing the Pacific time (in local time, but values are Pacific)
  const pacificDate = new Date(year, month - 1, day, hours, minutes);
  
  return {
    date: pacificDate,
    hours,
    minutes,
    dayOfWeek
  };
}

/**
 * Get the start of today (00:00:00) in Pacific Time as a UTC Date object
 * This accounts for daylight savings time automatically
 */
export function getPacificStartOfDay(): Date {
  const now = new Date();
  
  // Get what time it is in Pacific Time right now
  const pacificTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const pacificTimeParts = pacificTimeFormatter.formatToParts(now);
  const pacificHour = parseInt(pacificTimeParts.find(p => p.type === 'hour')?.value || '0', 10);
  const pacificMinute = parseInt(pacificTimeParts.find(p => p.type === 'minute')?.value || '0', 10);
  const pacificSecond = parseInt(pacificTimeParts.find(p => p.type === 'second')?.value || '0', 10);
  
  // Calculate how many milliseconds from midnight Pacific Time we are
  const msFromMidnightPT = (pacificHour * 3600 + pacificMinute * 60 + pacificSecond) * 1000;
  
  // Subtract that from the current time to get an estimate of midnight Pacific Time
  // This works because Date objects store time in UTC, and when we format in Pacific Time,
  // we get the Pacific Time representation. Subtracting the Pacific Time offset from
  // the UTC timestamp gives us the UTC time that corresponds to midnight Pacific.
  let pacificMidnight = new Date(now.getTime() - msFromMidnightPT);
  
  // Verify and adjust if needed (handles edge cases around DST transitions)
  const verifyParts = pacificTimeFormatter.formatToParts(pacificMidnight);
  const verifyHour = parseInt(verifyParts.find(p => p.type === 'hour')?.value || '0', 10);
  const verifyMinute = parseInt(verifyParts.find(p => p.type === 'minute')?.value || '0', 10);
  const verifySecond = parseInt(verifyParts.find(p => p.type === 'second')?.value || '0', 10);
  
  // If it's not exactly midnight, adjust
  if (verifyHour !== 0 || verifyMinute !== 0 || verifySecond !== 0) {
    const adjustMs = (verifyHour * 3600 + verifyMinute * 60 + verifySecond) * 1000;
    pacificMidnight = new Date(pacificMidnight.getTime() - adjustMs);
  }
  
  return pacificMidnight;
}

/**
 * Get the end of today (23:59:59.999) in Pacific Time as a UTC Date object
 * This accounts for daylight savings time automatically
 */
export function getPacificEndOfDay(): Date {
  const startOfDay = getPacificStartOfDay();
  // Add 24 hours minus 1 millisecond to get end of day
  return new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
}

/**
 * Get the current date string in Pacific Time (YYYY-MM-DD format)
 */
export function getPacificDateString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}
