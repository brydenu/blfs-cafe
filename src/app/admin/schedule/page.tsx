import { prisma } from "@/lib/db";
import { ScheduleManager } from "./ScheduleManager";

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Store Schedule</h1>
          <p className="text-gray-400 font-medium">Manage operating hours for each day</p>
        </div>
      </div>

      {/* Schedule Form */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const schedule = scheduleMap.get(day.dayOfWeek);
            return (
              <ScheduleManager
                key={day.dayOfWeek}
                dayOfWeek={day.dayOfWeek}
                dayName={day.name}
                dayAbbr={day.abbr}
                schedule={schedule || {
                  id: 0,
                  dayOfWeek: day.dayOfWeek,
                  openTime1: '08:00',
                  closeTime1: '17:00',
                  openTime2: null,
                  closeTime2: null,
                  isSecondPeriodActive: false,
                  isOpen: true
                }}
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}
