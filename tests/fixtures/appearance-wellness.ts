import type { Page } from "@playwright/test";
import { seedNutritionAppearance } from "./appearance-nutrition";
export async function seedWellnessAppearance(page: Page, mode: string) {
  await seedNutritionAppearance(page, mode);
  await page.evaluate(() => {
    const day = "2026-10-19";
    const data = JSON.parse(localStorage.getItem("workout-tracker-data")!);
    data.journalEntries[day] = {
      text: "Synthetic journal reflection for appearance review.",
      timestamp: "2026-10-19T14:00:00Z",
    };
    data.dailyLogs["2026-10-12"] = { w: { count: 20, goalAtTime: 20 } };
    localStorage.setItem("workout-tracker-data", JSON.stringify(data));
    localStorage.setItem(
      "fitcircle_goals",
      JSON.stringify({
        hydrationOz: 64,
        meditationMinutes: 20,
        fastingHours: 16,
        maxFastingHours: 24,
      }),
    );
    localStorage.setItem(
      "fitcircle_hydration_data",
      JSON.stringify({
        dailyGoalOz: 64,
        currentDayOz: 16,
        lastDate: day,
        logs: {
          [day]: {
            date: day,
            totalOz: 16,
            entries: [
              {
                id: "intake",
                time: "10:00 AM",
                amount: 16,
                liquidType: "Water",
              },
            ],
          },
          "2026-09-01": {
            date: "2026-09-01",
            totalOz: 8,
            entries: [
              {
                id: "old-intake",
                time: "10:00 AM",
                amount: 8,
                liquidType: "Tea",
              },
            ],
          },
        },
      }),
    );
    localStorage.setItem(
      "fitcircle_meditation_logs",
      JSON.stringify([
        {
          id: "practice",
          date: day,
          time: "10:00 AM",
          duration: 10,
          completedAt: "2026-10-19T14:00:00Z",
        },
      ]),
    );
    localStorage.setItem(
      "fitcircle_fasting_logs",
      JSON.stringify([
        {
          id: "fast",
          startDate: "2026-10-18",
          startTime: "18:00",
          endDate: day,
          endTime: "10:00",
          duration: 960,
          loggedAt: "2026-10-19T14:00:00Z",
        },
      ]),
    );
    localStorage.setItem(
      "fitcircle_cardio_data",
      JSON.stringify({
        goal: { type: "duration", target: 150, period: "week" },
        dailyLogs: {
          [day]: {
            date: day,
            totalDuration: 75,
            totalDistance: 3,
            sessions: [
              {
                id: "cardio",
                time: "10:00 AM",
                type: "Walking",
                duration: 75,
                distance: 3,
                notes: "Synthetic session",
              },
            ],
          },
        },
      }),
    );
    localStorage.setItem(
      "fitcircle_energy_levels",
      JSON.stringify({ [day]: 7, "2026-10-18": 5, "2026-10-17": 3 }),
    );
    localStorage.setItem(
      "fitcircle_supplements",
      JSON.stringify([
        {
          id: 1,
          name: "Synthetic supplement",
          measurementType: "mg",
          amount: 100,
          createdAt: "2026-10-01",
        },
      ]),
    );
    localStorage.setItem(
      "fitcircle_supplement_logs",
      JSON.stringify({ [day]: { "1": true } }),
    );
    localStorage.setItem(
      "fitcircle_recovery_data",
      JSON.stringify({ recoveryDays: ["2026-10-18"] }),
    );
  });
}
export const wellnessBytes = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter(
          (k) => k.startsWith("fitcircle_") || k === "workout-tracker-data",
        )
        .sort()
        .map((k) => [k, localStorage.getItem(k)]),
    ),
  );
