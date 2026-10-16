import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/storage-utils';
import { loadStoredCardio, StoredCardioDataError } from '@/lib/cardio-initialization';
import { getTodayString, getAllTimeCardioAverage, getCurrentTime } from '@/lib/date-utils';

export interface CardioSession {
  id: string;
  time: string;
  type: string;
  duration: number; // in minutes
  distance?: number; // in miles (optional)
  notes?: string;
}

export interface CardioDailyLog {
  date: string;
  totalDuration: number;
  totalDistance: number;
  sessions: CardioSession[];
}

// Legacy interface for migration
export interface CardioEntry {
  id: string;
  date: string;
  type: string;
  duration: number; // in minutes
  distance?: number; // in miles (optional)
  notes?: string;
  timestamp: number;
}

export interface CardioGoal {
  type: 'distance' | 'duration';
  target: number; // miles per day or minutes per day
  period: 'day' | 'week'; // Support both for backward compatibility
}

export interface CardioData {
  dailyLogs: { [date: string]: CardioDailyLog };
  goal: CardioGoal;
  goalUserSet: boolean; // Track if user has explicitly set a goal
  customTypes: string[];
  lastDate: string;
  currentDayDuration: number;
  currentDayDistance: number;
  // Legacy field for migration
  entries?: CardioEntry[];
}

const defaultCardioTypes = [
  'cycling',
  'swimming', 
  'rucking',
  'walking',
  'running',
  'HIIT',
  'rowing',
  'treadmill'
];

