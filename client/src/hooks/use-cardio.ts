import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString } from '@/lib/date-utils';

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
  target: number; // miles per week or minutes per week
  period: 'week';
}

interface CardioData {
  entries: CardioEntry[];
  goal: CardioGoal;
  customTypes: string[];
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
  entries: [],
  goal: {
    type: 'duration',
    target: 150, // 150 minutes per week (WHO recommendation)
    period: 'week'
  },
  customTypes: []
};

export function useCardio() {
  const [data, setData] = useState<CardioData>(defaultData);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEYS.CARDIO);
    if (storedData) {
      const parsed = safeParseJSON(storedData, defaultData);
      
      // Simple data validation without destructive cleanup
      const validatedData = {
        ...parsed,
        entries: parsed.entries.filter(entry => entry && entry.id).map(entry => ({
          ...entry,
          duration: typeof entry.duration === 'string' ? parseFloat(entry.duration) || 0 : entry.duration || 0,
          distance: entry.distance ? (typeof entry.distance === 'string' ? parseFloat(entry.distance) || 0 : entry.distance) : undefined
        }))
      };
      
      setData(validatedData);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(data));
  }, [data]);

  const addCardioEntry = (type: string, duration: number, distance?: number, notes?: string) => {
    const newEntry: CardioEntry = {
      id: Date.now().toString(),
      date: getTodayString(),
      type,
      duration: Math.floor(duration || 0), // Force whole numbers to prevent "0" suffix
      distance: distance ? Math.round(distance * 10) / 10 : distance,
      notes,
      timestamp: Date.now()
    };

    setData(prev => ({
      ...prev,
      entries: [newEntry, ...prev.entries]
    }));
  };

  const updateCardioEntry = (id: string, updates: Partial<CardioEntry>) => {
    setData(prev => ({
      ...prev,
      entries: prev.entries.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    }));
  };

  const deleteCardioEntry = (id: string) => {
    setData(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== id)
    }));
  };

  const updateGoal = (goal: CardioGoal) => {
    setData(prev => ({
      ...prev,
      goal
    }));
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
    return [...defaultCardioTypes, ...data.customTypes];
  };

  const getTodaysCardio = () => {
    const today = getTodayString();
    return data.entries.filter(entry => entry.date === today);
  };

  const getTodaysProgress = () => {
    const todaysEntries = getTodaysCardio();
    const totalDuration = todaysEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalDistance = todaysEntries.reduce((sum, entry) => sum + (entry.distance || 0), 0);
    
    return {
      duration: totalDuration,
      distance: totalDistance,
      entries: todaysEntries.length
    };
  };

  const getWeeklyProgress = () => {
    const today = new Date();
    
    // For "This Week" calculation, use rolling 7 days ending today
    // This ensures we always show recent progress, not empty weeks
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Go back 6 days (today + 6 = 7 days total)
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const endOfPeriod = new Date(today);
    endOfPeriod.setHours(23, 59, 59, 999);
    
    const weekEntries = data.entries.filter(entry => {
      const entryDate = new Date(entry.date + 'T00:00:00');
      return entryDate >= sevenDaysAgo && entryDate <= endOfPeriod;
    });

    const totalDuration = weekEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalDistance = weekEntries.reduce((sum, entry) => sum + (entry.distance || 0), 0);
    
    const goalProgress = data.goal.type === 'duration' 
      ? (totalDuration / data.goal.target) * 100
      : (totalDistance / data.goal.target) * 100;

    return {
      duration: totalDuration,
      distance: totalDistance,
      entries: weekEntries.length,
      goalProgress: Math.min(goalProgress, 100),
      remaining: data.goal.type === 'duration' 
        ? Math.max(0, data.goal.target - totalDuration)
        : Math.max(0, data.goal.target - totalDistance)
    };
  };

  const getLast7DaysAverage = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = data.entries.filter(entry => entry.date === dateStr);
      const dayTotal = data.goal.type === 'duration'
        ? dayEntries.reduce((sum, entry) => sum + entry.duration, 0)
        : dayEntries.reduce((sum, entry) => sum + (entry.distance || 0), 0);
      
      last7Days.push(dayTotal);
    }

    const average = last7Days.reduce((sum, day) => sum + day, 0) / 7;
    const dailyGoalTarget = data.goal.target / 7; // Weekly goal divided by 7 days
    const progressToGoal = dailyGoalTarget > 0 ? (average / dailyGoalTarget) * 100 : 0;

    return {
      average: Math.round(average * 10) / 10,
      progressToGoal: Math.min(progressToGoal, 100),
      dailyTarget: Math.round(dailyGoalTarget * 10) / 10
    };
  };

  const getCardioStats = () => {
    const totalEntries = data.entries.length;
    const totalDuration = data.entries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalDistance = data.entries.reduce((sum, entry) => sum + (entry.distance || 0), 0);
    
    const typeStats = data.entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
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

  return {
    data,
    addCardioEntry,
    updateCardioEntry,
    deleteCardioEntry,
    updateGoal,
    addCustomType,
    getAllCardioTypes,
    getTodaysCardio,
    getTodaysProgress,
    getWeeklyProgress,
    getLast7DaysAverage,
    getCardioStats
  };
}