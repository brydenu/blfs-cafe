import { prisma } from "@/lib/db";
import { SchedulePageClient } from "./SchedulePageClient";

export const dynamic = 'force-dynamic';

const DAYS_OF_WEEK = [
  { dayOfWeek: 1, name: 'Monday', abbr: 'Mon' },
  { dayOfWeek: 2, name: 'Tuesday', abbr: 'Tue' },
  { dayOfWeek: 3, name: 'Wednesday', abbr: 'Wed' },
  { dayOfWeek: 4, name: 'Thursday', abbr: 'Thu' },
  { dayOfWeek: 5, name: 'Friday', abbr: 'Fri' },
];

export default async function SchedulePage() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { dayOfWeek: 'asc' }
  });

  // Create a map for quick lookup
  const scheduleMap = new Map(schedules.map(s => [s.dayOfWeek, s]));

  const scheduleData = DAYS_OF_WEEK.map((day) => {
    const schedule = scheduleMap.get(day.dayOfWeek);
    return {
      dayOfWeek: day.dayOfWeek,
      dayName: day.name,
      dayAbbr: day.abbr,
      schedule: schedule || {
        id: 0,
        dayOfWeek: day.dayOfWeek,
        openTime1: '08:00',
        closeTime1: '17:00',
        openTime2: null,
        closeTime2: null,
        isSecondPeriodActive: false,
        isOpen: true
      }
    };
  });

  return <SchedulePageClient scheduleData={scheduleData} />;
}
