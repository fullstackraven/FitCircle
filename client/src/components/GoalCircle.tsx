import React from 'react';

interface GoalCircleProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  currentValue: number;
  goalValue: number;
  unit: string;
  title: string;
  description?: string;
}

export function GoalCircle({ 
  percentage, 
  color, 
  size = 120, 
  strokeWidth = 8, 
  currentValue, 
  goalValue, 
  unit, 
  title,
  description 
}: GoalCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(71, 85, 105)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl font-bold text-white">
            {goalValue}{unit}
          </div>
          <div className="text-xs text-slate-400 text-center">
            {Math.round(percentage)}%
          </div>
        </div>
      </div>
      
      {/* Title and description */}
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}