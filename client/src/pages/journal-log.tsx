import React from "react";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { format, parseISO, isValid } from "date-fns";

export function JournalLog() {
  const [, navigate] = useLocation();
  const { getAllJournalEntries } = useWorkouts();

  // Get all journal entries
  const allJournalEntries = getAllJournalEntries();
  const journalEntries = Object.entries(allJournalEntries)
    .map(([dateString, entry]) => {
      const date = new Date(dateString + 'T00:00:00');
      return {
        date: dateString,
        entry: entry,
        parsedDate: date,
        isValidDate: isValid(date)
      };
    })
    .filter((entry) => entry.isValidDate && entry.entry && entry.entry.trim())
    .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  const handleEntryClick = (dateString: string) => {
    navigate(`/daily-journal?date=${dateString}`);
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

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/daily-journal")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Daily Journal"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-xl font-bold text-white">Journal Log</h1>
        <div className="w-[42px]" />
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
              onClick={() => navigate("/daily-journal")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              Write Your First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}