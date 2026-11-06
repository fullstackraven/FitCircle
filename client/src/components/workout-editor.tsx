import '@/styles/training-editors.css';
import { useEffect, useRef, useState } from 'react';
import type { Workout } from '@/hooks/use-workouts';
import { prescriptionFor, totalTarget, validPrescription, prescriptionText, type ExerciseDetails, type Prescription } from '@/lib/routine-planning';
import { FormGroup, FormContent, FormHeader, FormTitle, FormFooter } from '@/components/forms/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exerciseCategories } from '@/lib/exercise-catalog';
interface Props {
    formId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: string, total: number, weight?: number, days?: number[], sets?: number, details?: ExerciseDetails) => boolean | undefined;
    onDelete?: (id: string) => boolean | void;
    availableColors: string[];
    editingWorkout?: Partial<Workout> & {
        id: string;
        name: string;
        color: string;
        dailyGoal: number;
    } | null;
    routineContext?: boolean;
    initialWorkout?: Workout | null;
    deleteMessage?: string;
}
export function WorkoutEditor({ formId = 'workout', isOpen, onClose, onSave, onDelete, availableColors, editingWorkout, initialWorkout, deleteMessage }: Props) {
    const values = initialWorkout ?? editingWorkout;
    const submitted = useRef(false);
    const seed = values ? prescriptionFor(values as Workout) : { targetType: 'repetitions' as const, sets: 1, perSet: 10 };
    const [name, setName] = useState(values?.name ?? '');
    const [p, setP] = useState<Prescription>(seed);
    const [weight, setWeight] = useState('');
    const [color, setColor] = useState('green');
    const [equipment, setEquipment] = useState('');
    const [rest, setRest] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [category, setCategory] = useState(values?.category ?? 'full-body-functional');
    useEffect(() => {
      if (!isOpen) return;
      submitted.current = false;
      setName(values?.name ?? '');
      setP(values ? prescriptionFor(values as Workout) : { targetType:'repetitions',sets:1,perSet:10 });
      setColor(values?.color ?? availableColors[0] ?? 'green');
      setWeight(values?.weightLbs === undefined ? '' : String(values.weightLbs));
      setEquipment(values?.equipment ?? ''); setRest(values?.restSeconds === undefined ? '' : String(values.restSeconds));
      setNotes(values?.notes ?? ''); setCategory(values?.category ?? 'full-body-functional'); setError('');
    }, [isOpen, values]);
    const valid = validPrescription(p) && (!weight || Number.isFinite(Number(weight)) && Number(weight) >= 0 && Number(weight) <= 9999) && (!rest || Number.isInteger(Number(rest)) && Number(rest) >= 0 && Number(rest) <= 86400);
    const change = (values: Partial<Prescription>) => setP(previous => ({ ...previous, ...values, legacyTotal: undefined }));
    return <FormGroup formId={formId} open={isOpen} onOpenChange={onClose}><FormContent variant="training">
    <FormHeader><FormTitle>{editingWorkout ? 'Edit Exercise' : 'Add Exercise'}</FormTitle></FormHeader>
    <div className="editor-sections">
      <section className="form-field"><Label htmlFor="workout-name">Exercise Name</Label><Input id="workout-name" aria-label="Workout Name" value={name} onChange={e => setName(e.target.value)} className="editor-name"/></section>
      <section className="space-y-4">
        <Label>Target Type</Label><div className="goal-editor-segments" role="group" aria-label="Target Type">{(['repetitions', 'duration'] as const).map(type => <Button key={type} variant="ghost" aria-pressed={p.targetType === type} onClick={() => change({ targetType: type })}>{type === 'duration' ? 'Duration' : 'Repetitions'}</Button>)}</div>
        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="form-field"><Label htmlFor="sets-goal">Sets</Label><Input id="sets-goal" aria-label="Number of Sets" type="number" min="1" max="999" value={p.sets || ''} onChange={e => change({ sets: Number(e.target.value) })}/></div>
          <div className="form-field"><Label htmlFor="per-set">{p.targetType === 'duration' ? 'Seconds per Set' : 'Reps per Set'}</Label><Input id="per-set" type="number" min="1" max={p.targetType === 'duration' ? 86400 : 9999} value={p.perSet || ''} onChange={e => change({ perSet: Number(e.target.value) })}/></div>
        </div>
        <p className="rounded-xl bg-surface-secondary p-4 font-semibold text-accent-text" aria-live="polite">Target · {prescriptionText(p)}</p>
        {p.legacyTotal !== undefined && <p className="text-sm text-muted-foreground">Existing uneven total is preserved. Editing sets or target per set replaces this legacy split.</p>}
        <div className="form-field"><Label htmlFor="weight-lbs">Weight (lbs) · Optional</Label><Input id="weight-lbs" aria-label="Weight (lbs) - Optional" type="number" min="0" step="any" value={weight} onChange={e => setWeight(e.target.value)}/><p className="text-xs text-muted-foreground">Leave empty for bodyweight. Equipment resistance levels belong in notes, not pounds.</p></div>
      </section>
      <section className="space-y-4">
        <div className="form-field"><Label htmlFor="exercise-category">Body-part category</Label><select id="exercise-category" className="glass-input fc-pill w-full min-h-11 p-3" value={category} onChange={e => setCategory(e.target.value as typeof category)}>{exerciseCategories.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></div>
        <div className="form-field"><Label htmlFor="exercise-equipment">Equipment</Label><Input id="exercise-equipment" value={equipment} onChange={e => setEquipment(e.target.value)}/></div>
        <div className="form-field"><Label htmlFor="exercise-rest">Rest between sets (seconds)</Label><Input id="exercise-rest" type="number" min="0" value={rest} onChange={e => setRest(e.target.value)}/></div>
        <div className="form-field"><Label htmlFor="exercise-notes">Instructions / notes</Label><textarea id="exercise-notes" className="glass-input rounded-xl w-full min-h-24 p-3" value={notes} onChange={e => setNotes(e.target.value)}/></div>
        <div className="form-field"><Label htmlFor="workout-color">Exercise color</Label><select id="workout-color" aria-label="Workout color" className="glass-input fc-pill min-h-11 p-3" value={color} onChange={e => setColor(e.target.value)}>{[...new Set([...availableColors, color])].map(c => <option key={c}>{c}</option>)}</select></div>
      </section>

    </div>
    {((!valid && (p.sets !== 0 || p.perSet !== 0 || weight !== '' || rest !== '')) || error) && <p role="alert" className="text-sm text-feature-red">{error || 'Use positive whole sets and targets, up to 9,999 total reps or 86,400 total seconds; optional weight and rest must be non-negative.'}</p>}
    <FormFooter className="editor-footer"><Button className="editor-primary bg-action-selected text-on-action hover:bg-action" disabled={!name.trim() || !valid} onClick={() => { if (submitted.current) return; submitted.current = true; const saved = onSave(name.trim(), color, totalTarget(p), weight === '' ? undefined : Number(weight), editingWorkout?.scheduledDays, p.sets, { prescription: p, equipment: equipment.trim(), restSeconds: rest === '' ? undefined : Number(rest), notes: notes.trim(), category }); if (saved)
        onClose();
    else
        { submitted.current = false; setError('Changes were not saved. Please retry.'); } }}>Save Exercise</Button>
      <div className="editor-secondary">{editingWorkout && onDelete && <Button variant="ghost" className="text-feature-red" onClick={() => { if (confirm(deleteMessage ?? 'Delete this reusable exercise? It will be removed from routines; historical activity is kept.')) {
        if (onDelete(editingWorkout.id) !== false)
            onClose();
        else
            setError('Exercise could not be deleted. Please retry.');
    } }}>Delete Exercise</Button>}<Button variant="ghost" onClick={onClose}>Cancel</Button></div>
    </FormFooter>
  </FormContent></FormGroup>;
}
