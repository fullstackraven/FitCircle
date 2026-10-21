import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useCardio } from '../client/src/hooks/use-cardio';
import { cardioKey, cardioGoalKey, cardioLegacyKeys, modernCardio, legacyCardio, malformedCardio } from './fixtures/cardio-initialization';
import { prepareRestore } from '../client/src/lib/backup';

function mount(values: Record<string, string>, denied?: string) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const writes: string[] = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => { if (key === denied) throw new DOMException('Synthetic read denial', 'SecurityError'); return values[key] ?? null; },
    setItem: (key: string) => writes.push(key),
  } });
  let api!: ReturnType<typeof useCardio>;
  function Probe() { api = useCardio(); return null; }
  try { renderToString(createElement(Probe)); return { api, writes }; }
  finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage'); }
}
for (const { name, raw } of malformedCardio) {
  test(`cardio initialization blocks ${name} without writes, repeatedly`, () => {
    for (let i = 0; i < 3; i++) assert.throws(() => mount({ [cardioKey]: raw }), { name: 'StoredCardioDataError' });
  });
}
for (const key of [cardioKey, ...cardioLegacyKeys, cardioGoalKey]) {
  test(`cardio read denial at ${key} is not absence`, () => {
    assert.throws(() => mount({}, key), { name: 'StoredCardioDataError' });
  });
}
test('valid cardio history and calculations load before effects without initialization writes', () => {
  const raw = JSON.stringify(modernCardio);
  const { api, writes } = mount({ [cardioKey]: raw });
  assert.deepEqual(api.data.dailyLogs, modernCardio.dailyLogs);
  assert.deepEqual(api.data.customTypes, modernCardio.customTypes);
  assert.equal(api.data.goal.target, 150); // Weekly target is not divided or reinterpreted.
  assert.equal(api.data.goal.period, "week");
  assert.deepEqual(api.getCardioStats(), { totalEntries: 1, totalDuration: 25.5, totalDistance: 2.25, favoriteType: 'running', typeStats: { running: 1 } });
  assert.deepEqual(writes, []);
});
for (const key of [cardioKey, ...cardioLegacyKeys]) {
  test(`legacy numeric strings, zero entries and goal survive ${key} loading`, () => {
    const wrapper = { entries: legacyCardio, goal: { type: 'distance', target: 5, period: 'day' }, customTypes: ['Synthetic climb'] };
    const { api, writes } = mount({ [key]: JSON.stringify(wrapper) });
    const log = api.data.dailyLogs['2025-03-02'];
    assert.equal(log.sessions.length, 2); assert.equal(log.totalDuration, 12.5); assert.equal(log.totalDistance, 1.25);
    assert.equal(api.data.goal.target, 5); assert.deepEqual(api.data.customTypes, wrapper.customTypes);
    assert.deepEqual((api.data as unknown as { entries: unknown }).entries, legacyCardio);
    assert.deepEqual(writes, []);
  });
}
test('mixed modern and legacy history does not merge, duplicate or discard source entries', () => {
  const { api } = mount({ [cardioKey]: JSON.stringify({ ...modernCardio, entries: legacyCardio }) });
  assert.deepEqual(api.data.dailyLogs, modernCardio.dailyLogs);
  assert.deepEqual((api.data as unknown as { entries: unknown }).entries, legacyCardio);
});
test('absent cardio state initializes without creating a persistent record', () => {
  const { api, writes } = mount({});
  assert.deepEqual(Object.keys(api.data.dailyLogs), []); assert.equal(api.data.goal.target, 21); assert.deepEqual(writes, []);
});
test('empty legacy arrays do not mask a later valid alias', () => {
  const { api } = mount({ [cardioLegacyKeys[0]]: '[]', [cardioLegacyKeys[1]]: JSON.stringify(legacyCardio) });
  assert.equal(api.getCardioStats().totalEntries, 2);
});
test('an ambiguous legacy record never falls through to a lower-priority valid alias', () => {
  assert.throws(() => mount({ [cardioLegacyKeys[0]]: '{', [cardioLegacyKeys[1]]: JSON.stringify(legacyCardio) }), { name: 'StoredCardioDataError' });
});
test('malformed goal marker is preserved and blocks rather than inventing a goal', () => {
  assert.throws(() => mount({ [cardioGoalKey]: '{' }), { name: 'StoredCardioDataError' });
});
test('missing legacy date without timestamp remains ambiguous; timestamp-only dates are deterministic', () => {
  const entry = { id: 'synthetic-timestamp', type: 'walking', duration: 10, timestamp: 1740916800000 };
  const first = mount({ cardio: JSON.stringify([entry]) }).api.data.dailyLogs;
  const second = mount({ cardio: JSON.stringify([entry]) }).api.data.dailyLogs;
  assert.deepEqual(first, second); assert.equal(Object.values(first)[0].date.slice(0,4), '2025');
});
test('legacy and v2 backup validation retain cardio bytes and accept incomplete documents for recovery', () => {
  for (const value of [modernCardio, { entries: [], goal: { type: 'duration', target: 21 } }, { goal: { type: 'duration', target: 21 } }]) {
    const raw = JSON.stringify(value);
    const legacy = prepareRestore({ [cardioKey]: raw });
    const v2 = prepareRestore({ format: 'fitcircle-backup', version: 2, createdAt: '2026-10-16', localStorage: { [cardioKey]: raw }, indexedDB: { customFoods: [] } });
    assert.equal(legacy.entries[cardioKey], raw); assert.equal(v2.entries[cardioKey], raw);
  }
});
