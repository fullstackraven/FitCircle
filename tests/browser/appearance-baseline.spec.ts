import { test, expect, type Page } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
  colorScheme: "dark",
});

async function seed(page: Page) {
  await page.clock.install({ time: new Date("2026-10-19T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate(() => {
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

// Captured before token correction. These remain the Phase 1 dark regression baseline.
test("current Dark appearance remains unchanged across representative routes and overlays", async ({
  page,
}) => {
  await seed(page);
  const capture = async (name: string) => {
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      animations: "disabled",
      maxDiffPixels: 0,
      threshold: 0,
    });
    if (process.env.APPEARANCE_CAPTURE_AFTER === "1") {
      await page.screenshot({
        path: `docs/review/appearance-phase-one/after/${name}.png`,
        animations: "disabled",
      });
    }
    const colors = await page.evaluate(() => {
      const selectors = [
        "body",
        ".app-shell",
        ".app-header",
        ".dock-nav",
        '.dock-tab[aria-current="page"]',
        ".fitcircle-card",
        ".glass-card",
        ".glass-dialog",
        ".wellness-surface",
        "input",
        "button",
      ];
      return Object.fromEntries(
        selectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!element) return [selector, null];
          const css = getComputedStyle(element);
          return [
            selector,
            {
              background: css.backgroundColor,
              color: css.color,
              border: css.borderColor,
              shadow: css.boxShadow,
              backdrop: css.backdropFilter,
            },
          ];
        }),
      );
    });
    expect(JSON.stringify(colors, null, 2)).toMatchSnapshot(
      `${name}-colors.json`,
    );
  };
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Today's Workout", exact: true }),
  ).toBeVisible();
  await capture("home-and-dock");
  await page
    .getByRole("button", { name: "Edit Push-ups", exact: true })
    .click();
  await capture("workout-editor");
  await page.goto("routines");
  await page.getByTestId("routine-header-r").waitFor();
  await capture("routines-collapsed");
  await page.getByTestId("routine-header-r").click();
  await capture("routines-expanded");
  for (const route of [
    "calendar",
    "wellness",
    "food-tracker",
    "settings",
    "hydration",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await capture(route);
    if (route === "food-tracker") {
      await page
        .getByRole("button", { name: "Nutrition Details", exact: true })
        .click();
      await capture("nutrition-details-inline");
    }
    if (route === "hydration") {
      await page.getByRole("button", { name: "Goal", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await capture("hydration-goal");
    }
  }
});
