import { useState, useCallback } from 'react';
import { safeParseJSON, STORAGE_KEYS } from '@/lib/storage-utils';
import { getTodayString } from '@/lib/date-utils';

interface RecoveryData {
  recoveryDays: string[]; // Array of date strings (YYYY-MM-DD)
}

const defaultRecoveryData: RecoveryData = {
  recoveryDays: []
};

const RECOVERY_STORAGE_KEY = 'fitcircle_recovery_data';
const WORKOUT_LOGS_STORAGE_KEY = 'workout-tracker-logs';

export const useRecovery = () => {
  const [data, setData] = useState<RecoveryData>(() => {
    const stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
    return stored ? safeParseJSON(stored, defaultRecoveryData) : defaultRecoveryData;
  });

  const saveData = useCallback((newData: RecoveryData) => {
    setData(newData);
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const addRecoveryDay = useCallback((date: string) => {
    const newData = {
      ...data,
      recoveryDays: [...data.recoveryDays, date].filter((d, i, arr) => arr.indexOf(d) === i) // Remove duplicates
    };
    saveData(newData);
  }, [data, saveData]);

  const removeRecoveryDay = useCallback((date: string) => {
    const newData = {
      ...data,
      recoveryDays: data.recoveryDays.filter(d => d !== date)
    };
    saveData(newData);
  }, [data, saveData]);

  const isRecoveryDay = useCallback((date: string) => {
    return data.recoveryDays.includes(date);
  }, [data.recoveryDays]);

  const getRecoveryStats = useCallback(() => {
    const totalRecoveryDays = data.recoveryDays.length;
    
    // Get all workout data using the same storage key as the workout hook
    const workoutData = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    const workouts = workoutData ? safeParseJSON(workoutData, { workouts: {}, dailyLogs: {} }) : { workouts: {}, dailyLogs: {} };
    const workoutArray = Object.values(workouts.workouts || {});
    
    if (workoutArray.length === 0) {
      return {
        totalRecoveryDays,
        totalWorkoutDays: 0,
        totalActiveDays: totalRecoveryDays,
        recoveryPercentage: totalRecoveryDays > 0 ? 100 : 0
      };
    }
    
    // Count only completed days (where all workout goals were met) across entire history
    let totalCompletedDays = 0;
    Object.entries(workouts.dailyLogs || {}).forEach(([dateStr, dayLog]) => {
      const workoutsWithReps = workoutArray.filter((w: any) => dayLog && (dayLog as any)[w.id] && (dayLog as any)[w.id] > 0);
      if (workoutsWithReps.length > 0) {
        let allGoalsMet = true;
        
        workoutsWithReps.forEach((workout: any) => {
          const count = (dayLog as any)[workout.id] || 0;
          if (count < workout.dailyGoal) {
            allGoalsMet = false;
          }
        });
        
        if (allGoalsMet) {
          totalCompletedDays++;
        }
      }
    });
    
    // Recovery percentage = recovery days / total completed days (matching statistics panel)
    const recoveryPercentage = totalCompletedDays > 0 ? (totalRecoveryDays / totalCompletedDays) * 100 : 0;
    
    return {
      totalRecoveryDays,
      totalWorkoutDays: totalCompletedDays, // Using completed days for consistency with stats panel
      totalActiveDays: totalCompletedDays,
      recoveryPercentage: Math.round(recoveryPercentage * 10) / 10 // Round to 1 decimal
    };
  }, [data.recoveryDays]);

  const getTodaysRecoveryStatus = useCallback(() => {
    const today = getTodayString();
    return isRecoveryDay(today);
  }, [isRecoveryDay]);

  const toggleRecoveryDay = (date: string) => {
    if (isRecoveryDay(date)) {
      removeRecoveryDay(date);
    } else {
      addRecoveryDay(date);
    }
  };

  return {
    data,
    addRecoveryDay,
    removeRecoveryDay,
    isRecoveryDay,
    toggleRecoveryDay,
    getRecoveryStats,
    getTodaysRecoveryStatus
  };
};