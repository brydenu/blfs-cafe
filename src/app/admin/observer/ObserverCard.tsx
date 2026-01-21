'use client';

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

interface ObserverCardProps {
  item: any;
  queuePosition: number;
}

export default function ObserverCard({ item, queuePosition }: ObserverCardProps) {
  // --- NAME PRIORITY ---
  // 1. Recipient Name (Group Order / Edit)
  // 2. Legacy Parsed Name
  // 3. Account Owner Name (Default)
  const primaryName = item.recipientName || item.parsedName || item.orderOwnerName;
  
  // Only show secondary if it's different from primary
  const secondaryName = (item.orderOwnerName !== primaryName) ? `Ordered by ${item.orderOwnerName}` : null;

  // Helper to resolve Milk Name from 3 potential sources:
  // 1. Modifiers (Ingredient Table)
  // 2. Direct Column (New Cart Logic)
  // 3. Legacy Parsed String
  const resolveMilkName = () => {
    const modMilk = item.modifiers.find((m: any) => m.ingredient.category === 'milk');
    if (modMilk) {
      // Replace "Half and Half" with "Breve" to save space
      return modMilk.ingredient.name === "Half and Half" ? "Breve" : modMilk.ingredient.name;
    }
    
    if (item.milkName && item.milkName !== "No Milk") {
      // Replace "Half and Half" with "Breve" to save space
      return item.milkName === "Half and Half" ? "Breve" : item.milkName;
    }
    
    // Replace "Half and Half" with "Breve" in parsed milk too
    if (item.parsedMilk && item.parsedMilk === "Half and Half") {
      return "Breve";
    }
    
    return item.parsedMilk;
  };
  const finalMilkName = resolveMilkName();

  const isCancelled = item.cancelled === true;

  return (
    <div 
      className={`bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full border-2 ${
        isCancelled ? 'border-red-300 border-opacity-60 opacity-75' : 'border-gray-200'
      }`}
    >
      
      {/* HEADER */}
      <div className={`bg-gradient-to-r ${
        isCancelled 
          ? 'from-red-50 to-red-100 border-b-2 border-red-200' 
          : 'from-[#32A5DC]/10 to-blue-50 border-b-2 border-blue-100'
      } p-3`}>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                isCancelled 
                  ? 'bg-red-500 text-white' 
                  : 'bg-[#32A5DC] text-white'
              } shrink-0 shadow-lg`}>
                {queuePosition}
              </div>
              <h2 className={`font-black leading-tight truncate min-w-0 flex-1 ${
                isCancelled ? 'text-red-600 line-through' : 'text-[#004876]'
              }`}
              style={{
                fontSize: 'clamp(0.875rem, 4vw, 1.5rem)'
              }}>
                {primaryName}
              </h2>
            </div>
            {secondaryName && (
              <p className={`text-xs font-semibold ml-[50px] ${
                isCancelled ? 'text-red-400' : 'text-gray-600'
              }`}>
                {secondaryName}
              </p>
            )}
            {isCancelled && (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-red-500 text-white text-xs font-bold uppercase rounded-full">
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DRINK BODY */}
      <div className="p-3 flex-1 flex flex-col gap-2.5">
        
        <div className="border-b-2 border-gray-100 pb-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`text-lg md:text-xl font-extrabold leading-tight ${
                isCancelled ? 'text-red-500 line-through' : 'text-[#004876]'
              }`}>
                {item.product.name}
              </h3>
              <p className={`text-sm md:text-base font-semibold mt-1 ${
                isCancelled 
                  ? 'text-red-400' 
                  : item.temperature?.includes('Iced') 
                    ? 'text-blue-600' 
                    : 'text-orange-600'
              }`}>
                {item.temperature}
              </p>
            </div>
            {/* Personal Cup Badge */}
            {item.personalCup && (
              <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0 shadow-md">
                Personal Cup
              </span>
            )}
          </div>
        </div>

        {/* Shots, Caffeine, and Milk Display */}
        <div className="flex flex-wrap items-center gap-2">
          {(item.product.category === 'coffee' || (item.parsedShots || item.shots || 0) > 0) && (
            <span className="bg-[#004876] text-white text-sm font-bold px-3 py-1.5 rounded-lg">
              {(item.parsedShots || item.shots || 0)} Shot{(item.parsedShots || item.shots || 0) !== 1 ? 's' : ''}
            </span>
          )}
          {item.caffeineType && item.caffeineType !== "Normal" && (
            <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg uppercase">
              {item.caffeineType === "Decaf" ? "Decaf" : "Half-Caff"}
            </span>
          )}
          {finalMilkName && (
            (() => {
              let colorClass = DEFAULT_MILK_COLOR;
              // Check for "Breve" or original "Half and Half" in color mapping
              const key = Object.keys(MILK_COLORS).find(k => 
                finalMilkName.includes(k) || (finalMilkName === "Breve" && k === "Half and Half")
              );
              if (key) colorClass = MILK_COLORS[key];

              return (
                <span className={`${colorClass} text-sm font-bold px-3 py-1.5 rounded-lg uppercase`}>
                  {finalMilkName}
                </span>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}