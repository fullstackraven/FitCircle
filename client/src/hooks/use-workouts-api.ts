import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Workout, WorkoutLog } from '@shared/schema';

interface DailyLog {
  [workoutId: string]: number;
}

interface WorkoutData {
  workouts: { [id: string]: Workout };
  dailyLogs: { [date: string]: DailyLog };
}

const WORKOUT_COLORS = [
  'green', 'blue', 'purple', 'amber', 'red', 'pink', 'cyan', 'lime'
];

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useWorkoutsApi() {
  const queryClient = useQueryClient();

  // Fetch workouts
  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['/api/workouts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/workouts');
      return await response.json();
    }
  });

  // Fetch recent workout logs
  const { data: workoutLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/workout-logs/range'],
    queryFn: async () => {
      const today = getTodayString();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = getDateString(sevenDaysAgo);
      
      const response = await apiRequest('GET', `/api/workout-logs/range/${startDate}/${today}`);
      return await response.json();
    }
  });

  // Create workout mutation
  const createWorkoutMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      console.log('Creating workout API call:', data);
      const response = await apiRequest('POST', '/api/workouts', data);
      const result = await response.json();
      console.log('Created workout:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Workout created successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
    },
    onError: (error) => {
      console.error('Error creating workout:', error);
    }
  });

  // Update workout log mutation
  const updateWorkoutLogMutation = useMutation({
    mutationFn: async (data: { workoutId: number; date: string; count: number }) => {
      const response = await apiRequest('POST', '/api/workout-logs', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-logs/range'] });
    }
  });

  const addWorkout = (name: string, color: string) => {
    console.log('Adding workout:', { name, color });
    createWorkoutMutation.mutate({ name, color });
  };

  const incrementWorkout = (workoutId: number) => {
    const today = getTodayString();
    const currentLog = workoutLogs.find((log: WorkoutLog) => 
      log.workoutId === workoutId && log.date === today
    );
    const newCount = (currentLog?.count || 0) + 1;
    
    updateWorkoutLogMutation.mutate({
      workoutId,
      date: today,
      count: newCount
    });
  };

  const decrementWorkout = (workoutId: number) => {
    const today = getTodayString();
    const currentLog = workoutLogs.find((log: WorkoutLog) => 
      log.workoutId === workoutId && log.date === today
    );
    const currentCount = currentLog?.count || 0;
    
    if (currentCount > 0) {
      updateWorkoutLogMutation.mutate({
        workoutId,
        date: today,
        count: currentCount - 1
      });
    }
  };

  const getTodaysTotals = () => {
    const today = getTodayString();
    
    return workouts.map((workout: Workout) => {
      const todayLog = workoutLogs.find((log: WorkoutLog) => 
        log.workoutId === workout.id && log.date === today
      );
      return {
        ...workout,
        count: todayLog?.count || 0
      };
    });
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
      const dayLogs = workoutLogs.filter((log: WorkoutLog) => log.date === dateString);
      
      const isYesterday = date.getDate() === new Date().getDate() - 1;
      const formattedDate = isYesterday ? 'Yesterday' : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      const totalReps = dayLogs.reduce((sum: number, log: WorkoutLog) => sum + log.count, 0);
      
      return {
        date: formattedDate,
        dateString,
        totalReps,
        workouts: workouts.map((workout: Workout) => {
          const workoutLog = dayLogs.find((log: WorkoutLog) => log.workoutId === workout.id);
          return {
            ...workout,
            count: workoutLog?.count || 0
          };
        })
      };
    }).filter(day => day.totalReps > 0);
  };

  const getAvailableColors = () => {
    const usedColors = workouts.map((w: Workout) => w.color);
    return WORKOUT_COLORS.filter(color => !usedColors.includes(color));
  };

  const getWorkoutArray = () => {
    return workouts;
  };

  const canAddMoreWorkouts = () => {
    return workouts.length < 10;
  };

  return {
    workouts,
    addWorkout,
    incrementWorkout,
    decrementWorkout,
    getTodaysTotals,
    getRecentActivity,
    getAvailableColors,
    getWorkoutArray,
    canAddMoreWorkouts,
    isLoading: workoutsLoading || logsLoading,
    isCreating: createWorkoutMutation.isPending,
    isUpdating: updateWorkoutLogMutation.isPending
  };
}