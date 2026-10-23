import type { Page } from "@playwright/test";
export async function seedAppearance(page: Page) {
  await page.clock.install({ time: new Date("2026-10-19T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate(() => {
    localStorage.setItem("fitcircle_reminders", "[]");
    localStorage.setItem(
      "workout-tracker-data",
      JSON.stringify({
        workouts: {
          w: {
            id: "w",
            name: "Push-ups",
            color: "green",
            dailyGoal: 20,
            count: 7,
            scheduledDays: [1],
            routineId: "r",
          },
        },
        routines: {
          r: {
            id: "r",
            name: "PUSH",
            selectedDays: [1],
            createdAt: "2026-10-01",
          },
        },
        dailyLogs: { "2026-10-19": { w: { count: 7, goalAtTime: 20 } } },
        journalEntries: {},
        lastDate: "2026-10-19",
      }),
    );
    localStorage.setItem(
      "fitcircle_daily_quote",
      JSON.stringify({
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
      }),
    );
    localStorage.setItem("fitcircle_quote_date", "2026-10-19");
    localStorage.setItem(
      "fitcircle_profile",
      JSON.stringify({ name: "Synthetic person", age: 31, gender: "male" }),
    );
    localStorage.setItem("fitcircle_food_database", "[]");
    localStorage.setItem("fitcircle_food_database_migrated", "true");
    localStorage.setItem(
      "fitcircle_food_2026-10-19",
      JSON.stringify([
        {
          id: "food",
          name: "Synthetic oats",
          quantity: 100,
          unit: "g",
          servings: 1,
          meal: "breakfast",
          timestamp: "2026-10-19T12:00:00Z",
          calories: 350,
          protein: 12,
          carbs: 60,
          fat: 5,
          fiber: 8,
          sugar: 2,
          sodium: 0,
        },
      ]),
    );
    for (const [key, value] of Object.entries({
      calories: 2000,
      protein: 150,
      carbs: 225,
      fat: 65,
    }))
      localStorage.setItem("fitness_calc_target_" + key, String(value));
  });
}
