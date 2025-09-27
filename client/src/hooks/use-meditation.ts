import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString, getDateString } from '@/lib/date-utils';

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
          try {
            const date = new Date(log.date);
            const convertedDate = date.toLocaleDateString('en-US');
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
    
    // Calculate current day totals
    const today = getTodayString();
    const todayLogUS = Object.keys(dataToLoad.dailyLogs).find(date => {
      return new Date(date).toLocaleDateString('en-US') === new Date().toLocaleDateString('en-US');
    });
    const currentDayMinutes = todayLogUS ? dataToLoad.dailyLogs[todayLogUS].totalMinutes : 0;
    
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
      const today = new Date().toLocaleDateString('en-US');
      const todayLogKey = Object.keys(data.dailyLogs).find(date => {
        return new Date(date).toLocaleDateString('en-US') === today;
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
    const today = new Date().toLocaleDateString('en-US');
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
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
      const isToday = new Date(date).toLocaleDateString('en-US') === new Date().toLocaleDateString('en-US');
      
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
      const isToday = new Date(date).toLocaleDateString('en-US') === new Date().toLocaleDateString('en-US');
      
      return {
        ...prev,
        currentDayMinutes: isToday ? totalMinutes : prev.currentDayMinutes,
        dailyLogs: newDailyLogs
      };
    });
  };

  // Get today's total meditation minutes
  const getTodayMinutes = (): number => {
    const today = new Date().toLocaleDateString('en-US'); // MM/DD/YYYY format
    const todayLogKey = Object.keys(data.dailyLogs).find(date => {
      return new Date(date).toLocaleDateString('en-US') === today;
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
    // Get the most recent 10 daily logs regardless of date
    const recentLogs = Object.values(data.dailyLogs)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    // Sum up the durations
    const totalMinutes = recentLogs.reduce((sum, log) => sum + log.totalMinutes, 0);
    
    const dailyGoal = getDailyGoal();
    const targetGoal = dailyGoal * 10; // 10 logs worth of daily goals
    const averageMinutes = recentLogs.length > 0 ? totalMinutes / recentLogs.length : 0;
    const goalProgress = targetGoal > 0 ? Math.min((totalMinutes / targetGoal) * 100, 100) : 0;
    const remaining = Math.max(0, targetGoal - totalMinutes);
    
    return {
      totalMinutes: Math.round(totalMinutes),
      averageMinutes: Math.round(averageMinutes * 10) / 10,
      targetGoal,
      goalProgress: Math.round(goalProgress * 10) / 10, // Round to 1 decimal
      remaining: Math.round(remaining),
      logsCount: recentLogs.length
    };
  };

  // Get all-time goal percentage for goal modal
  const getAllTimeGoalPercentage = (): number => {
    const goalMinutes = getDailyGoal();
    const dailyLogsCount = Object.keys(data.dailyLogs).length;
    if (goalMinutes === 0 || dailyLogsCount === 0) return 0;
    
    // Calculate average daily minutes across all days with meditation
    const totalMinutes = Object.values(data.dailyLogs).reduce((sum, log) => sum + log.totalMinutes, 0);
    const averageMinutes = totalMinutes / dailyLogsCount;
    
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