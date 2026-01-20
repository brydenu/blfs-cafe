import { prisma } from "@/lib/db";
import TicketCard from "./TicketCard";
import QueueListener from "./QueueListener";

export const dynamic = 'force-dynamic';

// --- MILK COLOR MAP ---
const MILK_COLORS: Record<string, string> = {
    'Whole': 'bg-red-500 text-white',
    'Nonfat': 'bg-blue-500 text-white',
    'Half and Half': 'bg-purple-500 text-white',
    'Breve': 'bg-purple-500 text-white',
    'Oat': 'bg-teal-500 text-white',
    'Almond': 'bg-[#a3e635] text-black',
    'Soy': 'bg-yellow-600 text-white',
    'Hemp': 'bg-green-800 text-white',
};
const DEFAULT_MILK_COLOR = 'bg-gray-700 text-white';

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

export default async function AdminQueuePage() {
  // 1. Fetch Active Orders
  // We still fetch orders that are 'queued' or 'preparing'
  const rawOrders = await prisma.order.findMany({
    where: {
      status: { in: ['queued', 'preparing'] } 
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

  // --- STATS CALCULATION ---
  let totalCafShots = 0;
  let totalDecafShots = 0;
  let totalHot = 0;
  let totalIced = 0;
  const milkCounts: Record<string, number> = {};

  const allTickets: any[] = [];

  rawOrders.forEach((order) => {
    order.items.forEach(item => {
        // --- KEY CHANGE: Filter out completed items ---
        if (item.completed === true) return; 

        const legacy = parseLegacyDetails(item.specialInstructions);
        
        // 1. Temperature
        const temp = (item.temperature || "").toLowerCase();
        if (temp.includes('iced')) totalIced++;
        else totalHot++;

        // 2. Shots (count shots for any drink, regardless of category)
        const activeShots = (item.shots || 0) > 0 ? item.shots : legacy.shots;
        
        if (activeShots > 0) {
             // Check caffeineType for accurate shot counting
             if (item.caffeineType === 'Decaf') {
                 totalDecafShots += activeShots;
             } else if (item.caffeineType === 'Half-Caff') {
                 // Half-caff: divide shots by 2, add half to each total
                 const halfShots = activeShots / 2;
                 totalDecafShots += halfShots;
                 totalCafShots += halfShots;
             } else {
                 // Normal or null caffeineType counts as regular caff shots
                 totalCafShots += activeShots;
             }
        }

        // 3. Milk
        let foundMilk = false;
        // Check Modifiers
        item.modifiers.forEach(mod => {
            if (mod.ingredient.category === 'milk') {
                milkCounts[mod.ingredient.name] = (milkCounts[mod.ingredient.name] || 0) + 1;
                foundMilk = true;
            }
        });
        // Check Legacy
        if (!foundMilk && legacy.milk) {
             milkCounts[legacy.milk] = (milkCounts[legacy.milk] || 0) + 1;
        }
        // Check Direct Column
        if (!foundMilk && !legacy.milk && item.milkName && item.milkName !== "No Milk") {
             milkCounts[item.milkName] = (milkCounts[item.milkName] || 0) + 1;
        }

        // --- SERIALIZE MODIFIERS (Decimal -> Number) ---
        const serializedModifiers = item.modifiers.map((mod) => ({
            ...mod,
            ingredient: {
                ...mod.ingredient,
                priceMod: Number(mod.ingredient.priceMod) 
            }
        }));

        // 4. Flatten for Cards
        allTickets.push({
            ...item,
            modifiers: serializedModifiers,
            
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
    <div className="max-w-[1800px] mx-auto space-y-8 relative">
      
      {/* --- EVENT LISTENER --- */}
      <QueueListener /> 

      {/* --- STATS DASHBOARD --- */}
      <div className="bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-700">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 rounded-2xl p-4 text-center border border-gray-700">
                <span className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Caff Shots</span>
                <span className="text-4xl md:text-5xl font-black text-orange-400">{totalCafShots}</span>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 text-center border border-gray-700">
                <span className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Decaf Shots</span>
                <span className="text-4xl md:text-5xl font-black text-gray-400">{totalDecafShots}</span>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 text-center border border-gray-700">
                <span className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Hot Drinks</span>
                <span className="text-4xl md:text-5xl font-black text-red-400">{totalHot}</span>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 text-center border border-gray-700">
                <span className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Iced Drinks</span>
                <span className="text-4xl md:text-5xl font-black text-blue-400">{totalIced}</span>
            </div>
         </div>

         <div>
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Milk Totals</h4>
            <div className="flex flex-wrap gap-3">
                {Object.entries(milkCounts).map(([milkName, count]) => {
                    let colorClass = DEFAULT_MILK_COLOR;
                    const key = Object.keys(MILK_COLORS).find(k => milkName.includes(k));
                    if (key) colorClass = MILK_COLORS[key];

                    return (
                        <div key={milkName} className={`${colorClass} px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg transform hover:scale-105 transition-transform`}>
                            <span className="font-bold text-lg">{milkName}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-black min-w-[30px] text-center">
                                {count}
                            </span>
                        </div>
                    );
                })}
                {Object.keys(milkCounts).length === 0 && (
                    <span className="text-gray-500 italic text-sm">No milk required.</span>
                )}
            </div>
         </div>
      </div>

      {/* --- TICKETS GRID --- */}
      {allTickets.length === 0 ? (
        <div className="text-center py-20 opacity-30">
           <div className="text-8xl mb-4">✨</div>
           <h3 className="text-3xl font-bold text-white">Queue Empty</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 queue-grid">
           {allTickets.map((item) => (
             <div key={item.id} className="queue-grid-item">
               <TicketCard item={item} />
             </div>
           ))}
        </div>
      )}
    </div>
  );
}