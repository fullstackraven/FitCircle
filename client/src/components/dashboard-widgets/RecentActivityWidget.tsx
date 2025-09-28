import { useWorkouts } from '@/hooks/use-workouts';
import { Clock } from 'lucide-react';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';
import { format, parse } from 'date-fns';

interface RecentActivityWidgetProps {
  widget: DashboardWidget;
}

export function RecentActivityWidget({ widget }: RecentActivityWidgetProps) {
  const { getRecentActivity, getRoutineArray } = useWorkouts();
  const recentActivity = getRecentActivity();
  const routines = getRoutineArray() || [];

  // Helper function to get routine name for a specific date based on completed workouts
  const getRoutineForDate = (dateString: string, dayWorkouts: any[]) => {
    try {
      // Find workouts that were actually completed on this day
      const completedWorkouts = dayWorkouts.filter(workout => workout.count > 0);
      
      if (completedWorkouts.length === 0) {
        return null;
      }
      
      // Find the routine that these workouts belong to
      // Check the routineId of the first completed workout
      const firstWorkout = completedWorkouts[0];
      if (firstWorkout.routineId) {
        const routine = routines.find(r => r.id === firstWorkout.routineId);
        return routine ? routine.name : null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  if (widget.size === 'small') {
    const todaysTotal = recentActivity[0]?.totalReps || 0;
    
    return (
      <div className="fitcircle-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Today</h3>
          </div>
        </div>
        <div className="text-center">
          <div className="text-white font-medium text-lg">{todaysTotal}</div>
          <div className="text-slate-400 text-xs">Total Reps</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fitcircle-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        {recentActivity.length === 0 ? (
          <div className="text-center text-slate-400 py-4">
            <p>No recent activity</p>
          </div>
        ) : (
          recentActivity.slice(0, 7).map((day, index) => {
            const routineName = getRoutineForDate(day.dateString, day.workouts);
            return (
              <div key={index} className="flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="text-slate-300">{day.date}</div>
                  {routineName && (
                    <div className="text-xs text-slate-400 mt-1">{routineName}</div>
                  )}
                </div>
                <div className="text-white font-medium">{day.totalReps} reps</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}