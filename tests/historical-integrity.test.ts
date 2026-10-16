import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { IDBFactory } from 'fake-indexeddb';
import { useWorkouts } from '../client/src/hooks/use-workouts';
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

for (const fixture of historicalIntegrityFixtures) {
  test(`initialization preserves ${fixture.name} across repeated mounts`, () => {
    const storage = new MemoryStorage();
    // Retain noncanonical whitespace as well as semantic values. An initializer
    // must not persist a normalized/inferred replacement while reading history.
    const raw = JSON.stringify(fixture.data, null, 2);
    storage.setItem('workout-tracker-data', raw);
    storage.writes = [];
    for (let mount = 0; mount < 3; mount++) {
      assert.deepEqual(readThroughHook(storage), fixture.data);
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
      assert.deepEqual(readThroughHook(target), fixture.data);
      assert.equal(target.getItem('workout-tracker-data'), raw);
      assert.equal(target.getItem('workout-tracker-logs'), JSON.stringify(fixture.data.dailyLogs));
      assert.equal(target.getItem('unrelated-synthetic-key'), 'retain');
      const reexport = await createBackup(target, new IDBFactory());
      assert.equal(reexport.localStorage['workout-tracker-data'], raw);
    }
  });
}
