// Unified Goals Management System
// This eliminates redundant goal-handling code across all pages
import { STORAGE_KEYS, safeParseJSON } from './storage-utils';
import { getTodayString, getAllTimeFastingAverage } from './date-utils';

export interface UnifiedGoals {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
  maxFastingHours: number;
  targetWeight: number;
  targetBodyFat: number;
  workoutConsistency: number;
  cardioWeeklyMiles?: number;
  cardioWeeklyMinutes?: number;
}

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
  unit: string;
}

const DEFAULT_GOALS: UnifiedGoals = {
  hydrationOz: 64,
  meditationMinutes: 10,
  fastingHours: 16,
  maxFastingHours: 24,
  targetWeight: 150,
  targetBodyFat: 15,
  workoutConsistency: 100,
  cardioWeeklyMiles: 10,
  cardioWeeklyMinutes: 150
};

/**
 * Master function to get all goals from unified storage
 * Migrates from old individual goal storage keys automatically
 */
export function getAllGoals(): UnifiedGoals {
  // Try new unified storage first
  const unifiedGoals = safeParseJSON(localStorage.getItem(STORAGE_KEYS.GOALS), null);
  if (unifiedGoals && typeof unifiedGoals === 'object' && unifiedGoals !== null) {
    return { ...DEFAULT_GOALS, ...(unifiedGoals as UnifiedGoals) };
  }

  // Migrate from old individual storage keys
  const migratedGoals: Partial<UnifiedGoals> = {};
  
  const hydration = localStorage.getItem('fitcircle_goal_hydration');
  if (hydration) migratedGoals.hydrationOz = parseFloat(hydration);
  
  const meditation = localStorage.getItem('fitcircle_goal_meditation');
  if (meditation) migratedGoals.meditationMinutes = parseFloat(meditation);
  
  const fasting = localStorage.getItem('fitcircle_goal_fasting');
  if (fasting) migratedGoals.fastingHours = parseFloat(fasting);
  
  const weight = localStorage.getItem('fitcircle_goal_weight');
  if (weight) migratedGoals.targetWeight = parseFloat(weight);
  
  const bodyFat = localStorage.getItem('fitcircle_goal_bodyfat');
  if (bodyFat) migratedGoals.targetBodyFat = parseFloat(bodyFat);

  // Check measurements for weight/body fat goals
  const measurements = safeParseJSON(localStorage.getItem('fitcircle_measurements'), {});
  if (measurements && typeof measurements === 'object' && measurements !== null) {
    if ((measurements as any).targetWeight) migratedGoals.targetWeight = (measurements as any).targetWeight;
    if ((measurements as any).targetBodyFat) migratedGoals.targetBodyFat = (measurements as any).targetBodyFat;
  }

  const finalGoals = { ...DEFAULT_GOALS, ...migratedGoals };
  
  // Save to unified storage for future use
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(finalGoals));
  
  return finalGoals;
}

/**
 * Master function to update any goal and sync across all storage locations
 */
export function updateGoal(goalType: keyof UnifiedGoals, value: number): void {
  const currentGoals = getAllGoals();
  const updatedGoals = { ...currentGoals, [goalType]: value };
  
  // Save to unified storage
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));
  
  // Keep backward compatibility with old individual keys for existing hooks
  const legacyKeyMap: Partial<Record<keyof UnifiedGoals, string>> = {
    hydrationOz: 'fitcircle_goal_hydration',
    meditationMinutes: 'fitcircle_goal_meditation',
    fastingHours: 'fitcircle_goal_fasting',
    targetWeight: 'fitcircle_goal_weight',
    targetBodyFat: 'fitcircle_goal_bodyfat'
  };
  
  const legacyKey = legacyKeyMap[goalType];
  if (legacyKey) {
    localStorage.setItem(legacyKey, value.toString());
  }
  
  // Sync hydration goal with hydration hook data
  if (goalType === 'hydrationOz') {
    const hydrationData = safeParseJSON(localStorage.getItem(STORAGE_KEYS.HYDRATION), {});
    if (hydrationData && typeof hydrationData === 'object' && hydrationData !== null) {
      (hydrationData as any).dailyGoalOz = value;
      localStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify(hydrationData));
    }
  }
  
  // Sync weight/body fat goals with measurements
  if (goalType === 'targetWeight' || goalType === 'targetBodyFat') {
    const measurements = safeParseJSON(localStorage.getItem('fitcircle_measurements'), {});
    if (measurements && typeof measurements === 'object' && measurements !== null) {
      if (goalType === 'targetWeight') (measurements as any).targetWeight = value;
      if (goalType === 'targetBodyFat') (measurements as any).targetBodyFat = value;
      localStorage.setItem('fitcircle_measurements', JSON.stringify(measurements));
    }
  }
  
  // Trigger storage event for cross-page synchronization
  window.dispatchEvent(new StorageEvent('storage', {
    key: legacyKey || STORAGE_KEYS.GOALS,
    newValue: value.toString(),
    storageArea: localStorage
  }));
}

