import { z } from "zod";
import type { FoodEntry, LocalFoodItem } from "./local-food-service";
import { getDateString, parseLocalDate } from "./date-utils";

export const nutrientFields = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "sodium",
  "saturatedFat",
  "cholesterol",
  "potassium",
  "calcium",
  "iron",
  "vitaminA",
  "vitaminC",
] as const;
export type Nutrient = (typeof nutrientFields)[number];
export const nutrientLabels: Record<Nutrient, [string, string]> = {
  calories: ["Calories", "kcal"],
  protein: ["Protein", "g"],
  carbs: ["Carbohydrates", "g"],
  fat: ["Fat", "g"],
  fiber: ["Fiber", "g"],
  sugar: ["Sugar", "g"],
  sodium: ["Sodium", "mg"],
  saturatedFat: ["Saturated fat", "g"],
  cholesterol: ["Cholesterol", "mg"],
  potassium: ["Potassium", "mg"],
  calcium: ["Calcium", "mg"],
  iron: ["Iron", "mg"],
  vitaminA: ["Vitamin A", "µg"],
  vitaminC: ["Vitamin C", "mg"],
};
export const goalPurposes = [
  "Maintain weight",
  "Lose weight",
  "Gain weight",
  "Improve general nutrition",
] as const;
const target = z.number().finite().nonnegative().max(100000);
export const nutritionGoalsSchema = z
  .object({
    calories: target.positive(),
    protein: target,
    carbs: target,
    fat: target,
    purpose: z.enum(goalPurposes).optional(),
  })
  .passthrough();
export type NutritionGoals = z.infer<typeof nutritionGoalsSchema>;
export type Targets = Pick<
  NutritionGoals,
  "calories" | "protein" | "carbs" | "fat"
>;
export const displayTargets: Targets = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 67,
};
export function readNutritionGoals(storage: Storage = localStorage) {
  const raw = storage.getItem("fitcircle_nutrition_goals");
  return raw === null ? null : nutritionGoalsSchema.parse(JSON.parse(raw));
}
export function saveNutritionGoals(
  goals: NutritionGoals,
  storage: Storage = localStorage,
) {
  // Preserve unknown metadata; malformed existing bytes are never repaired implicitly.
  const existing = readNutritionGoals(storage);
  const next = nutritionGoalsSchema.parse({ ...existing, ...goals });
  storage.setItem("fitcircle_nutrition_goals", JSON.stringify(next));
  return next;
}
export function readCalculatorEstimate(
  storage: Storage = localStorage,
): Targets | null {
  const values = {
    calories: storage.getItem("fitness_calc_target_calories"),
    protein: storage.getItem("fitness_calc_target_protein"),
    carbs: storage.getItem("fitness_calc_target_carbs"),
    fat: storage.getItem("fitness_calc_target_fat"),
  };
  if (Object.values(values).some((v) => v === null || v.trim() === ""))
    return null;
  const result = nutritionGoalsSchema.safeParse(
    Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)])),
  );
  return result.success ? result.data : null;
}
export function servingsOf(entry: Pick<FoodEntry, "servings">) {
  return entry.servings ?? 1;
}
export function scaleNutrients(food: LocalFoodItem, servings: number) {
  if (!Number.isFinite(servings) || servings <= 0)
    throw new Error("Servings must be greater than zero.");
  return Object.fromEntries(
    nutrientFields.map((key) => [
      key,
      typeof food[key] === "number" ? food[key]! * servings : undefined,
    ]),
  ) as Partial<Record<Nutrient, number>>;
}
export function per100gForFood(
  food: LocalFoodItem,
): LocalFoodItem["nutritionPer100g"] {
  const grams =
    food.unit === "g"
      ? food.quantity
      : food.unit === "oz"
        ? food.quantity * 28.349523125
        : null;
  if (grams === null || !Number.isFinite(grams) || grams <= 0) return undefined;
  return scaleNutrients(food, 100 / grams) as NonNullable<
    LocalFoodItem["nutritionPer100g"]
  >;
}
export function dailyNutrition(entries: FoodEntry[]) {
  const scaled = entries.map((entry) =>
    scaleNutrients(entry, servingsOf(entry)),
  );
  return Object.fromEntries(
    nutrientFields.map((key) => {
      let value = 0,
        known = 0;
      for (const entry of scaled) {
        const amount = entry[key];
        if (typeof amount === "number" && Number.isFinite(amount)) {
          value += amount;
          known++;
        }
      }
      return [key, { value, known, total: entries.length }];
    }),
  ) as Record<Nutrient, { value: number; known: number; total: number }>;
}
export function calorieBalance(consumed: number, target: number) {
  return {
    remaining: Math.max(0, target - consumed),
    over: Math.max(0, consumed - target),
    percent: target > 0 ? (consumed / target) * 100 : 0,
  };
}
export function nutritionWeek(
  ending: string,
  read: (date: string) => FoodEntry[],
) {
  const days: { date: string; entries: FoodEntry[] }[] = [];
  const unavailable: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = parseLocalDate(ending);
    date.setDate(date.getDate() - i);
    const key = getDateString(date);
    try {
      const entries = read(key);
      if (entries.length) days.push({ date: key, entries });
    } catch {
      unavailable.push(key);
    }
  }
  const totals = dailyNutrition(days.flatMap((day) => day.entries));
  const averages = Object.fromEntries(
    (["calories", "protein", "carbs", "fat"] as const).map((key) => [
      key,
      days.length ? totals[key].value / days.length : null,
    ]),
  ) as Record<keyof Targets, number | null>;
  return { days: days.length, averages, unavailable };
}

export function consumedServingText(
  quantity: number,
  unit: string,
  multiplier: string,
) {
  const count = Number(multiplier);
  if (!multiplier.trim() || !Number.isFinite(count) || count <= 0)
    return "Enter a positive number of base servings eaten.";
  return `${count} × ${quantity} ${unit} = ${Number((count * quantity).toFixed(4))} ${unit} consumed`;
}

/** Same-tab calculator writes do not generate the browser storage event. */
export const CALCULATOR_TARGETS_CHANGED = "fitcircleCalculatorTargetsChanged";
