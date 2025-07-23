import { useState, useEffect } from 'react';

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  type: 'reminder' | 'note';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type: 'reminder' | 'note';
}

export type ReminderItem = Reminder | Note;

export function useReminders() {
  const [items, setItems] = useState<ReminderItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedReminders = localStorage.getItem('fitcircle_reminders');
    const savedNotes = localStorage.getItem('fitcircle_notes');
    
    const reminders: Reminder[] = savedReminders ? JSON.parse(savedReminders) : [];
    const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
    
    // Combine and sort by creation date
    const combined = [...reminders, ...notes].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setItems(combined);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    const reminders = items.filter(item => item.type === 'reminder') as Reminder[];
    const notes = items.filter(item => item.type === 'note') as Note[];
    
    localStorage.setItem('fitcircle_reminders', JSON.stringify(reminders));
    localStorage.setItem('fitcircle_notes', JSON.stringify(notes));
  }, [items]);

  const addReminder = (text: string) => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      type: 'reminder'
    };
    
    setItems(prev => [newReminder, ...prev]);
  };

  const addNote = (title: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'note'
    };
    
    setItems(prev => [newNote, ...prev]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setItems(prev => prev.map(item => 
      item.id === id && item.type === 'reminder' 
        ? { ...item, ...updates }
        : item
    ));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNote = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    setItems(prev => prev.map(item => 
      item.id === id && item.type === 'note' 
        ? { ...item, ...updatedNote }
        : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleReminder = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id && item.type === 'reminder' 
        ? { ...item, completed: !(item as Reminder).completed }
        : item
    ));
  };

  return {
    items,
    addReminder,
    addNote,
    updateReminder,
    updateNote,
    deleteItem,
    toggleReminder
  };
}