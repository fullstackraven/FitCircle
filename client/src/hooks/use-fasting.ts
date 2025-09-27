import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getAllTimeFastingAverage } from '@/lib/date-utils';

export interface FastingLog {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  duration: number; // in minutes
  loggedAt: string;
}

export function useFasting() {
  const [logs, setLogs] = useState<FastingLog[]>(() => 
    safeParseJSON(localStorage.getItem(STORAGE_KEYS.FASTING), [])
  );

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FASTING, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save fasting data:', error);
    }
  }, [logs]);

  const addLog = (log: Omit<FastingLog, 'id' | 'loggedAt'>) => {
    const newLog: FastingLog = {
      ...log,
      id: Date.now().toString(),
      loggedAt: new Date().toISOString()
    };
    setLogs(prev => [...prev, newLog]);
  };

  const updateLog = (id: string, updates: Partial<FastingLog>) => {
    setLogs(prev => prev.map(log => 
      log.id === id ? { ...log, ...updates } : log
    ));
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  // Get last 10 logs fasting stats
  const getLast10LogsProgress = () => {
    // Get the most recent 10 logs regardless of date
    const recentLogs = logs
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, 10);
    
    let totalHours = 0;
    let fastingDays = 0;
    const dailyGoal = parseFloat(localStorage.getItem('fitcircle_goal_fasting') || '16'); // Default 16h
    const targetGoal = dailyGoal * 10; // 10 logs worth of daily goals
    
    // Calculate total hours from recent fasting logs
    recentLogs.forEach(log => {
      const startDateTime = new Date(`${log.startDate}T${log.startTime}`);
      const endDateTime = new Date(`${log.endDate}T${log.endTime}`);
      
      // Calculate total duration of this fast
      const fastDurationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      totalHours += fastDurationHours;
      if (fastDurationHours > 0) {
        fastingDays++;
      }
    });
    
    const averageHours = recentLogs.length > 0 ? totalHours / recentLogs.length : 0;
    const goalProgress = targetGoal > 0 ? Math.min((totalHours / targetGoal) * 100, 100) : 0;
    const remaining = Math.max(0, targetGoal - totalHours);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: Math.round(averageHours * 10) / 10,
      targetGoal,
      goalProgress: Math.round(goalProgress * 10) / 10,
      remaining: Math.round(remaining * 10) / 10,
      logsCount: recentLogs.length
    };
  };

  // Get all-time goal percentage (matches what the Fasting page goal modal shows)
  const getAllTimeGoalPercentage = (): number => {
    const goalHours = parseFloat(localStorage.getItem('fitcircle_goal_fasting') || '16');
    if (goalHours === 0) return 0;
    
    const { averageHours } = getAllTimeFastingAverage(logs);
    return Math.min(100, (averageHours / goalHours) * 100);
  };

  return {
    logs,
    hasUserGoal: Boolean(localStorage.getItem('fitcircle_goal_fasting')), // Flag indicating if user has set a goal
    addLog,
    updateLog,
    deleteLog,
    getLast10LogsProgress,
    getAllTimeGoalPercentage
  };
}