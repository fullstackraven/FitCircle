import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString, getDateString } from '@/lib/date-utils';

export interface MeditationLog {
  id: string;
  date: string;
  time: string;
  duration: number; // in minutes
  completedAt: string;
}

export function useMeditation() {
  const [logs, setLogs] = useState<MeditationLog[]>(() => 
    safeParseJSON(localStorage.getItem(STORAGE_KEYS.MEDITATION), [])
  );

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDITATION, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save meditation data:', error);
    }
  }, [logs]);

  const addLog = (log: Omit<MeditationLog, 'id' | 'completedAt'>) => {
    const newLog: MeditationLog = {
      ...log,
      id: Date.now().toString(),
      completedAt: new Date().toISOString()
    };
    setLogs(prev => [...prev, newLog]);
  };

  const updateLog = (id: string, updates: Partial<MeditationLog>) => {
    setLogs(prev => prev.map(log => 
      log.id === id ? { ...log, ...updates } : log
    ));
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  // Get today's total meditation minutes
  const getTodayMinutes = (): number => {
    const today = new Date().toLocaleDateString('en-US'); // MM/DD/YYYY format
    const todayLogs = logs.filter(log => {
      // Direct string comparison using MM/DD/YYYY format
      return log.date === today;
    });
    
    return todayLogs.reduce((total, log) => total + log.duration, 0);
  };

  // Get daily goal from localStorage (shared with Goals page)
  const getDailyGoal = (): number => {
    const goalFromGoalsPage = localStorage.getItem('fitcircle_goal_meditation');
    return goalFromGoalsPage ? parseFloat(goalFromGoalsPage) : 20; // Default 20 minutes
  };

  // Get progress percentage
  const getProgressPercentage = (): number => {
    const todayMinutes = getTodayMinutes();
    const dailyGoal = getDailyGoal();
    if (dailyGoal === 0) return 0;
    return Math.min((todayMinutes / dailyGoal) * 100, 100);
  };

  // Check if goal is reached
  const isGoalReached = (): boolean => {
    return getTodayMinutes() >= getDailyGoal();
  };

  // Get last 7 days meditation stats
  const getLast7DaysProgress = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Last 7 days including today
    
    let totalMinutes = 0;
    const dailyGoal = getDailyGoal();
    const weeklyGoal = dailyGoal * 7; // 7 days worth of daily goals
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(sevenDaysAgo);
      checkDate.setDate(sevenDaysAgo.getDate() + i);
      const dateString = checkDate.toLocaleDateString('en-US'); // MM/DD/YYYY format
      
      const dayLogs = logs.filter(log => {
        // Direct string comparison using MM/DD/YYYY format
        return log.date === dateString;
      });
      
      totalMinutes += dayLogs.reduce((sum, log) => sum + log.duration, 0);
    }
    
    const averageMinutes = totalMinutes / 7; // Average over 7 days (including zero days)
    const goalProgress = weeklyGoal > 0 ? Math.min((totalMinutes / weeklyGoal) * 100, 100) : 0;
    const remaining = Math.max(0, weeklyGoal - totalMinutes);
    
    return {
      totalMinutes: Math.round(totalMinutes),
      averageMinutes: Math.round(averageMinutes * 10) / 10,
      weeklyGoal,
      goalProgress: Math.round(goalProgress * 10) / 10, // Round to 1 decimal
      remaining: Math.round(remaining)
    };
  };

  // Get all-time goal percentage for goal modal
  const getAllTimeGoalPercentage = (): number => {
    const goalMinutes = getDailyGoal();
    if (goalMinutes === 0 || logs.length === 0) return 0;
    
    // Group logs by date and calculate daily totals
    const dailyTotals: { [date: string]: number } = {};
    logs.forEach(session => {
      const sessionDate = new Date(session.date);
      const dateKey = sessionDate.toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.duration;
    });
    
    // Calculate average daily minutes across all days with meditation
    const allDailyMinutes = Object.values(dailyTotals);
    const averageMinutes = allDailyMinutes.reduce((sum, minutes) => sum + minutes, 0) / allDailyMinutes.length;
    
    return Math.min((averageMinutes / goalMinutes) * 100, 100);
  };

  return {
    logs,
    hasUserGoal: Boolean(localStorage.getItem('fitcircle_goal_meditation')), // Flag indicating if user has set a goal
    addLog,
    updateLog,
    deleteLog,
    getTodayMinutes,
    getDailyGoal,
    getProgressPercentage,
    isGoalReached,
    getLast7DaysProgress,
    getAllTimeGoalPercentage
  };
}