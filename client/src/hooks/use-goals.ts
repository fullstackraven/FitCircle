import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/keys';
import { get, set } from '@/lib/safeStorage';

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
    const stored = get(STORAGE_KEYS.goals);
    return stored ? { ...defaultGoals, ...stored } : defaultGoals;
  });

  const updateGoal = (goalType: keyof Goals, value: number) => {
    const updatedGoals = { ...goals, [goalType]: value };
    setGoals(updatedGoals);
    set(STORAGE_KEYS.goals, updatedGoals);
    
    // Sync hydration goal with hydration hook
    if (goalType === 'hydrationOz') {
      const hydrationData = get(STORAGE_KEYS.hydration) || {};
      if (hydrationData && typeof hydrationData === 'object') {
        hydrationData.dailyGoalOz = value;
        set(STORAGE_KEYS.hydration, hydrationData);
      }
    }
  };

  const calculateProgress = (): Promise<GoalProgress> => {
    
    // Hydration progress
    let hydrationProgress = 0;
    const hydrationData = get(STORAGE_KEYS.hydration) || {};
    if (hydrationData && typeof hydrationData === 'object') {
      const actualGoal = hydrationData.dailyGoalOz || goals.hydrationOz;
      hydrationProgress = Math.min((hydrationData.currentDayOz / actualGoal) * 100, 100);
    }

    // Meditation progress (average last 7 days)
    let meditationProgress = 0;
    const meditationLogs = get(STORAGE_KEYS.meditation) || [];
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
    const fastingLogs = get(STORAGE_KEYS.fasting) || [];
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
    const currentWeight = get('fitcircle_weight');
    if (currentWeight) {
      const current = typeof currentWeight === 'string' ? parseFloat(currentWeight) : currentWeight;
      const tolerance = goals.weightLbs * 0.05;
      const difference = Math.abs(current - goals.weightLbs);
      weightProgress = Math.max(0, 100 - (difference / tolerance) * 100);
    }

    // Target weight progress (based on current vs target weight from measurements)
    let targetWeightProgress = 0;
    if (goals.targetWeight) {
      const measurementsData = get('fitcircle_measurements') || {};
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
  };

  return {
    goals,
    updateGoal,
    calculateProgress
  };
}