import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Heart
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSupplements } from "@/hooks/use-supplements";
import { useRecovery } from "@/hooks/use-recovery";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddSupplementDialog } from "@/components/AddSupplementDialog";
import { GoalCircle } from "@/components/GoalCircle";
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
  const workouts = getWorkoutArray() || [];
  const logs = getDailyLogs() || {};

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isWorkoutTotalsOpen, setIsWorkoutTotalsOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isEnergyOpen, setIsEnergyOpen] = useState(false);
  const [isSupplementsOpen, setIsSupplementsOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [addSupplementDialogOpen, setAddSupplementDialogOpen] = useState(false);
  const [editingSupplementId, setEditingSupplementId] = useState<number | null>(null);
  const [editSupplementName, setEditSupplementName] = useState('');
  const [editSupplementAmount, setEditSupplementAmount] = useState('');
  const [editSupplementType, setEditSupplementType] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [journalText, setJournalText] = useState('');
  const [energyLevel, setEnergyLevel] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [supplementsRefresh, setSupplementsRefresh] = useState(0);
  const [journalFocused, setJournalFocused] = useState(false);
  const [tempSupplementLogs, setTempSupplementLogs] = useState<Record<number, boolean>>({});
  const circleRef = useRef<SVGSVGElement>(null);

  // Supplement editing functions
  const handleEditSupplement = (supplement: any) => {
    setEditingSupplementId(supplement.id);
    setEditSupplementName(supplement.name);
    setEditSupplementAmount(supplement.amount.toString());
    setEditSupplementType(supplement.measurementType);
  };

  const handleSaveEdit = () => {
    if (editingSupplementId && editSupplementName.trim() && editSupplementAmount.trim() && editSupplementType.trim()) {
      editSupplement(editingSupplementId, {
        name: editSupplementName.trim(),
        amount: parseFloat(editSupplementAmount),
        measurementType: editSupplementType.trim()
      });
      setEditingSupplementId(null);
      setEditSupplementName('');
      setEditSupplementAmount('');
      setEditSupplementType('');
      setSupplementsRefresh(prev => prev + 1);
    }
  };

  const handleCancelEdit = () => {
    setEditingSupplementId(null);
    setEditSupplementName('');
    setEditSupplementAmount('');
    setEditSupplementType('');
  };

  const handleDeleteSupplement = (supplementId: number) => {
    if (window.confirm('Are you sure you want to delete this supplement? This will remove all historical data for this supplement.')) {
      deleteSupplement(supplementId);
      setSupplementsRefresh(prev => prev + 1);
    }
  };

  // Initialize with today's data on component mount
  useEffect(() => {
    const today = new Date();
    const energy = getEnergyLevel(today);
    setEnergyLevel(energy);
    
    // Load today's journal entry
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const entry = getJournalEntry(dateStr);
    setJournalText(entry || '');
    
    // Load today's supplement logs into temporary state
    const currentLogs = getSupplementLogsForDate(dateStr);
    setTempSupplementLogs(currentLogs);
  }, []);

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
    
    const today = new Date();
    const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (isToday) {
      // For today, check ALL current workouts (including newly added ones)
      if (workouts.length === 0) return false;
      return workouts.every(w => (dayLog[w.id] || 0) >= w.dailyGoal);
    } else {
      // For past days, only check workouts that actually have logged reps for this day
      // This ensures that adding new workouts doesn't affect past completion status
      const workoutsWithRepsOnThisDay = workouts.filter(w => dayLog[w.id] && dayLog[w.id] > 0);
      if (workoutsWithRepsOnThisDay.length === 0) return false;
      
      // Check if all workouts that were actively used on this day met their goals
      return workoutsWithRepsOnThisDay.every(w => dayLog[w.id] >= w.dailyGoal);
    }
  };

  const handleDayClick = (date: Date) => {
    // Allow clicking on any date, even if it's in a different month (for cross-month viewing)
    setSelectedDate(date);
    // Use local timezone date formatting to match workout data
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const existingEntry = getJournalEntry(dateStr);
    setJournalText(existingEntry);
    setEnergyLevel(getEnergyLevel(date));
    
    // Load supplement logs for this date into temporary state
    const currentLogs = getSupplementLogsForDate(dateStr);
    setTempSupplementLogs(currentLogs);
    
    setIsJournalOpen(true);
    setIsEnergyOpen(true);
    setIsSupplementsOpen(true);
  };

  const handleJournalSubmit = () => {
    const targetDate = selectedDate || new Date(); // Use today if no date selected
    
    // Use local timezone date formatting to match workout data
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    addJournalEntry(dateStr, journalText);
    
    // Only clear selected date if we had one, otherwise keep today's data
    if (selectedDate) {
      setSelectedDate(null);
      // Reload today's data
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      setJournalText(getJournalEntry(todayStr) || '');
    }
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

  const handleEnergySave = () => {
    const targetDate = selectedDate || new Date(); // Use today if no date selected
    setEnergyLevelForDate(targetDate, energyLevel);
    
    // Only clear selected date if we had one
    if (selectedDate) {
      setSelectedDate(null);
      // Reload today's data
      const today = new Date();
      setEnergyLevel(getEnergyLevel(today));
    }
  };

  const monthlyStats = getMonthlyStats(currentMonth.getFullYear(), currentMonth.getMonth()) || {
    monthlyReps: 0,
    monthlyCompletedDays: 0,
    monthlyConsistency: 0
  };
  const totalStats = getTotalStats() || {
    totalReps: 0,
    totalCompletedDays: 0,
    totalConsistency: 0
  };
  const individualWorkoutTotals = getIndividualWorkoutTotals() || [];

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
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
          const isRecovery = isRecoveryDay(dateStr);

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
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
              {/* {hasJournal && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-x-2 w-1 h-1 bg-blue-400 rounded-full" />
              )}
              {hasEnergy && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />
              )}
              {hasSupplements && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-x-2 w-1 h-1 bg-orange-400 rounded-full" />
              )} */}
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
            <div className="mt-4 bg-slate-800 rounded-xl p-4 space-y-6">
              {/* Total All Time Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-300 text-center">Total All Time</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-700 rounded-xl">
                    <div className="text-xl font-bold text-white">{totalStats.totalReps}</div>
                    <div className="text-xs text-slate-400">Total Reps</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700 rounded-xl">
                    <div className="text-xl font-bold text-white">{totalStats.totalCompletedDays}</div>
                    <div className="text-xs text-slate-400">Days Completed</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700 rounded-xl">
                    <div className="text-xl font-bold text-blue-400">{totalStats.totalConsistency.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Consistency</div>
                  </div>
                </div>
              </div>

              {/* Totals for This Month Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-300 text-center">Totals for This Month</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-700 rounded-xl">
                    <div className="text-xl font-bold text-white">{monthlyStats.monthlyReps}</div>
                    <div className="text-xs text-slate-400">Monthly Reps</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700 rounded-xl">
                    <div className="text-xl font-bold text-white">{monthlyStats.monthlyCompletedDays}</div>
                    <div className="text-xs text-slate-400">Days Completed</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700 rounded-xl">
                    <div className="text-xl font-bold text-green-400">{monthlyStats.monthlyConsistency.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Consistency</div>
                  </div>
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
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white">
                    Journal Entry for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}
                  </h3>
                  {selectedDate && (
                    <p className="text-sm text-slate-400 mt-1">
                      Viewing past entry - tap calendar to return to today
                    </p>
                  )}
                </div>
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  onFocus={() => setJournalFocused(true)}
                  onBlur={() => setJournalFocused(false)}
                  placeholder={journalFocused ? "" : "Write your daily journal entry here..."}
                  className="w-full h-32 p-3 bg-slate-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleJournalSubmit}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                  >
                    Save Entry
                  </button>
                  {selectedDate && (
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        // Reload today's data
                        const today = new Date();
                        const todayStr = format(today, 'yyyy-MM-dd');
                        setJournalText(getJournalEntry(todayStr) || '');
                      }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      Back to Today
                    </button>
                  )}
                </div>
              </div>
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
              <div className="space-y-6">
                {/* Energy Level Trend Visualization */}
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-6 border border-purple-500/20">
                  <h3 className="text-lg font-medium text-white mb-4 text-center">Energy Level Trends</h3>
                  <EnergyTrendVisualization />
                </div>
                
                {/* Today's Energy Level Input */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Energy Level for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}
                    </h3>
                    <p className="text-sm text-slate-400">Tap the circle to increase energy level (1-10)</p>
                    {selectedDate && (
                      <p className="text-sm text-slate-400 mt-1">
                        Viewing past entry - tap calendar to return to today
                      </p>
                    )}
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
                      onClick={handleEnergySave}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                    >
                      Save Energy Level
                    </button>
                    {selectedDate && (
                      <button
                        onClick={() => {
                          setSelectedDate(null);
                          // Reload today's data
                          const today = new Date();
                          setEnergyLevel(getEnergyLevel(today));
                        }}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                      >
                        Back to Today
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Recovery Panel */}
      <div className="mt-4">
        <Collapsible open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-orange-400" />
              <span className="text-white font-medium">Recovery</span>
            </div>
            {isRecoveryOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 bg-slate-800 rounded-xl p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Recovery for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Recovery days help maintain consistency without skipping workouts
                  </p>
                  {selectedDate && (
                    <p className="text-sm text-slate-400 mt-1">
                      Viewing past entry - tap calendar to return to today
                    </p>
                  )}
                </div>

                {/* Recovery Statistics Circle */}
                <div className="flex justify-center">
                  {(() => {
                    const stats = getRecoveryStats();
                    return (
                      <GoalCircle
                        percentage={stats.recoveryPercentage}
                        color="rgb(255, 140, 0)"
                        size={160}
                        currentValue={stats.totalRecoveryDays}
                        goalValue={stats.totalRecoveryDays}
                        unit="Days"
                        title="Recovery Rate"
                        description={`${stats.totalRecoveryDays} recovery of ${stats.totalActiveDays} active days`}
                      />
                    );
                  })()}
                </div>

                {/* Add/Remove Recovery Day Button */}
                <div className="flex justify-center">
                  {(() => {
                    const targetDate = selectedDate || new Date();
                    const dateStr = format(targetDate, 'yyyy-MM-dd');
                    const isCurrentlyRecovery = isRecoveryDay(dateStr);
                    
                    return (
                      <button
                        onClick={() => {
                          if (isCurrentlyRecovery) {
                            removeRecoveryDay(dateStr);
                          } else {
                            addRecoveryDay(dateStr);
                          }
                        }}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                          isCurrentlyRecovery
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        {isCurrentlyRecovery ? 'Remove Recovery Day' : 'Add Recovery Day'}
                      </button>
                    );
                  })()}
                </div>

                {selectedDate && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                      }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      Back to Today
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Supplements Panel */}
      <div className="mt-4">
        <Collapsible open={isSupplementsOpen} onOpenChange={setIsSupplementsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-2">
              <Pill className="w-5 h-5 text-green-400" />
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
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Supplements for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}
                  </h3>
                  {selectedDate && (
                    <p className="text-sm text-slate-400 mt-1">
                      Viewing past entry - tap calendar to return to today
                    </p>
                  )}
                </div>
                


                {/* Add Supplement Button */}
                <div className="flex justify-end">
                  <AddSupplementDialog onSupplementAdded={() => setSupplementsRefresh(prev => prev + 1)} />
                </div>

                {/* Daily Supplements List */}
                <div className="space-y-3">
                  {supplements.length > 0 ? (
                    supplements.map((supplement) => {
                      const targetDate = selectedDate || new Date();
                      const dateStr = format(targetDate, 'yyyy-MM-dd');
                      // Use temporary state instead of saved logs
                      const isTaken = tempSupplementLogs[supplement.id] || false;

                      return (
                        <div
                          key={supplement.id}
                          className="p-4 bg-slate-700 rounded-xl"
                        >
                          {editingSupplementId === supplement.id ? (
                            // Edit mode
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Pill className="w-5 h-5 text-green-400" />
                                <input
                                  type="text"
                                  value={editSupplementName}
                                  onChange={(e) => setEditSupplementName(e.target.value)}
                                  className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-xl border border-slate-500 focus:border-green-400 focus:outline-none"
                                  placeholder="Supplement name"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <input
                                  type="number"
                                  value={editSupplementAmount}
                                  onChange={(e) => setEditSupplementAmount(e.target.value)}
                                  className="w-20 bg-slate-600 text-white px-3 py-2 rounded-xl border border-slate-500 focus:border-green-400 focus:outline-none"
                                  placeholder="Amount"
                                />
                                <input
                                  type="text"
                                  value={editSupplementType}
                                  onChange={(e) => setEditSupplementType(e.target.value)}
                                  className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-xl border border-slate-500 focus:border-green-400 focus:outline-none"
                                  placeholder="Unit (mg, g, etc.)"
                                />
                              </div>
                              <div className="flex space-x-2 justify-end">
                                <button
                                  onClick={handleSaveEdit}
                                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center space-x-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Pill className="w-5 h-5 text-green-400" />
                                <div>
                                  <div className="text-white font-medium">{supplement.name}</div>
                                  <div className="text-sm text-slate-400">
                                    {supplement.amount} {supplement.measurementType}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditSupplement(supplement)}
                                  className="w-10 h-10 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors"
                                  title="Edit supplement"
                                >
                                  <Edit2 className="w-4 h-4 text-white" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSupplement(supplement.id)}
                                  className="w-10 h-10 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors"
                                  title="Delete supplement"
                                >
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                                <button
                                  onClick={() => {
                                    // Update temporary state instead of saving immediately
                                    setTempSupplementLogs(prev => ({
                                      ...prev,
                                      [supplement.id]: !isTaken
                                    }));
                                  }}
                                  className={`w-12 h-12 rounded-full transition-colors ${
                                    isTaken
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : 'bg-slate-600 hover:bg-slate-500 border-2 border-slate-500'
                                  }`}
                                  title="Mark as taken/not taken"
                                >
                                  {isTaken && <CheckCircle className="w-6 h-6 text-white mx-auto" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Pill className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 mb-4">No supplements added yet</p>
                        <AddSupplementDialog onSupplementAdded={() => setSupplementsRefresh(prev => prev + 1)} />
                      </div>
                    )}
                  </div>

                  {/* Save Button and Navigation */}
                  <div className="flex space-x-2 justify-center">
                    <button
                      onClick={() => {
                        // Save all temporary supplement logs to actual storage
                        const targetDate = selectedDate || new Date();
                        const dateStr = format(targetDate, 'yyyy-MM-dd');
                        
                        // Save each supplement state
                        Object.entries(tempSupplementLogs).forEach(([supplementId, taken]) => {
                          setSupplementLog(dateStr, parseInt(supplementId), taken);
                        });
                        
                        setSupplementsRefresh(prev => prev + 1); // Force re-render to show updated dots
                        alert('Supplement log saved successfully!');
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                    >
                      Save Supplements
                    </button>
                    {selectedDate && (
                      <button
                        onClick={() => {
                          setSelectedDate(null);
                          // Load today's supplement logs into temporary state
                          const today = new Date();
                          const todayStr = format(today, 'yyyy-MM-dd');
                          const todayLogs = getSupplementLogsForDate(todayStr);
                          setTempSupplementLogs(todayLogs);
                        }}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                      >
                        Back to Today
                      </button>
                    )}
                  </div>
                </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}