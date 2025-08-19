import { useState, useEffect } from 'react';
import { getTodayString, getCurrentTime } from '@/lib/date-utils';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

export interface HydrationEntry {
  time: string;
  amount: number;
  liquidType: string;
}

export interface HydrationLog {
  date: string;
  totalOz: number;
  entries: HydrationEntry[];
}

export interface HydrationData {
  dailyGoalOz: number;
  currentDayOz: number;
  logs: { [date: string]: HydrationLog };
  lastDate: string;
}

export function useHydration() {
  const [data, setData] = useState<HydrationData>(() => {
    const goalFromGoalsPage = localStorage.getItem('fitcircle_goal_hydration');
    const defaultData = {
      dailyGoalOz: goalFromGoalsPage ? parseFloat(goalFromGoalsPage) : 64,
      currentDayOz: 0,
      logs: {},
      lastDate: getTodayString()
    };
    
    const saved = safeParseJSON(localStorage.getItem(STORAGE_KEYS.HYDRATION), defaultData);
    
    // Migrate liquid type if not present
    if (saved.logs) {
      Object.values(saved.logs).forEach((dayLog: any) => {
        if (dayLog.entries) {
          dayLog.entries.forEach((entry: any) => {
            if (!entry.liquidType) {
              entry.liquidType = 'Water';
            }
          });
        }
      });
    }
    
    // Sync goal from Goals page if it exists and is different
    if (goalFromGoalsPage) {
      saved.dailyGoalOz = parseFloat(goalFromGoalsPage);
    }
    
    return saved;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save hydration data:', error);
    }
  }, [data]);

  // Reset daily data if date has changed
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayString();
      if (data.lastDate && data.lastDate !== today) {
        setData(prev => ({
          ...prev,
          lastDate: today,
          currentDayOz: 0
        }));
      }
    };

    checkDateChange();
    // Check for date change every minute
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [data.lastDate]);

  const addHydration = (amountOz: number, liquidType: string = 'Water') => {
    const today = getTodayString();
    const currentTime = getCurrentTime();
    
    setData(prev => {
      const newCurrentDayOz = prev.currentDayOz + amountOz;
      const todayLog = prev.logs[today] || { date: today, totalOz: 0, entries: [] };
      
      const updatedLog = {
        ...todayLog,
        totalOz: todayLog.totalOz + amountOz,
        entries: [...todayLog.entries, { time: currentTime, amount: amountOz, liquidType }]
      };

      return {
        ...prev,
        currentDayOz: newCurrentDayOz,
        logs: {
          ...prev.logs,
          [today]: updatedLog
        }
      };
    });
  };

  const setDailyGoal = (goalOz: number) => {
    setData(prev => ({ ...prev, dailyGoalOz: goalOz }));
    // Sync with goals page
    localStorage.setItem('fitcircle_goal_hydration', goalOz.toString());
  };

  const getProgressPercentage = () => {
    return Math.min((data.currentDayOz / data.dailyGoalOz) * 100, 100);
  };

  const getRecentLogs = (days: number = 7) => {
    const logs = Object.values(data.logs)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);
    return logs;
  };

  const getTodayEntries = () => {
    const today = getTodayString();
    const todayLog = data.logs[today];
    return todayLog?.entries || [];
  };

  return {
    dailyGoalOz: data.dailyGoalOz,
    currentDayOz: data.currentDayOz,
    progressPercentage: getProgressPercentage(),
    addHydration,
    setDailyGoal,
    getRecentLogs,
    getTodayEntries,
    isGoalReached: data.currentDayOz >= data.dailyGoalOz
  };
}