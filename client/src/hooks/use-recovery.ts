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
    
    // Get total workout days from localStorage
    const workoutLogs = localStorage.getItem(WORKOUT_LOGS_STORAGE_KEY);
    const logs = workoutLogs ? safeParseJSON(workoutLogs, {}) : {};
    
    // Count all days that have workout logs
    const totalWorkoutDays = Object.keys(logs).length;
    
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