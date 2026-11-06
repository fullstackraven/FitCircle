import { retireRoutineVariations, preservePlacementDetails, plannedExercises, plannedWithActivity, orderedRoutines, routineExercises, historicalDefinitions, historicalActivities, loggedExercises, recordedReps, recordedSeconds, prescriptionFor, totalTarget, validPrescription, newPlanningId, type ExerciseDetails, type ExercisePlacement, type TrainingVariation } from '@/lib/routine-planning';
import { useWorkoutStore, commitWorkouts } from '@/lib/workout-store';
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

export interface Workout extends ExerciseDetails {
  catalogId?: string;
  catalogHidden?: boolean;
  exerciseId?: string;
  placementId?: string;
  archived?: boolean;
  routineNames?: string[];
  id: string;
  name: string;
  color: string;
  count: number;
  dailyGoal: number;
  setsGoal?: number;
  weightLbs?: number; // Optional weight in pounds
  goalHistory?: GoalHistoryEntry[]; // Track all goal changes over time
  scheduledDays?: number[]; // Legacy backup metadata only; routines own scheduling.
  routineId?: string; // Optional routine assignment
}

export interface WorkoutLogEntry {
  exerciseIdAtTime?: string;
  routineIdAtTime?: string;
  placementIdAtTime?: string;
  targetTypeAtTime?: 'repetitions' | 'duration';
  nameAtTime?: string;
  colorAtTime?: string;
  routineNamesAtTime?: string[];
  count: number;
  carriedReps?: number;
  completedSets?: number;
  setsGoalAtTime?: number;
  goalAtTime: number; // Store the goal that was in effect when this workout was logged
}

export interface DailyLog {
  [workoutId: string]: number | WorkoutLogEntry;
}

export interface Routine {
  placements?: ExercisePlacement[];
  description?: string;
  /** Retained only for legacy backup compatibility; active targets are materialized on read. */
  variations?: TrainingVariation[];
  activeVariationId?: string;
  id: string;
  name: string;
  selectedDays: number[]; // Array of day indices (0=Sunday, 1=Monday, etc.)
  createdAt: string;
}

export interface WorkoutData {
  routineSchedulingVersion?: 1;
  archivedWorkouts?: Record<string, Workout>;
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
  const data = useWorkoutStore();
  const setData = (update: WorkoutData | ((previous: WorkoutData) => WorkoutData)) => commitWorkouts(previous => typeof update === 'function' ? update(previous) : update);

  // Helper function to extract count from log entry
  const getCountFromLogEntry = (logEntry: number | WorkoutLogEntry | undefined): number => {
    if (!logEntry) return 0;
    return typeof logEntry === 'object' ? logEntry.count : logEntry;
  };

