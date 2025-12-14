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

  // Get last 10 CALENDAR DAYS fasting stats (not just logged days)
  // Days without logs count as 0
  const getLast10LogsProgress = () => {
    const today = new Date();
    let totalHours = 0;
    let daysWithLogs = 0;

    // Check each of the last 10 calendar days using LOCAL date strings
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      // Use local date formatting for consistent timezone handling (not toISOString which is UTC)
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Find logs that ended on this date
      const dayLogs = logs.filter(log => log.endDate === dateStr);
      
      // Sum up hours for fasts that ended on this day
      dayLogs.forEach(log => {
        const startDateTime = new Date(`${log.startDate}T${log.startTime}`);
        const endDateTime = new Date(`${log.endDate}T${log.endTime}`);
        const hours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
        if (hours > 0 && hours < 48) { // Valid fasting duration
          totalHours += hours;
        }
      });
      
      if (dayLogs.length > 0) {
        daysWithLogs++;
      }
      // Days without logs contribute 0 (already 0)
    }

    const dailyGoal = parseFloat(localStorage.getItem('fitcircle_goal_fasting') || '16');
    const targetGoal = dailyGoal * 10; // 10 days worth of daily goals
    // Always divide by 10 calendar days, not just logged days
    const averageHours = totalHours / 10;
    const goalProgress = targetGoal > 0 ? Math.min((totalHours / targetGoal) * 100, 100) : 0;
    const remaining = Math.max(0, targetGoal - totalHours);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: Math.round(averageHours * 10) / 10,
      targetGoal,
      goalProgress: Math.round(goalProgress * 10) / 10,
      remaining: Math.round(remaining * 10) / 10,
      logsCount: daysWithLogs
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