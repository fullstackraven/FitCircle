import { useState } from 'react';
import { ArrowLeft, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { useLocation } from 'wouter';
import { useWorkouts } from '@/hooks/use-workouts';
import { getColorClass } from '@/lib/color-utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorkoutModal } from '@/components/workout-modal';

export default function RoutinesPage() {
  const [, navigate] = useLocation();
  const [isEditWorkoutsOpen, setIsEditWorkoutsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);

  const { 
    getWorkoutArray, 
    addWorkout, 
    deleteWorkout, 
    updateWorkout, 
    getAvailableColors
  } = useWorkouts();

  const getScheduledDaysText = (scheduledDays: number[]): string => {
    if (!scheduledDays || scheduledDays.length === 7) return 'Daily';
    if (scheduledDays.length === 5 && scheduledDays.every(day => day >= 1 && day <= 5)) return 'Weekdays';
    if (scheduledDays.length === 2 && scheduledDays.includes(0) && scheduledDays.includes(6)) return 'Weekends';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return scheduledDays.map(day => days[day]).join(', ');
  };
  
  const workouts = getWorkoutArray() || [];
  const availableColors = getAvailableColors();

  const handleBack = () => {
    navigate('/');
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

  const handleAddWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[]) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, name, dailyGoal, weightLbs, scheduledDays);
    } else {
      addWorkout(name, color, dailyGoal, weightLbs, scheduledDays);
    }
    setIsModalOpen(false);
    setEditingWorkout(null);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    deleteWorkout(workoutId);
    setIsModalOpen(false);
    setEditingWorkout(null);
  };

  return (
    <div className="fitcircle-page pb-20"> {/* Added pb-20 for bottom nav space */}
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="fitcircle-page-title">Routines</h1>
          <div className="w-16"></div> {/* Spacer */}
        </div>

        {/* Edit Workouts Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Collapsible open={isEditWorkoutsOpen} onOpenChange={setIsEditWorkoutsOpen} className="flex-1">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-slate-800 border-slate-700 text-white hover:bg-slate-700 py-4 h-auto rounded-xl"
                >
                  <span className="text-lg font-semibold">Edit Workouts</span>
                  {isEditWorkoutsOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </Button>
              </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 bg-slate-800 rounded-xl p-4">
                {workouts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏋️</div>
                    <h3 className="text-xl font-bold text-white mb-2">No Workouts Yet</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Create your first workout routine to get started.
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingWorkout(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Workout
                    </Button>
                  </div>
                ) : (
                  <>
                    {workouts.map((workout) => {
                      const scheduledDaysText = getScheduledDaysText(workout.scheduledDays || [0,1,2,3,4,5,6]);
                      return (
                        <div 
                          key={workout.id} 
                          className="flex items-center justify-between p-4 bg-slate-700 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getColorClass(workout.color)}`} />
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
                    <div className="pt-2 border-t border-slate-600">
                      <Button 
                        onClick={() => {
                          setEditingWorkout(null);
                          setIsModalOpen(true);
                        }}
                        variant="outline"
                        className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        Add New Workout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
            </Collapsible>
          </div>
        </section>
      </div>

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
    </div>
  );
}