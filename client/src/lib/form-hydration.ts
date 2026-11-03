import { entryId, meditationDays } from './wellness-records';
import { localDay } from './wellness-progress';
import { loadStoredCardio } from './cardio-initialization';
import { parseStoredWorkouts } from './workout-initialization';
import { appPath, type FormDefinition } from './form-routes';
import { getTodayString, getDateString, parseLocalDate } from './date-utils';
import { readWellnessGoals } from './wellness-storage';
import { readFoodDay } from './food-diary';
import { localFoodService } from './local-food-service';
import { readFitnessProfile } from './fitness-profile';
function read(raw: string | null, fallback: any) { return raw === null ? fallback : JSON.parse(raw); }
function find(items: any[], id: string | null) { const result = items.find(item => item?.id === id); if (!result)
    throw Error('The requested record no longer exists.'); return result; }
export async function hydrateForm(def: FormDefinition, draft: Record<string, any>) {
    const params = new URLSearchParams(location.search), id = params.get('id'), date = params.get('date') ?? getTodayString();
    const state: Record<string, any> = { ...draft };
    const goals = readWellnessGoals();
    if (def.id === 'duration') {
        const date = appPath().split('/')[2];
        if (!date || getDateString(parseLocalDate(date)) !== date)
            throw Error('Invalid workout date.');
        const sessions = read(localStorage.getItem('fitcircle_workout_duration_data'), { completedSessions: [] }).completedSessions;
        const duration = sessions.filter((session: any) => session.date === date).reduce((total: number, session: any) => total + (session.duration || 0), 0);
        state.editHours ??= String(Math.floor(duration / 3600));
        state.editMinutes ??= String(Math.floor(duration % 3600 / 60));
        state.editSeconds ??= String(duration % 60);
    }
    if (def.owner === 'food-tracker') {
        if (getDateString(parseLocalDate(date)) !== date)
            throw Error('Invalid food diary date.');
        const meal = params.get('meal') ?? state.searchMeal;
        state.selectedDate = date;
        state.searchMeal = ['breakfast', 'lunch', 'dinner', 'snack'].includes(meal) ? meal : 'breakfast';
        state.customFoodMeal ??= state.searchMeal;
    }
    if (def.id === 'cardio-goal')
        state.goalInput ??= String(loadStoredCardio(localStorage, getTodayString()).data.goal.target);
    if (def.id === 'meditation-goal')
        state.goalMinutesInput ??= String(goals.meditationMinutes);
    if (def.id === 'hydration-goal')
        state.newGoal ??= String(goals.hydrationOz);
    if (def.id === 'fasting-goal') {
        state.goalHoursInput ??= String(goals.fastingHours);
        state.maxHoursInput ??= String(read(localStorage.getItem('fitcircle_goals'), {}).maxFastingHours ?? 24);
    }
    if (def.group === 'workout' || def.group === 'routine') {
        const data = parseStoredWorkouts(localStorage.getItem('workout-tracker-data'), getTodayString());
        if (def.id.endsWith('-edit')) {
            const collection = def.group === 'workout' ? data.workouts : data.routines;
            const record = find(Array.isArray(collection) ? collection : Object.values(collection ?? {}), id);
            state[def.group === 'workout' ? 'editingWorkout' : 'editingRoutine'] = record;
        }
        else {
            state[def.group === 'workout' ? 'editingWorkout' : 'editingRoutine'] = null;
        }
        const routine = params.get('routine');
        if (routine) {
            const r = find(Object.values(data.routines ?? {}), routine);
            state.selectedRoutineId = r.id;
            state.preSelectedDays = r.selectedDays;
        }
    }
    if (def.id === 'cardio-edit') {
        const data = loadStoredCardio(localStorage, getTodayString()).data, sessions = Object.values(data.dailyLogs ?? {}).flatMap((day: any) => day.sessions ?? []);
        const record = find(sessions, id);
        state.editingEntry = record;
        state.newEntry ??= { ...record, duration: String(record.duration ?? ''), distance: String(record.distance ?? ''), notes: record.notes ?? '' };
    }
    if (def.id === 'hydration-edit') {
        const data = read(localStorage.getItem('fitcircle_hydration_data'), {}), records = Object.entries(data.logs ?? {}).flatMap(([date, day]: [
            string,
            any
        ]) => (day.entries ?? []).map((entry: any, index: number) => ({ ...entry, id: entryId(date, entry, index), liquidType: entry.liquidType ?? 'Water' })));
        const record = find(records, id);
        state.editingEntry = record;
        state.editAmount ??= String(record.amount);
        state.editLiquidType ??= record.liquidType;
    }
    if (def.id === 'meditation-edit') {
        const days = meditationDays(read(localStorage.getItem('fitcircle_meditation_logs'), []));
        const record = find(Object.entries(days).flatMap(([date, day]: [
            string,
            any
        ]) => (day.sessions ?? []).map((entry: any, index: number) => ({ ...entry, id: entryId(date, entry, index), date }))), id);
        state.editingSession = { date: localDay(record.date) ?? record.date, id: record.id, duration: state.editingSession?.duration ?? String(record.duration) };
    }
    if (def.id === 'fasting-edit') {
        const record = find(read(localStorage.getItem('fitcircle_fasting_logs'), []), id);
        state.editingLog = record;
        for (const field of ['startDate', 'startTime', 'endDate', 'endTime'])
            state[field] ??= record[field];
    }
    if (def.id === 'profile-edit' || def.id === 'profile-goals') {
        const profile = readFitnessProfile();
        if (profile.error)
            throw Error(profile.error);
        state.editor = def.id === 'profile-edit' ? 'profile' : 'goals';
        state.name ??= profile.name;
        state.dob ??= profile.dateOfBirth;
        state.objective ??= profile.objective;
        state.goal ??= profile.goal;
    }
    if (['food-database-edit', 'food-custom-edit', 'food-entry'].includes(def.id)) {
        await localFoodService.ready;
        const foods = await localFoodService.getAllFoods();
        let record = foods.find(food => food.id === id);
        if (def.id === 'food-entry' && !record) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)!;
                if (!/^fitcircle_food_\d{4}-\d{2}-\d{2}$/.test(key))
                    continue;
                try {
                    const entry = readFoodDay(key.slice(15)).entries.find(e => e.id === id || `search-${e.id}` === id);
                    if (entry) {
                        record = entry;
                        break;
                    }
                }
                catch { /* Invalid diary days remain untouched. */ }
            }
            record ??= state.addingFood;
        }
        if (def.id === 'food-entry' && state.scannedDraft) { /* Unsaved scanner draft survives refresh in history state. */ }
        else if (!record)
            throw Error('This food is unavailable. Open Add Food and choose a food again.');
        if (def.id === 'food-entry') {
            state.addingFood = record;
            state.addEntryMeal ??= state.searchMeal;
        }
        else if (def.id === 'food-database-edit')
            state.editingFood = record;
        else {
            state.editingEntryId = record!.id;
            state.customFoodData ??= { ...record, brand: record!.brand ?? '', ...Object.fromEntries(['quantity', 'calories', 'carbs', 'protein', 'fat', 'fiber', 'sugar', 'sodium', 'saturatedFat', 'potassium', 'cholesterol', 'vitaminA', 'vitaminC', 'calcium', 'iron'].map(key => [key, (record as any)[key]?.toString() ?? ''])) };
        }
    }
    if (def.id === 'food-entry-edit') {
        const record = find(readFoodDay(date).entries, id);
        state.editingEntry = record;
        state.editEntryServings ??= String(record.servings ?? 1);
        state.editEntryMeal ??= record.meal;
    }
    return state;
}
