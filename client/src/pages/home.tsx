import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useWorkouts } from '@/hooks/use-workouts';
import { WorkoutModal } from '@/components/workout-modal';

const colorClassMap: { [key: string]: string } = {
  green: 'workout-green',
  blue: 'workout-blue',
  purple: 'workout-purple',
  amber: 'workout-amber',
  red: 'workout-red',
  pink: 'workout-pink',
  cyan: 'workout-cyan',
  lime: 'workout-lime'
};

export default function Home() {
  const {
    addWorkout,
    incrementWorkout,
    decrementWorkout,
    getTodaysTotals,
    getRecentActivity,
    getAvailableColors,
    getWorkoutArray,
    canAddMoreWorkouts
  } = useWorkouts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickingWorkout, setClickingWorkout] = useState<string | null>(null);

  const workouts = getWorkoutArray();
  const todaysTotals = getTodaysTotals();
  const recentActivity = getRecentActivity();
  const availableColors = getAvailableColors();

  const handleWorkoutClick = (workoutId: string) => {
    incrementWorkout(workoutId);
    setClickingWorkout(workoutId);
    setTimeout(() => setClickingWorkout(null), 200);
  };

  const handleUndo = (workoutId: string) => {
    decrementWorkout(workoutId);
  };

  const handleAddWorkout = (name: string, color: string) => {
    addWorkout(name, color);
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fill empty slots up to 4 minimum (or current count if more than 4)
  const minSlots = Math.max(4, workouts.length + (canAddMoreWorkouts() ? 1 : 0));
  const emptySlots = Math.max(0, minSlots - workouts.length);

  return (
    <div className="container mx-auto px-4 py-6 max-w-md min-h-screen">
      {/* Header Section */}
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2 text-white">Custom Workout Tracker</h1>
        <p className="text-slate-300 text-lg">{getCurrentDate()}</p>
      </header>

      {/* Workout Circles Grid */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-6 justify-items-center">
          {/* Configured Workout Circles */}
          {workouts.map((workout) => (
            <div key={workout.id} className="flex flex-col items-center space-y-3">
              <button
                onClick={() => handleWorkoutClick(workout.id)}
                className={`w-20 h-20 rounded-full ${colorClassMap[workout.color]} flex items-center justify-center text-white font-bold text-xl shadow-lg transform transition-transform duration-150 hover:scale-105 active:scale-95 ${
                  clickingWorkout === workout.id ? 'bounce-animation' : ''
                }`}
              >
                <span>{workout.count}</span>
              </button>
              <span className="text-sm text-slate-300 font-medium">{workout.name}</span>
              <button
                onClick={() => handleUndo(workout.id)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                UNDO
              </button>
            </div>
          ))}

          {/* Empty Circles for Adding New Workouts */}
          {canAddMoreWorkouts() && (
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-20 h-20 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400 font-bold text-3xl hover:border-slate-500 hover:text-slate-300 transition-colors"
              >
                <Plus size={24} />
              </button>
              <span className="text-sm text-slate-500 font-medium">Add Workout</span>
              <div className="h-5"></div> {/* Spacer for alignment */}
            </div>
          )}

          {/* Additional empty slots for visual balance */}
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

      {/* Workout Configuration Modal */}
      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddWorkout}
        availableColors={availableColors}
      />
    </div>
  );
}
