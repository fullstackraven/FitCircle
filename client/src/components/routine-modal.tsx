import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
      <DialogContent fixedFooter staticBody className="max-w-md text-white p-4 gap-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {editingRoutine ? 'Edit Routine' : 'Add New Routine'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a routine by giving it a name and selecting the days it applies to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Routine Name */}
          <div className="space-y-1">
            <Label htmlFor="routine-name" className="block text-xs leading-4 font-medium text-slate-300">
              Routine Name
            </Label>
            <Input
              id="routine-name"
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}

              className="h-9 text-base text-white placeholder-slate-400 focus:border-green-500"
              data-testid="input-routine-name"
            />
          </div>

          {/* Day Selection */}
          <DaySelector compact
            selectedDays={selectedDays}
            onSelectionChange={setSelectedDays}
            className="space-y-1"
          />
          <p className={`text-xs text-slate-400 mt-2 ${selectedDays.length ? "invisible" : ""}`} aria-hidden={selectedDays.length > 0}>
              Please select at least one day for this routine.
          </p>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-2 sm:space-x-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="text-white"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}