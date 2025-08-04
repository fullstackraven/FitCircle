import { useState, useEffect, useRef } from 'react';

export interface TimerState {
  totalTime: number; // in seconds
  remainingTime: number; // in seconds
  isRunning: boolean;
  isCompleted: boolean;
}

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    totalTime: 0,
    remainingTime: 0,
    isRunning: false,
    isCompleted: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerState.isRunning && timerState.remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newRemainingTime = prev.remainingTime - 1;
          
          if (newRemainingTime <= 0) {
            // Timer completed
            return {
              ...prev,
              remainingTime: 0,
              isRunning: false,
              isCompleted: true
            };
          }
          
          return {
            ...prev,
            remainingTime: newRemainingTime
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.remainingTime]);

  const startTimer = (minutes: number) => {
    const totalSeconds = minutes * 60;
    setTimerState({
      totalTime: totalSeconds,
      remainingTime: totalSeconds,
      isRunning: true,
      isCompleted: false
    });
  };

  const pauseTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const resumeTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true
    }));
  };

  const resetTimer = () => {
    setTimerState({
      totalTime: 0,
      remainingTime: 0,
      isRunning: false,
      isCompleted: false
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.remainingTime) / timerState.totalTime) * 100;
  };

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formatTime,
    getProgress
  };
}