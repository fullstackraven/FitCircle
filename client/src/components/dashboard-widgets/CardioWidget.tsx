import { useCardio } from "@/hooks/use-cardio";
import { GoalCircle } from "@/components/GoalCircle";
import { Activity } from "lucide-react";
import { DashboardWidget } from "@/hooks/use-dashboard-widgets";

interface CardioWidgetProps {
  widget: DashboardWidget;
  onClick?: () => void;
}

export function CardioWidget({ widget, onClick }: CardioWidgetProps) {
  const { data, getTodaysProgress } = useCardio();
  const goal = data.goal;

  const todaysProgress = getTodaysProgress();
  const progressValue =
    goal.type === "duration"
      ? todaysProgress.today.duration
      : todaysProgress.today.distance;
  const progressPercentage = todaysProgress.progress;
  const isGoalReached = goal.target > 0 && progressValue >= goal.target;

  if (widget.size === "small") {
    return (
      <div
        className="fitcircle-card cursor-pointer hover:bg-surface/80 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-feature-orange" />
            <h3 className="text-sm font-semibold text-strong">Cardio</h3>
          </div>
          {isGoalReached && <span className="text-accent-text text-xs">✓</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-strong font-medium">
              {progressValue}
              {goal.type === "duration" ? "min" : "mi"}
            </div>
            <div className="text-muted-foreground text-xs">
              of {goal.target}
              {goal.type === "duration" ? "min" : "mi"}/
              {goal.period === "week" ? "week" : "day"}
            </div>
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
          <Activity className="w-5 h-5 text-feature-orange" />
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
          color="var(--goal-orange)"
          size={120}
          strokeWidth={12}
          currentValue={progressValue}
          goalValue={goal.target}
          unit={goal.type === "duration" ? "min" : "mi"}
          title={
            goal.period === "week" ? "This Week’s Progress" : "Today’s Progress"
          }
          description={`Goal: ${goal.target}${goal.type === "duration" ? "min" : "mi"}/${goal.period === "week" ? "week" : "day"}`}
        />
      </div>

      <div className="text-center">
        <div className="text-supporting">
          {progressValue > 0
            ? "Keep moving!"
            : "Start your cardio workout today"}
        </div>
      </div>
    </div>
  );
}
