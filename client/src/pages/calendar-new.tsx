import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Zap,
  Pill,
  Heart
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSupplements } from "@/hooks/use-supplements";
import { useRecovery } from "@/hooks/use-recovery";
import { useEnergyLevel } from "@/hooks/use-energy-level";
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

const colorClassMap: { [key: string]: string } = {
  green: 'workout-green',
  blue: 'workout-blue',
  purple: 'workout-purple',
  amber: 'workout-amber',
  red: 'workout-red',
  pink: 'workout-pink',
  cyan: 'workout-cyan',
  lime: 'workout-lime',
  orange: 'workout-orange',
  indigo: 'workout-indigo',
  emerald: 'workout-emerald',
  yellow: 'workout-yellow'
};

export default function CalendarPage() {
  const [, navigate] = useLocation();
  const { 
    getWorkoutArray, 
    getDailyLogs, 
    addJournalEntry, 
    getJournalEntry, 
    getMonthlyStats, 
    getTotalStats,
    getIndividualWorkoutTotals,
    editWorkoutForDate,
    isWorkoutActiveOnDay,
    getWorkoutLogsForDate
  } = useWorkouts();
  const {
    supplements,
    getSupplementLogsForDate,
    setSupplementLog,
    hasSupplementsForDate,
    getSupplementStats,
    editSupplement,
    deleteSupplement
  } = useSupplements();
  const {
    addRecoveryDay,
    removeRecoveryDay,
    isRecoveryDay,
    getRecoveryStats
  } = useRecovery();
  const {
    getEnergyLevel,
    setEnergyLevelForDate,
    hasEnergyLevel
  } = useEnergyLevel();

  const workouts = getWorkoutArray() || [];
  const logs = getDailyLogs() || {};

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Handle date click - navigate to dynamic overview
  const handleDateClick = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    navigate(`/dynamic-overview/${dateString}`);
  };

  // Calculate day completion using immutable dayCompleted flag
  const isDayComplete = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dateLog = logs[dateStr];
    if (!dateLog) return false;
    
    // Debug logging for today's date
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      console.log(`Today (${dateStr}) completion check:`, {
        hasDateLog: !!dateLog,
        dayCompleted: dateLog.dayCompleted,
        logKeys: Object.keys(dateLog)
      });
    }
    
    // Check immutable completion flag first - once set, day stays complete forever
    if (dateLog.dayCompleted === true) {
      return true;
    }
    
    return false; // If no immutable flag, day is not complete
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
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
          // Use local timezone date formatting to match workout data
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const hasJournal = (getJournalEntry(dateStr) || "").length > 0;
          const hasEnergy = hasEnergyLevel(date);
          const hasSupplements = hasSupplementsForDate(dateStr);
          const isRecovery = isRecoveryDay(dateStr);

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`aspect-square rounded-xl flex items-center justify-center relative text-sm font-medium cursor-pointer transition-all hover:opacity-80
                ${isCurrent ? "bg-slate-800 text-white" : "bg-slate-700 text-slate-500"} 
                ${complete && !isRecovery ? "bg-green-500 text-white shadow-lg shadow-green-500/50" : ""}
                ${isRecovery ? "bg-orange-500 text-white shadow-lg shadow-orange-500/50" : ""}`}
              style={complete && !isRecovery ? {
                backgroundColor: '#00ff41',
                boxShadow: '0 0 8px rgba(0, 255, 65, 0.4), 0 0 16px rgba(0, 255, 65, 0.2)',
                color: '#000000',
                fontWeight: 'bold'
              } : isRecovery ? {
                backgroundColor: '#ff8c00',
                boxShadow: '0 0 8px rgba(255, 140, 0, 0.4), 0 0 16px rgba(255, 140, 0, 0.2)',
                color: '#000000',
                fontWeight: 'bold'
              } : {}}
            >
              {format(date, "d")}
              {(hasJournal || hasEnergy || hasSupplements) && (
                <div className="absolute bottom-1 left-0 w-full flex justify-center space-x-1">
                  {hasJournal && (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  )}
                  {hasEnergy && (
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  )}
                  {hasSupplements && (
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Panels */}
      <div className="mt-8 space-y-3">
        {/* Workout Statistics Panel */}
        <button
          onClick={() => navigate("/workout-statistics")}
          className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Workout Statistics</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Daily Journal Panel */}
        <button
          onClick={() => navigate("/daily-journal")}
          className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Daily Journal</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Energy Level Panel */}
        <button
          onClick={() => navigate("/energy-level")}
          className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-medium">Energy Level</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Recovery Panel */}
        <button
          onClick={() => navigate("/recovery")}
          className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Heart className="w-5 h-5 text-orange-400" />
            <span className="text-white font-medium">Recovery</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Supplements Panel */}
        <button
          onClick={() => navigate("/supplements-page")}
          className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Pill className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Supplements</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}