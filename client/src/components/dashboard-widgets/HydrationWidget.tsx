import { useHydration } from '@/hooks/use-hydration';
import { GoalCircle } from '@/components/GoalCircle';
import { Droplet } from 'lucide-react';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';

interface HydrationWidgetProps {
  widget: DashboardWidget;
  onClick?: () => void;
}

export function HydrationWidget({ widget, onClick }: HydrationWidgetProps) {
  const { dailyGoalOz, currentDayOz, progressPercentage } = useHydration();
  
  const isGoalReached = currentDayOz >= dailyGoalOz;

  if (widget.size === 'small') {
    return (
      <div className="fitcircle-card cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={onClick}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Hydration</h3>
          </div>
          {isGoalReached && <span className="text-green-400 text-xs">✓</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{currentDayOz}oz</div>
            <div className="text-slate-400 text-xs">of {dailyGoalOz}oz</div>
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
          <Droplet className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
        </div>
        {isGoalReached && (
          <span className="text-green-400 text-sm font-medium">Goal Reached!</span>
        )}
      </div>
      
      <div className="flex justify-center mb-4">
        <GoalCircle
          percentage={progressPercentage}
          color="rgb(59, 130, 246)"
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
        <div className="text-slate-300">
          {currentDayOz > 0 ? 'Stay hydrated!' : 'Start tracking your water intake'}
        </div>
      </div>
    </div>
  );
}