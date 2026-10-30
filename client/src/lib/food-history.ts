import { diarySchema } from './food-diary';
import { barcodeIdentity } from './barcode';
import { getDateString, parseLocalDate } from './date-utils';
import type { FoodEntry } from './local-food-service';

export type FoodHistoryItem = { key: string; food: FoodEntry; count: number; latest: number };
/** Diary ids identify log entries, not foods. Legacy snapshots need a composite identity. */
function identity(food: FoodEntry & Record<string, unknown>) {
  for (const field of ['foodId', 'sourceFoodId']) {
    if (typeof food[field] === 'string' && food[field]) return `food:${food[field]}`;
  }
  if (food.barcode?.trim()) {
    try { return `barcode:${barcodeIdentity(food.barcode)}`; }
    catch { return `barcode:${food.barcode.trim()}`; }
  }
  return `snapshot:${JSON.stringify([food.name, food.brand ?? '', food.quantity, food.unit,
    food.calories, food.carbs, food.protein, food.fat, food.fiber, food.sugar,
    food.sodium, food.saturatedFat, food.potassium, food.cholesterol,
    food.vitaminA, food.vitaminC, food.calcium, food.iron])}`;
}
/** Read-only projection: malformed rows/JSON are skipped without repairing stored bytes. */
export function foodHistory(storage: Pick<Storage, 'length' | 'key' | 'getItem'>, now = new Date()) {
  const days = new Set<string>();
  for (let i = 0; i < 7; i++) { const date = new Date(now); date.setDate(date.getDate() - i); days.add(getDateString(date)); }
  const entries = new Map<string, { food: FoodEntry; day: string; time: number }>();
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !/^fitcircle_food_\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    const day = key.slice('fitcircle_food_'.length);
    if (getDateString(parseLocalDate(day)) !== day) continue;
    try {
      const value: unknown = JSON.parse(storage.getItem(key) ?? 'null');
      if (!Array.isArray(value)) continue;
      for (const row of value) {
        if (!diarySchema.element.safeParse(row).success) continue;
        const food = row as FoodEntry, time = Date.parse(food.timestamp);
        if (!Number.isFinite(time) || [food.calories, food.carbs, food.protein, food.fat].some(value => value < 0)) continue;
        const previous = entries.get(food.id);
        if (!previous || time > previous.time || (time === previous.time && day > previous.day)) entries.set(food.id, { food, day, time });
      }
    } catch { /* Keep other valid days available; no storage writes. */ }
  }
  const rank = (recent: boolean) => {
    const groups = new Map<string, FoodHistoryItem>();
    for (const { food, day, time } of entries.values()) {
      if (recent && !days.has(day)) continue;
      const key = identity(food as FoodEntry & Record<string, unknown>), previous = groups.get(key);
      if (!previous) groups.set(key, { key, food: { ...food, id: `search-${food.id}` }, count: 1, latest: time });
      else {
        previous.count++;
        if (time > previous.latest) { previous.food = { ...food, id: `search-${food.id}` }; previous.latest = time; }
      }
    }
    return [...groups.values()].sort((a, b) => (recent ? 0 : b.count - a.count) || b.latest - a.latest || a.key.localeCompare(b.key));
  };
  return { recent: rank(true), frequent: rank(false) };
}
