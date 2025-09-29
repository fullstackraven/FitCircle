import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
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
import { RecentActivityWidget } from "@/components/dashboard-widgets/RecentActivityWidget";
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

  // Calculate day completion - check if all workouts with activity met their goals  
  const isDayComplete = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dateLog = logs[dateStr];
    if (!dateLog) return false;
    
    // Get workouts that had any activity on this date
    const workoutsWithActivity = Object.keys(dateLog).filter(workoutId => {
      const logEntry = dateLog[workoutId];
      const count = typeof logEntry === 'object' ? logEntry.count : (logEntry || 0);
      return count > 0;
    });
    
    if (workoutsWithActivity.length === 0) return false;
    
    // Check if all active workouts on that day met their goals
    return workoutsWithActivity.every(workoutId => {
      const logEntry = dateLog[workoutId];
      const count = typeof logEntry === 'object' ? logEntry.count : (logEntry || 0);
      const goalAtTime = typeof logEntry === 'object' ? logEntry.goalAtTime : null;
      
      // If we have a stored goal from that time, use it. Otherwise fall back to current goal
      if (goalAtTime !== null) {
        return count >= goalAtTime;
      } else {
        const workout = workouts.find(w => w.id === workoutId);
        return workout ? count >= workout.dailyGoal : false;
      }
    });
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
    <div className="p-4 max-w-3xl mx-auto min-h-dvh pb-48" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-center mb-6">
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
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  )}
                  {hasEnergy && (
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  )}
                  {hasSupplements && (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
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
            <BarChart3 className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Workout Statistics</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Recent Activity Panel */}
        <div data-testid="recent-activity-panel">
          <RecentActivityWidget widget={{
            id: 'recent-activity',
            type: 'recent-activity',
            title: 'Recent Activity',
            enabled: true,
            position: 2,
            size: 'large'
          }} />
        </div>

      </div>
    </div>
  );
}