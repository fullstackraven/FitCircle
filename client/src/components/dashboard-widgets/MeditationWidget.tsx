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
      <div className="fitcircle-card cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={onClick}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Meditation</h3>
          </div>
          {isGoalReached() && <span className="text-green-400 text-xs">✓</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{todayMinutes}min</div>
            <div className="text-slate-400 text-xs">of {dailyGoal}min</div>
          </div>
          <div className="text-right">
            <div className="text-white text-sm font-medium">{Math.round(progressPercentage)}%</div>
            <div className="text-slate-400 text-xs">Complete</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fitcircle-card cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
        </div>
        {isGoalReached() && (
          <span className="text-green-400 text-sm font-medium">Goal Reached!</span>
        )}
      </div>
      
      <div className="flex justify-center mb-4">
        <GoalCircle
          percentage={progressPercentage}
          color="rgb(168, 85, 247)"
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
        <div className="text-slate-300">
          {todayMinutes > 0 ? 'Keep up the mindful practice!' : 'Start your meditation today'}
        </div>
      </div>
    </div>
  );
}