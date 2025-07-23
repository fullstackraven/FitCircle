import { useState } from 'react';
import { ArrowLeft, Plus, Check, Edit3, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useReminders } from '@/hooks/use-reminders';

export default function RemindersPage() {
  const [, navigate] = useLocation();
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminderText, setNewReminderText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleBack = () => {
    navigate('/');
  };

  const handleAddReminder = () => {
    if (newReminderText.trim()) {
      addReminder(newReminderText.trim());
      setNewReminderText('');
      setShowAddForm(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddReminder();
    }
  };

  const startEditing = (reminder: any) => {
    setEditingId(reminder.id);
    setEditText(reminder.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      updateReminder(editingId, { text: editText.trim() });
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-blue-400 hover:bg-white/10 rounded-xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-blue-400">Reminders</h1>
          </div>
        </div>

        {/* Reminders List */}
        <div className="space-y-1 mb-6">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center py-3 px-1 group">
              {editingId === reminder.id ? (
                // Edit Mode
                <div className="flex items-center w-full gap-3">
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      reminder.completed
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-500'
                    }`}
                  >
                    {reminder.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyPress}
                    onBlur={saveEdit}
                    className="flex-1 bg-transparent text-white text-base border-none outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                // View Mode
                <>
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mr-3 ${
                      reminder.completed
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-500 hover:border-blue-400'
                    }`}
                  >
                    {reminder.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => startEditing(reminder)}
                  >
                    <p className={`text-base ${
                      reminder.completed 
                        ? 'line-through text-slate-500' 
                        : 'text-white'
                    }`}>
                      {reminder.text}
                    </p>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(reminder)}
                      className="p-1 text-slate-400 hover:text-blue-400 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add New Reminder */}
        {showAddForm ? (
          <div className="flex items-center py-3 px-1 gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-slate-500 flex-shrink-0"></div>
            <input
              type="text"
              value={newReminderText}
              onChange={(e) => setNewReminderText(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!newReminderText.trim()) {
                  setShowAddForm(false);
                }
              }}
              placeholder="New Reminder"
              className="flex-1 bg-transparent text-white text-base border-none outline-none placeholder-slate-500"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center py-3 px-1 gap-3 text-blue-400 hover:bg-white/5 rounded-lg w-full"
          >
            <Plus className="w-5 h-5" />
            <span className="text-base">New Reminder</span>
          </button>
        )}
      </div>
    </div>
  );
}