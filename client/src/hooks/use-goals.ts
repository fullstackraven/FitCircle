import { useState, useEffect } from 'react';

export interface Goals {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
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
  const [goals, setGoals] = useState<Goals>(() => {
    const saved = localStorage.getItem('fitcircle_goals');
    const defaultGoals = {
      hydrationOz: 64,
      meditationMinutes: 10,
      fastingHours: 16,
      weightLbs: 150,
      targetWeight: 150,
      targetBodyFat: 15,
      workoutConsistency: 80
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultGoals, ...parsed };
      } catch (error) {
        console.error('Failed to parse goals:', error);
      }
    }
    
    // Fallback to old format if new format doesn't exist
    const loadedGoals: Partial<Goals> = {};
    const hydration = localStorage.getItem(`${STORAGE_PREFIX}hydration`);
    if (hydration) loadedGoals.hydrationOz = parseFloat(hydration);
    
    const meditation = localStorage.getItem(`${STORAGE_PREFIX}meditation`);
    if (meditation) loadedGoals.meditationMinutes = parseFloat(meditation);
    
    const fasting = localStorage.getItem(`${STORAGE_PREFIX}fasting`);
    if (fasting) loadedGoals.fastingHours = parseFloat(fasting);
    
    const weight = localStorage.getItem(`${STORAGE_PREFIX}weight`);
    if (weight) loadedGoals.weightLbs = parseFloat(weight);
    
