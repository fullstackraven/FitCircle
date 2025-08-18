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
  const [currentTime, setCurrentTime] = useState(0);

  // Load active session on mount
  useEffect(() => {
    if (data.currentSession && !data.currentSession.endTime) {
      setIsActive(true);
      const elapsed = Math.floor((Date.now() - data.currentSession.startTime) / 1000);
      setCurrentTime(elapsed);
    }
  }, []);

  // Update timer when active
  useEffect(() => {
    if (!isActive || !data.currentSession) return;

    const interval = setInterval(() => {
      if (data.currentSession) {
        const elapsed = Math.floor((Date.now() - data.currentSession.startTime) / 1000);
        setCurrentTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, data.currentSession]);

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
    const duration = Math.floor((now - data.currentSession.startTime) / 1000);
    
    const completedSession: WorkoutSession = {
      ...data.currentSession,
      endTime: now,
      duration
    };

    const newData = {
      ...data,
      currentSession: undefined,
      completedSessions: [...data.completedSessions, completedSession]
    };

    saveData(newData);
    setIsActive(false);
    setCurrentTime(0);
  }, [data, saveData]);

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

  return {
    isActive,
    currentTime,
    startWorkout,
    stopWorkout,
    getWorkoutDurationForDate,
    formatDuration,
    getTodaysWorkoutDuration,
    getCurrentSessionDuration,
    hasActiveSession: !!data.currentSession && !data.currentSession.endTime
  };
};