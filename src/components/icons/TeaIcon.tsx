import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

export default function TeaIcon({ 
  className = "", 
  color = "currentColor", 
  size = 24 
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Main Leaf Body - Fills the majority of the frame */}
      {/* Starts at bottom (12,22), curves wide to sides, meets at top (12,2) */}
      <path d="M12 22c5.5-5 8-9 8-13 0-4-3.5-7-8-7s-8 3-8 7c0 4 2.5 8 8 13z" />
      
      {/* Central Stem/Vein */}
      <path d="M12 2v20" />
      
      {/* Leaf Ribs - Diagonal lines to give it texture and distinguish it as a leaf */}
      <path d="M12 8l5-2" />
      <path d="M12 14l5-2" />
      <path d="M12 8l-5-2" />
      <path d="M12 14l-5-2" />
    </svg>
  );
}