import { useState, useEffect } from 'react';
import { useIndexedDB } from './use-indexed-db';

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
  const [logs, setLogs] = useState<FastingLog[]>([]);
  const { isReady, getItem, setItem } = useIndexedDB();

  // Load data from IndexedDB on mount
  useEffect(() => {
    if (!isReady) return;

    const loadLogs = async () => {
      try {
        const savedLogs = await getItem<FastingLog[]>(STORAGE_KEY);
        if (savedLogs) {
          setLogs(savedLogs);
        }
      } catch (error) {
        console.error('Failed to load fasting logs:', error);
      }
    };

    loadLogs();
  }, [isReady, getItem]);

  // Save data to IndexedDB whenever it changes
  useEffect(() => {
    if (!isReady) return;

    const saveLogs = async () => {
      try {
        await setItem(STORAGE_KEY, logs);
      } catch (error) {
        console.error('Failed to save fasting logs:', error);
      }
    };

    saveLogs();
  }, [logs, isReady, setItem]);

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