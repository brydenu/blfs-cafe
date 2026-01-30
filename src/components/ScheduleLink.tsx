'use client';

export default function ScheduleLink() {
  const handleClick = () => {
    document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group"
    >
      <span className="text-sm font-medium">Schedule</span>
      <svg 
        className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-200" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 9l-7 7-7-7" 
        />
      </svg>
    </button>
  );
}
