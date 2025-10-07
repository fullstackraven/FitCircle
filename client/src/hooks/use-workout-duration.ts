import { useState, useCallback, useEffect } from 'react';
import { getTodayString } from '@/lib/date-utils';
import { safeParseJSON } from '@/lib/storage-utils';

interface WorkoutSession {
  date: string;
  startTime: number;
  endTime?: number;
  duration?: number; // in seconds
}

interface WorkoutDurationData {
  currentSession?: WorkoutSession;
  completedSessions: WorkoutSession[];
  isPaused?: boolean;
  pausedTime?: number; // total paused time in seconds
}

const defaultWorkoutDurationData: WorkoutDurationData = {
  completedSessions: []
};

const WORKOUT_DURATION_STORAGE_KEY = 'fitcircle_workout_duration_data';

export const useWorkoutDuration = () => {
  const [data, setData] = useState<WorkoutDurationData>(() => {
    const stored = localStorage.getItem(WORKOUT_DURATION_STORAGE_KEY);
    return stored ? safeParseJSON(stored, defaultWorkoutDurationData) : defaultWorkoutDurationData;
  });

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);

  // Load active session on mount
  useEffect(() => {
    if (data.currentSession && !data.currentSession.endTime) {
      setIsActive(true);
      setIsPaused(data.isPaused || false);
      const pausedTime = data.pausedTime || 0;
      const elapsed = Math.floor((Date.now() - data.currentSession.startTime) / 1000) - pausedTime;
      setCurrentTime(elapsed);
    }
  }, []);

  // Update timer when active and not paused
  useEffect(() => {
    if (!isActive || !data.currentSession || isPaused) return;

    const interval = setInterval(() => {
      if (data.currentSession) {
        const pausedTime = data.pausedTime || 0;
        const elapsed = Math.floor((Date.now() - data.currentSession.startTime) / 1000) - pausedTime;
        setCurrentTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, data.currentSession, data.pausedTime]);

  const saveData = useCallback((newData: WorkoutDurationData) => {
    setData(newData);
    localStorage.setItem(WORKOUT_DURATION_STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const startWorkout = useCallback(() => {
    const today = getTodayString();
    const now = Date.now();
    
    const newSession: WorkoutSession = {
      date: today,
      startTime: now
    };

    const newData = {
      ...data,
      currentSession: newSession
    };

    saveData(newData);
    setIsActive(true);
    setCurrentTime(0);
  }, [data, saveData]);

  const stopWorkout = useCallback(() => {
    if (!data.currentSession) return;

    const now = Date.now();
    const pausedTime = data.pausedTime || 0;
    const duration = Math.floor((now - data.currentSession.startTime) / 1000) - pausedTime;
    
    const completedSession: WorkoutSession = {
      ...data.currentSession,
      endTime: now,
      duration
    };

    const newData = {
      ...data,
      currentSession: undefined,
      completedSessions: [...data.completedSessions, completedSession],
      isPaused: false,
      pausedTime: 0
    };

    saveData(newData);
    setIsActive(false);
    setIsPaused(false);
    setCurrentTime(0);
    setPauseStartTime(null);
  }, [data, saveData]);

  const resetWorkout = useCallback(() => {
    if (!data.currentSession) return;

    const newData = {
      ...data,
      currentSession: undefined,
      isPaused: false,
      pausedTime: 0
    };

    saveData(newData);
    setIsActive(false);
    setIsPaused(false);
    setCurrentTime(0);
    setPauseStartTime(null);
  }, [data, saveData]);

  const pauseWorkout = useCallback(() => {
    if (!data.currentSession || isPaused) return;

    const now = Date.now();
    setPauseStartTime(now);
    setIsPaused(true);

    const newData = {
      ...data,
      isPaused: true
    };

    saveData(newData);
  }, [data, isPaused, saveData]);

  const resumeWorkout = useCallback(() => {
    if (!data.currentSession || !isPaused || !pauseStartTime) return;

    const now = Date.now();
    const additionalPausedTime = Math.floor((now - pauseStartTime) / 1000);
    const totalPausedTime = (data.pausedTime || 0) + additionalPausedTime;

    const newData = {
      ...data,
      isPaused: false,
      pausedTime: totalPausedTime
    };

    saveData(newData);
    setIsPaused(false);
    setPauseStartTime(null);
  }, [data, isPaused, pauseStartTime, saveData]);

  const getWorkoutDurationForDate = useCallback((dateString: string): number => {
    const sessions = data.completedSessions.filter(session => session.date === dateString);
    return sessions.reduce((total, session) => total + (session.duration || 0), 0);
  }, [data.completedSessions]);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTodaysWorkoutDuration = useCallback((): number => {
    const today = getTodayString();
    return getWorkoutDurationForDate(today);
  }, [getWorkoutDurationForDate]);

  const getCurrentSessionDuration = useCallback((): string => {
    return formatDuration(currentTime);
  }, [currentTime, formatDuration]);

  const updateWorkoutDurationForDate = useCallback((dateString: string, newDurationSeconds: number) => {
    // Validate duration is positive
    if (newDurationSeconds <= 0) return;

    // Find all sessions for this date
    const sessionsForDate = data.completedSessions.filter(session => session.date === dateString);
    
    if (sessionsForDate.length === 0) return;

    // Get the earliest session's start time to preserve the original start
    const earliestSession = sessionsForDate.reduce((earliest, current) => 
      (current.startTime < earliest.startTime) ? current : earliest
    );

    // Create a single consolidated session with the new duration
    const updatedSession: WorkoutSession = {
      date: dateString,
      startTime: earliestSession.startTime,
      duration: newDurationSeconds,
      endTime: earliestSession.startTime + (newDurationSeconds * 1000)
    };

    // Remove all sessions for this date and add the updated one
    const sessionsWithoutDate = data.completedSessions.filter(session => session.date !== dateString);
    const updatedSessions = [...sessionsWithoutDate, updatedSession];

    const newData = {
      ...data,
      completedSessions: updatedSessions
    };

    saveData(newData);
  }, [data, saveData]);

  return {
    isActive,
    isPaused,
    currentTime,
    startWorkout,
    stopWorkout,
    resetWorkout,
    pauseWorkout,
    resumeWorkout,
    getWorkoutDurationForDate,
    updateWorkoutDurationForDate,
    formatDuration,
    getTodaysWorkoutDuration,
    getCurrentSessionDuration,
    hasActiveSession: !!data.currentSession && !data.currentSession.endTime
  };
};