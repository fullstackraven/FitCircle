import { useMeditation } from '@/hooks/use-meditation';
import { GoalCircle } from '@/components/GoalCircle';
import { Brain } from 'lucide-react';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';

interface MeditationWidgetProps {
  widget: DashboardWidget;
  onClick?: () => void;
}

export function MeditationWidget({ widget, onClick }: MeditationWidgetProps) {
  const { getTodayMinutes, getDailyGoal, getProgressPercentage, isGoalReached } = useMeditation();
  
  const todayMinutes = getTodayMinutes();
  const dailyGoal = getDailyGoal();
  const progressPercentage = getProgressPercentage();

  if (widget.size === 'small') {
    return (
      <div className="fitcircle-card cursor-pointer hover:bg-surface/80 transition-colors" onClick={onClick}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-feature-purple" />
            <h3 className="text-sm font-semibold text-strong">Meditation</h3>
          </div>
          {isGoalReached() && <span className="text-accent-text text-xs">✓</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-strong font-medium">{todayMinutes}min</div>
            <div className="text-muted-foreground text-xs">of {dailyGoal}min</div>
          </div>
          <div className="text-right">
            <div className="text-strong text-sm font-medium">{Math.round(progressPercentage)}%</div>
            <div className="text-muted-foreground text-xs">Complete</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fitcircle-card cursor-pointer hover:bg-surface/80 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-feature-purple" />
          <h3 className="text-lg font-semibold text-strong">{widget.title}</h3>
        </div>
        {isGoalReached() && (
          <span className="text-accent-text text-sm font-medium">Goal Reached!</span>
        )}
      </div>
      
      <div className="flex justify-center mb-4">
        <GoalCircle
          percentage={progressPercentage}
          color="var(--wellness-purple)"
          size={120}
          strokeWidth={12}
          currentValue={todayMinutes}
          goalValue={dailyGoal}
          unit="min"
          title="Today's Progress"
          description={`Goal: ${dailyGoal}min/day`}
        />
      </div>
      
      <div className="text-center">
        <div className="text-supporting">
          {todayMinutes > 0 ? 'Keep up the mindful practice!' : 'Start your meditation today'}
        </div>
      </div>
    </div>
  );
}