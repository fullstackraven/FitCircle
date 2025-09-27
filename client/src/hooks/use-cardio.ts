import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString, getAllTimeCardioAverage } from '@/lib/date-utils';

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

interface CardioData {
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

const defaultData: CardioData = {
  dailyLogs: {},
  goal: {
    type: 'duration',
    target: 21, // ~21 minutes per day (150 minutes per week / 7)
    period: 'day'
  },
  goalUserSet: false, // Default to false - user hasn't set a goal yet
  customTypes: [],
  lastDate: getTodayString(),
  currentDayDuration: 0,
  currentDayDistance: 0
};

// Type guard for safe legacy data handling
function hasEntriesArray(x: any): x is { entries: unknown[] } {
  return x && !Array.isArray(x) && Array.isArray(x.entries);
}

export function useCardio() {
  const [data, setData] = useState<CardioData>(defaultData);

  // Load data from localStorage on mount with migration to daily aggregation
  useEffect(() => {
    try {
      let dataToLoad = defaultData;
      let legacyEntries: CardioEntry[] = [];
      
      // Try to load from primary storage key
      const storedData = localStorage.getItem(STORAGE_KEYS.CARDIO);
      if (storedData) {
        dataToLoad = safeParseJSON(storedData, defaultData);
        // Check if this is legacy format with entries array
        if ((dataToLoad as any).entries && !dataToLoad.dailyLogs) {
          legacyEntries = (dataToLoad as any).entries;
          dataToLoad = { ...defaultData, goal: dataToLoad.goal, goalUserSet: dataToLoad.goalUserSet, customTypes: dataToLoad.customTypes };
        }
      } else {
        // Check for legacy keys from backup files
        const legacyKeys = ['fitcircle_cardio', 'cardioLogs', 'cardio_entries', 'cardio'];
        for (const key of legacyKeys) {
          const legacyData = localStorage.getItem(key);
          if (legacyData) {
            const parsed = safeParseJSON(legacyData, []);
            if (Array.isArray(parsed) && parsed.length > 0) {
              legacyEntries = parsed as CardioEntry[];
              console.log('Loaded cardio data from legacy key:', key, 'entries:', parsed.length);
              break;
            } else if (hasEntriesArray(parsed)) {
              legacyEntries = parsed.entries as CardioEntry[];
              console.log('Loaded cardio data from legacy key:', key, 'entries:', parsed.entries.length);
              break;
            }
          }
        }
      }
      
      // Migration: Convert legacy entries to daily logs if needed
      if (legacyEntries.length > 0) {
        console.log('Migrating', legacyEntries.length, 'cardio entries to daily aggregation format');
        
        // Normalize entries first
        const normalizedEntries = legacyEntries
          .filter(entry => entry)
          .map((entry, index) => {
            const id = entry.id || String(entry.timestamp || `${entry.date || getTodayString()}-${entry.type || 'cardio'}-${index}`);
            
            let date = entry.date;
            if (!date && entry.timestamp) {
              date = new Date(entry.timestamp).toLocaleDateString('en-CA');
            }
            if (!date) {
              date = getTodayString();
            }
            
            const duration = typeof entry.duration === 'string' ? parseFloat(entry.duration) || 0 : entry.duration || 0;
            const distance = entry.distance ? (typeof entry.distance === 'string' ? parseFloat(entry.distance) || 0 : entry.distance) : undefined;
            const type = entry.type || (entry as any).name || (entry as any).activity || 'cardio';
            const timestamp = entry.timestamp || new Date(date).getTime();
            
            return { id, date, type, duration, distance, notes: entry.notes, timestamp };
          });
        
        // Group by date and create daily logs
        const dailyLogs: { [date: string]: CardioDailyLog } = {};
        
        normalizedEntries.forEach(entry => {
          if (!dailyLogs[entry.date]) {
            dailyLogs[entry.date] = {
              date: entry.date,
              totalDuration: 0,
              totalDistance: 0,
              sessions: []
            };
          }
          
          const session: CardioSession = {
            id: entry.id,
            time: new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }),
            type: entry.type,
            duration: entry.duration,
            distance: entry.distance,
            notes: entry.notes
          };
          
          dailyLogs[entry.date].sessions.push(session);
          dailyLogs[entry.date].totalDuration += entry.duration;
          if (entry.distance) {
            dailyLogs[entry.date].totalDistance += entry.distance;
          }
        });
        
        dataToLoad.dailyLogs = dailyLogs;
        console.log('Migration completed:', Object.keys(dailyLogs).length, 'daily logs created');
      }

      // Update goal format if it's still weekly
      let normalizedGoal = dataToLoad.goal || defaultData.goal;
      if (normalizedGoal.period === 'week') {
        normalizedGoal = {
          ...normalizedGoal,
          target: Math.round(normalizedGoal.target / 7),
          period: 'day'
        };
      }
      
      // Detect if user has set a goal (backward compatibility)
      const hasExplicitGoalKey = Boolean(localStorage.getItem('fitcircle_goal_cardio'));
      const hasNonDefaultGoal = dataToLoad.goal && (dataToLoad.goal.target !== 21 || dataToLoad.goal.type !== 'duration');
      const goalUserSet = dataToLoad.goalUserSet !== undefined ? dataToLoad.goalUserSet : (hasExplicitGoalKey || hasNonDefaultGoal);
      
      // Calculate current day totals
      const today = getTodayString();
      const todayLog = dataToLoad.dailyLogs[today];
      const currentDayDuration = todayLog?.totalDuration || 0;
      const currentDayDistance = todayLog?.totalDistance || 0;
      
      const validatedData = {
        ...dataToLoad,
        goal: normalizedGoal,
        goalUserSet,
        customTypes: dataToLoad.customTypes || [],
        lastDate: today,
        currentDayDuration,
        currentDayDistance
      };
      
      setData(validatedData);
      
      // Save migrated data back to primary storage
      try {
        localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(validatedData));
      } catch (error) {
        console.error('Failed to save migrated cardio data:', error);
      }
      
    } catch (error) {
      console.error('Error loading cardio data:', error);
      setData(defaultData);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cardio data:', error);
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
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    
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
    // Get the most recent 10 daily logs regardless of date
    const recentLogs = Object.values(data.dailyLogs)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const totalValue = data.goal.type === 'duration'
      ? recentLogs.reduce((sum, log) => sum + log.totalDuration, 0)
      : recentLogs.reduce((sum, log) => sum + log.totalDistance, 0);

    const average = recentLogs.length > 0 ? totalValue / recentLogs.length : 0;
    const progressToGoal = data.goal.target > 0 ? (average / data.goal.target) * 100 : 0;
    const targetGoal = data.goal.target * 10; // 10 logs worth of target goal
    const goalProgress = targetGoal > 0 ? Math.min((totalValue / targetGoal) * 100, 100) : 0;

    return {
      average: Math.round(average * 10) / 10,
      totalValue: Math.round(totalValue * 10) / 10,
      targetGoal: Math.round(targetGoal * 10) / 10,
      progressToGoal: Math.min(progressToGoal, 100),
      goalProgress: Math.round(goalProgress * 10) / 10,
      dailyTarget: Math.round(data.goal.target * 10) / 10,
      logsCount: recentLogs.length
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