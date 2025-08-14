import React, { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { format } from "date-fns";

export function DailyJournal() {
  const [, navigate] = useLocation();
  const { getJournalEntry, addJournalEntry } = useWorkouts();
  const [journalText, setJournalText] = useState("");
  const [journalFocused, setJournalFocused] = useState(false);

  useEffect(() => {
    // Load today's journal entry
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const entry = getJournalEntry(dateStr);
    setJournalText(entry || '');
  }, [getJournalEntry]);

  const handleJournalSubmit = () => {
    if (journalText.trim()) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      addJournalEntry(dateStr, journalText);
      alert('Journal entry saved successfully!');
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/calendar")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Calendar"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-xl font-bold text-white">Daily Journal</h1>
        <div className="w-[42px]" />
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpen className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Today's Entry</h2>
            <p className="text-sm text-slate-400">{format(new Date(), "MMMM d, yyyy")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            onFocus={() => setJournalFocused(true)}
            onBlur={() => setJournalFocused(false)}
            placeholder={journalFocused ? "" : "Write your daily journal entry here..."}
            className="w-full h-64 p-4 bg-slate-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={handleJournalSubmit}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
          >
            Save Entry
          </button>
        </div>

        <div className="mt-6 p-4 bg-slate-700 rounded-xl">
          <p className="text-sm text-slate-300">
            <Calendar className="w-4 h-4 inline mr-2" />
            Tip: Tap any day on the calendar to view or edit past journal entries
          </p>
        </div>
      </div>
    </div>
  );
}