/**
 * Get hydration progress using master date utilities
 */
export function getHydrationProgress(): GoalProgress {
  const goals = getAllGoals();
  const hydrationData = safeParseJSON(localStorage.getItem(STORAGE_KEYS.HYDRATION), {}) as any;
  
  const current = hydrationData?.currentDayOz || 0;
  const target = hydrationData?.dailyGoalOz || goals.hydrationOz;
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  return { current, target, percentage, unit: 'oz' };
}

/**
 * Get meditation progress (7-day average) using master date utilities
 */
export function getMeditationProgress(): GoalProgress {
  const goals = getAllGoals();
  const logs = safeParseJSON(localStorage.getItem('fitcircle_meditation_logs'), []);
  
  let current = 0;
  if (Array.isArray(logs)) {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const dailyTotals: { [date: string]: number } = {};
    
    logs.forEach((session: any) => {
      const dateValue = session.completedAt || session.date;
      if (dateValue) {
        const sessionDate = new Date(dateValue);
        if (sessionDate >= last7Days && session.duration) {
          const dateKey = sessionDate.toISOString().split('T')[0];
          dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.duration;
        }
      }
    });
    
    const totalMinutes = Object.values(dailyTotals).reduce((sum, minutes) => sum + minutes, 0);
    current = totalMinutes / 7; // 7-day average
  }
  
  const target = goals.meditationMinutes;
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  return { current: Math.round(current), target, percentage, unit: 'min' };
}

/**
 * Get fasting progress (all-time average) using master date utilities
 */
export function getFastingProgress(): GoalProgress {
  const goals = getAllGoals();
  const logs = safeParseJSON(localStorage.getItem('fitcircle_fasting_logs'), []);
  
  // Use centralized calculation that includes days with no fasting as "0"
  const { averageHours } = getAllTimeFastingAverage(logs);
  
  const target = goals.fastingHours;
  const percentage = target > 0 ? Math.min((averageHours / target) * 100, 100) : 0;
  
  return { current: Math.round(averageHours * 10) / 10, target, percentage, unit: 'hrs' };
}

/**
 * Get weight progress using master date utilities
 */
export function getWeightProgress(): GoalProgress {
  const goals = getAllGoals();
  const measurements = safeParseJSON(localStorage.getItem('fitcircle_measurements'), {}) as any;
  
  const current = measurements?.currentWeight || 0;
  const target = goals.targetWeight;
  
  let percentage = 0;
  if (current > 0 && target > 0) {
    const tolerance = target * 0.05; // 5% tolerance
    const difference = Math.abs(current - target);
    percentage = Math.max(0, 100 - (difference / tolerance) * 100);
  }
  
  return { current, target, percentage, unit: 'lbs' };
}

/**
 * Get body fat progress using master date utilities
 */
export function getBodyFatProgress(): GoalProgress {
  const goals = getAllGoals();
  const measurements = safeParseJSON(localStorage.getItem('fitcircle_measurements'), {}) as any;
  
  const current = measurements?.currentBodyFat || 0;
  const target = goals.targetBodyFat;
  
  let percentage = 0;
  if (current > 0 && target > 0) {
    const tolerance = target * 0.1; // 10% tolerance for body fat
    const difference = Math.abs(current - target);
    percentage = Math.max(0, 100 - (difference / tolerance) * 100);
  }
  
  return { current, target, percentage, unit: '%' };
}

