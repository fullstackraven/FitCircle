/** Transient navigation context lives in browser history, never fitness storage. */
export const formDefinitions = [
    ['workout-new', 'home', '/workouts/new', 'workout', 'Add Exercise'],
    ['workout-edit', 'home', '/workouts/edit', 'workout', 'Edit Exercise'],
    ['exercise-catalog', 'routines', '/routines/exercises/add', 'exercise-catalog', 'Add Exercise'],
    ['custom-exercise-new', 'routines', '/routines/exercises/custom/new', 'custom-exercise', 'Create Custom Exercise'],
    ['custom-exercise-edit', 'routines', '/routines/exercises/custom/edit', 'custom-exercise', 'Edit Custom Exercise'],
    ['routine-workout-new', 'routines', '/routines/workouts/new', 'workout', 'Add Exercise'],
    ['routine-workout-edit', 'routines', '/routines/workouts/edit', 'workout', 'Edit Exercise'],
    ['routine-new', 'routines', '/routines/new', 'routine', 'Create Routine'],
    ['routine-edit', 'routines', '/routines/edit', 'routine', 'Edit Routine'],
    ['duration', 'overview', '/duration', 'duration', 'Edit Workout Duration'],
    ['cardio-goal', 'cardio', '/cardio/goal', 'cardio-goal', 'Cardio Goal'],
    ['cardio-new', 'cardio', '/cardio/add', 'cardio-add', 'Add Cardio'],
    ['cardio-edit', 'cardio', '/cardio/edit', 'cardio-edit', 'Edit Cardio'],
    ['cardio-type', 'cardio', '/cardio/types/new', 'cardio-type', 'Add Custom Cardio Type'],
    ['meditation-goal', 'meditation', '/meditation/goal', 'meditation-goal', 'Meditation Goal'],
    ['meditation-edit', 'meditation', '/meditation/edit', 'meditation-edit', 'Edit Meditation'],
    ['hydration-goal', 'hydration', '/hydration/goal', 'hydration-goal', 'Hydration Goal'],
    ['hydration-add', 'hydration', '/hydration/add', 'hydration-add', 'Add Hydration'],
    ['hydration-edit', 'hydration', '/hydration/edit', 'hydration-edit', 'Edit Hydration'],
    ['fasting-goal', 'fasting', '/fasting/goal', 'fasting-goal', 'Intermittent Fasting Goal'],
    ['fasting-add', 'fasting', '/fasting/add', 'fasting-entry', 'Add Fast'],
    ['fasting-edit', 'fasting', '/fasting/edit', 'fasting-entry', 'Edit Fast'],
    ['food-add', 'food-tracker', '/food-tracker/add', 'food-search', 'Add Food'],
    ['food-scan', 'food-tracker', '/food-tracker/scan', 'food-scan', 'Scan Barcode'],
    ['food-custom', 'food-tracker', '/food-tracker/custom/new', 'food-custom', 'Create Custom Food'],
    ['food-custom-edit', 'food-tracker', '/food-tracker/custom/edit', 'food-custom', 'Edit Custom Food'],
    ['food-entry', 'food-tracker', '/food-tracker/entry/new', 'food-entry', 'Add Food Entry'],
    ['food-entry-edit', 'food-tracker', '/food-tracker/entry/edit', 'food-edit', 'Edit Food Entry'],
    ['food-database-edit', 'food-database', '/food-database/edit', 'database-edit', 'Edit Food'],
    ['supplement-add', 'supplements-page', '/supplements-page/new', 'supplement', 'Add Supplement'],
    ['profile-edit', 'profile', '/profile/edit', 'profile-edit', 'Edit Profile'],
    ['profile-goals', 'profile', '/profile/goals', 'profile-edit', 'Fitness Goals'],
] as const;
export type FormDefinition = {
    id: string;
    owner: string;
    path: string;
    group: string;
    title: string;
};
export const definitions: FormDefinition[] = formDefinitions.map(([id, owner, path, group, title]) => ({ id, owner, path, group, title }));
export function appPath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return window.location.pathname.slice(base.length) || '/'; }
export function formForPath(path = appPath()) {
    if (/^\/dynamic-overview\/[^/]+\/(duration)$/.test(path))
        return definitions.find(d => d.owner === 'overview' && path.endsWith(d.path));
    return definitions.find(d => d.path === path);
}
export function ownerPath(owner: string) { return owner === 'home' ? '/' : owner === 'overview' ? appPath().split('/').slice(0, 3).join('/') : `/${owner}`; }
export function baseUrl(path: string) { return import.meta.env.BASE_URL.replace(/\/$/, '') + path; }
export const FORM_EXIT = 'fitcircle-form-exit';
export function allowFormExit() { window.dispatchEvent(new Event(FORM_EXIT)); }
