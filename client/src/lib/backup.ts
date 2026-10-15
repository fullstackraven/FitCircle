import { z } from 'zod';
import builtInFoods from '../data/comprehensive-foods.json';

const number = z.number().finite();
const text = z.string();
const object = z.object({}).passthrough();
const record = z.record;
const shaped = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough();
const nutrients = { fiber: number.optional(), sugar: number.optional(), sodium: number.optional(), saturatedFat: number.optional(), potassium: number.optional(), cholesterol: number.optional(), vitaminA: number.optional(), vitaminC: number.optional(), calcium: number.optional(), iron: number.optional() };
const food = shaped({ ...nutrients, brand: text.optional(), barcode: text.optional(), nutritionPer100g: shaped({ calories: number, carbs: number, protein: number, fat: number, ...nutrients }).optional(), id: text.min(1), name: text.min(1), quantity: number.positive(), unit: z.enum(['g', 'oz', 'cup', 'piece', 'serving', 'ml', 'slice']), calories: number, carbs: number, protein: number, fat: number });
const foods = z.array(food);
const session = shaped({ id: text, time: text, duration: number });
const workout = shaped({ id: text, name: text, color: text, count: number, dailyGoal: number, scheduledDays: z.array(number.int().min(0).max(6)).optional(), goalHistory: z.array(shaped({ goal: number, timestamp: text })).optional() });
const dailyLog = record(z.union([number, shaped({ count: number, goalAtTime: number })]));
const schemas: Record<string, z.ZodTypeAny> = {
  'workout-tracker-data': shaped({ workouts: z.union([record(workout), z.array(workout)]), dailyLogs: record(dailyLog).optional(), journalEntries: record(z.union([text, shaped({ text, timestamp: text })])).optional(), routines: record(shaped({ id: text, name: text, selectedDays: z.array(number), createdAt: text })).optional() }),
  'workout-tracker-logs': record(dailyLog),
  fitcircle_food_database: foods,
  fitcircle_daily_quote: shaped({ text, author: text }),
  fitcircle_deleted_builtin_foods: z.array(text),
  fitcircle_hydration_data: shaped({ dailyGoalOz: number, currentDayOz: number, logs: record(shaped({ date: text, totalOz: number, entries: z.array(shaped({ time: text, amount: number })) })), lastDate: text }),
  fitcircle_meditation_logs: z.union([z.array(session.extend({ date: text })), shaped({ dailyLogs: record(shaped({ date: text, totalMinutes: number, sessions: z.array(session) })), lastDate: text, currentDayMinutes: number })]),
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
  fitcircle_goals: record(number),
  fitcircle_profile: object,
  fitcircle_wellness_weights: record(number),
  fitcircle_wellness_layout: z.array(text),
};
const scalarKeys = new Set(['fitcircle_username', 'fitcircle_age', 'fitcircle_weight', 'fitcircle_fitness_goal', 'fitcircle_weight_goal_type', 'fitcircle_device_id', 'fitcircle_food_database_migrated', 'fitcircle_auto_backup_enabled', 'fitcircle_last_auto_backup', 'fitcircle_quote_date', 'fitcircle_last_quote_index', 'fitcircle_height', 'fitcircle_body_fat', 'fitcircle_neck', 'fitcircle_chest', 'fitcircle_waist', 'fitcircle_hips', 'fitcircle_bicep_left', 'fitcircle_bicep_right', 'fitcircle_forearm_left', 'fitcircle_forearm_right', 'fitcircle_thigh_left', 'fitcircle_thigh_right', 'fitcircle_calf_left', 'fitcircle_calf_right']);
const calculatorKeys = new Set(['activity_level', 'goal_type', 'goal_rate', 'macro_style', 'custom_carbs', 'custom_protein', 'custom_fat', 'target_calories', 'target_carbs', 'target_protein', 'target_fat'].map(k => `fitness_calc_${k}`));
const goalKey = /^fitcircle_goal_(hydration|meditation|fasting|weight|bodyfat|cardio)$/;
const datedFoodKey = /^fitcircle_food_(?:tracker)?\d{4}-\d{2}-\d{2}$/;
// Preserve retired FitCircle data in backups, without reviving any removed feature.
const legacyKeys = new Set(['fitcircle_trainer_messages', 'fitcircle_notes', 'fitcircle_food_tracker', 'fitcircle_food_tracker_data', 'fitcircle_cardio', 'cardioLogs', 'cardio_entries', 'cardio']);
export function isAppKey(key: string): boolean {
  return Object.hasOwn(schemas, key) || scalarKeys.has(key) || calculatorKeys.has(key) || goalKey.test(key) || datedFoodKey.test(key) || legacyKeys.has(key);
}

export interface Backup {
  format: 'fitcircle-backup';
  version: 2;
  createdAt: string;
  localStorage: Record<string, string>;
  indexedDB: { customFoods: unknown[] };
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
  for (const key of Object.keys(previous)) storage.removeItem(key);
  for (const [key, value] of Object.entries(previous)) if (value !== null) storage.setItem(key, value);
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
    const request = factory.open('FitCircleCustomFoods', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('foods')) request.result.createObjectStore('foods', { keyPath: 'id' });
    };
    request.onblocked = () => reject(new Error('Close other FitCircle tabs to read the food database'));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('foods')) { db.close(); reject(new Error('Legacy food database is missing its foods store')); return; }
      const tx = db.transaction('foods', 'readonly');
      const read = tx.objectStore('foods').getAll();
      tx.oncomplete = () => { db.close(); resolve(read.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}
export async function createBackup(storage: Storage = localStorage, factory: IDBFactory = indexedDB): Promise<Backup> {
  const customFoods = await readIndexedFoods(factory);
  const entries: Record<string, string> = Object.create(null);
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isAppKey(key)) entries[key] = storage.getItem(key)!;
  }
  const backup: Backup = { format: 'fitcircle-backup', version: 2, createdAt: new Date().toISOString(), localStorage: entries, indexedDB: { customFoods } };
  prepareRestore(backup);
  return backup;
}
