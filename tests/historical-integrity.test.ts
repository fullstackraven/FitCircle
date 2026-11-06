import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { IDBFactory } from 'fake-indexeddb';
import { useWorkouts, type WorkoutData } from '../client/src/hooks/use-workouts';
import { createBackup, prepareRestore, applyRestore } from '../client/src/lib/backup';
import { historicalIntegrityFixtures } from './fixtures/historical-integrity';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  writes: string[] = [];
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.writes.push(key); this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

function readThroughHook(storage: Storage) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  let snapshot: unknown;
  function Probe() {
    const api = useWorkouts();
    snapshot = { workouts: api.workouts, routines: api.routines,
      dailyLogs: api.getDailyLogs(), journalEntries: api.getAllJournalEntries() };
    // Exercise both supported log representations and journal accessors.
    for (const [date, day] of Object.entries(api.getDailyLogs())) {
      for (const item of api.getWorkoutLogsForDate(date)) {
        const original = day[item.id];
        assert.equal(item.count, typeof original === 'number' ? original : original?.count ?? 0);
      }
    }
    for (const date of Object.keys(api.getAllJournalEntries())) {
      const original = api.getAllJournalEntries()[date];
      assert.equal(api.getJournalEntry(date), typeof original === 'string' ? original : original.text);
      assert.deepEqual(api.getJournalEntryWithTimestamp(date), !original ? null
        : typeof original === 'string' ? { text: original, timestamp: null } : original);
    }
    return null;
  }
  try { renderToString(createElement(Probe)); return snapshot; }
  finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}

// These legacy fixtures have no routines or exercise weekday restrictions.
// Scheduling may be projected into a routine; definitions, history, journals and
// the stored/exported bytes must still be preserved exactly.
function assertPreservedHistory(snapshot: unknown, original: WorkoutData) {
  const actual = snapshot as Pick<WorkoutData, 'workouts' | 'routines' | 'dailyLogs' | 'journalEntries'>;
  assert.deepEqual(actual.workouts, original.workouts);
  assert.deepEqual(actual.dailyLogs, original.dailyLogs);
  assert.deepEqual(actual.journalEntries, original.journalEntries);
  assert.deepEqual(original.routines, {});
  const definitions = Object.values(original.workouts).sort((a, b) => a.id.localeCompare(b.id));
  assert.ok(definitions.every(w => !w.scheduledDays?.length));
  const routineId = 'legacy-schedule:0,1,2,3,4,5,6';
  assert.deepEqual(Object.keys(actual.routines), definitions.length ? [routineId] : []);
  if (!definitions.length) return;
  const { placements, ...routine } = actual.routines[routineId];
  assert.deepEqual(routine, { id: routineId, name: 'Imported workouts',
    selectedDays: [0, 1, 2, 3, 4, 5, 6], createdAt: '1970-01-01T00:00:00.000Z' });
  assert.equal(placements?.length, definitions.length);
  definitions.forEach((definition, index) => {
    const placement = placements![index];
    assert.equal(placement.id, `legacy:unassigned:${definition.id}`);
    assert.equal(placement.exerciseId, definition.id);
    assert.equal(placement.legacyLogId, definition.id);
    assert.equal(placement.prescription.targetType, 'repetitions');
    assert.equal(placement.prescription.sets, definition.setsGoal ?? 1);
    assert.equal(placement.prescription.legacyTotal ?? placement.prescription.sets * placement.prescription.perSet, definition.dailyGoal);
    assert.equal(placement.weightLbs, definition.weightLbs);
    assert.equal(placement.restSeconds, definition.restSeconds);
  });
}

for (const fixture of historicalIntegrityFixtures) {
  test(`initialization preserves ${fixture.name} across repeated mounts`, () => {
    const storage = new MemoryStorage();
    // Retain noncanonical whitespace as well as semantic values. An initializer
    // must not persist a normalized/inferred replacement while reading history.
    const raw = JSON.stringify(fixture.data, null, 2);
    storage.setItem('workout-tracker-data', raw);
    storage.writes = [];
    for (let mount = 0; mount < 3; mount++) {
      assertPreservedHistory(readThroughHook(storage), fixture.data);
      assert.equal(storage.getItem('workout-tracker-data'), raw);
      assert.deepEqual(storage.writes, [], 'initialization must not write historical replacements');
    }
  });

  test(`backup compatibility preserves ${fixture.name}`, async () => {
    const source = new MemoryStorage();
    const raw = JSON.stringify(fixture.data);
    source.setItem('workout-tracker-data', raw);
    source.setItem('workout-tracker-logs', JSON.stringify(fixture.data.dailyLogs));
    const backup = await createBackup(source, new IDBFactory());
    const oldVersion2 = { ...backup }; delete oldVersion2.manifest;
    for (const input of [JSON.parse(JSON.stringify(backup)), oldVersion2,
      { 'workout-tracker-data': fixture.data, 'workout-tracker-logs': fixture.data.dailyLogs },
      { 'workout-tracker-data': raw, 'workout-tracker-logs': JSON.stringify(fixture.data.dailyLogs) }]) {
      const target = new MemoryStorage();
      target.setItem('unrelated-synthetic-key', 'retain');
      applyRestore(prepareRestore(input), target, new MemoryStorage());
      assert.equal(target.getItem('workout-tracker-data'), raw);
      assertPreservedHistory(readThroughHook(target), fixture.data);
      assert.equal(target.getItem('workout-tracker-data'), raw);
      assert.equal(target.getItem('workout-tracker-logs'), JSON.stringify(fixture.data.dailyLogs));
      assert.equal(target.getItem('unrelated-synthetic-key'), 'retain');
      const reexport = await createBackup(target, new IDBFactory());
      assert.equal(reexport.localStorage['workout-tracker-data'], raw);
    }
  });
}
