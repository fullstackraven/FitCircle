import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

export interface Goals {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
  maxFastingHours: number;
  weightLbs: number;
  targetWeight: number;
  targetBodyFat: number;
  workoutConsistency: number;
}

export interface GoalProgress {
  hydrationProgress: number;
  meditationProgress: number;
  fastingProgress: number;
  weightProgress: number;
  targetWeightProgress: number;
  targetBodyFatProgress: number;
  workoutConsistencyProgress: number;
}

const STORAGE_PREFIX = 'fitcircle_goal_';

export function useGoals() {
  const defaultGoals = {
    hydrationOz: 64,
    meditationMinutes: 10,
    fastingHours: 16,
    maxFastingHours: 24,
    weightLbs: 150,
    targetWeight: 150,
    targetBodyFat: 15,
    workoutConsistency: 80
  };

  const [goals, setGoals] = useState<Goals>(() => {
    const saved = safeParseJSON(localStorage.getItem(STORAGE_KEYS.GOALS), null);
    
    if (saved && typeof saved === 'object' && saved !== null) {
      return { ...defaultGoals, ...(saved as Partial<Goals>) };
    }
    
    // Fallback to old format migration
    const loadedGoals: Partial<Goals> = {};
    const hydration = localStorage.getItem(`${STORAGE_PREFIX}hydration`);
    if (hydration) {
      const parsed = parseFloat(hydration);
      if (!isNaN(parsed)) loadedGoals.hydrationOz = parsed;
    }
    
    const meditation = localStorage.getItem(`${STORAGE_PREFIX}meditation`);
    if (meditation) {
      const parsed = parseFloat(meditation);
      if (!isNaN(parsed)) loadedGoals.meditationMinutes = parsed;
    }
    
    const fasting = localStorage.getItem(`${STORAGE_PREFIX}fasting`);
    if (fasting) {
      const parsed = parseFloat(fasting);
      if (!isNaN(parsed)) loadedGoals.fastingHours = parsed;
    }
    
    const weight = localStorage.getItem(`${STORAGE_PREFIX}weight`);
    if (weight) {
      const parsed = parseFloat(weight);
      if (!isNaN(parsed)) loadedGoals.weightLbs = parsed;
    }
    
    return { ...defaultGoals, ...loadedGoals };
  });

  const updateGoal = (goalType: keyof Goals, value: number) => {
    const updatedGoals = { ...goals, [goalType]: value };
    setGoals(updatedGoals);
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Failed to save goals data:', error);
    }
    
    // Keep backward compatibility with old storage format
    const keyMap: { [K in keyof Goals]?: string } = {
      hydrationOz: 'hydration',
      meditationMinutes: 'meditation',
      fastingHours: 'fasting',
      weightLbs: 'weight'
    };
    
    const oldKey = keyMap[goalType];
    if (oldKey) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${oldKey}`, value.toString());
      } catch (error) {
        console.error('Failed to save legacy goal key:', error);
      }
    }
    
    // Sync hydration goal with hydration hook
    if (goalType === 'hydrationOz') {
      const hydrationData = safeParseJSON(localStorage.getItem(STORAGE_KEYS.HYDRATION), {}) as any;
      if (hydrationData && typeof hydrationData === 'object') {
        hydrationData.dailyGoalOz = value;
        try {
          localStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify(hydrationData));
        } catch (error) {
          console.error('Failed to sync hydration goal:', error);
        }
      }
    }
  };

  const calculateProgress = useCallback((): Promise<GoalProgress> => {
    
    // Hydration progress
    let hydrationProgress = 0;
    const hydrationData = safeParseJSON(localStorage.getItem(STORAGE_KEYS.HYDRATION), {}) as any;
    if (hydrationData && typeof hydrationData === 'object') {
      const actualGoal = hydrationData.dailyGoalOz || goals.hydrationOz;
      hydrationProgress = Math.min((hydrationData.currentDayOz / actualGoal) * 100, 100);
    }

    // Meditation progress (average last 7 days)
    let meditationProgress = 0;
    const meditationLogs = safeParseJSON(localStorage.getItem('fitcircle_meditation_logs'), []);
    if (Array.isArray(meditationLogs)) {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      const dailyTotals: { [date: string]: number } = {};
      
      meditationLogs.forEach((session: any) => {
        const sessionDate = new Date(session.completedAt || session.date);
        if (sessionDate >= last7Days && session.duration) {
          const dateKey = sessionDate.toISOString().split('T')[0];
          dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.duration;
        }
      });
      
      const totalMinutes = Object.values(dailyTotals).reduce((sum, minutes) => sum + minutes, 0);
      const avgMinutes = totalMinutes / 7;
      meditationProgress = Math.min((avgMinutes / goals.meditationMinutes) * 100, 100);
    }

    // Fasting progress (all-time average)
    let fastingProgress = 0;
    const fastingLogs = safeParseJSON(localStorage.getItem('fitcircle_fasting_logs'), []);
    if (Array.isArray(fastingLogs)) {
      const completedFasts: number[] = [];
      
      fastingLogs.forEach((log: any) => {
        if (log?.endDate && log?.startDate && log?.endTime && log?.startTime) {
          const start = new Date(`${log.startDate}T${log.startTime}`);
          const end = new Date(`${log.endDate}T${log.endTime}`);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (duration > 0 && duration < 48) {
            completedFasts.push(duration);
          }
        } else if (log?.duration) {
          const durationHours = log.duration / 60;
          if (durationHours > 0 && durationHours < 48) {
            completedFasts.push(durationHours);
          }
        }
      });
      
      if (completedFasts.length > 0) {
        const averageHours = completedFasts.reduce((sum, hours) => sum + hours, 0) / completedFasts.length;
        fastingProgress = Math.min((averageHours / goals.fastingHours) * 100, 100);
      }
    }

    // Weight progress (based on current vs target)
    let weightProgress = 0;
    const currentWeightString = localStorage.getItem('fitcircle_weight');
    if (currentWeightString) {
      const current = parseFloat(currentWeightString);
      const tolerance = goals.weightLbs * 0.05;
      const difference = Math.abs(current - goals.weightLbs);
      weightProgress = Math.max(0, 100 - (difference / tolerance) * 100);
    }

    // Target weight progress (based on current vs target weight from measurements)
    let targetWeightProgress = 0;
    if (goals.targetWeight) {
      const measurementsData = safeParseJSON(localStorage.getItem('fitcircle_measurements'), {}) as any;
      const currentWeight = measurementsData.currentWeight || 0;
      if (currentWeight > 0) {
        const tolerance = goals.targetWeight * 0.05;
        const difference = Math.abs(currentWeight - goals.targetWeight);
        targetWeightProgress = Math.max(0, 100 - (difference / tolerance) * 100);
      }
    }

    // Target body fat and workout consistency calculated in Goals page
    let targetBodyFatProgress = 0;
    let workoutConsistencyProgress = 0;

    return Promise.resolve({
      hydrationProgress,
      meditationProgress,
      fastingProgress,
      weightProgress,
      targetWeightProgress,
      targetBodyFatProgress,
      workoutConsistencyProgress
    });
  }, [goals.hydrationOz, goals.meditationMinutes, goals.fastingHours, goals.weightLbs, goals.targetWeight]);

  return {
    goals,
    updateGoal,
    calculateProgress
  };
}