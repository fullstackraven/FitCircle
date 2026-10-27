import { Check } from 'lucide-react';
import { useRef, useCallback, useEffect, type CSSProperties } from 'react';
import { getColorClass, getStrokeColor, getLightStrokeColor } from '@/lib/color-utils';

interface ProgressCircleProps {
  ariaLabel?: string;
  displayRatio?: boolean;
  count: number;
  goal: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
  onHoldIncrement?: () => void;
  isAnimating?: boolean;
}


export function ProgressCircle({ 
  ariaLabel,
  displayRatio = false,
  count, 
  goal, 
  color, 
  size = 80, 
  strokeWidth = 6, 
  onClick,
  onHoldIncrement,
  isAnimating = false 
}: ProgressCircleProps) {
  const progress = goal > 0 ? Math.min(count / goal, 1) : 0;
  // Add padding to accommodate the stroke width and glow effect
  const padding = strokeWidth + 8; // Increased padding for glow
  const svgSize = size + padding * 2;
  // Increase radius so the inside of the ring fits around the outside of the center circle
  const radius = (size / 2) + (strokeWidth / 2) + 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = isNaN(progress) ? circumference : circumference - (progress * circumference);

  // Hold-to-increment functionality
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const startHold = useCallback(() => {
    if (!onHoldIncrement) return;
    
    isHoldingRef.current = true;
    
    // Start the hold timeout (0.5 seconds)
    holdTimeoutRef.current = setTimeout(() => {
      if (isHoldingRef.current && onHoldIncrement) {
        // Start incrementing by 1 every 100ms
        holdIntervalRef.current = setInterval(() => {
          if (isHoldingRef.current && onHoldIncrement && count < goal) {
            onHoldIncrement();
          } else if (count >= goal) {
            // Stop incrementing when goal is reached
            endHold();
          }
        }, 100);
      }
    }, 500);
  }, [onHoldIncrement, count, goal]);

  const endHold = useCallback(() => {
    isHoldingRef.current = false;
    
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  // Effect to stop hold when goal is reached
  useEffect(() => {
    if (count >= goal && holdIntervalRef.current) {
      endHold();
    }
  }, [count, goal, endHold]);

  const handleClick = useCallback(() => {
    // Only trigger onClick if we're not holding
    if (!isHoldingRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <button
      aria-label={ariaLabel}
      onClick={handleClick}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      onTouchCancel={endHold}
      className={`relative transform transition-transform duration-150 hover:scale-105 active:scale-95 ${
        isAnimating ? 'bounce-animation' : ''
      }`}
      style={{ width: svgSize, height: svgSize, userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Background circle - more transparent when completed */}
      <div 
        className={`workout-colored-surface absolute rounded-full ${getColorClass(color)} shadow-lg transition-opacity duration-300 ${
          progress >= 1 ? 'opacity-20' : 'opacity-40'
        }`}
        style={{ 
          width: size, 
          height: size, 
          top: padding, 
          left: padding 
        }}
      />
      
      {/* Content overlay - completely separate from background transparency */}
      <div 
        className="absolute flex items-center justify-center z-20"
        style={{ 
          width: size, 
          height: size, 
          top: padding, 
          left: padding 
        }}
      >
        {progress >= 1 ? (
          <Check 
            size={32} 
            style={{ 
              color: 'var(--workout-complete)',
              filter: 'var(--workout-complete-glow)',
              opacity: 1
            }} 
          />
        ) : (
          <span 
            className="type-metric font-black text-xl"
            style={{ 
              color: 'var(--workout-number)',
              textShadow: 'var(--workout-number-shadow)',
              opacity: 1,
              fontSize: '20px',
              fontWeight: 900
            }}
          >
            {displayRatio ? `${count}/${goal}` : count}
          </span>
        )}
      </div>
      
      {/* Progress ring */}
      <svg
        className="absolute transform -rotate-90"
        width={svgSize}
        height={svgSize}
        style={{ top: 0, left: 0, '--workout-stroke': getStrokeColor(color), '--workout-stroke-light': getLightStrokeColor(color) } as CSSProperties}
      >
        {/* Background ring - darker and thicker */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="var(--workout-track)"
          strokeWidth={strokeWidth + 2}
          fill="none"
        />
        {/* Progress ring - Apple fitness style */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke={getStrokeColor(color)}
          strokeWidth={strokeWidth + 2}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="workout-progress-fill transition-all duration-500 ease-out"
          style={{
            filter: progress >= 1 ? 'var(--workout-glow-complete)' : 'var(--workout-glow)',
            opacity: 0.9
          }}
        />
      </svg>
      

    </button>
  );
}
