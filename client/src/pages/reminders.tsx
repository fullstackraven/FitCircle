import { VersionLabel } from "@/components/VersionLabel";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Check, MoreHorizontal, Edit3, Trash2, Menu, Settings, Calculator, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useReminders } from '@/hooks/use-reminders';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function RemindersPage() {
  const [, navigate] = useLocation();
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const draftRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollToNewest = useRef(false);

  useEffect(() => {
    if (showAddForm) draftRef.current?.scrollIntoView({ block: 'nearest' });
  }, [showAddForm]);

  useEffect(() => {
    if (scrollToNewest.current) {
      headingRef.current?.scrollIntoView({ block: 'start' });
      scrollToNewest.current = false;
    }
  }, [reminders]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');

  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    const dashboardState = sessionStorage.getItem('fitcircle_dashboard_open');
    
    if (shouldOpenDashboard || dashboardState === 'true') {
      setIsSidebarOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem('fitcircle_dashboard_open');
    }
  }, []);
  const [newReminderText, setNewReminderText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCompleted, setSelectedCompleted] = useState<Set<string>>(new Set());
  const [showMenuId, setShowMenuId] = useState<string | null>(null);


  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed).reverse();


  const handleAddReminder = () => {
    if (newReminderText.trim()) {
      // Check if we need to insert at a specific position
      const insertAfterIndexStr = localStorage.getItem('insertAfterIndex');
      let insertAfterIndex: number | undefined;
      
      if (insertAfterIndexStr !== null) {
        insertAfterIndex = parseInt(insertAfterIndexStr);
        localStorage.removeItem('insertAfterIndex'); // Clean up after use
      }
      
      addReminder(newReminderText.trim(), insertAfterIndex);
      setNewReminderText('');
      setShowAddForm(false);
      scrollToNewest.current = true;
    }
  };

  const startEditing = (reminder: any) => {
    setEditingId(reminder.id);
    setEditText(reminder.text);
    setShowMenuId(null); // Close menu when editing
  };

  const deleteAllCompleted = () => {
    completedReminders.forEach(reminder => deleteReminder(reminder.id));
    setSelectMode(false);
    setSelectedCompleted(new Set());
    setConfirmClear(false);
  };

  const deleteSelectedCompleted = () => {
    selectedCompleted.forEach(id => deleteReminder(id));
    setSelectMode(false);
    setSelectedCompleted(new Set());
  };

  const toggleSelectCompleted = (id: string) => {
    const newSelected = new Set(selectedCompleted);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCompleted(newSelected);
  };

  const selectAllCompleted = () => {
    setSelectedCompleted(new Set(completedReminders.map(r => r.id)));
  };

  const handleDeleteReminder = (id: string) => {
    deleteReminder(id);
    setShowMenuId(null);
  };

  const toggleMenu = (id: string) => {
    setShowMenuId(showMenuId === id ? null : id);
  };

  const saveEdit = (openNewReminder = false) => {
    if (editingId) {
      if (editText.trim()) {
        updateReminder(editingId, { text: editText.trim() });
      } else {
        // Delete reminder if text is empty
        deleteReminder(editingId);
      }
      
      if (openNewReminder) {
        // Find the position of the edited reminder in the full reminders array
        const editedReminderIndex = reminders.findIndex(r => r.id === editingId);
        console.log('Edited reminder index:', editedReminderIndex, 'ID:', editingId);
        setEditingId(null);
        setEditText('');
        
        // Set up state to add new reminder after the edited one
        setShowAddForm(true);
        setNewReminderText('');
        // Store the position where we want to insert the new reminder
        localStorage.setItem('insertAfterIndex', editedReminderIndex.toString());
      } else {
        setEditingId(null);
        setEditText('');
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit(true); // Open new reminder after saving edit
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header is rendered into the non-scrolling shell host */}
      <AppHeader>
        <div className="relative text-center max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 left-4 min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Open Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="fitcircle-wordmark text-2xl font-bold text-white">FitCircle</h1>
        </div>
      </AppHeader>

      {/* Main content; header spacing is handled by normal flow */}
      <div>
        <div className="container mx-auto px-4 max-w-md reminders-list">

        <h2 ref={headingRef} className="text-3xl font-bold text-green-400 tracking-tight mb-4">Reminders</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400 border-b border-slate-700/60 pb-3 mb-1">
          <span aria-live="polite">{completedReminders.length} Completed</span>
          <span aria-hidden="true">•</span>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={completedReminders.length === 0}
            className="min-h-11 px-1 text-green-400 hover:text-green-300 disabled:text-slate-600 disabled:cursor-not-allowed"
          >Clear</button>
        </div>

        {selectMode && (
          <div className="flex flex-wrap items-center gap-3 py-2">
            <button onClick={selectAllCompleted} className="min-h-11 text-sm text-green-400">Select All</button>
            <button onClick={deleteSelectedCompleted} disabled={selectedCompleted.size === 0} className="min-h-11 text-sm text-red-400 disabled:text-slate-600">Delete Selected ({selectedCompleted.size})</button>
            <button onClick={() => { setSelectMode(false); setSelectedCompleted(new Set()); }} className="min-h-11 text-sm text-slate-300">Done</button>
          </div>
        )}

        {reminders.length === 0 && !showAddForm ? (
          <div className="min-h-[40dvh] flex items-center justify-center text-slate-500 text-lg">No Reminders</div>
        ) : (
          <ul aria-label="Reminders" className="divide-y divide-slate-700/30">
            {[...activeReminders, ...completedReminders].map(reminder => (
              <li key={reminder.id} data-testid={`reminder-${reminder.id}`} className="glass-row flex items-center gap-1 min-h-16 py-2">
                <button
                  aria-label={selectMode && reminder.completed ? `Select ${reminder.text}` : `${reminder.completed ? 'Mark incomplete' : 'Mark complete'}: ${reminder.text}`}
                  aria-pressed={selectMode && reminder.completed ? selectedCompleted.has(reminder.id) : reminder.completed}
                  onClick={() => selectMode && reminder.completed ? toggleSelectCompleted(reminder.id) : toggleReminder(reminder.id)}
                  className="min-h-11 min-w-11 shrink-0 flex items-center justify-center"
                >
                  <span className={`w-6 h-6 border-2 flex items-center justify-center ${selectMode && reminder.completed ? 'rounded-md' : 'rounded-full'} ${
                    (selectMode && reminder.completed ? selectedCompleted.has(reminder.id) : reminder.completed) ? 'border-green-400 bg-green-400 text-slate-950' : 'border-slate-500'
                  }`}>
                    {(selectMode && reminder.completed ? selectedCompleted.has(reminder.id) : reminder.completed) && <Check size={15} aria-hidden="true" />}
                  </span>
                </button>
                {editingId === reminder.id ? (
                  <input
                    aria-label="Reminder text"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyPress}
                    onBlur={() => saveEdit()}
                    className="glass-input min-w-0 flex-1 min-h-11 rounded-lg px-2 text-base text-white"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => !selectMode && startEditing(reminder)}
                    aria-label={`Edit ${reminder.text}`}
                    className={`min-w-0 flex-1 text-left min-h-11 break-words whitespace-pre-wrap text-base ${reminder.completed ? 'text-slate-500' : 'text-white'}`}
                  >{reminder.text}</button>
                )}
                {!selectMode && editingId !== reminder.id && (
                  <div className="relative shrink-0">
                    <button aria-label={`Options for ${reminder.text}`} aria-expanded={showMenuId === reminder.id} onClick={() => toggleMenu(reminder.id)} className="min-h-11 min-w-11 flex items-center justify-center text-slate-500 hover:text-white">
                      <MoreHorizontal size={18} />
                    </button>
                    {showMenuId === reminder.id && (
                      <div className="glass-panel absolute right-0 top-full rounded-xl border border-slate-600 p-1 z-10 min-w-[120px]">
                        <button onClick={() => startEditing(reminder)} className="w-full min-h-11 px-3 text-left text-white flex items-center gap-2 text-sm"><Edit3 size={14} />Edit</button>
                        <button onClick={() => handleDeleteReminder(reminder.id)} className="w-full min-h-11 px-3 text-left text-red-400 flex items-center gap-2 text-sm"><Trash2 size={14} />Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {showAddForm && (
          <form ref={draftRef} aria-label="New reminder" onSubmit={event => { event.preventDefault(); handleAddReminder(); }} className="glass-row rounded-xl border border-slate-700/50 p-3 mt-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full border-2 border-slate-500" aria-hidden="true" />
              <input aria-label="New reminder" value={newReminderText} onChange={event => setNewReminderText(event.target.value)} onKeyDown={event => {
                if (event.key === 'Escape') { setNewReminderText(''); setShowAddForm(false); }
              }} className="min-w-0 flex-1 min-h-11 bg-transparent text-base text-white outline-none focus-visible:ring-1 focus-visible:ring-green-400 rounded" />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => { setNewReminderText(''); setShowAddForm(false); }}>Cancel</Button>
              <Button type="submit" disabled={!newReminderText.trim()} className="bg-green-400 text-slate-950 hover:bg-green-300">Add Reminder</Button>
            </div>
          </form>
        )}
        {completedReminders.length > 0 && !selectMode && (
          <button onClick={() => setSelectMode(true)} className="min-h-11 text-sm text-slate-400 hover:text-green-400 mt-2">Select completed</button>
        )}
      </div>

      {createPortal(
        <button onClick={() => setShowAddForm(true)} aria-label="New Reminder" className="reminders-add-button rounded-full bg-green-400 text-slate-950 shadow-lg shadow-black/30 hover:bg-green-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400">
          <Plus size={28} aria-hidden="true" />
        </button>, document.body
      )}

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent staticBody fixedFooter className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Clear completed reminders?</DialogTitle>
            <DialogDescription>This deletes {completedReminders.length} completed reminders. Your active reminders will stay.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteAllCompleted}>Clear completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar Dashboard */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 bg-slate-900 border-slate-700">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div 
              className="flex items-center space-x-3 p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
              onClick={() => {
                setIsSidebarOpen(false);
                navigate('/profile?from=dashboard');
              }}
            >
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center border-2 border-green-400">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">{userName}</div>
                <div className="text-slate-400 text-xs">view profile</div>
              </div>
            </div>

            <div className="flex-1 py-4">
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/settings?from=dashboard');
                }}
              >
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="text-white">Settings</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700">
              <VersionLabel onActivate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}