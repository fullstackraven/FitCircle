import { useHydration } from "@/hooks/use-hydration";
import { GoalCircle } from "@/components/GoalCircle";
import { Droplet } from "lucide-react";
import { DashboardWidget } from "@/hooks/use-dashboard-widgets";

interface HydrationWidgetProps {
  widget: DashboardWidget;
  onClick?: () => void;
}

export function HydrationWidget({ widget, onClick }: HydrationWidgetProps) {
  const { dailyGoalOz, currentDayOz, progressPercentage } = useHydration();

  const isGoalReached = dailyGoalOz > 0 && currentDayOz >= dailyGoalOz;

  if (widget.size === "small") {
    return (
      <div
        className="fitcircle-card cursor-pointer hover:bg-surface/80 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-feature-blue" />
            <h3 className="text-sm font-semibold text-strong">Hydration</h3>
          </div>
          {isGoalReached && <span className="text-accent-text text-xs">✓</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-strong font-medium">{currentDayOz}oz</div>
            <div className="text-muted-foreground text-xs">of {dailyGoalOz}oz</div>
          </div>
          <div className="text-right">
            <div className="text-strong text-sm font-medium">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-muted-foreground text-xs">Complete</div>
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
          <Droplet className="w-5 h-5 text-feature-blue" />
          <h3 className="text-lg font-semibold text-strong">{widget.title}</h3>
        </div>
        {isGoalReached && (
          <span className="text-accent-text text-sm font-medium">
            Goal Reached!
          </span>
        )}
      </div>

      <div className="flex justify-center mb-4">
        <GoalCircle
          percentage={progressPercentage}
          color="var(--bmi-blue)"
          size={120}
          strokeWidth={12}
          currentValue={currentDayOz}
          goalValue={dailyGoalOz}
          unit="oz"
          title="Today's Intake"
          description={`Goal: ${dailyGoalOz}oz/day`}
        />
      </div>

      <div className="text-center">
        <div className="text-supporting">
          {currentDayOz > 0
            ? "Stay hydrated!"
            : "Start tracking your water intake"}
        </div>
      </div>
    </div>
  );
}
