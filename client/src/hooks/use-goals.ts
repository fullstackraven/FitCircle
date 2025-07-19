import { useState, useEffect } from 'react';

export interface Goals {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
  weightLbs: number;
}

export interface GoalProgress {
  hydrationProgress: number;
  meditationProgress: number;
  fastingProgress: number;
  weightProgress: number;
}

const STORAGE_PREFIX = 'fitcircle_goal_';

export function useGoals() {
  const [goals, setGoals] = useState<Goals>({
    hydrationOz: 64,
    meditationMinutes: 10,
    fastingHours: 16,
    weightLbs: 150
  });

  // Load goals from localStorage on mount
  useEffect(() => {
    const loadedGoals: Partial<Goals> = {};
    
    const hydration = localStorage.getItem(`${STORAGE_PREFIX}hydration`);
    if (hydration) loadedGoals.hydrationOz = parseFloat(hydration);
    
    const meditation = localStorage.getItem(`${STORAGE_PREFIX}meditation`);
    if (meditation) loadedGoals.meditationMinutes = parseFloat(meditation);
    
    const fasting = localStorage.getItem(`${STORAGE_PREFIX}fasting`);
    if (fasting) loadedGoals.fastingHours = parseFloat(fasting);
    
    const weight = localStorage.getItem(`${STORAGE_PREFIX}weight`);
    if (weight) loadedGoals.weightLbs = parseFloat(weight);

    setGoals(prev => ({ ...prev, ...loadedGoals }));
  }, []);

  const updateGoal = (goalType: keyof Goals, value: number) => {
    setGoals(prev => ({ ...prev, [goalType]: value }));
    
    // Save to localStorage
    const keyMap = {
      hydrationOz: 'hydration',
      meditationMinutes: 'meditation',
      fastingHours: 'fasting',
      weightLbs: 'weight'
    };
    
    localStorage.setItem(`${STORAGE_PREFIX}${keyMap[goalType]}`, value.toString());
    
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

  const calculateProgress = (): GoalProgress => {
    // Get current data from other storage keys
    const today = new Date().toISOString().split('T')[0];
    
    // Hydration progress - use the goal from hydration data, not goals data
    const hydrationData = localStorage.getItem('fitcircle_hydration_data');
    let hydrationProgress = 0;
    if (hydrationData) {
      try {
        const parsed = JSON.parse(hydrationData);
        const actualGoal = parsed.dailyGoalOz || goals.hydrationOz; // Use hydration data's goal
        hydrationProgress = Math.min((parsed.currentDayOz / actualGoal) * 100, 100);
      } catch (e) {
        hydrationProgress = 0;
      }
    }

    // Meditation progress (average last 7 days)
    const meditationData = localStorage.getItem('fitcircle_meditation_logs');
    let meditationProgress = 0;
    if (meditationData) {
      try {
        const logs = JSON.parse(meditationData);
        const last7Days = Object.keys(logs)
          .sort()
          .slice(-7)
          .map(date => logs[date]?.reduce((total: number, session: any) => total + session.duration, 0) || 0);
        
        if (last7Days.length > 0) {
          const avgMinutes = last7Days.reduce((sum, minutes) => sum + minutes, 0) / last7Days.length;
          meditationProgress = Math.min((avgMinutes / goals.meditationMinutes) * 100, 100);
        }
      } catch (e) {
        meditationProgress = 0;
      }
    }

    // Fasting progress (all-time average with 24hr max scale)
    const fastingData = localStorage.getItem('fitcircle_fasting_logs');
    let fastingProgress = 0;
    if (fastingData) {
      try {
        const logs = JSON.parse(fastingData);
        const completedFasts: number[] = [];
        
        // Collect all completed fasting sessions
        Object.values(logs).forEach((log: any) => {
          if (log?.endDate && log?.startDate) {
            const duration = (new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) / (1000 * 60 * 60);
            if (duration > 0) {
              completedFasts.push(duration);
            }
          }
        });
        
        if (completedFasts.length > 0) {
          // Calculate all-time average
          const averageHours = completedFasts.reduce((sum, hours) => sum + hours, 0) / completedFasts.length;
          // Scale against 24 hours max instead of goal (0-24hr range)
          fastingProgress = Math.min((averageHours / 24) * 100, 100);
        }
      } catch (e) {
        fastingProgress = 0;
      }
    }

    // Weight progress (based on current vs target)
    const currentWeight = localStorage.getItem('fitcircle_weight');
    let weightProgress = 0;
    if (currentWeight) {
      const current = parseFloat(currentWeight);
      // For weight, we'll show 100% if within 5% of target
      const tolerance = goals.weightLbs * 0.05;
      const difference = Math.abs(current - goals.weightLbs);
      weightProgress = Math.max(0, 100 - (difference / tolerance) * 100);
    }

    return {
      hydrationProgress,
      meditationProgress,
      fastingProgress,
      weightProgress
    };
  };

  return {
    goals,
    updateGoal,
    progress: calculateProgress()
  };
}