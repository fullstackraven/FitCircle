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
    let goalValue = 64;
    if (goalFromGoalsPage) {
      const parsed = parseFloat(goalFromGoalsPage);
      goalValue = isNaN(parsed) ? 64 : parsed;
    }
    const defaultData = {
      dailyGoalOz: goalValue,
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
      const parsed = parseFloat(goalFromGoalsPage);
      saved.dailyGoalOz = isNaN(parsed) ? 64 : parsed;
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

  const getAllLogs = () => {
    return Object.values(data.logs)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getTodayEntries = () => {
    const today = getTodayString();
    const todayLog = data.logs[today];
    return todayLog?.entries || [];
  };

  // Get last 7 days hydration stats
  const getLast7DaysProgress = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Last 7 days including today
    
    let totalOz = 0;
    const weeklyGoal = data.dailyGoalOz * 7; // 7 days worth of daily goals
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(sevenDaysAgo);
      checkDate.setDate(sevenDaysAgo.getDate() + i);
      const dateString = checkDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      const dayLog = data.logs[dateString];
      if (dayLog) {
        totalOz += dayLog.totalOz;
      }
    }
    
    const averageOz = totalOz / 7; // Average over 7 days (including zero days)
    const goalProgress = weeklyGoal > 0 ? Math.min((totalOz / weeklyGoal) * 100, 100) : 0;
    const remaining = Math.max(0, weeklyGoal - totalOz);
    
    return {
      totalOz: Math.round(totalOz),
      averageOz: Math.round(averageOz * 10) / 10,
      weeklyGoal,
      goalProgress: Math.round(goalProgress * 10) / 10, // Round to 1 decimal
      remaining: Math.round(remaining)
    };
  };

  // Get all-time goal percentage for goal modal
  const getAllTimeGoalPercentage = (): number => {
    const allLogs = Object.values(data.logs);
    if (allLogs.length === 0) return 0;
    
    const totalOz = allLogs.reduce((sum, log) => sum + (log.totalOz || 0), 0);
    const averageOz = totalOz / allLogs.length;
    const goalOz = data.dailyGoalOz || 64;
    
    return goalOz > 0 ? Math.min((averageOz / goalOz) * 100, 100) : 0;
  };

  return {
    dailyGoalOz: data.dailyGoalOz,
    currentDayOz: data.currentDayOz,
    progressPercentage: getProgressPercentage(),
    hasUserGoal: Boolean(localStorage.getItem('fitcircle_goal_hydration')), // Flag indicating if user has set a goal
    addHydration,
    setDailyGoal,
    getRecentLogs,
    getAllLogs,
    getTodayEntries,
    isGoalReached: data.currentDayOz >= data.dailyGoalOz,
    getLast7DaysProgress,
    getAllTimeGoalPercentage
  };
}