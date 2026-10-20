import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import {
  consumedServingText,
  dailyNutrition,
  calorieBalance,
  scaleNutrients,
  per100gForFood,
  nutritionWeek,
  readNutritionGoals,
  saveNutritionGoals,
  readCalculatorEstimate,
} from "../client/src/lib/nutrition";
import {
  readFoodDay,
  saveFoodDay,
  assertLoggableFood,
} from "../client/src/lib/food-diary";
import {
  normalizeBarcode,
  expandUPCE,
  barcodeIdentity,
} from "../client/src/lib/barcode";
import {
  normalizeOpenFoodFacts,
  lookupBarcode,
} from "../client/src/lib/barcode-lookup";
import {
  createBackup,
  applyRestore,
  prepareRestore,
} from "../client/src/lib/backup";
import type { FoodEntry } from "../client/src/lib/local-food-service";
class MemoryStorage implements Storage {
  values = new Map<string, string>();
  fail = false;
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.fail) throw new Error("Synthetic quota");
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  clear() {
    this.values.clear();
  }
}
const food: FoodEntry = {
  id: "synthetic-food",
  name: "Synthetic food",
  quantity: 40,
  unit: "g",
  calories: 100,
  protein: 5,
  carbs: 12,
  fat: 3,
  servings: 1.5,
  sodium: 0,
  meal: "breakfast",
  timestamp: "2026-10-19T12:00:00Z",
};
const goals = {
  calories: 2100,
  protein: 120,
  carbs: 240,
  fat: 70,
  purpose: "Maintain weight" as const,
};
test("calories distinguish remaining, exact target and positive excess without negative remainder", () => {
  assert.deepEqual(calorieBalance(1158, 2000), {
    remaining: 842,
    over: 0,
    percent: 57.9,
  });
  assert.deepEqual(calorieBalance(2000, 2000), {
    remaining: 0,
    over: 0,
    percent: 100,
  });
  assert.deepEqual(calorieBalance(2400, 2000), {
    remaining: 0,
    over: 400,
    percent: 120,
  });
  assert.equal(calorieBalance(0, 0).percent, 0);
});
test("serving scaling preserves explicit zeros and unknown nutrients; totals count data coverage", () => {
  const scaled = scaleNutrients(food, 2.5);
  assert.equal(scaled.calories, 250);
  assert.equal(scaled.sodium, 0);
  assert.equal(scaled.fiber, undefined);
  for (const invalid of [0, -1, NaN, Infinity])
    assert.throws(() => scaleNutrients(food, invalid));
  const totals = dailyNutrition([
    food,
    {
      ...food,
      id: "b",
      servings: 2,
      fiber: 4,
      sodium: undefined,
      vitaminC: 10,
    },
  ]);
  assert.equal(totals.calories.value, 350);
  assert.deepEqual(totals.sodium, { value: 0, known: 1, total: 2 });
  assert.deepEqual(totals.fiber, { value: 8, known: 1, total: 2 });
  assert.deepEqual(totals.vitaminA, { value: 0, known: 0, total: 2 });
  assert.equal(totals.vitaminC.value, 20);
});
test("weekly averages exclude unlogged days and unreadable days, retaining explicit zero-intake records", () => {
  const week = nutritionWeek("2026-10-20", (date) => {
    if (date === "2026-10-16") throw new Error("Malformed");
    return date === "2026-10-19"
      ? [{ ...food, servings: 2 }]
      : date === "2026-10-20"
        ? [{ ...food, calories: 0, servings: 1 }]
        : [];
  });
  assert.equal(week.days, 2);
  assert.equal(week.averages.calories, 100);
  assert.deepEqual(week.unavailable, ["2026-10-16"]);
  assert.equal(nutritionWeek("2026-10-20", () => []).averages.calories, null);
});
test("goals are explicit, metadata preserving, finite and independent of calculator updates", () => {
  const storage = new MemoryStorage();
  assert.equal(readNutritionGoals(storage), null);
  assert.equal(storage.length, 0);
  saveNutritionGoals({ ...goals, retained: "synthetic" }, storage);
  storage.setItem("fitness_calc_target_calories", "9999");
  saveNutritionGoals({ ...goals, protein: 0 }, storage);
  assert.equal(readNutritionGoals(storage)?.calories, 2100);
  assert.equal(readNutritionGoals(storage)?.retained, "synthetic");
  assert.equal(readNutritionGoals(storage)?.protein, 0);
  const raw = storage.getItem("fitcircle_nutrition_goals");
  storage.fail = true;
  assert.throws(() =>
    saveNutritionGoals({ ...goals, calories: 2200 }, storage),
  );
  assert.equal(storage.getItem("fitcircle_nutrition_goals"), raw);
  storage.fail = false;
  for (const invalid of [0, -1, NaN, Infinity])
    assert.throws(() =>
      saveNutritionGoals({ ...goals, calories: invalid }, storage),
    );
  storage.setItem("fitcircle_nutrition_goals", "{");
  assert.throws(() => saveNutritionGoals(goals, storage));
  assert.equal(storage.getItem("fitcircle_nutrition_goals"), "{");
});
test("calculator estimates require all targets and do not write goals", () => {
  const storage = new MemoryStorage();
  assert.equal(readCalculatorEstimate(storage), null);
  for (const [key, value] of Object.entries(goals))
    if (key !== "purpose")
      storage.setItem(`fitness_calc_target_${key}`, String(value));
  assert.equal(readCalculatorEstimate(storage)?.calories, 2100);
  assert.equal(storage.getItem("fitcircle_nutrition_goals"), null);
  storage.setItem("fitness_calc_target_protein", "NaN");
  assert.equal(readCalculatorEstimate(storage), null);
});
test("diary changes persist only to the selected date, preserving raw bytes on load, quota, conflict and malformed data", () => {
  const storage = new MemoryStorage();
  const date = "2026-10-19";
  const raw = JSON.stringify([{ ...food, unknown: { retain: true } }]);
  storage.setItem(`fitcircle_food_${date}`, raw);
  storage.setItem("fitcircle_food_2026-10-20", "[]");
  assert.equal(readFoodDay(date, storage).raw, raw);
  assert.equal(storage.getItem(`fitcircle_food_${date}`), raw);
  const entries = readFoodDay(date, storage).entries;
  storage.fail = true;
  assert.throws(() => saveFoodDay(date, [...entries, food], raw, storage));
  assert.equal(storage.getItem(`fitcircle_food_${date}`), raw);
  storage.fail = false;
  saveFoodDay(date, [...entries, { ...food, id: "new" }], raw, storage);
  assert.equal(storage.getItem("fitcircle_food_2026-10-20"), "[]");
  assert.throws(() => saveFoodDay(date, [], raw, storage), /another view/);
  assert.deepEqual(
    JSON.parse(storage.getItem(`fitcircle_food_${date}`)!)[0].unknown,
    { retain: true },
  );
  for (const bad of ["{", "{}", "null", "[{}]"]) {
    storage.setItem(`fitcircle_food_${date}`, bad);
    assert.throws(() => readFoodDay(date, storage));
    assert.throws(() => saveFoodDay(date, [], bad, storage));
    assert.equal(storage.getItem(`fitcircle_food_${date}`), bad);
  }
});
test("retail barcode validation supports UPC-A, UPC-E, EAN-13 and EAN-8 and rejects invalid check digits", () => {
  assert.equal(normalizeBarcode("036000291452"), "036000291452");
  assert.equal(barcodeIdentity("036000291452"), "0036000291452");
  assert.equal(normalizeBarcode("3017620422003"), "3017620422003");
  assert.equal(normalizeBarcode("96385074"), "96385074");
  assert.equal(expandUPCE("04252614"), "042100005264");
  assert.equal(normalizeBarcode("04252614", true), "042100005264");
  for (const invalid of ["", "abcd", "123", "3017620422004", "0000000!"])
    assert.throws(() => normalizeBarcode(invalid));
});
const product = (
  nutriments: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) => ({
  status: 1,
  product: {
    code: "3017620422003",
    product_name: "Synthetic packaged food",
    brands: "Synthetic brand",
    nutriments,
    ...extra,
  },
});
test("OFF per-100g nutrition uses normalized grams, converts salt/sodium and minerals and keeps missing nutrients blank", () => {
  const draft = normalizeOpenFoodFacts(
    product({
      "energy-kcal_100g": 250,
      proteins_100g: 8,
      carbohydrates_100g: 40,
      fat_100g: 6,
      fiber_100g: 0,
      salt_100g: 1.5,
      salt_unit: "g",
      calcium_100g: 0.12,
      calcium_unit: "mg",
      "vitamin-a_100g": 0.0008,
      "vitamin-a_unit": "µg",
    }),
    "3017620422003",
  );
  assert.equal(draft.quantity, "100");
  assert.equal(draft.unit, "g");
  assert.equal(draft.values.sodium, "600");
  assert.equal(draft.values.calcium, "120");
  assert.equal(draft.values.vitaminA, "800");
  assert.equal(draft.values.fiber, "0");
  assert.equal(draft.values.sugar, "");
  const sodium = normalizeOpenFoodFacts(
    product({ sodium_100g: 0.2, sodium_unit: "mg", salt_100g: 1 }),
    "3017620422003",
  );
  assert.equal(sodium.values.sodium, "200");
});
test("OFF per-serving, unknown serving weights, kJ and invalid/incomplete records are handled without guessing", () => {
  const serving = normalizeOpenFoodFacts(
    product(
      {
        "energy-kj_serving": 418.4,
        proteins_serving: 2,
        carbohydrates_serving: 10,
        fat_serving: 3,
        sodium_serving: 0.01,
      },
      { serving_size: "1 bar (40 g)" },
    ),
    "3017620422003",
  );
  assert.equal(serving.quantity, "40");
  assert.equal(serving.unit, "g");
  assert.equal(serving.values.calories, "100");
  assert.equal(serving.values.sodium, "10");
  const unknown = normalizeOpenFoodFacts(
    product({ fat_serving: 0 }, { serving_size: "one cup" }),
    "3017620422003",
  );
  assert.equal(unknown.unit, "serving");
  assert.equal(unknown.quantity, "1");
  assert.equal(unknown.values.protein, "");
  const invalid = normalizeOpenFoodFacts(
    product({
      proteins_100g: -3,
      fat_100g: "NaN",
      "vitamin-a_100g": 1,
      "vitamin-a_unit": "IU",
    }),
    "3017620422003",
  );
  assert.equal(invalid.values.protein, "");
  assert.equal(invalid.values.fat, "");
  assert.equal(invalid.values.vitaminA, "");
  assert.throws(() => normalizeOpenFoodFacts({ status: 0 }, "3017620422003"));
  assert.throws(() =>
    normalizeOpenFoodFacts(
      product({}, { code: "036000291452" }),
      "3017620422003",
    ),
  );
});
test("lookup is local-first and offline-safe, requests only product fields, and throttles external repeats", async () => {
  let fetched = 0;
  const fetcher: typeof fetch = async (input, init) => {
    assert.equal(init?.mode, "cors");
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.headers, undefined);
    fetched++;
    assert.match(String(input), /app_name=FitCircle/);
    return new Response(JSON.stringify(product({ proteins_100g: 3 })), {
      status: 200,
    });
  };
  assert.equal(
    (
      await lookupBarcode(
        "3017620422003",
        async () => ({ ...food, barcode: "3017620422003" }),
        { online: false, fetcher },
      )
    ).local?.name,
    food.name,
  );
  assert.equal(fetched, 0);
  await assert.rejects(
    () =>
      lookupBarcode("3017620422003", async () => null, {
        online: false,
        fetcher,
      }),
    /not saved locally/,
  );
  const result = await lookupBarcode("3017620422003", async () => null, {
    online: true,
    fetcher,
  });
  assert.equal(result.draft.values.protein, "3");
  assert.equal(fetched, 1);
  await assert.rejects(
    () =>
      lookupBarcode("3017620422003", async () => null, {
        online: true,
        fetcher,
      }),
    /wait/,
  );
  assert.equal(fetched, 1);
});
test("complete and legacy backup round trips retain confirmed goals, scanned metadata and every nutrient", async () => {
  const source = new MemoryStorage();
  saveNutritionGoals(goals, source);
  const scanned = {
    ...food,
    id: "custom-scan",
    barcode: "3017620422003",
    vitaminC: 5,
    source: "Open Food Facts",
    sourceUrl: "https://world.openfoodfacts.org/product/3017620422003",
  };
  source.setItem("fitcircle_food_database", JSON.stringify([scanned]));
  source.setItem("fitcircle_food_2026-10-19", JSON.stringify([scanned]));
  source.setItem("other-app", "keep");
  const backup = await createBackup(source, new IDBFactory());
  const destination = new MemoryStorage();
  destination.setItem("other-app", "retain");
  applyRestore(prepareRestore(backup), destination, destination);
  assert.deepEqual(readNutritionGoals(destination), goals);
  assert.equal(
    destination.getItem("fitcircle_food_database"),
    source.getItem("fitcircle_food_database"),
  );
  assert.equal(destination.getItem("other-app"), "retain");
  assert.equal(
    destination.getItem("fitcircle_food_2026-10-19"),
    source.getItem("fitcircle_food_2026-10-19"),
  );
  assert.equal(
    JSON.parse(destination.getItem("fitcircle_food_2026-10-19")!)[0].fiber,
    undefined,
  );
  const legacy = new MemoryStorage();
  applyRestore(
    prepareRestore({
      fitcircle_food_2026_ignored: [],
      fitcircle_food_2026_10_19: [],
      fitcircle_food_2026_10: [],
      "fitcircle_food_2026-10-19": [food],
    }),
    legacy,
    legacy,
  );
  assert.deepEqual(readFoodDay("2026-10-19", legacy).entries, [food]);
  assert.equal(readNutritionGoals(legacy), null);
});

