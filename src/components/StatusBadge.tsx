'use client';

interface StatusBadgeProps {
  isOpen: boolean;
}

export default function StatusBadge({ isOpen }: StatusBadgeProps) {
  const handleClick = () => {
    document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button
      onClick={handleClick}
      className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          isOpen ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        <span className="text-white/90 text-sm font-medium">
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
    </button>
  );
}
