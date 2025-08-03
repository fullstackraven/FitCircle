import { useState, useCallback } from 'react';
import { safeParseJSON } from '@/lib/storage-utils';
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
    
    // Get all workout data from the correct storage key across all time
    const workoutData = localStorage.getItem('fitcircle_workouts');
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
    
    // Count all days with actual workout activity across entire history
    let totalWorkoutDays = 0;
    Object.entries(workouts.dailyLogs || {}).forEach(([dateStr, dayLog]) => {
      const hasWorkouts = workoutArray.some((w: any) => dayLog && (dayLog as any)[w.id] && (dayLog as any)[w.id] > 0);
      if (hasWorkouts) {
        totalWorkoutDays++;
      }
    });
    
    // Total active days = workout days + recovery days
    const totalActiveDays = totalWorkoutDays + totalRecoveryDays;
    
    // Recovery percentage = recovery days / total active days
    const recoveryPercentage = totalActiveDays > 0 ? (totalRecoveryDays / totalActiveDays) * 100 : 0;
    
    return {
      totalRecoveryDays,
      totalWorkoutDays,
      totalActiveDays,
      recoveryPercentage: Math.round(recoveryPercentage * 10) / 10 // Round to 1 decimal
    };
  }, [data.recoveryDays]);

  const getTodaysRecoveryStatus = useCallback(() => {
    const today = getTodayString();
    return isRecoveryDay(today);
  }, [isRecoveryDay]);

  return {
    data,
    addRecoveryDay,
    removeRecoveryDay,
    isRecoveryDay,
    getRecoveryStats,
    getTodaysRecoveryStatus
  };
};