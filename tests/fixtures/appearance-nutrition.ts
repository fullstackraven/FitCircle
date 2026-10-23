import type { Page } from "@playwright/test";
import { seedAppearance } from "./appearance-pages";
export const sampleFood = {
  id: "custom-appearance",
  name: "Synthetic oats",
  brand: "Synthetic brand",
  barcode: "3017620422003",
  quantity: 40,
  unit: "g",
  calories: 150,
  carbs: 27,
  protein: 5,
  fat: 3,
  fiber: 4,
  sugar: 2,
  sodium: 0,
  calcium: 50,
  iron: 2,
  cholesterol: 0,
};
export async function seedNutritionAppearance(page: Page, mode: string) {
  await seedAppearance(page);
  await page.evaluate(
    ({ mode, food }) => {
      localStorage.setItem("fitcircle_appearance", mode);
      localStorage.setItem("fitcircle_food_database", JSON.stringify([food]));
      localStorage.setItem(
        "fitcircle_food_2026-10-19",
        JSON.stringify([
          {
            ...food,
            id: "logged-appearance",
            meal: "breakfast",
            servings: 2,
            timestamp: "2026-10-19T12:00:00Z",
          },
        ]),
      );
      localStorage.setItem(
        "fitcircle_food_2026-10-18",
        JSON.stringify([
          {
            ...food,
            id: "historical-appearance",
            meal: "dinner",
            servings: 1,
            timestamp: "2026-10-18T12:00:00Z",
          },
        ]),
      );
      localStorage.setItem(
        "fitcircle_measurements_history",
        JSON.stringify({
          weight: [
            { date: "2026-10-01", value: 200 },
            { date: "2026-10-10", value: 195 },
            { date: "2026-10-19", value: 190 },
          ],
          height: [{ date: "2026-10-01", value: 70 }],
          bodyFat: [{ date: "2026-10-19", value: 20 }],
        }),
      );
      localStorage.setItem(
        "fitcircle_goals",
        JSON.stringify({ targetWeight: 180, hydrationOz: 72 }),
      );
    },
    { mode, food: sampleFood },
  );
  await page.goto("food-tracker");
  await page.getByTestId("button-add-breakfast").waitFor();
}
export const nutritionBytes = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter(
          (k) =>
            k.startsWith("fitcircle_food_") ||
            k === "fitcircle_measurements_history" ||
            k === "fitcircle_goals" ||
            k === "fitcircle_profile",
        )
        .sort()
        .map((k) => [k, localStorage.getItem(k)]),
    ),
  );
