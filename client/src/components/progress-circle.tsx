interface ProgressCircleProps {
  count: number;
  goal: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
  isAnimating?: boolean;
}

const colorClassMap: { [key: string]: string } = {
  green: 'workout-green',
  blue: 'workout-blue',
  purple: 'workout-purple',
  amber: 'workout-amber',
  red: 'workout-red',
  pink: 'workout-pink',
  cyan: 'workout-cyan',
  lime: 'workout-lime'
};

const strokeColorMap: { [key: string]: string } = {
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  cyan: '#06b6d4',
  lime: '#84cc16'
};

export function ProgressCircle({ 
  count, 
  goal, 
  color, 
  size = 80, 
  strokeWidth = 6, 
  onClick,
  isAnimating = false 
}: ProgressCircleProps) {
  const progress = goal > 0 ? Math.min(count / goal, 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = isNaN(progress) ? circumference : circumference - (progress * circumference);

  return (
    <button
      onClick={onClick}
      className={`relative transform transition-transform duration-150 hover:scale-105 active:scale-95 ${
        isAnimating ? 'bounce-animation' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {/* Background circle - more transparent */}
      <div 
        className={`absolute inset-0 rounded-full ${colorClassMap[color]} flex items-center justify-center shadow-lg opacity-40`}
      >
        <span className="text-white font-bold text-xl z-10">{count}</span>
      </div>
      
      {/* Progress ring */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background ring - darker and thicker */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth + 2}
          fill="none"
        />
        {/* Progress ring - Apple fitness style */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColorMap[color] || '#22c55e'}
          strokeWidth={strokeWidth + 2}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: progress >= 1 ? 'drop-shadow(0 0 12px currentColor)' : 'drop-shadow(0 0 4px currentColor)',
            opacity: 0.9
          }}
        />
      </svg>
      
      {/* Goal achieved indicator */}
      {progress >= 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-pulse" />
        </div>
      )}
    </button>
  );
}