'use server';

import { prisma } from "@/lib/db";

export type CafeStatus =
  | { type: 'not-opened-yet'; nextOpenTime: string; message: string }
  | { type: 'closed-between-periods'; nextOpenTime: string; message: string }
  | { type: 'closed-for-day'; message: string }
  | { type: 'not-scheduled'; message: string }
  | { type: 'open'; message: string };

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export async function getCafeStatus(): Promise<CafeStatus> {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  
  // Fetch today's schedule
  const schedule = await prisma.schedule.findUnique({
    where: { dayOfWeek: currentDayOfWeek }
  });

  // Case 4: Not scheduled to be open today
  if (!schedule || !schedule.isOpen) {
    return {
      type: 'not-scheduled',
      message: 'The cafe is closed today.'
    };
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentMinutes = parseTime(currentTime);
  const open1Minutes = parseTime(schedule.openTime1);
  const close1Minutes = parseTime(schedule.closeTime1);
  const open2Minutes = schedule.openTime2 ? parseTime(schedule.openTime2) : null;
  const close2Minutes = schedule.closeTime2 ? parseTime(schedule.closeTime2) : null;

  // Case 5: Currently open
  if (currentMinutes >= open1Minutes && currentMinutes < close1Minutes) {
    return {
      type: 'open',
      message: 'The cafe is currently open.'
    };
  }

  if (schedule.isSecondPeriodActive && open2Minutes && close2Minutes) {
    // During period 2
    if (currentMinutes >= open2Minutes && currentMinutes < close2Minutes) {
      return {
        type: 'open',
        message: 'The cafe is currently open.'
      };
    }
  }

  // Case 1: Not opened yet (before period 1)
  if (currentMinutes < open1Minutes) {
    return {
      type: 'not-opened-yet',
      nextOpenTime: formatTime(schedule.openTime1),
      message: `The cafe is not yet open, but you can place your order to get in line for when the cafe opens at ${formatTime(schedule.openTime1)}.`
    };
  }

  // Case 2: Closed between periods (after period 1, before period 2)
  if (schedule.isSecondPeriodActive && open2Minutes && close2Minutes) {
    if (currentMinutes >= close1Minutes && currentMinutes < open2Minutes) {
      return {
        type: 'closed-between-periods',
        nextOpenTime: formatTime(schedule.openTime2),
        message: `The cafe is currently closed but will reopen at ${formatTime(schedule.openTime2)}.`
      };
    }
  }

  // Case 3: Closed for the day (after all periods)
  const lastCloseTime = schedule.isSecondPeriodActive && close2Minutes 
    ? close2Minutes 
    : close1Minutes;
  
  if (currentMinutes >= lastCloseTime) {
    return {
      type: 'closed-for-day',
      message: 'The cafe has closed for the day. Any ordered drinks may not be made.'
    };
  }

  // Fallback (shouldn't reach here, but just in case)
  return {
    type: 'not-scheduled',
    message: 'The cafe is closed today.'
  };
}
