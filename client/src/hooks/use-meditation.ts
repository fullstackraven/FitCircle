import { useState, useEffect } from 'react';

export interface MeditationLog {
  id: string;
  date: string;
  time: string;
  duration: number; // in minutes
  completedAt: string;
}

const STORAGE_KEY = 'fitcircle_meditation_logs';

export function useMeditation() {
  const [logs, setLogs] = useState<MeditationLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse meditation logs:', error);
      }
    }
    return [];
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
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