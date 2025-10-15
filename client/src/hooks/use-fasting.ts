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
    // Get the last 10 calendar days (today and previous 9 days)
    const last10Days: string[] = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      last10Days.push(`${year}-${month}-${day}`);
    }
    
    // For each of the last 10 days, calculate total fasting hours (including partial hours from multi-day fasts)
    const dailyHours = last10Days.map(dateKey => {
      let totalHoursForDay = 0;
      
      // Check each fast to see if it overlaps with this day
      logs.forEach(log => {
        const startDateTime = new Date(`${log.startDate}T${log.startTime}`);
        const endDateTime = new Date(`${log.endDate}T${log.endTime}`);
        
        // Get the start and end of the current day
        const dayStart = new Date(`${dateKey}T00:00:00`);
        const dayEnd = new Date(`${dateKey}T23:59:59.999`);
        
        // Check if the fast overlaps with this day
        if (startDateTime <= dayEnd && endDateTime >= dayStart) {
          // Calculate the overlapping period
          const overlapStart = startDateTime > dayStart ? startDateTime : dayStart;
          const overlapEnd = endDateTime < dayEnd ? endDateTime : dayEnd;
          
          // Calculate hours for this day
          const hoursForDay = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          totalHoursForDay += hoursForDay;
        }
      });
      
      return totalHoursForDay;
    });
    
    const totalHours = dailyHours.reduce((sum, hours) => sum + hours, 0);
    const dailyGoal = parseFloat(localStorage.getItem('fitcircle_goal_fasting') || '16'); // Default 16h
    const targetGoal = dailyGoal * 10; // 10 days worth of daily goals
    const averageHours = totalHours / 10; // Always divide by 10 days
    const goalProgress = targetGoal > 0 ? Math.min((totalHours / targetGoal) * 100, 100) : 0;
    const remaining = Math.max(0, targetGoal - totalHours);
    
    // Count how many days actually have fasting hours
    const logsCount = dailyHours.filter(hours => hours > 0).length;
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: Math.round(averageHours * 10) / 10,
      targetGoal,
      goalProgress: Math.round(goalProgress * 10) / 10,
      remaining: Math.round(remaining * 10) / 10,
      logsCount // Number of days with actual fasting hours (for display purposes)
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