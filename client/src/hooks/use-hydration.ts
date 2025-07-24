import { useState, useEffect } from 'react';

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
  const [data, setData] = useState<HydrationData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const goalFromGoalsPage = localStorage.getItem('fitcircle_goal_hydration');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate liquid type if not present
        if (parsed.logs) {
          Object.values(parsed.logs).forEach((dayLog: any) => {
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
          parsed.dailyGoalOz = parseFloat(goalFromGoalsPage);
        }
        return parsed;
      } catch (error) {
        console.error('Failed to parse hydration data:', error);
      }
    }
    
    return {
      dailyGoalOz: goalFromGoalsPage ? parseFloat(goalFromGoalsPage) : 64,
      currentDayOz: 0,
      logs: {},
      lastDate: getTodayString()
    };
  });

  // Save to localStorage whenever data changes
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