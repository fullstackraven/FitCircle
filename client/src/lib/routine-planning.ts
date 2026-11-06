import type { Workout, WorkoutData, Routine, WorkoutLogEntry } from '@/hooks/use-workouts';
export interface Prescription {
    targetType: 'repetitions' | 'duration';
    sets: number;
    perSet: number;
    legacyTotal?: number;
}
export interface ExerciseDetails {
    prescription?: Prescription;
    equipment?: string;
    restSeconds?: number;
    notes?: string;
}
export interface ExercisePlacement {
    id: string;
    exerciseId: string;
    prescription: Prescription;
    weightLbs?: number;
    restSeconds?: number;
}
export interface TrainingVariation {
    id: string;
    name: string;
    targets: Record<string, Prescription & {
        restSeconds?: number;
    }>;
}
export const newPlanningId = () => crypto.randomUUID();
export const totalTarget = (p: Prescription) => p.legacyTotal ?? p.sets * p.perSet;
export function prescriptionFor(w: Workout): Prescription {
    if (w.prescription)
        return w.prescription;
    const sets = w.setsGoal ?? 1;
    return { targetType: 'repetitions', sets, perSet: Math.floor(w.dailyGoal / sets), ...(w.dailyGoal % sets ? { legacyTotal: w.dailyGoal } : {}) };
}
export function validPrescription(p: Prescription) {
    return ['repetitions', 'duration'].includes(p.targetType) && Number.isInteger(p.sets) && p.sets > 0 && p.sets <= 999 && Number.isInteger(p.perSet) && p.perSet > 0 && Number.isInteger(totalTarget(p)) && totalTarget(p) >= p.sets && totalTarget(p) <= (p.targetType === 'duration' ? 86400 : 9999);
}
export function prescriptionText(p: Prescription) {
    const unit = p.targetType === 'duration' ? 'sec' : 'reps';
    return p.legacyTotal ? `${p.sets} sets · ${p.legacyTotal} ${unit} total (legacy split)` : `${p.sets} × ${p.perSet} ${unit}`;
}
export const orderedRoutines = (data: WorkoutData) => Object.values(data.routines).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
/** Pure, idempotent conversion. Legacy definitions/logs are never rewritten. */
export function migrateRoutinePlanning(data: WorkoutData): WorkoutData {
    let changed = false;
    if (Array.isArray(data.workouts)) {
        if (new Set(data.workouts.map(w => w.id)).size !== data.workouts.length)
            throw Error('Duplicate legacy exercise IDs');
        data = { ...data, workouts: Object.fromEntries(data.workouts.map(w => [w.id, w])) };
        changed = true;
    }
    const routines = Object.fromEntries(Object.entries(data.routines).map(([id, r]) => {
        if (r.placements)
            return [id, r];
        changed = true;
        const exercises = Object.values(data.workouts).filter(w => !w.archived && (!w.scheduledDays?.length || r.selectedDays.some(d => w.scheduledDays!.includes(d)))).sort((a, b) => a.id.localeCompare(b.id));
        return [id, { ...r, placements: exercises.map(w => ({ id: `legacy:${id}:${w.id}`, exerciseId: w.id, prescription: prescriptionFor(w), ...(w.weightLbs !== undefined ? { weightLbs: w.weightLbs } : {}), ...(w.restSeconds !== undefined ? { restSeconds: w.restSeconds } : {}) })) }];
    }));
    return changed ? { ...data, routines } : data;
}
export function routineExercises(data: WorkoutData, routine: Routine) {
    const variation = routine.variations?.find(v => v.id === routine.activeVariationId);
    return (routine.placements ?? []).flatMap(p => {
        const w = data.workouts[p.exerciseId];
        if (!w || w.archived)
            return [];
        const target = variation?.targets[p.id] ?? p.prescription;
        return [{ ...w, ...p, id: w.id, placementId: p.id, prescription: target, dailyGoal: totalTarget(target), setsGoal: target.sets, restSeconds: variation?.targets[p.id]?.restSeconds ?? p.restSeconds ?? w.restSeconds }];
    });
}
/** One daily identity per definition; first scheduled routine wins. */
export function plannedExercises(data: WorkoutData, day: number): (Workout & {
    routineNames?: string[];
})[] {
    const results = new Map<string, Workout & {
        routineNames?: string[];
    }>();
    const assigned = new Set(Object.values(data.routines).flatMap(r => (r.placements ?? []).map(p => p.exerciseId)));
    for (const r of orderedRoutines(data).filter(r => r.selectedDays.includes(day)))
        for (const w of routineExercises(data, r)) {
            const existing = results.get(w.id);
            if (existing)
                existing.routineNames!.push(r.name);
            else
                results.set(w.id, { ...w, routineNames: [r.name] });
        }
    for (const w of Object.values(data.workouts))
        if (!w.archived && !assigned.has(w.id) && (!w.scheduledDays?.length || w.scheduledDays.includes(day)))
            results.set(w.id, w);
    return [...results.values()];
}
export const recordedType = (entry: number | WorkoutLogEntry | undefined) => typeof entry === 'object' ? entry.targetTypeAtTime ?? 'repetitions' : 'repetitions';
export const recordedReps = (entry: number | WorkoutLogEntry | undefined) => recordedType(entry) === 'duration' ? 0 : typeof entry === 'object' ? entry.count : entry ?? 0;
export const recordedSeconds = (entry: number | WorkoutLogEntry | undefined) => recordedType(entry) === 'duration' && typeof entry === 'object' ? entry.count : 0;
export function historicalDefinitions(data: WorkoutData): Workout[] {
    return Object.values({...data.archivedWorkouts,...data.workouts});
}


/** Scheduling changes and archival must not hide activity already recorded today. */
export function plannedWithActivity(data: WorkoutData, day: number, date: string): Workout[] {
    const planned = plannedExercises(data, day);
    const seen = new Set(planned.map(w => w.id));
    return [...planned, ...historicalDefinitions(data).filter(w => {
        const entry = data.dailyLogs[date]?.[w.id];
        const count = typeof entry === 'object' ? entry.count : entry ?? 0;
        return !seen.has(w.id) && count > 0;
    })];
}
