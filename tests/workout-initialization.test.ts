import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useWorkouts } from '../client/src/hooks/use-workouts';
import { malformedWorkouts } from './fixtures/malformed-workouts';
import { historicalIntegrityFixtures } from './fixtures/historical-integrity';

function mount(raw: string | null, unavailable = false) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const writes: string[] = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => { if (unavailable) throw new DOMException('Synthetic read denial', 'SecurityError'); return raw; },
    setItem: (_key: string, value: string) => writes.push(value),
  } });
  let data: unknown;
  function Probe() {
    const api = useWorkouts(); data = { workouts: api.workouts, dailyLogs: api.getDailyLogs(),
      journalEntries: api.getAllJournalEntries(), routines: api.routines };
    return null;
  }
  try { renderToString(createElement(Probe)); return { data, writes }; }
  finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}
for (const { name, raw } of malformedWorkouts) {
  test(`failed initialization blocks ${name} without replacing bytes`, () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      assert.throws(() => mount(raw), error => error instanceof Error && error.name === 'StoredWorkoutDataError'
        && (error as Error & { raw: unknown }).raw === raw);
    }
  });
}
test('storage read denial blocks initialization rather than treating the store as absent', () => {
  assert.throws(() => mount(null, true), error => error instanceof Error && error.name === 'StoredWorkoutDataError');
});
test('only an absent key creates a fresh document', () => {
  assert.deepEqual(mount(null).data, { workouts: {}, dailyLogs: {}, journalEntries: {}, routines: {} });
});
for (const fixture of historicalIntegrityFixtures) {
  test(`validated initialization preserves ${fixture.name}`, () => {
    const result = mount(JSON.stringify(fixture.data));
    assert.deepEqual(result.data, fixture.data); assert.deepEqual(result.writes, []);
  });
}

test('legacy array workout containers remain unchanged when backup validation accepts them', () => {
  const data = { workouts: [{ id: 'legacy-a', name: 'Synthetic legacy array', color: 'green', count: 0, dailyGoal: 20 }],
    dailyLogs: { '2026-01-01': { 'legacy-a': 8 } }, journalEntries: {}, routines: {} };
  assert.deepEqual(mount(JSON.stringify(data)).data, data);
});
