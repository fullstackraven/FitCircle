import React, { useState, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Zap,
  Undo2,
  Pill,
  Plus
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSupplements } from "@/hooks/use-supplements";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddSupplementDialog } from "@/components/AddSupplementDialog";
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
    getIndividualWorkoutTotals
  } = useWorkouts();
  const {
    supplements,
    getSupplementLogsForDate,
    setSupplementLog,
    hasSupplementsForDate,
    getSupplementStats
  } = useSupplements();
  const workouts = getWorkoutArray() || [];
  const logs = getDailyLogs() || {};

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isWorkoutTotalsOpen, setIsWorkoutTotalsOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isEnergyOpen, setIsEnergyOpen] = useState(false);
  const [isSupplementsOpen, setIsSupplementsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [journalText, setJournalText] = useState('');
  const [energyLevel, setEnergyLevel] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const circleRef = useRef<SVGSVGElement>(null);

  const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const isDayComplete = (date: Date) => {
    // Use local timezone date formatting to match workout data
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayLog = logs[dateStr];
    if (!dayLog) return false;
    
    // Only check workouts that actually have logged reps for this day
    // This ensures that adding new workouts doesn't affect past completion status
    const workoutsWithRepsOnThisDay = workouts.filter(w => dayLog[w.id] && dayLog[w.id] > 0);
    if (workoutsWithRepsOnThisDay.length === 0) return false;
    
    // Check if all workouts that were actively used on this day met their goals
    return workoutsWithRepsOnThisDay.every(w => dayLog[w.id] >= w.dailyGoal);
  };

  const handleDayClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;
    
    setSelectedDate(date);
    // Use local timezone date formatting to match workout data
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const existingEntry = getJournalEntry(dateStr);
    setJournalText(existingEntry);
    setEnergyLevel(getEnergyLevel(date));
    setIsJournalOpen(true);
    setIsEnergyOpen(true);
    setIsSupplementsOpen(true);
  };

  const handleJournalSubmit = () => {
    if (!selectedDate) return;
    
    // Use local timezone date formatting to match workout data
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    addJournalEntry(dateStr, journalText);
    setSelectedDate(null);
    setJournalText('');
  };

  const getEnergyLevel = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    if (energyData) {
      const parsed = JSON.parse(energyData);
      return parsed[dateKey] || 0;
    }
    return 0;
  };

  const setEnergyLevelForDate = (date: Date, level: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    const parsed = energyData ? JSON.parse(energyData) : {};
    parsed[dateKey] = level;
    localStorage.setItem('fitcircle_energy_levels', JSON.stringify(parsed));
  };

  const hasEnergyLevel = (date: Date) => {
    return getEnergyLevel(date) > 0;
  };

  // Energy Trend Visualization Component
  const EnergyTrendVisualization = () => {
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    const parsed = energyData ? JSON.parse(energyData) : {};
    
    // Get last 14 days of energy data
    const last14Days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const energyLevel = parsed[dateKey] || 0;
      last14Days.push({
        date: format(date, 'MM/dd'),
        energy: energyLevel,
        dateKey,
        hasInput: parsed[dateKey] && parsed[dateKey] > 0
      });
    }

    // Only include days with actual energy inputs for calculations
    const daysWithInput = last14Days.filter(d => d.hasInput);
    const maxEnergy = Math.max(...daysWithInput.map(d => d.energy), 10);
    const avgEnergy = daysWithInput.length > 0 ? daysWithInput.reduce((sum, d) => sum + d.energy, 0) / daysWithInput.length : 0;

    return (
      <div className="space-y-4">
        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-purple-900/30 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-300">{avgEnergy.toFixed(1)}</div>
            <div className="text-xs text-slate-400">Avg Energy</div>
          </div>
          <div className="bg-purple-900/30 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-300">{daysWithInput.length}</div>
            <div className="text-xs text-slate-400">Days Logged</div>
          </div>
          <div className="bg-purple-900/30 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-300">{last14Days[last14Days.length - 1]?.hasInput ? last14Days[last14Days.length - 1].energy : 0}</div>
            <div className="text-xs text-slate-400">Today</div>
          </div>
        </div>

        {/* Creative Wave Chart */}
        <div className="relative h-24 bg-slate-900/50 rounded-lg overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 280 96" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 2.5, 5, 7.5, 10].map(level => (
              <line
                key={level}
                x1="0"
                y1={96 - (level / 10) * 96}
                x2="280"
                y2={96 - (level / 10) * 96}
                stroke="rgba(148, 163, 184, 0.1)"
                strokeWidth="1"
              />
            ))}
            
            {/* Energy level path - only connect points that have actual inputs */}
            {daysWithInput.length > 1 && (
              <>
                <path
                  d={(() => {
                    const points = last14Days
                      .map((d, i) => ({ ...d, index: i }))
                      .filter(d => d.hasInput);
                    
                    if (points.length < 2) return '';
                    
                    const firstPoint = points[0];
                    let pathData = `M ${(firstPoint.index / 13) * 280} ${96 - (firstPoint.energy / 10) * 96}`;
                    
                    for (let i = 1; i < points.length; i++) {
                      const point = points[i];
                      pathData += ` L ${(point.index / 13) * 280} ${96 - (point.energy / 10) * 96}`;
                    }
                    
                    return pathData;
                  })()}
                  fill="none"
                  stroke="rgb(168, 85, 247)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Fill area under curve - only for days with inputs */}
                <path
                  d={(() => {
                    const points = last14Days
                      .map((d, i) => ({ ...d, index: i }))
                      .filter(d => d.hasInput);
                    
                    if (points.length < 2) return '';
                    
                    const firstPoint = points[0];
                    let pathData = `M ${(firstPoint.index / 13) * 280} 96`;
                    pathData += ` L ${(firstPoint.index / 13) * 280} ${96 - (firstPoint.energy / 10) * 96}`;
                    
                    for (let i = 1; i < points.length; i++) {
                      const point = points[i];
                      pathData += ` L ${(point.index / 13) * 280} ${96 - (point.energy / 10) * 96}`;
                    }
                    
                    const lastPoint = points[points.length - 1];
                    pathData += ` L ${(lastPoint.index / 13) * 280} 96 Z`;
                    
                    return pathData;
                  })()}
                  fill="url(#energyGradient)"
                  opacity="0.3"
                />
              </>
            )}
            
            {/* Energy points - only show for days with actual inputs */}
            {last14Days.map((d, i) => d.hasInput && (
              <circle
                key={i}
                cx={(i / 13) * 280}
                cy={96 - (d.energy / 10) * 96}
                r="3"
                fill="rgb(168, 85, 247)"
                stroke="rgb(30, 41, 59)"
                strokeWidth="2"
              />
            ))}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="energyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 -ml-8">
            <span>10</span>
            <span>5</span>
            <span>0</span>
          </div>
        </div>

        {/* Date labels */}
        <div className="flex justify-between text-xs text-slate-500 px-1">
          <span>{last14Days[0]?.date}</span>
          <span>{last14Days[6]?.date}</span>
          <span>{last14Days[13]?.date}</span>
        </div>

        {/* Trend indicator - only show if we have enough data points */}
        {daysWithInput.length >= 3 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-900/40 rounded-full px-3 py-1">
              {(() => {
                const recentDaysWithInput = last14Days.slice(-7).filter(d => d.hasInput);
                const olderDaysWithInput = last14Days.slice(0, 7).filter(d => d.hasInput);
                
                const recentAvg = recentDaysWithInput.length > 0 ? 
                  recentDaysWithInput.reduce((sum, d) => sum + d.energy, 0) / recentDaysWithInput.length : 0;
                const olderAvg = olderDaysWithInput.length > 0 ? 
                  olderDaysWithInput.reduce((sum, d) => sum + d.energy, 0) / olderDaysWithInput.length : 0;
                
                // Only calculate trend if we have data from both periods
                if (recentDaysWithInput.length === 0 || olderDaysWithInput.length === 0) {
                  return (
                    <>
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <span className="text-xs text-slate-400">Insufficient data</span>
                    </>
                  );
                }
                
                const trend = recentAvg - olderAvg;
                
                return trend > 0.5 ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Energy trending up</span>
                  </>
                ) : trend < -0.5 ? (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-400">Energy trending down</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-yellow-400">Energy stable</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Energy level tap functionality
  const handleEnergyTap = () => {
    setEnergyLevel(prevLevel => {
      const newLevel = prevLevel >= 10 ? 1 : prevLevel + 1;
      return newLevel;
    });
  };

  const handleEnergyUndo = () => {
    setEnergyLevel(prevLevel => {
      const newLevel = prevLevel <= 1 ? 0 : prevLevel - 1;
      return newLevel;
    });
  };

  const monthlyStats = getMonthlyStats(currentMonth.getFullYear(), currentMonth.getMonth()) || {
    totalReps: 0,
    workoutsCompleted: 0,
    monthlyGoalPercentage: 0,
    daysInMonth: 0
  };
  const totalStats = getTotalStats() || {
    totalReps: 0,
    totalGoalPercentage: 0
  };
  const individualWorkoutTotals = getIndividualWorkoutTotals() || [];

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
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
          // Use local timezone date formatting to match workout data
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const hasJournal = (getJournalEntry(dateStr) || "").length > 0;
          const hasEnergy = hasEnergyLevel(date);
          const hasSupplements = hasSupplementsForDate(dateStr);

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              className={`aspect-square rounded-xl flex items-center justify-center relative text-sm font-medium cursor-pointer transition-all hover:opacity-80
                ${isCurrent ? "bg-slate-800 text-white" : "bg-slate-700 text-slate-500"} 
                ${complete ? "bg-green-500 text-white shadow-lg shadow-green-500/50" : ""}`}
              style={complete ? {
                backgroundColor: '#00ff41',
                boxShadow: '0 0 8px rgba(0, 255, 65, 0.4), 0 0 16px rgba(0, 255, 65, 0.2)',
                color: '#000000',
                fontWeight: 'bold'
              } : {}}
            >
              {format(date, "d")}
              {hasJournal && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-x-2 w-1 h-1 bg-blue-400 rounded-full" />
              )}
              {hasEnergy && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />
              )}
              {hasSupplements && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-x-2 w-1 h-1 bg-orange-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Statistics Panel */}
      <div className="mt-8">
        <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Workout Statistics</span>
            </div>
            {isStatsOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 bg-slate-800 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{totalStats.totalReps}</div>
                  <div className="text-sm text-slate-400">Total Reps All Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{monthlyStats.workoutsCompleted}</div>
                  <div className="text-sm text-slate-400">Workouts Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{monthlyStats.monthlyGoalPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">Workouts Completed This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{totalStats.totalGoalPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">Workout Consistency</div>
                </div>
              </div>

              {/* Individual Workout Totals Panel */}
              <div className="mt-4">
                <Collapsible open={isWorkoutTotalsOpen} onOpenChange={setIsWorkoutTotalsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span className="text-white font-medium text-sm">Individual Workout Totals</span>
                    </div>
                    {isWorkoutTotalsOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 space-y-2">
                      {individualWorkoutTotals.length > 0 ? (
                        individualWorkoutTotals.map((workout) => (
                          <div key={workout.id} className="flex items-center justify-between p-2 bg-slate-600 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${colorClassMap[workout.color]}`}></div>
                              <span className="text-sm font-medium text-white">{workout.name}</span>
                            </div>
                            <span className="text-sm font-bold text-white">{workout.totalReps}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-slate-400 text-sm">No workouts created yet</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Journal Panel */}
      <div className="mt-4">
        <Collapsible open={isJournalOpen} onOpenChange={setIsJournalOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
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
            <div className="mt-4 bg-slate-800 rounded-xl p-4">
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
                    className="w-full h-32 p-3 bg-slate-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleJournalSubmit}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                    >
                      Save Entry
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setJournalText('');
                      }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
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

      {/* Energy Level Panel */}
      <div className="mt-4">
        <Collapsible open={isEnergyOpen} onOpenChange={setIsEnergyOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Energy Level</span>
            </div>
            {isEnergyOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 bg-slate-800 rounded-xl p-6">
              {selectedDate ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Energy Level for {format(selectedDate, "MMMM d, yyyy")}
                    </h3>
                    <p className="text-sm text-slate-400">Tap the circle to increase energy level (1-10)</p>
                  </div>
                  
                  {/* Energy Circle */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <button
                        onClick={handleEnergyTap}
                        className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full"
                      >
                        <svg
                          width="200"
                          height="200"
                          className="transform -rotate-90"
                        >
                          {/* Background circle */}
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="rgba(148, 163, 184, 0.3)"
                            strokeWidth="12"
                          />
                          
                          {/* Progress circle */}
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${(energyLevel / 10) * 502.65} 502.65`}
                            className="transition-all duration-300"
                            style={{
                              transformOrigin: '100px 100px',
                            }}
                          />
                          
                          {/* Center circle for number */}
                          <circle
                            cx="100"
                            cy="100"
                            r="45"
                            fill="rgba(30, 41, 59, 0.8)"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                          />
                        </svg>
                        
                        {/* Energy level number */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-3xl font-bold text-white">{energyLevel}</span>
                        </div>
                      </button>
                    </div>
                    
                    {/* Undo Button */}
                    <button
                      onClick={handleEnergyUndo}
                      className="flex items-center justify-center w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
                      title="Undo (decrease energy level)"
                    >
                      <Undo2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (selectedDate) {
                          setEnergyLevelForDate(selectedDate, energyLevel);
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                    >
                      Save Energy Level
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setEnergyLevel(0);
                      }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Energy Level Trend Visualization */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-6 border border-purple-500/20">
                    <h3 className="text-lg font-medium text-white mb-4 text-center">Energy Level Trends</h3>
                    <EnergyTrendVisualization />
                  </div>
                  
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">Tap on a day in the calendar to set your energy level</p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Supplements Panel */}
      <div className="mt-4">
        <Collapsible open={isSupplementsOpen} onOpenChange={setIsSupplementsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-2">
              <Pill className="w-5 h-5 text-orange-400" />
              <span className="text-white font-medium">Supplements</span>
            </div>
            {isSupplementsOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 bg-slate-800 rounded-xl p-6">
              {selectedDate ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Supplements for {format(selectedDate, "MMMM d, yyyy")}
                    </h3>
                  </div>
                  
                  {/* Supplement Stats Boxes */}
                  <div className="grid grid-cols-3 gap-3">
                    {(() => {
                      const stats = getSupplementStats();
                      return (
                        <>
                          {/* Adherence Ring */}
                          <div className="bg-slate-700 rounded-xl p-4 text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                              <svg width="64" height="64" className="transform -rotate-90">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="rgba(148, 163, 184, 0.3)"
                                  strokeWidth="4"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="rgb(251, 146, 60)"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(stats.adherencePercentage / 100) * 175.93} 175.93`}
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{stats.adherencePercentage}%</span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400">Adherence</div>
                          </div>

                          {/* Current Streak */}
                          <div className="bg-slate-700 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-400 mb-1">{stats.currentStreak}</div>
                            <div className="text-xs text-slate-400">Current Streak</div>
                          </div>

                          {/* Total Taken */}
                          <div className="bg-slate-700 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-400 mb-1">{stats.totalTaken}</div>
                            <div className="text-xs text-slate-400">Total Taken</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Add Supplement Button */}
                  <div className="flex justify-end">
                    <AddSupplementDialog />
                  </div>

                  {/* Daily Supplements List */}
                  <div className="space-y-3">
                    {supplements.length > 0 ? (
                      supplements.map((supplement) => {
                        const dateStr = format(selectedDate, 'yyyy-MM-dd');
                        const supplementLogs = getSupplementLogsForDate(dateStr);
                        const isTaken = supplementLogs[supplement.id] || false;

                        return (
                          <div
                            key={supplement.id}
                            className="flex items-center justify-between p-4 bg-slate-700 rounded-xl"
                          >
                            <div className="flex items-center space-x-3">
                              <Pill className="w-5 h-5 text-orange-400" />
                              <div>
                                <div className="text-white font-medium">{supplement.name}</div>
                                <div className="text-sm text-slate-400">
                                  {supplement.amount} {supplement.measurementType}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSupplementLog(dateStr, supplement.id, !isTaken);
                              }}
                              className={`w-12 h-12 rounded-full transition-colors ${
                                isTaken
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-slate-600 hover:bg-slate-500 border-2 border-slate-500'
                              }`}
                            >
                              {isTaken && <CheckCircle className="w-6 h-6 text-white mx-auto" />}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Pill className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 mb-4">No supplements added yet</p>
                        <AddSupplementDialog />
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                      }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Supplement Overview Stats */}
                  <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-xl p-6 border border-orange-500/20">
                    <h3 className="text-lg font-medium text-white mb-4 text-center">Supplement Overview</h3>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {(() => {
                        const stats = getSupplementStats();
                        return (
                          <>
                            {/* Adherence Ring */}
                            <div className="bg-orange-900/30 rounded-lg p-3 text-center">
                              <div className="relative w-12 h-12 mx-auto mb-2">
                                <svg width="48" height="48" className="transform -rotate-90">
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    fill="none"
                                    stroke="rgba(148, 163, 184, 0.3)"
                                    strokeWidth="3"
                                  />
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    fill="none"
                                    stroke="rgb(251, 146, 60)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(stats.adherencePercentage / 100) * 125.66} 125.66`}
                                    className="transition-all duration-300"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-orange-300">{stats.adherencePercentage}%</span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-400">Adherence</div>
                            </div>

                            {/* Current Streak */}
                            <div className="bg-orange-900/30 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-orange-300 mb-1">{stats.currentStreak}</div>
                              <div className="text-xs text-slate-400">Current Streak</div>
                            </div>

                            {/* Total Taken */}
                            <div className="bg-orange-900/30 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-orange-300 mb-1">{stats.totalTaken}</div>
                              <div className="text-xs text-slate-400">Total Taken</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Add Supplement Button */}
                    <div className="flex justify-center">
                      <AddSupplementDialog />
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">Tap on a day in the calendar to log your supplements</p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}