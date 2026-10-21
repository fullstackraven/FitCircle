import { IDBFactory } from "fake-indexeddb";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readMeasurementSnapshot,
  readWeightGoals,
  weightGoalProgress,
  saveMeasurements,
  saveMeasurementGoals,
} from "../client/src/lib/measurement-integration";
import {
  readNutritionGoals,
  saveNutritionGoals,
} from "../client/src/lib/nutrition";
class Store implements Storage {
  values = new Map<string, string>();
  fail = "";
  get length() {
    return this.values.size;
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (k === this.fail) {
      this.fail = "";
      throw Error("Synthetic quota");
    }
    this.values.set(k, v);
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
  clear() {
    this.values.clear();
  }
}
const today = "2026-10-20";
function fixture() {
  const s = new Store();
  s.setItem("fitcircle_profile", JSON.stringify({ age: 30, gender: "male" }));
  s.setItem(
    "fitcircle_measurements_history",
    JSON.stringify({
      weight: [
        { date: "2026-10-01", value: 200 },
        { date: "2026-10-20", value: 190 },
        { date: "2026-10-10", value: 195 },
      ],
      height: [{ date: "2026-01-01", value: 70 }],
      bodyFat: [],
    }),
  );
  return s;
}
test("latest valid measurements are date sorted, unit explicit and read-only", () => {
  const s = fixture(),
    before = [...s.values];
  const m = readMeasurementSnapshot(s, today);
  assert.equal(m.weight?.value, 190);
  assert.equal(m.height?.value, 70);
  assert.equal(m.startWeight?.value, 200);
  assert.deepEqual([...s.values], before);
});
test("recorded start gives directional progress, never proximity ratios or invented starts", () => {
  assert.equal(weightGoalProgress(200, 190, 180), 50);
  assert.equal(weightGoalProgress(150, 160, 170), 50);
  assert.equal(weightGoalProgress(null, 190, 180), null);
  assert.equal(weightGoalProgress(180, 180, 180), 100);
  assert.equal(weightGoalProgress(200, 210, 180), 0);
});
test("legacy goals preserve precedence and conflicting explicit intent", () => {
  const s = fixture();
  s.setItem(
    "fitcircle_goals",
    JSON.stringify({
      targetWeight: 180,
      weightGoalType: "gain",
      targetBodyFat: 15,
    }),
  );
  s.setItem("fitcircle_goal_weight", "175");
  const before = [...s.values],
    g = readWeightGoals(s, 190);
  assert.equal(g.targetWeight, 180);
  assert.equal(g.intent, "gain");
  assert.equal(g.inferred, "lose");
  assert.ok(g.conflicts.length);
  assert.deepEqual([...s.values], before);
});
test("explicit measurement and goal saves preserve unknown goals and rollback quota failures", () => {
  const s = fixture();
  s.setItem("fitcircle_goals", '{"targetWeight":180,"hydrationOz":72}');
  const before = s.getItem("fitcircle_measurements_history");
  s.fail = "fitcircle_weight";
  assert.throws(() => saveMeasurements({ weight: 185 }, today, s));
  assert.equal(s.getItem("fitcircle_measurements_history"), before);
  saveMeasurementGoals({ targetWeight: 175, intent: "lose" }, s);
  assert.equal(JSON.parse(s.getItem("fitcircle_goals")!).hydrationOz, 72);
  assert.equal(s.getItem("fitcircle_goal_weight"), "175");
});
test("invalid, future and unsorted samples are excluded without changing raw history", () => {
  const s = fixture();
  const raw = JSON.stringify({
    weight: [
      { date: "2026-10-20", value: 190 },
      { date: "2026-99-99", value: 220 },
      { date: "2027-01-01", value: 300 },
      { date: "2026-10-19", value: -2 },
      { date: "2026-10-18", value: 195 },
    ],
    height: [],
  });
  s.setItem("fitcircle_measurements_history", raw);
  assert.equal(readMeasurementSnapshot(s, today).weight?.value, 190);
  assert.equal(s.getItem("fitcircle_measurements_history"), raw);
});
test("legacy undated values are labeled and never override a present history record", () => {
  const s = new Store();
  s.setItem("fitcircle_weight", "180");
  s.setItem("fitcircle_height", "68");
  assert.equal(readMeasurementSnapshot(s, today).weight?.source, "legacy");
  assert.equal(readMeasurementSnapshot(s, today).startWeight, null);
  s.setItem("fitcircle_measurements_history", "{}");
  assert.equal(readMeasurementSnapshot(s, today).weight, null);
});
test("gain, loss and maintenance inference preserves explicit contradictory direction", () => {
  for (const [target, inferred] of [
    [180, "lose"],
    [200, "gain"],
    [190.2, "maintain"],
  ] as const) {
    const s = fixture();
    s.setItem("fitcircle_goal_weight", String(target));
    assert.equal(readWeightGoals(s, 190).inferred, inferred);
    s.setItem("fitcircle_weight_goal_type", "gain");
    assert.equal(readWeightGoals(s, 190).intent, "gain");
  }
});
test("stale measurement saves and invalid goal edits preserve originals", () => {
  const s = fixture(),
    raw = s.getItem("fitcircle_measurements_history");
  saveMeasurements({ weight: 185 }, today, s);
  const next = s.getItem("fitcircle_measurements_history");
  assert.throws(() => saveMeasurements({ weight: 180 }, today, s, raw));
  assert.equal(s.getItem("fitcircle_measurements_history"), next);
  assert.throws(() => saveMeasurementGoals({ targetBodyFat: 110 }, s));
  assert.equal(s.getItem("fitcircle_goal_bodyfat"), null);
});
test("complete and legacy backups preserve confirmed targets, measurement history and calculator preferences", async () => {
  const { createBackup, prepareRestore, applyRestore } =
    await import("../client/src/lib/backup");
  const s = fixture();
  s.setItem("fitcircle_goals", '{"targetWeight":180,"weightGoalType":"lose"}');
  s.setItem("fitness_calc_goal_rate", "0.5");
  saveNutritionGoals(
    {
      calories: 2200,
      protein: 150,
      carbs: 250,
      fat: 67,
      source: "calculator",
    },
    s,
  );
  const backup = await createBackup(s, new IDBFactory());
  const restored = new Store();
  applyRestore(prepareRestore(backup), restored, restored);
  for (const [key, value] of s.values)
    assert.equal(restored.getItem(key), value);
  const legacy = new Store();
  applyRestore(prepareRestore(Object.fromEntries(s.values)), legacy, legacy);
  assert.equal(
    legacy.getItem("fitcircle_nutrition_goals"),
    s.getItem("fitcircle_nutrition_goals"),
  );
});
test("unavailable storage and malformed confirmed goals cannot be replaced by defaults", () => {
  const s = fixture();
  s.setItem("fitcircle_nutrition_goals", "{");
  assert.throws(() =>
    saveNutritionGoals(
      { calories: 2000, protein: 120, carbs: 200, fat: 60 },
      s,
    ),
  );
  assert.equal(s.getItem("fitcircle_nutrition_goals"), "{");
  const unavailable = new Store();
  unavailable.getItem = () => {
    throw Error("Unavailable");
  };
  assert.throws(
    () => readMeasurementSnapshot(unavailable, today),
    /Unavailable/,
  );
  assert.equal(unavailable.length, 0);
});

test("shared weight-goal readers use the same recorded baseline without read-time migrations", async () => {
  const { getWeightProgress, getAllTimeGoalPercentages, getAllGoals } =
    await import("../client/src/lib/goals-utils");
  const s = fixture();
  s.setItem("fitcircle_goals", '{"targetWeight":180}');
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    value: s,
    configurable: true,
  });
  try {
    const before = [...s.values];
    assert.equal(getWeightProgress().percentage, 50);
    assert.equal(getAllTimeGoalPercentages().targetWeight, 50);
    assert.equal(getAllGoals().targetWeight, 180);
    assert.deepEqual([...s.values], before);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("ambiguous or malformed measurement inputs stay unchanged across repeated calculator reads", () => {
  const s = fixture();
  for (const raw of [
    "{",
    "null",
    '{"weight":"unexpected"}',
    JSON.stringify({
      weight: [
        { date: today, value: 190 },
        { date: today, value: 185 },
      ],
    }),
  ]) {
    s.setItem("fitcircle_measurements_history", raw);
    for (let i = 0; i < 3; i++)
      assert.throws(() => readMeasurementSnapshot(s, today));
    assert.equal(s.getItem("fitcircle_measurements_history"), raw);
  }
});

test("calculator progress honors explicit loss, gain and maintenance intent", () => {
  assert.equal(weightGoalProgress(180, 180, 180, "lose"), 100);
  assert.equal(weightGoalProgress(180, 180, 180, "gain"), 100);
  assert.equal(weightGoalProgress(180, 185, 180, "lose"), 0);
  assert.equal(weightGoalProgress(200, 190, 180, "lose"), 50);
  assert.equal(weightGoalProgress(200, 210, 180, "lose"), 0);
  assert.equal(weightGoalProgress(150, 160, 170, "gain"), 50);
  assert.equal(weightGoalProgress(150, 140, 170, "gain"), 0);
  assert.equal(weightGoalProgress(200, 190, 180, "gain"), null);
  assert.equal(weightGoalProgress(150, 160, 170, "lose"), null);
  assert.equal(weightGoalProgress(200, 175, 180, "lose"), 100);
  assert.equal(weightGoalProgress(150, 175, 170, "gain"), 100);
  assert.equal(weightGoalProgress(null, 180.5, 180, "maintain"), 100);
  assert.equal(weightGoalProgress(200, 190, 180, "maintain"), 0);
  assert.equal(weightGoalProgress(200, 179.4, 180, "maintain"), 0);
});