  // Reset daily data if date has changed
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayString();
      if (data.lastDate && data.lastDate !== today) {
        setData(prev => prev.lastDate === today ? prev : ({
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
    
    const interval = setInterval(checkDateChange, 60 * 1000);
    const nextMidnight = new Date(); nextMidnight.setHours(24,0,0,0);
    const midnight = setTimeout(checkDateChange, nextMidnight.getTime() - Date.now());
    window.addEventListener('focus', checkDateChange);
    return () => { clearInterval(interval); clearTimeout(midnight); window.removeEventListener('focus',checkDateChange); };
  }, [data.lastDate]);

  const addWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[], routineId?: string, setsGoal = 1) => {
    if (!name.trim() || !validWorkoutTargets(dailyGoal, setsGoal)) return false;
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

    return setData(prev => ({
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
    return setData(prev => {
      const workout = plannedWithActivity(prev, new Date().getDay(), today).find(w => w.id === workoutId) ?? prev.workouts[workoutId];
      if (!workout) return prev;
      const entry = prev.dailyLogs[today]?.[workoutId];
      const next = stepWorkout(workout, entry, direction);
      if (direction < 0 && !entry) return prev;
      return { ...prev, lastDate: today,
        workouts: prev.workouts[workoutId] ? { ...prev.workouts, [workoutId]: { ...prev.workouts[workoutId], count: next.count } } : prev.workouts,
        dailyLogs: { ...prev.dailyLogs, [today]: { ...prev.dailyLogs[today], [workoutId]: next } }
      };
    });
  };
  const incrementWorkout = (id: string) => changeWorkout(id, 1);
  const decrementWorkout = (id: string) => changeWorkout(id, -1);

  const getTodaysTotals = () => {
    const today = getTodayString();
    const todayLog = data.dailyLogs[today] || {};

    return plannedWithActivity(data,new Date().getDay(),today).map(workout => {
      const logEntry = todayLog[workout.id];
      const count = typeof logEntry === 'object' ? logEntry.count : (logEntry || 0);
      return {
        ...workout,
        routineNames: typeof logEntry==='object' ? logEntry.routineNamesAtTime??workout.routineNames : workout.routineNames,
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
          return sum + recordedReps(logEntry);
        }
        return sum;
      }, 0);

      return {
        date: formattedDate,
        dateString,
        totalReps,
        totalSeconds: Object.values(dayLog).reduce<number>((sum, entry) => sum + recordedSeconds(entry), 0),
        workouts: loggedExercises(data, dateString).map(workout => ({
          ...workout,
          routineNames: typeof dayLog[workout.id]==='object'?(dayLog[workout.id] as WorkoutLogEntry).routineNamesAtTime:undefined,
          name: typeof dayLog[workout.id]==='object'?(dayLog[workout.id] as WorkoutLogEntry).nameAtTime??workout.name:workout.name,
          count: getCountFromLogEntry(dayLog[workout.id]),
          progress: workoutProgress(workout, dayLog[workout.id])
        }))
      };
    }).filter(day => day.totalReps > 0 || day.totalSeconds > 0);
  };

  const getAvailableColors = () => {
    return WORKOUT_COLORS;
  };

  const getWorkoutArray = () => {
    return Object.values(data.workouts || {}).filter(w => !w.archived);
  };

  // Helper function to get the goal that was in effect on a specific date
  const getGoalForDate = (workoutId: string, dateStr: string): number => {
    const workout = data.workouts[workoutId] ?? data.archivedWorkouts?.[workoutId];
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
    return setData(prev => {
      const currentWorkout = prev.workouts[workoutId];
      if (!currentWorkout) return prev;
      const reps = newGoal ?? currentWorkout.dailyGoal;
      const sets = setsGoal ?? currentWorkout.setsGoal ?? 1;
      if (!validWorkoutTargets(reps, sets)) return prev;
      if (name !== undefined && !name.trim()) return prev;
      const today = getTodayString();
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
        dailyLogs: { ...(isGoalChanged ? Object.fromEntries(Object.entries(prev.dailyLogs).map(([date, log]) => [date,
          typeof log[workoutId] === 'number' && log[workoutId] > 0
            ? { ...log, [workoutId]: { count:log[workoutId], goalAtTime:currentWorkout.dailyGoal } } : log
        ])) : prev.dailyLogs) },
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

  const deleteWorkout = (workoutId: string) => setData(prev => {
    const removed=prev.workouts[workoutId]; if(!removed)return prev;
    const {[workoutId]:_,...workouts}=prev.workouts;
    return {...prev,workouts,archivedWorkouts:{...prev.archivedWorkouts,[workoutId]:removed},routines:Object.fromEntries(Object.entries(prev.routines).map(([id,r])=>[id,{...r,placements:r.placements?.filter(p=>p.exerciseId!==workoutId)}]))};
  });

  const canAddMoreWorkouts = () => {
    return true; // No limit on number of workouts
  };

  const editWorkoutForDate = (workoutId: string, dateString: string, newCount: number) => {
    setData(prev => {
      const entry = prev.dailyLogs[dateString]?.[workoutId];
      const goal = typeof entry === 'object' ? entry.goalAtTime : getGoalForDate(workoutId, dateString);
      if (!Number.isInteger(newCount) || newCount < 0 || (isSetLog(entry) && newCount > entry.setsGoalAtTime)) return prev;
      const next = isSetLog(entry)
        ? { ...entry, completedSets:newCount, count:(entry.carriedReps ?? 0) + repsForSets(newCount,entry.goalAtTime,entry.setsGoalAtTime) }
        : { ...(typeof entry === 'object' ? entry : {}), count:newCount, goalAtTime:goal };
      return { ...prev,
        workouts: dateString === getTodayString() && prev.workouts[workoutId] ? { ...prev.workouts, [workoutId]: { ...prev.workouts[workoutId], count:next.count } } : prev.workouts,
        dailyLogs: { ...prev.dailyLogs, [dateString]: { ...prev.dailyLogs[dateString], [workoutId]:next } }
      };
    });

    // Trigger re-render for any components listening to workout changes
    window.dispatchEvent(new CustomEvent('workoutDataChanged'));
  };

  const getWorkoutLogsForDate = (dateString: string) => {
    const dayLog = data.dailyLogs[dateString] || {};
    return loggedExercises(data, dateString).map(workout => ({
      ...workout,
      name: typeof dayLog[workout.id]==='object' ? (dayLog[workout.id] as WorkoutLogEntry).nameAtTime??workout.name : workout.name,
      count: getCountFromLogEntry(dayLog[workout.id]),
      progress: workoutProgress(workout, dayLog[workout.id])
    }));
  };

  // Journal actions report durable success before the editor leaves its draft.
  const persistJournal = (update: (previous: WorkoutData) => WorkoutData) => commitWorkouts(update);
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
    const workoutArray = historicalActivities(data);
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
        const todaysScheduledWorkouts = plannedWithActivity(data,todayDayOfWeek,dateStr);
        
        let allGoalsMet = true;
        todaysScheduledWorkouts.forEach(workout => {
          const count = getCountFromLogEntry(dayLog[workout.id]);
          monthlyReps += recordedReps(dayLog[workout.id]);
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
            monthlyReps += recordedReps(dayLog[workout.id]);
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
    const workoutArray = historicalDefinitions(data);
    
    if (workoutArray.length === 0) {
      return [];
    }
    
    return workoutArray.map(workout => ({
      id: workout.id,
      name: workout.name,
      color: workout.color,
      totalSeconds: Object.values(data.dailyLogs || {}).reduce((sum, log) => sum + Object.entries(log).reduce((n,[id,entry])=>n+((typeof entry==='object' ? entry.exerciseIdAtTime??id : id)===workout.id ? recordedSeconds(entry) : 0),0), 0),
      totalReps: Object.values(data.dailyLogs || {})
        .reduce((total, dayLog) => total + Object.entries(dayLog).reduce((n,[id,entry])=>n+((typeof entry==='object' ? entry.exerciseIdAtTime??id : id)===workout.id ? recordedReps(entry) : 0),0), 0)
    }));
  };

  // Routine management functions
  const addRoutine = (name: string, selectedDays: number[], details: Partial<Routine> = {}) => {
    const id = newPlanningId();
    const newRoutine: Routine = {
      id,
      name,
      selectedDays,
      ...details,
      placements: details.placements ?? [],
      createdAt: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      routines: { ...prev.routines, [id]: newRoutine }
    }));
    return id;
  };

  const updateRoutine = (routineId: string, name: string, selectedDays?: number[], details: Partial<Routine> = {}) => {
    setData(prev => ({
      ...prev,
      routines: {
        ...prev.routines,
        [routineId]: { 
          ...prev.routines[routineId], 
          ...details,
          name,
          ...(selectedDays !== undefined ? { selectedDays } : {})
        }
      }
    }));
  };

  const deleteRoutine = (routineId: string) => {
    return setData(prev => {
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

  const getRoutineArray = () => {
    return orderedRoutines(data);
  };

  const getWorkoutsByRoutine = (routineId?: string) => routineId && data.routines[routineId] ? routineExercises(data,data.routines[routineId]) : getWorkoutArray().filter(w=>!Object.values(data.routines).some(r=>r.placements?.some(p=>p.exerciseId===w.id)));
  const getWorkoutsByDays = (days: number[]) => [...new Map(days.flatMap(day=>plannedExercises(data,day)).map(w=>[w.id,w])).values()];
  const isWorkoutActiveOnDay = (workout: Workout, day: number) => plannedExercises(data,day).some(w=>w.id===workout.id || w.exerciseId===workout.id);
  const saveExercise = (exercise: Workout) => {
    const p=prescriptionFor(exercise);
    if(!exercise.name.trim() || !validPrescription(p) || (exercise.weightLbs !== undefined && (!Number.isFinite(exercise.weightLbs)||exercise.weightLbs<0)))return false;
    return setData(prev=>{
      const old=prev.workouts[exercise.id];
      const dailyLogs=old && (old.dailyGoal!==totalTarget(p)||prescriptionFor(old).targetType!==p.targetType) ? Object.fromEntries(Object.entries(prev.dailyLogs).map(([date,log])=>[date,typeof log[exercise.id]==='number'?{...log,[exercise.id]:{count:log[exercise.id] as number,goalAtTime:old.dailyGoal,targetTypeAtTime:'repetitions' as const}}:log])) : prev.dailyLogs;
      return {...prev,dailyLogs,workouts:{...prev.workouts,[exercise.id]:{...exercise,dailyGoal:totalTarget(p),setsGoal:p.sets,count:prev.workouts[exercise.id]?.count??exercise.count}}};
    });
  };
  const saveExerciseTemplate = (exercise: Workout) => {
    if (!exercise.name.trim() || !validPrescription(prescriptionFor(exercise)) || (exercise.weightLbs !== undefined && (!Number.isFinite(exercise.weightLbs) || exercise.weightLbs < 0))) return false;
    return setData(prev => {
      const old = prev.workouts[exercise.id];
      const changedTarget = old && (old.dailyGoal !== exercise.dailyGoal || prescriptionFor(old).targetType !== prescriptionFor(exercise).targetType);
      const dailyLogs = changedTarget ? Object.fromEntries(Object.entries(prev.dailyLogs).map(([date,day]) => [date,
        typeof day[exercise.id] === 'number' ? { ...day, [exercise.id]: {count:day[exercise.id] as number,goalAtTime:old.dailyGoal,targetTypeAtTime:'repetitions' as const,nameAtTime:old.name,colorAtTime:old.color,exerciseIdAtTime:old.id} } : day
      ])) : prev.dailyLogs;
      return { ...prev, dailyLogs, workouts: { ...prev.workouts, [exercise.id]: exercise },
        routines: old ? Object.fromEntries(Object.entries(prev.routines).map(([id,r]) => [id, { ...r,
          placements: r.placements?.map(p => p.exerciseId === old.id ? preservePlacementDetails(p, old) : p) }])) : prev.routines };
    });
  };
  const hideExerciseTemplate = (id: string) => setData(prev => prev.workouts[id]
    ? { ...prev, workouts: { ...prev.workouts, [id]: { ...prev.workouts[id], catalogHidden: true } } } : prev);
  const saveRoutineExercise = (routine: Routine, placement: ExercisePlacement, definition?: Workout) => setData(prev => {
    if (!prev.routines[routine.id] || !routine.name.trim() || !validPrescription(placement.prescription) || (!definition && !prev.workouts[placement.exerciseId]) || (definition && (prev.workouts[definition.id] || definition.id !== placement.exerciseId))) return prev;
    const next = { ...routine, placements: routine.placements?.some(p => p.id === placement.id)
      ? routine.placements.map(p => p.id === placement.id ? placement : p) : [...routine.placements ?? [], placement] };
    return { ...prev, workouts: definition ? { ...prev.workouts, [definition.id]: definition } : prev.workouts,
      routines: { ...prev.routines, [routine.id]: retireRoutineVariations(next) } };
  });
  const saveRoutinePlan = (routine: Routine) => setData(prev=>{
    if(!routine.name.trim() || !routine.selectedDays.length || routine.selectedDays.some(d=>!Number.isInteger(d)||d<0||d>6) || routine.placements?.some(p=>!prev.workouts[p.exerciseId]||!validPrescription(p.prescription)) || new Set(routine.placements?.map(p=>p.id)).size !== routine.placements?.length)return prev;
    return {...prev,routines:{...prev.routines,[routine.id]:retireRoutineVariations(routine)}};
  });



  return {
    workoutData: data,
    saveExercise, saveRoutinePlan, saveExerciseTemplate, hideExerciseTemplate, saveRoutineExercise,
    getPlannedExercises: (day: number) => plannedExercises(data,day),
    getHistoricalWorkoutArray: () => historicalActivities(data),
    getDurationTotals: () => Object.values(data.dailyLogs).reduce((total,log)=>total+Object.values(log).reduce<number>((sum,e)=>sum+recordedSeconds(e),0),0),
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
    getRoutineArray,
    getWorkoutsByRoutine,
    getWorkoutsByDays,
    isWorkoutActiveOnDay,
  };
}
