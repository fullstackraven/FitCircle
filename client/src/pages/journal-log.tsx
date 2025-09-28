import React, { useState, useEffect } from "react";
import { Plus, Calendar, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { format, parseISO, isValid } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function JournalLog() {
  const [, navigate] = useLocation();
  const { getAllJournalEntries, getJournalEntry, getJournalEntryWithTimestamp, addJournalEntry } = useWorkouts();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Check if we came from wellness page
  const urlParams = new URLSearchParams(window.location.search);
  const fromWellness = urlParams.get('from') === 'wellness';

  // Get all journal entries
  const allJournalEntries = getAllJournalEntries();
  const journalEntries = Object.entries(allJournalEntries)
    .map(([dateString, entry]) => {
      const date = new Date(dateString + 'T00:00:00');
      const text = typeof entry === 'string' ? entry : entry.text;
      const timestamp = typeof entry === 'string' ? null : entry.timestamp;
      
      return {
        date: dateString,
        entry: text,
        timestamp: timestamp,
        parsedDate: date,
        timestampDate: timestamp ? new Date(timestamp) : null,
        isValidDate: isValid(date)
      };
    })
    .filter((entry) => entry.isValidDate && entry.entry && entry.entry.trim())
    .sort((a, b) => {
      // Sort by timestamp if available, otherwise by date
      const aTime = a.timestampDate?.getTime() || a.parsedDate.getTime();
      const bTime = b.timestampDate?.getTime() || b.parsedDate.getTime();
      return bTime - aTime;
    });

  const handleEntryClick = (dateString: string) => {
    setCurrentDate(dateString);
    const entry = getJournalEntry(dateString);
    setJournalText(entry || '');
    
    const entryWithTimestamp = getJournalEntryWithTimestamp(dateString);
    setLastSaved(entryWithTimestamp?.timestamp || null);
    
    setIsModalOpen(true);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  const getTimeDisplay = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleJournalSubmit = () => {
    if (journalText.trim()) {
      addJournalEntry(currentDate, journalText);
      setLastSaved(new Date().toISOString());
      
      // Ensure body scroll lock is cleaned up and close modal
      document.body.style.overflow = '';
      document.body.style.position = '';
      setIsModalOpen(false);
    }
  };

  const getDisplayDate = () => {
    if (!currentDate) return format(new Date(), "MMMM d, yyyy");
    const date = new Date(currentDate + 'T00:00:00');
    return format(date, "MMMM d, yyyy");
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-dvh" style={{ backgroundColor: 'hsl(222, 47%, 11%)', paddingBottom: 'var(--bottom-nav-padding)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="w-[42px]" />
        <h1 className="text-xl font-bold text-white">Journal Log</h1>
        <button
          onClick={() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            setCurrentDate(dateStr);
            const entry = getJournalEntry(dateStr);
            setJournalText(entry || '');
            
            const entryWithTimestamp = getJournalEntryWithTimestamp(dateStr);
            setLastSaved(entryWithTimestamp?.timestamp || null);
            
            setIsModalOpen(true);
          }}
          className="text-slate-400 hover:text-white transition-colors"
          title="Write new journal entry"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {journalEntries.length > 0 ? (
          journalEntries.map((entry) => (
            <button
              key={entry.date}
              onClick={() => handleEntryClick(entry.date)}
              className="w-full text-left p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium">
                  {formatDateDisplay(entry.parsedDate)}
                </h3>
                <span className="text-xs text-slate-400">
                  {getTimeDisplay(entry.parsedDate)}
                </span>
              </div>
              
              <p className="text-slate-300 text-sm line-clamp-3">
                {truncateText(entry.entry)}
              </p>
              
              <div className="flex items-center mt-3 text-xs text-slate-500">
                <Calendar className="w-3 h-3 mr-1" />
                {format(entry.parsedDate, "MMM d, yyyy")}
                {entry.timestamp && (
                  <span className="ml-3">
                    • {format(entry.timestampDate!, "h:mm a")}
                  </span>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No Journal Entries Yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Start writing in your daily journal to see entries here
            </p>
            <button
              onClick={() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                setCurrentDate(dateStr);
                const entry = getJournalEntry(dateStr);
                setJournalText(entry || '');
                
                const entryWithTimestamp = getJournalEntryWithTimestamp(dateStr);
                setLastSaved(entryWithTimestamp?.timestamp || null);
                
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              Write Your First Entry
            </button>
          </div>
        )}
      </div>

      {/* Journal Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[75vh] p-0 bg-slate-800 border-slate-600 overflow-hidden rounded-2xl">
          <div className="flex flex-col h-[70vh]" style={{ backgroundColor: 'hsl(222, 47%, 15%)' }}>
            {/* Modal Header */}
            <DialogHeader className="px-4 py-3 border-b border-slate-600">
              <DialogTitle className="text-lg font-bold text-white text-center">Daily Journal</DialogTitle>
              <DialogDescription className="text-slate-400 text-center text-sm">
                Write your thoughts and reflections for today
              </DialogDescription>
            </DialogHeader>

            {/* Date indicator */}
            <div className="px-4 py-2 border-b border-slate-600">
              <p className="text-sm text-slate-400">{getDisplayDate()}</p>
              {lastSaved && (
                <p className="text-xs text-slate-500 mt-1">
                  Last saved: {format(new Date(lastSaved), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>

            {/* Main writing area */}
            <div className="flex-1 px-4 py-4 flex flex-col overflow-hidden">
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Start writing..."
                className="flex-1 w-full p-0 bg-transparent text-white border-none resize-none focus:outline-none text-base leading-relaxed placeholder-slate-500"
                style={{
                  lineHeight: '1.6',
                  touchAction: 'manipulation',
                  minHeight: '200px'
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>


            {/* Save button */}
            <div className="px-4 py-3 border-t border-slate-600">
              <button
                onClick={handleJournalSubmit}
                className="w-full px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium shadow-lg"
                data-testid="button-save-journal"
              >
                Save Entry
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}