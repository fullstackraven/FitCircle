import { workoutDataSchema } from './backup';
import type { WorkoutData } from '@/hooks/use-workouts';

export class StoredWorkoutDataError extends Error {
  readonly #raw: string | null;
  constructor(raw: string | null, readonly reason: 'invalid' | 'unavailable') {
    super('Saved workouts could not be loaded safely');
    this.name = 'StoredWorkoutDataError';
    this.#raw = raw;
  }
  // Keep record contents out of the error message and enumerable error fields.
  get raw() { return this.#raw; }
}
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export function parseStoredWorkouts(raw: string | null, today: string): WorkoutData {
  if (raw === null) return { workouts: {}, dailyLogs: {}, journalEntries: {}, routines: {}, lastDate: today };
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new StoredWorkoutDataError(raw, 'invalid'); }
  // Backup validation accepts partial legacy exports; runtime readers additionally
  // need these containers. Missing data is not proof that an empty store is safe.
  if (!workoutDataSchema.safeParse(value).success || !record(value)
      || !record(value.dailyLogs) || !record(value.journalEntries) || !record(value.routines)
      || (value.lastDate !== undefined && typeof value.lastDate !== 'string')) {
    throw new StoredWorkoutDataError(raw, 'invalid');
  }
  // Validate, never normalize: retain numeric logs, strings, timestamps, arrays
  // accepted by legacy backup validation, and unknown metadata exactly as saved.
  return value as unknown as WorkoutData;
}
