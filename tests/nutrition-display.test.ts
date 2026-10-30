import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatNutritionDisplay } from '../client/src/lib/nutrition-display';
import { dailyNutrition } from '../client/src/lib/nutrition';
import type { FoodEntry } from '../client/src/lib/local-food-service';

test('nutrition display rounds calories and macros without unnecessary zeros', () => {
  for (const [input, expected] of [[25.9998, '26'], [5.9976, '6'], [1.9992, '2'], [27.4044634221, '27.4'], [2.5, '2.5'], [0, '0'], [1.05, '1.1'], [2.55, '2.6']] as const) assert.equal(formatNutritionDisplay(input), expected);
  assert.equal(formatNutritionDisplay(113.3980925, 'calories'), '113');
  assert.equal(formatNutritionDisplay(150, 'calories'), '150');
  assert.equal(formatNutritionDisplay(113.5, 'calories'), '114');
  assert.equal(formatNutritionDisplay(-0), '0');
});
test('unknown or invalid nutrition never becomes a confirmed zero', () => {
  for (const value of [undefined, null, '', '0', 'not a number', NaN, Infinity, -Infinity, -1, {}, false]) {
    assert.equal(formatNutritionDisplay(value), 'Unknown');
    assert.equal(formatNutritionDisplay(value, 'calories'), 'Unknown');
  }
});
test('formatting never rounds source entries or serving-adjusted totals', () => {
  const entry: FoodEntry = { id: 'food', name: 'Scanned food', quantity: 50, unit: 'g', calories: 113.3980925, carbs: 27.4044634221, protein: 5.9976, fat: 1.9992, servings: 2.5, meal: 'breakfast', timestamp: '2026-10-30T12:00:00Z' };
  const raw = JSON.stringify(entry), before = dailyNutrition([entry]);
  for (const key of ['calories', 'carbs', 'protein', 'fat'] as const) formatNutritionDisplay(entry[key], key === 'calories' ? 'calories' : 'macro');
  assert.equal(JSON.stringify(entry), raw); assert.deepEqual(dailyNutrition([entry]), before);
  assert.equal(before.carbs.value, entry.carbs * 2.5);
  assert.equal(before.calories.value, entry.calories * 2.5);
});
