import { ChevronDown, Trash2 } from 'lucide-react';
import '@/styles/training-editors.css';
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
      <DialogContent fixedFooter staticBody className="training-editor max-w-md text-strong">
        <DialogHeader>
          <DialogTitle>{editingWorkout ? 'Edit Workout' : 'New Workout'}</DialogTitle>
          <DialogDescription>{editingWorkout ? 'Update exercise settings' : 'Set up an exercise for your Home dashboard'}</DialogDescription>
        </DialogHeader>
        <div className="editor-sections">
          <section aria-labelledby="exercise-heading">
            <h3 id="exercise-heading" className="editor-section-title">Exercise</h3>
            <Label htmlFor="workout-name" className="sr-only">Workout Name</Label>
            <Input
                id="workout-name"
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="editor-name" placeholder="Workout name"
              />
          </section>
          <section aria-labelledby="workout-details-heading">
            <div className="editor-section-row">
              <h3 id="workout-details-heading" className="editor-section-title">Workout details</h3>
              <div className="editor-color">
                <span aria-hidden="true" className={`editor-color-dot ${getColorClass(selectedColor)}`} />
                <select id="workout-color" value={selectedColor} onChange={event => setSelectedColor(event.target.value)}
                  className="fc-pill editor-color-select" aria-label="Workout color">
                  {Array.from(new Set([...availableColors, selectedColor])).map(color => (
                    <option key={color} value={color} className="bg-canvas text-strong">{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" className="editor-color-chevron" />
              </div>
            </div>
            <div className="editor-numbers">
              <div className="editor-number-card"><Input
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

                className="editor-value" placeholder="—"
              /><Label htmlFor="weight-lbs">Weight (lbs)</Label></div>
              <div className="editor-number-card"><Input
                id="daily-goal"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={dailyGoal.toString()}
                onChange={e => setDailyGoal(e.target.value)}
                onFocus={(e) => {

                  e.target.select(); // Select all text when focused
                }}

                className="editor-value"
              /><Label htmlFor="daily-goal">Total Reps</Label></div>
              <div className="editor-number-card"><Input id="sets-goal" aria-label="Number of Sets" type="number" inputMode="numeric" min="1" max={Number(dailyGoal)} step="1"
                value={setsGoal} onChange={e => setSetsGoal(e.target.value)} className="editor-value" /><Label htmlFor="sets-goal">Sets</Label></div>
            </div>
            {!validTargets && <p role="alert" className="text-xs text-feature-red mt-2">Reps: 1–9,999. Sets: 1–Total Reps. Use whole numbers.</p>}
          </section>
          <DaySelector variant="sheet" heading="Schedule" selectedDays={scheduledDays} onSelectionChange={setScheduledDays} />
        </div>
        {saveError && <p role="alert" className="text-xs text-feature-red">{saveError}</p>}
        <DialogFooter className="editor-footer">
          <Button onClick={handleSave} disabled={!workoutName.trim() || !validTargets} className="editor-primary bg-action-selected text-on-action hover:bg-action">
            {editingWorkout ? 'Save Changes' : 'Add Workout'}
          </Button>
          <div className={editingWorkout && onDelete ? 'editor-secondary editor-secondary-split' : 'editor-secondary'}>
            {editingWorkout && onDelete && <Button variant="ghost" onClick={() => {
                if (editingWorkout && onDelete) {
                  onDelete(editingWorkout.id);
                  handleCancel();
                }
              }} className="editor-delete text-feature-red"><Trash2 size={16} aria-hidden="true" />Delete Workout</Button>}
            <Button variant="ghost" onClick={handleCancel} className="editor-cancel">Cancel</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
