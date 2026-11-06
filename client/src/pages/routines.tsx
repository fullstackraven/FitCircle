import { FormScreen } from '@/components/forms/form-page';
import { useRouteState, useRouteForm } from '@/components/forms/FormNavigation';
import { AppHeader } from '@/components/AppHeader';
import { DashboardMenu } from '@/components/DashboardMenu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import { VersionLabel } from '@/components/VersionLabel';
import { focusDashboardOnOpen, returnDashboardFocus } from '@/lib/dashboard-navigation';
import { Plus, Menu, Edit, ChevronDown, GripVertical } from 'lucide-react';
import { useWorkouts, type Routine, type Workout } from '@/hooks/use-workouts';
import { newPlanningId, prescriptionFor, prescriptionText, routineExercises, type ExerciseDetails, type ExercisePlacement } from '@/lib/routine-planning';
import { getColorClass } from '@/lib/color-utils';
import { Button } from '@/components/ui/button';
import { WorkoutEditor } from '@/components/workout-editor';
import { RoutineEditor, movePlacement } from '@/components/routine-editor';
const daysText = (days: number[]) => days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
export default function RoutinesPage() {
    const api = useWorkouts();
    const exercises = api.getWorkoutArray();
    const routines = api.getRoutineArray();
    const [menu, setMenu] = useState(false);
    useEffect(() => {
        const requested = new URLSearchParams(window.location.search).get('dashboard') === 'open';
        if (requested || sessionStorage.getItem('fitcircle_dashboard_open') === 'true') {
            setMenu(true);
            window.history.replaceState({}, '', window.location.pathname);
            sessionStorage.removeItem('fitcircle_dashboard_open');
        }
    }, []);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const [routineOpen, setRoutineOpen] = useRouteForm('routine'), [exerciseOpen, setExerciseOpen] = useRouteForm('workout');
    const [editingRoutine, setEditingRoutine] = useRouteState<Routine | null>('editingRoutine', null);
    const [draft, setDraft] = useRouteState<Routine | null>('routineDraft', null);
    const [editingWorkout, setEditingWorkout] = useRouteState<Workout | null>('editingWorkout', null);
    const [selectedRoutineId, setSelectedRoutineId] = useRouteState<string | undefined>('selectedRoutineId', undefined);
    const [placementId, setPlacementId] = useRouteState<string | undefined>('editingPlacementId', undefined);
    const openRoutine = (r?: Routine) => { setEditingRoutine(r ?? null); setDraft(r ? structuredClone(r) : { id: newPlanningId(), name: '', selectedDays: [], createdAt: new Date().toISOString(), placements: [] }); setSelectedRoutineId(undefined); setPlacementId(undefined); setRoutineOpen(true); };
    const openExercise = (r: Routine | null, p?: ExercisePlacement) => {
        setSelectedRoutineId(r?.id);
        setPlacementId(p?.id);
        const w = p ? api.workouts[p.exerciseId] : null;
        const variation = r?.variations?.find(v => v.id === r.activeVariationId);
        setEditingWorkout(w ? { ...w, prescription: variation?.targets[p!.id] ?? p!.prescription, weightLbs: p!.weightLbs ?? w.weightLbs, restSeconds: variation?.targets[p!.id]?.restSeconds ?? p!.restSeconds ?? w.restSeconds } : null);
        setExerciseOpen(true);
    };
    const saveExercise = (name: string, color: string, total: number, weightLbs?: number, scheduledDays?: number[], setsGoal = 1, details: ExerciseDetails = {}) => {
        const id = editingWorkout?.id ?? newPlanningId();
        const exercise: Workout = { ...editingWorkout, id, name, color, dailyGoal: total, setsGoal, weightLbs, scheduledDays, count: editingWorkout?.count ?? 0, ...details };
        if (!placementId && !api.saveExercise(exercise))
            return false;
        if (selectedRoutineId) {
            const r = draft?.id === selectedRoutineId ? draft : api.routines[selectedRoutineId];
            if (!r)
                return false;
            let next: Routine;
            if (placementId && r.activeVariationId) {
                next = { ...r, placements: r.placements?.map(p => p.id === placementId ? { ...p, weightLbs } : p), variations: r.variations?.map(v => v.id === r.activeVariationId ? { ...v, targets: { ...v.targets, [placementId]: { ...prescriptionFor(exercise), restSeconds: exercise.restSeconds } } } : v) };
            }
            else {
                const placement = { id: placementId ?? newPlanningId(), exerciseId: id, prescription: prescriptionFor(exercise), weightLbs, restSeconds: exercise.restSeconds };
                next = { ...r, placements: placementId ? r.placements!.map(p => p.id === placementId ? placement : p) : [...r.placements ?? [], placement] };
            }
            if (draft?.id === selectedRoutineId)
                setDraft(next);
            else if (!api.saveRoutinePlan(next))
                return false;
        }
        return true;
    };
    const removeRoutine = (r: Routine) => { if (confirm(`Delete routine “${r.name}”? Exercises and recorded activity are kept.`)) {
        if (api.deleteRoutine(r.id)) {
            setRoutineOpen(false);
            setDraft(null);
        }
        else
            setError('Routine could not be deleted.');
    } };
    return <FormScreen><div className="fitcircle-page">
  <AppHeader><div className="relative text-center max-w-md mx-auto px-4 h-14 flex items-center justify-center"><button className="fc-pill fc-icon-button absolute top-1/2 -translate-y-1/2 left-4 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-strong transition-colors" aria-label="Open Menu" onClick={() => setMenu(true)}><Menu size={22}/></button><h1 className="text-xl font-bold">Routines</h1></div></AppHeader>
  <div className="fitcircle-container space-y-4 pb-6">
   <div className="flex gap-3 items-center justify-between"><div className="min-w-0"><h2 className="text-2xl font-bold">My Routines</h2><p className="text-sm text-muted-foreground">{routines.length} routines · {routines.reduce((n, r) => n + (r.placements?.length ?? 0), 0)} exercise placements</p></div><Button className="bg-accent-text text-[hsl(var(--on-selected-action))] hover:bg-action-hover hover:text-on-action" onClick={() => openRoutine()} data-testid="button-create-routine"><Plus size={18}/>New</Button></div>
   {error && <p role="alert" className="text-feature-red">{error}</p>}
   {!routines.length && <div className="rounded-2xl border border-separator p-6 text-center"><p>No routines yet.</p><Button variant="ghost" data-testid="button-add-routine" onClick={() => openRoutine()}>Create Routine</Button></div>}
   {routines.map(r => {
            const rows = routineExercises(api.workoutData, r);
            const open = expanded.has(r.id);
            return <section key={r.id} className="rounded-2xl border border-separator bg-surface overflow-hidden" data-testid={`routine-card-${r.id}`}>
    <div className="flex gap-1 items-center px-4 py-3"><button data-control-geometry="record" data-testid={`routine-header-${r.id}`} aria-expanded={open} className="min-h-14 min-w-0 flex-1 text-left" onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}><h3 className="font-bold text-lg break-words">{r.name}</h3><p className="text-sm text-muted-foreground">{daysText(r.selectedDays)} · {rows.length} exercises{r.activeVariationId ? ` · ${r.variations?.find(v => v.id === r.activeVariationId)?.name ?? ''}` : ''}</p></button><Button size="icon" variant="ghost" aria-label={`Edit routine ${r.name}`} data-testid={`button-edit-routine-${r.id}`} onClick={() => openRoutine(r)}><Edit size={18}/></Button><ChevronDown className={`h-4 w-4 ${open ? 'rotate-180' : ''}`}/></div>
    {open && <div className="border-t border-separator p-3 space-y-2">{rows.map((w, i) => <div key={w.placementId} className="flex gap-2 rounded-xl bg-surface-secondary p-3 min-w-0" data-testid={`routine-exercise-${r.id}-${w.id}`}><GripVertical className="h-4 w-4 shrink-0 mt-3 text-muted-foreground"/><span className={`h-2.5 w-2.5 mt-4 shrink-0 rounded-full ${getColorClass(w.color)}`}/><button data-control-geometry="record" className="min-w-0 flex-1 text-left min-h-11" onClick={() => openExercise(r, r.placements!.find(p => p.id === w.placementId))}><strong className="entity-name block">{w.name}</strong><span className="text-sm text-muted-foreground">{prescriptionText(w.prescription)}{w.weightLbs !== undefined ? ` · ${w.weightLbs} lb` : ''}</span></button><div className="flex shrink-0"><button className="fc-pill min-h-11 min-w-11" aria-label={`Move ${w.name} up`} disabled={i === 0} onClick={() => { if (!api.saveRoutinePlan({ ...r, placements: movePlacement(r.placements!, i, -1) }))
                setError('Order could not be saved.'); }}>↑</button><button className="fc-pill min-h-11 min-w-11" aria-label={`Move ${w.name} down`} disabled={i === rows.length - 1} onClick={() => { if (!api.saveRoutinePlan({ ...r, placements: movePlacement(r.placements!, i, 1) }))
                setError('Order could not be saved.'); }}>↓</button></div></div>)}{!rows.length && <p className="py-4 text-sm text-muted-foreground">No exercises assigned.</p>}<Button className="w-full" variant="outline" data-testid={`button-add-workout-${r.id}`} onClick={() => openRoutine(r)}>＋ Add Exercise</Button></div>}
   </section>;
        })}
   <details className="rounded-2xl border border-separator p-4"><summary className="min-h-11 cursor-pointer font-semibold">Exercise Library</summary><div data-testid="exercise-library" className="space-y-2">{exercises.map(w => <button data-control-geometry="record" key={w.id} className="min-h-14 min-w-0 text-left w-full border-b border-separator" aria-label={`Edit workout ${w.name}`} onClick={() => { setSelectedRoutineId(undefined); setPlacementId(undefined); setEditingWorkout(w); setExerciseOpen(true); }}><strong className="entity-name block">{w.name}</strong><span className="text-sm text-muted-foreground">{prescriptionText(prescriptionFor(w))}</span></button>)}<Button variant="outline" className="w-full" onClick={() => openExercise(null)}>Create New Exercise</Button></div></details>
   <p className="text-center text-sm text-muted-foreground">Configure here · Log workouts on Home</p>
  </div>
  <RoutineEditor formId="routine" isOpen={routineOpen} onClose={() => { setRoutineOpen(false); setDraft(null); setEditingRoutine(null); }} draft={draft} onChange={setDraft} exercises={exercises} onExercise={p => openExercise(draft, p)} onSave={r => { const saved = api.saveRoutinePlan(r); if (!saved)
        setError('Routine could not be saved. Please check its exercises and retry.'); return saved; }} onDelete={editingRoutine ? () => removeRoutine(editingRoutine) : undefined}/>
  <WorkoutEditor formId="workout" isOpen={exerciseOpen} editingWorkout={editingWorkout} availableColors={api.getAvailableColors()} routineContext={!!selectedRoutineId} onClose={() => { setExerciseOpen(false); setEditingWorkout(null); setPlacementId(undefined); setSelectedRoutineId(undefined); }} onSave={saveExercise} onDelete={!selectedRoutineId ? id => api.deleteWorkout(id) : undefined}/>
  <Sheet open={menu} onOpenChange={setMenu}><SheetContent side="left" onOpenAutoFocus={focusDashboardOnOpen} onCloseAutoFocus={returnDashboardFocus} className="w-80 bg-canvas border-separator outline-none"><SheetHeader className="sr-only"><SheetTitle>Navigation Menu</SheetTitle></SheetHeader><div className="flex h-full flex-col"><DashboardMenu open={menu} returnTo="/routines" onNavigate={() => setMenu(false)}/><div className="p-4 border-t border-separator"><VersionLabel onActivate={() => setMenu(false)}/></div></div></SheetContent></Sheet>
 </div></FormScreen>;
}
