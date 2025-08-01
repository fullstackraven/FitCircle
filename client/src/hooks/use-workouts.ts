import { useState, useEffect } from 'react';
import { getTodayString, getDateString } from '@/lib/date-utils';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

export interface Workout {
  id: string;
  name: string;
  color: string;
  count: number;
  dailyGoal: number;
}

export interface DailyLog {
  [workoutId: string]: number;
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
  const [data, setData] = useState<WorkoutData>(() => 
    safeParseJSON(localStorage.getItem(STORAGE_KEYS.WORKOUTS), {
      workouts: {},
      dailyLogs: {},
      lastDate: getTodayString(),
      journalEntries: {}
    })
  );

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(data));
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

  const addWorkout = (name: string, color: string, dailyGoal: number) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newWorkout: Workout = {
      id,
      name,
      color,
      count: 0,
      dailyGoal
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
      const currentDailyCount = prev.dailyLogs[today]?.[workoutId] || 0;

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
            [workoutId]: currentDailyCount + 1
          }
        }
      };
    });
  };

  const decrementWorkout = (workoutId: string) => {
    const today = getTodayString();

    setData(prev => {
      const currentCount = prev.workouts[workoutId]?.count || 0;
      const currentDailyCount = prev.dailyLogs[today]?.[workoutId] || 0;

      if (currentCount <= 0 || currentDailyCount <= 0) return prev;

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
            [workoutId]: currentDailyCount - 1
          }
        }
      };
    });
  };

  const getTodaysTotals = () => {
    const today = getTodayString();
    const todayLog = data.dailyLogs[today] || {};

    return Object.values(data.workouts || {}).map(workout => ({
      ...workout,
      count: todayLog[workout.id] || 0
    }));
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

      const totalReps = Object.values(dayLog || {}).reduce((sum, count) => sum + count, 0);

      return {
        date: formattedDate,
        dateString,
        totalReps,
        workouts: Object.values(data.workouts || {}).map(workout => ({
          ...workout,
          count: dayLog[workout.id] || 0
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

  const updateWorkoutGoal = (workoutId: string, newGoal: number) => {
    setData(prev => ({
      ...prev,
      workouts: {
        ...prev.workouts,
        [workoutId]: {
          ...prev.workouts[workoutId],
          dailyGoal: newGoal
        }
      }
    }));
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

  const getMonthlyStats = (year: number, month: number) => {
    const workoutArray = Object.values(data.workouts || {});
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = getTodayString();
    
    let totalReps = 0;
    let workoutsCompleted = 0; // Count of completed workout days this month

    if (workoutArray.length === 0) {
      return {
        totalReps: 0,
        workoutsCompleted: 0,
        workoutConsistency: 0,
        daysInMonth
      };
    }

    // Count completed days in this specific month only
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = getDateString(date);
      
      // Double-check this date belongs to the correct month to avoid boundary issues
      const parsedYear = parseInt(dateStr.split('-')[0]);
      const parsedMonth = parseInt(dateStr.split('-')[1]) - 1; // Convert to 0-based
      if (parsedYear !== year || parsedMonth !== month) continue;
      
      const dayLog = data.dailyLogs?.[dateStr] || {};
      
      // Skip future days
      if (dateStr > today) continue;
      
      // Only count days with actual reps logged
      const workoutsWithRepsOnThisDay = workoutArray.filter(w => dayLog[w.id] && dayLog[w.id] > 0);
      if (workoutsWithRepsOnThisDay.length === 0) continue;
      
      let allGoalsMet = true;
      
      workoutsWithRepsOnThisDay.forEach(workout => {
        const count = dayLog[workout.id] || 0;
        totalReps += count;
        if (count < workout.dailyGoal) {
          allGoalsMet = false;
        }
      });
      
      // Only count as completed if ALL active workouts met their goals
      if (allGoalsMet) {
        workoutsCompleted++;
      }
    }

    // Calculate percentage: completed days / days elapsed this month * 100
    const todayDate = new Date();
    const currentDay = (todayDate.getFullYear() === year && todayDate.getMonth() === month) 
      ? todayDate.getDate() 
      : daysInMonth;
    const workoutConsistency = currentDay > 0 ? (workoutsCompleted / currentDay) * 100 : 0;

    return {
      totalReps,
      workoutsCompleted,
      workoutConsistency,
      daysInMonth
    };
  };

  const getTotalStats = () => {
    const workoutArray = Object.values(data.workouts || {});
    const today = getTodayString();
    let totalReps = 0;
    let completedDays = 0;
    let totalExpectedDays = 0;

    if (workoutArray.length === 0 || !data.dailyLogs) {
      return {
        totalReps: 0,
        totalGoalPercentage: 0
      };
    }

    // Find first workout date across all logs
    let firstWorkoutDate: string | null = null;
    Object.keys(data.dailyLogs).forEach(dateStr => {
      const dayLog = data.dailyLogs[dateStr];
      const hasAnyReps = workoutArray.some(w => dayLog[w.id] && dayLog[w.id] > 0);
      if (hasAnyReps && (!firstWorkoutDate || dateStr < firstWorkoutDate)) {
        firstWorkoutDate = dateStr;
      }
    });

    if (!firstWorkoutDate) {
      return {
        totalReps: 0,
        totalGoalPercentage: 0
      };
    }

    // Count days from first workout to today
    const startDate = new Date(firstWorkoutDate);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalExpectedDays = daysDiff;

    // Count completed days and total reps
    Object.entries(data.dailyLogs).forEach(([dateStr, dayLog]) => {
      if (dateStr >= firstWorkoutDate && dateStr <= today) {
        const workoutsWithReps = workoutArray.filter(w => dayLog[w.id] && dayLog[w.id] > 0);
        if (workoutsWithReps.length > 0) {
          let allGoalsMet = true;
          workoutsWithReps.forEach(workout => {
            const count = dayLog[workout.id] || 0;
            totalReps += count;
            if (count < workout.dailyGoal) {
              allGoalsMet = false;
            }
          });
          if (allGoalsMet) {
            completedDays++;
          }
        }
      }
    });

    return {
      totalReps,
      totalGoalPercentage: totalExpectedDays > 0 ? (completedDays / totalExpectedDays) * 100 : 0
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
        .reduce((total, dayLog) => total + (dayLog[workout.id] || 0), 0)
    }));
  };

  return {
    workouts: data.workouts,
    addWorkout,
    incrementWorkout,
    decrementWorkout,
    deleteWorkout,
    updateWorkoutGoal,
    getTodaysTotals,
    getRecentActivity,
    getAvailableColors,
    getWorkoutArray,
    canAddMoreWorkouts,
    getDailyLogs: () => data.dailyLogs,
    addJournalEntry,
    getJournalEntry,
    getMonthlyStats,
    getTotalStats,
    getIndividualWorkoutTotals,
  };
}
