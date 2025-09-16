import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

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

  // Get last 7 days fasting stats
  const getLast7DaysProgress = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Last 7 days including today
    
    let totalHours = 0;
    let fastingDays = 0;
    const dailyGoal = parseFloat(localStorage.getItem('fitcircle_goal_fasting') || '16'); // Default 16h
    const weeklyGoal = dailyGoal * 7; // 7 days worth of daily goals
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(sevenDaysAgo);
      checkDate.setDate(sevenDaysAgo.getDate() + i);
      const dateString = checkDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      const dayLogs = logs.filter(log => {
        const logStartDate = new Date(log.startDate).toLocaleDateString('en-CA');
        return logStartDate === dateString;
      });
      
      if (dayLogs.length > 0) {
        const dayHours = dayLogs.reduce((sum, log) => sum + (log.duration / 60), 0); // Convert minutes to hours
        totalHours += dayHours;
        fastingDays++;
      }
    }
    
    const averageHours = fastingDays > 0 ? totalHours / 7 : 0; // Average over 7 days (including zero days)
    const goalProgress = weeklyGoal > 0 ? Math.min((totalHours / weeklyGoal) * 100, 100) : 0;
    const remaining = Math.max(0, weeklyGoal - totalHours);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: Math.round(averageHours * 10) / 10,
      weeklyGoal,
      goalProgress: Math.round(goalProgress * 10) / 10,
      remaining: Math.round(remaining * 10) / 10
    };
  };

  return {
    logs,
    addLog,
    updateLog,
    deleteLog,
    getLast7DaysProgress
  };
}