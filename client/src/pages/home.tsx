import { useState, useEffect } from 'react';
import { Plus, Edit, Undo2, Trash2, CalendarDays, CheckCircle, Scale, Settings, Menu, User, Clock, Brain, Droplet, Target, Bot, TrendingUp, Calculator, UtensilsCrossed, Activity, Timer, Play, Pause, Square, StopCircle, RotateCcw, ChevronDown, ChevronUp, FolderOpen, Dumbbell } from 'lucide-react';
import { useLocation } from 'wouter';
import { useWorkouts } from '@/hooks/use-workouts';
import { useControls } from '@/hooks/use-controls';
import { useTimer } from '@/hooks/use-timer';
import { useWorkoutDuration } from '@/hooks/use-workout-duration';
import { WorkoutModal } from '@/components/workout-modal';
import { ProgressCircle } from '@/components/progress-circle';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { WorkoutCardSkeleton, StatCardSkeleton, RecentActivitySkeleton, QuoteSkeleton, RoutineSkeleton } from '@/components/loading-skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
    getRoutineArray,
    getWorkoutsByRoutine,
    isWorkoutActiveOnDay,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    assignWorkoutToRoutine
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
  const [editingWorkout, setEditingWorkout] = useState<{ id: string; name: string; color: string; dailyGoal: number; weightLbs?: number; scheduledDays?: number[]; routineId?: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerHours, setTimerHours] = useState<string>('0');
  const [timerMinutes, setTimerMinutes] = useState<string>('0');
  const [timerSeconds, setTimerSeconds] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());

  // Check if we should open dashboard on load
  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    if (shouldOpenDashboard) {
      setIsSidebarOpen(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/');
    }
    
    // Simulate loading delay for smooth skeleton transition
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
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
  const routines = getRoutineArray();
  const getWorkoutById = (id: string) => workouts.find(w => w.id === id);
  const todaysTotals = getTodaysTotals();
  const recentActivity = getRecentActivity();
  const availableColors = getAvailableColors();
  
  // Helper functions for routine management
  const toggleRoutineExpansion = (routineId: string) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(routineId)) {
      newExpanded.delete(routineId);
    } else {
      newExpanded.add(routineId);
    }
    setExpandedRoutines(newExpanded);
  };
  
  // Check if workout should be visible today based on scheduled days
  const isWorkoutActiveToday = (workout: any) => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return isWorkoutActiveOnDay(workout, today);
  };
  
  // Get filtered workouts for today only
  const getTodaysActiveWorkouts = () => {
    return workouts.filter(isWorkoutActiveToday);
  };

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

  const handleAddWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[], routineId?: string) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, name, dailyGoal, weightLbs);
      setEditingWorkout(null);
    } else {
      addWorkout(name, color, dailyGoal, weightLbs, scheduledDays, routineId);
    }
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout({
      id: workout.id,
      name: workout.name,
      color: workout.color,
      dailyGoal: workout.dailyGoal,
      weightLbs: workout.weightLbs,
      scheduledDays: workout.scheduledDays,
      routineId: workout.routineId
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
      {!isQuoteHidden && (isLoading ? <QuoteSkeleton /> : <QuoteOfTheDay />)}

      {/* Workouts Section with Routines */}
      <section className="mb-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <WorkoutCardSkeleton />
              <WorkoutCardSkeleton />
            </div>
            <RoutineSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Routines */}
            {routines.map(routine => {
              const routineWorkouts = getWorkoutsByRoutine(routine.id).filter(isWorkoutActiveToday);
              const isExpanded = expandedRoutines.has(routine.id);
              
              if (routineWorkouts.length === 0) return null;
              
              return (
                <Collapsible 
                  key={routine.id} 
                  open={isExpanded} 
                  onOpenChange={() => toggleRoutineExpansion(routine.id)}
                  className="bg-slate-800 rounded-xl overflow-hidden"
                >
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FolderOpen className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-white">{routine.name}</span>
                      <span className="text-sm text-slate-400">({routineWorkouts.length})</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {routineWorkouts.map((workout) => {
                        const todayTotal = todaysTotals.find(t => t.id === workout.id);
                        const currentCount = todayTotal?.count || 0;
                        const progress = workout.dailyGoal > 0 ? (currentCount / workout.dailyGoal) * 100 : 0;
                        const isCompleted = currentCount >= workout.dailyGoal;
                        const isClicking = clickingWorkout === workout.id;

                        return (
                          <div
                            key={workout.id}
                            className={`bg-slate-700 rounded-lg p-4 flex flex-col items-center relative transition-transform ${
                              isClicking ? 'scale-95' : 'scale-100'
                            }`}
                          >
                            <button
                              onClick={() => handleEditWorkout(workout)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors p-1"
                            >
                              <Edit className="w-3 h-3" />
                            </button>

                            <div
                              className="relative mb-3 cursor-pointer"
                              onMouseDown={() => {
                                if (!isCompleted) {
                                  handleWorkoutClick(workout.id);
                                  if (!isWorkoutActive) startWorkout();
                                }
                              }}
                            >
                              <ProgressCircle
                                count={currentCount}
                                goal={workout.dailyGoal}
                                color={workout.color}
                                size={48}
                                strokeWidth={4}
                              />
                            </div>

                            <div className="text-center space-y-1">
                              <div className="font-medium text-white text-sm">{workout.name}</div>
                              <div className="text-xs text-slate-400">
                                {workout.dailyGoal}{workout.weightLbs && ` • ${workout.weightLbs} lbs`}
                              </div>
                              
                              {isCompleted && (
                                <div className="text-green-500 text-xs flex items-center justify-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Done
                                </div>
                              )}
                            </div>

                            {currentCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUndo(workout.id);
                                }}
                                className="absolute bottom-2 right-2 text-slate-400 hover:text-orange-400 transition-colors p-1"
                              >
                                <Undo2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {/* Individual Workouts (No Routine) */}
            {(() => {
              const individualWorkouts = getWorkoutsByRoutine().filter(isWorkoutActiveToday);
              
              if (individualWorkouts.length === 0 && workouts.length === 0) {
                return (
                  <div
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-750 transition-colors"
                  >
                    <Dumbbell className="w-8 h-8 text-slate-400 mb-3" />
                    <span className="text-lg font-medium text-slate-400 mb-1">Add Your First Workout</span>
                    <span className="text-sm text-slate-500">Start tracking your fitness journey</span>
                  </div>
                );
              }
              
              return individualWorkouts.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Today's Workouts
                    </h3>
                    {canAddMoreWorkouts() && (
                      <Button
                        onClick={() => setIsModalOpen(true)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {individualWorkouts.map((workout) => {
                      const todayTotal = todaysTotals.find(t => t.id === workout.id);
                      const currentCount = todayTotal?.count || 0;
                      const progress = workout.dailyGoal > 0 ? (currentCount / workout.dailyGoal) * 100 : 0;
                      const isCompleted = currentCount >= workout.dailyGoal;
                      const isClicking = clickingWorkout === workout.id;

                      return (
                        <div
                          key={workout.id}
                          className={`bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[180px] relative transition-transform ${
                            isClicking ? 'scale-95' : 'scale-100'
                          }`}
                        >
                          <button
                            onClick={() => handleEditWorkout(workout)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="absolute top-2 left-2 text-slate-400 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div
                            className="relative mb-4 cursor-pointer select-none"
                            onMouseDown={() => {
                              if (!isCompleted) {
                                handleWorkoutClick(workout.id);
                                if (!isWorkoutActive) startWorkout();
                              }
                            }}
                          >
                            <ProgressCircle
                              count={currentCount}
                              goal={workout.dailyGoal}
                              color={workout.color}
                              size={64}
                              strokeWidth={6}
                            />
                          </div>

                          <div className="text-center space-y-2">
                            <div className="font-medium text-white text-sm">{workout.name}</div>
                            <div className="text-xs text-slate-400">
                              Goal: {workout.dailyGoal}
                              {workout.weightLbs && ` • ${workout.weightLbs} lbs`}
                            </div>
                            
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${colorClassMap[workout.color] || 'bg-green-500'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            
                            {isCompleted && (
                              <div className="text-green-500 text-xs flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Complete!
                              </div>
                            )}
                          </div>

                          {currentCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUndo(workout.id);
                              }}
                              className="absolute bottom-2 right-2 text-slate-400 hover:text-orange-400 transition-colors p-1"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </section>

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
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
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

      {/* Today's Totals Section */}
      {!isTodaysTotalsHidden && (isLoading ? (
        <StatCardSkeleton title="Today's Totals" />
      ) : (
        todaysTotals.some(w => w.count > 0) && (
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
        )
      ))}



      {/* Recent Activity Section */}
      {!isRecentActivityHidden && (isLoading ? (
        <RecentActivitySkeleton />
      ) : (
        recentActivity.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center text-white">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((day) => (
                <div key={day.dateString} className="bg-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-slate-300">{day.date}</span>
                    <span className="text-sm text-slate-400">{day.totalReps} total</span>
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
        )
      ))}

      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkout(null);
        }}
        onSave={handleAddWorkout}
        availableColors={availableColors}
        editingWorkout={editingWorkout}
        routines={getRoutineArray()}
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