import { nutrientFields } from "./nutrition";
import { z } from "zod";
import { foodDataSchema } from "./backup";
import type { FoodEntry, LocalFoodItem } from "./local-food-service";
const entrySchema = foodDataSchema.extend({
  servings: z.number().finite().positive().optional(),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  timestamp: z.string(),
});
export const diarySchema = z.array(entrySchema);
export function readFoodDay(
  date: string,
  storage: Storage = localStorage,
): { raw: string | null; entries: FoodEntry[] } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid diary date.");
  const raw = storage.getItem(`fitcircle_food_${date}`);
  if (raw === null) return { raw, entries: [] };
  if (!diarySchema.safeParse(JSON.parse(raw)).success)
    throw new Error(
      "This day’s food data cannot be read safely. Original records are unchanged. Restore a verified backup in Settings or retry.",
    );
  // Validate without stripping unknown/legacy metadata from existing records.
  return { raw, entries: JSON.parse(raw) as FoodEntry[] };
}
export function saveFoodDay(
  date: string,
  entries: FoodEntry[],
  expectedRaw: string | null,
  storage: Storage = localStorage,
) {
  if (!diarySchema.safeParse(entries).success)
    throw new Error(
      "Check the food’s name, serving size and nutrition values.",
    );
  const current = readFoodDay(date, storage);
  if (current.raw !== expectedRaw)
    throw new Error(
      "This day changed in another view. Retry loading before saving.",
    );
  const raw = JSON.stringify(entries);
  storage.setItem(`fitcircle_food_${date}`, raw);
  return raw;
}

/** New diary entries must have known nonnegative macros; existing bytes are not repaired. */
export function assertLoggableFood(food: LocalFoodItem) {
  if (
    !foodDataSchema.safeParse(food).success ||
    nutrientFields.some(
      (key) =>
        food[key] !== undefined &&
        (!Number.isFinite(food[key]) || food[key]! < 0),
    )
  ) {
    throw new Error(
      "Check the serving and nutrition values in Food Database before logging this food. Unknown optional nutrients should remain blank.",
    );
  }
}
