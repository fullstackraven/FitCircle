import React, { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { format } from "date-fns";

export function DailyJournal() {
  const [, navigate] = useLocation();
  const { getJournalEntry, addJournalEntry } = useWorkouts();
  const [journalText, setJournalText] = useState("");


  useEffect(() => {
    // Load today's journal entry
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const entry = getJournalEntry(dateStr);
    setJournalText(entry || '');
  }, []);

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
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-2">
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

      {/* Date indicator */}
      <div className="px-4 mb-4">
        <p className="text-sm text-slate-400">{format(new Date(), "MMMM d, yyyy")}</p>
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