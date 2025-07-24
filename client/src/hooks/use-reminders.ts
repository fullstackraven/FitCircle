import { useState, useEffect } from 'react';

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('fitcircle_reminders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out any old notes data and keep only reminders
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => 
            !item.type || item.type === 'reminder'
          ).map((item: any) => ({
            id: item.id,
            text: item.text,
            completed: item.completed || false,
            createdAt: item.createdAt
          }));
        }
      } catch (error) {
        console.error('Failed to parse reminders:', error);
      }
    }
    return [];
  });

  // Save to localStorage whenever reminders change
  useEffect(() => {
    localStorage.setItem('fitcircle_reminders', JSON.stringify(reminders));
    // Clean up old notes data
    localStorage.removeItem('fitcircle_notes');
  }, [reminders]);

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