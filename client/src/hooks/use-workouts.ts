import { useState, useEffect } from 'react';
import { getTodayString, getDateString } from '@/lib/date-utils';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

export interface GoalHistoryEntry {
  goal: number;
  timestamp: string; // ISO date string when the goal was set
}

export interface Workout {
  id: string;
  name: string;
  color: string;
  count: number;
  dailyGoal: number;
  weightLbs?: number; // Optional weight in pounds
  goalHistory?: GoalHistoryEntry[]; // Track all goal changes over time
}

export interface WorkoutLogEntry {
  count: number;
  goalAtTime: number; // Store the goal that was in effect when this workout was logged
}

export interface DailyLog {
  [workoutId: string]: number | WorkoutLogEntry;
}

export interface WorkoutData {
  workouts: { [id: string]: Workout };
  dailyLogs: { [date: string]: DailyLog };
  journalEntries: { [date: string]: string };
  lastDate?: string;
}

const WORKOUT_COLORS = [
  'green', 'blue', 'purple', 'amber', 'red', 'pink', 'cyan', 'lime', 'orange', 'indigo', 'emerald', 'yellow'
];

export function useWorkouts() {
  const [data, setData] = useState<WorkoutData>(() => {
    const savedData = safeParseJSON(localStorage.getItem(STORAGE_KEYS.WORKOUTS), {
      workouts: {},
      dailyLogs: {},
      lastDate: getTodayString(),
      journalEntries: {}
    });
    
    // Migration: convert old format data to new format with goal preservation
    return migrateDataFormat(savedData);
  });

  // Advanced migration that uses completion patterns to determine historical goals
  function migrateDataFormat(savedData: WorkoutData): WorkoutData {
    // Check if migration is needed (either old format OR missing goal history)
    const hasOldFormat = Object.values(savedData.dailyLogs || {}).some(dayLog =>
      Object.values(dayLog).some(logEntry => typeof logEntry === 'number' && logEntry > 0)
    );
    
    const hasMissingGoalHistory = Object.keys(savedData.workouts || {}).some(workoutId => {
      const workout = savedData.workouts[workoutId];
      const hasHistoricalData = Object.values(savedData.dailyLogs || {}).some(dayLog => 
        dayLog[workoutId] && (typeof dayLog[workoutId] === 'number' ? dayLog[workoutId] > 0 : dayLog[workoutId].count > 0)
      );
      return hasHistoricalData && (!workout.goalHistory || workout.goalHistory.length === 0);
    });

    if (!hasOldFormat && !hasMissingGoalHistory) {
      return savedData;
    }

    console.log('Migrating workout data to preserve historical completion status...');
    const migratedData = { ...savedData };
    const currentWorkouts = savedData.workouts || {};

    // For each workout, analyze patterns to determine what goals were likely used
    Object.keys(currentWorkouts).forEach(workoutId => {
      const workoutEntries: Array<{date: string, count: number}> = [];
      
      // Collect all workout entries for this workout (handle both old and new formats)
      Object.entries(savedData.dailyLogs || {}).forEach(([dateStr, dayLog]) => {
        const logEntry = dayLog[workoutId];
        let count = 0;
        
        if (typeof logEntry === 'number' && logEntry > 0) {
          count = logEntry;
        } else if (typeof logEntry === 'object' && logEntry.count > 0) {
          count = logEntry.count;
        }
        
        if (count > 0) {
          workoutEntries.push({ date: dateStr, count });
        }
      });

      // Sort by date
      workoutEntries.sort((a, b) => a.date.localeCompare(b.date));

      // Determine historical goals by analyzing completion patterns
      // Key insight: if someone consistently hit the same number, that was likely their goal
      workoutEntries.forEach(entry => {
        // For each entry, determine what the goal likely was at that time
        let historicalGoal = entry.count; // Default: assume they met their exact goal
        
        // Look for patterns around this date
        const nearbyEntries = workoutEntries.filter(e => 
          Math.abs(new Date(e.date).getTime() - new Date(entry.date).getTime()) < 7 * 24 * 60 * 60 * 1000 // Within a week
        );
        
        // If there are multiple entries around this time with the same value, it's likely a goal
        const commonCounts = new Map<number, number>();
        nearbyEntries.forEach(e => {
          commonCounts.set(e.count, (commonCounts.get(e.count) || 0) + 1);
        });
        
        // Find the most common count in that time period
        let mostCommonCount = entry.count;
        let maxFrequency = 0;
        commonCounts.forEach((frequency, count) => {
          if (frequency > maxFrequency) {
            maxFrequency = frequency;
            mostCommonCount = count;
          }
        });
        
        // Use the most common count as the historical goal
        historicalGoal = mostCommonCount;
        
        // Update the daily log with historical goal (force update even if already object)
        if (migratedData.dailyLogs[entry.date]) {
          migratedData.dailyLogs[entry.date][workoutId] = {
            count: entry.count,
            goalAtTime: historicalGoal
          };

        }
      });
    });

    // Save migrated data immediately
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(migratedData));
    } catch (error) {
      console.error('Failed to save migrated workout data:', error);
    }
    console.log('Migration complete - historical goals determined from completion patterns');
    return migratedData;
  }

  // Helper function to extract count from log entry
  const getCountFromLogEntry = (logEntry: number | WorkoutLogEntry | undefined): number => {
    if (!logEntry) return 0;
    return typeof logEntry === 'object' ? logEntry.count : logEntry;
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save workouts data:', error);
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
          workouts: Object.fromEntries(
            Object.entries(prev.workouts).map(([id, workout]) => [id, { ...workout, count: 0 }])
          )
        }));
        
        // Force re-render for statistics update
        window.dispatchEvent(new CustomEvent('workoutDataChanged'));
      }
    };

    // Only check after initial load
    if (data.lastDate) {
      checkDateChange();
    }
    
    const interval = setInterval(checkDateChange, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [data.lastDate]);

  const addWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newWorkout: Workout = {
      id,
      name,
      color,
      count: 0,
      dailyGoal,
      ...(weightLbs && weightLbs > 0 ? { weightLbs } : {})
    };

    setData(prev => ({
      ...prev,
      workouts: {
        ...prev.workouts,
        [id]: newWorkout
      }
    }));
  };

  const incrementWorkout = (workoutId: string) => {
    const today = getTodayString();

    setData(prev => {
      const currentCount = prev.workouts[workoutId]?.count || 0;
      const currentDailyLog = prev.dailyLogs[today]?.[workoutId];
      const currentDailyCount = typeof currentDailyLog === 'object' ? currentDailyLog.count : (currentDailyLog || 0);
      const currentGoal = prev.workouts[workoutId]?.dailyGoal || 1;

      return {
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutId]: {
            ...prev.workouts[workoutId],
            count: currentCount + 1
          }
        },
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: {
            ...prev.dailyLogs[today],
            [workoutId]: {
              count: currentDailyCount + 1,
              goalAtTime: getGoalForDate(workoutId, today)
            }
          }
        }
      };
    });
  };

  const decrementWorkout = (workoutId: string) => {
    const today = getTodayString();

    setData(prev => {
      const currentCount = prev.workouts[workoutId]?.count || 0;
      const currentDailyLog = prev.dailyLogs[today]?.[workoutId];
      const currentDailyCount = typeof currentDailyLog === 'object' ? currentDailyLog.count : (currentDailyLog || 0);
      const currentGoal = prev.workouts[workoutId]?.dailyGoal || 1;

      if (currentCount <= 0 || currentDailyCount <= 0) return prev;

      const newCount = Math.max(0, currentDailyCount - 1);

      return {
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutId]: {
            ...prev.workouts[workoutId],
            count: currentCount - 1
          }
        },
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: {
            ...prev.dailyLogs[today],
            [workoutId]: newCount > 0 ? {
              count: newCount,
              goalAtTime: getGoalForDate(workoutId, today)
            } : 0 // Keep old format for zero values to save space
          }
        }
      };
    });
  };

  const getTodaysTotals = () => {
    const today = getTodayString();
    const todayLog = data.dailyLogs[today] || {};

    return Object.values(data.workouts || {}).map(workout => {
      const logEntry = todayLog[workout.id];
      const count = typeof logEntry === 'object' ? logEntry.count : (logEntry || 0);
      return {
        ...workout,
        count
      };
    });
  };

  const getRecentActivity = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    return dates.map(date => {
      const dateString = getDateString(date);
      const dayLog = data.dailyLogs[dateString] || {};

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = dateString === getDateString(yesterday);
      
      const formattedDate = isYesterday ? 'Yesterday' : 
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const totalReps = Object.values(dayLog || {}).reduce((sum, logEntry) => {
        const count = typeof logEntry === 'object' ? logEntry.count : (logEntry || 0);
        return sum + count;
      }, 0);

      return {
        date: formattedDate,
        dateString,
        totalReps,
        workouts: Object.values(data.workouts || {}).map(workout => ({
          ...workout,
          count: getCountFromLogEntry(dayLog[workout.id])
        }))
      };
    }).filter(day => day.totalReps > 0);
  };

  const getAvailableColors = () => {
    return WORKOUT_COLORS;
  };

  const getWorkoutArray = () => {
    return Object.values(data.workouts || {});
  };

  // Helper function to get the goal that was in effect on a specific date
  const getGoalForDate = (workoutId: string, dateStr: string): number => {
    const workout = data.workouts[workoutId];
    if (!workout) return 1;
    
    // If no goal history, use current goal (for new workouts or before migration)
    if (!workout.goalHistory || workout.goalHistory.length === 0) {
      return workout.dailyGoal;
    }
    
    // Find the most recent goal change before or on the given date
    const goalHistory = [...workout.goalHistory].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    let applicableGoal = workout.dailyGoal; // Default to current goal
    
    // Work backwards through history to find the applicable goal
    for (let i = goalHistory.length - 1; i >= 0; i--) {
      if (goalHistory[i].timestamp <= dateStr) {
        applicableGoal = goalHistory[i].goal;
        break;
      }
    }
    
    return applicableGoal;
  };

  const updateWorkout = (workoutId: string, name?: string, newGoal?: number, weightLbs?: number) => {
    setData(prev => {
      const currentWorkout = prev.workouts[workoutId];
      const isGoalChanged = newGoal !== undefined && newGoal !== currentWorkout?.dailyGoal;
      
      // If goal is being changed, add to goal history
      let updatedGoalHistory = currentWorkout?.goalHistory || [];
      if (isGoalChanged && currentWorkout) {
        updatedGoalHistory = [
          ...updatedGoalHistory,
          {
            goal: newGoal!,
            timestamp: getTodayString()
          }
        ];
      }
      
      return {
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutId]: {
            ...currentWorkout,
            ...(name !== undefined ? { name } : {}),
            ...(newGoal !== undefined ? { dailyGoal: newGoal } : {}),
            ...(weightLbs !== undefined ? { weightLbs: weightLbs > 0 ? weightLbs : undefined } : {}),
            ...(isGoalChanged ? { goalHistory: updatedGoalHistory } : {})
          }
        }
      };
    });
  };

  // Keep the old function for backward compatibility
  const updateWorkoutGoal = (workoutId: string, newGoal: number, weightLbs?: number) => {
    updateWorkout(workoutId, undefined, newGoal, weightLbs);
  };

  const deleteWorkout = (workoutId: string) => {
    setData(prev => {
      const { [workoutId]: removed, ...remainingWorkouts } = prev.workouts;

      const cleanedDailyLogs = Object.fromEntries(
        Object.entries(prev.dailyLogs).map(([date, log]) => {
          const { [workoutId]: removedLog, ...remainingLog } = log;
          return [date, remainingLog];
        })
      );

      return {
        workouts: remainingWorkouts,
        dailyLogs: cleanedDailyLogs,
        lastDate: prev.lastDate,
        journalEntries: prev.journalEntries
      };
    });
  };

  const canAddMoreWorkouts = () => {
    return Object.keys(data.workouts || {}).length < 10;
  };

  const editWorkoutForDate = (workoutId: string, dateString: string, newCount: number) => {
    setData(prev => ({
      ...prev,
      dailyLogs: {
        ...prev.dailyLogs,
        [dateString]: {
          ...prev.dailyLogs[dateString],
          [workoutId]: newCount > 0 ? {
            count: newCount,
            goalAtTime: getGoalForDate(workoutId, dateString)
          } : 0
        }
      }
    }));
    
    // Trigger re-render for any components listening to workout changes
    window.dispatchEvent(new CustomEvent('workoutDataChanged'));
  };

  const getWorkoutLogsForDate = (dateString: string) => {
    const dayLog = data.dailyLogs[dateString] || {};
    return Object.values(data.workouts || {}).map(workout => ({
      ...workout,
      count: getCountFromLogEntry(dayLog[workout.id])
    }));
  };

  const addJournalEntry = (date: string, entry: string) => {
    setData(prev => ({
      ...prev,
      journalEntries: {
        ...prev.journalEntries,
        [date]: entry
      }
    }));
  };

  const getJournalEntry = (date: string) => {
    return data.journalEntries[date] || '';
  };

  const getAllJournalEntries = () => {
    return data.journalEntries || {};
  };

  // Get statistics for current month only
  const getMonthlyStats = (year: number, month: number) => {
    const workoutArray = Object.values(data.workouts || {});
    const today = getTodayString();
    
    let monthlyReps = 0;
    let monthlyCompletedDays = 0;

    if (workoutArray.length === 0) {
      return {
        monthlyReps: 0,
        monthlyCompletedDays: 0,
        monthlyConsistency: 0
      };
    }

    // Find first workout date in this specific month
    let firstWorkoutDateInMonth: string | null = null;
    let lastWorkoutDateInMonth: string | null = null;

    // Get all dates in this month with workout data
    Object.keys(data.dailyLogs || {}).forEach(dateStr => {
      const date = new Date(dateStr + 'T00:00:00');
      if (date.getFullYear() === year && date.getMonth() === month) {
        const dayLog = data.dailyLogs[dateStr];
        const hasAnyReps = workoutArray.some(w => getCountFromLogEntry(dayLog[w.id]) > 0);
        if (hasAnyReps) {
          if (!firstWorkoutDateInMonth || dateStr < firstWorkoutDateInMonth) {
            firstWorkoutDateInMonth = dateStr;
          }
          if (!lastWorkoutDateInMonth || dateStr > lastWorkoutDateInMonth) {
            lastWorkoutDateInMonth = dateStr;
          }
        }
      }
    });

    if (!firstWorkoutDateInMonth) {
      return {
        monthlyReps: 0,
        monthlyCompletedDays: 0,
        monthlyConsistency: 0
      };
    }

    // Count days from first workout in month to last day of month (or today if current month)
    const todayDate = new Date();
    const isCurrentMonth = (todayDate.getFullYear() === year && todayDate.getMonth() === month);
    
    const firstDate = new Date(firstWorkoutDateInMonth + 'T00:00:00');
    const lastDate = isCurrentMonth ? 
      new Date(today + 'T00:00:00') : 
      new Date(year, month + 1, 0); // Last day of month
      
    const daysInRange = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get recovery days from localStorage to include in consistency calculation
    const recoveryData = localStorage.getItem('fitcircle_recovery_data');
    let recoveryDays = [];
    if (recoveryData) {
      try {
        const parsed = JSON.parse(recoveryData);
        recoveryDays = parsed.recoveryDays || [];
      } catch (error) {
        console.warn('Failed to parse recovery data in getMonthlyStats:', error);
        recoveryDays = [];
      }
    }

    // Count only completed days and reps in this specific month
    Object.entries(data.dailyLogs || {}).forEach(([dateStr, dayLog]) => {
      const date = new Date(dateStr + 'T00:00:00');
      
      // Only count days in this specific month
      if (date.getFullYear() !== year || date.getMonth() !== month) return;
      if (dateStr > today) return; // Skip future days
      
      const isToday = dateStr === today;
      
      if (isToday) {
        // For today, check ALL current workouts (including newly added ones)
        let allGoalsMet = true;
        workoutArray.forEach(workout => {
          const count = getCountFromLogEntry(dayLog[workout.id]);
          monthlyReps += count;
          if (count < workout.dailyGoal) {
            allGoalsMet = false;
          }
        });
        
        if (allGoalsMet) {
          monthlyCompletedDays++;
        }
      } else {
        // For past days, only check workouts that actually have logged reps
        const workoutsWithReps = workoutArray.filter(w => getCountFromLogEntry(dayLog[w.id]) > 0);
        if (workoutsWithReps.length > 0) {
          let allGoalsMet = true;
          
          workoutsWithReps.forEach(workout => {
            const logEntry = dayLog[workout.id];
            const count = getCountFromLogEntry(logEntry);
            const goalAtTime = typeof logEntry === 'object' ? logEntry.goalAtTime : workout.dailyGoal;
            monthlyReps += count;
            if (count < goalAtTime) {
              allGoalsMet = false;
            }
          });
          
          if (allGoalsMet) {
            monthlyCompletedDays++;
          }
        }
      }
    });

    // Add recovery days as completed days (for consistency calculation only)
    recoveryDays.forEach((dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      if (date.getFullYear() === year && date.getMonth() === month && dateStr <= today) {
        // Only count recovery days if there's no workout logged for that day
        const dayLog = data.dailyLogs[dateStr] || {};
        const hasWorkouts = workoutArray.some(w => getCountFromLogEntry(dayLog[w.id]) > 0);
        if (!hasWorkouts) {
          monthlyCompletedDays++;
        }
      }
    });

    const monthlyConsistency = daysInRange > 0 ? (monthlyCompletedDays / daysInRange) * 100 : 0;

    return {
      monthlyReps,
      monthlyCompletedDays,
      monthlyConsistency
    };
  };

  // Get all-time statistics (ignores month boundaries)
  const getTotalStats = () => {
    const workoutArray = Object.values(data.workouts || {});
    const today = getTodayString();
    let totalReps = 0;
    let totalCompletedDays = 0;
    let totalExpectedDays = 0;

    if (workoutArray.length === 0 || !data.dailyLogs) {
      return {
        totalReps: 0,
        totalCompletedDays: 0,
        totalConsistency: 0
      };
    }

    // Find first workout date across all logs
    let firstWorkoutDate: string | null = null;
    Object.keys(data.dailyLogs).forEach(dateStr => {
      const dayLog = data.dailyLogs[dateStr];
      const hasAnyReps = workoutArray.some(w => getCountFromLogEntry(dayLog[w.id]) > 0);
      if (hasAnyReps && (!firstWorkoutDate || dateStr < firstWorkoutDate)) {
        firstWorkoutDate = dateStr;
      }
    });

    if (!firstWorkoutDate) {
      return {
        totalReps: 0,
        totalCompletedDays: 0,
        totalConsistency: 0
      };
    }

    // Calculate total expected days from first workout to today
    const firstDate = new Date(firstWorkoutDate + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    totalExpectedDays = Math.floor((todayDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get recovery days from localStorage to include in consistency calculation
    const recoveryData = localStorage.getItem('fitcircle_recovery_data');
    let recoveryDays = [];
    if (recoveryData) {
      try {
        const parsed = JSON.parse(recoveryData);
        recoveryDays = parsed.recoveryDays || [];
      } catch (error) {
        console.warn('Failed to parse recovery data in getTotalStats:', error);
        recoveryDays = [];
      }
    }

    // Count all completed days and total reps across entire history
    Object.entries(data.dailyLogs).forEach(([dateStr, dayLog]) => {
      const isToday = dateStr === today;
      
      if (isToday) {
        // For today, check ALL current workouts (including newly added ones)
        let allGoalsMet = true;
        workoutArray.forEach(workout => {
          const count = getCountFromLogEntry(dayLog[workout.id]);
          totalReps += count;
          if (count < workout.dailyGoal) {
            allGoalsMet = false;
          }
        });
        
        if (allGoalsMet) {
          totalCompletedDays++;
        }
      } else {
        // For past days, only check workouts that actually have logged reps
        const workoutsWithReps = workoutArray.filter(w => getCountFromLogEntry(dayLog[w.id]) > 0);
        if (workoutsWithReps.length > 0) {
          let allGoalsMet = true;
          
          workoutsWithReps.forEach(workout => {
            const logEntry = dayLog[workout.id];
            const count = getCountFromLogEntry(logEntry);
            const goalAtTime = typeof logEntry === 'object' ? logEntry.goalAtTime : workout.dailyGoal;
            totalReps += count;
            if (count < goalAtTime) {
              allGoalsMet = false;
            }
          });
          
          if (allGoalsMet) {
            totalCompletedDays++;
          }
        }
      }
    });

    // Add recovery days as completed days (for consistency calculation only)
    recoveryDays.forEach((dateStr: string) => {
      if (dateStr <= today) {
        // Only count recovery days if there's no workout logged for that day
        const dayLog = data.dailyLogs[dateStr] || {};
        const hasWorkouts = workoutArray.some(w => getCountFromLogEntry(dayLog[w.id]) > 0);
        if (!hasWorkouts) {
          totalCompletedDays++;
        }
      }
    });

    const totalConsistency = totalExpectedDays > 0 ? (totalCompletedDays / totalExpectedDays) * 100 : 0;

    return {
      totalReps,
      totalCompletedDays,
      totalConsistency
    };
  };

  const getIndividualWorkoutTotals = () => {
    const workoutArray = Object.values(data.workouts || {});
    
    if (workoutArray.length === 0) {
      return [];
    }
    
    return workoutArray.map(workout => ({
      id: workout.id,
      name: workout.name,
      color: workout.color,
      totalReps: Object.values(data.dailyLogs || {})
        .reduce((total, dayLog) => total + getCountFromLogEntry(dayLog[workout.id]), 0)
    }));
  };

  return {
    workouts: data.workouts,
    addWorkout,
    incrementWorkout,
    decrementWorkout,
    deleteWorkout,
    updateWorkout,
    updateWorkoutGoal,
    getTodaysTotals,
    getRecentActivity,
    getAvailableColors,
    getWorkoutArray,
    canAddMoreWorkouts,
    getDailyLogs: () => data.dailyLogs,
    addJournalEntry,
    getJournalEntry,
    getAllJournalEntries,
    getMonthlyStats,
    getTotalStats,
    getIndividualWorkoutTotals,
    editWorkoutForDate,
    getWorkoutLogsForDate,
  };
}
