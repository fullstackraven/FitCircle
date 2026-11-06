import { useState } from 'react';
import '@/styles/training-editors.css';
import type { Routine, Workout } from '@/hooks/use-workouts';
import { newPlanningId, prescriptionFor, prescriptionText, type ExercisePlacement } from '@/lib/routine-planning';
import { FormGroup, FormContent, FormHeader, FormTitle, FormDescription, FormFooter } from '@/components/forms/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DaySelector } from './DaySelector';
export function movePlacement(items: ExercisePlacement[], index: number, delta: number) { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length)
    return items; [next[index], next[target]] = [next[target], next[index]]; return next; }
export function RoutineEditor({ isOpen, onClose, onSave, draft, onChange, exercises, onExercise, onDelete }: {
    formId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (routine: Routine) => boolean;
    draft: Routine | null;
    onChange: (r: Routine) => void;
    exercises: Workout[];
    onExercise: (placement?: ExercisePlacement) => void;
    onDelete?: () => void;
}) {
    const [saveError, setSaveError] = useState('');
    if (!draft)
        return null;
    const placements = draft.placements ?? [], variation = draft.variations?.find(v => v.id === draft.activeVariationId);
    const patch = (changes: Partial<Routine>) => onChange({ ...draft, ...changes });
    return <FormGroup formId="routine" open={isOpen} onOpenChange={onClose}><FormContent variant="training">
  <FormHeader><FormTitle>Edit Routine</FormTitle><FormDescription>Configure here · Log workouts on Home</FormDescription></FormHeader>
  <div className="editor-sections" data-planning-edit>
   <div className="form-field"><Label htmlFor="routine-name">Routine Name</Label><Input id="routine-name" data-testid="input-routine-name" value={draft.name} onChange={e => patch({ name: e.target.value })}/></div>
   <DaySelector variant="sheet" heading="Training days" selectedDays={draft.selectedDays} onSelectionChange={selectedDays => patch({ selectedDays })}/>
   <p className="text-sm text-muted-foreground">{draft.selectedDays.length} training days selected</p>
   <section className="space-y-3"><div className="flex justify-between"><h2 className="font-bold text-lg">Exercises</h2><span className="text-muted-foreground">{placements.length} assigned</span></div>
    {variation && <p className="text-sm text-accent-text">Current variation: {variation.name}</p>}
    {placements.map((p, i) => {
            const w = exercises.find(w => w.id === p.exerciseId);
            return <div className="flex items-center gap-1 rounded-xl border border-separator p-2" key={p.id}>
      <button data-control-geometry="record" className="min-h-11 min-w-0 flex-1 text-left" onClick={() => onExercise(p)} aria-label={`Configure ${w?.name ?? 'Missing exercise'}`}><strong className="entity-name">{w?.name ?? 'Missing exercise'}</strong><span className="block text-sm text-muted-foreground">{prescriptionText(variation?.targets[p.id] ?? p.prescription)}</span></button>
      <div className="flex shrink-0"><Button size="icon" variant="ghost" disabled={i === 0} aria-label={`Move ${w?.name} up`} onClick={() => patch({ placements: movePlacement(placements, i, -1) })}>↑</Button><Button size="icon" variant="ghost" disabled={i === placements.length - 1} aria-label={`Move ${w?.name} down`} onClick={() => patch({ placements: movePlacement(placements, i, 1) })}>↓</Button><Button variant="ghost" className="text-feature-red" aria-label={`Remove ${w?.name} from routine`} onClick={() => patch({ placements: placements.filter(item => item.id !== p.id) })}>×</Button></div>
    </div>;
        })}
    {!placements.length && <p className="text-sm text-muted-foreground">No exercises assigned yet.</p>}
    <details><summary className="min-h-11 cursor-pointer font-semibold">＋ Add Exercise</summary><div className="space-y-2 pt-2">
      {exercises.filter(w => !placements.some(p => p.exerciseId === w.id)).map(w => <Button key={w.id} variant="outline" className="w-full justify-start whitespace-normal" onClick={() => patch({ placements: [...placements, { id: newPlanningId(), exerciseId: w.id, prescription: prescriptionFor(w), weightLbs: w.weightLbs, restSeconds: w.restSeconds }] })}>Add {w.name}</Button>)}
      <Button variant="outline" className="w-full" onClick={() => onExercise()}>Create New Exercise</Button>
    </div></details>
   </section>
   <details className="space-y-4"><summary className="min-h-11 cursor-pointer font-semibold">Additional Options</summary>
    <div className="form-field"><Label htmlFor="routine-description">Description / notes</Label><textarea id="routine-description" className="glass-input w-full rounded-xl p-3 min-h-24" value={draft.description ?? ''} onChange={e => patch({ description: e.target.value })}/></div>
    <h3 className="font-semibold">Training variations</h3><p className="text-sm text-muted-foreground">Optional manual target selection. History never changes. Select a variation, then configure an assigned exercise to edit its targets.</p>
    <Label htmlFor="active-variation">Current variation</Label><select id="active-variation" className="glass-input fc-pill w-full min-h-11 p-3" value={draft.activeVariationId ?? ''} onChange={e => patch({ activeVariationId: e.target.value || undefined })}><option value="">Base targets</option>{draft.variations?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
    {draft.variations?.map(v => <div key={v.id} className="flex gap-2 min-w-0"><Input aria-label={`Variation name ${v.name}`} value={v.name} onChange={e => patch({ variations: draft.variations!.map(item => item.id === v.id ? { ...v, name: e.target.value } : item) })}/><Button variant="ghost" aria-label={`Delete variation ${v.name}`} onClick={() => { if (confirm('Delete this variation? Recorded activity is kept.'))
        patch({ variations: draft.variations!.filter(item => item.id !== v.id), activeVariationId: draft.activeVariationId === v.id ? undefined : draft.activeVariationId }); }}>Delete</Button></div>)}
    <Button variant="outline" onClick={() => { const id = newPlanningId(); patch({ variations: [...draft.variations ?? [], { id, name: 'New variation', targets: {} }], activeVariationId: id }); }}>Add Variation</Button>
   </details>
  </div>
  {saveError && <p role="alert" className="text-feature-red">{saveError}</p>}
  <FormFooter className="editor-footer"><Button className="editor-primary bg-action-selected text-on-action hover:bg-action" data-testid="button-save-routine" disabled={!draft.name.trim() || !draft.selectedDays.length || draft.variations?.some(v => !v.name.trim())} onClick={() => { if (onSave(draft))
        onClose();
    else
        setSaveError('Routine could not be saved. Please retry.'); }}>Save Routine</Button><div className="editor-secondary">{onDelete && <Button variant="ghost" className="text-feature-red" onClick={onDelete}>Delete Routine</Button>}<Button variant="ghost" data-testid="button-cancel-routine" onClick={onClose}>Cancel</Button></div></FormFooter>
 </FormContent></FormGroup>;
}
