import { useState, useEffect } from 'react';
import { Plus, Edit, Undo2, Trash2, CalendarDays, CheckCircle, Scale, Settings, Menu, User, Clock, Brain, Droplet, Target, Bot, TrendingUp, Calculator, UtensilsCrossed, Activity, Timer, Play, Pause, Square, StopCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { useWorkouts } from '@/hooks/use-workouts';
import { useControls } from '@/hooks/use-controls';
import { useTimer } from '@/hooks/use-timer';
import { useWorkoutDuration } from '@/hooks/use-workout-duration';
import { WorkoutModal } from '@/components/workout-modal';
import { ProgressCircle } from '@/components/progress-circle';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { calculateWellnessScore } from '@/lib/goals-utils';
import { GoalCircle } from '@/components/GoalCircle';

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

export default function Home() {
  const [, navigate] = useLocation();
  const { isQuoteHidden, isTodaysTotalsHidden, isRecentActivityHidden } = useControls();

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
    isWorkoutActiveOnDay
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
  const [editingWorkout, setEditingWorkout] = useState<{ id: string; name: string; color: string; dailyGoal: number; weightLbs?: number; scheduledDays?: number[] } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerHours, setTimerHours] = useState<string>('0');
  const [timerMinutes, setTimerMinutes] = useState<string>('0');
  const [timerSeconds, setTimerSeconds] = useState<string>('0');
  const [isAllWorkoutsOpen, setIsAllWorkoutsOpen] = useState(false);
  const [isRecentActivityOpen, setIsRecentActivityOpen] = useState(false);
  const [isWellnessWeightsOpen, setIsWellnessWeightsOpen] = useState(false);
  const [wellnessWeights, setWellnessWeights] = useState({
    hydration: 20,
    meditation: 15,
    fasting: 15,
    cardio: 10,
    targetBodyFat: 10,
    targetWeight: 15,
    workoutConsistency: 15
  });

  // Check if we should open dashboard on load
  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    const dashboardState = sessionStorage.getItem('fitcircle_dashboard_open');
    
    if (shouldOpenDashboard || dashboardState === 'true') {
      setIsSidebarOpen(true);
      // Clear the URL parameter and session storage
      window.history.replaceState({}, '', '/');
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

  // Load wellness weights from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fitcircle_wellness_weights');
    if (saved) {
      try {
        setWellnessWeights(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse wellness weights:', e);
      }
    }
  }, []);

  // Save wellness weights to localStorage
  const saveWellnessWeights = (weights: typeof wellnessWeights) => {
    setWellnessWeights(weights);
    localStorage.setItem('fitcircle_wellness_weights', JSON.stringify(weights));
  };

  const workouts = getWorkoutArray();
  const getWorkoutById = (id: string) => workouts.find(w => w.id === id);
  const todaysTotals = getTodaysTotals();
  const recentActivity = getRecentActivity();
  const availableColors = getAvailableColors();
  
  // Filter workouts that should be active today
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todaysWorkouts = workouts.filter(workout => isWorkoutActiveOnDay(workout, today));

  const handleWorkoutClick = (workoutId: string) => {
    const todayTotal = todaysTotals.find(t => t.id === workoutId);
    const currentCount = todayTotal?.count || 0;
    const workout = getWorkoutById(workoutId);

    if (workout && currentCount >= workout.dailyGoal) return;

    incrementWorkout(workoutId);
    setClickingWorkout(workoutId);
    setTimeout(() => setClickingWorkout(null), 200);
  };

  const handleWorkoutHoldIncrement = (workoutId: string) => {
    const todayTotal = todaysTotals.find(t => t.id === workoutId);
    const currentCount = todayTotal?.count || 0;
    const workout = getWorkoutById(workoutId);

    if (workout && currentCount >= workout.dailyGoal) return;

    // Increment by 1 for hold functionality
    incrementWorkout(workoutId);
    setClickingWorkout(workoutId);
    setTimeout(() => setClickingWorkout(null), 200);
  };

  const handleUndo = (workoutId: string) => {
    decrementWorkout(workoutId);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout? This will remove all its data.')) {
      deleteWorkout(workoutId);
    }
  };

  const handleAddWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[]) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, name, dailyGoal, weightLbs, scheduledDays);
      setEditingWorkout(null);
    } else {
      addWorkout(name, color, dailyGoal, weightLbs, scheduledDays);
    }
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout({
      id: workout.id,
      name: workout.name,
      color: workout.color,
      dailyGoal: workout.dailyGoal,
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
      className="container mx-auto px-4 py-6 max-w-md min-h-screen text-white pb-32"
      style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}
    >
      {/* Header Section */}
      <header className="relative text-center mb-8">
        {/* Hamburger Menu Icon */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-0 left-0 text-slate-400 hover:text-white transition-colors"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>

        <h1 className="text-2xl font-bold mb-4 text-white">FitCircle</h1>

        {/* Calendar View Icon */}
        <button
          onClick={() => navigate('/calendar')}
          className="absolute top-0 right-0 text-slate-400 hover:text-white transition-colors"
          title="View Calendar"
        >
          <CalendarDays size={22} />
        </button>
      </header>

      {/* Quote of the Day */}
      {!isQuoteHidden && <QuoteOfTheDay />}

      {/* Start Workout Session Section */}
      <section className="mb-8">
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex flex-col items-center space-y-4">
            {!isWorkoutActive ? (
              <>
                <button
                  onClick={startWorkout}
                  className="text-black font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 shadow-lg transition-all duration-200 transform hover:scale-105 w-full max-w-xs"
                  style={{
                    background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
                    boxShadow: '0 0 10px rgba(0, 255, 65, 0.2)'
                  }}
                >
                  <Play className="w-5 h-5 text-black" />
                  <span className="text-base text-black whitespace-nowrap">Start Workout Session</span>
                </button>
                <p className="text-sm text-slate-400 text-center">Start a Workout Session to track the duration of your workouts</p>
              </>
            ) : (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="bg-slate-700 rounded-xl py-4 px-6 flex items-center justify-between w-full max-w-xs" style={{ minHeight: '56px' }}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isWorkoutPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}></div>
                    <span className="text-white font-mono text-xl">{getCurrentSessionDuration()}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={stopWorkout}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      title="Stop workout"
                    >
                      <StopCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={isWorkoutPaused ? resumeWorkout : pauseWorkout}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                      title={isWorkoutPaused ? "Resume workout" : "Pause workout"}
                    >
                      {isWorkoutPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={resetWorkout}
                      className="w-10 h-10 bg-slate-600 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-colors"
                      title="Reset without saving"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400 text-center">Workout session in progress</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workout Circles Grid */}
      <section className="mb-8">
        {todaysWorkouts.length > 0 && (
          <h2 className="text-xl font-semibold mb-4 text-white">Today's Workouts</h2>
        )}
        <div className="space-y-6 p-8 overflow-visible">
          {/* Workout Circles Grid */}
          {todaysWorkouts.length > 0 && (
            <div className="grid grid-cols-2 gap-x-20 gap-y-4 justify-items-center">
              {todaysWorkouts.map((workout) => {
                const todayTotal = todaysTotals.find(t => t.id === workout.id);
                const currentCount = todayTotal?.count || 0;

                return (
                  <div key={workout.id} className="flex flex-col items-center space-y-3 py-2">
                    <ProgressCircle
                      count={currentCount}
                      goal={workout.dailyGoal}
                      color={workout.color}
                      size={100}
                      strokeWidth={10}
                      onClick={() => handleWorkoutClick(workout.id)}
                      onHoldIncrement={() => handleWorkoutHoldIncrement(workout.id)}
                      isAnimating={clickingWorkout === workout.id}
                    />
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-sm text-slate-300 font-medium">{workout.name}</span>
                        <button
                          onClick={() => handleEditWorkout(workout)}
                          className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <Edit size={12} />
                        </button>
                      </div>
                      {workout.weightLbs && (
                        <div className="text-xs text-slate-400">
                          Weight: {workout.weightLbs}lbs
                        </div>
                      )}
                      <div className="text-xs text-slate-400 font-mono">
                        {currentCount >= workout.dailyGoal ? 'COMPLETED!' : `${Math.round((currentCount / workout.dailyGoal) * 100)}% complete`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleUndo(workout.id)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-2"
                        title="Undo last rep"
                      >
                        <Undo2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors p-2"
                        title="Delete workout"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timer and Add Workout - Always bottom row */}
          <div className="grid grid-cols-2 gap-x-20 gap-y-4 justify-items-center">
            {/* Timer Circle */}
            <div className="flex flex-col items-center space-y-3">
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
                <div className="relative" style={{ width: '120px', height: '120px' }}>
                  {/* Progress rings - positioned behind the circle */}
                  {timerState.remainingTime > 0 && !timerState.isCompleted && (
                    <div className="absolute inset-0">
                      <svg width="120" height="120" className="transform -rotate-90">
                        {/* Background ring */}
                        <circle
                          cx="60"
                          cy="60"
                          r="55"
                          stroke="rgb(71, 85, 105)"
                          strokeWidth="10"
                          fill="none"
                        />
                        {/* Progress ring */}
                        <circle
                          cx="60"
                          cy="60"
                          r="55"
                          stroke={timerState.isRunning ? "rgb(34, 197, 94)" : "rgb(156, 163, 175)"}
                          strokeWidth="10"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 55}`}
                          strokeDashoffset={`${2 * Math.PI * 55 * (1 - getProgress() / 100)}`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {timerState.remainingTime > 0 && timerState.isCompleted && (
                    <div className="absolute inset-0">
                      <svg width="120" height="120" className="transform -rotate-90">
                        {/* Background ring */}
                        <circle
                          cx="60"
                          cy="60"
                          r="55"
                          stroke="rgb(71, 85, 105)"
                          strokeWidth="10"
                          fill="none"
                        />
                        {/* Completed ring */}
                        <circle
                          cx="60"
                          cy="60"
                          r="55"
                          stroke="rgb(34, 197, 94)"
                          strokeWidth="10"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 55}`}
                          strokeDashoffset="0"
                          className="transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Timer circle - positioned on top */}
                  <div className="absolute top-2.5 left-2.5 w-25 h-25 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 hover:border-slate-600 transition-colors z-10" style={{ width: '100px', height: '100px' }}>
                    {timerState.remainingTime > 0 && timerState.isCompleted ? (
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    ) : timerState.remainingTime > 0 && !timerState.isRunning ? (
                      <Play className="w-8 h-8 text-blue-400" />
                    ) : (
                      <Timer className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                </div>
              </button>
              <div className="text-center">
                <div className="text-sm text-slate-300 font-medium">
                  {timerState.remainingTime > 0 && !timerState.isCompleted ? formatTime(timerState.remainingTime) : 
                   timerState.isCompleted ? "Completed!" : "Timer"}
                </div>
                <div className="text-xs text-slate-400">
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
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1"
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
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Stop timer"
                  >
                    <Square size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Add Workout Button */}
            {canAddMoreWorkouts() && (
              <div className="flex flex-col items-center space-y-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-25 h-25 rounded-full bg-slate-800 flex items-center justify-center border-4 border-dashed border-slate-700 hover:border-slate-600 transition-colors"
                  style={{ width: '100px', height: '100px' }}
                  title="Add new workout"
                >
                  <Plus className="w-10 h-10 text-slate-400" />
                </button>
                <div className="text-center">
                  <div className="text-sm text-slate-300 font-medium">Add</div>
                  <div className="text-xs text-slate-400">New workout</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* All Workouts Section */}
      {workouts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Collapsible open={isAllWorkoutsOpen} onOpenChange={setIsAllWorkoutsOpen} className="flex-1">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-slate-800 border-slate-700 text-white hover:bg-slate-700 py-4 h-auto rounded-xl"
                >
                  <span className="text-lg font-semibold">All Workouts</span>
                  {isAllWorkoutsOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </Button>
              </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 bg-slate-800 rounded-xl p-4">
                {workouts.map((workout) => {
                  const scheduledDaysText = getScheduledDaysText(workout.scheduledDays || [0,1,2,3,4,5,6]);
                  return (
                    <div 
                      key={workout.id} 
                      className="flex items-center justify-between p-4 bg-slate-700 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${colorClassMap[workout.color]}`} />
                        <div>
                          <div className="text-white font-medium">{workout.name}</div>
                          <div className="text-xs text-slate-400">
                            {scheduledDaysText} • Goal: {workout.dailyGoal}
                            {workout.weightLbs && ` • ${workout.weightLbs}lbs`}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditWorkout(workout)}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
            </Collapsible>
          </div>
        </section>
      )}

      {/* Today's Totals Section */}
      {!isTodaysTotalsHidden && todaysTotals.some(w => w.count > 0) && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-white">Today's Totals</h2>
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            {todaysTotals.filter(w => w.count > 0).map((workout) => (
              <div key={workout.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${colorClassMap[workout.color]}`}></div>
                  <span className="font-medium text-white">{workout.name}</span>
                </div>
                <span className="text-lg font-bold text-white">{typeof workout.count === 'number' ? workout.count : 0}</span>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* Recent Activity Section - Collapsible */}
      {!isRecentActivityHidden && recentActivity.length > 0 && (
        <section className="mb-8">
          <Collapsible open={isRecentActivityOpen} onOpenChange={setIsRecentActivityOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-slate-800 border-slate-700 text-white hover:bg-slate-700 py-4 h-auto rounded-xl mb-4"
              >
                <span className="text-lg font-semibold">Recent Activity</span>
                {isRecentActivityOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3">
                {recentActivity.map((day) => (
                  <div key={day.dateString} className="bg-slate-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-slate-300">{day.date}</span>
                      <span className="text-sm text-slate-400">{typeof day.totalReps === 'number' ? day.totalReps : 0} total</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {day.workouts.filter(w => w.count > 0).map((workout) => (
                        <div key={workout.id} className="text-center">
                          <div className={`w-3 h-3 rounded-full ${colorClassMap[workout.color]} mx-auto mb-1`}></div>
                          <span className="text-sm font-medium text-white">{typeof workout.count === 'number' ? workout.count : 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>
      )}

      {/* Wellness Score Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-center text-white flex-1">Overall Wellness Score</h2>
          <button
            onClick={() => setIsWellnessWeightsOpen(true)}
            className="text-slate-400 hover:text-white transition-colors p-2"
            data-testid="button-edit-wellness"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 flex justify-center">
          <div className="relative" style={{ width: 160, height: 160 }}>
            <svg
              width={160}
              height={160}
              className="transform -rotate-90"
            >
              <defs>
                <linearGradient id="wellnessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                  <stop offset="100%" stopColor="rgb(34, 197, 94)" />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                cx={80}
                cy={80}
                r={66}
                stroke="rgb(71, 85, 105)"
                strokeWidth={14}
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx={80}
                cy={80}
                r={66}
                stroke="url(#wellnessGradient)"
                strokeWidth={14}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 66}
                strokeDashoffset={2 * Math.PI * 66 - (calculateWellnessScore() / 100) * 2 * Math.PI * 66}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-white">
                {Math.round(calculateWellnessScore())}%
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-white">Wellness Score</h3>
            <p className="text-sm text-slate-400 mt-1">Based on your goal progress</p>
          </div>
        </div>
      </section>

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
        <SheetContent side="left" className="w-80 bg-slate-900 border-slate-700">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            {/* User Profile Section */}
            <div 
              className="flex items-center space-x-3 p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
              onClick={() => {
                setIsSidebarOpen(false);
                navigate('/profile?from=dashboard');
              }}
            >
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center border-2 border-green-400">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">{userName}</div>
                <div className="text-slate-400 text-xs">view profile</div>
              </div>
            </div>

            {/* Dashboard Menu Items */}
            <div className="flex-1 py-4">
              {/* Measurements */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/measurements?from=dashboard');
                }}
              >
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-white">Measurements</span>
              </div>

              {/* Fitness Calculator */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/fitness-calculator?from=dashboard');
                }}
              >
                <Calculator className="w-5 h-5 text-slate-400" />
                <span className="text-white">Fitness Calculator</span>
              </div>

              {/* Food Tracker */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/food-tracker?from=dashboard');
                }}
              >
                <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                <span className="text-white">Food Tracker</span>
              </div>

              {/* Cardio */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/cardio?from=dashboard');
                }}
              >
                <Activity className="w-5 h-5 text-slate-400" />
                <span className="text-white">Cardio</span>
              </div>

              {/* Intermittent Fasting */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/fasting?from=dashboard');
                }}
              >
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-white">Intermittent Fasting</span>
              </div>

              {/* Meditation */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/meditation?from=dashboard');
                }}
              >
                <Brain className="w-5 h-5 text-slate-400" />
                <span className="text-white">Meditation</span>
              </div>

              {/* Hydration */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/hydration?from=dashboard');
                }}
              >
                <Droplet className="w-5 h-5 text-slate-400" />
                <span className="text-white">Hydration</span>
              </div>

              {/* Goals */}


              {/* Trainer - Hidden for now, can be re-enabled by uncommenting */}
              {/* <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/trainer?from=dashboard');
                }}
              >
                <Bot className="w-5 h-5 text-slate-400" />
                <span className="text-white">Trainer</span>
              </div> */}

              {/* Settings */}
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/settings?from=dashboard');
                }}
              >
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="text-white">Settings</span>
              </div>
            </div>

            {/* Version */}
            <div className="p-4 border-t border-slate-700">
              <div className="text-slate-500 text-xs text-center">Version 2.1.0</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Timer Dialog */}
      <Dialog open={isTimerOpen} onOpenChange={setIsTimerOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Workout Timer</DialogTitle>
            <DialogDescription className="text-slate-400 text-center">
              Set up and run your workout timer
            </DialogDescription>
          </DialogHeader>
          
          {!timerState.isRunning && timerState.remainingTime === 0 ? (
            // Timer Setup
            <div className="space-y-6">
              {/* Simple Time Display */}
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-white">
                  {String((parseInt(timerHours) || 0)).padStart(2, '0')}:
                  {String((parseInt(timerMinutes) || 0)).padStart(2, '0')}:
                  {String(parseInt(timerSeconds) || 0).padStart(2, '0')}
                </div>
                <div className="text-sm text-slate-400">Set Time</div>
              </div>

              {/* Time Input Fields */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center">
                  <label className="block text-xs text-slate-400 mb-1">Hours</label>
                  <Input
                    type="number"
                    value={timerHours}
                    onChange={(e) => setTimerHours(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-center text-lg"
                    min="0"
                    max="23"
                    placeholder="0"
                    tabIndex={-1}
                  />
                </div>
                <div className="text-center">
                  <label className="block text-xs text-slate-400 mb-1">Minutes</label>
                  <Input
                    type="number"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-center text-lg"
                    min="0"
                    max="59"
                    placeholder="0"
                    tabIndex={-1}
                  />
                </div>
                <div className="text-center">
                  <label className="block text-xs text-slate-400 mb-1">Seconds</label>
                  <Input
                    type="number"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-center text-lg"
                    min="0"
                    max="59"
                    placeholder="0"
                    tabIndex={-1}
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-3">
                <div className="text-sm text-slate-300 text-center">Quick Presets</div>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    onClick={() => {
                      startTimerFromSeconds(30);
                      setIsTimerOpen(false);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    30s
                  </Button>
                  <Button
                    onClick={() => {
                      startTimerFromSeconds(60);
                      setIsTimerOpen(false);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    60s
                  </Button>
                  <Button
                    onClick={() => {
                      startTimerFromSeconds(90);
                      setIsTimerOpen(false);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    90s
                  </Button>
                  <Button
                    onClick={() => {
                      startTimerFromSeconds(120);
                      setIsTimerOpen(false);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    2m
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => {
                      startTimerFromSeconds(300);
                      setIsTimerOpen(false);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    5m
                  </Button>
                  <Button
                    onClick={() => {
                      startTimerFromSeconds(600);
                      setIsTimerOpen(false);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    10m
                  </Button>
                  <Button
                    onClick={() => {
                      startTimerFromSeconds(900);
                      setIsTimerOpen(false);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    15m
                  </Button>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    const totalSeconds = (parseInt(timerHours) || 0) * 3600 + 
                                       (parseInt(timerMinutes) || 0) * 60 + 
                                       (parseInt(timerSeconds) || 0);
                    if (totalSeconds > 0) {
                      startTimerFromSeconds(totalSeconds);
                      setIsTimerOpen(false);
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Play size={16} className="mr-2" />
                  Start Timer
                </Button>
                <Button
                  onClick={() => setIsTimerOpen(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Timer is running - show simple message and close automatically
            <div className="text-center space-y-4">
              <div className="text-lg text-white">Timer is running!</div>
              <div className="text-sm text-slate-400">Check the timer icon on the home page for countdown progress</div>
              <Button
                onClick={() => setIsTimerOpen(false)}
                className="bg-slate-600 hover:bg-slate-700"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wellness Weights Editor Dialog */}
      <Dialog open={isWellnessWeightsOpen} onOpenChange={setIsWellnessWeightsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Wellness Score Weights</DialogTitle>
            <DialogDescription className="text-slate-400">
              Adjust the priority weights for each wellness metric. Higher values mean more influence on your overall score.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {[
              { key: 'hydration', label: 'Hydration' },
              { key: 'meditation', label: 'Meditation' },
              { key: 'fasting', label: 'Fasting' },
              { key: 'cardio', label: 'Cardio' },
              { key: 'targetBodyFat', label: 'Target Body Fat %' },
              { key: 'targetWeight', label: 'Target Weight' },
              { key: 'workoutConsistency', label: 'Workout Consistency' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between space-x-4">
                <label className="text-sm font-medium text-white flex-1">{label}</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={wellnessWeights[key as keyof typeof wellnessWeights]}
                    onChange={(e) => setWellnessWeights(prev => ({
                      ...prev,
                      [key]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    }))}
                    className="w-16 h-8 bg-slate-700 border-slate-600 text-white text-center text-sm"
                  />
                  <span className="text-sm text-slate-400">%</span>
                </div>
              </div>
            ))}
            <div className="text-xs text-slate-500 mt-4">
              Total: {Object.values(wellnessWeights).reduce((sum, val) => sum + val, 0)}%
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => setIsWellnessWeightsOpen(false)}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                saveWellnessWeights(wellnessWeights);
                setIsWellnessWeightsOpen(false);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save Weights
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}