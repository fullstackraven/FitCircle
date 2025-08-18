import { useState, useEffect } from 'react';
import { Plus, Edit, Undo2, Trash2, CalendarDays, CheckCircle, Scale, Settings, Menu, User, Clock, Brain, Droplet, Target, Bot, TrendingUp, Calculator, UtensilsCrossed, Activity, Timer, Play, Pause, Square, StopCircle, RotateCcw } from 'lucide-react';
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
    updateWorkoutGoal,
    getTodaysTotals,
    getRecentActivity,
    getAvailableColors,
    getWorkoutArray,
    canAddMoreWorkouts
  } = useWorkouts();

  const { timerState, startTimer, startTimerFromSeconds, pauseTimer, resumeTimer, resetTimer, formatTime, getProgress } = useTimer();
  const { isActive: isWorkoutActive, startWorkout, stopWorkout, resetWorkout, getCurrentSessionDuration } = useWorkoutDuration();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickingWorkout, setClickingWorkout] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<{ id: string; name: string; color: string; dailyGoal: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerHours, setTimerHours] = useState<string>('0');
  const [timerMinutes, setTimerMinutes] = useState<string>('0');
  const [timerSeconds, setTimerSeconds] = useState<string>('0');

  // Check if we should open dashboard on load
  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    if (shouldOpenDashboard) {
      setIsSidebarOpen(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/');
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

  const handleAddWorkout = (name: string, color: string, dailyGoal: number) => {
    if (editingWorkout) {
      updateWorkoutGoal(editingWorkout.id, dailyGoal);
      setEditingWorkout(null);
    } else {
      addWorkout(name, color, dailyGoal);
    }
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout({
      id: workout.id,
      name: workout.name,
      color: workout.color,
      dailyGoal: workout.dailyGoal
    });
    setIsModalOpen(true);
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

      {/* Workout Circles Grid */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-6 justify-items-center p-4">
          {workouts.map((workout) => {
            const todayTotal = todaysTotals.find(t => t.id === workout.id);
            const currentCount = todayTotal?.count || 0;

            return (
              <div key={workout.id} className="flex flex-col items-center space-y-3">
                <ProgressCircle
                  count={currentCount}
                  goal={workout.dailyGoal}
                  color={workout.color}
                  size={80}
                  strokeWidth={8}
                  onClick={() => handleWorkoutClick(workout.id)}
                  onHoldIncrement={() => handleWorkoutHoldIncrement(workout.id)}
                  isAnimating={clickingWorkout === workout.id}
                />
                <div className="text-center">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-slate-300 font-medium">{workout.name}</span>
                    <button
                      onClick={() => handleEditWorkout(workout)}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Edit size={12} />
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {currentCount >= workout.dailyGoal ? 'COMPLETED!' : `${Math.round((currentCount / workout.dailyGoal) * 100)}%`}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUndo(workout.id)}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title="Undo last rep"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Delete workout"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Timer Circle */}
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={() => setIsTimerOpen(true)}
              className="w-20 h-20 rounded-full border-2 border-slate-600 bg-slate-800 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
              title="Timer"
            >
              <Timer size={24} />
            </button>
            <div className="text-center">
              <span className="text-sm text-slate-300 font-medium">Timer</span>
            </div>
            <div className="h-5"></div>
          </div>

          {canAddMoreWorkouts() && (
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-20 h-20 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400 font-bold text-3xl hover:border-slate-500 hover:text-slate-300 transition-colors"
              >
                <Plus size={24} />
              </button>
              <span className="text-sm text-slate-500 font-medium">Add Workout</span>
              <div className="h-5"></div>
            </div>
          )}

          {Array.from({ length: emptySlots }).map((_, index) => (
            <div key={`empty-${index}`} className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 opacity-30"></div>
              <div className="h-5"></div>
              <div className="h-5"></div>
            </div>
          ))}
        </div>
      </section>

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
                <span className="text-lg font-bold text-white">{workout.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Start Workout Button */}
      <section className="mb-8">
        <div className="flex justify-center">
          {!isWorkoutActive ? (
            <button
              onClick={startWorkout}
              className="bg-green-400 hover:bg-green-500 text-black font-bold py-4 px-8 rounded-xl flex items-center space-x-3 shadow-lg transition-all duration-200 transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
              }}
            >
              <Play className="w-6 h-6" />
              <span className="text-lg">Start Workout</span>
            </button>
          ) : (
            <div className="bg-slate-800 rounded-xl px-8 py-4 flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-mono text-xl">{getCurrentSessionDuration()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={stopWorkout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop</span>
                </button>
                <button
                  onClick={resetWorkout}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  title="Reset without saving"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity Section */}
      {!isRecentActivityHidden && recentActivity.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-white">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((day) => (
              <div key={day.dateString} className="bg-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-slate-300">{day.date}</span>
                  <span className="text-sm text-slate-400">{day.totalReps} total reps</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {day.workouts.filter(w => w.count > 0).map((workout) => (
                    <div key={workout.id} className="text-center">
                      <div className={`w-3 h-3 rounded-full ${colorClassMap[workout.color]} mx-auto mb-1`}></div>
                      <span className="text-sm font-medium text-white">{workout.count}</span>
                    </div>
                  ))}
                </div>
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
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/goals?from=dashboard');
                }}
              >
                <Target className="w-5 h-5 text-slate-400" />
                <span className="text-white">Goals</span>
              </div>

{/* Wellness Predictions - Now integrated into Goals page */}

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
              {/* Timer Ring Display */}
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg width="192" height="192" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="rgb(71, 85, 105)"
                      strokeWidth="8"
                      fill="none"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-white">
                      {String((parseInt(timerHours) || 0)).padStart(2, '0')}:
                      {String((parseInt(timerMinutes) || 0)).padStart(2, '0')}:
                      {String(parseInt(timerSeconds) || 0).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-slate-400">Set Time</div>
                  </div>
                </div>
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
                    onClick={() => startTimerFromSeconds(30)}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    30s
                  </Button>
                  <Button
                    onClick={() => startTimerFromSeconds(60)}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    60s
                  </Button>
                  <Button
                    onClick={() => startTimerFromSeconds(90)}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    90s
                  </Button>
                  <Button
                    onClick={() => startTimerFromSeconds(120)}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    2m
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => startTimerFromSeconds(300)}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    5m
                  </Button>
                  <Button
                    onClick={() => startTimerFromSeconds(600)}
                    className="bg-slate-600 hover:bg-slate-500 text-xs py-2"
                  >
                    10m
                  </Button>
                  <Button
                    onClick={() => startTimerFromSeconds(900)}
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
            // Timer Running/Completed
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  <svg width="192" height="192" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="rgb(71, 85, 105)"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke={timerState.isCompleted ? "rgb(34, 197, 94)" : "rgb(59, 130, 246)"}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - getProgress() / 100)}`}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-white">
                      {formatTime(timerState.remainingTime)}
                    </div>
                    <div className="text-sm text-slate-400">
                      {timerState.isCompleted ? 'Completed!' : 'Remaining'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                {timerState.isCompleted ? (
                  <>
                    <Button
                      onClick={() => {
                        resetTimer();
                        setTimerHours('0');
                        setTimerMinutes('0');
                        setTimerSeconds('0');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      New Timer
                    </Button>
                    <Button
                      onClick={() => setIsTimerOpen(false)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={timerState.isRunning ? pauseTimer : resumeTimer}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {timerState.isRunning ? (
                        <>
                          <Pause size={16} className="mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={16} className="mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        resetTimer();
                        setTimerHours('0');
                        setTimerMinutes('0');
                        setTimerSeconds('0');
                      }}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Square size={16} className="mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}