import { useState, useEffect } from 'react';
import { useIndexedDB } from './use-indexed-db';

export interface MeditationLog {
  id: string;
  date: string;
  time: string;
  duration: number; // in minutes
  completedAt: string;
}

const STORAGE_KEY = 'fitcircle_meditation_logs';

export function useMeditation() {
  const [logs, setLogs] = useState<MeditationLog[]>([]);
  const { isReady, getItem, setItem } = useIndexedDB();

  // Load data from IndexedDB on mount
  useEffect(() => {
    if (!isReady) return;

    const loadLogs = async () => {
      try {
        const savedLogs = await getItem<MeditationLog[]>(STORAGE_KEY);
        if (savedLogs) {
          setLogs(savedLogs);
        }
      } catch (error) {
        console.error('Failed to load meditation logs:', error);
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
        console.error('Failed to save meditation logs:', error);
      }
    };

    saveLogs();
  }, [logs, isReady, setItem]);

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