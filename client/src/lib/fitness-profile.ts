import { applyRestore, prepareRestore } from './backup';
import { parseStoredWorkouts } from './workout-initialization';
import { getTotalWorkoutStats } from './workout-statistics';
import { getTodayString } from './date-utils';

export const primaryObjectives = ['Build strength', 'Build muscle', 'Improve cardiovascular endurance', 'Manage body weight', 'Improve general health and consistency'] as const;
const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export function ageFromDateOfBirth(value: unknown, today = new Date()): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0); date.setFullYear(year, month - 1, day); date.setHours(0, 0, 0, 0);
  if (year < 1 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  const age = today.getFullYear() - year - (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day) ? 1 : 0);
  return date > today || age < 0 ? null : age;
}
const legacyAge = (value: unknown): number | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') return null;
  const age = Number(value);
  return Number.isFinite(age) && age > 0 ? age : null;
};
export function readFitnessProfile(storage: Storage = localStorage, today = new Date()) {
  try {
    const name = storage.getItem('fitcircle_username') ?? '';
    const goal = storage.getItem('fitcircle_fitness_goal') ?? '';
    const oldAge = storage.getItem('fitcircle_age') ?? '';
    const raw = storage.getItem('fitcircle_profile');
    const record: unknown = raw === null ? {} : JSON.parse(raw);
    if (!plain(record)) throw new Error('Invalid profile');
    const dobAge = ageFromDateOfBirth(record.dateOfBirth, today);
    return { name, goal, oldAge, record, dateOfBirth: dobAge !== null ? String(record.dateOfBirth) : '',
      objective: typeof record.primaryObjective === 'string' ? record.primaryObjective : '',
      age: dobAge ?? legacyAge(record.age) ?? legacyAge(oldAge),
      ageSource: dobAge !== null ? 'date of birth' : legacyAge(record.age) !== null ? 'calculator profile' : legacyAge(oldAge) !== null ? 'saved age' : null,
      error: null as string | null };
  } catch {
    return { name: '', goal: '', oldAge: '', record: {} as Record<string, unknown>, dateOfBirth: '', objective: '', age: null, ageSource: null,
      error: 'Saved profile data could not be read safely. No records were changed. Keep your existing backup and restore a verified backup in Settings before editing.' };
  }
}
export type ProfilePatch = { name?: string; goal?: string; dateOfBirth?: string; objective?: string };
export function saveFitnessProfile(patch: ProfilePatch, storage: Storage = localStorage, today = new Date()) {
  const current = readFitnessProfile(storage, today);
  if (current.error) throw new Error(current.error);
  const entries: Record<string, unknown> = {};
  if (patch.name !== undefined) entries.fitcircle_username = patch.name;
  if (patch.goal !== undefined) entries.fitcircle_fitness_goal = patch.goal;
  const record = { ...current.record };
  if (patch.dateOfBirth !== undefined) {
    if (patch.dateOfBirth !== '' && ageFromDateOfBirth(patch.dateOfBirth, today) === null) throw new Error('Choose a valid date of birth that is not in the future.');
    record.dateOfBirth = patch.dateOfBirth;
  }
  if (patch.objective !== undefined) {
    if (patch.objective !== '' && !primaryObjectives.includes(patch.objective as typeof primaryObjectives[number])) throw new Error('Choose a listed primary objective.');
    record.primaryObjective = patch.objective;
  }
  if (patch.dateOfBirth !== undefined || patch.objective !== undefined) entries.fitcircle_profile = record;
  // Existing journaled backup boundary makes explicit multi-key edits atomic.
  if (Object.keys(entries).length) applyRestore(prepareRestore(entries), storage, storage);
}
export function readTrainingOverview(storage: Storage = localStorage) {
  try {
    const data = parseStoredWorkouts(storage.getItem('workout-tracker-data'), getTodayString());
    return getTotalWorkoutStats(data, () => storage.getItem('fitcircle_recovery_data'));
  } catch { return null; }
}
export function readMeasurementPreview(storage: Storage = localStorage) {
  try {
    const raw = storage.getItem('fitcircle_measurements_history');
    if (raw === null) return '';
    const history: unknown = JSON.parse(raw);
    if (!plain(history)) return '';
    const values: string[] = [];
    for (const [field, unit] of [['weight','lb'],['height','in']] as const) {
      const entries = history[field];
      if (!Array.isArray(entries) || !entries.length || !entries.every(entry => plain(entry) && typeof entry.date === 'string' && ageFromDateOfBirth(entry.date, new Date(9999, 11, 31)) !== null && typeof entry.value === 'number' && Number.isFinite(entry.value) && entry.value > 0)) continue;
      const latest = [...entries].sort((a,b) => b.date.localeCompare(a.date))[0];
      values.push(`${latest.value} ${unit}`);
    }
    return values.join(' · ');
  } catch { return ''; }
}
