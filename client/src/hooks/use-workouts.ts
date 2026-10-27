import { validWorkoutTargets, workoutProgress, workoutLogComplete, stepWorkout, isSetLog, repsForSets } from '@/lib/workout-progress';
import { getTotalWorkoutStats } from '@/lib/workout-statistics';
import { useState, useEffect, useRef } from 'react';
import { getTodayString, getDateString } from '@/lib/date-utils';
import { STORAGE_KEYS } from '@/lib/storage-utils';
import { parseStoredWorkouts, StoredWorkoutDataError } from '@/lib/workout-initialization';

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
  setsGoal?: number;
  weightLbs?: number; // Optional weight in pounds
  goalHistory?: GoalHistoryEntry[]; // Track all goal changes over time
  scheduledDays?: number[]; // 0-6 (Sun-Sat), empty array means every day
  routineId?: string; // Optional routine assignment
}

export interface WorkoutLogEntry {
  count: number;
  completedSets?: number;
  setsGoalAtTime?: number;
  goalAtTime: number; // Store the goal that was in effect when this workout was logged
}

export interface DailyLog {
  [workoutId: string]: number | WorkoutLogEntry;
}

export interface Routine {
  id: string;
  name: string;
  selectedDays: number[]; // Array of day indices (0=Sunday, 1=Monday, etc.)
  createdAt: string;
}

export interface WorkoutData {
  workouts: { [id: string]: Workout };
  dailyLogs: { [date: string]: DailyLog };
  journalEntries: { [date: string]: { text: string; timestamp: string } | string };
  routines: { [id: string]: Routine };
  lastDate?: string;
}

const WORKOUT_COLORS = [
  'green', 'blue', 'purple', 'amber', 'red', 'pink', 'cyan', 'lime', 'orange', 'indigo', 'emerald', 'yellow'
];

