import { useState, useEffect } from 'react';

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
}

const WORKOUT_COLORS = [
  'green', 'blue', 'purple', 'amber', 'red', 'pink', 'cyan', 'lime', 'orange', 'indigo', 'emerald', 'yellow'
];

const STORAGE_KEY = 'workout-tracker-data';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useWorkouts() {
  const [data, setData] = useState<WorkoutData>({
    workouts: {},
    dailyLogs: {}
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed);
      } catch (error) {
        console.error('Failed to parse workout data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

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
    
    return Object.values(data.workouts).map(workout => ({
      ...workout,
      count: todayLog[workout.id] || 0
    }));
  };

  const getRecentActivity = () => {
    const dates = [];
    const today = new Date();
    
    // Get last 7 days (excluding today)
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    return dates.map(date => {
      const dateString = getDateString(date);
      const dayLog = data.dailyLogs[dateString] || {};
      
      const isYesterday = date.getDate() === new Date().getDate() - 1;
      const formattedDate = isYesterday ? 'Yesterday' : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      const totalReps = Object.values(dayLog).reduce((sum, count) => sum + count, 0);
      
      return {
        date: formattedDate,
        dateString,
        totalReps,
        workouts: Object.values(data.workouts).map(workout => ({
          ...workout,
          count: dayLog[workout.id] || 0
        }))
      };
    }).filter(day => day.totalReps > 0); // Only show days with activity
  };

  const getAvailableColors = () => {
    // Return all colors - users can select any color for any workout
    return WORKOUT_COLORS;
  };

  const getWorkoutArray = () => {
    return Object.values(data.workouts);
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
      
      // Also remove all logs for this workout
      const cleanedDailyLogs = Object.fromEntries(
        Object.entries(prev.dailyLogs).map(([date, log]) => {
          const { [workoutId]: removedLog, ...remainingLog } = log;
          return [date, remainingLog];
        })
      );
      
      return {
        workouts: remainingWorkouts,
        dailyLogs: cleanedDailyLogs
      };
    });
  };

  const canAddMoreWorkouts = () => {
    return Object.keys(data.workouts).length < 10;
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
    canAddMoreWorkouts
  };
}
