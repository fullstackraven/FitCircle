import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { prepareRestore, applyRestore, createBackup, recoverInterruptedRestore } from '../client/src/lib/backup';
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  failKey: string | null = null;
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) {
    if (this.failKey === k) { this.failKey = null; throw new DOMException('Storage quota exceeded', 'QuotaExceededError'); }
    this.data.set(k, v);
  }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}
const food = { id: 'custom-1', name: 'My food', quantity: 100, unit: 'g', calories: 100, carbs: 10, protein: 10, fat: 0 };

test('legacy backup converts objects and raw scalar strings without touching unrelated data', () => {
  const storage = new MemoryStorage();
  storage.setItem('other-app', 'keep');
  storage.setItem('fitcircle_age', '42');
  const plan = prepareRestore({ fitcircle_username: 'Name', fitcircle_energy_levels: { '2026-10-14': 8 }, 'other-app': 'overwrite' });
  applyRestore(plan, storage, new MemoryStorage());
  assert.equal(storage.getItem('other-app'), 'keep');
  assert.equal(storage.getItem('fitcircle_age'), '42');
  assert.equal(storage.getItem('fitcircle_username'), 'Name');
  assert.deepEqual(plan.ignoredKeys, ['other-app']);
});
for (const [name, data] of Object.entries({
  null: null, array: [], empty: {}, unrelated: { other: 1 },
  'invalid workout container': { 'workout-tracker-data': { workouts: 'bad' } },
  'invalid nested workout': { 'workout-tracker-data': { workouts: { x: { id: 'x' } } } },
  'invalid food': { fitcircle_food_database: [{ name: 'missing nutrition' }] },
  'invalid goal': { fitcircle_goal_hydration: 'NaN' },
  'invalid nested hydration': { fitcircle_hydration_data: { logs: { today: { entries: 'bad' } } } },
  'invalid JSON': { fitcircle_fasting_logs: '{bad' },
  'invalid IndexedDB': { fitcircle_username: 'new', __indexeddb_custom_foods: {} },
  'unknown version': { format: 'fitcircle-backup', version: 99, localStorage: {} },
})) test(`rejects ${name} before changing data`, () => assert.throws(() => prepareRestore(data)));

test('valid first entry plus invalid later entry never produces an applicable plan', () => {
  const storage = new MemoryStorage(); storage.setItem('fitcircle_username', 'old');
  assert.throws(() => applyRestore(prepareRestore({ fitcircle_username: 'new', fitcircle_food_database: [false] }), storage));
  assert.equal(storage.getItem('fitcircle_username'), 'old');
});

test('quota failure midway rolls back all touched keys', () => {
  const storage = new MemoryStorage();
  storage.setItem('fitcircle_username', 'old'); storage.setItem('unrelated', 'keep');
  storage.failKey = 'fitcircle_age';
  assert.throws(() => applyRestore(prepareRestore({ fitcircle_username: 'new', fitcircle_age: 30 }), storage, storage), /original data restored/);
  assert.equal(storage.getItem('fitcircle_username'), 'old');
  assert.equal(storage.getItem('fitcircle_age'), null);
  assert.equal(storage.getItem('unrelated'), 'keep');
  assert.equal(storage.length, 2);
});

test('journal quota failure leaves everything untouched', () => {
  const storage = new MemoryStorage(); storage.setItem('fitcircle_username', 'old');
  storage.failKey = 'fitcircle_restore_journal_v2';
  assert.throws(() => applyRestore(prepareRestore({ fitcircle_username: 'new' }), storage, storage));
  assert.equal(storage.getItem('fitcircle_username'), 'old');
});

test('interrupted restore recovers originals on next startup', () => {
  const storage = new MemoryStorage();
  storage.setItem('fitcircle_restore_journal_v2', JSON.stringify({ fitcircle_username: 'old', fitcircle_age: null }));
  storage.setItem('fitcircle_username', 'partially changed'); storage.setItem('fitcircle_age', '20'); storage.setItem('other', 'keep');
  recoverInterruptedRestore(storage, storage);
  assert.equal(storage.getItem('fitcircle_username'), 'old'); assert.equal(storage.getItem('fitcircle_age'), null);
  assert.equal(storage.getItem('other'), 'keep'); assert.equal(storage.getItem('fitcircle_restore_journal_v2'), null);
});

test('legacy IndexedDB foods migrate with built-ins; authoritative local food edits win collisions', () => {
  const plan = prepareRestore({ __indexeddb_custom_foods: [food] });
  assert.ok(JSON.parse(plan.entries.fitcircle_food_database).length > 1);
  const collision = prepareRestore({ fitcircle_food_database: [{ ...food, name: 'Edited' }], __indexeddb_custom_foods: [food] });
  assert.deepEqual(JSON.parse(collision.entries.fitcircle_food_database).map((f: typeof food) => f.name), ['Edited']);
  assert.equal(collision.entries.fitcircle_food_database_migrated, 'true');
});

test('versioned export round trips exact localStorage strings and legacy IndexedDB foods', async () => {
  const storage = new MemoryStorage();
  storage.setItem('fitcircle_username', '123'); storage.setItem('fitcircle_food_database', JSON.stringify([food])); storage.setItem('other-app', 'private');
  const factory = new IDBFactory();
  await createBackup(storage, factory); // Initialize legacy schema.
  await new Promise<void>((resolve, reject) => {
    const req = factory.open('FitCircleCustomFoods', 1);
    req.onsuccess = () => { const db = req.result; const tx = db.transaction('foods', 'readwrite'); tx.objectStore('foods').put({ ...food, id: 'custom-legacy' }); tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => reject(tx.error); };
  });
  const backup = await createBackup(storage, factory);
  assert.equal(backup.indexedDB.customFoods.length, 1);
  assert.equal(backup.localStorage['other-app'], undefined);
  const target = new MemoryStorage();
  applyRestore(prepareRestore(JSON.parse(JSON.stringify(backup))), target, new MemoryStorage());
  assert.equal(target.getItem('fitcircle_username'), '123');
  assert.equal(JSON.parse(target.getItem('fitcircle_food_database')!).length, 2);
});

test('prototype-like keys cannot target unrelated storage', () => {
  const plan = prepareRestore(JSON.parse('{"fitcircle_username":"ok","__proto__":{"polluted":true},"constructor":"bad"}'));
  assert.equal(Object.keys(plan.entries).length, 1);
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
});
