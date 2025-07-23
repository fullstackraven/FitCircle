import { useState } from 'react';
import { ArrowLeft, Plus, Check, X, Edit3, Trash2, FileText, CheckSquare } from 'lucide-react';
import { useLocation } from 'wouter';
import { useReminders, type Reminder, type Note } from '@/hooks/use-reminders';

export default function RemindersPage() {
  const [, navigate] = useLocation();
  const { items, addReminder, addNote, updateReminder, updateNote, deleteItem, toggleReminder } = useReminders();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'reminder' | 'note'>('reminder');
  const [newReminderText, setNewReminderText] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

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

  const handleAddNote = () => {
    if (newNoteTitle.trim() || newNoteContent.trim()) {
      addNote(
        newNoteTitle.trim() || 'Untitled Note',
        newNoteContent.trim()
      );
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddForm(false);
    }
  };

  const startEditing = (item: Reminder | Note) => {
    setEditingItem(item.id);
    if (item.type === 'reminder') {
      setEditText((item as Reminder).text);
    } else {
      const note = item as Note;
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  };

  const saveEdit = () => {
    if (!editingItem) return;
    
    const item = items.find(i => i.id === editingItem);
    if (!item) return;

    if (item.type === 'reminder') {
      updateReminder(editingItem, { text: editText.trim() });
    } else {
      updateNote(editingItem, { 
        title: editTitle.trim() || 'Untitled Note',
        content: editContent.trim()
      });
    }
    
    setEditingItem(null);
    setEditText('');
    setEditTitle('');
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditText('');
    setEditTitle('');
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto p-4 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 text-white hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-white">Reminders & Notes</h1>
        </div>

        {/* Add Button */}
        {!showAddForm && (
          <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAddType('reminder');
                  setShowAddForm(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-5 h-5" />
                Add Reminder
              </button>
              <button
                onClick={() => {
                  setAddType('note');
                  setShowAddForm(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Add Note
              </button>
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              {addType === 'reminder' ? (
                <CheckSquare className="w-5 h-5 text-blue-400" />
              ) : (
                <FileText className="w-5 h-5 text-green-400" />
              )}
              <h3 className="text-white font-medium">
                Add {addType === 'reminder' ? 'Reminder' : 'Note'}
              </h3>
            </div>

            {addType === 'reminder' ? (
              <div className="space-y-3">
                <textarea
                  value={newReminderText}
                  onChange={(e) => setNewReminderText(e.target.value)}
                  placeholder="Enter reminder text..."
                  className="w-full bg-slate-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddReminder}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewReminderText('');
                    }}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note title (optional)"
                  className="w-full bg-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter note content..."
                  className="w-full bg-slate-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewNoteTitle('');
                      setNewNoteContent('');
                    }}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-2">No reminders or notes yet</div>
              <div className="text-slate-500 text-sm">Tap the buttons above to get started</div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-800 rounded-xl p-4 ${
                  item.type === 'reminder' && (item as Reminder).completed 
                    ? 'opacity-60' 
                    : ''
                }`}
              >
                {editingItem === item.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    {item.type === 'reminder' ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-slate-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-slate-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows={4}
                        />
                      </>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start gap-3 mb-3">
                      {item.type === 'reminder' ? (
                        <button
                          onClick={() => toggleReminder(item.id)}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            (item as Reminder).completed
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-slate-400 hover:border-blue-400'
                          }`}
                        >
                          {(item as Reminder).completed && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                      ) : (
                        <FileText className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {item.type === 'reminder' ? (
                          <p className={`text-white ${
                            (item as Reminder).completed ? 'line-through text-slate-400' : ''
                          }`}>
                            {(item as Reminder).text}
                          </p>
                        ) : (
                          <>
                            <h3 className="text-white font-medium mb-2">
                              {(item as Note).title}
                            </h3>
                            {(item as Note).content && (
                              <p className="text-slate-300 whitespace-pre-wrap">
                                {(item as Note).content}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                        {item.type === 'note' && (item as Note).updatedAt !== item.createdAt && (
                          <span> • Updated {formatDate((item as Note).updatedAt)}</span>
                        )}
                      </span>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}