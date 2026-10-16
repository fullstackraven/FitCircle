import type { Workout, WorkoutData, DailyLog } from '../../client/src/hooks/use-workouts';

// Synthetic only. Goals intentionally differ from rep counts/current goals so a
// successful preservation test cannot accidentally endorse inferred values.
const workout: Workout = { id: 'a', name: 'Synthetic movement', color: 'green', count: 0, dailyGoal: 50 };
const goalHistory = [
  { goal: 20, timestamp: '2025-01-01T09:00:00.000Z' },
  { goal: 50, timestamp: '2026-06-01T09:00:00.000Z' },
];
function history(dailyLogs: WorkoutData['dailyLogs'], updates: Partial<Workout> = {}, journalEntries: WorkoutData['journalEntries'] = {}): WorkoutData {
  return { workouts: { a: { ...workout, ...updates } }, routines: {}, dailyLogs, journalEntries };
}
function days(values: DailyLog[string][]): WorkoutData['dailyLogs'] {
  return Object.fromEntries(values.map((value, i) => [`2026-01-${String(i + 1).padStart(2, '0')}`, { a: value }]));
}
const withMetadata = { count: 7, goalAtTime: 31, sourceNote: 'Synthetic retained metadata' };
export const workoutHistoryFixtures = [
  { name: 'authoritative modern goals with complete history', data: history(days([{ count: 12, goalAtTime: 20 }, { count: 14, goalAtTime: 30 }]), { goalHistory }) },
  { name: 'authoritative modern goals without goal history', data: history(days([{ count: 8, goalAtTime: 20 }])) },
  { name: 'authoritative modern goals with empty goal history', data: history(days([{ count: 8, goalAtTime: 25 }]), { goalHistory: [] }) },
  { name: 'incomplete goal history starts after old logs', data: history(days([{ count: 6, goalAtTime: 17 }]), { goalHistory: [goalHistory[1]] }) },
  { name: 'legacy numeric logs without goal history', data: history(days([5, 8, 0])) },
  { name: 'legacy numeric logs with explicit goal history', data: history(days([5, 8, 0]), { goalHistory }) },
  { name: 'mixed numeric and authoritative modern logs', data: history(days([5, { count: 8, goalAtTime: 20 }, 0, { count: 0, goalAtTime: 37 }])) },
  { name: 'mixed logs still preserve populated goal history', data: history(days([5, { count: 8, goalAtTime: 20 }]), { goalHistory }) },
  { name: 'sparse historical completion counts', data: history({ '2024-02-29': { a: 2 }, '2026-01-01': { a: { count: 3, goalAtTime: 49 } } }) },
  { name: 'zero numeric and zero modern counts', data: history(days([0, { count: 0, goalAtTime: 20 }, { count: 0, goalAtTime: 0 }])) },
  { name: 'tied completion frequencies cannot identify a goal', data: history(days([4, 6, 4, 6, { count: 4, goalAtTime: 29 }])) },
  { name: 'empty history stays empty', data: history({}) },
  { name: 'additional historical entry metadata survives', data: history(days([5, withMetadata])) },
  { name: 'one legacy workout does not migrate another', data: {
    ...history({ '2026-01-01': { a: { count: 8, goalAtTime: 23 }, b: 5, deleted: { count: 2, goalAtTime: 19 } } }),
    workouts: { a: { ...workout, goalHistory }, b: { ...workout, id: 'b', name: 'Other synthetic movement', dailyGoal: 100 } },
  } },
] satisfies { name: string; data: WorkoutData }[];

export const journalHistoryFixtures = [
  { name: 'genuine exact 18:00 timestamp', value: { text: 'Synthetic genuine exact time', timestamp: '2026-01-01T18:00:00.000Z' } },
  { name: 'genuine fractional 18:00 timestamp', value: { text: 'Synthetic fractional time', timestamp: '2026-01-01T18:00:00.123Z' } },
  { name: 'genuine high precision timestamp', value: { text: 'Synthetic precise time', timestamp: '2026-01-01T18:00:00.123456Z' } },
  { name: 'genuine timestamp with timezone offset', value: { text: 'Synthetic local time', timestamp: '2026-01-01T18:00:00.500-04:00' } },
  { name: 'non-18:00 timestamp', value: { text: 'Synthetic morning', timestamp: '2026-01-01T08:15:32.001Z' } },
  { name: 'legacy string entry', value: 'Synthetic untimed journal' },
  { name: 'legacy empty string entry', value: '' },
  // This fixture's provenance is known to the test author, not encoded in the
  // stored format. Runtime code cannot distinguish it from a genuine exact time.
  { name: 'old estimated timestamp without provenance', value: { text: 'Synthetic old estimate', timestamp: '2026-01-01T18:00:00.000Z' } },
  { name: 'missing time represented by empty stored timestamp', value: { text: 'Synthetic unknown time', timestamp: '' } },
] satisfies { name: string; value: WorkoutData['journalEntries'][string] }[];

export const historicalIntegrityFixtures: { name: string; data: WorkoutData }[] = [
  ...workoutHistoryFixtures,
  ...journalHistoryFixtures.map(({ name, value }) => ({ name, data: history({}, {}, { '2026-01-01': value }) })),
  { name: 'mixed workouts and journals in the same document', data: history(
    days([5, { count: 8, goalAtTime: 20 }]), {},
    Object.fromEntries(journalHistoryFixtures.map(({ value }, i) => [`2026-02-${String(i + 1).padStart(2, '0')}`, value])),
  ) },
];
