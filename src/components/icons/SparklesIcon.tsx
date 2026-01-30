interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

export default function SparklesIcon({ 
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
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
      <path d="M19 3v6" />
      <path d="M22 6h-6" />
      <path d="M19 17v6" />
      <path d="M22 20h-6" />
      <path d="M2 19v-6" />
      <path d="M5 16H11" />
    </svg>
  );
}
