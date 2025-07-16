import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth
} from "date-fns";

export default function CalendarPage() {
  const [, navigate] = useLocation();
  const { 
    getWorkoutArray, 
    getDailyLogs, 
    addJournalEntry, 
    getJournalEntry, 
    getMonthlyStats, 
    getTotalStats 
  } = useWorkouts();
  const workouts = getWorkoutArray();
  const logs = getDailyLogs();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [journalText, setJournalText] = useState('');

  const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const isDayComplete = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dayLog = logs[dateStr];
    if (!dayLog) return false;
    return workouts.every(w => dayLog[w.id] >= w.dailyGoal);
  };

  const handleDayClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;
    
    setSelectedDate(date);
    const dateStr = date.toISOString().split("T")[0];
    const existingEntry = getJournalEntry(dateStr);
    setJournalText(existingEntry);
    setIsJournalOpen(true);
  };

  const handleJournalSubmit = () => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split("T")[0];
    addJournalEntry(dateStr, journalText);
    setSelectedDate(null);
    setJournalText('');
  };

  const monthlyStats = getMonthlyStats(currentMonth.getFullYear(), currentMonth.getMonth());
  const totalStats = getTotalStats();

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="text-slate-400 hover:text-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="w-[42px]" />
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map(date => {
          const isCurrent = isSameMonth(date, currentMonth);
          const complete = isDayComplete(date);
          const dateStr = date.toISOString().split("T")[0];
          const hasJournal = getJournalEntry(dateStr).length > 0;

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              className={`aspect-square rounded-xl flex items-center justify-center relative text-sm font-medium cursor-pointer transition-all hover:opacity-80
                ${isCurrent ? "bg-slate-800 text-white" : "bg-slate-700 text-slate-500"} 
                ${complete ? "bg-green-500 text-white shadow-lg shadow-green-500/50" : ""}`}
              style={complete ? {
                backgroundColor: '#00ff41',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.6), 0 0 40px rgba(0, 255, 65, 0.3)',
                color: '#000000',
                fontWeight: 'bold'
              } : {}}
            >
              {format(date, "d")}
              {complete && (
                <CheckCircle className="absolute -top-1 -right-2 text-white opacity-80 w-4 h-4" />
              )}
              {hasJournal && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Statistics Panel */}
      <div className="mt-8">
        <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Statistics</span>
            </div>
            {isStatsOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 bg-slate-800 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{monthlyStats.totalReps}</div>
                  <div className="text-sm text-slate-400">Total Reps This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{monthlyStats.workoutsCompleted}</div>
                  <div className="text-sm text-slate-400">Workouts Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{monthlyStats.monthlyGoalPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">Goals Hit This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{totalStats.totalGoalPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">Goals Hit Total</div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Journal Panel */}
      <div className="mt-4">
        <Collapsible open={isJournalOpen} onOpenChange={setIsJournalOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">Daily Journal</span>
            </div>
            {isJournalOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 bg-slate-800 rounded-lg p-4">
              {selectedDate ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-white">
                      Journal Entry for {format(selectedDate, "MMMM d, yyyy")}
                    </h3>
                  </div>
                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="Write your daily journal entry here..."
                    className="w-full h-32 p-3 bg-slate-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleJournalSubmit}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Save Entry
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setJournalText('');
                      }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">Tap on a day in the calendar to add a journal entry</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}