/**
 * Get workout consistency progress using master date utilities
 */
export function getWorkoutConsistencyProgress(): GoalProgress {
  const goals = getAllGoals();
  const workouts = safeParseJSON(localStorage.getItem(STORAGE_KEYS.WORKOUTS), { workouts: [] });
  const recovery = safeParseJSON(localStorage.getItem(STORAGE_KEYS.RECOVERY), { recoveryDays: [] });
  
  let current = 0;
  if (workouts?.workouts && Array.isArray(workouts.workouts)) {
    const logs = safeParseJSON(localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS), {});
    const today = getTodayString();
    
    // Calculate last 30 days consistency
    const last30Days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push(dateStr);
    }
    
    let workoutDays = 0;
    let recoveryDays = 0;
    
    last30Days.forEach(date => {
      // Check if any workout was logged this day
      const hasWorkout = workouts.workouts.some((workout: any) => {
        const workoutLogs = (logs as any)[workout.id];
        return workoutLogs && workoutLogs[date] && workoutLogs[date] > 0;
      });
      
      // Check if it was a recovery day
      const isRecoveryDay = recovery?.recoveryDays?.includes(date);
      
      if (hasWorkout || isRecoveryDay) {
        if (hasWorkout) workoutDays++;
        if (isRecoveryDay) recoveryDays++;
      }
    });
    
    current = Math.round(((workoutDays + recoveryDays) / 30) * 100);
  }
  
  const target = goals.workoutConsistency;
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  return { current, target, percentage, unit: '%' };
}

/**
 * Get cardio progress using master date utilities (weekly goals)
 */
export function getCardioProgress(): { miles: GoalProgress; minutes: GoalProgress } {
  const goals = getAllGoals();
  const cardioData = safeParseJSON(localStorage.getItem(STORAGE_KEYS.CARDIO), { exercises: [], logs: {} });
  
  let weeklyMiles = 0;
  let weeklyMinutes = 0;
  
  if (cardioData?.logs) {
    // Get this week's data (Sunday to Saturday)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
    
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    Object.values(cardioData.logs).forEach((exerciseLogs: any) => {
      if (exerciseLogs && typeof exerciseLogs === 'object') {
        const dates: string[] = weekDates;
        dates.forEach(date => {
          const dayLogs = exerciseLogs[date];
          if (Array.isArray(dayLogs)) {
            dayLogs.forEach((log: any) => {
              if (log.distance) weeklyMiles += parseFloat(log.distance) || 0;
              if (log.duration) weeklyMinutes += parseFloat(log.duration) || 0;
            });
          }
        });
      }
    });
  }
  
  const milesTarget = goals.cardioWeeklyMiles || 10;
  const minutesTarget = goals.cardioWeeklyMinutes || 150;
  
  return {
    miles: {
      current: Math.round(weeklyMiles * 10) / 10,
      target: milesTarget,
      percentage: milesTarget > 0 ? Math.min((weeklyMiles / milesTarget) * 100, 100) : 0,
      unit: 'mi'
    },
    minutes: {
      current: Math.round(weeklyMinutes),
      target: minutesTarget,
      percentage: minutesTarget > 0 ? Math.min((weeklyMinutes / minutesTarget) * 100, 100) : 0,
      unit: 'min'
    }
  };
}

/**
 * Calculate overall wellness score from all goals
 */
export function calculateWellnessScore(): number {
  const hydration = getHydrationProgress();
  const meditation = getMeditationProgress();
  const fasting = getFastingProgress();
  const weight = getWeightProgress();
  const bodyFat = getBodyFatProgress();
  const consistency = getWorkoutConsistencyProgress();
  const cardio = getCardioProgress();
  
  const scores = [
    hydration.percentage * 0.2,      // 20% weight
    meditation.percentage * 0.15,    // 15% weight
    fasting.percentage * 0.15,       // 15% weight
    weight.percentage * 0.15,        // 15% weight
    bodyFat.percentage * 0.1,        // 10% weight
    consistency.percentage * 0.15,   // 15% weight
    cardio.minutes.percentage * 0.1  // 10% weight
  ];
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0));
}