import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { LocalFoodService, type CustomFoodInput } from '../client/src/lib/local-food-service';
import { prepareRestore } from '../client/src/lib/backup';
const key = 'fitcircle_food_database';
const food = { id: 'custom-synthetic', name: 'Synthetic food', quantity: 100, unit: 'g' as const, calories: 100, carbs: 10, protein: 5, fat: 1 };
const input: CustomFoodInput = { ...food, name: 'Synthetic new food' };
async function fixture(run: (service: LocalFoodService, values: Map<string,string>, fail: (enabled: boolean) => void) => Promise<void>) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const idb = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  const values = new Map([[key, JSON.stringify([food])], ['fitcircle_food_database_migrated', 'true']]);
  let failure = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => { if (failure && k === key) throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); values.set(k,v); },
  } });
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  try { const service = new LocalFoodService(); await service.ready; await run(service,values,enabled => { failure = enabled; }); }
  finally { for (const [key, old] of [['localStorage',descriptor],['indexedDB',idb]] as const) { if (old) Object.defineProperty(globalThis,key,old); else Reflect.deleteProperty(globalThis,key); } }
}
for (const operation of ['create','update','delete','restore'] as const) test(`${operation} reports quota failure without changing catalog bytes`, async () => {
  await fixture(async (service,values,fail) => {
    const raw = values.get(key); fail(true);
    const result = operation === 'create' ? await service.addCustomFood(input)
      : operation === 'update' ? await service.updateFood(food.id, { name: 'Synthetic edit' })
      : operation === 'delete' ? await service.deleteFood(food.id) : service.restoreFoodDatabase([]);
    assert.equal(result.success, false); assert.ok(result.error); assert.equal(values.get(key),raw);
    fail(false); assert.equal((await service.getAllFoods())[0].name, food.name);
  });
});
for (const [name, patch] of Object.entries({ zero: { quantity: 0 }, negative: { quantity: -1 }, infinity: { calories: Infinity }, nan: { carbs: NaN }, optionalInfinity: { sodium: Infinity } })) {
  test(`invalid ${name} food cannot make the catalog unexportable`, async () => {
    await fixture(async (service,values) => {
      const raw = values.get(key);
      assert.equal((await service.addCustomFood({ ...input,...patch })).success,false);
      assert.equal((await service.updateFood(food.id,patch)).success,false);
      assert.equal(values.get(key),raw);
    });
  });
}
test('successful create and update remain compatible with unchanged backup validation', async () => {
  await fixture(async (service, values) => {
    const created = await service.addCustomFood(input); assert.equal(created.success,true);
    const updated = await service.updateFood(created.food!.id,{ quantity: 50, calories: 75 }); assert.equal(updated.success,true);
    const raw = values.get(key)!; assert.equal(prepareRestore({ [key]: raw }).entries[key],raw);
    assert.equal((await service.deleteFood(created.food!.id)).success,true);
    assert.deepEqual(await service.getAllFoods(),[food]);
  });
});
