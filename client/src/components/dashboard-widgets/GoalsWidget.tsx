import { useGoals } from "@/hooks/use-goals";
import { Target } from "lucide-react";
import { DashboardWidget } from "@/hooks/use-dashboard-widgets";
import { useState, useEffect } from "react";

interface GoalsWidgetProps {
  widget: DashboardWidget;
  onClick?: () => void;
}

export function GoalsWidget({ widget, onClick }: GoalsWidgetProps) {
  const { goals, calculateProgress } = useGoals();
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    calculateProgress().then((value) => {
      const { weightProgress, ...unique } = value;
      setProgress(unique);
    });
  }, [calculateProgress]);

  // Calculate overall progress using actual goal progress
  const progressValues = progress ? (Object.values(progress) as number[]) : [];
  const totalProgress =
    progressValues.length > 0
      ? progressValues.reduce((sum, value) => sum + value, 0) /
        progressValues.length
      : 0;

  if (widget.size === "small") {
    return (
      <div
        className="fitcircle-card cursor-pointer hover:bg-surface/80 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-accent-text" />
            <h3 className="text-sm font-semibold text-strong">Goals</h3>
          </div>
          <span className="text-muted-foreground text-xs">
            {progressValues.length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-strong font-medium">
              {Math.round(totalProgress)}%
            </div>
            <div className="text-muted-foreground text-xs">Current goal periods</div>
          </div>
          <div className="w-8 h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-nutrition-green transition-all duration-300"
              style={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fitcircle-card cursor-pointer hover:bg-surface/80 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-accent-text" />
          <h3 className="text-lg font-semibold text-strong">{widget.title}</h3>
        </div>
        <span className="text-muted-foreground text-sm">
          {progressValues.length} goals
        </span>
      </div>

      <div className="space-y-3">
        {!progress || progressValues.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>No goals set yet</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="type-metric text-2xl font-bold text-strong mb-1">
                {Math.round(totalProgress)}%
              </div>
              <div className="text-muted-foreground">Current goal periods</div>
            </div>

            {Object.entries(progress)
              .slice(0, 3)
              .map(([goalName, goalProgress], index) => {
                const progressValue = goalProgress as number;
                const displayName =
                  goalName === "cardioProgress"
                    ? "Cardio · selected goal period"
                    : goalName === "fastingProgress"
                      ? "Fasting · completed today"
                      : goalName === "hydrationProgress"
                        ? "Hydration · today"
                        : goalName === "meditationProgress"
                          ? "Meditation · today"
                          : goalName
                              .replace("Progress", "")
                              .replace(/([A-Z])/g, " $1")
                              .trim();

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-strong capitalize">
                        {displayName}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(progressValue)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-nutrition-green transition-all duration-300"
                        style={{ width: `${Math.min(progressValue, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

            {progressValues.length > 3 && (
              <div className="text-center text-muted-foreground text-sm">
                +{progressValues.length - 3} more goals
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
