import { prisma } from "@/lib/db";
import ObserverCard from "./ObserverCard";
import ObserverListener from "./ObserverListener";
import FullscreenButton from "./FullscreenButton";
import BackButton from "./BackButton";

export const dynamic = 'force-dynamic';

// --- HELPER: Parse data trapped in text string ---
function parseLegacyDetails(instructions: string | null) {
  if (!instructions) return { shots: 0, milk: null, name: null };
  
  const shotsMatch = instructions.match(/Shots:\s*(\d+)/);
  const milkMatch = instructions.match(/Milk:\s*([^|]+)/);
  const nameMatch = instructions.match(/For:\s*([^|]+)/);
  
  return {
    shots: shotsMatch ? parseInt(shotsMatch[1]) : 0,
    milk: milkMatch && milkMatch[1].trim() !== 'No Milk' ? milkMatch[1].trim() : null,
    name: nameMatch ? nameMatch[1].trim() : null
  };
}

// Helper function to format time from HH:mm to 12:00 PM format
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Helper function to get current day of week (0=Sunday, 6=Saturday)
function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

// Get status message (same logic as ScheduleWidget)
function getStatusMessage(schedule: any): string {
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
}

// Check if currently accepting orders
function isAcceptingOrders(schedule: any): boolean {
  if (!schedule || !schedule.isOpen) {
    return false;
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
    return true;
  }

  // Between period 1 and period 2 (if period 2 is active) - not accepting
  if (schedule.isSecondPeriodActive && open2Minutes && close2Minutes) {
    if (currentMinutes >= close1Minutes && currentMinutes < open2Minutes) {
      return false;
    }
    // During period 2
    if (currentMinutes >= open2Minutes && currentMinutes < close2Minutes) {
      return true;
    }
  }

  // After closing or before opening
  return false;
}

// Get display schedule as array (for stacking periods)
function getDisplaySchedule(schedule: any): string[] {
  if (!schedule || !schedule.isOpen) {
    return ['Closed'];
  }
  
  const periods: string[] = [`${formatTime(schedule.openTime1)} - ${formatTime(schedule.closeTime1)}`];
  
  if (schedule.isSecondPeriodActive && schedule.openTime2 && schedule.closeTime2) {
    periods.push(`${formatTime(schedule.openTime2)} - ${formatTime(schedule.closeTime2)}`);
  }
  
  return periods;
}

