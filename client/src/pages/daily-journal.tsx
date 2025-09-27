import React, { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Calendar, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { format } from "date-fns";

export function DailyJournal() {
  const [, navigate] = useLocation();
  const { getJournalEntry, getJournalEntryWithTimestamp, addJournalEntry } = useWorkouts();
  const [journalText, setJournalText] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Check if we came from wellness page
  const urlParams = new URLSearchParams(window.location.search);
  const fromWellness = urlParams.get('from') === 'wellness';
  
  const handleBack = () => {
    if (fromWellness) {
      navigate('/wellness');
    } else {
      navigate('/calendar');
    }
  };

  useEffect(() => {
    // Check for date parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    let dateStr: string;
    let displayDate: Date;
    
    if (dateParam) {
      dateStr = dateParam;
      displayDate = new Date(dateParam + 'T00:00:00');
    } else {
      // Load today's journal entry
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      displayDate = today;
    }
    
    setCurrentDate(dateStr);
    const entry = getJournalEntry(dateStr);
    setJournalText(entry || '');
    
    // Get timestamp for existing entry
    const entryWithTimestamp = getJournalEntryWithTimestamp(dateStr);
    setLastSaved(entryWithTimestamp?.timestamp || null);
  }, [window.location.search]);

  const handleJournalSubmit = () => {
    if (journalText.trim()) {
      addJournalEntry(currentDate, journalText);
      setLastSaved(new Date().toISOString());
      alert('Journal entry saved successfully!');
    }
  };

  const getDisplayDate = () => {
    if (!currentDate) return format(new Date(), "MMMM d, yyyy");
    const date = new Date(currentDate + 'T00:00:00');
    return format(date, "MMMM d, yyyy");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-2">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <h1 className="text-xl font-bold text-white">Daily Journal</h1>
        <button
          onClick={() => navigate("/journal-log")}
          className="text-slate-500 hover:text-white transition-colors"
          title="View all journal entries"
        >
          <FileText className="w-5 h-5" />
        </button>
      </div>

      {/* Date indicator */}
      <div className="px-4 mb-4">
        <p className="text-sm text-slate-400">{getDisplayDate()}</p>
        {lastSaved && (
          <p className="text-xs text-slate-500 mt-1">
            Last saved: {format(new Date(lastSaved), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </div>

      {/* Main writing area - full screen like Notes app */}
      <div className="px-4">
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Start writing..."
          className="w-full min-h-[calc(100vh-200px)] p-0 bg-transparent text-white border-none resize-none focus:outline-none text-base leading-relaxed placeholder-slate-500"
          style={{
            lineHeight: '1.6'
          }}
        />
      </div>

      {/* Floating save button */}
      <div className="fixed bottom-8 left-4 right-4 z-10">
        <button
          onClick={handleJournalSubmit}
          className="w-full max-w-sm mx-auto block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium shadow-lg"
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}