import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

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
    localStorage.setItem(STORAGE_KEYS.MEDITATION, JSON.stringify(logs));
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

  return {
    logs,
    addLog,
    updateLog,
    deleteLog
  };
}