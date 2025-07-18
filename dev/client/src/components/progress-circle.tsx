import { Check } from 'lucide-react';

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
  lime: 'workout-lime',
  orange: 'workout-orange',
  indigo: 'workout-indigo',
  emerald: 'workout-emerald',
  yellow: 'workout-yellow'
};

const strokeColorMap: { [key: string]: string } = {
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  cyan: '#06b6d4',
  lime: '#84cc16',
  orange: '#f97316',
  indigo: '#6366f1',
  emerald: '#10b981',
  yellow: '#eab308'
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
      {/* Background circle - more transparent when completed */}
      <div 
        className={`absolute inset-0 rounded-full ${colorClassMap[color]} shadow-lg transition-opacity duration-300 ${
          progress >= 1 ? 'opacity-20' : 'opacity-40'
        }`}
      />
      
      {/* Content overlay - completely separate from background transparency */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {progress >= 1 ? (
          <Check 
            size={32} 
            style={{ 
              color: '#00ff41', // Bright neon green
              filter: 'drop-shadow(0 0 16px #00ff41) drop-shadow(0 0 32px #00ff41)',
              opacity: 1
            }} 
          />
        ) : (
          <span 
            className="font-black text-xl" 
            style={{ 
              color: '#ffffff', 
              textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 16px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.5)',
              opacity: 1,
              fontSize: '20px',
              fontWeight: 900
            }}
          >
            {count}
          </span>
        )}
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
            filter: progress >= 1 ? 'drop-shadow(0 0 16px currentColor) drop-shadow(0 0 32px currentColor)' : 'drop-shadow(0 0 4px currentColor)',
            opacity: 0.9
          }}
        />
      </svg>
      

    </button>
  );
}