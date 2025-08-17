import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, dailyGoal: number) => void;
  availableColors: string[];
  editingWorkout?: { id: string; name: string; color: string; dailyGoal: number } | null;
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

export function WorkoutModal({ isOpen, onClose, onSave, availableColors, editingWorkout }: WorkoutModalProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || 'green');
  const [dailyGoal, setDailyGoal] = useState<number | string>(10);
  const [workoutNameFocused, setWorkoutNameFocused] = useState(false);
  const [dailyGoalFocused, setDailyGoalFocused] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (editingWorkout) {
      setWorkoutName(editingWorkout.name);
      setSelectedColor(editingWorkout.color);
      setDailyGoal(editingWorkout.dailyGoal);
    } else if (!isOpen) {
      resetForm();
    }
  }, [editingWorkout, isOpen]);

  const handleSave = () => {
    const finalGoal = typeof dailyGoal === 'string' ? parseInt(dailyGoal) || 1 : dailyGoal;
    if (workoutName.trim() && finalGoal > 0) {
      onSave(workoutName.trim(), selectedColor, finalGoal);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setWorkoutName('');
    setSelectedColor(availableColors[0] || 'green');
    setDailyGoal(10);
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
              value={dailyGoal.toString()}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                
                if (value === '') {
                  // Allow empty field for editing
                  setDailyGoal('');
                  return;
                }
                
                const numValue = parseInt(value);
                // Allow up to 4 digits (1-9999)
                if (numValue >= 1 && numValue <= 9999) {
                  setDailyGoal(numValue);
                }
              }}
              onBlur={(e) => {
                // If field is empty on blur, set to 1
                if (dailyGoal === '' || dailyGoal === 0) {
                  setDailyGoal(1);
                }
              }}
              onFocus={(e) => e.target.select()} // Select all text when focused
              className="bg-slate-700 border-slate-600 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">Choose Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {(editingWorkout ? [...availableColors, editingWorkout.color] : availableColors).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full ${colorClassMap[color]} border-2 transition-colors ${
                    selectedColor === color
                      ? 'border-white ring-2 ring-white'
                      : 'border-transparent hover:border-white'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!workoutName.trim() || !dailyGoal || (typeof dailyGoal === 'number' && dailyGoal <= 0)}
              className="flex-1 workout-green text-white hover:opacity-90"
            >
              {editingWorkout ? 'Update Workout' : 'Add Workout'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
