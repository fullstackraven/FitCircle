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
        // Meditation logs are stored as an array of log objects
        let totalMinutes = 0;
        let dayCount = 0;
        
        if (Array.isArray(logs)) {
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
          totalMinutes = dailyValues.reduce((sum, minutes) => sum + minutes, 0);
          dayCount = Math.max(7, dailyValues.length); // Always average over 7 days
        }
        
        if (dayCount > 0) {
          const avgMinutes = totalMinutes / 7; // Average over 7 days regardless of how many had sessions
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
        // The logs are stored as an array, not an object keyed by date
        if (Array.isArray(logs)) {
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
        }
        
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