test("current OFF v3 normalized sets respect 100ml and serving bases and units without mixing missing values", () => {
  const draft = normalizeOpenFoodFacts(
    {
      status: "success",
      product: {
        code: "3017620422003",
        product_name: "Synthetic liquid",
        nutrition: {
          aggregated_set: {
            per: "100ml",
            preparation: "as_sold",
            nutrients: {
              "energy-kcal": { value: 60, unit: "kcal" },
              proteins: { value: 3, unit: "g" },
              sodium: { value: 0.12, unit: "g" },
              calcium: { value: 120, unit: "mg" },
              "vitamin-a": { value: 800, unit: "µg" },
              fat: { value: null, unit: "g" },
            },
          },
        },
      },
    },
    "3017620422003",
  );
  assert.equal(draft.unit, "ml");
  assert.equal(draft.quantity, "100");
  assert.equal(draft.values.sodium, "120");
  assert.equal(draft.values.calcium, "120");
  assert.equal(draft.values.vitaminA, "800");
  assert.equal(draft.values.fat, "");
  const serving = normalizeOpenFoodFacts(
    {
      status: "success",
      product: {
        nutrition: {
          input_sets: [
            {
              per: "serving",
              per_quantity: 40,
              per_unit: "g",
              source: "packaging",
              preparation: "as_sold",
              nutrients: {
                proteins: { value: 3, unit: "g" },
                sodium: { value: 200, unit: "mg" },
                iron: { value: 1, unit: "mg", modifier: "<" },
              },
            },
          ],
        },
      },
    },
    "3017620422003",
  );
  assert.equal(serving.quantity, "40");
  assert.equal(serving.values.protein, "3");
  assert.equal(serving.values.sodium, "200");
  assert.equal(serving.values.iron, "");
  assert.equal(serving.values.calories, "");
});

