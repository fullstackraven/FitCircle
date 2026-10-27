import { workoutLogComplete } from './workout-progress';
import type { WorkoutData, WorkoutLogEntry, Workout } from '@/hooks/use-workouts';
import { getTodayString, getDateString } from './date-utils';

// The existing Calendar all-time calculation, shared without changing its definitions.
export function getTotalWorkoutStats(data: WorkoutData, readRecovery: () => string | null) {
  const getCountFromLogEntry = (entry: number | WorkoutLogEntry | undefined): number => !entry ? 0 : typeof entry === 'object' ? entry.count : entry;
  const isWorkoutActiveOnDay = (workout: Workout, day: number) => !workout.scheduledDays || workout.scheduledDays.length === 0 || workout.scheduledDays.includes(day);
  const workoutArray = Object.values(data.workouts || {});
  const today = getTodayString();
  let totalReps = 0;
  let totalCompletedDays = 0;
  let totalExpectedDays = 0;

  if (workoutArray.length === 0 || !data.dailyLogs) {
    return {
      totalReps: 0,
      totalCompletedDays: 0,
      totalConsistency: 0
    };
  }

  // Get recovery days first (needed to find first active date)
  const recoveryData = readRecovery();
  let recoveryDays: string[] = [];
  if (recoveryData) {
    try {
      const parsed = JSON.parse(recoveryData);
      recoveryDays = parsed.recoveryDays || [];
    } catch (error) {
      recoveryDays = [];
    }
  }

  // Find first active date (either workout OR recovery day)
  let firstActiveDate: string | null = null;
  
  // Check workout days
  Object.keys(data.dailyLogs).forEach(dateStr => {
    const dayLog = data.dailyLogs[dateStr];
    const hasAnyReps = workoutArray.some(w => getCountFromLogEntry(dayLog[w.id]) > 0);
    if (hasAnyReps && (!firstActiveDate || dateStr < firstActiveDate)) {
      firstActiveDate = dateStr;
    }
  });
  
  // Check recovery days
  recoveryDays.forEach(dateStr => {
    if (!firstActiveDate || dateStr < firstActiveDate) {
      firstActiveDate = dateStr;
    }
  });

  if (!firstActiveDate) {
    return {
      totalReps: 0,
      totalCompletedDays: 0,
      totalConsistency: 0
    };
  }

  // Calculate total expected days from first active date to today
  const firstDate = new Date(firstActiveDate + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  totalExpectedDays = Math.floor((todayDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Iterate through each day from first active date to today (same approach as getMonthlyStats)
  for (let d = new Date(firstDate); d <= todayDate; d.setDate(d.getDate() + 1)) {
    const dateStr = getDateString(d);
    const dayLog = data.dailyLogs[dateStr] || {};
    const isToday = dateStr === today;

    if (isToday) {
      // For today: check scheduled workouts against current goals
      const todayDayOfWeek = new Date().getDay();
      const todaysScheduledWorkouts = workoutArray.filter(workout => isWorkoutActiveOnDay(workout, todayDayOfWeek));
      
      let allGoalsMet = true;
      todaysScheduledWorkouts.forEach(workout => {
        const count = getCountFromLogEntry(dayLog[workout.id]);
        totalReps += count;
        if (!workoutLogComplete(dayLog[workout.id], typeof dayLog[workout.id] === 'object' ? (dayLog[workout.id] as WorkoutLogEntry).goalAtTime : workout.dailyGoal)) {
          allGoalsMet = false;
        }
      });
      if (allGoalsMet && todaysScheduledWorkouts.length > 0) {
        totalCompletedDays++;
      }
    } else {
      // For past days: check only workouts that have logged reps
      const workoutsWithReps = workoutArray.filter(w => getCountFromLogEntry(dayLog[w.id]) > 0);
      if (workoutsWithReps.length > 0) {
        let allGoalsMet = true;
        workoutsWithReps.forEach(workout => {
          const logEntry = dayLog[workout.id];
          const count = getCountFromLogEntry(logEntry);
          const goalAtTime = typeof logEntry === 'object' ? logEntry.goalAtTime : workout.dailyGoal;
          totalReps += count;
          if (!workoutLogComplete(logEntry, goalAtTime)) {
            allGoalsMet = false;
          }
        });
        if (allGoalsMet) {
          totalCompletedDays++;
        }
      } else if (recoveryDays.includes(dateStr)) {
        // Count recovery days as completed (only if no workout was logged)
        totalCompletedDays++;
      }
    }
  }

  const totalConsistency = totalExpectedDays > 0 ? (totalCompletedDays / totalExpectedDays) * 100 : 0;

  return {
    totalReps,
    totalCompletedDays,
    totalConsistency
  };
}
