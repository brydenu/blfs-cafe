interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

export default function LightbulbIcon({ 
  className = "", 
  color = "currentColor",
  size = 24 
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21h6" />
      <path d="M12 3a6 6 0 0 0-6 6c0 2.5 1.5 4.5 3 6l1.5 2h3L15 15c1.5-1.5 3-3.5 3-6a6 6 0 0 0-6-6z" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}
