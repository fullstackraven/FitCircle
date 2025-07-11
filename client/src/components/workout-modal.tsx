import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  availableColors: string[];
}

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

export function WorkoutModal({ isOpen, onClose, onSave, availableColors }: WorkoutModalProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || 'green');

  const handleSave = () => {
    if (workoutName.trim()) {
      onSave(workoutName.trim(), selectedColor);
      setWorkoutName('');
      setSelectedColor(availableColors[0] || 'green');
      onClose();
    }
  };

  const handleCancel = () => {
    setWorkoutName('');
    setSelectedColor(availableColors[0] || 'green');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center text-white">
            Add New Workout
          </DialogTitle>
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
              placeholder="e.g., Pull-ups, Lunges, Planks"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">Choose Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {availableColors.map((color) => (
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
              disabled={!workoutName.trim()}
              className="flex-1 workout-green text-white hover:opacity-90"
            >
              Add Workout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
