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
  period: 'day' | 'week'; // Support both for backward compatibility
}

interface CardioData {
  entries: CardioEntry[];
  goal: CardioGoal;
  goalUserSet: boolean; // Track if user has explicitly set a goal
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
  goalUserSet: false, // Default to false - user hasn't set a goal yet
  customTypes: []
};

// Type guard for safe legacy data handling
function hasEntriesArray(x: any): x is { entries: unknown[] } {
  return x && !Array.isArray(x) && Array.isArray(x.entries);
}

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
        // Check for legacy keys from backup files - including direct entries array
        const legacyKeys = ['fitcircle_cardio', 'cardioLogs', 'cardio_entries', 'cardio'];
        for (const key of legacyKeys) {
          const legacyData = localStorage.getItem(key);
          if (legacyData) {
            const parsed = safeParseJSON(legacyData, []);
            // Handle both array of entries and object with entries property
            if (Array.isArray(parsed) && parsed.length > 0) {
              // PRESERVE existing goal data - only load entries from backup
              dataToLoad = { ...dataToLoad, entries: parsed as CardioEntry[] };
              console.log('Loaded cardio data from legacy key:', key, 'entries:', parsed.length);
              break;
            } else if (hasEntriesArray(parsed)) {
              // PRESERVE existing goal data - only load entries from backup
              const legacyEntries = parsed.entries as CardioEntry[];
              dataToLoad = { ...dataToLoad, entries: legacyEntries };
              console.log('Loaded cardio data from legacy key:', key, 'entries:', parsed.entries.length);
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
          const type = entry.type || (entry as any).name || (entry as any).activity || 'cardio';
          
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
      
      // Detect if user has set a goal (backward compatibility)
      const hasExplicitGoalKey = Boolean(localStorage.getItem('fitcircle_goal_cardio'));
      const hasNonDefaultGoal = dataToLoad.goal && (dataToLoad.goal.target !== 21 || dataToLoad.goal.type !== 'duration');
      const goalUserSet = dataToLoad.goalUserSet !== undefined ? dataToLoad.goalUserSet : (hasExplicitGoalKey || hasNonDefaultGoal);
      
      const validatedData = {
        ...dataToLoad,
        entries: normalizedEntries,
        goal: normalizedGoal,
        goalUserSet,
        customTypes: dataToLoad.customTypes || []
      };
      
      setData(validatedData);
      
      // Save normalized data back to primary storage
      try {
        localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(validatedData));
      } catch (error) {
        console.error('Failed to save normalized cardio data:', error);
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
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Exactly 7 days ago
    
    // Filter entries from the last 7 days based on date
    const weekEntries = data.entries.filter(entry => {
      const entryDate = new Date(entry.date + 'T00:00:00');
      return entryDate >= sevenDaysAgo && entryDate <= now;
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
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Exactly 7 days ago
    
    // Filter entries from the last 7 days
    const recentEntries = data.entries.filter(entry => {
      const entryDate = new Date(entry.date + 'T00:00:00');
      return entryDate >= sevenDaysAgo && entryDate <= now;
    });

    const totalValue = data.goal.type === 'duration'
      ? recentEntries.reduce((sum, entry) => sum + entry.duration, 0)
      : recentEntries.reduce((sum, entry) => sum + (entry.distance || 0), 0);

    const average = totalValue / 7; // Average over 7 days (including zero days)
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
    hasUserGoal: data.goalUserSet, // Flag indicating if user has explicitly set a goal
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