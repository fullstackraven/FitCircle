import { useCardio } from '@/hooks/use-cardio';
import { GoalCircle } from '@/components/GoalCircle';
import { Activity } from 'lucide-react';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';

interface CardioWidgetProps {
  widget: DashboardWidget;
  onClick?: () => void;
}

export function CardioWidget({ widget, onClick }: CardioWidgetProps) {
  const { data, getTodaysProgress } = useCardio();
  const goal = data.goal;
  
  const todaysProgress = getTodaysProgress();
  const progressValue = goal.type === 'duration' ? todaysProgress.duration : todaysProgress.distance;
  const progressPercentage = goal.target > 0 ? Math.min((progressValue / goal.target) * 100, 100) : 0;
  const isGoalReached = progressValue >= goal.target;

  if (widget.size === 'small') {
    return (
      <div className="fitcircle-card cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={onClick}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Cardio</h3>
          </div>
          {isGoalReached && <span className="text-green-400 text-xs">✓</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">
              {progressValue}{goal.type === 'duration' ? 'min' : 'mi'}
            </div>
            <div className="text-slate-400 text-xs">
              of {goal.target}{goal.type === 'duration' ? 'min' : 'mi'}
            </div>
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
          <Activity className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
        </div>
        {isGoalReached && (
          <span className="text-green-400 text-sm font-medium">Goal Reached!</span>
        )}
      </div>
      
      <div className="flex justify-center mb-4">
        <GoalCircle
          percentage={progressPercentage}
          color="rgb(249, 115, 22)"
          size={120}
          strokeWidth={12}
          currentValue={progressValue}
          goalValue={goal.target}
          unit={goal.type === 'duration' ? 'min' : 'mi'}
          title="Today's Progress"
          description={`Goal: ${goal.target}${goal.type === 'duration' ? 'min' : 'mi'}/day`}
        />
      </div>
      
      <div className="text-center">
        <div className="text-slate-300">
          {progressValue > 0 ? 'Keep moving!' : 'Start your cardio workout today'}
        </div>
      </div>
    </div>
  );
}