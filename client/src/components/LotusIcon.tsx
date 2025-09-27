interface LotusIconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}

export function LotusIcon({ className = "", size = 24, strokeWidth = 2 }: LotusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer petals */}
      <path d="M12 20c0-4.5-3-7-3-7s3-2.5 3-7c0 4.5 3 7 3 7s-3 2.5-3 7z" />
      <path d="M8 16c2-2 4-1.5 4-1.5s2-0.5 4 1.5c-2 2-4 1.5-4 1.5s-2 0.5-4-1.5z" />
      <path d="M16 8c-2 2-4 1.5-4 1.5s-2 0.5-4-1.5c2-2 4-1.5 4-1.5s2-0.5 4 1.5z" />
      
      {/* Inner petals */}
      <path d="M12 15c0-2.5-1.5-3.5-1.5-3.5s1.5-1 1.5-3.5c0 2.5 1.5 3.5 1.5 3.5s-1.5 1-1.5 3.5z" />
      <path d="M10 13c1-1 2-0.5 2-0.5s1-0.5 2 0.5c-1 1-2 0.5-2 0.5s-1 0.5-2-0.5z" />
      
      {/* Center dot */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}