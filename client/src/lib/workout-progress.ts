import type { Workout, WorkoutLogEntry } from '@/hooks/use-workouts';
export type SetLog = WorkoutLogEntry & { completedSets: number; setsGoalAtTime: number };
export function isSetLog(entry: number | WorkoutLogEntry | undefined): entry is SetLog {
  return typeof entry === 'object' && entry.completedSets !== undefined && entry.setsGoalAtTime !== undefined;
}
export const repsForSets = (sets: number, reps: number, target: number) => Math.floor(sets * reps / target);
export function workoutProgress(workout: Workout, entry?: number | WorkoutLogEntry) {
  const reps = typeof entry === 'object' ? entry.count : entry || 0;
  if (isSetLog(entry)) return { mode: 'sets' as const, count: entry.completedSets, goal: entry.setsGoalAtTime, reps, repGoal: entry.goalAtTime };
  // Any legacy object (including an undone zero) or positive numeric record stays
  // rep-based for this day. Reading never adds metadata to historical records.
  if (typeof entry === 'object' || reps > 0) return { mode: 'reps' as const, count: reps, goal: typeof entry === 'object' ? entry.goalAtTime : workout.dailyGoal, reps, repGoal: typeof entry === 'object' ? entry.goalAtTime : workout.dailyGoal };
  return { mode: 'sets' as const, count: 0, goal: workout.setsGoal ?? 1, reps: 0, repGoal: workout.dailyGoal };
}
export function workoutLogComplete(entry: number | WorkoutLogEntry | undefined, legacyGoal: number) {
  return isSetLog(entry) ? entry.completedSets >= entry.setsGoalAtTime
    : (typeof entry === 'object' ? entry.count : entry || 0) >= legacyGoal;
}
export function stepWorkout(workout: Workout, entry: number | WorkoutLogEntry | undefined, direction: 1 | -1): WorkoutLogEntry {
  const p = workoutProgress(workout, entry);
  const count = Math.max(0, Math.min(p.goal, p.count + direction));
  if (p.mode === 'reps') return { ...(typeof entry === 'object' ? entry : {}), count: direction < 0 ? Math.max(0,p.count - 1) : Math.max(p.count,count), goalAtTime:p.repGoal };
  return { ...(typeof entry === 'object' ? entry : {}), count:(isSetLog(entry) ? entry.carriedReps ?? 0 : 0) + repsForSets(count,p.repGoal,p.goal), goalAtTime:p.repGoal, completedSets:count, setsGoalAtTime:p.goal };
}

// Mutation validation only: existing stored historical goals are never normalized.
export const validWorkoutTargets = (reps: number, sets: number) => Number.isInteger(reps) && reps >= 1 && reps <= 9999 && Number.isInteger(sets) && sets >= 1 && sets <= reps;
