import { useState } from 'react';
import '@/styles/training-editors.css';
import type { Routine, Workout } from '@/hooks/use-workouts';
import { newPlanningId, prescriptionFor, prescriptionText, type ExercisePlacement } from '@/lib/routine-planning';
import { FormGroup, FormContent, FormHeader, FormTitle, FormFooter } from '@/components/forms/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight } from 'lucide-react';
import { SortableExercises } from './SortableExercises';
import { ExercisePicker } from './ExercisePicker';
import { DaySelector } from './DaySelector';
export function RoutineEditor({ isOpen, onClose, onSave, draft, onChange, exercises, onExercise, onEditDefinition, onDelete }: {
    formId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (routine: Routine) => boolean;
    draft: Routine | null;
    onChange: (r: Routine) => void;
    exercises: Workout[];
    onExercise: (placement?: ExercisePlacement) => void;
    onEditDefinition?: (workout: Workout) => void;
    onDelete?: () => void;
}) {
    const [saveError, setSaveError] = useState('');
    if (!draft)
        return null;
    const placements = draft.placements ?? [], variation = draft.variations?.find(v => v.id === draft.activeVariationId);
    const patch = (changes: Partial<Routine>) => onChange({ ...draft, ...changes });
    return <FormGroup formId="routine" open={isOpen} onOpenChange={onClose}><FormContent variant="training">
  <FormHeader><FormTitle>Edit Routine</FormTitle></FormHeader>
  <div className="editor-sections" data-planning-edit>
   <div className="form-field"><Label htmlFor="routine-name">Routine Name</Label><Input id="routine-name" data-testid="input-routine-name" value={draft.name} onChange={e => patch({ name: e.target.value })}/></div>
   <DaySelector variant="sheet" heading="Training days" selectedDays={draft.selectedDays} onSelectionChange={selectedDays => patch({ selectedDays })}/>
   <p className="text-sm text-muted-foreground">{draft.selectedDays.length} training days selected</p>
   <section className="space-y-3"><div className="flex justify-between"><h2 className="font-bold text-lg">Exercises</h2><span className="text-muted-foreground">{placements.length} assigned</span></div>
    {variation && <p className="text-sm text-accent-text">Current variation: {variation.name}</p>}
    <SortableExercises items={placements} onActivate={onExercise} name={p => exercises.find(w => w.id === p.exerciseId)?.name ?? 'Missing exercise'} onReorder={placements => patch({ placements })} rowClassName="border border-separator p-2">
      {p => { const w = exercises.find(w => w.id === p.exerciseId); return <>
        <button data-control-geometry="record" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onExercise(p)} aria-label={`Configure ${w?.name ?? 'Missing exercise'}`}><span className="min-w-0 flex-1"><strong className="entity-name">{w?.name ?? 'Missing exercise'}</strong><span className="block text-sm text-muted-foreground">{prescriptionText(variation?.targets[p.id] ?? p.prescription)}</span></span><ChevronRight size={18} className="shrink-0 text-muted-foreground"/></button>
        <Button size="icon" variant="ghost" className="text-feature-red" aria-label={`Remove ${w?.name} from routine`} onClick={() => patch({ placements: placements.filter(item => item.id !== p.id) })}>×</Button>
      </>; }}
    </SortableExercises>
    {!placements.length && <p className="text-sm text-muted-foreground">No exercises assigned yet.</p>}
    <ExercisePicker exercises={exercises} assigned={placements.map(p => p.exerciseId)} onSelect={w => patch({ placements: [...placements, { id: newPlanningId(), exerciseId: w.id, prescription: prescriptionFor(w), weightLbs: w.weightLbs, restSeconds: w.restSeconds }] })} onCreate={() => onExercise()} onEdit={onEditDefinition}/>
   </section>
   <section className="space-y-4">
    <div className="form-field"><Label htmlFor="routine-description">Description / notes</Label><textarea id="routine-description" className="glass-input w-full rounded-xl p-3 min-h-24" value={draft.description ?? ''} onChange={e => patch({ description: e.target.value })}/></div>
    <h3 className="font-semibold">Training variations</h3>
    <Label htmlFor="active-variation">Current variation</Label><select id="active-variation" className="glass-input fc-pill w-full min-h-11 p-3" value={draft.activeVariationId ?? ''} onChange={e => patch({ activeVariationId: e.target.value || undefined })}><option value="">Base targets</option>{draft.variations?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
    {draft.variations?.map(v => <div key={v.id} className="flex gap-2 min-w-0"><Input aria-label={`Variation name ${v.name}`} value={v.name} onChange={e => patch({ variations: draft.variations!.map(item => item.id === v.id ? { ...v, name: e.target.value } : item) })}/><Button variant="ghost" aria-label={`Delete variation ${v.name}`} onClick={() => { if (confirm('Delete this variation? Recorded activity is kept.'))
        patch({ variations: draft.variations!.filter(item => item.id !== v.id), activeVariationId: draft.activeVariationId === v.id ? undefined : draft.activeVariationId }); }}>Delete</Button></div>)}
    <Button variant="outline" onClick={() => { const id = newPlanningId(); patch({ variations: [...draft.variations ?? [], { id, name: 'New variation', targets: {} }], activeVariationId: id }); }}>Add Variation</Button>
   </section>
  </div>
  {saveError && <p role="alert" className="text-feature-red">{saveError}</p>}
  <FormFooter className="editor-footer"><Button className="editor-primary bg-action-selected text-on-action hover:bg-action" data-testid="button-save-routine" disabled={!draft.name.trim() || !draft.selectedDays.length || draft.variations?.some(v => !v.name.trim())} onClick={() => { if (onSave(draft))
        onClose();
    else
        setSaveError('Routine could not be saved. Please retry.'); }}>Save Routine</Button><div className="editor-secondary">{onDelete && <Button variant="ghost" className="text-feature-red" onClick={onDelete}>Delete Routine</Button>}<Button variant="ghost" data-testid="button-cancel-routine" onClick={onClose}>Cancel</Button></div></FormFooter>
 </FormContent></FormGroup>;
}
