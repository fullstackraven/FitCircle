import '@/styles/training-editors.css';
import { useState, useEffect } from 'react';
import { FormGroup, FormContent, FormHeader, FormTitle, FormDescription, FormFooter } from '@/components/forms/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DaySelector } from './DaySelector';

interface RoutineEditorProps {
  formId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, selectedDays: number[]) => void;
  editingRoutine?: { id: string; name: string; selectedDays: number[] } | null;
}


export function RoutineEditor({ isOpen, onClose, onSave, editingRoutine }: RoutineEditorProps) {
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
    <FormGroup formId="routine" open={isOpen} onOpenChange={handleClose}>
      <FormContent className="training-editor max-w-md text-strong">
        <FormHeader>
          <FormTitle>{editingRoutine ? 'Edit Routine' : 'New Routine'}</FormTitle>
          <FormDescription>{editingRoutine ? 'Update your training schedule' : 'Build your weekly training schedule'}</FormDescription>
        </FormHeader>
        <div className="editor-sections">
          <section>
            <Label htmlFor="routine-name" className="editor-section-title">Routine name</Label>
            <Input id="routine-name" type="text" value={routineName} onChange={(e) => setRoutineName(e.target.value)} className="editor-name" placeholder="e.g. Push Day" data-testid="input-routine-name" />
          </section>
          <DaySelector variant="sheet" heading="Training days" selectedDays={selectedDays} onSelectionChange={setSelectedDays} />
          <p className="editor-day-summary">{selectedDays.length ? `${selectedDays.length} training day${selectedDays.length === 1 ? '' : 's'} selected` : 'Please select at least one day for this routine.'}</p>
        </div>
        <FormFooter className="editor-footer">
          <Button onClick={handleSave} disabled={!routineName.trim() || selectedDays.length === 0} className="editor-primary bg-action-selected text-on-action hover:bg-action" data-testid="button-save-routine">
            {editingRoutine ? 'Save Changes' : 'Create Routine'}
          </Button>
          <div className="editor-secondary"><Button variant="ghost" onClick={handleClose} className="editor-cancel" data-testid="button-cancel-routine">Cancel</Button></div>
        </FormFooter>
      </FormContent>
    </FormGroup>
  );
}
