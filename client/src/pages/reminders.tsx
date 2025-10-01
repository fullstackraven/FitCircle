import { useState, useEffect } from 'react';
import { Plus, Check, ChevronDown, ChevronRight, MoreHorizontal, Edit3, Trash2, Menu, Settings, Calculator, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useReminders } from '@/hooks/use-reminders';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function RemindersPage() {
  const [, navigate] = useLocation();
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');

  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    const dashboardState = sessionStorage.getItem('fitcircle_dashboard_open');
    
    if (shouldOpenDashboard || dashboardState === 'true') {
      setIsSidebarOpen(true);
      window.history.replaceState({}, '', '/reminders');
      sessionStorage.removeItem('fitcircle_dashboard_open');
    }
  }, []);
  const [newReminderText, setNewReminderText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCompleted, setSelectedCompleted] = useState<Set<string>>(new Set());
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [newReminderFocused, setNewReminderFocused] = useState(false);
  const [editFocused, setEditFocused] = useState(false);

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed).reverse();


  const handleAddReminder = (keepFormOpen = false) => {
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
      if (!keepFormOpen) {
        setShowAddForm(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddReminder(true); // Keep form open when using keyboard
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
    <div className="min-h-dvh" style={{ backgroundColor: 'hsl(222, 47%, 11%)', paddingBottom: 'var(--bottom-nav-padding)' }}>
      {/* Universal Fixed Header */}
      <header className="sticky z-50 bg-[hsl(222,47%,11%)] pb-4" style={{ top: 0, marginTop: 'calc(-1 * env(safe-area-inset-top))', paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
        <div className="relative text-center max-w-md mx-auto px-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-0 left-0 text-slate-400 hover:text-white transition-colors"
            title="Open Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-2xl font-bold text-white">FitCircle</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-md">

        {/* Active Reminders List */}
        <div className="space-y-1 mb-6">
          {activeReminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center py-3 px-1 group">
              {editingId === reminder.id ? (
                // Edit Mode
                <div className="flex items-center w-full gap-3">
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center border-slate-500"
                  >
                  </button>
                  
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyPress}
                    onBlur={(e) => {
                      setEditFocused(false);
                      saveEdit();
                    }}
                    onFocus={() => setEditFocused(true)}
                    className="flex-1 bg-transparent text-white text-base border-none outline-none"
                    placeholder={editFocused ? "" : "Delete text to remove reminder"}
                    autoFocus
                  />
                </div>
              ) : (
                // View Mode
                <>
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mr-3 border-slate-500 hover:border-blue-400"
                  >
                  </button>
                  
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => startEditing(reminder)}
                  >
                    <p className="text-base text-white break-words whitespace-pre-wrap">
                      {reminder.text}
                    </p>
                  </div>
                  
                  {/* Menu Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(reminder.id);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMenuId === reminder.id && (
                      <div className="absolute right-0 top-8 bg-slate-700 rounded-xl shadow-lg border border-slate-600 py-1 z-10 min-w-[120px]">
                        <button
                          onClick={() => startEditing(reminder)}
                          className="w-full px-3 py-2 text-left text-white hover:bg-slate-600 flex items-center gap-2 text-sm"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="w-full px-3 py-2 text-left text-red-400 hover:bg-slate-600 flex items-center gap-2 text-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add New Reminder */}
        {showAddForm ? (
          <div className="flex items-center py-3 px-1 gap-3 mb-6">
            <div className="w-5 h-5 rounded-full border-2 border-slate-500 flex-shrink-0"></div>
            <input
              type="text"
              value={newReminderText}
              onChange={(e) => setNewReminderText(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                setNewReminderFocused(false);
                if (newReminderText.trim()) {
                  handleAddReminder(); // Auto-save if there's text
                } else {
                  setShowAddForm(false); // Hide form if no text
                }
              }}
              placeholder={newReminderFocused ? "" : "New Reminder"}
              onFocus={() => setNewReminderFocused(true)}
              className="flex-1 bg-transparent text-white text-base border-none outline-none placeholder-slate-500"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center py-3 px-1 gap-3 text-blue-400 hover:bg-white/5 rounded-lg w-full mb-6"
          >
            <Plus className="w-5 h-5" />
            <span className="text-base">New Reminder</span>
          </button>
        )}

        {/* Completed Section */}
        {completedReminders.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-slate-400 hover:text-white"
              >
                {showCompleted ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="text-base">Completed ({completedReminders.length})</span>
              </button>
              
              {showCompleted && (
                <button
                  onClick={() => setSelectMode(!selectMode)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {selectMode ? 'Done' : 'Select'}
                </button>
              )}
            </div>

            {showCompleted && (
              <>
                {selectMode && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={selectAllCompleted}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Select All
                    </button>
                    <span className="text-slate-500">•</span>
                    <button
                      onClick={deleteSelectedCompleted}
                      className="text-red-400 hover:text-red-300 text-sm"
                      disabled={selectedCompleted.size === 0}
                    >
                      Delete Selected ({selectedCompleted.size})
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  {completedReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center py-3 px-1 group">
                      {editingId === reminder.id ? (
                        // Edit Mode
                        <div className="flex items-center w-full gap-3">
                          <button
                            onClick={() => toggleReminder(reminder.id)}
                            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-blue-600 border-blue-600"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </button>
                          
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleEditKeyPress}
                            onBlur={(e) => {
                              setEditFocused(false);
                              saveEdit();
                            }}
                            onFocus={() => setEditFocused(true)}
                            className="flex-1 bg-transparent text-slate-500 text-base border-none outline-none"
                            placeholder={editFocused ? "" : "Delete text to remove reminder"}
                            autoFocus
                          />
                        </div>
                      ) : (
                        // View Mode
                        <>
                          {selectMode ? (
                            <button
                              onClick={() => toggleSelectCompleted(reminder.id)}
                              className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mr-3 ${
                                selectedCompleted.has(reminder.id)
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-slate-500 hover:border-blue-400'
                              }`}
                            >
                              {selectedCompleted.has(reminder.id) && <Check className="w-3 h-3 text-white" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleReminder(reminder.id)}
                              className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mr-3 bg-blue-600 border-blue-600 hover:bg-blue-700"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </button>
                          )}
                          
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => !selectMode && startEditing(reminder)}
                          >
                            <p className="text-base line-through text-slate-500 break-words whitespace-pre-wrap">
                              {reminder.text}
                            </p>
                          </div>
                          
                          {/* Menu Button for Completed Items */}
                          {!selectMode && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(reminder.id);
                                }}
                                className="p-1 text-slate-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              {showMenuId === reminder.id && (
                                <div className="absolute right-0 top-8 bg-slate-700 rounded-xl shadow-lg border border-slate-600 py-1 z-10 min-w-[120px]">
                                  <button
                                    onClick={() => startEditing(reminder)}
                                    className="w-full px-3 py-2 text-left text-white hover:bg-slate-600 flex items-center gap-2 text-sm"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReminder(reminder.id)}
                                    className="w-full px-3 py-2 text-left text-red-400 hover:bg-slate-600 flex items-center gap-2 text-sm"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
                  navigate('/fitness-calculator?from=dashboard');
                }}
              >
                <Calculator className="w-5 h-5 text-slate-400" />
                <span className="text-white">Fitness Calculator</span>
              </div>

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
              <div className="text-slate-500 text-xs text-center">Version 2.1.0</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}