'use client';

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
      } p-5`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                isCancelled 
                  ? 'bg-red-500 text-white' 
                  : 'bg-[#32A5DC] text-white'
              } shrink-0 shadow-lg`}>
                {queuePosition}
              </div>
              <h2 className={`text-2xl md:text-3xl font-black leading-tight truncate ${
                isCancelled ? 'text-red-600 line-through' : 'text-[#004876]'
              }`}>
                {primaryName}
              </h2>
            </div>
            {secondaryName && (
              <p className={`text-sm font-semibold ml-16 ${
                isCancelled ? 'text-red-400' : 'text-gray-600'
              }`}>
                {secondaryName}
              </p>
            )}
            {isCancelled && (
              <span className="inline-block mt-2 px-3 py-1 bg-red-500 text-white text-xs font-bold uppercase rounded-full">
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DRINK BODY */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        
        <div className="border-b-2 border-gray-100 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`text-xl md:text-2xl font-extrabold leading-tight ${
                isCancelled ? 'text-red-500 line-through' : 'text-[#004876]'
              }`}>
                {item.product.name}
              </h3>
              <p className={`text-base md:text-lg font-semibold mt-2 ${
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
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shrink-0 shadow-md">
                Personal Cup
              </span>
            )}
          </div>
        </div>

        {/* Shots Display (if applicable) */}
        {(item.product.category === 'coffee' || (item.parsedShots || item.shots || 0) > 0) && (
          <div className="flex items-center gap-2">
            <span className="bg-[#004876] text-white text-sm font-bold px-3 py-1.5 rounded-lg">
              {(item.parsedShots || item.shots || 0)} Shot{(item.parsedShots || item.shots || 0) !== 1 ? 's' : ''}
            </span>
            {item.caffeineType && item.caffeineType !== "Normal" && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                {item.caffeineType === "Decaf" ? "Decaf" : "Half-Caff"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}