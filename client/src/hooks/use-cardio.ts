import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString, getAllTimeCardioAverage } from '@/lib/date-utils';

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
  period: 'day';
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
    target: 21, // ~21 minutes per day (150 minutes per week / 7)
    period: 'day'
  },
  customTypes: []
};

export function useCardio() {
  const [data, setData] = useState<CardioData>(defaultData);

  // Load data from localStorage on mount with backup data migration
  useEffect(() => {
    try {
      let dataToLoad = defaultData;
      
      // Try to load from primary storage key
      const storedData = localStorage.getItem(STORAGE_KEYS.CARDIO);
      if (storedData) {
        dataToLoad = safeParseJSON(storedData, defaultData);
      } else {
        // Check for legacy keys from backup files
        const legacyKeys = ['fitcircle_cardio', 'cardioLogs', 'cardio_entries', 'cardio'];
        for (const key of legacyKeys) {
          const legacyData = localStorage.getItem(key);
          if (legacyData) {
            const parsed = safeParseJSON(legacyData, { entries: [] });
            if (parsed.entries && Array.isArray(parsed.entries)) {
              dataToLoad = { ...defaultData, entries: parsed.entries };
              break;
            }
          }
        }
      }
      
      // Normalize and validate entries with backup data migration
      const normalizedEntries = dataToLoad.entries
        .filter(entry => entry) // Remove null/undefined entries
        .map((entry, index) => {
          // Generate ID if missing (common in backup data)
          const id = entry.id || String(entry.timestamp || `${entry.date || getTodayString()}-${entry.type || 'cardio'}-${index}`);
          
          // Normalize date format (handle various backup formats)
          let date = entry.date;
          if (!date && entry.timestamp) {
            date = new Date(entry.timestamp).toLocaleDateString('en-CA');
          }
          if (!date) {
            date = getTodayString();
          }
          
          // Normalize duration and distance (handle string/number conversion)
          const duration = typeof entry.duration === 'string' ? parseFloat(entry.duration) || 0 : entry.duration || 0;
          const distance = entry.distance ? (typeof entry.distance === 'string' ? parseFloat(entry.distance) || 0 : entry.distance) : undefined;
          
          // Normalize type field (map legacy field names)
          const type = entry.type || entry.name || entry.activity || 'cardio';
          
          // Ensure timestamp exists
          const timestamp = entry.timestamp || new Date(date).getTime();
          
          return {
            id,
            date,
            type,
            duration,
            distance,
            notes: entry.notes,
            timestamp
          };
        });

      // Update goal format if it's still weekly
      let normalizedGoal = dataToLoad.goal || defaultData.goal;
      if (normalizedGoal.period === 'week') {
        normalizedGoal = {
          ...normalizedGoal,
          target: Math.round(normalizedGoal.target / 7), // Convert weekly to daily
          period: 'day'
        };
      }
      
      const validatedData = {
        ...dataToLoad,
        entries: normalizedEntries,
        goal: normalizedGoal,
        customTypes: dataToLoad.customTypes || []
      };
      
      setData(validatedData);
      
      // Save normalized data back to primary storage
      localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(validatedData));
      
    } catch (error) {
      console.error('Error loading cardio data:', error);
      setData(defaultData);
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
    const progressToGoal = data.goal.target > 0 ? (average / data.goal.target) * 100 : 0;

    return {
      average: Math.round(average * 10) / 10,
      progressToGoal: Math.min(progressToGoal, 100),
      dailyTarget: Math.round(data.goal.target * 10) / 10
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

  // Get all-time goal percentage for goal modal
  const getAllTimeAverage = () => {
    return getAllTimeCardioAverage(data.entries);
  };
  
  const getAllTimeGoalPercentage = (): number => {
    if (data.entries.length === 0) return 0;
    
    const { averageDuration, averageDistance } = getAllTimeCardioAverage(data.entries);
    const averageValue = data.goal.type === 'duration' ? averageDuration : averageDistance;
    
    return data.goal.target > 0 ? Math.min((averageValue / data.goal.target) * 100, 100) : 0;
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
    getCardioStats,
    getAllTimeGoalPercentage,
    getAllTimeAverage
  };
}