import { prisma } from "@/lib/db";
import ObserverCard from "./ObserverCard";
import ObserverBanner from "./ObserverBanner";
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

  // Get display schedule and accepting orders status
  const displaySchedule = todaySchedule ? getDisplaySchedule(todaySchedule) : ["Closed"];
  const acceptingOrders = todaySchedule ? isAcceptingOrders(todaySchedule) : false;

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

        // --- SERIALIZE MODIFIERS (remove price fields) ---
        const serializedModifiers = item.modifiers.map((mod) => {
          const { priceMod, ...ingredientWithoutPrice } = mod.ingredient;
          return {
            ...mod,
            ingredient: ingredientWithoutPrice
          };
        });

        // Calculate activeShots for display (even if cancelled)
        const activeShots = (item.shots || 0) > 0 ? item.shots : legacy.shots;

        // Flatten for Cards
        const { basePrice, ...productWithoutPrice } = item.product;
        allTickets.push({
            ...item,
            modifiers: serializedModifiers,
            cancelled: isCancelled,
            parsedShots: activeShots,
            parsedMilk: legacy.milk,
            parsedName: legacy.name,
            product: productWithoutPrice,
            parentOrderId: order.id,
            parentPublicId: order.publicId,
            orderCreatedAt: order.createdAt,
            orderOwnerName: order.guestName || order.user?.firstName || "Guest",
        });
    });
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      
      {/* Background - User UI style */}
      <div className="fixed inset-0 z-0 bg-[#004876]">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* EVENT LISTENER */}
      <ObserverListener />

      {/* Navigation Buttons - Fixed at bottom of page */}
      <div className="fixed bottom-4 left-4 z-20">
        <BackButton />
      </div>
      <div className="fixed bottom-4 right-4 z-20">
        <FullscreenButton />
      </div>

      {/* FULL-WIDTH HEADER BAR - Status, Hours, Ordering Info */}
      <div className="relative z-10 w-full bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl">

        {/* Main Content Row */}
        <div className="w-full px-4 md:px-8 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-6 md:gap-8 max-w-7xl mx-auto">
            
            {/* Current Status */}
            <div className="flex flex-col items-center">
              <p className="text-white/50 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-2">
                Current Status
              </p>
              {acceptingOrders ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-xl blur-lg opacity-40 animate-pulse"></div>
                  <div className="relative px-6 py-3 bg-green-500 rounded-xl flex items-center justify-center shadow-xl border border-green-400/30">
                    <span className="text-white text-2xl md:text-3xl font-black uppercase tracking-wider">
                      OPEN
                    </span>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-3 bg-red-500/90 rounded-xl flex items-center justify-center shadow-xl border border-red-400/30">
                  <span className="text-white text-2xl md:text-3xl font-black uppercase tracking-wider">
                    CLOSED
                  </span>
                </div>
              )}
            </div>

            {/* Today's Hours - Centered */}
            <div className="flex flex-col items-center">
              <p className="text-white/50 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-2">
                Today's Hours
              </p>
              <div className="bg-[#32A5DC]/15 border border-[#32A5DC]/50 rounded-xl px-6 py-3 backdrop-blur-sm shadow-lg w-full max-w-md mx-auto">
                <div className="space-y-1 text-center">
                  {displaySchedule.length > 0 ? (
                    displaySchedule.map((period, index) => (
                      <p 
                        key={index} 
                        className="text-white text-lg md:text-xl font-bold leading-tight whitespace-nowrap"
                      >
                        {period}
                      </p>
                    ))
                  ) : (
                    <p className="text-white/70 text-lg md:text-xl font-bold">
                      Closed
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Online Information */}
            <div className="flex flex-col items-center">
              <p className="text-white/50 text-xs font-medium mb-2 text-center md:text-right">
                Join the queue at
              </p>
              <div className="bg-white/5 border border-white/20 rounded-xl px-6 py-3 backdrop-blur-md shadow-lg">
                <p className="text-white text-xl md:text-2xl font-normal tracking-tight text-center md:text-right">
                  biolifecafe.com
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">

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
             {/* First 8 orders - Full ObserverCard */}
             {allTickets.slice(0, 8).map((item, index) => (
               <ObserverCard key={item.id} item={item} queuePosition={index + 1} />
             ))}
             
             {/* Next 7 orders (9-15) - Compact ObserverBanner */}
             {allTickets.slice(8, 15).map((item, index) => (
               <ObserverBanner key={item.id} item={item} queuePosition={index + 9} />
             ))}
             
             {/* Ellipses indicator if more than 15 orders */}
             {allTickets.length > 15 && (
               <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 flex items-center justify-center h-16">
                 <p className="text-gray-400 text-3xl font-bold">
                   ...
                 </p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}