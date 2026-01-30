import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

export default function DrinkIcon({ 
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
      {/* The Glass Body: Straight sides with a rounded bottom */}
      <path d="M7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z" />
      
      {/* The Straw: Coming out of the glass and bending */}
      {/* Starts inside glass at (10,8), goes up to (10,3), bends right to (15,3) */}
      <path d="M10 8V3h5" />
      
      {/* Liquid Line: Simple horizon line to show it's full */}
      <path d="M7 13h10" />
    </svg>
  );
}