export default async function ObserverPage() {
  // 1. Fetch Schedule for Today
  const currentDayOfWeek = getCurrentDayOfWeek();
  const todaySchedule = await prisma.schedule.findUnique({
    where: { dayOfWeek: currentDayOfWeek }
  });

  // Get status message and display schedule
  const statusMessage = todaySchedule ? getStatusMessage(todaySchedule) : "Not in today";
  const displaySchedule = todaySchedule ? getDisplaySchedule(todaySchedule) : ["Closed"];
  const acceptingOrders = todaySchedule ? isAcceptingOrders(todaySchedule) : false;

  // Fetch all schedules for the week (Monday-Friday: dayOfWeek 1-5)
  const weekSchedules = await prisma.schedule.findMany({
    where: {
      dayOfWeek: { in: [1, 2, 3, 4, 5] } // Monday through Friday
    },
    orderBy: { dayOfWeek: 'asc' }
  });

  // Create a map for quick lookup
  const scheduleMap = new Map(weekSchedules.map(s => [s.dayOfWeek, s]));

  // Helper to get accepting orders status for any schedule
  const getAcceptingOrdersForSchedule = (schedule: any): boolean => {
    if (!schedule || !schedule.isOpen) {
      return false;
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
      return true;
    }

    // Between period 1 and period 2 (if period 2 is active) - not accepting
    if (schedule.isSecondPeriodActive && open2Minutes && close2Minutes) {
      if (currentMinutes >= close1Minutes && currentMinutes < open2Minutes) {
        return false;
      }
      // During period 2
      if (currentMinutes >= open2Minutes && currentMinutes < close2Minutes) {
        return true;
      }
    }

    // After closing or before opening
    return false;
  };

  // Helper to get display schedule for any day
  const getDisplayScheduleForDay = (schedule: any): string[] => {
    if (!schedule || !schedule.isOpen) {
      return ['Closed'];
    }
    
    const periods: string[] = [`${formatTime(schedule.openTime1)} - ${formatTime(schedule.closeTime1)}`];
    
    if (schedule.isSecondPeriodActive && schedule.openTime2 && schedule.closeTime2) {
      periods.push(`${formatTime(schedule.openTime2)} - ${formatTime(schedule.closeTime2)}`);
    }
    
    return periods;
  };

  // Helper to get combined schedule range for weekly display (start of first to end of last)
  const getCombinedScheduleRange = (schedule: any): string => {
    if (!schedule || !schedule.isOpen) {
      return 'Closed';
    }
    
    const startTime = formatTime(schedule.openTime1);
    
    // If there's a second period, use its end time, otherwise use first period's end time
    if (schedule.isSecondPeriodActive && schedule.openTime2 && schedule.closeTime2) {
      const endTime = formatTime(schedule.closeTime2);
      return `${startTime} - ${endTime}`;
    }
    
    const endTime = formatTime(schedule.closeTime1);
    return `${startTime} - ${endTime}`;
  };

  // Day names for display
  const DAYS_OF_WEEK = [
    { dayOfWeek: 1, name: 'Monday' },
    { dayOfWeek: 2, name: 'Tuesday' },
    { dayOfWeek: 3, name: 'Wednesday' },
    { dayOfWeek: 4, name: 'Thursday' },
    { dayOfWeek: 5, name: 'Friday' },
  ];

  // Helper to format today's date
  const formatTodayDate = () => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[currentDayOfWeek] || 'Today';
    const month = today.toLocaleString('en-US', { month: 'long' });
    const day = today.getDate();
    return `${dayName}, ${month} ${day}`;
  };

  // 2. Fetch Active Orders
  // Fetch orders that are 'queued', 'preparing', or 'cancelled' (cancelled orders may still have uncompleted items)
  // We filter out 'completed' orders since all items should be done
  const rawOrders = await prisma.order.findMany({
    where: {
      status: { in: ['queued', 'preparing', 'cancelled'] } 
    },
    include: {
      items: {
        include: {
          modifiers: {
            include: { ingredient: true }
          },
          product: true
        }
      },
      user: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const allTickets: any[] = [];

  rawOrders.forEach((order) => {
    order.items.forEach(item => {
        // --- Show items in queue only if completed_at IS NULL (not completed yet) ---
        if (item.completed_at !== null) return; 

        const isCancelled = item.cancelled === true;
        const legacy = parseLegacyDetails(item.specialInstructions);

        // --- SERIALIZE MODIFIERS (Decimal -> Number) ---
        const serializedModifiers = item.modifiers.map((mod) => ({
            ...mod,
            ingredient: {
                ...mod.ingredient,
                priceMod: Number(mod.ingredient.priceMod) 
            }
        }));

        // Calculate activeShots for display (even if cancelled)
        const activeShots = (item.shots || 0) > 0 ? item.shots : legacy.shots;

        // Flatten for Cards
        allTickets.push({
            ...item,
            modifiers: serializedModifiers,
            cancelled: isCancelled,
            parsedShots: activeShots,
            parsedMilk: legacy.milk,
            parsedName: legacy.name,
            product: {
                ...item.product,
                basePrice: Number(item.product.basePrice)
            },
            parentOrderId: order.id,
            parentPublicId: order.publicId,
            orderCreatedAt: order.createdAt,
            orderOwnerName: order.guestName || order.user?.firstName || "Guest",
        });
    });
  });

  return (
    <div className="relative min-h-screen p-6 overflow-hidden">
      
      {/* Background - User UI style */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* NAVIGATION BUTTONS */}
        <BackButton />
        <FullscreenButton />

        {/* EVENT LISTENER */}
        <ObserverListener />

        {/* REDESIGNED SCHEDULE COMPONENT */}
        <div className="mb-4 pt-2">
          <div className="bg-[#32A5DC]/20 backdrop-blur-sm rounded-xl shadow-xl px-6 py-3 max-w-6xl mx-auto border border-[#32A5DC]/30">
            {/* Main Content - Today's Hours as Hero */}
            <div className="grid grid-cols-3 items-center gap-6">
              {/* Today's Hours - Hero Section */}
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
                  {formatTodayDate()}
                </p>
                <div className="space-y-0.5">
                  {displaySchedule.map((period, index) => (
                    <p 
                      key={index} 
                      className="text-white text-2xl font-black leading-tight"
                    >
                      {period}
                    </p>
                  ))}
                </div>
              </div>

              {/* Status Indicator - Center */}
              <div className="flex justify-center items-center">
                {acceptingOrders ? (
                  <div className="px-8 py-4 bg-green-500 rounded-lg animate-pulse-green-bg flex items-center justify-center">
                    <span className="text-white text-5xl font-black uppercase tracking-wide">
                      OPEN
                    </span>
                  </div>
                ) : (
                  <div className="px-8 py-4 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-5xl font-black uppercase tracking-wide">
                      CLOSED
                    </span>
                  </div>
                )}
              </div>

              {/* Weekly Schedule - Secondary Information */}
              <div className="justify-self-end min-w-[200px]">
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                  This Week
                </p>
                <div className="space-y-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const schedule = scheduleMap.get(day.dayOfWeek);
                    const isToday = day.dayOfWeek === currentDayOfWeek;
                    const isClosed = !schedule || !schedule.isOpen;
                    const dayScheduleRange = schedule ? getCombinedScheduleRange(schedule) : 'Closed';

                    return (
                      <div
                        key={day.dayOfWeek}
                        className={`flex items-center justify-between px-3 py-1 rounded-lg transition-all ${
                          isToday
                            ? 'bg-[#32A5DC]/40 border border-[#32A5DC]/60'
                            : isClosed
                            ? 'bg-white/5 border border-white/10 opacity-40'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className={`text-xs font-medium whitespace-nowrap ${
                          isToday 
                            ? 'text-[#32A5DC] font-bold' 
                            : isClosed
                            ? 'text-gray-400'
                            : 'text-white/80'
                        }`}>
                          {day.name}
                        </span>
                        <span className={`text-[10px] font-medium whitespace-nowrap ml-2 ${
                          isClosed 
                            ? 'text-gray-500' 
                            : 'text-white/70'
                        }`}>
                          {dayScheduleRange}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-xl">
            Current Queue
          </h1>
        </div>

        {/* TICKETS GRID */}
        {allTickets.length === 0 ? (
          <div className="text-center py-20">
             <p className="text-white/40 text-lg">No orders in progress</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {allTickets.map((item, index) => (
               <ObserverCard key={item.id} item={item} queuePosition={index + 1} />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}