export function useCardio() {
  const [initial] = useState(() => {
    let storage: Storage;
    try { storage = localStorage; }
    catch { throw new StoredCardioDataError({}, 'unavailable'); }
    return loadStoredCardio(storage, getTodayString());
  });
  const [data, setData] = useState<CardioData>(initial.data);

  // Only explicit changes (or a later date rollover) can persist. Neither
  // initialization, migration nor StrictMode effect replay saves fallback data.
  useEffect(() => {
    if (data === initial.data) return;
    try {
      let saved = data.goal === initial.data.goal && initial.originalGoal
        ? { ...data, goal: initial.originalGoal } : data;
      if (initial.legacySource) {
        // The alias remains byte-exact. Persist its edited daily-log projection
        // using the existing canonical format; raw legacy entries may contain
        // numeric strings which the canonical backup validator cannot accept.
        const { entries: _legacyEntries, ...canonical } = saved;
        saved = canonical;
      }
      localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(saved));
    } catch (error) {
      console.error('Failed to save cardio data:', error);
    }
  }, [data, initial]);

  // Reset daily data if date has changed
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayString();
      if (data.lastDate && data.lastDate !== today) {
        setData(prev => ({
          ...prev,
          lastDate: today,
          currentDayDuration: 0,
          currentDayDistance: 0
        }));
      }
    };

    checkDateChange();
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [data.lastDate]);

  const addCardioEntry = (type: string, duration: number, distance?: number, notes?: string) => {
    const today = getTodayString();
    const currentTime = getCurrentTime(); // Use consistent time format
    
    const newSession: CardioSession = {
      id: Date.now().toString(),
      time: currentTime,
      type,
      duration: Math.floor(duration || 0),
      distance: distance ? Math.round(distance * 10) / 10 : distance,
      notes
    };

    setData(prev => {
      const todayLog = prev.dailyLogs[today] || { date: today, totalDuration: 0, totalDistance: 0, sessions: [] };
      
      const updatedLog = {
        ...todayLog,
        totalDuration: todayLog.totalDuration + newSession.duration,
        totalDistance: todayLog.totalDistance + (newSession.distance || 0),
        sessions: [...todayLog.sessions, newSession]
      };

      return {
        ...prev,
        currentDayDuration: prev.currentDayDuration + newSession.duration,
        currentDayDistance: prev.currentDayDistance + (newSession.distance || 0),
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: updatedLog
        }
      };
    });
  };

  const updateCardioSession = (date: string, id: string, updates: Partial<CardioSession>) => {
    setData(prev => {
      const dayLog = prev.dailyLogs[date];
      if (!dayLog) return prev;
      
      const oldSession = dayLog.sessions.find(s => s.id === id);
      if (!oldSession) return prev;
      
      const updatedSessions = dayLog.sessions.map(session => 
        session.id === id ? { ...session, ...updates } : session
      );
      
      // Recalculate totals
      let totalDuration = 0;
      let totalDistance = 0;
      updatedSessions.forEach(session => {
        totalDuration += session.duration;
        if (session.distance) totalDistance += session.distance;
      });
      
      const updatedLog = {
        ...dayLog,
        totalDuration,
        totalDistance,
        sessions: updatedSessions
      };
      
      // Update current day totals if it's today
      const isToday = date === getTodayString();
      
      return {
        ...prev,
        currentDayDuration: isToday ? totalDuration : prev.currentDayDuration,
        currentDayDistance: isToday ? totalDistance : prev.currentDayDistance,
        dailyLogs: {
          ...prev.dailyLogs,
          [date]: updatedLog
        }
      };
    });
  };

  const deleteCardioSession = (date: string, id: string) => {
    setData(prev => {
      const dayLog = prev.dailyLogs[date];
      if (!dayLog) return prev;
      
      const sessionToDelete = dayLog.sessions.find(s => s.id === id);
      if (!sessionToDelete) return prev;
      
      const updatedSessions = dayLog.sessions.filter(session => session.id !== id);
      
      // Recalculate totals
      let totalDuration = 0;
      let totalDistance = 0;
      updatedSessions.forEach(session => {
        totalDuration += session.duration;
        if (session.distance) totalDistance += session.distance;
      });
      
      const updatedLog = {
        ...dayLog,
        totalDuration,
        totalDistance,
        sessions: updatedSessions
      };
      
      // Remove the log entirely if no sessions remain
      const newDailyLogs = { ...prev.dailyLogs };
      if (updatedSessions.length === 0) {
        delete newDailyLogs[date];
      } else {
        newDailyLogs[date] = updatedLog;
      }
      
      // Update current day totals if it's today
      const isToday = date === getTodayString();
      
      return {
        ...prev,
        currentDayDuration: isToday ? totalDuration : prev.currentDayDuration,
        currentDayDistance: isToday ? totalDistance : prev.currentDayDistance,
        dailyLogs: newDailyLogs
      };
    });
  };

  const updateGoal = (goal: CardioGoal) => {
    setData(prev => ({
      ...prev,
      goal,
      goalUserSet: true // Mark as user-set when goal is updated
    }));
    
    // Also write to legacy goal key for backward compatibility
    localStorage.setItem('fitcircle_goal_cardio', JSON.stringify(goal));
  };

  const addCustomType = (type: string) => {
    const trimmedType = type.trim();
    if (!trimmedType || data.customTypes.includes(trimmedType)) return;
    
    setData(prev => ({
      ...prev,
      customTypes: [...prev.customTypes, trimmedType]
    }));
  };

  const getAllCardioTypes = () => {
    const entryTypes = Array.from(new Set(
      Object.values(data.dailyLogs)
        .flatMap(log => log.sessions.map(session => session.type))
    ));
    return [...defaultCardioTypes, ...data.customTypes, ...entryTypes]
      .filter((type, index, arr) => arr.indexOf(type) === index)
      .sort();
  };

  const getTodaysCardio = () => {
    const today = getTodayString();
    const todayLog = data.dailyLogs[today];
    
    if (!todayLog) {
      return {
        sessions: [],
        totalDuration: 0,
        totalDistance: 0,
        count: 0
      };
    }
    
    return {
      sessions: todayLog.sessions,
      totalDuration: todayLog.totalDuration,
      totalDistance: todayLog.totalDistance,
      count: todayLog.sessions.length
    };
  };

  const getTodaysProgress = () => {
    const today = getTodayString();
    const todayLog = data.dailyLogs[today];
    
    const todayTotals = {
      duration: todayLog?.totalDuration || 0,
      distance: todayLog?.totalDistance || 0
    };
    
    const progress = data.goal.type === 'duration' 
      ? (data.goal.target > 0 ? (todayTotals.duration / data.goal.target) * 100 : 0)
      : (data.goal.target > 0 ? (todayTotals.distance / data.goal.target) * 100 : 0);
    
    const remaining = data.goal.type === 'duration'
      ? Math.max(0, data.goal.target - todayTotals.duration)
      : Math.max(0, data.goal.target - todayTotals.distance);
    
    return {
      progress: Math.min(progress, 100),
      today: todayTotals,
      remaining
    };
  };

  const getWeeklyProgress = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let totalDuration = 0;
    let totalDistance = 0;
    let dayCount = 0;
    
    Object.values(data.dailyLogs).forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= oneWeekAgo && logDate <= now) {
        totalDuration += log.totalDuration;
        totalDistance += log.totalDistance;
        dayCount++;
      }
    });
    
    const weeklyTarget = data.goal.target * 7;
    const progress = data.goal.type === 'duration'
      ? weeklyTarget > 0 ? (totalDuration / weeklyTarget) * 100 : 0
      : weeklyTarget > 0 ? (totalDistance / weeklyTarget) * 100 : 0;
    
    const remaining = data.goal.type === 'duration'
      ? Math.max(0, weeklyTarget - totalDuration)
      : Math.max(0, weeklyTarget - totalDistance);
    
    return {
      totalDuration: Math.round(totalDuration * 10) / 10,
      totalDistance: Math.round(totalDistance * 10) / 10,
      weeklyTarget,
      progress: Math.min(progress, 100),
      remaining: Math.round(remaining * 10) / 10
    };
  };

  const getLast10LogsAverage = () => {
    // Calculate average over the last 10 CALENDAR DAYS (not just logged days)
    // Days without activity count as 0
    const today = new Date();
    let totalValue = 0;
    let daysWithLogs = 0;

    // Check each of the last 10 calendar days using LOCAL date strings
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      // Use getDateString for consistent local timezone handling (not toISOString which is UTC)
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayLog = data.dailyLogs[dateStr];
      if (dayLog) {
        totalValue += data.goal.type === 'duration' ? dayLog.totalDuration : dayLog.totalDistance;
        daysWithLogs++;
      }
      // Days without logs contribute 0 to total (already 0)
    }

    // Always divide by 10 calendar days, not just logged days
    const average = totalValue / 10;
    const progressToGoal = data.goal.target > 0 ? (average / data.goal.target) * 100 : 0;
    const targetGoal = data.goal.target * 10; // 10 days worth of target goal
    const goalProgress = targetGoal > 0 ? Math.min((totalValue / targetGoal) * 100, 100) : 0;

    return {
      average: Math.round(average * 10) / 10,
      totalValue: Math.round(totalValue * 10) / 10,
      targetGoal: Math.round(targetGoal * 10) / 10,
      progressToGoal: Math.min(progressToGoal, 100),
      goalProgress: Math.round(goalProgress * 10) / 10,
      dailyTarget: Math.round(data.goal.target * 10) / 10,
      logsCount: daysWithLogs
    };
  };

  const getCardioStats = () => {
    const allSessions = Object.values(data.dailyLogs).flatMap(log => log.sessions);
    const totalEntries = allSessions.length;
    const totalDuration = Object.values(data.dailyLogs).reduce((sum, log) => sum + log.totalDuration, 0);
    const totalDistance = Object.values(data.dailyLogs).reduce((sum, log) => sum + log.totalDistance, 0);
    
    const typeStats = allSessions.reduce((acc, session) => {
      acc[session.type] = (acc[session.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteType = Object.entries(typeStats).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    return {
      totalEntries,
      totalDuration,
      totalDistance,
      favoriteType,
      typeStats
    };
  };

  // Get all-time goal percentage for goal modal
  const getAllTimeAverage = () => {
    const allSessions = Object.values(data.dailyLogs).flatMap(log => log.sessions);
    const legacyFormat = allSessions.map(session => ({
      date: data.dailyLogs[Object.keys(data.dailyLogs).find(date => data.dailyLogs[date].sessions.includes(session)) || getTodayString()].date,
      duration: session.duration,
      distance: session.distance || 0
    }));
    return getAllTimeCardioAverage(legacyFormat);
  };
  
  const getAllTimeGoalPercentage = (): number => {
    const dailyLogsCount = Object.keys(data.dailyLogs).length;
    if (dailyLogsCount === 0) return 0;
    
    const { averageDuration, averageDistance } = getAllTimeAverage();
    const averageValue = data.goal.type === 'duration' ? averageDuration : averageDistance;
    
    return data.goal.target > 0 ? Math.min((averageValue / data.goal.target) * 100, 100) : 0;
  };

  return {
    data,
    hasUserGoal: data.goalUserSet, // Flag indicating if user has explicitly set a goal
    addCardioEntry,
    updateCardioSession,
    deleteCardioSession,
    updateGoal,
    addCustomType,
    getAllCardioTypes,
    getTodaysCardio,
    getTodaysProgress,
    getWeeklyProgress,
    getLast10LogsAverage,
    getCardioStats,
    getAllTimeGoalPercentage,
    getAllTimeAverage
  };
}