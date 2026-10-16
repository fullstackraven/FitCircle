import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DaySelector } from './DaySelector';
import { getColorClass } from '@/lib/color-utils';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[]) => void;
  onDelete?: (workoutId: string) => void;
  availableColors: string[];
  editingWorkout?: { id: string; name: string; color: string; dailyGoal: number; weightLbs?: number; scheduledDays?: number[] } | null;
  preSelectedDays?: number[];
}


export function WorkoutModal({ isOpen, onClose, onSave, onDelete, availableColors, editingWorkout, preSelectedDays }: WorkoutModalProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || 'green');
  const [dailyGoal, setDailyGoal] = useState<number | string>(10);
  const [weightLbs, setWeightLbs] = useState<number | string>('');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default to all days

  // Initialize form when editing or when preSelectedDays is provided
  useEffect(() => {
    if (editingWorkout) {
      setWorkoutName(editingWorkout.name);
      setSelectedColor(editingWorkout.color);
      setDailyGoal(editingWorkout.dailyGoal);
      setWeightLbs(editingWorkout.weightLbs || '');
      setScheduledDays(editingWorkout.scheduledDays || [0, 1, 2, 3, 4, 5, 6]);
    } else if (isOpen && preSelectedDays) {
      // When opening a new workout with pre-selected days (from a routine)
      setScheduledDays(preSelectedDays);
    } else if (!isOpen) {
      resetForm();
    }
  }, [editingWorkout, isOpen, preSelectedDays]);

  const handleSave = () => {
    const finalGoal = typeof dailyGoal === 'string' ? parseInt(dailyGoal) || 1 : dailyGoal;
    const finalWeight = typeof weightLbs === 'string' ? (weightLbs === '' ? undefined : parseInt(weightLbs) || undefined) : weightLbs;
    if (workoutName.trim() && finalGoal > 0) {
      onSave(workoutName.trim(), selectedColor, finalGoal, finalWeight, scheduledDays);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setWorkoutName('');
    setSelectedColor(availableColors[0] || 'green');
    setDailyGoal(10);
    setWeightLbs('');
    setScheduledDays([0, 1, 2, 3, 4, 5, 6]); // Reset to all days
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent fixedFooter staticBody className="max-w-md text-white p-4 gap-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {editingWorkout ? 'Edit Workout' : 'Add New Workout'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingWorkout ? 'Modify the workout details below' : 'Create a new workout to track your progress'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            {/* Workout Name Input */}
            <div className="space-y-1">
              <Label htmlFor="workout-name" className="block text-xs leading-4 font-medium text-white">
                Workout Name
              </Label>
              <Input
                id="workout-name"
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="h-9 text-base text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="workout-color" className="block text-xs leading-4 font-medium text-white">Color</Label>
              <div className="relative">
                <span aria-hidden="true" className={`absolute left-3 top-3 h-3 w-3 rounded-full ${getColorClass(selectedColor)}`} />
                <select id="workout-color" value={selectedColor} onChange={event => setSelectedColor(event.target.value)}
                  className="glass-input block h-9 w-full rounded-xl border pl-8 pr-2 text-sm text-white" aria-label="Workout color">
                  {Array.from(new Set([...availableColors, selectedColor])).map(color => (
                    <option key={color} value={color} className="bg-slate-900 text-white">{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Weight Input */}
            <div className="space-y-1">
              <Label htmlFor="weight-lbs" className="block text-xs leading-4 font-medium text-white">
                Weight (lbs)
              </Label>
              <Input
                id="weight-lbs"
                aria-label="Weight (lbs) - Optional"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
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

                  e.target.select(); // Select all text when focused
                }}

                className="h-9 text-base text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            {/* Daily Goal Input */}
            <div className="space-y-1">
              <Label htmlFor="daily-goal" className="block text-xs leading-4 font-medium text-white">
                Daily Goal
              </Label>
              <Input
                id="daily-goal"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
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

                  e.target.select(); // Select all text when focused
                }}

                className="h-9 text-base text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
              />
            </div>

          </div>
          {/* Days of Week Selection */}
          <DaySelector compact
            selectedDays={scheduledDays}
            onSelectionChange={setScheduledDays}
            className="space-y-1"
          />


        </div>

        {/* Fixed Bottom Actions */}
        <DialogFooter className={`grid ${editingWorkout && onDelete ? "grid-cols-3" : "grid-cols-2"} gap-2 border-t border-slate-700 pt-2 sm:space-x-0`}>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-2 text-white"
          >
            Cancel
          </Button>
          {editingWorkout && onDelete && (
            <Button
              variant="outline"
              onClick={() => {
                if (editingWorkout && onDelete) {
                  onDelete(editingWorkout.id);
                  handleCancel();
                }
              }}
              className="px-2 bg-red-500 hover:bg-red-600 text-white border-red-600"
            >
              Delete
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!workoutName.trim() || !dailyGoal || (typeof dailyGoal === 'number' && dailyGoal <= 0)}
            aria-label={editingWorkout ? "Update Workout" : "Add Workout"}
            className="px-2 bg-green-500 hover:bg-green-600 text-white"
          >
            {editingWorkout ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
