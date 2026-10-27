import { Check } from 'lucide-react';
import { useRef, useCallback, useEffect, type CSSProperties } from 'react';
import { getColorClass, getStrokeColor, getLightStrokeColor } from '@/lib/color-utils';

interface ProgressCircleProps {
  ariaLabel?: string;
  displayRatio?: boolean;
  cardStyle?: boolean;
  unitLabel?: string;
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
  cardStyle = false,
  unitLabel,
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
  const padding = cardStyle ? 0 : strokeWidth + 8; // Increased padding for glow
  const svgSize = size + padding * 2;
  // Increase radius so the inside of the ring fits around the outside of the center circle
  const radius = cardStyle ? (size - strokeWidth) / 2 : (size / 2) + (strokeWidth / 2) + 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = isNaN(progress) ? circumference : circumference - (progress * circumference);

  // Hold-to-increment functionality
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const heldActionRef = useRef(false);

  const startHold = useCallback(() => {
    if (!onHoldIncrement) return;
    
    heldActionRef.current = false;
    isHoldingRef.current = true;
    
    // Start the hold timeout (0.5 seconds)
    holdTimeoutRef.current = setTimeout(() => {
      if (isHoldingRef.current && onHoldIncrement) {
        // Start incrementing by 1 every 100ms
        holdIntervalRef.current = setInterval(() => {
          if (isHoldingRef.current && onHoldIncrement && count < goal) {
            heldActionRef.current = true;
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

  useEffect(() => endHold, [endHold]);

  const handleClick = useCallback(() => {
    if (cardStyle && heldActionRef.current) { heldActionRef.current = false; return; }
    // Only trigger onClick if we're not holding
    if (!isHoldingRef.current && onClick) {
      onClick();
    }
  }, [onClick, cardStyle]);

  return (
    <button
      aria-label={ariaLabel}
      onClick={handleClick}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      onPointerCancel={endHold}
      className={`${cardStyle ? "home-set-ring" : ""} relative transform transition-transform duration-150 hover:scale-105 active:scale-95 ${
        isAnimating ? 'bounce-animation' : ''
      }`}
      style={{ width: svgSize, height: cardStyle ? 'auto' : svgSize, aspectRatio: cardStyle ? '1' : undefined, userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Background circle - more transparent when completed */}
      {!cardStyle && <div
        className={`workout-colored-surface absolute rounded-full ${getColorClass(color)} shadow-lg transition-opacity duration-300 ${
          progress >= 1 ? 'opacity-20' : 'opacity-40'
        }`}
        style={{ 
          width: size, 
          height: size, 
          top: padding, 
          left: padding 
        }}
      />}
      
      {/* Content overlay - completely separate from background transparency */}
      <div 
        className="absolute flex items-center justify-center z-20"
        style={{ 
          width: cardStyle ? '100%' : size,
          height: cardStyle ? '100%' : size,
          top: padding, 
          left: padding 
        }}
      >
        {cardStyle ? (
          <span className="flex flex-col items-center text-strong">
            {progress >= 1 ? (
              <Check size={32} aria-hidden="true" data-testid="workout-complete-check" style={{ color: 'var(--workout-complete)' }} />
            ) : (
              <span className="home-set-count type-metric font-bold" data-long={`${count}/${goal}`.length > 7}>{count}/{goal}</span>
            )}
            <span className="text-xs font-medium text-supporting">{progress >= 1 ? `${count}/${goal} ${unitLabel}` : unitLabel}</span>
          </span>
        ) : progress >= 1 ? (
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
        viewBox={cardStyle ? `0 0 ${svgSize} ${svgSize}` : undefined}
        width={cardStyle ? "100%" : svgSize}
        height={cardStyle ? "100%" : svgSize}
        style={{ top: 0, left: 0, '--workout-stroke': getStrokeColor(color), '--workout-stroke-light': getLightStrokeColor(color) } as CSSProperties}
      >
        {/* Background ring - darker and thicker */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke={cardStyle ? "hsl(var(--progress-track))" : "var(--workout-track)"}
          strokeWidth={cardStyle ? strokeWidth : strokeWidth + 2}
          fill="none"
        />
        {/* Progress ring - Apple fitness style */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke={getStrokeColor(color)}
          strokeWidth={cardStyle ? strokeWidth : strokeWidth + 2}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="workout-progress-fill transition-all duration-500 ease-out"
          style={{
            filter: cardStyle ? 'none' : progress >= 1 ? 'var(--workout-glow-complete)' : 'var(--workout-glow)',
            opacity: 0.9
          }}
        />
      </svg>
      

    </button>
  );
}
