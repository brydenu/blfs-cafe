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

export default async function ObserverPage() {
  // 1. Fetch Active Orders
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

        {/* HEADER */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-xl">
            Current Queue
          </h1>
          <p className="text-blue-100 text-lg font-light">
            Your order will appear here
          </p>
        </div>

        {/* TICKETS GRID */}
        {allTickets.length === 0 ? (
          <div className="text-center py-20 opacity-70">
             <div className="text-8xl mb-4">✨</div>
             <h3 className="text-3xl font-bold text-white">Queue Empty</h3>
             <p className="text-blue-100 mt-2">No orders in progress</p>
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