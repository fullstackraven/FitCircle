import { useState, useEffect } from 'react';
import { Plus, Edit, Undo2, Trash2, CalendarDays, CheckCircle, Scale, Settings, Menu, User, Clock, Brain, Droplet, Target } from 'lucide-react';
import { useLocation } from 'wouter';
import { useWorkouts } from '@/hooks/use-workouts';
import { WorkoutModal } from '@/components/workout-modal';
import { ProgressCircle } from '@/components/progress-circle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickingWorkout, setClickingWorkout] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<{ id: string; name: string; color: string; dailyGoal: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');

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

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const minSlots = Math.max(4, workouts.length + (canAddMoreWorkouts() ? 1 : 0));
  const emptySlots = Math.max(0, minSlots - workouts.length);



  return (
    <div 
      className="container mx-auto px-4 py-6 max-w-md min-h-screen text-white"
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

        <h1 className="text-2xl font-bold mb-2 text-white">FitCircle</h1>
        <p className="text-slate-300 text-lg">{getCurrentDate()}</p>

        {/* Calendar View Icon */}
        <button
          onClick={() => navigate('/calendar')}
          className="absolute top-0 right-0 text-slate-400 hover:text-white transition-colors"
          title="View Calendar"
        >
          <CalendarDays size={22} />
        </button>
      </header>

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

          {Array.from({ length: Math.max(0, emptySlots - (canAddMoreWorkouts() ? 1 : 0)) }).map((_, index) => (
            <div key={`empty-${index}`} className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 opacity-30"></div>
              <div className="h-5"></div>
              <div className="h-5"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Totals Section */}
      {todaysTotals.some(w => w.count > 0) && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-white">Today's Totals</h2>
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
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

      {/* Recent Activity Section */}
      {recentActivity.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-white">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((day) => (
              <div key={day.dateString} className="bg-slate-800 rounded-lg p-4">
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
              <div className="text-slate-500 text-xs text-center">Version 1.0.0</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}