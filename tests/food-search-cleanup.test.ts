import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalFoodService } from '../client/src/lib/local-food-service';
import { prepareRestore } from '../client/src/lib/backup';

const key = 'fitcircle_food_database';
const base = { quantity: 100, unit: 'g' as const, calories: 100, carbs: 10, protein: 5, fat: 1 };
const foods = [
  { ...base, id: 'synthetic-exact', name: 'Apple' },
  { ...base, id: 'synthetic-prefix', name: 'Apple slices' },
  { ...base, id: 'synthetic-contains', name: 'Green apple' },
  { ...base, id: 'synthetic-brand', name: 'Pear', brand: 'Apple farm' },
];
async function fixture(run: (service: LocalFoodService, data: Map<string,string>) => Promise<void>) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const data = new Map([[key, JSON.stringify(foods)], ['fitcircle_food_database_migrated', 'true']]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, raw: string) => data.set(k,raw),
  } });
  try { const service = new LocalFoodService(); await service.ready; await run(service,data); }
  finally { if (previous) Object.defineProperty(globalThis,'localStorage',previous); else Reflect.deleteProperty(globalThis,'localStorage'); }
}
test('food search retains exact/prefix/substring/brand ranking, limits and untouched source', async () => {
  await fixture(async (service,data) => {
    const raw = data.get(key);
    assert.deepEqual((await service.searchProducts('apple')).map(f => f.id), foods.map(f => f.id));
    assert.deepEqual((await service.searchProducts(' APPLE ',2)).map(f => f.id), foods.slice(0,2).map(f => f.id));
    assert.deepEqual(await service.searchProducts(''),[]);
    assert.equal(data.get(key),raw);
  });
});
test('search reflects custom creation, edits and deletion without changing backup compatibility', async () => {
  await fixture(async (service,data) => {
    const created = await service.addCustomFood({ ...base, name: 'Synthetic kiwi' });
    assert.equal(created.success,true);
    assert.equal((await service.searchProducts('kiwi'))[0].id,created.food!.id);
    assert.equal((await service.updateFood(created.food!.id,{name:'Synthetic mango'})).success,true);
    assert.deepEqual(await service.searchProducts('kiwi'),[]);
    assert.equal((await service.searchProducts('mango'))[0].id,created.food!.id);
    const raw = data.get(key)!;
    assert.equal(prepareRestore({[key]:raw}).entries[key],raw);
    assert.equal((await service.deleteFood(created.food!.id)).success,true);
    assert.deepEqual(await service.searchProducts('mango'),[]);
    assert.deepEqual(JSON.parse(data.get(key)!),foods);
  });
});
