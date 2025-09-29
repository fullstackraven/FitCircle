import { useState, useEffect } from 'react';
import { safeParseJSON, STORAGE_KEYS } from '@/lib/storage-utils';

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      const parsed = safeParseJSON(saved, []);
      
      // Filter out any old notes data and keep only reminders
      if (Array.isArray(parsed)) {
        return parsed.filter((item: any) => 
          !item.type || item.type === 'reminder'
        ).map((item: any) => ({
          id: item.id || Date.now().toString(),
          text: item.text || '',
          completed: item.completed || false,
          createdAt: item.createdAt || new Date().toISOString()
        }));
      }
      return [];
    } catch (error) {
      console.error('Error initializing reminders:', error);
      return [];
    }
  });

  // Save to localStorage whenever reminders change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      // Clean up old notes data
      localStorage.removeItem('fitcircle_notes');
      console.log('Reminders saved:', reminders.length, 'items');
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }, [reminders]);

  const addReminder = (text: string, insertAfterIndex?: number) => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setReminders(prev => {
      if (insertAfterIndex !== undefined && insertAfterIndex >= 0 && insertAfterIndex < prev.length) {
        // Insert after the specified index
        const newArray = [...prev];
        newArray.splice(insertAfterIndex + 1, 0, newReminder);
        console.log('Inserting reminder at index:', insertAfterIndex + 1, 'Array length:', prev.length, 'text:', text);
        return newArray;
      } else {
        // Default behavior: add to end
        console.log('Adding reminder to end, insertAfterIndex was:', insertAfterIndex, 'Array length:', prev?.length);
        return [...prev, newReminder];
      }
    });
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