import { useWorkouts } from '@/hooks/use-workouts';
import { ProgressCircle } from '@/components/progress-circle';
import { getColorClass } from '@/lib/color-utils';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';

interface WorkoutWidgetProps {
  widget: DashboardWidget;
  onWorkoutClick?: (workoutId: string) => void;
}

export function WorkoutWidget({ widget, onWorkoutClick }: WorkoutWidgetProps) {
  const { getWorkoutArray, isWorkoutActiveOnDay, getTodaysTotals } = useWorkouts();
  
  const workouts = getWorkoutArray();
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todaysWorkouts = workouts.filter(workout => isWorkoutActiveOnDay(workout, today));
  const todaysTotals = getTodaysTotals();

  if (widget.size === 'small') {
    // Show summary for small widget
    const totalProgress = todaysWorkouts.reduce((sum, workout) => {
      const total = todaysTotals.find(t => t.id === workout.id);
      const progress = total ? (total.count / workout.dailyGoal) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    const averageProgress = todaysWorkouts.length > 0 ? totalProgress / todaysWorkouts.length : 0;

    return (
      <div className="fitcircle-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
          <span className="text-sm text-slate-400">{todaysWorkouts.length} active</span>
        </div>
        <div className="flex justify-center">
          <ProgressCircle
            count={averageProgress}
            goal={100}
            color="rgb(168, 85, 247)"
            size={80}
            strokeWidth={8}
          />
        </div>
        <div className="text-center mt-2">
          <div className="text-white font-medium">{Math.round(averageProgress)}%</div>
          <div className="text-slate-400 text-sm">Average Progress</div>
        </div>
      </div>
    );
  }

  // Medium/Large widget shows individual workouts
  return (
    <div className="fitcircle-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
        <span className="text-sm text-slate-400">{todaysWorkouts.length} workouts</span>
      </div>
      
      {todaysWorkouts.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <p>No workouts scheduled for today</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${widget.size === 'large' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
          {todaysWorkouts.map(workout => {
            const todayTotal = todaysTotals.find(t => t.id === workout.id);
            const currentCount = todayTotal?.count || 0;
            const progress = (currentCount / workout.dailyGoal) * 100;
            const isCompleted = currentCount >= workout.dailyGoal;

            return (
              <div 
                key={workout.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isCompleted 
                    ? 'border-green-500 bg-green-500/10' 
                    : `border-slate-600 bg-slate-800/50 hover:border-slate-500`
                }`}
                onClick={() => onWorkoutClick?.(workout.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2">
                    <ProgressCircle
                      count={Math.min(progress, 100)}
                      goal={100}
                      color={getColorClass(workout.color)}
                      size={60}
                      strokeWidth={6}
                    />
                  </div>
                  <h4 className="text-white font-medium text-sm mb-1">{workout.name}</h4>
                  <div className="text-slate-400 text-xs">
                    {currentCount} / {workout.dailyGoal}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}