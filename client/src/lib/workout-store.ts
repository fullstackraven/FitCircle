import { useSyncExternalStore } from 'react';
import type { WorkoutData } from '@/hooks/use-workouts';
import { parseStoredWorkouts, StoredWorkoutDataError } from './workout-initialization';
import { getTodayString } from './date-utils';
import { STORAGE_KEYS } from './storage-utils';
let snapshot: WorkoutData | undefined;
let storageOwner: Storage | undefined;
let rawSnapshot: string | null | undefined;
const listeners = new Set<() => void>();
function read() {
  let raw: string | null;
  try { raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS); }
  catch { throw new StoredWorkoutDataError(null, 'unavailable'); }
  if (!snapshot || storageOwner !== localStorage || raw !== rawSnapshot) {
    snapshot = parseStoredWorkouts(raw, getTodayString());
    storageOwner = localStorage; rawSnapshot = raw;
  }
  return snapshot;
}
export function commitWorkouts(update: (previous: WorkoutData) => WorkoutData): boolean {
  try {
    const previous = read();
    const next = update(previous);
    if (next === previous) return false;
    const raw = JSON.stringify(next);
    if (raw !== rawSnapshot) localStorage.setItem(STORAGE_KEYS.WORKOUTS, raw);
    snapshot = next; rawSnapshot = raw;
    listeners.forEach(listener => listener());
    return true;
  } catch { return false; }
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEYS.WORKOUTS || event.key === null) listener(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
};
export const useWorkoutStore = () => useSyncExternalStore(subscribe, read, read);
