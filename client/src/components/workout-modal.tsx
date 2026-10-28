import { validWorkoutTargets } from '@/lib/workout-progress';
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
  onSave: (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[], setsGoal?: number) => boolean | undefined;
  onDelete?: (workoutId: string) => void;
  availableColors: string[];
  editingWorkout?: { id: string; name: string; color: string; dailyGoal: number; setsGoal?: number; weightLbs?: number; scheduledDays?: number[] } | null;
  preSelectedDays?: number[];
}


export function WorkoutModal({ isOpen, onClose, onSave, onDelete, availableColors, editingWorkout, preSelectedDays }: WorkoutModalProps) {
  const [saveError, setSaveError] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || 'green');
  const [dailyGoal, setDailyGoal] = useState<number | string>(10);
  const [setsGoal, setSetsGoal] = useState<number | string>(1);
  const validTargets = validWorkoutTargets(Number(dailyGoal), Number(setsGoal));
  const [weightLbs, setWeightLbs] = useState<number | string>('');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default to all days

  // Initialize form when editing or when preSelectedDays is provided
  useEffect(() => {
    if (editingWorkout) {
      setWorkoutName(editingWorkout.name);
      setSelectedColor(editingWorkout.color);
      setDailyGoal(editingWorkout.dailyGoal);
      setSetsGoal(editingWorkout.setsGoal ?? 1);
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
    if (workoutName.trim() && validTargets) {
      if (!onSave(workoutName.trim(), selectedColor, finalGoal, finalWeight, scheduledDays, Number(setsGoal))) { setSaveError('Changes were not saved. You can retry or cancel.'); return; }
      setSaveError('');
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setSaveError('');
    setWorkoutName('');
    setSelectedColor(availableColors[0] || 'green');
    setDailyGoal(10);
    setSetsGoal(1);
    setWeightLbs('');
    setScheduledDays([0, 1, 2, 3, 4, 5, 6]); // Reset to all days
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent fixedFooter staticBody className="compact-editor max-w-md text-strong p-4 gap-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-strong">
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
              <Label htmlFor="workout-name" className="block text-xs leading-4 font-medium text-strong">
                Workout Name
              </Label>
              <Input
                id="workout-name"
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="h-9 text-base text-strong placeholder-muted-foreground focus:border-action-selected focus:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="workout-color" className="block text-xs leading-4 font-medium text-strong">Color</Label>
              <div className="relative">
                <span aria-hidden="true" className={`absolute left-3 top-3 h-3 w-3 rounded-full ${getColorClass(selectedColor)}`} />
                <select id="workout-color" value={selectedColor} onChange={event => setSelectedColor(event.target.value)}
                  className="glass-input block h-9 w-full rounded-xl border pl-8 pr-2 text-sm text-strong" aria-label="Workout color">
                  {Array.from(new Set([...availableColors, selectedColor])).map(color => (
                    <option key={color} value={color} className="bg-canvas text-strong">{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Weight Input */}
            <div className="space-y-1">
              <Label htmlFor="weight-lbs" className="block text-xs leading-4 font-medium text-strong">
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

                className="h-9 text-base text-strong placeholder-muted-foreground focus:border-action-selected focus:ring-focus"
              />
            </div>

            {/* Daily Goal Input */}
            <div className="space-y-1">
              <Label htmlFor="daily-goal" className="block text-xs leading-4 font-medium text-strong">
                Total Reps
              </Label>
              <Input
                id="daily-goal"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={dailyGoal.toString()}
                onChange={e => setDailyGoal(e.target.value)}
                onFocus={(e) => {

                  e.target.select(); // Select all text when focused
                }}

                className="h-9 text-base text-strong placeholder-muted-foreground focus:border-action-selected focus:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sets-goal" className="block text-xs leading-4 font-medium text-strong">Sets</Label>
              <Input id="sets-goal" aria-label="Number of Sets" type="number" inputMode="numeric" min="1" max={Number(dailyGoal)} step="1"
                value={setsGoal} onChange={e => setSetsGoal(e.target.value)} className="h-9 text-base" />
            </div>
          </div>
          {!validTargets && <p role="alert" className="text-xs text-feature-red">Reps: 1–9,999. Sets: 1–Total Reps. Use whole numbers.</p>}
          {/* Days of Week Selection */}
          <DaySelector compact
            selectedDays={scheduledDays}
            onSelectionChange={setScheduledDays}
            className="space-y-1"
          />


        </div>

        {saveError && <p role="alert" className="text-xs text-feature-red">{saveError}</p>}
        {/* Fixed Bottom Actions */}
        <DialogFooter className={`grid ${editingWorkout && onDelete ? "grid-cols-3" : "grid-cols-2"} gap-2 border-t border-separator pt-2 sm:space-x-0`}>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-2 text-strong"
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
              className="action-quiet-danger px-2 bg-red-500 hover:bg-red-600 text-on-action border-red-600"
            >
              Delete
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!workoutName.trim() || !validTargets}
            aria-label={editingWorkout ? "Update Workout" : "Add Workout"}
            className="px-2 bg-action-selected hover:bg-action text-on-action"
          >
            {editingWorkout ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
