import type { Routine } from '@/hooks/use-workouts';

export const ROUTINE_SORT_KEY = 'fitcircle_routine_sort';
export const routineSortOptions = [
  { value: 'name-asc', group: 'Name', label: 'A–Z' },
  { value: 'name-desc', group: 'Name', label: 'Z–A' },
  { value: 'created-desc', group: 'Date Created', label: 'Newest First' },
  { value: 'created-asc', group: 'Date Created', label: 'Oldest First' },
  { value: 'days-asc', group: 'Days', label: 'Sunday → Saturday' },
  { value: 'days-desc', group: 'Days', label: 'Saturday → Sunday' },
] as const;
export type RoutineSort = typeof routineSortOptions[number]['value'];
export const defaultRoutineSort: RoutineSort = 'created-asc';
export const isRoutineSort = (value: unknown): value is RoutineSort => routineSortOptions.some(option => option.value === value);
export function readRoutineSort(storage: Pick<Storage, 'getItem'>): RoutineSort {
  try { const value = storage.getItem(ROUTINE_SORT_KEY); return isRoutineSort(value) ? value : defaultRoutineSort; }
  catch { return defaultRoutineSort; }
}
const compareText = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
function firstDay(routine: Routine, descending: boolean): number | undefined {
  const days = (routine.selectedDays ?? []).filter(day => Number.isInteger(day) && day >= 0 && day <= 6);
  return days.length ? (descending ? Math.max(...days) : Math.min(...days)) : undefined;
}
/** Sort a copy only. Missing legacy dates/days stay last in either direction. */
export function sortRoutines(routines: Routine[], sort: RoutineSort): Routine[] {
  const descending = sort.endsWith('desc');
  const direction = descending ? -1 : 1;
  return [...routines].sort((a, b) => {
    const byName = compareText(a.name, b.name);
    if (sort.startsWith('name')) return byName * direction || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const value = (r: Routine) => sort.startsWith('days') ? firstDay(r, descending) : Number.isFinite(Date.parse(r.createdAt)) ? Date.parse(r.createdAt) : undefined;
    const av = value(a), bv = value(b);
    const primary = av === undefined ? (bv === undefined ? 0 : 1) : bv === undefined ? -1 : (av - bv) * direction;
    return primary || byName || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}
