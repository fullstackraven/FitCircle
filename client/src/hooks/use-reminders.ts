import { useState, useEffect } from 'react';
import { useIndexedDB } from './use-indexed-db';

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { isReady, getItem, setItem, removeItem } = useIndexedDB();

  // Load data from IndexedDB on mount
  useEffect(() => {
    if (!isReady) return;

    const loadReminders = async () => {
      try {
        const savedReminders = await getItem<any[]>('fitcircle_reminders');
        if (savedReminders) {
          // Filter out any old notes data and keep only reminders
          const reminderItems = savedReminders.filter((item: any) => 
            !item.type || item.type === 'reminder'
          ).map((item: any) => ({
            id: item.id,
            text: item.text,
            completed: item.completed || false,
            createdAt: item.createdAt
          }));
          setReminders(reminderItems);
        }
      } catch (error) {
        console.error('Failed to load reminders:', error);
      }
    };

    loadReminders();
  }, [isReady, getItem]);

  // Save to IndexedDB whenever reminders change
  useEffect(() => {
    if (!isReady) return;

    const saveReminders = async () => {
      try {
        await setItem('fitcircle_reminders', reminders);
        // Clean up old notes data
        await removeItem('fitcircle_notes');
      } catch (error) {
        console.error('Failed to save reminders:', error);
      }
    };

    saveReminders();
  }, [reminders, isReady, setItem, removeItem]);

  const addReminder = (text: string) => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setReminders(prev => [...prev, newReminder]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id ? { ...reminder, ...updates } : reminder
    ));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, completed: !reminder.completed }
        : reminder
    ));
  };

  return {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder
  };
}