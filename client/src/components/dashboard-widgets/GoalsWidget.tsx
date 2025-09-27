import { useGoals } from '@/hooks/use-goals';
import { Target } from 'lucide-react';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';
import { useState, useEffect } from 'react';

interface GoalsWidgetProps {
  widget: DashboardWidget;
  onClick?: () => void;
}

export function GoalsWidget({ widget, onClick }: GoalsWidgetProps) {
  const { goals, calculateProgress } = useGoals();
  const [progress, setProgress] = useState<any>(null);
  
  useEffect(() => {
    calculateProgress().then(setProgress);
  }, [calculateProgress]);
  
  // Calculate overall progress using actual goal progress
  const progressValues = progress ? Object.values(progress) as number[] : [];
  const totalProgress = progressValues.length > 0 
    ? progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length
    : 0;

  if (widget.size === 'small') {
    return (
      <div className="fitcircle-card cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={onClick}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Goals</h3>
          </div>
          <span className="text-slate-400 text-xs">{progressValues.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{Math.round(totalProgress)}%</div>
            <div className="text-slate-400 text-xs">Average Progress</div>
          </div>
          <div className="w-8 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-400 transition-all duration-300"
              style={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fitcircle-card cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
        </div>
        <span className="text-slate-400 text-sm">{progressValues.length} goals</span>
      </div>
      
      <div className="space-y-3">
        {!progress || progressValues.length === 0 ? (
          <div className="text-center text-slate-400 py-4">
            <p>No goals set yet</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-white mb-1">{Math.round(totalProgress)}%</div>
              <div className="text-slate-400">Overall Progress</div>
            </div>
            
            {Object.entries(progress).slice(0, 3).map(([goalName, goalProgress], index) => {
              const progressValue = goalProgress as number;
              const displayName = goalName.replace('Progress', '').replace(/([A-Z])/g, ' $1').trim();
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white capitalize">{displayName}</span>
                    <span className="text-slate-400">{Math.round(progressValue)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-400 transition-all duration-300"
                      style={{ width: `${Math.min(progressValue, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            
            {progressValues.length > 3 && (
              <div className="text-center text-slate-400 text-sm">
                +{progressValues.length - 3} more goals
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}