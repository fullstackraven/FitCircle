import { nutritionGoalsSchema } from './nutrition';
import { findStorageSource, isBackupKey as isAppKey, scalarKeys, calculatorKeys, goalKey, datedFoodKey } from './storage-registry';
import { z } from 'zod';
import builtInFoods from '../data/comprehensive-foods.json';

const number = z.number().finite();
const text = z.string();
const object = z.object({}).passthrough();
const record = z.record;
const shaped = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough();
const nutrients = { fiber: number.optional(), sugar: number.optional(), sodium: number.optional(), saturatedFat: number.optional(), potassium: number.optional(), cholesterol: number.optional(), vitaminA: number.optional(), vitaminC: number.optional(), calcium: number.optional(), iron: number.optional() };
const food = shaped({ ...nutrients, brand: text.optional(), barcode: text.optional(), nutritionPer100g: shaped({ calories: number, carbs: number, protein: number, fat: number, ...nutrients }).optional(), id: text.min(1), name: text.min(1), quantity: number.positive(), unit: z.enum(['g', 'oz', 'cup', 'piece', 'serving', 'ml', 'slice']), calories: number, carbs: number, protein: number, fat: number });
export { food as foodDataSchema };
const foods = z.array(food);
const session = shaped({ id: text, time: text, duration: number });
const workout = shaped({ id: text, name: text, color: text, count: number, dailyGoal: number, scheduledDays: z.array(number.int().min(0).max(6)).optional(), goalHistory: z.array(shaped({ goal: number, timestamp: text })).optional() });
const dailyLog = record(z.union([number, shaped({ count: number, goalAtTime: number })]));
// Shared validation only; backup acceptance and stored representations are unchanged.
export const workoutDataSchema = shaped({ workouts: z.union([record(workout), z.array(workout)]), dailyLogs: record(dailyLog).optional(), journalEntries: record(z.union([text, shaped({ text, timestamp: text })])).optional(), routines: record(shaped({ id: text, name: text, selectedDays: z.array(number), createdAt: text })).optional() });
const schemas: Record<string, z.ZodTypeAny> = {
  fitcircle_nutrition_goals: nutritionGoalsSchema,
  'workout-tracker-data': workoutDataSchema,
  'workout-tracker-logs': record(dailyLog),
  fitcircle_food_database: foods,
  fitcircle_goal_cardio: shaped({ type: z.enum(['distance', 'duration']), target: number, period: z.enum(['day', 'week']).optional() }),
  fitcircle_daily_quote: shaped({ text, author: text }),
  fitcircle_deleted_builtin_foods: z.array(text),
  fitcircle_hydration_data: shaped({ dailyGoalOz: number, currentDayOz: number, logs: record(shaped({ date: text, totalOz: number, entries: z.array(shaped({ time: text, amount: number })) })), lastDate: text }),
  fitcircle_meditation_logs: z.union([z.array(session.extend({ date: text })), shaped({ logs: z.array(session.extend({date:text})), dailyLogs: z.never().optional() }), shaped({ dailyLogs: record(shaped({ date: text, totalMinutes: number, sessions: z.array(session) })), lastDate: text, currentDayMinutes: number })]),
  fitcircle_fasting_logs: z.array(shaped({ id: text, startDate: text, startTime: text, endDate: text, endTime: text, duration: number, loggedAt: text })),
  fitcircle_cardio_data: shaped({ dailyLogs: record(shaped({ date: text, totalDuration: number, totalDistance: number, sessions: z.array(session.extend({ type: text })) })).optional(), entries: z.array(shaped({ id: text, date: text, type: text, duration: number })).optional(), goal: shaped({ type: z.enum(['distance', 'duration']), target: number }), customTypes: z.array(text).optional() }),
  fitcircle_measurements_history: record(z.array(shaped({ date: text, value: number }))),
  fitcircle_measurements: object,
  fitcircle_energy_levels: record(number.min(0).max(10)),
  fitcircle_supplements: z.array(shaped({ id: number, name: text, measurementType: text, amount: number, createdAt: text })),
  fitcircle_supplement_logs: record(record(z.boolean())),
  fitcircle_reminders: z.array(shaped({ id: text, text, completed: z.boolean(), createdAt: text })),
  fitcircle_recovery_data: shaped({ recoveryDays: z.array(text) }),
  fitcircle_workout_duration_data: shaped({ completedSessions: z.array(shaped({ date: text, startTime: number })), currentSession: shaped({ date: text, startTime: number }).optional() }),
  fitcircle_dashboard_widgets: z.array(shaped({ id: text, type: text, title: text, enabled: z.boolean(), position: number, size: text })),
  fitcircle_control_settings: record(z.boolean()),
  fitcircle_goals: z.object({ weightGoalType: text.optional() }).catchall(number),
  fitcircle_profile: object,
  fitcircle_wellness_weights: record(number),
  fitcircle_wellness_layout: z.array(text),
};
export { isBackupKey as isAppKey } from './storage-registry';

