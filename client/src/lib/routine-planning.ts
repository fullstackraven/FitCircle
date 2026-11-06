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
    legacyLogId?: string; // Stable identity retained for the canonical pre-routine log.
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
    const routines: Record<string, Routine> = Object.fromEntries(Object.entries(data.routines).map(([id, r]) => {
        if (r.placements)
            return [id, r];
        changed = true;
        const exercises = Object.values(data.workouts).filter(w => !w.archived && (!w.scheduledDays?.length || r.selectedDays.some(d => w.scheduledDays!.includes(d)))).sort((a, b) => a.id.localeCompare(b.id));
        return [id, { ...r, placements: exercises.map(w => ({ id: `legacy:${id}:${w.id}`, exerciseId: w.id, prescription: prescriptionFor(w), ...(w.weightLbs !== undefined ? { weightLbs: w.weightLbs } : {}), ...(w.restSeconds !== undefined ? { restSeconds: w.restSeconds } : {}) })) }];
    }));
    if (data.routineSchedulingVersion === 1) return changed ? { ...data, routines } : data;
    // Import formerly standalone schedules once into ordinary explicit routines.
    // The version prevents removed placements/routines from reappearing on later reads.
    const assigned = new Set(Object.values(routines).flatMap(r => (r.placements ?? []).map(p => p.exerciseId)));
    const groups = new Map<string, Workout[]>();
    for (const w of Object.values(data.workouts).filter(w => !w.archived && !assigned.has(w.id)).sort((a,b) => a.id.localeCompare(b.id))) {
        const days = [...new Set(w.scheduledDays?.length ? w.scheduledDays : [0,1,2,3,4,5,6])].sort();
        const key = days.join(','); groups.set(key, [...groups.get(key) ?? [], w]);
    }
    for (const [key, exercises] of groups) {
        let id = `legacy-schedule:${key}`;
        while (routines[id]) id += ':imported';
        routines[id] = { id, name: 'Imported workouts', selectedDays: key.split(',').map(Number), createdAt: '1970-01-01T00:00:00.000Z',
            placements: exercises.map(w => ({ id: `legacy:unassigned:${w.id}`, exerciseId: w.id, prescription: prescriptionFor(w), ...(w.weightLbs !== undefined ? {weightLbs:w.weightLbs} : {}), ...(w.restSeconds !== undefined ? {restSeconds:w.restSeconds} : {}) })) };
    }
    const legacyUsed = new Set<string>();
    for (const r of orderedRoutines({ ...data, routines })) {
        routines[r.id] = { ...r, placements: (r.placements ?? []).map(p => {
            const legacyLogId = legacyUsed.has(p.exerciseId) ? undefined : p.exerciseId;
            legacyUsed.add(p.exerciseId);
            return { ...p, ...(legacyLogId ? { legacyLogId } : {}) };
        }) };
    }
    return { ...data, routines, routineSchedulingVersion: 1 };

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
/** The identity belongs to the placement, never to the reusable definition. */
export const placementLogId = (routineId: string, placementId: string) => `placement:${JSON.stringify([routineId, placementId])}`;
export function plannedExercises(data: WorkoutData, day: number): Workout[] {
    const results: Workout[] = [];
    for (const r of orderedRoutines(data).filter(r => r.selectedDays.includes(day))) {
        for (const w of routineExercises(data, r)) {
            results.push({ ...w, id: w.legacyLogId ?? placementLogId(r.id, w.placementId), exerciseId: w.exerciseId,
                routineId: r.id, placementId: w.placementId, routineNames: [r.name] });
        }
    }
    return results;
}
export const recordedType = (entry: number | WorkoutLogEntry | undefined) => typeof entry === 'object' ? entry.targetTypeAtTime ?? 'repetitions' : 'repetitions';
export const recordedReps = (entry: number | WorkoutLogEntry | undefined) => recordedType(entry) === 'duration' ? 0 : typeof entry === 'object' ? entry.count : entry ?? 0;
export const recordedSeconds = (entry: number | WorkoutLogEntry | undefined) => recordedType(entry) === 'duration' && typeof entry === 'object' ? entry.count : 0;
export function historicalDefinitions(data: WorkoutData): Workout[] {
    return Object.values({...data.archivedWorkouts,...data.workouts});
}


/** Resolve each stored logging identity using its own dated snapshot, including deleted placements. */
export function loggedExercises(data: WorkoutData, date: string): Workout[] {
    return Object.entries(data.dailyLogs[date] ?? {}).flatMap(([id, entry]) => {
        const snapshot = typeof entry === 'object' ? entry : undefined;
        const exerciseId = snapshot?.exerciseIdAtTime ?? id;
        const definition = data.workouts[exerciseId] ?? data.archivedWorkouts?.[exerciseId];
        // A missing definition and a numeric log cannot establish a historical goal.
        if (!definition && !snapshot) return [];
        return [{ ...definition, id, exerciseId, name: snapshot?.nameAtTime ?? definition?.name ?? 'Recorded exercise',
            color: snapshot?.colorAtTime ?? definition?.color ?? 'green', count: typeof entry === 'object' ? entry.count : entry,
            dailyGoal: snapshot?.goalAtTime ?? definition?.dailyGoal ?? 1,
            routineNames: snapshot?.routineNamesAtTime, routineId: snapshot?.routineIdAtTime,
            placementId: snapshot?.placementIdAtTime }];
    });
}
export function historicalActivities(data: WorkoutData): Workout[] {
    const results = new Map(historicalDefinitions(data).map(w => [w.id, w]));
    for (const date of Object.keys(data.dailyLogs)) for (const w of loggedExercises(data, date)) results.set(w.id, w);
    return [...results.values()];
}

/** Scheduling changes and archival must not hide activity already recorded today. */
export function plannedWithActivity(data: WorkoutData, day: number, date: string): Workout[] {
    const recorded = loggedExercises(data, date);
    const planned = plannedExercises(data, day).map(w => {
        const entry = data.dailyLogs[date]?.[w.id];
        // Numeric legacy activity has no placement target snapshot. Retain its
        // definition goal rather than reinterpreting it as a new routine target.
        return typeof entry === 'number' && entry > 0 ? { ...w, dailyGoal: recorded.find(item => item.id === w.id)?.dailyGoal ?? w.dailyGoal } : w;
    });
    const seen = new Set(planned.map(w => w.id));
    return [...planned, ...recorded.filter(w => !seen.has(w.id) && w.count > 0)];
}
