import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foodHistory } from '../client/src/lib/food-history';
const now = new Date(2026, 9, 30, 12);
const food = (id: string, overrides = {}) => ({ id, name: 'Eggs', brand: 'Brand', quantity: 50, unit: 'g', calories: 70, carbs: 0, protein: 6, fat: 5, meal: 'breakfast', timestamp: '2026-10-30T10:00:00', ...overrides });
function storage(days: Record<string, unknown>) {
  const entries = Object.entries(days).map(([date, value]) => [`fitcircle_food_${date}`, typeof value === 'string' ? value : JSON.stringify(value)]);
  return { length: entries.length, key: (i: number) => entries[i]?.[0] ?? null, getItem: (key: string) => entries.find(([k]) => key === k)?.[1] ?? null };
}
test('Recent includes seven local calendar days, excludes older dates, and picks latest distinct snapshot', () => {
  const result = foodHistory(storage({
    '2026-10-30': [food('new')],
    '2026-10-24': [food('boundary', { timestamp: '2026-10-24T20:00:00' })],
    '2026-10-23': [food('old', { name: 'Old food', timestamp: '2026-10-23T23:59:00' })],
    '2026-10-31': [food('future', { name: 'Future', timestamp: '2026-10-31T10:00:00' })],
  }), now);
  assert.equal(result.recent.length, 1); assert.equal(result.recent[0].food.id, 'search-new');
  assert.equal(result.recent[0].count, 2);
});
test('all-time frequency counts diary entries rather than servings and breaks ties by recency', () => {
  const result = foodHistory(storage({
    '2020-01-01': [food('old', { foodId: 'a', servings: 100, timestamp: '2020-01-01T10:00:00' })],
    '2026-10-30': [food('a', { foodId: 'a' }), food('b1', { foodId: 'b', timestamp: '2026-10-30T11:00:00' }), food('b2', { foodId: 'b', timestamp: '2026-10-30T09:00:00' })],
  }), now);
  assert.deepEqual(result.frequent.map(x => [x.key, x.count]), [['food:b', 2], ['food:a', 2]]);
});
test('identity preserves source ids, barcodes, brands and distinct serving/nutrition snapshots', () => {
  const result = foodHistory(storage({ '2026-10-30': [
    food('a', { foodId: 'one' }), food('b', { foodId: 'two' }),
    food('c', { barcode: '012345678905' }), food('d', { barcode: '0012345678905' }),
    food('e', { brand: 'Other' }), food('f', { quantity: 100 }), food('g', { calories: 80 }),
  ] }), now);
  assert.equal(result.frequent.length, 6);
  assert.equal(result.frequent[0].count, 2);
});
test('duplicates, missing references, malformed rows and JSON never mutate or duplicate history', () => {
  const valid = food('same', { foodId: 'deleted-product' });
  const source = storage({ '2026-10-30': [valid, valid, null, { id: 'broken' }, food('bad-date', { timestamp: 'invalid' })], '2026-10-29': 'bad json' });
  const before = source.getItem('fitcircle_food_2026-10-30');
  const result = foodHistory(source, now);
  assert.equal(result.frequent.length, 1); assert.equal(result.frequent[0].count, 1);
  assert.equal(result.frequent[0].food.name, 'Eggs'); assert.equal(source.getItem('fitcircle_food_2026-10-30'), before);
});
test('empty Recent never falls back to all-time; edits and deletions are derived on each read', () => {
  const old = food('old', { timestamp: '2020-01-01T10:00:00' });
  assert.equal(foodHistory(storage({ '2020-01-01': [old] }), now).recent.length, 0);
  assert.equal(foodHistory(storage({}), now).frequent.length, 0);
  assert.equal(foodHistory(storage({ '2026-10-30': [food('x'), food('y')] }), now).frequent[0].count, 2);
  assert.equal(foodHistory(storage({ '2026-10-30': [food('x', { name: 'Edited' })] }), now).frequent[0].food.name, 'Edited');
});
test('Recent follows local calendar boundaries across daylight-saving changes', () => {
  const zone = process.env.TZ; process.env.TZ = 'America/New_York';
  try {
    const result = foodHistory(storage({
      '2026-10-28': [food('boundary', { timestamp: '2026-10-28T00:01:00-04:00' })],
      '2026-10-27': [food('older', { name: 'Older', timestamp: '2026-10-27T23:59:00-04:00' })],
    }), new Date(2026, 10, 3, 0, 30));
    assert.deepEqual(result.recent.map(item => item.food.id), ['search-boundary']);
  } finally { if (zone === undefined) delete process.env.TZ; else process.env.TZ = zone; }
});