test("new per-100g references convert ounces and do not invent cup, piece or serving mass", () => {
  assert.equal(
    per100gForFood({ ...food, quantity: 40, unit: "g" })?.calories,
    250,
  );
  assert.ok(
    Math.abs(
      per100gForFood({ ...food, quantity: 1, unit: "oz" })!.calories -
        352.7396194958041,
    ) < 0.0001,
  );
  for (const unit of ["cup", "piece", "serving", "ml", "slice"] as const)
    assert.equal(per100gForFood({ ...food, unit }), undefined);
});

test("the shared entry workflow rejects invalid new foods without interpreting unknown nutrients as zero", () => {
  assert.doesNotThrow(() => assertLoggableFood(food));
  assert.doesNotThrow(() =>
    assertLoggableFood({ ...food, fiber: undefined, sodium: 0 }),
  );
  for (const patch of [
    { calories: -1 },
    { protein: NaN },
    { fat: Infinity },
    { sodium: -2 },
    { quantity: 0 },
  ])
    assert.throws(() => assertLoggableFood({ ...food, ...patch }));
});

test("ambiguous multipack serving weights and bounded legacy salt never become exact nutrition data", () => {
  for (const serving_size of ["2 × 30 g", "2 x 30g", "2*30g", "2 x (30 g)"]) {
    const draft = normalizeOpenFoodFacts(
      product(
        { proteins_serving: 2, salt_serving: 0.5, salt_modifier: "<" },
        { serving_size },
      ),
      "3017620422003",
    );
    assert.equal(draft.quantity, "1");
    assert.equal(draft.unit, "serving");
    assert.equal(draft.values.sodium, "");
    assert.equal(draft.values.protein, "2");
  }
  const explicit = normalizeOpenFoodFacts(
    product({ proteins_serving: 2 }, { serving_size: "1 bar (40 g)" }),
    "3017620422003",
  );
  assert.equal(explicit.quantity, "40");
  assert.equal(explicit.unit, "g");
  assert.throws(
    () =>
      normalizeOpenFoodFacts(
        product({}, { code: 3017620422003 }),
        "3017620422003",
      ),
    /does not match/,
  );
});

test("cancelled local lookup never starts an external request", async () => {
  const controller = new AbortController();
  let fetched = false;
  await assert.rejects(
    () =>
      lookupBarcode(
        "3017620422003",
        async () => {
          controller.abort();
          return null;
        },
        {
          signal: controller.signal,
          fetcher: async () => {
            fetched = true;
            return new Response();
          },
        },
      ),
    /cancelled/,
  );
  assert.equal(fetched, false);
});

test("consumed serving explanation separates the base quantity from its multiplier", () => {
  assert.equal(
    consumedServingText(40, "g", "2.5"),
    "2.5 × 40 g = 100 g consumed",
  );
  for (const invalid of ["", "0", "-1", "Infinity", "abc"])
    assert.match(consumedServingText(40, "g", invalid), /positive/);
});

test("positive trace nutrients remain positive rather than being rounded into confirmed zeros", () => {
  const draft = normalizeOpenFoodFacts(
    product({ iron_100g: 0.00000001, iron_unit: "g", fiber_100g: 0 }),
    "3017620422003",
  );
  assert.equal(Number(draft.values.iron), 0.00001);
  assert.equal(draft.values.fiber, "0");
  assert.equal(draft.values.sugar, "");
});
