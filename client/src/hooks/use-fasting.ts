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
      
      // Calculate how many hours of fasting occurred on this specific day
      let dayHours = 0;
      
      logs.forEach(log => {
        const startDateTime = new Date(`${log.startDate}T${log.startTime}`);
        const endDateTime = new Date(`${log.endDate}T${log.endTime}`);
        
        // Check if this fast overlaps with the current day
        const dayStart = new Date(checkDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Calculate overlap between fast period and this day
        const overlapStart = new Date(Math.max(startDateTime.getTime(), dayStart.getTime()));
        const overlapEnd = new Date(Math.min(endDateTime.getTime(), dayEnd.getTime()));
        
        if (overlapStart < overlapEnd) {
          const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
          dayHours += overlapMinutes / 60;
        }
      });
      
      if (dayHours > 0) {
        totalHours += dayHours;
        fastingDays++;
      }
    }
    
    const averageHours = totalHours / 7; // Average over 7 days (including zero days)
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

  // Get all-time goal percentage (matches what the Fasting page goal modal shows)
  const getAllTimeGoalPercentage = (): number => {
    const goalHours = parseFloat(localStorage.getItem('fitcircle_goal_fasting') || '16');
    if (goalHours === 0) return 0;
    
    const { averageHours } = getAllTimeFastingAverage(logs);
    return Math.min(100, (averageHours / goalHours) * 100);
  };

  return {
    logs,
    addLog,
    updateLog,
    deleteLog,
    getLast7DaysProgress,
    getAllTimeGoalPercentage
  };
}