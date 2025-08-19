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

  return {
    logs,
    addLog,
    updateLog,
    deleteLog
  };
}