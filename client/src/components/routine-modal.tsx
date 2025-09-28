import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DaySelector } from './DaySelector';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, selectedDays: number[]) => void;
  editingRoutine?: { id: string; name: string; selectedDays: number[] } | null;
}


export function RoutineModal({ isOpen, onClose, onSave, editingRoutine }: RoutineModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [routineNameFocused, setRoutineNameFocused] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (editingRoutine) {
      setRoutineName(editingRoutine.name);
      setSelectedDays(editingRoutine.selectedDays);
    } else if (!isOpen) {
      resetForm();
    }
  }, [editingRoutine, isOpen]);

  const resetForm = () => {
    setRoutineName('');
    setSelectedDays([]);
    setRoutineNameFocused(false);
  };

  const handleSave = () => {
    if (routineName.trim() && selectedDays.length > 0) {
      onSave(routineName.trim(), selectedDays);
      resetForm();
      onClose();
    }
  };


  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {editingRoutine ? 'Edit Routine' : 'Add New Routine'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a routine by giving it a name and selecting the days it applies to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Routine Name */}
          <div className="space-y-2">
            <Label htmlFor="routine-name" className="text-sm font-medium text-slate-300">
              Routine Name
            </Label>
            <Input
              id="routine-name"
              type="text"
              placeholder={routineNameFocused ? '' : 'e.g., Pull Day, Push Day, Leg Day'}
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              onFocus={() => setRoutineNameFocused(true)}
              onBlur={() => setRoutineNameFocused(false)}
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-slate-400"
              data-testid="input-routine-name"
            />
          </div>

          {/* Day Selection */}
          <DaySelector
            selectedDays={selectedDays}
            onSelectionChange={setSelectedDays}
            className="space-y-2"
          />
          {selectedDays.length === 0 && (
            <p className="text-xs text-slate-400 mt-2">
              Please select at least one day for this routine.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            data-testid="button-cancel-routine"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!routineName.trim() || selectedDays.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-700 disabled:text-slate-400"
            data-testid="button-save-routine"
          >
            {editingRoutine ? 'Update' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}