export interface Backup {
  format: 'fitcircle-backup';
  version: 2;
  createdAt: string;
  localStorage: Record<string, string>;
  indexedDB: { customFoods: unknown[] };
  // Optional v2 metadata: old v2 files remain accepted, old readers ignore it.
  manifest?: { version: 1; localStorageKeys: string[]; indexedDB: { database: string; store: string; records: number }[] };
}
export interface RestorePlan { entries: Record<string, string>; ignoredKeys: string[] }
const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
function validateEntry(key: string, raw: string) {
  if (scalarKeys.has(key) || calculatorKeys.has(key)) return;
  if (goalKey.test(key)) {
    if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error(`Invalid numeric goal: ${key}`);
    return;
  }
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error(`Invalid JSON in ${key}`); }
  const schema = datedFoodKey.test(key) ? z.array(food.extend({ meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']), timestamp: text })) : schemas[key];
  if (!schema && findStorageSource('localStorage', key)?.classification !== 'legacy data') throw new Error(`Missing backup validator for ${key}`);
  if (schema && !schema.safeParse(value).success) throw new Error(`Invalid data in ${key}`);
}

/** Pure validation: no storage writes occur until the entire file passes. */
export function prepareRestore(input: unknown): RestorePlan {
  if (!plain(input)) throw new Error('Backup must be a JSON object');
  let source = input;
  let customFoods: unknown = input.__indexeddb_custom_foods ?? [];
  const versioned = input.format === 'fitcircle-backup';
  if (versioned) {
    if (input.version !== 2 || !plain(input.localStorage) || !plain(input.indexedDB) || typeof input.createdAt !== 'string') throw new Error('Unsupported or malformed backup');
    source = input.localStorage;
    customFoods = input.indexedDB.customFoods;
    if (input.manifest !== undefined) {
      const manifest = z.object({ version: z.literal(1), localStorageKeys: z.array(text), indexedDB: z.array(z.object({ database: z.literal('FitCircleCustomFoods'), store: z.literal('foods'), records: number.int().nonnegative() })).length(1) }).safeParse(input.manifest);
      if (!manifest.success || !Array.isArray(customFoods) ||
          JSON.stringify([...manifest.data.localStorageKeys].sort()) !== JSON.stringify(Object.keys(source).sort()) ||
          manifest.data.indexedDB[0].records !== customFoods.length) throw new Error('Backup manifest does not match its data; the file may be incomplete');
    }
  }
  const parsedFoods = foods.safeParse(customFoods);
  if (!parsedFoods.success) throw new Error('Invalid IndexedDB custom foods');
  const entries: Record<string, string> = Object.create(null);
  const ignoredKeys: string[] = [];
  for (const [key, value] of Object.entries(source)) {
    if (key === '__indexeddb_custom_foods' && !versioned) continue;
    if (!isAppKey(key)) { ignoredKeys.push(key); continue; }
    if (!versioned && (scalarKeys.has(key) || calculatorKeys.has(key) || goalKey.test(key)) && (value === null || typeof value === 'object')) throw new Error(`Invalid scalar in ${key}`);
    if (versioned && typeof value !== 'string') throw new Error(`Expected stored string for ${key}`);
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    if (raw === undefined) throw new Error(`Invalid value in ${key}`);
    validateEntry(key, raw);
    entries[key] = raw;
  }
  if (!Object.keys(entries).length && !parsedFoods.data.length) throw new Error('No FitCircle data found');
  if (parsedFoods.data.length) {
    const deleted = new Set<string>(entries.fitcircle_deleted_builtin_foods ? JSON.parse(entries.fitcircle_deleted_builtin_foods) : []);
    const existing = entries.fitcircle_food_database ? JSON.parse(entries.fitcircle_food_database) as z.infer<typeof food>[] : foods.parse(builtInFoods).filter(f => !deleted.has(f.id));
    // localStorage is the current authoritative store. Keep its edits on ID collisions.
    const merged = new Map(parsedFoods.data.map(f => [f.id, f]));
    for (const f of existing) merged.set(f.id, f);
    entries.fitcircle_food_database = JSON.stringify([...merged.values()]);
  }
  if (entries.fitcircle_food_database) entries.fitcircle_food_database_migrated = 'true';
  return { entries, ignoredKeys };
}

const JOURNAL = 'fitcircle_restore_journal_v2';
function rollback(previous: Record<string, string | null>, storage: Storage) {
  // Free newly occupied space first, then restore the original values.
  // A failed first write may have left every original value intact. Do not
  // remove those bytes just to write them back through the same failing store.
  const changed = Object.entries(previous).filter(([key,value]) => storage.getItem(key) !== value);
  for (const [key] of changed) storage.removeItem(key);
  for (const [key, value] of changed) if (value !== null) storage.setItem(key, value);
}
/** Complete a rollback after an interrupted restore before React reads any data. */
export function recoverInterruptedRestore(storage: Storage = localStorage, journal: Storage = localStorage) {
  const raw = journal.getItem(JOURNAL);
  if (!raw) return;
  const previous: unknown = JSON.parse(raw);
  if (!plain(previous) || Object.entries(previous).some(([k, v]) => !isAppKey(k) || (v !== null && typeof v !== 'string'))) throw new Error('Invalid restore recovery journal');
  rollback(previous as Record<string, string | null>, storage);
  journal.removeItem(JOURNAL);
}
export function applyRestore(plan: RestorePlan, storage: Storage = localStorage, journal: Storage = localStorage) {
  // Revalidate caller-supplied plans before changing any storage.
  for (const [key, value] of Object.entries(plan.entries)) {
    if (!isAppKey(key)) throw new Error(`Unrecognized key: ${key}`);
    validateEntry(key, value);
  }
  const previous = Object.fromEntries(Object.keys(plan.entries).map(k => [k, storage.getItem(k)]));
  // Staging failure (e.g. quota) leaves existing data untouched.
  journal.setItem(JOURNAL, JSON.stringify(previous));
  try {
    for (const [key, value] of Object.entries(plan.entries)) storage.setItem(key, value);
  } catch (error) {
    try {
      rollback(previous, storage);
      journal.removeItem(JOURNAL);
    } catch {
      throw new Error('Restore interrupted. Reload to recover the saved original data before editing.');
    }
    throw new Error(`Restore failed; original data restored: ${error instanceof Error ? error.message : 'storage error'}`);
  }
  journal.removeItem(JOURNAL);
}

/** The only relevant legacy IndexedDB database is FitCircleCustomFoods/foods.
 * Export it explicitly; never enumerate or alter unrelated origin databases. */
export async function readIndexedFoods(factory: IDBFactory = indexedDB): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    let db: IDBDatabase | undefined;
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      db?.close();
      reject(new Error('Cannot read FitCircleCustomFoods/foods. Close other FitCircle tabs and retry; no complete backup was produced.'));
    };
    let request: IDBOpenDBRequest;
    try { request = factory.open('FitCircleCustomFoods', 1); } catch { fail(); return; }
    request.onupgradeneeded = () => {
      // Retain the existing empty legacy-schema initialization used by the food
      // service. Never delete records, rename stores or migrate databases.
      try {
        if (!request.result.objectStoreNames.contains('foods')) request.result.createObjectStore('foods', { keyPath: 'id' });
      } catch { request.transaction?.abort(); fail(); }
    };
    request.onblocked = fail;
    request.onerror = fail;
    request.onsuccess = () => {
      db = request.result;
      if (settled) { db.close(); return; }
      try {
        if (!db.objectStoreNames.contains('foods')) { fail(); return; }
        const tx = db.transaction('foods', 'readonly');
        const read = tx.objectStore('foods').getAll();
        tx.onabort = fail;
        tx.onerror = fail;
        read.onerror = fail;
        tx.oncomplete = () => {
          db?.close();
          if (settled) return;
          settled = true;
          resolve(read.result);
        };
      } catch { fail(); }
    };
  });
}
export async function createBackup(storage: Storage = localStorage, factory: IDBFactory = indexedDB): Promise<Backup> {
  // Never call a partially applied restore a complete backup. Recovery remains
  // the existing explicit startup path; exporting does not write any data.
  if (storage.getItem(JOURNAL) !== null) throw new Error('Reload to recover the interrupted restore before exporting a backup');
  const customFoods = await readIndexedFoods(factory);
  const entries: Record<string, string> = Object.create(null);
  const length = storage.length;
  for (let i = 0; i < length; i++) {
    const key = storage.key(i);
    if (key === null) throw new Error('Could not enumerate storage; retry the backup');
    if (!isAppKey(key)) continue;
    let raw: string | null;
    try { raw = storage.getItem(key); } catch { throw new Error(`Cannot read backup source: ${key}`); }
    if (raw === null) throw new Error(`Backup source disappeared while reading: ${key}`);
    entries[key] = raw;
  }
  if (storage.length !== length) throw new Error('Storage changed while reading; retry the backup');
  const backup: Backup = {
    format: 'fitcircle-backup', version: 2, createdAt: new Date().toISOString(),
    localStorage: entries, indexedDB: { customFoods },
    manifest: { version: 1, localStorageKeys: Object.keys(entries).sort(), indexedDB: [{ database: 'FitCircleCustomFoods', store: 'foods', records: customFoods.length }] },
  };
  prepareRestore(backup);
  return backup;
}
