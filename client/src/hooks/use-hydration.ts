import { useState, useEffect } from 'react';
import { getTodayString, getCurrentTime } from '@/lib/date-utils';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

export interface HydrationEntry {
  id: string;
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
    
    // Migrate liquid type and add IDs if not present
    if (saved.logs) {
      Object.values(saved.logs).forEach((dayLog: any) => {
        if (dayLog.entries) {
          dayLog.entries.forEach((entry: any, index: number) => {
            if (!entry.liquidType) {
              entry.liquidType = 'Water';
            }
            // Add unique ID if missing (for existing entries)
            if (!entry.id) {
              entry.id = `${dayLog.date}-${entry.time}-${index}-${Date.now()}`;
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
      
      const newEntry: HydrationEntry = {
        id: Date.now().toString(),
        time: currentTime,
        amount: amountOz,
        liquidType
      };
      
      const updatedLog = {
        ...todayLog,
        totalOz: todayLog.totalOz + amountOz,
        entries: [...todayLog.entries, newEntry]
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

  const editHydrationEntry = (entryId: string, newAmount: number, newLiquidType: string = 'Water') => {
    setData(prev => {
      const updatedLogs = { ...prev.logs };
      let totalDifference = 0;
      
      // Find and update the entry across all logs
      Object.keys(updatedLogs).forEach(date => {
        const log = updatedLogs[date];
        const entryIndex = log.entries.findIndex(entry => entry.id === entryId);
        
        if (entryIndex !== -1) {
          const oldAmount = log.entries[entryIndex].amount;
          totalDifference = newAmount - oldAmount;
          
          // Update the entry
          log.entries[entryIndex] = {
            ...log.entries[entryIndex],
            amount: newAmount,
            liquidType: newLiquidType
          };
          
          // Update the log's total
          log.totalOz += totalDifference;
        }
      });
      
      return {
        ...prev,
        currentDayOz: prev.currentDayOz + totalDifference,
        logs: updatedLogs
      };
    });
  };

  const deleteHydrationEntry = (entryId: string) => {
    setData(prev => {
      const updatedLogs = { ...prev.logs };
      let deletedAmount = 0;
      
      // Find and remove the entry across all logs
      Object.keys(updatedLogs).forEach(date => {
        const log = updatedLogs[date];
        const entryIndex = log.entries.findIndex(entry => entry.id === entryId);
        
        if (entryIndex !== -1) {
          deletedAmount = log.entries[entryIndex].amount;
          
          // Remove the entry
          log.entries.splice(entryIndex, 1);
          
          // Update the log's total
          log.totalOz -= deletedAmount;
        }
      });
      
      return {
        ...prev,
        currentDayOz: prev.currentDayOz - deletedAmount,
        logs: updatedLogs
      };
    });
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

  // Get last 10 logs hydration stats
  const getLast10LogsProgress = () => {
    // Get the most recent 10 logs regardless of date
    const recentLogs = Object.values(data.logs)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    // Sum up the total ounces
    const totalOz = recentLogs.reduce((sum, log) => sum + log.totalOz, 0);
    
    const targetGoal = data.dailyGoalOz * 10; // 10 logs worth of daily goals
    const averageOz = recentLogs.length > 0 ? totalOz / recentLogs.length : 0;
    const goalProgress = targetGoal > 0 ? Math.min((totalOz / targetGoal) * 100, 100) : 0;
    const remaining = Math.max(0, targetGoal - totalOz);
    
    return {
      totalOz: Math.round(totalOz),
      averageOz: Math.round(averageOz * 10) / 10,
      targetGoal,
      goalProgress: Math.round(goalProgress * 10) / 10, // Round to 1 decimal
      remaining: Math.round(remaining),
      logsCount: recentLogs.length
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
    editHydrationEntry,
    deleteHydrationEntry,
    setDailyGoal,
    getRecentLogs,
    getAllLogs,
    getTodayEntries,
    isGoalReached: data.currentDayOz >= data.dailyGoalOz,
    getLast10LogsProgress,
    getAllTimeGoalPercentage
  };
}