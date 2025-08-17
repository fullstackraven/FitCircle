import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/keys';
import { get, set } from '@/lib/safeStorage';

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
  const [logs, setLogs] = useState<FastingLog[]>(() => {
    const stored = get(STORAGE_KEYS.fasting);
    return stored || [];
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    set(STORAGE_KEYS.fasting, logs);
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