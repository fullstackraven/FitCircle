import { FormScreen } from '@/components/forms/form-page';
import { useRouteState, useRouteForm } from '@/components/forms/FormNavigation';
import { AppHeader } from '@/components/AppHeader';
import { DashboardMenu } from '@/components/DashboardMenu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import { VersionLabel } from '@/components/VersionLabel';
import { focusDashboardOnOpen, returnDashboardFocus } from '@/lib/dashboard-navigation';
import { Plus, Menu, Edit, ChevronDown, ChevronRight, Ellipsis, Check } from 'lucide-react';
import { useWorkouts, type Routine, type Workout } from '@/hooks/use-workouts';
import { newPlanningId, prescriptionFor, prescriptionText, routineExercises, type ExerciseDetails, type ExercisePlacement } from '@/lib/routine-planning';
import { getColorClass } from '@/lib/color-utils';
import { Button } from '@/components/ui/button';
import { WorkoutEditor } from '@/components/workout-editor';
import { RoutineEditor } from '@/components/routine-editor';
import { SortableExercises } from '@/components/SortableExercises';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { readRoutineSort, sortRoutines, routineSortOptions, ROUTINE_SORT_KEY, type RoutineSort } from '@/lib/routine-sort';
import { ExerciseCatalog } from '@/components/ExerciseCatalog';
import { customExerciseSeed, prebuiltExerciseSeed, type ExerciseMode } from '@/lib/exercise-selection';
import type { CatalogExercise, EquipmentFilter, ExerciseCategory } from '@/lib/exercise-catalog';
const daysText = (days: number[]) => days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
export default function RoutinesPage() {
    const api = useWorkouts();
    const exercises = api.getWorkoutArray();
    const [sort, setSort] = useState(() => readRoutineSort(localStorage));
    const [sortOpen, setSortOpen] = useState(false);
    const routines = sortRoutines(api.getRoutineArray(), sort);
    const [menu, setMenu] = useState(false);
    useEffect(() => {
        const requested = new URLSearchParams(window.location.search).get('dashboard') === 'open';
        if (requested || sessionStorage.getItem('fitcircle_dashboard_open') === 'true') {
            setMenu(true); window.history.replaceState({}, '', window.location.pathname); sessionStorage.removeItem('fitcircle_dashboard_open');
        }
    }, []);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const selectSort = (value: RoutineSort) => {
        setSort(value); setSortOpen(false); setError('');
        try { localStorage.setItem(ROUTINE_SORT_KEY, value); }
        catch { setError('The sort order changed, but could not be saved for next time.'); }
    };
    const [routineOpen, setRoutineOpen] = useRouteForm('routine');
    const [exerciseOpen, setExerciseOpen] = useRouteForm('workout');
    const [catalogOpen, setCatalogOpen] = useRouteForm('exercise-catalog');
    const [customOpen, setCustomOpen] = useRouteForm('custom-exercise');
    const [editingRoutine, setEditingRoutine] = useRouteState<Routine | null>('editingRoutine', null);
    const [draft, setDraft] = useRouteState<Routine | null>('routineDraft', null);
    const [editingWorkout, setEditingWorkout] = useRouteState<Workout | null>('editingWorkout', null);
    const [seed, setSeed] = useRouteState<Workout | null>('exerciseSeed', null);
    const [selectedRoutineId, setSelectedRoutineId] = useRouteState<string | undefined>('selectedRoutineId', undefined);
    const [placementId, setPlacementId] = useRouteState<string | undefined>('editingPlacementId', undefined);
    const [mode, setMode] = useRouteState<ExerciseMode | undefined>('exerciseMode', undefined);
    const [, setTemplateId] = useRouteState<string | undefined>('catalogTemplateId', undefined);
    const [, setExerciseId] = useRouteState<string | undefined>('catalogExerciseId', undefined);
    const [search, setSearch] = useRouteState('catalogSearch', '');
    const [category, setCategory] = useRouteState('catalogCategory', 'all');
    const [equipment, setEquipment] = useRouteState<EquipmentFilter>('catalogEquipment', 'all');
    const clearSelection = () => { setPlacementId(undefined); setTemplateId(undefined); setExerciseId(undefined); setSeed(null); setEditingWorkout(null); };
    const openRoutine = (r?: Routine) => {
        setEditingRoutine(r ?? null); setDraft(r ? structuredClone(r) : {id:newPlanningId(),name:'',selectedDays:[],createdAt:new Date().toISOString(),placements:[]});
        setSelectedRoutineId(undefined); clearSelection(); setRoutineOpen(true);
    };
    const openCatalog = (r: Routine) => {
        clearSelection(); setSelectedRoutineId(r.id); setSearch(''); setCategory('all'); setEquipment('all'); setCatalogOpen(true);
    };
    const openExercise = (r: Routine, p: ExercisePlacement) => {
        clearSelection(); setSelectedRoutineId(r.id); setPlacementId(p.id); setMode('placement');
        const item = routineExercises(api.workoutData,r).find(w => w.placementId === p.id);
        setEditingWorkout(item ?? null); setExerciseOpen(true);
    };
    const selectExercise = (template: CatalogExercise, definition?: Workout) => {
        clearSelection();
        if (definition) {
            setMode('reuse'); setExerciseId(definition.id); setSeed({...definition});
        } else {
            const existing=exercises.find(w => w.catalogId === template.id && !w.catalogHidden);
            setMode('prebuilt'); setTemplateId(template.id); setSeed(prebuiltExerciseSeed(template,existing));
        }
        setExerciseOpen(true);
    };
    const createCustom = () => {
        clearSelection(); setMode('custom'); setSeed(customExerciseSeed(category === 'all' ? undefined : category as ExerciseCategory)); setCustomOpen(true);
    };
    const editCustom = (workout:Workout) => {
        clearSelection(); setMode('definition'); setEditingWorkout(workout); setCustomOpen(true);
    };
    const closeExercise = () => setExerciseOpen(false);
    const closeCustom = () => setCustomOpen(false);
    const saveExercise = (name:string,color:string,total:number,weightLbs?:number,scheduledDays?:number[],setsGoal=1,details:ExerciseDetails={}) => {
        const source=editingWorkout ?? seed;
        const id=source?.id ?? newPlanningId();
        const exercise:Workout={...source,id,name,color,dailyGoal:total,setsGoal,weightLbs,scheduledDays,count:api.workouts[id]?.count ?? 0,...details};
        if (mode === 'definition' || !selectedRoutineId) return api.saveExerciseTemplate(exercise);
        const r = draft?.id === selectedRoutineId ? draft : api.routines[selectedRoutineId];
        if (!r) return false;
        const old = placementId ? r.placements?.find(p => p.id === placementId) : undefined;
        const placement:ExercisePlacement = {...old,id:old?.id ?? newPlanningId(),exerciseId:id,prescription:prescriptionFor(exercise),
            name,color,category:exercise.category,equipment:exercise.equipment ?? '',notes:exercise.notes ?? '',
            weightLbs:weightLbs ?? null,restSeconds:exercise.restSeconds ?? null};
        const definition=api.workouts[id] ? undefined : exercise;
        if (draft?.id === selectedRoutineId) {
            if (definition && !api.saveExerciseTemplate(definition)) return false;
            setDraft({...r,placements:old ? r.placements!.map(p => p.id === old.id ? placement : p) : [...r.placements ?? [],placement]});
            return true;
        }
        return api.saveRoutineExercise(r,placement,definition);
    };
    const removeRoutine = (r:Routine) => {
        if (!confirm(`Delete routine “${r.name}”? Exercises and recorded activity are kept.`)) return;
        if (api.deleteRoutine(r.id)) { setRoutineOpen(false); setDraft(null); } else setError('Routine could not be deleted.');
    };
    const removePlacement = () => {
        const r = draft?.id === selectedRoutineId ? draft : selectedRoutineId ? api.routines[selectedRoutineId] : undefined;
        if (!r || !placementId) return false;
        const next={...r,placements:r.placements?.filter(p => p.id !== placementId)};
        if (draft?.id === selectedRoutineId) { setDraft(next); return true; }
        return api.saveRoutinePlan(next);
    };
    const templateUses = editingWorkout ? routines.filter(r => r.placements?.some(p => p.exerciseId === editingWorkout.id)).length : 0;
    return <FormScreen><div className="fitcircle-page">
  <AppHeader><div className="relative text-center max-w-md mx-auto px-4 h-14 flex items-center justify-center"><button className="fc-pill fc-icon-button absolute top-1/2 -translate-y-1/2 left-4 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-strong transition-colors" aria-label="Open Menu" onClick={() => setMenu(true)}><Menu size={22}/></button><h1 className="fitcircle-wordmark text-2xl font-bold text-strong">FitCircle</h1></div></AppHeader>
  <div className="fitcircle-container space-y-4 pb-6">
   <div className="flex gap-3 items-center justify-between"><div className="min-w-0"><h2 className="text-2xl font-bold">Routines</h2></div><div className="flex shrink-0 items-center gap-2">
     <Dialog open={sortOpen} onOpenChange={setSortOpen}>
      <DialogTrigger asChild><Button size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label="Sort Routines"><Ellipsis size={22}/></Button></DialogTrigger>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
       <DialogHeader><DialogTitle>Sort Routines</DialogTitle></DialogHeader>
       <div role="group" aria-label="Routine order" className="space-y-3">
        {['Name','Date Created','Days'].map(group => <div key={group} role="group" aria-label={group}>
         <h3 className="mb-1 text-sm font-semibold text-muted-foreground">{group}</h3>
         {routineSortOptions.filter(option => option.group === group).map(option => <Button key={option.value} variant="ghost" aria-pressed={sort === option.value} className="w-full min-h-11 justify-between" onClick={() => selectSort(option.value)}>{option.label}{sort === option.value && <Check size={18} className="text-accent-text"/>}</Button>)}
        </div>)}
       </div>
       <DialogFooter><Button variant="ghost" onClick={() => setSortOpen(false)}>Cancel</Button></DialogFooter>
      </DialogContent>
     </Dialog>
     <Button className="bg-accent-text text-[hsl(var(--on-selected-action))] hover:bg-action-hover hover:text-on-action" onClick={() => openRoutine()} data-testid="button-create-routine"><Plus size={18}/>New</Button></div></div>

   {error && <p role="alert" className="text-feature-red">{error}</p>}
   {!routines.length && <div className="rounded-2xl border border-separator p-6 text-center"><p>No routines yet.</p><Button variant="ghost" data-testid="button-add-routine" onClick={() => openRoutine()}>Create Routine</Button></div>}
   {routines.map(r => {
            const rows = routineExercises(api.workoutData, r);
            const open = expanded.has(r.id);
            return <section key={r.id} className="rounded-2xl border border-separator bg-surface overflow-hidden" data-testid={`routine-card-${r.id}`}>
    <div className="flex gap-1 items-center px-4 py-3"><button data-control-geometry="record" data-testid={`routine-header-${r.id}`} aria-expanded={open} className="min-h-14 min-w-0 flex-1 text-left" onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}><h3 className="font-bold text-lg break-words">{r.name}</h3><p className="text-sm text-muted-foreground">{daysText(r.selectedDays)} · {rows.length} exercises</p></button><Button size="icon" variant="ghost" aria-label={`Edit routine ${r.name}`} data-testid={`button-edit-routine-${r.id}`} onClick={() => openRoutine(r)}><Edit size={18}/></Button><ChevronDown className={`h-4 w-4 ${open ? 'rotate-180' : ''}`}/></div>
    {open && <div className="border-t border-separator p-3 space-y-2">
      <SortableExercises items={rows.map(w => ({ ...w, id: w.placementId! }))} name={w => w.name} onActivate={w => openExercise(r, r.placements!.find(p => p.id === w.id)!)} rowClassName="bg-surface-secondary p-3" testId={w => `routine-exercise-${r.id}-${w.exerciseId}`} onReorder={ordered => { const visible = new Set(ordered.map(w => w.id)); const sorted = ordered.map(w => r.placements!.find(p => p.id === w.id)!)[Symbol.iterator](); const placements = r.placements!.map(p => visible.has(p.id) ? sorted.next().value! : p); if (!api.saveRoutinePlan({ ...r, placements })) setError('Order could not be saved.'); }}>
        {w => <button data-control-geometry="record" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left" onClick={() => openExercise(r, r.placements!.find(p => p.id === w.id)!)}>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getColorClass(w.color)}`}/><span className="min-w-0 flex-1"><strong className="entity-name block">{w.name}</strong><span className="text-sm text-muted-foreground">{prescriptionText(w.prescription)}{w.weightLbs !== undefined ? ` · ${w.weightLbs} lb` : ''}</span></span><ChevronRight size={18} className="shrink-0 text-muted-foreground"/>
        </button>}
      </SortableExercises>
      {!rows.length && <p className="py-4 text-sm text-muted-foreground">No exercises assigned.</p>}
      <ExercisePicker testId={`button-add-workout-${r.id}`} onOpen={() => openCatalog(r)}/>
    </div>}

   </section>;
        })}

  </div>
  <RoutineEditor formId="routine" isOpen={routineOpen} onClose={() => { setRoutineOpen(false); setDraft(null); setEditingRoutine(null); }} draft={draft} onChange={setDraft} exercises={exercises} onExercise={p => { if (draft && p) openExercise(draft,p); }} onCatalog={() => { if (draft) openCatalog(draft); }} onSave={api.saveRoutinePlan} onDelete={editingRoutine ? () => removeRoutine(editingRoutine) : undefined}/>
  <ExerciseCatalog formId="exercise-catalog" open={catalogOpen} onClose={() => setCatalogOpen(false)} exercises={exercises} search={search} category={category} equipment={equipment} onSearch={setSearch} onCategory={setCategory} onEquipment={setEquipment} onSelect={selectExercise} onCustom={createCustom} onEdit={editCustom}/>
  <WorkoutEditor formId="workout" isOpen={exerciseOpen} editingWorkout={editingWorkout} initialWorkout={seed} availableColors={api.getAvailableColors()} onClose={closeExercise} onSave={saveExercise} onDelete={placementId ? removePlacement : !selectedRoutineId ? api.deleteWorkout : undefined} deleteMessage={placementId ? 'Remove this exercise placement from this routine? The reusable definition and historical activity will be kept.' : undefined}/>
  <WorkoutEditor formId="custom-exercise" isOpen={customOpen} editingWorkout={editingWorkout} initialWorkout={seed} availableColors={api.getAvailableColors()} onClose={closeCustom} onSave={saveExercise} onDelete={editingWorkout ? api.hideExerciseTemplate : undefined} deleteMessage={`Remove this custom exercise from the catalog? It is used by ${templateUses} ${templateUses === 1 ? 'routine' : 'routines'}. Saved placements and historical activity will be kept.`}/>
  <Sheet open={menu} onOpenChange={setMenu}><SheetContent side="left" onOpenAutoFocus={focusDashboardOnOpen} onCloseAutoFocus={returnDashboardFocus} className="w-80 bg-canvas border-separator outline-none"><SheetHeader className="sr-only"><SheetTitle>Navigation Menu</SheetTitle></SheetHeader><div className="flex h-full flex-col"><DashboardMenu open={menu} returnTo="/routines" onNavigate={() => setMenu(false)}/><div className="p-4 border-t border-separator"><VersionLabel onActivate={() => setMenu(false)}/></div></div></SheetContent></Sheet>
 </div></FormScreen>;
}
