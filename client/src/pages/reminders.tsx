import { focusDashboardOnOpen, returnDashboardFocus } from '@/lib/dashboard-navigation';
import { DashboardMenu } from '@/components/DashboardMenu';
import { VersionLabel } from "@/components/VersionLabel";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect, useRef } from 'react';
import { createPortal, flushSync } from 'react-dom';
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
  const dismissAfterPointerClick = useRef(false);
  const draftRef = useRef<HTMLFormElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollToNewest = useRef(false);

  useEffect(() => {
    if (showAddForm) {
      draftInputRef.current?.focus({preventScroll: true});
      draftRef.current?.scrollIntoView({ block: 'nearest' });
    }
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


  const openDraft = () => {
    // Mount and focus inside the tap gesture so iOS can open the keyboard.
    flushSync(() => setShowAddForm(true));
    draftInputRef.current?.focus({preventScroll: true});
    draftRef.current?.scrollIntoView({block: 'nearest'});
  };

  const dismissDraft = () => {
    setNewReminderText('');
    setShowAddForm(false);
  };

  const handleAddReminder = () => {
    const text = newReminderText.trim();
    if (!text) { dismissDraft(); return; }
    addReminder(text);
    setNewReminderText('');
    setShowAddForm(true);
    scrollToNewest.current = true;
    draftInputRef.current?.focus({preventScroll: true});
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
        setEditingId(null);
        setEditText('');
        setShowAddForm(true);
        setNewReminderText('');
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
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--page-background)' }}
      onPointerDownCapture={event => {
        dismissAfterPointerClick.current = showAddForm && !newReminderText.trim() && !draftRef.current?.contains(event.target as Node);
      }}
      onPointerCancelCapture={() => { dismissAfterPointerClick.current = false; }}
      onKeyDownCapture={() => { dismissAfterPointerClick.current = false; }}
      onClick={() => {
        // Let an existing reminder action receive its click before removing the
        // empty draft above it and moving the list. Keyboard blur stays immediate.
        if (dismissAfterPointerClick.current) {
          dismissAfterPointerClick.current = false;
          if (document.activeElement !== draftInputRef.current) dismissDraft();
        }
      }}
    >
      {/* Header is rendered into the non-scrolling shell host */}
      <AppHeader>
        <div className="relative text-center max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fc-pill absolute top-1/2 -translate-y-1/2 left-4 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-strong transition-colors"
            title="Open Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="fitcircle-wordmark text-2xl font-bold text-strong">FitCircle</h1>
        </div>
      </AppHeader>

      {/* Main content; header spacing is handled by normal flow */}
      <div>
        <div className="container mx-auto px-4 max-w-md reminders-list">

        <h2 ref={headingRef} className="text-3xl font-bold text-accent-text tracking-tight mb-4">Reminders</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-separator/60 pb-3 mb-1">
          <span aria-live="polite">{completedReminders.length} Completed</span>
          <span aria-hidden="true">•</span>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={completedReminders.length === 0}
            className="fc-pill min-h-11 px-1 text-accent-text hover:text-accent-soft disabled:text-dim-strong disabled:cursor-not-allowed"
          >Clear</button>
        </div>

        {selectMode && (
          <div className="flex flex-wrap items-center gap-3 py-2">
            <button onClick={selectAllCompleted} className="fc-pill min-h-11 text-sm text-accent-text">Select All</button>
            <button onClick={deleteSelectedCompleted} disabled={selectedCompleted.size === 0} className="fc-pill min-h-11 text-sm text-feature-red disabled:text-dim-strong">Delete Selected ({selectedCompleted.size})</button>
            <button onClick={() => { setSelectMode(false); setSelectedCompleted(new Set()); }} className="fc-pill min-h-11 text-sm text-supporting">Done</button>
          </div>
        )}

        {showAddForm && (
          <form ref={draftRef} aria-label="New reminder" onSubmit={event => { event.preventDefault(); handleAddReminder(); }} className="glass-row rounded-xl border border-separator/50 p-3 my-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full border-2 border-control-muted-border" aria-hidden="true" />
              <input ref={draftInputRef} aria-label="New reminder" enterKeyHint="next" autoComplete="off" value={newReminderText} onChange={event => {
                const value = event.target.value;
                setNewReminderText(value);
                if (!value && newReminderText && !(event.nativeEvent as InputEvent).isComposing) setShowAddForm(false);
              }} onBlur={() => { if (!newReminderText.trim() && !dismissAfterPointerClick.current) dismissDraft(); }} onKeyDown={event => {
                if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                if (event.key === 'Enter') { event.preventDefault(); handleAddReminder(); }
                if (event.key === 'Escape' || ((event.key === 'Backspace' || event.key === 'Delete') && !newReminderText)) { event.preventDefault(); dismissDraft(); }
              }} className="reminder-draft-input min-w-0 flex-1 min-h-11 bg-transparent text-base text-strong" />
            </div>
          </form>
        )}

        {reminders.length === 0 && !showAddForm ? (
          <button data-control-geometry="record" type="button" aria-label="Write a reminder" onClick={openDraft} className="min-h-[50dvh] w-full flex items-center justify-center text-muted-foreground text-lg">No Reminders</button>
        ) : (
          <ul aria-label="Reminders" className="divide-y divide-separator/30">
            {[...activeReminders, ...completedReminders].map(reminder => (
              <li key={reminder.id} data-testid={`reminder-${reminder.id}`} className="glass-row flex items-center gap-1 min-h-16 py-2">
                <button
                  aria-label={selectMode && reminder.completed ? `Select ${reminder.text}` : `${reminder.completed ? 'Mark incomplete' : 'Mark complete'}: ${reminder.text}`}
                  aria-pressed={selectMode && reminder.completed ? selectedCompleted.has(reminder.id) : reminder.completed}
                  onClick={() => selectMode && reminder.completed ? toggleSelectCompleted(reminder.id) : toggleReminder(reminder.id)}
                  className="fc-pill min-h-11 min-w-11 shrink-0 flex items-center justify-center"
                >
                  <span className={`w-6 h-6 border-2 flex items-center justify-center ${selectMode && reminder.completed ? 'rounded-md' : 'rounded-full'} ${
                    (selectMode && reminder.completed ? selectedCompleted.has(reminder.id) : reminder.completed) ? 'border-accent-text bg-accent-bright text-on-bright' : 'border-control-muted-border'
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
                    className="glass-input min-w-0 flex-1 min-h-11 rounded-lg px-2 text-base text-strong"
                    autoFocus
                  />
                ) : (
                  <button data-control-geometry="record"
                    onClick={() => !selectMode && startEditing(reminder)}
                    aria-label={`Edit ${reminder.text}`}
                    className={`min-w-0 flex-1 text-left min-h-11 break-words whitespace-pre-wrap text-base ${reminder.completed ? 'text-muted-foreground' : 'text-strong'}`}
                  >{reminder.text}</button>
                )}
                {!selectMode && editingId !== reminder.id && (
                  <div className="relative shrink-0">
                    <button aria-label={`Options for ${reminder.text}`} aria-expanded={showMenuId === reminder.id} onClick={() => toggleMenu(reminder.id)} className="fc-pill min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-strong">
                      <MoreHorizontal size={18} />
                    </button>
                    {showMenuId === reminder.id && (
                      <div className="glass-panel absolute right-0 top-full rounded-xl border border-control p-1 z-10 min-w-[120px]">
                        <button onClick={() => startEditing(reminder)} className="fc-pill w-full min-h-11 px-3 text-left text-strong flex items-center gap-2 text-sm"><Edit3 size={14} />Edit</button>
                        <button onClick={() => handleDeleteReminder(reminder.id)} className="fc-pill w-full min-h-11 px-3 text-left text-feature-red flex items-center gap-2 text-sm"><Trash2 size={14} />Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {completedReminders.length > 0 && !selectMode && (
          <button onClick={() => setSelectMode(true)} className="fc-pill min-h-11 text-sm text-muted-foreground hover:text-accent-text mt-2">Select completed</button>
        )}
        {!showAddForm && reminders.length > 0 && <button data-control-geometry="record" type="button" aria-label="Write a reminder" onClick={openDraft} className="block min-h-[20dvh] w-full" />}
      </div>

      {createPortal(
        <button onClick={openDraft} aria-label="New Reminder" className="fc-pill reminders-add-button bg-accent-bright text-on-bright shadow-lg shadow-black/30 hover:bg-accent-bright-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
          <Plus size={28} aria-hidden="true" />
        </button>, document.body
      )}

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent staticBody fixedFooter className="bg-canvas border-separator">
          <DialogHeader>
            <DialogTitle>Clear completed reminders?</DialogTitle>
            <DialogDescription>This deletes {completedReminders.length} completed reminders. Your active reminders will stay.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="quiet-destructive" onClick={deleteAllCompleted}>Clear completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar Dashboard */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" onOpenAutoFocus={focusDashboardOnOpen} onCloseAutoFocus={returnDashboardFocus} className="w-80 bg-canvas border-separator outline-none">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <DashboardMenu open={isSidebarOpen} returnTo="/reminders" onNavigate={() => setIsSidebarOpen(false)} />

            <div className="p-4 border-t border-separator">
              <VersionLabel onActivate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}
