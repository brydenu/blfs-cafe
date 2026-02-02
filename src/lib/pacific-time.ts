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
