import { useState, useEffect } from 'react';

export interface Workout {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface DailyLog {
  [workoutId: string]: number;
}

export interface WorkoutData {
  workouts: { [id: string]: Workout };
  dailyLogs: { [date: string]: DailyLog };
}

const WORKOUT_COLORS = [
  'green', 'blue', 'purple', 'amber', 'red', 'pink', 'cyan', 'lime'
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

  const addWorkout = (name: string, color: string) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newWorkout: Workout = {
      id,
      name,
      color,
      count: 0
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
    const usedColors = Object.values(data.workouts).map(w => w.color);
    return WORKOUT_COLORS.filter(color => !usedColors.includes(color));
  };

  const getWorkoutArray = () => {
    return Object.values(data.workouts);
  };

  const canAddMoreWorkouts = () => {
    return Object.keys(data.workouts).length < 10;
  };

  return {
    workouts: data.workouts,
    addWorkout,
    incrementWorkout,
    decrementWorkout,
    getTodaysTotals,
    getRecentActivity,
    getAvailableColors,
    getWorkoutArray,
    canAddMoreWorkouts
  };
}