export function useWorkouts(options?: { skipInitialWrite?: boolean }) {
  const initialPersistence = useRef(true);
  const [data, setData] = useState<WorkoutData>(() => {
    let raw: string | null;
    try {
      raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    } catch {
      throw new StoredWorkoutDataError(null, 'unavailable');
    }
    // Failed reads/validation throw before any state or effects can commit.
    return parseStoredWorkouts(raw, getTodayString());
  });

  // Helper function to extract count from log entry
  const getCountFromLogEntry = (logEntry: number | WorkoutLogEntry | undefined): number => {
    if (!logEntry) return 0;
    return typeof logEntry === 'object' ? logEntry.count : logEntry;
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (initialPersistence.current) {
      initialPersistence.current = false;
      if (options?.skipInitialWrite) return;
    }
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
          routines: prev.routines || {},
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

  const addWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[], routineId?: string, setsGoal = 1) => {
    if (!validWorkoutTargets(dailyGoal, setsGoal)) return;
    const id = Date.now().toString();
    const newWorkout: Workout = {
      id,
      name,
      color,
      count: 0,
      dailyGoal,
      setsGoal,
      scheduledDays: scheduledDays || [],
      routineId,
      goalHistory: [{
        goal: dailyGoal,
        timestamp: new Date().toISOString()
      }],
      ...(weightLbs && weightLbs > 0 ? { weightLbs } : {})
    };

    setData(prev => ({
      ...prev,
      routines: prev.routines || {},
      workouts: {
        ...prev.workouts,
        [id]: newWorkout
      }
    }));
  };

  const changeWorkout = (workoutId: string, direction: 1 | -1) => {
    const today = getTodayString();
    setData(prev => {
      const workout = prev.workouts[workoutId];
      if (!workout) return prev;
      const entry = prev.dailyLogs[today]?.[workoutId];
      const next = stepWorkout(workout, entry, direction);
      if (direction < 0 && !entry) return prev;
      return { ...prev, lastDate: today,
        workouts: { ...prev.workouts, [workoutId]: { ...workout, count: next.count } },
        dailyLogs: { ...prev.dailyLogs, [today]: { ...prev.dailyLogs[today], [workoutId]: next } }
      };
    });
  };
  const incrementWorkout = (id: string) => changeWorkout(id, 1);
  const decrementWorkout = (id: string) => changeWorkout(id, -1);

  const getTodaysTotals = () => {
    const today = getTodayString();
    const todayLog = data.dailyLogs[today] || {};

    return Object.values(data.workouts || {}).map(workout => {
      const logEntry = todayLog[workout.id];
      const count = typeof logEntry === 'object' ? logEntry.count : (logEntry || 0);
      return {
        ...workout,
        count,
        progress: workoutProgress(workout, logEntry)
      };
    });
  };

  const getRecentActivity = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    return dates.map(date => {
      const dateString = getDateString(date);
      const dayLog = data.dailyLogs[dateString] || {};

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isToday = dateString === getDateString(today);
      const isYesterday = dateString === getDateString(yesterday);
      
      const formattedDate = isToday ? 'Today' : (isYesterday ? 'Yesterday' : 
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })); // Keep display format as local

      const totalReps = Object.values(dayLog || {}).reduce((sum: number, logEntry: number | WorkoutLogEntry) => {
        if (typeof logEntry === 'number') {
          return sum + logEntry;
        } else if (typeof logEntry === 'object' && logEntry?.count) {
          return sum + logEntry.count;
        }
        return sum;
      }, 0);

      return {
        date: formattedDate,
        dateString,
        totalReps,
        workouts: Object.values(data.workouts || {}).map(workout => ({
          ...workout,
          count: getCountFromLogEntry(dayLog[workout.id]),
          progress: workoutProgress(workout, dayLog[workout.id])
        }))
      };
    }).filter(day => (typeof day.totalReps === 'number' ? day.totalReps : 0) > 0);
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

  const updateWorkout = (workoutId: string, name?: string, newGoal?: number, weightLbs?: number, scheduledDays?: number[], color?: string, setsGoal?: number) => {
    setData(prev => {
      const currentWorkout = prev.workouts[workoutId];
      if (!currentWorkout) return prev;
      const reps = newGoal ?? currentWorkout.dailyGoal;
      const sets = setsGoal ?? currentWorkout.setsGoal ?? 1;
      if (!validWorkoutTargets(reps, sets)) return prev;
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
        // On an explicit goal edit only, freeze numeric legacy logs under the
        // previous rep goal. Counts and completion remain exactly unchanged.
        dailyLogs: isGoalChanged ? Object.fromEntries(Object.entries(prev.dailyLogs).map(([date, log]) => [date,
          typeof log[workoutId] === 'number' && log[workoutId] > 0
            ? { ...log, [workoutId]: { count:log[workoutId], goalAtTime:currentWorkout.dailyGoal } } : log
        ])) : prev.dailyLogs,
        routines: prev.routines || {},
        workouts: {
          ...prev.workouts,
          [workoutId]: {
            ...currentWorkout,
            ...(name !== undefined ? { name } : {}),
            ...(newGoal !== undefined ? { dailyGoal: newGoal } : {}),
            ...(setsGoal !== undefined ? { setsGoal } : {}),
            ...(weightLbs !== undefined ? { weightLbs: weightLbs > 0 ? weightLbs : undefined } : {}),
            ...(scheduledDays !== undefined ? { scheduledDays } : {}),
            ...(color !== undefined ? { color } : {}),
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
        journalEntries: prev.journalEntries,
        routines: prev.routines || {}
      };
    });
  };

  const canAddMoreWorkouts = () => {
    return true; // No limit on number of workouts
  };

  const editWorkoutForDate = (workoutId: string, dateString: string, newCount: number) => {
    setData(prev => {
      const entry = prev.dailyLogs[dateString]?.[workoutId];
      const goal = typeof entry === 'object' ? entry.goalAtTime : getGoalForDate(workoutId, dateString);
      if (!Number.isInteger(newCount) || newCount < 0 || (isSetLog(entry) && newCount > entry.setsGoalAtTime)) return prev;
      const next = isSetLog(entry)
        ? { ...entry, completedSets:newCount, count:repsForSets(newCount,entry.goalAtTime,entry.setsGoalAtTime) }
        : { ...(typeof entry === 'object' ? entry : {}), count:newCount, goalAtTime:goal };
      return { ...prev,
        workouts: dateString === getTodayString() ? { ...prev.workouts, [workoutId]: { ...prev.workouts[workoutId], count:next.count } } : prev.workouts,
        dailyLogs: { ...prev.dailyLogs, [dateString]: { ...prev.dailyLogs[dateString], [workoutId]:next } }
      };
    });

    // Trigger re-render for any components listening to workout changes
    window.dispatchEvent(new CustomEvent('workoutDataChanged'));
  };

  const getWorkoutLogsForDate = (dateString: string) => {
    const dayLog = data.dailyLogs[dateString] || {};
    return Object.values(data.workouts || {}).map(workout => ({
      ...workout,
      count: getCountFromLogEntry(dayLog[workout.id]),
      progress: workoutProgress(workout, dayLog[workout.id])
    }));
  };

  // Journal actions report durable success before the editor leaves its draft.
  const persistJournal = (update: (previous: WorkoutData) => WorkoutData) => {
    // Other feature callers retain their existing deferred persistence behavior.
    if (!options?.skipInitialWrite) {
      setData(update);
      return true;
    }
    const next = update(data);
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(next));
    } catch {
      return false;
    }
    setData(next);
    return true;
  };
  const addJournalEntry = (date: string, entry: string) => {
    const timestamp = new Date().toISOString();
    return persistJournal(previous => ({
      ...previous,
      journalEntries: {
        ...previous.journalEntries,
        [date]: { ...(typeof previous.journalEntries[date] === 'object' ? previous.journalEntries[date] : {}), text: entry, timestamp }
      }
    }));
  };

  const getJournalEntry = (date: string) => {
    const entry = data.journalEntries[date];
    if (!entry) return '';
    // Support both old string format and new timestamp format
    return typeof entry === 'string' ? entry : entry.text;
  };

  const getJournalEntryWithTimestamp = (date: string) => {
    const entry = data.journalEntries[date];
    if (!entry) return null;
    // Support both old string format and new timestamp format
    if (typeof entry === 'string') {
      return { text: entry, timestamp: null };
    }
    return entry;
  };

  const getAllJournalEntries = () => {
    return data.journalEntries || {};
  };

  const deleteJournalEntry = (date: string) => {
    return persistJournal(previous => {
      const journalEntries = { ...previous.journalEntries };
      delete journalEntries[date];
      return { ...previous, journalEntries };
    });
  };

  // Get statistics for current month only - mirrors getTotalStats logic
  const getMonthlyStats = (year: number, month: number) => {
    const workoutArray = Object.values(data.workouts || {});
    const today = getTodayString();
    
    const todayDate = new Date();
    const isFutureMonth = year > todayDate.getFullYear() ||
      (year === todayDate.getFullYear() && month > todayDate.getMonth());
    const isCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth();
    // Calendar components avoid elapsed-millisecond errors around DST.
    const elapsedDaysInMonth = isFutureMonth ? 0 : isCurrentMonth
      ? todayDate.getDate() : new Date(year, month + 1, 0).getDate();

    let monthlyReps = 0;
    let monthlyCompletedDays = 0;

    if (workoutArray.length === 0 || isFutureMonth) {
      return {
        monthlyReps: 0,
        monthlyCompletedDays: 0,
        monthlyConsistency: 0
      };
    }

    // Get recovery days first (needed to find first active date)
    const recoveryData = localStorage.getItem('fitcircle_recovery_data');
    let recoveryDays: string[] = [];
    if (recoveryData) {
      try {
        const parsed = JSON.parse(recoveryData);
        recoveryDays = parsed.recoveryDays || [];
      } catch (error) {
        recoveryDays = [];
      }
    }

    // Find first active date in this month (either workout OR recovery day)
    let firstActiveDateInMonth: string | null = null;
    
    // Check workout days
    Object.keys(data.dailyLogs || {}).forEach(dateStr => {
      const date = new Date(dateStr + 'T00:00:00');
      if (date.getFullYear() === year && date.getMonth() === month) {
        const dayLog = data.dailyLogs[dateStr];
        const hasAnyReps = workoutArray.some(w => getCountFromLogEntry(dayLog[w.id]) > 0);
        if (hasAnyReps && (!firstActiveDateInMonth || dateStr < firstActiveDateInMonth)) {
          firstActiveDateInMonth = dateStr;
        }
      }
    });
    
    // Check recovery days in this month
    recoveryDays.forEach(dateStr => {
      const date = new Date(dateStr + 'T00:00:00');
      if (date.getFullYear() === year && date.getMonth() === month) {
        if (!firstActiveDateInMonth || dateStr < firstActiveDateInMonth) {
          firstActiveDateInMonth = dateStr;
        }
      }
    });

    if (!firstActiveDateInMonth) {
      return {
        monthlyReps: 0,
        monthlyCompletedDays: 0,
        monthlyConsistency: 0
      };
    }

    // Determine the end date (today if current month, else last day of month)
    const endDateStr = isCurrentMonth ? today : getDateString(new Date(year, month + 1, 0));
    
    // Keep the existing activity iteration and completion rules.
    const firstDate = new Date(firstActiveDateInMonth + 'T00:00:00');
    const endDate = new Date(endDateStr + 'T00:00:00');

    // Iterate through each day from first workout to end date (same approach as getTotalStats)
    for (let d = new Date(firstDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = getDateString(d);
      const dayLog = data.dailyLogs[dateStr] || {};
      const isToday = dateStr === today;

      if (isToday) {
        // For today: check scheduled workouts against current goals
        const todayDayOfWeek = new Date().getDay();
        const todaysScheduledWorkouts = workoutArray.filter(workout => isWorkoutActiveOnDay(workout, todayDayOfWeek));
        
        let allGoalsMet = true;
        todaysScheduledWorkouts.forEach(workout => {
          const count = getCountFromLogEntry(dayLog[workout.id]);
          monthlyReps += count;
          if (!workoutLogComplete(dayLog[workout.id], typeof dayLog[workout.id] === 'object' ? (dayLog[workout.id] as WorkoutLogEntry).goalAtTime : workout.dailyGoal)) {
            allGoalsMet = false;
          }
        });
        if (allGoalsMet && todaysScheduledWorkouts.length > 0) {
          monthlyCompletedDays++;
        }
      } else {
        // For past days: check only workouts that have logged reps
        const workoutsWithReps = workoutArray.filter(w => getCountFromLogEntry(dayLog[w.id]) > 0);
        if (workoutsWithReps.length > 0) {
          let allGoalsMet = true;
          workoutsWithReps.forEach(workout => {
            const logEntry = dayLog[workout.id];
            const count = getCountFromLogEntry(logEntry);
            const goalAtTime = typeof logEntry === 'object' ? logEntry.goalAtTime : workout.dailyGoal;
            monthlyReps += count;
            if (!workoutLogComplete(logEntry, goalAtTime)) {
              allGoalsMet = false;
            }
          });
          if (allGoalsMet) {
            monthlyCompletedDays++;
          }
        } else if (recoveryDays.includes(dateStr)) {
          // Count recovery days as completed (only if no workout was logged)
          monthlyCompletedDays++;
        }
      }
    }

    const monthlyConsistency = elapsedDaysInMonth > 0
      ? Math.max(0, Math.min((monthlyCompletedDays / elapsedDaysInMonth) * 100, 100))
      : 0;

    return {
      monthlyReps,
      monthlyCompletedDays,
      monthlyConsistency
    };
  };

  // Shared read-only calculation; history and consistency definitions are unchanged.
  const getTotalStats = () => getTotalWorkoutStats(data, () => localStorage.getItem('fitcircle_recovery_data'));

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

  // Routine management functions
  const addRoutine = (name: string, selectedDays: number[]) => {
    const id = Date.now().toString();
    const newRoutine: Routine = {
      id,
      name,
      selectedDays,
      createdAt: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      routines: { ...prev.routines, [id]: newRoutine }
    }));
    return id;
  };

  const updateRoutine = (routineId: string, name: string, selectedDays?: number[]) => {
    setData(prev => ({
      ...prev,
      routines: {
        ...prev.routines,
        [routineId]: { 
          ...prev.routines[routineId], 
          name,
          ...(selectedDays !== undefined ? { selectedDays } : {})
        }
      }
    }));
  };

  const deleteRoutine = (routineId: string) => {
    setData(prev => {
      const { [routineId]: removed, ...remainingRoutines } = prev.routines;
      
      // Remove routine assignment from workouts
      const updatedWorkouts = Object.fromEntries(
        Object.entries(prev.workouts).map(([id, workout]) => [
          id,
          workout.routineId === routineId 
            ? { ...workout, routineId: undefined }
            : workout
        ])
      );

      return {
        ...prev,
        routines: remainingRoutines,
        workouts: updatedWorkouts
      };
    });
  };

  const assignWorkoutToRoutine = (workoutId: string, routineId?: string) => {
    setData(prev => ({
      ...prev,
      workouts: {
        ...prev.workouts,
        [workoutId]: { ...prev.workouts[workoutId], routineId }
      }
    }));
  };

  const getRoutineArray = () => {
    return Object.values(data.routines || {});
  };

  const getWorkoutsByRoutine = (routineId?: string) => {
    return Object.values(data.workouts || {}).filter(workout => 
      routineId ? workout.routineId === routineId : !workout.routineId
    );
  };

  const getWorkoutsByDays = (selectedDays: number[]) => {
    return Object.values(data.workouts || {}).filter(workout => {
      // Handle workouts with no schedule (considered daily - all days)
      if (!workout.scheduledDays || workout.scheduledDays.length === 0) {
        return true;
      }
      // Check if any of the selected days match the workout's scheduled days
      return selectedDays.some(day => workout.scheduledDays!.includes(day));
    });
  };

  // Helper function to check if workout should be active on given day
  const isWorkoutActiveOnDay = (workout: Workout, dayOfWeek: number) => {
    if (!workout.scheduledDays || workout.scheduledDays.length === 0) {
      return true; // Every day if no schedule set
    }
    return workout.scheduledDays.includes(dayOfWeek);
  };



  return {
    workouts: data.workouts,
    routines: data.routines,
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
    getJournalEntryWithTimestamp,
    getAllJournalEntries,
    deleteJournalEntry,
    getMonthlyStats,
    getTotalStats,
    getIndividualWorkoutTotals,
    editWorkoutForDate,
    getWorkoutLogsForDate,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    assignWorkoutToRoutine,
    getRoutineArray,
    getWorkoutsByRoutine,
    getWorkoutsByDays,
    isWorkoutActiveOnDay,
  };
}
