import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

export default function CoffeeIcon({ 
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
      {/* The Mug Handle: A semi-circle on the right */}
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      
      {/* The Mug Body: A rectangle that rounds at the bottom */}
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      
      {/* The Steam: Three vertical lines rising from the top */}
      <line x1="6" x2="6" y1="1" y2="4" />
      <line x1="10" x2="10" y1="1" y2="4" />
      <line x1="14" x2="14" y1="1" y2="4" />
    </svg>
  );
}