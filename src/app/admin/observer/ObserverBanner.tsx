'use client';

interface ObserverBannerProps {
  item: any;
  queuePosition: number;
}

export default function ObserverBanner({ item, queuePosition }: ObserverBannerProps) {
  // --- NAME PRIORITY ---
  // 1. Recipient Name (Group Order / Edit)
  // 2. Legacy Parsed Name
  // 3. Account Owner Name (Default)
  const primaryName = item.recipientName || item.parsedName || item.orderOwnerName;
  
  const isCancelled = item.cancelled === true;

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg overflow-hidden flex items-center gap-3 px-4 py-3 border-2 h-16 ${
        isCancelled ? 'border-red-300 border-opacity-60 opacity-75' : 'border-gray-200'
      }`}
    >
      {/* Queue Number */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
        isCancelled 
          ? 'bg-red-500 text-white' 
          : 'bg-[#32A5DC] text-white'
      } shadow-md`}>
        {queuePosition}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold truncate ${
          isCancelled ? 'text-red-600 line-through' : 'text-[#004876]'
        }`}
        style={{
          fontSize: 'clamp(0.875rem, 3vw, 1rem)'
        }}>
          {primaryName}
        </p>
      </div>

      {/* Drink Name */}
      <div className="flex-1 min-w-0 text-right">
        <p className={`font-semibold truncate ${
          isCancelled ? 'text-red-500 line-through' : 'text-gray-700'
        }`}
        style={{
          fontSize: 'clamp(0.75rem, 3vw, 0.9375rem)'
        }}>
          {item.product.name}
        </p>
      </div>
    </div>
  );
}
