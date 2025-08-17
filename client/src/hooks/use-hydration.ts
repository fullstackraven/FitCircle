import { getTodayString, getCurrentTime } from '@/lib/date-utils';
import { K } from '@/lib/keys';
import { HydrationStateSchema, type HydrationState } from '@/lib/storageSchemas';
import { useLocalStorageState } from './useLocalStorageState';
import { useEffect } from 'react';

// Export types for backward compatibility
export type { HydrationState as HydrationData };
export type { HydrationState } from '@/lib/storageSchemas';

const defaultHydrationState: HydrationState = {
  dailyGoalOz: 64,
  currentDayOz: 0,
  logs: {},
  lastDate: getTodayString(),
  lastUpdated: undefined
};

export function useHydration() {
  const [data, setData] = useLocalStorageState(
    K.hydration,
    HydrationStateSchema,
    defaultHydrationState
  );

  // Reset daily data if date has changed
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayString();
      if (data.lastDate && data.lastDate !== today) {
        setData(prev => ({
          ...prev,
          lastDate: today,
          currentDayOz: 0,
          lastUpdated: new Date().toISOString()
        }));
      }
    };

    checkDateChange();
    // Check for date change every minute
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [data.lastDate, setData]);

  const addHydration = (amountOz: number, liquidType: string = 'Water') => {
    const today = getTodayString();
    const currentTime = getCurrentTime();
    
    setData(prev => {
      const newCurrentDayOz = (prev.currentDayOz || 0) + amountOz;
      const todayLog = (prev.logs || {})[today] || { date: today, totalOz: 0, entries: [] };
      
      const updatedLog = {
        ...todayLog,
        totalOz: todayLog.totalOz + amountOz,
        entries: [...(todayLog.entries || []), { time: currentTime, amount: amountOz, liquidType }]
      };

      return {
        ...prev,
        currentDayOz: newCurrentDayOz,
        logs: {
          ...(prev.logs || {}),
          [today]: updatedLog
        },
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const setDailyGoal = (goalOz: number) => {
    setData(prev => ({ 
      ...prev, 
      dailyGoalOz: goalOz,
      lastUpdated: new Date().toISOString()
    }));
    // Sync with goals page for backward compatibility
    localStorage.setItem('fitcircle_goal_hydration', goalOz.toString());
  };

  const getProgressPercentage = () => {
    return Math.min(((data.currentDayOz || 0) / (data.dailyGoalOz || 64)) * 100, 100);
  };

  const getRecentLogs = (days: number = 7) => {
    const logs = Object.values(data.logs || {})
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);
    return logs;
  };

  const getTodayEntries = () => {
    const today = getTodayString();
    const todayLog = (data.logs || {})[today];
    return todayLog?.entries || [];
  };

  return {
    dailyGoalOz: data.dailyGoalOz || 64,
    currentDayOz: data.currentDayOz || 0,
    progressPercentage: getProgressPercentage(),
    addHydration,
    setDailyGoal,
    getRecentLogs,
    getTodayEntries,
    isGoalReached: (data.currentDayOz || 0) >= (data.dailyGoalOz || 64)
  };
}