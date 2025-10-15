import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString, getDateString, getCurrentTime, getAllTimeMeditationAverage } from '@/lib/date-utils';

export interface MeditationSession {
  id: string;
  time: string;
  duration: number; // in minutes
  completedAt: string;
}

export interface MeditationDailyLog {
  date: string;
  totalMinutes: number;
  sessions: MeditationSession[];
}

// Legacy interface for migration
export interface MeditationLog {
  id: string;
  date: string;
  time: string;
  duration: number; // in minutes
  completedAt: string;
}

interface MeditationData {
  dailyLogs: { [date: string]: MeditationDailyLog };
  lastDate: string;
  currentDayMinutes: number;
  // Legacy field for migration
  logs?: MeditationLog[];
}

const defaultData: MeditationData = {
  dailyLogs: {},
  lastDate: getTodayString(),
  currentDayMinutes: 0
};

export function useMeditation() {
  const migrationCompleted = useRef(false);
  
  const [data, setData] = useState<MeditationData>(() => {
    let dataToLoad = defaultData;
    let legacyLogs: MeditationLog[] = [];
    // Try to load from storage
    const storedData = localStorage.getItem(STORAGE_KEYS.MEDITATION);
    if (storedData) {
      const parsed = safeParseJSON(storedData, []);
      // Check if this is new format (has dailyLogs) or legacy format (array of logs)
      if (Array.isArray(parsed)) {
        legacyLogs = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const parsedObj = parsed as any;
        if (parsedObj.dailyLogs && !parsedObj.logs) {
          // New format, use as is
          dataToLoad = parsedObj;
        } else if (parsedObj.logs || Array.isArray(parsedObj.logs)) {
          // Legacy format stored in object
          legacyLogs = parsedObj.logs || [];
          dataToLoad = { ...defaultData, ...parsedObj };
        }
      }
    }
    
    // Migration: Convert legacy logs to daily aggregation if needed
    if (legacyLogs.length > 0) {
      console.log('Migrating', legacyLogs.length, 'meditation logs to daily aggregation format');
      
      // First handle date format migration if needed
      const migratedLogs = legacyLogs.map((log: MeditationLog) => {
        if (log.date && log.date.includes('-')) {
          // Keep YYYY-MM-DD format for consistency
          return log;
        } else if (log.date && log.date.includes('/')) {
          // Convert MM/DD/YYYY to YYYY-MM-DD format
          try {
            const [month, day, year] = log.date.split('/').map(Number);
            const convertedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { ...log, date: convertedDate };
          } catch (error) {
            console.error('Failed to convert meditation date:', log.date, error);
            return log;
          }
        }
        return log;
      });
      
      // Group by date and create daily logs
      const dailyLogs: { [date: string]: MeditationDailyLog } = {};
      
      migratedLogs.forEach(log => {
        const dateKey = log.date;
        if (!dailyLogs[dateKey]) {
          dailyLogs[dateKey] = {
            date: dateKey,
            totalMinutes: 0,
            sessions: []
          };
        }
        
        const session: MeditationSession = {
          id: log.id,
          time: log.time,
          duration: log.duration,
          completedAt: log.completedAt
        };
        
        dailyLogs[dateKey].sessions.push(session);
        dailyLogs[dateKey].totalMinutes += log.duration;
      });
      
      dataToLoad.dailyLogs = dailyLogs;
      console.log('Migration completed:', Object.keys(dailyLogs).length, 'daily logs created');
    }
    
    // Fix any existing dates that are in MM/DD/YYYY format and convert to YYYY-MM-DD
    const fixedDailyLogs: { [date: string]: MeditationDailyLog } = {};
    Object.entries(dataToLoad.dailyLogs).forEach(([dateKey, log]) => {
      let fixedDateKey = dateKey;
      if (dateKey.includes('/')) {
        // Convert MM/DD/YYYY to YYYY-MM-DD format
        try {
          const [month, day, year] = dateKey.split('/').map(Number);
          fixedDateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        } catch (error) {
          console.error('Failed to convert existing meditation date:', dateKey, error);
        }
      }
      fixedDailyLogs[fixedDateKey] = { ...log, date: fixedDateKey };
    });
    dataToLoad.dailyLogs = fixedDailyLogs;

    // Calculate current day totals
    const today = getTodayString();
    const todayLogKey = Object.keys(dataToLoad.dailyLogs).find(date => {
      return date === today; // Direct comparison with YYYY-MM-DD format
    });
    const currentDayMinutes = todayLogKey ? dataToLoad.dailyLogs[todayLogKey].totalMinutes : 0;
    
    return { ...dataToLoad, lastDate: today, currentDayMinutes };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDITATION, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save meditation data:', error);
    }
  }, [data]);

  // Reset daily data if date has changed
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayString(); // Use Eastern Time
      const todayLogKey = Object.keys(data.dailyLogs).find(date => {
        // Convert stored date to Eastern Time format for comparison
        return date === today;
      });
      const currentMinutes = todayLogKey ? data.dailyLogs[todayLogKey].totalMinutes : 0;
      
      if (data.lastDate && data.lastDate !== getTodayString()) {
        setData(prev => ({
          ...prev,
          lastDate: getTodayString(),
          currentDayMinutes: currentMinutes
        }));
      }
    };

    checkDateChange();
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [data.lastDate, data.dailyLogs]);

  // Removed redundant migration effect - now handled in useState initializer

  const addSession = (duration: number) => {
    const today = getTodayString(); // Use local time YYYY-MM-DD format
    const currentTime = getCurrentTime(); // Use local time 12-hour format with AM/PM
    
    const newSession: MeditationSession = {
      id: Date.now().toString(),
      time: currentTime,
      duration,
      completedAt: new Date().toISOString()
    };

    setData(prev => {
      const todayLog = prev.dailyLogs[today] || { date: today, totalMinutes: 0, sessions: [] };
      
      const updatedLog = {
        ...todayLog,
        totalMinutes: todayLog.totalMinutes + duration,
        sessions: [...todayLog.sessions, newSession]
      };

      return {
        ...prev,
        currentDayMinutes: prev.currentDayMinutes + duration,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: updatedLog
        }
      };
    });
  };

  const updateSession = (date: string, id: string, updates: Partial<MeditationSession>) => {
    setData(prev => {
      const dayLog = prev.dailyLogs[date];
      if (!dayLog) return prev;
      
      const oldSession = dayLog.sessions.find(s => s.id === id);
      if (!oldSession) return prev;
      
      const updatedSessions = dayLog.sessions.map(session => 
        session.id === id ? { ...session, ...updates } : session
      );
      
      // Recalculate total minutes
      const totalMinutes = updatedSessions.reduce((sum, session) => sum + session.duration, 0);
      
      const updatedLog = {
        ...dayLog,
        totalMinutes,
        sessions: updatedSessions
      };
      
      // Update current day minutes if it's today
      const isToday = date === getTodayString(); // Use Eastern Time comparison
      
      return {
        ...prev,
        currentDayMinutes: isToday ? totalMinutes : prev.currentDayMinutes,
        dailyLogs: {
          ...prev.dailyLogs,
          [date]: updatedLog
        }
      };
    });
  };

  const deleteSession = (date: string, id: string) => {
    setData(prev => {
      const dayLog = prev.dailyLogs[date];
      if (!dayLog) return prev;
      
      const sessionToDelete = dayLog.sessions.find(s => s.id === id);
      if (!sessionToDelete) return prev;
      
      const updatedSessions = dayLog.sessions.filter(session => session.id !== id);
      
      // Recalculate total minutes
      const totalMinutes = updatedSessions.reduce((sum, session) => sum + session.duration, 0);
      
      const updatedLog = {
        ...dayLog,
        totalMinutes,
        sessions: updatedSessions
      };
      
      // Remove the log entirely if no sessions remain
      const newDailyLogs = { ...prev.dailyLogs };
      if (updatedSessions.length === 0) {
        delete newDailyLogs[date];
      } else {
        newDailyLogs[date] = updatedLog;
      }
      
      // Update current day minutes if it's today
      const isToday = date === getTodayString(); // Use Eastern Time comparison
      
      return {
        ...prev,
        currentDayMinutes: isToday ? totalMinutes : prev.currentDayMinutes,
        dailyLogs: newDailyLogs
      };
    });
  };

  // Get today's total meditation minutes
  const getTodayMinutes = (): number => {
    const today = getTodayString(); // Use Eastern Time YYYY-MM-DD format
    const todayLogKey = Object.keys(data.dailyLogs).find(date => {
      return date === today; // Direct comparison with Eastern Time date
    });
    
    return todayLogKey ? data.dailyLogs[todayLogKey].totalMinutes : 0;
  };

  // Get daily goal from localStorage (shared with Goals page)
  const getDailyGoal = (): number => {
    const goalFromGoalsPage = localStorage.getItem('fitcircle_goal_meditation');
    return goalFromGoalsPage ? parseFloat(goalFromGoalsPage) : 20; // Default 20 minutes
  };

  // Get progress percentage
  const getProgressPercentage = (): number => {
    const todayMinutes = getTodayMinutes();
    const dailyGoal = getDailyGoal();
    if (dailyGoal === 0) return 0;
    return Math.min((todayMinutes / dailyGoal) * 100, 100);
  };

  // Check if goal is reached
  const isGoalReached = (): boolean => {
    return getTodayMinutes() >= getDailyGoal();
  };

  // Get last 10 daily logs meditation stats
  const getLast10LogsProgress = () => {
    // Get the last 10 calendar days (today and previous 9 days)
    const last10Days: string[] = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last10Days.push(getDateString(date));
    }
    
    // For each of the last 10 days, get the meditation minutes (or 0 if no log)
    const dailyMinutes = last10Days.map(dateKey => {
      const log = data.dailyLogs[dateKey];
      return log ? log.totalMinutes : 0;
    });
    
    // Sum up the durations
    const totalMinutes = dailyMinutes.reduce((sum, minutes) => sum + minutes, 0);
    
    const dailyGoal = getDailyGoal();
    const targetGoal = dailyGoal * 10; // 10 days worth of daily goals
    const averageMinutes = totalMinutes / 10; // Always divide by 10 days
    const goalProgress = targetGoal > 0 ? Math.min((totalMinutes / targetGoal) * 100, 100) : 0;
    const remaining = Math.max(0, targetGoal - totalMinutes);
    
    // Count how many days actually have logs
    const logsCount = dailyMinutes.filter(minutes => minutes > 0).length;
    
    return {
      totalMinutes: Math.round(totalMinutes),
      averageMinutes: Math.round(averageMinutes * 10) / 10,
      targetGoal,
      goalProgress: Math.round(goalProgress * 10) / 10, // Round to 1 decimal
      remaining: Math.round(remaining),
      logsCount // Number of days with actual logs (for display purposes)
    };
  };

  // Get all-time goal percentage for goal modal
  const getAllTimeGoalPercentage = (): number => {
    const goalMinutes = getDailyGoal();
    if (goalMinutes === 0) return 0;
    
    // Convert dailyLogs to array format for the utility function
    const allSessions = Object.values(data.dailyLogs).flatMap(log => 
      log.sessions.map(session => ({
        date: log.date,
        duration: session.duration
      }))
    );
    
    if (allSessions.length === 0) return 0;
    
    // Use the utility function that properly factors in missed days as zeros
    const { averageMinutes } = getAllTimeMeditationAverage(allSessions);
    
    return Math.min((averageMinutes / goalMinutes) * 100, 100);
  };

  // Legacy compatibility: get all sessions as flat array for UI compatibility
  const getAllSessions = () => {
    return Object.values(data.dailyLogs).flatMap(dayLog => 
      dayLog.sessions.map(session => ({
        ...session,
        date: dayLog.date
      }))
    );
  };

  return {
    logs: getAllSessions(), // For backward compatibility
    dailyLogs: data.dailyLogs,
    hasUserGoal: Boolean(localStorage.getItem('fitcircle_goal_meditation')), // Flag indicating if user has set a goal
    addLog: addSession, // Legacy alias
    addSession,
    updateSession,
    deleteSession,
    getTodayMinutes,
    getDailyGoal,
    getProgressPercentage,
    isGoalReached,
    getLast10LogsProgress,
    getAllTimeGoalPercentage
  };
}