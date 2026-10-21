import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nutrientReferences,
  nutrientProgress,
  formatNutrientAmount,
} from "../client/src/lib/nutrient-references";
import { dailyNutrition } from "../client/src/lib/nutrition";
import type { FoodEntry } from "../client/src/lib/local-food-service";
const targets = { calories: 2000, protein: 150, carbs: 225, fat: 65 };
test("adult DRI age/sex references and energy references use appropriate units", () => {
  const male = nutrientReferences({ age: 31, sex: "male" }, targets),
    female = nutrientReferences({ age: 31, sex: "female" }, targets);
  assert.equal(male.calcium?.value, 1000);
  assert.equal(male.iron?.value, 8);
  assert.equal(female.iron?.value, 18);
  assert.equal(male.potassium?.value, 3400);
  assert.equal(female.potassium?.value, 2600);
  assert.equal(male.vitaminC?.value, 90);
  assert.equal(female.vitaminC?.value, 75);
  assert.equal(male.fiber?.value, 28);
  assert.equal(male.fiber?.source, "energy");
  assert.equal(male.saturatedFat?.value, (2000 * 0.1) / 9);
  assert.equal(male.sodium?.value, 2300);
  assert.equal(male.sodium?.kind, "limit");
  assert.equal(male.saturatedFat?.kind, "limit");
  assert.equal(male.calcium?.kind, "intake");
  assert.equal(male.calories?.kind, "target");
});
test("DRI age bands include sex-independent childhood and older-adult values", () => {
  for (const [age, calcium, iron, sodium] of [
    [1, 700, 7, 1200],
    [4, 1000, 10, 1500],
    [9, 1300, 8, 1800],
    [14, 1300, 11, 2300],
    [19, 1000, 8, 2300],
    [51, 1000, 8, 2300],
    [71, 1200, 8, 2300],
  ]) {
    const ref = nutrientReferences({ age, sex: "male" });
    assert.equal(ref.calcium?.value, calcium);
    assert.equal(ref.iron?.value, iron);
    assert.equal(ref.sodium?.value, sodium);
  }
  assert.equal(
    nutrientReferences({ age: 51, sex: "female" }).calcium?.value,
    1200,
  );
  assert.equal(nutrientReferences({ age: 51 }).calcium, undefined);
  assert.equal(nutrientReferences({ age: 71 }).calcium?.value, 1200);
  assert.equal(nutrientReferences({ age: 13 }).vitaminC?.value, 45);
  assert.equal(nutrientReferences({ age: 14 }).vitaminC, undefined);
});
test("fiber AI fallback is age/sex appropriate; energy does not invent infant recommendations", () => {
  for (const [age, sex, value] of [
    [8, "female", 25],
    [13, "male", 31],
    [13, "female", 26],
    [18, "male", 38],
    [18, "female", 26],
    [31, "male", 38],
    [31, "female", 25],
    [60, "male", 30],
    [60, "female", 21],
  ] as const)
    assert.equal(nutrientReferences({ age, sex }).fiber?.value, value);
  assert.equal(nutrientReferences({ age: 31 }, targets).fiber?.value, 28);
  assert.equal(nutrientReferences({ age: 31 }).fiber, undefined);
  assert.equal(nutrientReferences({ age: 1 }, targets).saturatedFat, undefined);
  assert.equal(
    nutrientReferences({ age: 2 }, targets).saturatedFat?.kind,
    "limit",
  );
});
test("missing and invalid profile values do not become demographic defaults or micronutrient formulas", () => {
  for (const age of [undefined, null, 0, -1, NaN, Infinity, "31", 31.5, 121]) {
    const ref = nutrientReferences({ age, sex: "male" }, targets);
    assert.equal(ref.calcium, undefined);
    assert.equal(ref.sodium, undefined);
    assert.equal(ref.fiber, undefined);
    assert.equal(ref.calories?.value, 2000);
  }
  const ref = nutrientReferences({ age: 31, sex: "unknown" }, targets);
  assert.equal(ref.iron, undefined);
  assert.equal(ref.potassium, undefined);
  assert.equal(ref.vitaminC, undefined);
  assert.equal(ref.calcium?.value, 1000);
});
test("sugar and cholesterol use applicable published label comparators, vitamin A stays unit-safe", () => {
  const refs = nutrientReferences({ age: 31, sex: "female" }, targets);
  assert.deepEqual(refs.sugar, {
    value: 90,
    kind: "reference",
    source: "label-reference",
  });
  assert.deepEqual(refs.cholesterol, {
    value: 300,
    kind: "reference",
    source: "label-reference",
  });
  assert.equal(refs.vitaminA, undefined);
});
test("references are read-only; no reference for zero/invalid goals, no fictional calorie fallback", () => {
  const source = { ...targets };
  const original = JSON.stringify(source);
  nutrientReferences({ age: 31, sex: "female" }, source);
  assert.equal(JSON.stringify(source), original);
  for (const value of [0, -1, NaN, Infinity, 100001]) {
    const ref = nutrientReferences(
      { age: 31, sex: "female" },
      { ...targets, calories: value, protein: value },
    );
    assert.equal(ref.calories, undefined);
    assert.equal(ref.protein, undefined);
    assert.equal(ref.saturatedFat, undefined);
  }
  assert.equal(
    nutrientReferences({ age: 31, sex: "male" }).calories,
    undefined,
  );
});
test("progress is accurate below, at, above the reference and rejects invalid arithmetic", () => {
  assert.equal(nutrientProgress(508, 1000), 50.8);
  assert.equal(nutrientProgress(14, 28), 50);
  assert.equal(nutrientProgress(2300, 2300), 100);
  assert.equal(nutrientProgress(2450, 2300), 100);
  assert.equal(nutrientProgress(0, 28), 0);
  assert.equal(nutrientProgress(Number.MAX_VALUE, Number.MIN_VALUE), 100);
  for (const [actual, reference] of [
    [-1, 5],
    [NaN, 5],
    [Infinity, 5],
    [5, 0],
    [5, -1],
    [5, NaN],
    [5, Infinity],
  ])
    assert.equal(nutrientProgress(actual, reference), null);
  assert.equal(formatNutrientAmount(2450), "2,450");
  assert.equal(formatNutrientAmount(22.222222), "22.2");
  assert.equal(formatNutrientAmount(0.01), "< 0.1");
  assert.equal(formatNutrientAmount(0), "0");
  assert.equal(formatNutrientAmount(Infinity), "Not available");
});
test("reference rendering inputs do not change existing nutrient completeness or servings arithmetic", () => {
  const base = {
    id: "synthetic",
    name: "Synthetic food",
    quantity: 1,
    unit: "serving",
    calories: 100,
    protein: 1,
    carbs: 1,
    fat: 1,
    meal: "breakfast",
    timestamp: "2026-10-21T12:00:00Z",
    servings: 2,
    fiber: 0,
    calcium: 254,
  } as FoodEntry;
  const entries = [
    base,
    { ...base, id: "missing", fiber: undefined, calcium: undefined },
  ];
  const original = JSON.stringify(entries);
  const totals = dailyNutrition(entries);
  assert.deepEqual(totals.fiber, { value: 0, known: 1, total: 2 });
  assert.deepEqual(totals.calcium, { value: 508, known: 1, total: 2 });
  assert.deepEqual(totals.sugar, { value: 0, known: 0, total: 2 });
  nutrientReferences({ age: 31, sex: "male" }, targets);
  assert.equal(JSON.stringify(entries), original);
});

test("label comparators do not assume adult age or confuse total and added sugar", () => {
  for (const age of [undefined, NaN, -1, 0, 3, 18])
    assert.equal(nutrientReferences({ age }).sugar, undefined);
  for (const age of [undefined, NaN, 0, 3])
    assert.equal(nutrientReferences({ age }).cholesterol, undefined);
  assert.equal(nutrientReferences({ age: 4 }).cholesterol?.value, 300);
  assert.equal(nutrientReferences({ age: 19 }).sugar?.value, 90);
  assert.equal(
    nutrientReferences({ age: 31 }, { ...targets, calories: 4000 }).sugar
      ?.value,
    90,
  );
});
