import { focusDashboardOnOpen, returnDashboardFocus } from '@/lib/dashboard-navigation';
import { DashboardMenu } from '@/components/DashboardMenu';
import { VersionLabel } from "@/components/VersionLabel";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect } from 'react';
import { Plus, Edit, Undo2, Trash2, CalendarDays, CheckCircle, Scale, Settings, Menu, User, Clock, Target, TrendingUp, Calculator, UtensilsCrossed, Play, Pause, Square, StopCircle, RotateCcw, ChevronDown, ChevronUp, ChevronRight, Timer, Activity, Brain, Droplet } from 'lucide-react';
import { useLocation } from 'wouter';
import { useWorkouts } from '@/hooks/use-workouts';
import { useControls } from '@/hooks/use-controls';
import { useTimer } from '@/hooks/use-timer';
import { useWorkoutDuration } from '@/hooks/use-workout-duration';
import { useToast } from '@/hooks/use-toast';
import { WorkoutModal } from '@/components/workout-modal';
import { ProgressCircle } from '@/components/progress-circle';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TimerWheel } from '@/components/TimerWheel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GoalCircle } from '@/components/GoalCircle';
import { getColorClass } from '@/lib/color-utils';


export default function Home() {
  const [, navigate] = useLocation();
  const { isQuoteHidden, isTodaysTotalsHidden, isRecentActivityHidden } = useControls();
  const { toast } = useToast();

  const {
    addWorkout,
    incrementWorkout,
    decrementWorkout,
    deleteWorkout,
    updateWorkout,
    updateWorkoutGoal,
    getTodaysTotals,
    getRecentActivity,
    getAvailableColors,
    getWorkoutArray,
    canAddMoreWorkouts,
    isWorkoutActiveOnDay,
    getRoutineArray,
    getWorkoutsByDays
  } = useWorkouts();

  const { timerState, startTimer, startTimerFromSeconds, pauseTimer, resumeTimer, resetTimer, formatTime, getProgress } = useTimer();
  const { 
    isActive: isWorkoutActive, 
    isPaused: isWorkoutPaused, 
    startWorkout, 
    stopWorkout, 
    resetWorkout, 
    pauseWorkout, 
    resumeWorkout, 
    getCurrentSessionDuration 
  } = useWorkoutDuration();


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickingWorkout, setClickingWorkout] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<{ id: string; name: string; color: string; dailyGoal: number; setsGoal?: number; weightLbs?: number; scheduledDays?: number[] } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerHours, setTimerHours] = useState<string>('0');
  const [timerMinutes, setTimerMinutes] = useState<string>('0');
  const [timerSeconds, setTimerSeconds] = useState<string>('0');
  const [isRecentActivityOpen, setIsRecentActivityOpen] = useState(false);

  // Check if we should open dashboard on load
  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    const dashboardState = sessionStorage.getItem('fitcircle_dashboard_open');
    
    if (shouldOpenDashboard || dashboardState === 'true') {
      setIsSidebarOpen(true);
      // Clear the URL parameter and session storage
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem('fitcircle_dashboard_open');
    }
  }, []);

  // Update username when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setUserName(localStorage.getItem('fitcircle_username') || 'User');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  const workouts = getWorkoutArray();
  const getWorkoutById = (id: string) => workouts.find(w => w.id === id);
  const todaysTotals = getTodaysTotals();
  const recentActivity = getRecentActivity();
  const availableColors = getAvailableColors();
  
  // Filter workouts that should be active today
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todaysWorkouts = workouts.filter(workout => isWorkoutActiveOnDay(workout, today));
  
  // Get today's routine
  const routines = getRoutineArray();
  const todaysRoutine = routines.find(routine => routine.selectedDays.includes(today));
  

  // Get current week's days with scheduled workouts
  const getWeekDays = () => {
    const today = new Date();
    const sunday = new Date(today.setDate(today.getDate() - today.getDay()));
    
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);
      
      return {
        dayOfWeek: index, // 0-6
        name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workouts: workouts.filter(workout => isWorkoutActiveOnDay(workout, index))
      };
    });
  };
  
  const weekDays = getWeekDays();

  const handleWorkoutClick = (workoutId: string) => {
    const todayTotal = todaysTotals.find(t => t.id === workoutId);

    if (todayTotal && todayTotal.progress.count >= todayTotal.progress.goal) return;

    if (!incrementWorkout(workoutId)) { toast({title:'Workout was not saved',description:'Please retry. Your recorded progress has been kept.',variant:'destructive'}); return; }
    setClickingWorkout(workoutId);
    setTimeout(() => setClickingWorkout(null), 200);
  };

  const handleWorkoutHoldIncrement = (workoutId: string) => {
    const todayTotal = todaysTotals.find(t => t.id === workoutId);

    if (todayTotal && todayTotal.progress.count >= todayTotal.progress.goal) return;

    // Increment by 1 for hold functionality
    if (!incrementWorkout(workoutId)) { toast({title:'Workout was not saved',description:'Please retry. Your recorded progress has been kept.',variant:'destructive'}); return; }
    setClickingWorkout(workoutId);
    setTimeout(() => setClickingWorkout(null), 200);
  };

  const handleUndo = (workoutId: string) => {
    if (!(todaysTotals.find(t => t.id === workoutId)?.progress.count)) return;
    if (!decrementWorkout(workoutId)) toast({title:'Undo was not saved',description:'Please retry.',variant:'destructive'});
  };

  const handleDeleteWorkout = (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout? This will remove all its data.')) {
      deleteWorkout(workoutId);
    }
  };

  const handleAddWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[], setsGoal = 1) => {
    const saved = editingWorkout
      ? updateWorkout(editingWorkout.id, name, dailyGoal, weightLbs, scheduledDays, color, setsGoal)
      : addWorkout(name, color, dailyGoal, weightLbs, scheduledDays, undefined, setsGoal);
    if (saved) setEditingWorkout(null);
    return saved;

  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout({
      id: workout.id,
      name: workout.name,
      color: workout.color,
      dailyGoal: workout.dailyGoal,
      setsGoal: workout.setsGoal,
      weightLbs: workout.weightLbs,
      scheduledDays: workout.scheduledDays
    });
    setIsModalOpen(true);
  };

  const getScheduledDaysText = (scheduledDays: number[]): string => {
    if (!scheduledDays || scheduledDays.length === 7) return 'Daily';
    if (scheduledDays.length === 5 && scheduledDays.every(day => day >= 1 && day <= 5)) return 'Weekdays';
    if (scheduledDays.length === 2 && scheduledDays.includes(0) && scheduledDays.includes(6)) return 'Weekends';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return scheduledDays.map(day => dayNames[day]).join(', ');
  };



  // Account for timer circle (1 slot) + add workout button (1 slot if available) + actual workouts
  const timerSlots = 1; // Timer always takes 1 slot
  const addWorkoutSlots = canAddMoreWorkouts() ? 1 : 0;
  const usedSlots = workouts.length + timerSlots + addWorkoutSlots;
  const minSlots = Math.max(6, usedSlots); // Ensure at least 6 total slots for good layout
  const emptySlots = Math.max(0, minSlots - usedSlots);




  return (
    <div 
      className="container mx-auto px-4 max-w-md min-h-screen text-strong"
      style={{ backgroundColor: 'var(--page-background)' }}
    >
      {/* Header Section - Fixed */}
      <AppHeader>
        <div className="relative text-center max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          {/* Hamburger Menu Icon */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 left-4 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-strong transition-colors"
            title="Open Menu"
          >
            <Menu size={22} />
          </button>

          <h1 className="fitcircle-wordmark text-2xl font-bold text-strong">FitCircle</h1>
        </div>
      </AppHeader>

      {/* Main content; header spacing is handled by normal flow */}
      <div>
      {!isQuoteHidden && <QuoteOfTheDay compact />}

      <section className="mb-4" aria-labelledby="today-workout-heading">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <h2 id="today-workout-heading" className="text-2xl font-bold text-strong">Today's Workout</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {todaysRoutine && <><span className="entity-name">{todaysRoutine.name}</span><span aria-hidden="true"> · </span></>}
          {todaysWorkouts.length} {todaysWorkouts.length === 1 ? 'exercise' : 'exercises'}
        </p>
      </section>

      {/* Start Workout Session Section */}
      <section className="mb-5" aria-label="Workout session">
        <div>
          <div className="flex flex-col items-center space-y-4">
            {!isWorkoutActive ? (
              <>
                <button
                  onClick={startWorkout}
                  aria-describedby="workout-session-help"
                  className="text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg transition-all duration-200 w-full"
                  style={{
                    background: 'var(--session-start-background)',
                    boxShadow: 'var(--session-start-shadow)'
                  }}
                >
                  <Play className="w-5 h-5 text-black" />
                  <span className="text-base text-black whitespace-nowrap">Start Workout Session</span>
                </button>
                <p id="workout-session-help" className="sr-only">Start a Workout Session to track the duration of your workouts</p>
              </>
            ) : (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="bg-surface-secondary rounded-xl py-4 px-6 flex items-center justify-between w-full max-w-xs" style={{ minHeight: '56px' }}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isWorkoutPaused ? 'bg-yellow-400' : 'bg-accent-bright animate-pulse'}`}></div>
                    <span className="text-strong type-metric text-xl">{getCurrentSessionDuration()}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={stopWorkout}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 text-on-action rounded-full flex items-center justify-center transition-colors"
                      title="Stop workout"
                    >
                      <StopCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={isWorkoutPaused ? resumeWorkout : pauseWorkout}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-on-action rounded-full flex items-center justify-center transition-colors"
                      title={isWorkoutPaused ? "Resume workout" : "Pause workout"}
                    >
                      {isWorkoutPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={resetWorkout}
                      className="w-10 h-10 bg-control-strong hover:bg-surface-secondary text-strong rounded-full flex items-center justify-center transition-colors"
                      title="Reset without saving"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">Workout session in progress</p>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Workout Circles Grid */}
      <section className="mb-8">
        <div className="space-y-5 overflow-visible">
          {/* No Workouts Message */}
          {todaysRoutine && todaysWorkouts.length === 0 && (
            <div className="glass-panel bg-surface rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-strong mb-2">No workouts scheduled for today!</h3>
              <p className="text-supporting">Enjoy an active recovery day!</p>
            </div>
          )}

          {/* Workout Circles Grid */}
          {todaysWorkouts.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {todaysWorkouts.map((workout) => {
                const todayTotal = todaysTotals.find(t => t.id === workout.id);
                const currentCount = todayTotal?.count || 0;
                const progress = todayTotal!.progress;

                return (
                  <div key={workout.id} className="home-workout-card flex min-w-0 w-full flex-col items-center rounded-[18px] bg-surface p-3" data-testid={`home-workout-${workout.id}`}>
                    <ProgressCircle
                      ariaLabel={`Record a ${progress.mode === "sets" ? "set" : "rep"} for ${workout.name}: ${progress.count} of ${progress.goal}`}
                      cardStyle
                      unitLabel={progress.mode === "sets" ? "Sets" : "Reps"}
                      displayRatio={progress.mode === "sets"}
                      count={progress.count}
                      goal={progress.goal}
                      color={workout.color}
                      size={112}
                      strokeWidth={7}
                      onClick={() => handleWorkoutClick(workout.id)}
                      onHoldIncrement={() => handleWorkoutHoldIncrement(workout.id)}
                      isAnimating={clickingWorkout === workout.id}
                    />
                    <div className="min-w-0 w-full text-center">
                      <h3 className="home-workout-name mt-2 text-sm font-semibold text-strong">{workout.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1"><span className="type-metric">{currentCount} / {progress.repGoal}</span> reps{progress.mode === "reps" && <span className="block">Rep tracking today</span>}</p>
                      {workout.weightLbs && (
                        <div className="text-xs text-muted-foreground">
                          {workout.weightLbs} lbs
                        </div>
                      )}
                    </div>
                    <div className="mt-auto flex items-center gap-1 pt-1">
                      <button
                        onClick={() => handleUndo(workout.id)}
                        className="text-muted-foreground hover:text-subtle transition-colors min-h-11 min-w-11 flex items-center justify-center"
                        aria-label={`Undo last ${progress.mode === "sets" ? "set" : "rep"} for ${workout.name}`}
                        title={progress.mode === "sets" ? "Undo last set" : "Undo last rep"}
                      >
                        <Undo2 size={18} />
                      </button>
                      <button
                        onClick={() => handleEditWorkout(workout)}
                        className="text-muted-foreground hover:text-feature-red transition-colors min-h-11 min-w-11 flex items-center justify-center"
                        aria-label={`Edit ${workout.name}`}
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timer and Add Workout - Secondary tools */}
          <div className="grid grid-cols-2 gap-3">
            {/* Timer Circle */}
            <div className="home-workout-utility flex flex-col items-center space-y-2 rounded-[18px] border border-separator p-3">
              <button
                onClick={() => {
                  if (timerState.isCompleted) {
                    // Timer completed - reset and open setup modal
                    resetTimer();
                    setTimerHours('0');
                    setTimerMinutes('0');
                    setTimerSeconds('0');
                    setIsTimerOpen(true);
                  } else if (timerState.remainingTime > 0) {
                    // Timer is running - toggle pause/resume
                    timerState.isRunning ? pauseTimer() : resumeTimer();
                  } else {
                    // Timer is not running - open setup modal
                    setIsTimerOpen(true);
                  }
                }}
                className="relative"
                title={timerState.isCompleted ? "Reset Timer" : 
                       timerState.remainingTime > 0 ? (timerState.isRunning ? "Pause Timer" : "Resume Timer") : "Open Timer"}
              >
                <div className="relative" style={{ width: '96px', height: '96px' }}>
                  {/* Progress rings - positioned behind the circle */}
                  {timerState.remainingTime > 0 && !timerState.isCompleted && (
                    <div className="absolute inset-0">
                      <svg width="96" height="96" className="transform -rotate-90">
                        {/* Background ring */}
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="var(--bmi-track)"
                          strokeWidth="8"
                          fill="none"
                        />
                        {/* Progress ring */}
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke={timerState.isRunning ? "var(--bmi-green)" : "var(--timer-inactive)"}
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset={`${2 * Math.PI * 44 * (1 - getProgress() / 100)}`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {timerState.remainingTime > 0 && timerState.isCompleted && (
                    <div className="absolute inset-0">
                      <svg width="96" height="96" className="transform -rotate-90">
                        {/* Background ring */}
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="var(--bmi-track)"
                          strokeWidth="8"
                          fill="none"
                        />
                        {/* Completed ring */}
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="var(--bmi-green)"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset="0"
                          className="transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Timer circle - positioned on top */}
                  <div className="home-utility-circle absolute top-2 left-2 w-20 h-20 rounded-full bg-surface flex items-center justify-center border-4 border-separator hover:border-control transition-colors z-10" style={{ width: '80px', height: '80px' }}>
                    {timerState.remainingTime > 0 && timerState.isCompleted ? (
                      <CheckCircle className="w-8 h-8 text-accent-text" />
                    ) : timerState.remainingTime > 0 && !timerState.isRunning ? (
                      <Play className="w-8 h-8 text-feature-blue" />
                    ) : (
                      <Timer className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
              <div className="text-center">
                <div className="text-sm text-supporting font-medium">
                  {timerState.remainingTime > 0 && !timerState.isCompleted ? formatTime(timerState.remainingTime) : 
                   timerState.isCompleted ? "Completed!" : "Timer"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {timerState.remainingTime > 0 && !timerState.isCompleted ? 
                    (timerState.isRunning ? "Running" : "Paused") :
                    timerState.isCompleted ? "Tap to reset" :
                    "Tap to start"
                  }
                </div>
              </div>
              
              {/* Timer Controls - Only show when timer is active */}
              {timerState.remainingTime > 0 && (
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Restart timer with the original total time
                      startTimerFromSeconds(timerState.totalTime);
                    }}
                    className="text-muted-foreground hover:text-subtle transition-colors p-1"
                    title="Restart timer from beginning"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTimer();
                      setTimerHours('0');
                      setTimerMinutes('0');
                      setTimerSeconds('0');
                    }}
                    className="text-muted-foreground hover:text-feature-red transition-colors p-1"
                    title="Stop timer"
                  >
                    <Square size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Add Workout Button */}
            {canAddMoreWorkouts() && (
              <div className="home-workout-utility flex flex-col items-center space-y-2 rounded-[18px] border border-separator p-3">
                <div className="w-24 h-24 flex items-center justify-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="home-utility-circle w-20 h-20 rounded-full bg-surface flex items-center justify-center border-4 border-dashed border-separator hover:border-control transition-colors"
                  style={{ width: '80px', height: '80px' }}
                  title="Add new workout"
                >
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </button>
                </div>
                <div className="text-center">
                  <div className="text-sm text-supporting font-medium">Add</div>
                  <div className="text-xs text-muted-foreground">New workout</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Today's Totals Section */}
      {!isTodaysTotalsHidden && todaysTotals.some(w => w.count > 0) && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-strong">Today's Totals</h2>
          <div className="glass-panel bg-surface rounded-xl p-4 space-y-3">
            {todaysTotals.filter(w => w.count > 0).map((workout) => (
              <div key={workout.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getColorClass(workout.color)}`}></div>
                  <span className="entity-name font-medium text-strong">{workout.name}</span>
                </div>
                <span className="type-metric shrink-0 text-lg font-bold text-strong">{typeof workout.count === 'number' ? workout.count : 0}</span>
              </div>
            ))}
          </div>
        </section>
      )}







      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkout(null);
        }}
        onSave={handleAddWorkout}
        onDelete={handleDeleteWorkout}
        availableColors={availableColors}
        editingWorkout={editingWorkout}
      />

      {/* Sidebar Dashboard */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" onOpenAutoFocus={focusDashboardOnOpen} onCloseAutoFocus={returnDashboardFocus} className="w-80 bg-canvas border-separator outline-none">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            {/* Local training overview; use the existing completed-day statistic. */}
            <DashboardMenu open={isSidebarOpen} returnTo="/" onNavigate={() => setIsSidebarOpen(false)} />

            <div className="p-4 border-t border-separator">
              <VersionLabel onActivate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Timer Dialog */}
      <Dialog open={isTimerOpen} onOpenChange={setIsTimerOpen}>
        <DialogContent staticBody fixedFooter className="timer-dialog bg-canvas text-strong border-separator max-w-sm rounded-2xl p-4 gap-4">
          <DialogHeader className="text-left sm:text-left pl-0 pr-10">
            <DialogTitle className="text-2xl font-bold">Timer</DialogTitle>
            <DialogDescription className="sr-only">Choose hours, minutes and seconds, then start your timer.</DialogDescription>
          </DialogHeader>
          <div className="timer-picker">
            <div className="timer-picker-selection" aria-hidden="true" />
            <TimerWheel label="Hours" unit="hours" max={23} value={Number(timerHours)} onChange={value => setTimerHours(String(value))} />
            <TimerWheel label="Minutes" unit="min" max={59} value={Number(timerMinutes)} onChange={value => setTimerMinutes(String(value))} />
            <TimerWheel label="Seconds" unit="sec" max={59} value={Number(timerSeconds)} onChange={value => setTimerSeconds(String(value))} />
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between sm:space-x-0">
            <Button onClick={() => setIsTimerOpen(false)} className="w-16 h-16 rounded-full bg-surface text-supporting hover:bg-surface-secondary p-0">Cancel</Button>
            <Button
              disabled={Number(timerHours) * 3600 + Number(timerMinutes) * 60 + Number(timerSeconds) === 0}
              onClick={() => {
                const totalSeconds = Number(timerHours) * 3600 + Number(timerMinutes) * 60 + Number(timerSeconds);
                if (totalSeconds > 0) { startTimerFromSeconds(totalSeconds); setIsTimerOpen(false); }
              }}
              className="w-16 h-16 rounded-full bg-accent-bright/15 text-accent-text hover:bg-accent-bright/25 disabled:opacity-40 p-0"
            >Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>

    </div>
  );
}
