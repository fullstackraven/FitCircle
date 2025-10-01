import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BarChart3,
  BookOpen,
  Zap,
  Pill,
  Heart,
  Calendar as CalendarIcon,
  CalendarDays
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSupplements } from "@/hooks/use-supplements";
import { useRecovery } from "@/hooks/use-recovery";
import { useEnergyLevel } from "@/hooks/use-energy-level";
import { useWorkoutDuration } from "@/hooks/use-workout-duration";
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
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameWeek,
  endOfDay,
  startOfDay
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

// Weekly view pages
type WeeklyViewPage = 'workouts' | 'duration' | 'journal' | 'energy' | 'supplements';

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
  const {
    getWorkoutDurationForDate
  } = useWorkoutDuration();

  const workouts = getWorkoutArray() || [];
  const logs = getDailyLogs() || {};

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [weeklyPage, setWeeklyPage] = useState<WeeklyViewPage>('workouts');

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

  // Get week days
  const getWeekDays = () => {
    const start = startOfWeek(currentWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  // Get week range string
  const getWeekRangeString = () => {
    const weekDays = getWeekDays();
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    
    // If same month
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'd, yyyy')}`;
    } else {
      return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'MMM d, yyyy')}`;
    }
  };

  // Get total reps for a date
  const getTotalRepsForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dateLog = logs[dateStr];
    if (!dateLog) return 0;
    
    let total = 0;
    Object.keys(dateLog).forEach(workoutId => {
      const logEntry = dateLog[workoutId];
      const count = typeof logEntry === 'object' ? logEntry.count : (logEntry || 0);
      total += count;
    });
    
    return total;
  };

  // Get total duration for a date (in minutes)
  const getTotalDurationForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Get duration in seconds from the workout duration hook, convert to minutes
    const durationInSeconds = getWorkoutDurationForDate(dateStr);
    return Math.round(durationInSeconds / 60);
  };

  // Weekly Pages Data
  const pages: { id: WeeklyViewPage; title: string }[] = [
    { id: 'workouts', title: 'WORKOUTS' },
    { id: 'duration', title: 'DURATION' },
    { id: 'journal', title: 'JOURNAL' },
    { id: 'energy', title: 'ENERGY LEVEL' },
    { id: 'supplements', title: 'SUPPLEMENTS' }
  ];

  const currentPageIndex = pages.findIndex(p => p.id === weeklyPage);

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setWeeklyPage(pages[currentPageIndex + 1].id);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setWeeklyPage(pages[currentPageIndex - 1].id);
    }
  };

  // Generate calendar days for monthly view
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

  // Render weekly view content
  const renderWeeklyContent = () => {
    const weekDays = getWeekDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    switch (weeklyPage) {
      case 'workouts':
        const weekTotalReps = weekDays.reduce((sum, date) => sum + getTotalRepsForDate(date), 0);
        return (
          <div className="space-y-3">
            <h3 className="text-center text-base font-semibold text-white mb-3">WORKOUTS</h3>
            <div className="flex items-end justify-between h-40 px-2 gap-2">
              {weekDays.map((date, index) => {
                const totalReps = getTotalRepsForDate(date);
                const isRecovery = isRecoveryDay(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
                const barHeightPercent = Math.min((totalReps / 800) * 100, 100);
                const barHeight = isRecovery ? 100 : (totalReps > 0 ? Math.max(barHeightPercent, 5) : 0);
                const barColor = isRecovery ? '#ff8c00' : '#00ff41';
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                      {totalReps > 0 || isRecovery ? (
                        <div 
                          className="w-full max-w-[35px] rounded-t-2xl transition-all"
                          style={{
                            height: `${barHeight}%`,
                            backgroundColor: barColor,
                            boxShadow: `0 0 8px ${barColor}40`
                          }}
                        />
                      ) : (
                        <div className="w-full max-w-[35px] h-1 bg-slate-700 rounded-full" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{dayNames[index]}</div>
                    <div className="text-xs text-slate-500">{totalReps}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">Total Reps: {weekTotalReps}</div>
          </div>
        );

      case 'duration':
        return (
          <div className="space-y-3">
            <h3 className="text-center text-base font-semibold text-white mb-3">DURATION</h3>
            <div className="h-40 px-2">
              <div className="relative h-[120px]">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <line
                      key={percent}
                      x1="0"
                      y1={100 - percent}
                      x2="100"
                      y2={100 - percent}
                      stroke="rgba(100, 116, 139, 0.2)"
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  
                  {/* Duration line - connects all points */}
                  <polyline
                    points={weekDays.map((date, index) => {
                      const duration = getTotalDurationForDate(date);
                      const maxDuration = Math.max(...weekDays.map(d => getTotalDurationForDate(d)), 60);
                      const x = (index / 6) * 100;
                      const y = 100 - ((duration / maxDuration) * 100);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#00ff41"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 65, 0.5))' }}
                  />
                  
                  {/* Data points */}
                  {weekDays.map((date, index) => {
                    const duration = getTotalDurationForDate(date);
                    const maxDuration = Math.max(...weekDays.map(d => getTotalDurationForDate(d)), 60);
                    const x = (index / 6) * 100;
                    const y = 100 - ((duration / maxDuration) * 100);
                    
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="2"
                        fill="#00ff41"
                        vectorEffect="non-scaling-stroke"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 65, 0.5))' }}
                      />
                    );
                  })}
                </svg>
              </div>
              
              {/* Day labels */}
              <div className="flex justify-between mt-1">
                {dayNames.map((name, index) => (
                  <div key={index} className="text-xs text-slate-400 flex-1 text-center">{name}</div>
                ))}
              </div>
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">Minutes per day</div>
          </div>
        );

      case 'journal':
        return (
          <div className="space-y-3">
            <h3 className="text-center text-base font-semibold text-white mb-3">JOURNAL</h3>
            <div className="flex items-end justify-between h-40 px-2 gap-2">
              {weekDays.map((date, index) => {
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const hasJournal = (getJournalEntry(dateStr) || "").length > 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                      {hasJournal ? (
                        <div 
                          className="w-full max-w-[35px] rounded-t-2xl transition-all"
                          style={{
                            height: '100%',
                            backgroundColor: '#c084fc',
                            boxShadow: '0 0 8px rgba(192, 132, 252, 0.4)'
                          }}
                        />
                      ) : (
                        <div className="w-full max-w-[35px] h-1 bg-slate-700 rounded-full" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{dayNames[index]}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">Logged / Not Logged</div>
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-3">
            <h3 className="text-center text-base font-semibold text-white mb-3">ENERGY LEVEL</h3>
            <div className="flex items-end justify-between h-40 px-2 gap-2">
              {weekDays.map((date, index) => {
                const hasEnergy = hasEnergyLevel(date);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                      {hasEnergy ? (
                        <div 
                          className="w-full max-w-[35px] rounded-t-2xl transition-all"
                          style={{
                            height: '100%',
                            backgroundColor: '#facc15',
                            boxShadow: '0 0 8px rgba(250, 204, 21, 0.4)'
                          }}
                        />
                      ) : (
                        <div className="w-full max-w-[35px] h-1 bg-slate-700 rounded-full" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{dayNames[index]}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">Logged / Not Logged</div>
          </div>
        );

      case 'supplements':
        return (
          <div className="space-y-3">
            <h3 className="text-center text-base font-semibold text-white mb-3">SUPPLEMENTS</h3>
            <div className="flex items-end justify-between h-40 px-2 gap-2">
              {weekDays.map((date, index) => {
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const hasSupplements = hasSupplementsForDate(dateStr);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                      {hasSupplements ? (
                        <div 
                          className="w-full max-w-[35px] rounded-t-2xl transition-all"
                          style={{
                            height: '100%',
                            backgroundColor: '#60a5fa',
                            boxShadow: '0 0 8px rgba(96, 165, 250, 0.4)'
                          }}
                        />
                      ) : (
                        <div className="w-full max-w-[35px] h-1 bg-slate-700 rounded-full" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{dayNames[index]}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">Logged / Not Logged</div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-dvh" style={{ backgroundColor: 'hsl(222, 47%, 11%)', '--bottom-nav-padding': '200px' } as React.CSSProperties}>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => viewMode === 'monthly' ? setCurrentMonth(subMonths(currentMonth, 1)) : setCurrentWeek(subWeeks(currentWeek, 1))}
            className="text-slate-400 hover:text-white transition"
            data-testid="button-prev-period"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {viewMode === 'monthly' ? format(currentMonth, "MMMM yyyy") : getWeekRangeString()}
          </h2>
          <button
            onClick={() => viewMode === 'monthly' ? setCurrentMonth(addMonths(currentMonth, 1)) : setCurrentWeek(addWeeks(currentWeek, 1))}
            className="text-slate-400 hover:text-white transition"
            data-testid="button-next-period"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Toggle button */}
        <button
          onClick={() => {
            if (viewMode === 'monthly') {
              // When switching to weekly, sync the week to the current month
              setCurrentWeek(currentMonth);
              setViewMode('weekly');
            } else {
              // When switching to monthly, sync the month to the current week
              setCurrentMonth(currentWeek);
              setViewMode('monthly');
            }
          }}
          className="text-slate-400 hover:text-white transition-colors"
          data-testid="button-toggle-view"
        >
          {viewMode === 'monthly' ? <BarChart3 className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <>
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
              const dayNum = String(date.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${dayNum}`;
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
        </>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <div className="space-y-6 mb-6">
          {/* Weekly content */}
          <div className="bg-slate-900 rounded-xl p-4">
            {renderWeeklyContent()}
          </div>

          {/* Page navigation */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={prevPage}
              disabled={currentPageIndex === 0}
              className={`p-2 rounded-lg transition-colors ${
                currentPageIndex === 0 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page dots */}
            <div className="flex space-x-2">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => setWeeklyPage(page.id)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPageIndex 
                      ? 'bg-white w-4' 
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  data-testid={`dot-${page.id}`}
                />
              ))}
            </div>

            <button
              onClick={nextPage}
              disabled={currentPageIndex === pages.length - 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPageIndex === pages.length - 1 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              data-testid="button-next-page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Panels - Always visible */}
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
