import { useState, useEffect } from 'react';
import { useIndexedDB } from './use-indexed-db';

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

export interface JournalEntry {
  date: string;
  entry: string;
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

const STORAGE_KEY = 'workout-tracker-data';

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useWorkouts() {
  const [data, setData] = useState<WorkoutData>({
    workouts: {},
    dailyLogs: {},
    journalEntries: {},
    lastDate: getTodayString()
  });

  const { isReady, getItem, setItem } = useIndexedDB();

  // Load data from IndexedDB on mount
  useEffect(() => {
    if (!isReady) return;

    const loadData = async () => {
      try {
        const savedData = await getItem<WorkoutData>(STORAGE_KEY);
        if (savedData) {
          setData(prev => ({
            ...savedData,
            lastDate: savedData.lastDate || getTodayString()
          }));
        }
      } catch (error) {
        console.error('Failed to load workout data:', error);
      }
    };

    loadData();
  }, [isReady, getItem]);

  // Save data to IndexedDB whenever it changes
  useEffect(() => {
    if (!isReady) return;

    const saveData = async () => {
      try {
        await setItem(STORAGE_KEY, data);
      } catch (error) {
        console.error('Failed to save workout data:', error);
      }
    };

    saveData();
  }, [data, isReady, setItem]);

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
        
        // Force re-render of components that use getTotalStats
        // This ensures statistics update immediately when workouts reset
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

      // Calculate yesterday properly using date strings instead of getDate() comparison
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = getDateString(yesterday);
      const isYesterday = dateString === yesterdayString;
      
      const formattedDate = isYesterday ? 'Yesterday' : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

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
    
    let totalReps = 0;
    let workoutsCompleted = 0;
    let goalsHit = 0;
    let totalPossibleGoals = 0;

    if (workoutArray.length === 0) {
      return {
        totalReps: 0,
        workoutsCompleted: 0,
        monthlyGoalPercentage: 0,
        daysInMonth
      };
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = getDateString(date);
      const dayLog = data.dailyLogs?.[dateStr] || {};
      
      // Only count workouts that actually have logged reps for this day
      // This ensures that adding new workouts doesn't affect past statistics
      const workoutsWithRepsOnThisDay = workoutArray.filter(w => dayLog[w.id] && dayLog[w.id] > 0);
      if (workoutsWithRepsOnThisDay.length === 0) continue;
      
      let dayWorkoutsCompleted = 0;
      
      workoutsWithRepsOnThisDay.forEach(workout => {
        const count = dayLog[workout.id] || 0;
        totalReps += count;
        if (count >= workout.dailyGoal) {
          goalsHit++;
          dayWorkoutsCompleted++;
        }
        totalPossibleGoals++;
      });
      
      if (dayWorkoutsCompleted === workoutsWithRepsOnThisDay.length && workoutsWithRepsOnThisDay.length > 0) {
        workoutsCompleted++;
      }
    }

    return {
      totalReps,
      workoutsCompleted,
      monthlyGoalPercentage: workoutsCompleted > 0 ? (workoutsCompleted / daysInMonth) * 100 : 0,
      daysInMonth
    };
  };

  const getTotalStats = () => {
    const workoutArray = Object.values(data.workouts || {});
    let totalReps = 0;
    let totalGoalsHit = 0;
    let totalPossibleGoals = 0;

    if (workoutArray.length === 0 || !data.dailyLogs) {
      return {
        totalReps: 0,
        totalGoalPercentage: 0
      };
    }

    Object.entries(data.dailyLogs).forEach(([, dayLog]) => {
      // Only count workouts that actually have logged reps for this day
      const workoutsWithRepsOnThisDay = workoutArray.filter(w => dayLog[w.id] && dayLog[w.id] > 0);
      
      workoutsWithRepsOnThisDay.forEach(workout => {
        const count = dayLog[workout.id] || 0;
        totalReps += count;
        if (count >= workout.dailyGoal) {
          totalGoalsHit++;
        }
        totalPossibleGoals++;
      });
    });

    return {
      totalReps,
      totalGoalPercentage: totalPossibleGoals > 0 ? (totalGoalsHit / totalPossibleGoals) * 100 : 0
    };
  };

  const getIndividualWorkoutTotals = () => {
    const workoutArray = Object.values(data.workouts || {});
    
    if (workoutArray.length === 0) {
      return [];
    }
    
    return workoutArray.map(workout => {
      let totalReps = 0;
      
      if (data.dailyLogs) {
        Object.entries(data.dailyLogs).forEach(([, dayLog]) => {
          totalReps += dayLog[workout.id] || 0;
        });
      }
      
      return {
        id: workout.id,
        name: workout.name,
        color: workout.color,
        totalReps
      };
    });
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
