import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DaySelector } from './DaySelector';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[], routineId?: string) => void;
  availableColors: string[];
  editingWorkout?: { id: string; name: string; color: string; dailyGoal: number; weightLbs?: number; scheduledDays?: number[]; routineId?: string } | null;
  routines?: Array<{ id: string; name: string; createdAt: string }>;
}

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

export function WorkoutModal({ isOpen, onClose, onSave, availableColors, editingWorkout, routines = [] }: WorkoutModalProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || 'green');
  const [dailyGoal, setDailyGoal] = useState<number | string>(10);
  const [weightLbs, setWeightLbs] = useState<number | string>('');
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<string>('');
  const [workoutNameFocused, setWorkoutNameFocused] = useState(false);
  const [dailyGoalFocused, setDailyGoalFocused] = useState(false);
  const [weightFocused, setWeightFocused] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (editingWorkout) {
      setWorkoutName(editingWorkout.name);
      setSelectedColor(editingWorkout.color);
      setDailyGoal(editingWorkout.dailyGoal);
      setWeightLbs(editingWorkout.weightLbs || '');
      setScheduledDays(editingWorkout.scheduledDays || []);
      setSelectedRoutine(editingWorkout.routineId || '');
    } else if (!isOpen) {
      resetForm();
    }
  }, [editingWorkout, isOpen]);

  const handleSave = () => {
    const finalGoal = typeof dailyGoal === 'string' ? parseInt(dailyGoal) || 1 : dailyGoal;
    const finalWeight = typeof weightLbs === 'string' ? (weightLbs === '' ? undefined : parseInt(weightLbs) || undefined) : weightLbs;
    const finalRoutineId = selectedRoutine === '' ? undefined : selectedRoutine;
    if (workoutName.trim() && finalGoal > 0) {
      onSave(workoutName.trim(), selectedColor, finalGoal, finalWeight, scheduledDays, finalRoutineId);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setWorkoutName('');
    setSelectedColor(availableColors[0] || 'green');
    setDailyGoal(10);
    setWeightLbs('');
    setScheduledDays([]);
    setSelectedRoutine('');
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center text-white">
            {editingWorkout ? 'Edit Workout' : 'Add New Workout'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400 text-center">
            {editingWorkout ? 'Modify the workout details below' : 'Create a new workout to track your progress'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Workout Name Input */}
          <div className="space-y-2">
            <Label htmlFor="workout-name" className="text-sm font-medium text-white">
              Workout Name
            </Label>
            <Input
              id="workout-name"
              type="text"
              placeholder={workoutNameFocused ? "" : "e.g., Pull-ups, Lunges, Planks"}
              onFocus={() => setWorkoutNameFocused(true)}
              onBlur={() => setWorkoutNameFocused(false)}
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Weight Input */}
          <div className="space-y-2">
            <Label htmlFor="weight-lbs" className="text-sm font-medium text-white">
              Weight (lbs) - Optional
            </Label>
            <Input
              id="weight-lbs"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={weightFocused ? "" : "e.g., 25 (leave empty for bodyweight)"}
              value={weightLbs.toString()}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                
                if (value === '') {
                  // Allow empty field for bodyweight exercises
                  setWeightLbs('');
                  return;
                }
                
                const numValue = parseInt(value);
                // Allow up to 4 digits (1-9999 lbs)
                if (numValue >= 1 && numValue <= 9999) {
                  setWeightLbs(numValue);
                }
              }}
              onFocus={(e) => {
                setWeightFocused(true);
                e.target.select(); // Select all text when focused
              }}
              onBlur={() => setWeightFocused(false)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Daily Goal Input */}
          <div className="space-y-2">
            <Label htmlFor="daily-goal" className="text-sm font-medium text-white">
              Daily Goal
            </Label>
            <Input
              id="daily-goal"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={dailyGoalFocused ? "" : "e.g., 10"}
              value={dailyGoal.toString()}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                
                if (value === '') {
                  setDailyGoal('');
                  return;
                }
                
                const numValue = parseInt(value);
                if (numValue >= 1 && numValue <= 9999) {
                  setDailyGoal(numValue);
                }
              }}
              onFocus={(e) => {
                setDailyGoalFocused(true);
                e.target.select(); // Select all text when focused
              }}
              onBlur={() => setDailyGoalFocused(false)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Day Selector */}
          <DaySelector
            selectedDays={scheduledDays}
            onSelectionChange={setScheduledDays}
            className="space-y-2"
          />

          {/* Routine Assignment */}
          {routines.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="routine-select" className="text-sm font-medium text-white">
                Assign to Routine (Optional)
              </Label>
              <Select value={selectedRoutine} onValueChange={setSelectedRoutine}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select a routine or leave unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="">No Routine (Individual Workout)</SelectItem>
                  {routines.map((routine) => (
                    <SelectItem key={routine.id} value={routine.id}>
                      {routine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Color</Label>
            <div className="grid grid-cols-6 gap-3">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-white scale-110 shadow-lg' 
                      : 'border-slate-600 hover:border-slate-400'
                  } ${colorClassMap[color]} hover:scale-105`}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!workoutName.trim() || dailyGoal === '' || parseInt(dailyGoal.toString()) < 1}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingWorkout ? 'Update Workout' : 'Create Workout'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
