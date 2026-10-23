import React from "react";

interface GoalCircleProps {
  percentage: number;
  showPercentage?: boolean;
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
  showPercentage = true,
  color,
  size = 140,
  strokeWidth = 12,
  currentValue,
  goalValue,
  unit,
  title,
  description,
}: GoalCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Number.isFinite(percentage)
    ? Math.max(0, Math.min(100, percentage))
    : 0;
  const strokeDashoffset =
    circumference - (safePercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--bmi-track)"
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
          {title === "Wellness Score" ? (
            <div className="type-metric text-4xl font-bold text-strong">
              {Math.round(safePercentage)}
            </div>
          ) : (
            <>
              <div className="type-metric text-lg font-bold text-strong">
                {Number.isFinite(goalValue) && goalValue > 0 ? goalValue : 0}{" "}
                {goalValue === 1
                  ? unit.replace("days", "Day").replace("Days", "Day")
                  : unit.replace("days", "Days").replace("Days", "Days")}
              </div>
              <div className="type-metric type-caption text-muted-foreground text-center">
                {showPercentage ? `${Math.round(safePercentage)}%` : "—"}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title and description */}
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold text-strong">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
