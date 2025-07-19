import { useState, useEffect } from 'react';

export interface HydrationLog {
  date: string;
  totalOz: number;
  entries: { time: string; amount: number }[];
}

export interface HydrationData {
  dailyGoalOz: number;
  currentDayOz: number;
  logs: { [date: string]: HydrationLog };
  lastDate: string;
}

const STORAGE_KEY = 'fitcircle_hydration_data';

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

export function useHydration() {
  const [data, setData] = useState<HydrationData>({
    dailyGoalOz: 64, // Default 64oz goal
    currentDayOz: 0,
    logs: {},
    lastDate: getTodayString()
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const goalFromGoalsPage = localStorage.getItem('fitcircle_goal_hydration');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(prev => ({
          ...parsed,
          lastDate: parsed.lastDate || getTodayString(),
          // Sync goal from Goals page if it exists and is different
          dailyGoalOz: goalFromGoalsPage ? parseFloat(goalFromGoalsPage) : parsed.dailyGoalOz || 64
        }));
      } catch (error) {
        console.error('Failed to parse hydration data:', error);
      }
    } else if (goalFromGoalsPage) {
      // If no hydration data but goal exists, use it
      setData(prev => ({
        ...prev,
        dailyGoalOz: parseFloat(goalFromGoalsPage)
      }));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

  const addHydration = (amountOz: number) => {
    const today = getTodayString();
    const currentTime = getCurrentTime();
    
    setData(prev => {
      const newCurrentDayOz = prev.currentDayOz + amountOz;
      const todayLog = prev.logs[today] || { date: today, totalOz: 0, entries: [] };
      
      const updatedLog = {
        ...todayLog,
        totalOz: todayLog.totalOz + amountOz,
        entries: [...todayLog.entries, { time: currentTime, amount: amountOz }]
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
    
    // Also update the goals page - keep both in sync
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