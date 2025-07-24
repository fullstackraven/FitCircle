import { useState, useEffect } from 'react';

export interface FastingLog {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  duration: number; // in minutes
  loggedAt: string;
}

const STORAGE_KEY = 'fitcircle_fasting_logs';

export function useFasting() {
  const [logs, setLogs] = useState<FastingLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse fasting logs:', error);
      }
    }
    return [];
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
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

  return {
    logs,
    addLog,
    updateLog,
    deleteLog
  };
}