    return { ...defaultGoals, ...loadedGoals };
  });

  const updateGoal = (goalType: keyof Goals, value: number) => {
    const updatedGoals = { ...goals, [goalType]: value };
    setGoals(updatedGoals);
    localStorage.setItem('fitcircle_goals', JSON.stringify(updatedGoals));
    
    // Keep backward compatibility with old storage format
    const keyMap: { [K in keyof Goals]?: string } = {
      hydrationOz: 'hydration',
      meditationMinutes: 'meditation',
      fastingHours: 'fasting',
      weightLbs: 'weight'
    };
    
    const oldKey = keyMap[goalType];
    if (oldKey) {
      localStorage.setItem(`${STORAGE_PREFIX}${oldKey}`, value.toString());
    }
    
    // Special case: Also update hydration hook data if hydration goal is changed
    if (goalType === 'hydrationOz') {
      const hydrationData = localStorage.getItem('fitcircle_hydration_data');
      if (hydrationData) {
        try {
          const parsed = JSON.parse(hydrationData);
          parsed.dailyGoalOz = value;
          localStorage.setItem('fitcircle_hydration_data', JSON.stringify(parsed));
        } catch (e) {
          console.error('Failed to sync hydration goal:', e);
        }
      }
    }
  };

  const calculateProgress = async (): Promise<GoalProgress> => {
    // Get current data from other storage keys
    const today = new Date().toISOString().split('T')[0];
    
    // Hydration progress - use the goal from hydration data, not goals data
    let hydrationProgress = 0;
    if (isReady) {
      try {
        const hydrationData = await getItem<any>('fitcircle_hydration_data');
        if (hydrationData) {
          const actualGoal = hydrationData.dailyGoalOz || goals.hydrationOz; // Use hydration data's goal
          hydrationProgress = Math.min((hydrationData.currentDayOz / actualGoal) * 100, 100);
        }
      } catch (e) {
        hydrationProgress = 0;
      }
    }

    // Meditation progress (average last 7 days)
    let meditationProgress = 0;
    if (isReady) {
      try {
        const logs = await getItem<any[]>('fitcircle_meditation_logs');
        if (logs && Array.isArray(logs)) {
          // Group sessions by date and calculate daily totals for last 7 days
          const last7Days = new Date();
          last7Days.setDate(last7Days.getDate() - 7);
          
          const dailyTotals: { [date: string]: number } = {};
          
          logs.forEach((session: any) => {
            const sessionDate = new Date(session.completedAt || session.date);
            if (sessionDate >= last7Days && session.duration) {
              const dateKey = sessionDate.toISOString().split('T')[0];
              dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.duration;
            }
          });
          
          // Calculate average across all days (including zero days)
          const dailyValues = Object.values(dailyTotals);
          const totalMinutes = dailyValues.reduce((sum, minutes) => sum + minutes, 0);
          
          const avgMinutes = totalMinutes / 7; // Average over 7 days regardless of how many had sessions
          meditationProgress = Math.min((avgMinutes / goals.meditationMinutes) * 100, 100);
        }
      } catch (e) {
        meditationProgress = 0;
      }
    }

    // Fasting progress (all-time average with 24hr max scale)
    let fastingProgress = 0;
    if (isReady) {
      try {
        const logs = await getItem<any[]>('fitcircle_fasting_logs');
        if (logs && Array.isArray(logs)) {
          const completedFasts: number[] = [];
          
          logs.forEach((log: any) => {
            if (log?.endDate && log?.startDate && log?.endTime && log?.startTime) {
              // Combine date and time for proper parsing
              const start = new Date(`${log.startDate}T${log.startTime}`);
              const end = new Date(`${log.endDate}T${log.endTime}`);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              if (duration > 0 && duration < 48) { // Sanity check: ignore sessions longer than 48 hours
                completedFasts.push(duration);
              }
            } else if (log?.duration) {
              // Fallback: use duration field if available (stored in minutes)
              const durationHours = log.duration / 60;
              if (durationHours > 0 && durationHours < 48) {
                completedFasts.push(durationHours);
              }
            }
          });
          
          if (completedFasts.length > 0) {
            // Calculate all-time average
            const averageHours = completedFasts.reduce((sum, hours) => sum + hours, 0) / completedFasts.length;
            // Scale against the fasting goal
            fastingProgress = Math.min((averageHours / goals.fastingHours) * 100, 100);
          }
        }
      } catch (e) {
        fastingProgress = 0;
      }
    }

    // Weight progress (based on current vs target)
    let weightProgress = 0;
    if (isReady) {
      try {
        const currentWeight = await getItem<string>('fitcircle_weight');
        if (currentWeight) {
          const current = parseFloat(currentWeight);
          // For weight, we'll show 100% if within 5% of target
          const tolerance = goals.weightLbs * 0.05;
          const difference = Math.abs(current - goals.weightLbs);
          weightProgress = Math.max(0, 100 - (difference / tolerance) * 100);
        }
      } catch (e) {
        weightProgress = 0;
      }
    }

    // Target weight progress (based on current vs target weight from measurements)
    let targetWeightProgress = 0;
    if (isReady && goals.targetWeight) {
      try {
        const measurementsData = await getItem<any>('fitcircle_measurements');
        if (measurementsData) {
          const currentWeight = measurementsData.currentWeight || 0;
          if (currentWeight > 0) {
            // Calculate progress - closer to target = higher percentage
            const tolerance = goals.targetWeight * 0.05; // 5% tolerance
            const difference = Math.abs(currentWeight - goals.targetWeight);
            targetWeightProgress = Math.max(0, 100 - (difference / tolerance) * 100);
          }
        }
      } catch (e) {
        targetWeightProgress = 0;
      }
    }

    // Target body fat progress (calculated in Goals page component)
    let targetBodyFatProgress = 0;
    // This is calculated directly in the Goals page component using measurements hook

    // Workout consistency progress (calculated in Goals page component)
    let workoutConsistencyProgress = 0;
    // This is calculated directly in the Goals page component using workouts hook

    return {
      hydrationProgress,
      meditationProgress,
      fastingProgress,
      weightProgress,
      targetWeightProgress,
      targetBodyFatProgress,
      workoutConsistencyProgress
    };
  };

  return {
    goals,
    updateGoal,
    calculateProgress
  };
}