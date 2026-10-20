import { test, expect, type Page } from "@playwright/test";
test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
const history = {
  weight: [
    { date: "2026-10-01", value: 200 },
    { date: "2026-10-20", value: 190 },
    { date: "2026-10-10", value: 195 },
  ],
  height: [{ date: "2026-01-01", value: 70 }],
  bodyFat: [{ date: "2026-10-20", value: 20 }],
};
async function seed(page: Page) {
  await page.clock.install({ time: new Date("2026-10-20T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate((history) => {
    localStorage.setItem(
      "fitcircle_profile",
      '{"age":30,"gender":"male","retained":"synthetic"}',
    );
    localStorage.setItem(
      "fitcircle_measurements_history",
      JSON.stringify(history),
    );
    localStorage.setItem(
      "fitcircle_goals",
      '{"targetWeight":180,"targetBodyFat":15,"weightGoalType":"lose","hydrationOz":72}',
    );
    localStorage.setItem("fitness_calc_goal_type", "gain");
    localStorage.setItem("fitness_calc_goal_rate", "0.5");
    localStorage.setItem(
      "fitcircle_nutrition_goals",
      '{"calories":2100,"protein":140,"carbs":230,"fat":70,"source":"manual","retained":"synthetic"}',
    );
    localStorage.setItem(
      "fitcircle_food_2026-10-19",
      JSON.stringify([
        {
          id: "synthetic-historical-food",
          name: "Synthetic oats",
          quantity: 40,
          unit: "g",
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
          sodium: 0,
          servings: 1,
          meal: "breakfast",
          timestamp: "2026-10-19T12:00:00.123Z",
        },
      ]),
    );
  }, history);
  await page.goto("food-tracker");
}
const snapshot = (page: Page) =>
  page.evaluate(() => ({
    measurements: localStorage.getItem("fitcircle_measurements_history"),
    goals: localStorage.getItem("fitcircle_goals"),
    nutrition: localStorage.getItem("fitcircle_nutrition_goals"),
    food: localStorage.getItem("fitcircle_food_2026-10-19"),
  }));
async function openReview(page: Page) {
  const panel = page.getByTestId("target-review");
  if (!(await panel.evaluate((el) => (el as HTMLDetailsElement).open)))
    await panel.locator("summary").click();
  return panel;
}
test("recorded inputs and goal conflicts are visible; alignment is explicit and preserves rate and confirmed targets", async ({
  page,
}) => {
  await seed(page);
  const before = await snapshot(page);
  await page.getByTestId("button-calculator").click();
  const dialog = page.getByRole("dialog", {
    name: "Fitness Calculator",
    exact: true,
  });
  await expect(dialog).toContainText("190 lb · 2026-10-20");
  await expect(dialog).toContainText("70 in · 2026-01-01");
  await expect(dialog).toContainText("Weight goal: 180 lb");
  expect(await snapshot(page)).toEqual(before);
  expect(
    await page.evaluate(() => localStorage.getItem("fitness_calc_goal_type")),
  ).toBe("gain");
  await dialog
    .getByRole("button", { name: "Align with measurement goal" })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("fitness_calc_goal_type")),
  ).toBe("lose");
  expect(
    await page.evaluate(() => localStorage.getItem("fitness_calc_goal_rate")),
  ).toBe("0.5");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByTestId("calories-remaining")).toHaveText("2,100");
  expect(await snapshot(page)).toEqual(before);
  const panel = await openReview(page);
  await panel
    .getByRole("button", { name: "Apply Recommended Targets", exact: true })
    .click();
  expect((await snapshot(page)).nutrition).toBe(before.nutrition);
  await panel.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await snapshot(page)).nutrition).toBe(before.nutrition);
  await panel
    .getByRole("button", { name: "Apply Recommended Targets", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm Apply", exact: true })
    .click();
  const confirmed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_nutrition_goals")!),
  );
  expect(confirmed.source).toBe("calculator");
  expect(confirmed.retained).toBe("synthetic");
  expect(confirmed.recommendation.inputs.weight).toBe(190);
  await expect(page.getByTestId("calories-remaining")).toHaveText(
    confirmed.calories.toLocaleString(),
  );
  await page.reload();
  await expect(page.getByTestId("calories-remaining")).toHaveText(
    confirmed.calories.toLocaleString(),
  );
  expect((await snapshot(page)).measurements).toBe(before.measurements);
  expect((await snapshot(page)).food).toBe(before.food);
});
test("new measurements refresh recommendations in another tab without altering accepted nutrition goals", async ({
  page,
  context,
}) => {
  await seed(page);
  const before = await snapshot(page);
  const panel = await openReview(page);
  const old = await panel
    .getByRole("heading", { name: /Calculator Recommendation/ })
    .locator("..")
    .innerText();
  const other = await context.newPage();
  await other.goto("measurements");
  other.on("dialog", (dialog) => dialog.accept());
  await other.getByLabel("Weight", { exact: true }).fill("185");
  await other
    .getByRole("button", { name: "Save Measurements", exact: true })
    .click();
  await expect(
    panel
      .getByRole("heading", { name: /Calculator Recommendation/ })
      .locator(".."),
  ).not.toHaveText(old);
  expect((await snapshot(page)).nutrition).toBe(before.nutrition);
  expect((await snapshot(page)).food).toBe(before.food);
  await expect(page.getByTestId("calories-remaining")).toHaveText("2,100");
  await other.close();
});
test("missing measurements never become defaults; malformed history survives reload and blocked editing", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_measurements_history", "{synthetic"),
  );
  await page.goto("measurements");
  await expect(
    page.getByRole("button", { name: "Save Measurements", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.reload();
  expect((await snapshot(page)).measurements).toBe("{synthetic");
  await page.goto("food-tracker");
  await page.getByTestId("button-calculator").click();
  await expect(page.getByRole("dialog")).toContainText(
    "could not be read safely",
  );
  await expect(page.getByRole("dialog")).not.toContainText("170 lb");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const panel = await openReview(page);
  await expect(
    panel.getByRole("button", {
      name: "Apply Recommended Targets",
      exact: true,
    }),
  ).toHaveCount(0);
});
test("manual customization and failed recommendation adoption retain previous confirmed goals and history", async ({
  page,
}) => {
  await seed(page);
  const before = await snapshot(page);
  const panel = await openReview(page);
  await panel.getByRole("button", { name: "Edit current targets" }).click();
  await panel.getByLabel("Calories target", { exact: true }).fill("2300");
  await panel.getByRole("button", { name: "Confirm manual targets" }).click();
  await expect(page.getByTestId("calories-remaining")).toHaveText("2,300");
  const saved = (await snapshot(page)).nutrition;
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitcircle_nutrition_goals")
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await panel
    .getByRole("button", { name: "Apply Recommended Targets", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm Apply", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toBeVisible();
  expect((await snapshot(page)).nutrition).toBe(saved);
  expect((await snapshot(page)).measurements).toBe(before.measurements);
  expect((await snapshot(page)).food).toBe(before.food);
});
test("measurement goals retain body-fat tracking and corrected recorded-start progress, with compact navigation", async ({
  page,
}) => {
  await seed(page);
  await page.goto("measurements");
  await expect(page.getByText(/50% since first record/)).toBeVisible();
  await page.getByRole("button", { name: "Goal", exact: true }).click();
  await page.getByLabel("Target Weight (lbs)", { exact: true }).fill("175");
  await page.getByRole("button", { name: "Maintain", exact: true }).click();
  await page.getByRole("button", { name: "Set Goals", exact: true }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("fitcircle_goals")!),
    ),
  ).toMatchObject({
    targetWeight: 175,
    targetBodyFat: 15,
    weightGoalType: "maintain",
    hydrationOz: 72,
  });
  await page
    .getByRole("button", { name: "Fitness Calculator", exact: true })
    .click();
  await expect(page).toHaveURL(/fitness-calculator$/);
  await page.getByRole("button", { name: "Food Tracker", exact: true }).click();
  await expect(page).toHaveURL(/food-tracker$/);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await openReview(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("unreadable confirmed goals block replacement and offer Settings recovery without changing bytes", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_nutrition_goals", "{broken"),
  );
  await page.reload();
  const panel = await openReview(page);
  await expect(
    panel.getByRole("button", {
      name: "Apply Recommended Targets",
      exact: true,
    }),
  ).toBeDisabled();
  await panel
    .getByRole("button", { name: "Open Settings", exact: true })
    .click();
  await expect(page).toHaveURL(/settings$/);
  expect((await snapshot(page)).nutrition).toBe("{broken");
});

test("measurement write rollback keeps original bytes and draft, then retries without inventing other measurement dates", async ({
  page,
}) => {
  await seed(page);
  const before = await snapshot(page);
  await page.goto("measurements");
  await page.getByLabel("Weight", { exact: true }).fill("185");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitcircle_weight" && !failed) {
        failed = true;
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      }
      original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Save Measurements", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("original data restored");
  expect((await snapshot(page)).measurements).toBe(before.measurements);
  await expect(page.getByLabel("Weight", { exact: true })).toHaveValue("185");
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Save Measurements", exact: true })
    .click();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_measurements_history")!),
  );
  expect(data.height).toEqual(history.height);
  expect(data.bodyFat).toEqual(history.bodyFat);
  expect(
    data.weight.find((point: { date: string }) => point.date === "2026-10-20")
      .value,
  ).toBe(185);
  expect((await snapshot(page)).nutrition).toBe(before.nutrition);
});
test("calculator preference write failures do not publish defaults or alter original settings and targets", async ({
  page,
}) => {
  await seed(page);
  const before = await snapshot(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitness_calc_goal_type" && !failed) {
        failed = true;
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      }
      original.call(this, key, value);
    };
  });
  await page.getByTestId("button-calculator").click();
  const dialog = page.getByRole("dialog", {
    name: "Fitness Calculator",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Maintain", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "original data restored",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("fitness_calc_goal_type")),
  ).toBe("gain");
  expect(await snapshot(page)).toEqual(before);
});
test("missing recorded inputs stay absent and the calculator links to entry instead of guessing", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.removeItem("fitcircle_measurements_history"),
  );
  await page.reload();
  await page.getByTestId("button-calculator").click();
  const dialog = page.getByRole("dialog", {
    name: "Fitness Calculator",
    exact: true,
  });
  await expect(dialog.getByRole("status")).toContainText("Record your weight");
  await expect(dialog.getByRole("status")).toContainText("Record your height");
  await expect(dialog).not.toContainText("170 lb");
  await dialog
    .getByRole("button", { name: "Measurements", exact: true })
    .click();
  await expect(page).toHaveURL(/measurements$/);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_measurements_history"),
    ),
  ).toBeNull();
});

test("a recommendation changed during confirmation requires a fresh review", async ({
  page,
  context,
}) => {
  await seed(page);
  const before = await snapshot(page);
  const panel = await openReview(page);
  await panel
    .getByRole("button", { name: "Apply Recommended Targets", exact: true })
    .click();
  const other = await context.newPage();
  await other.goto("profile");
  await other.evaluate(() =>
    localStorage.setItem("fitness_calc_custom_carbs", "50"),
  );
  await expect(
    panel.getByText(
      "Complete Measurements and Fitness Calculator to get a recommendation.",
    ),
  ).toBeVisible();
  await other.evaluate(() => {
    localStorage.setItem("fitness_calc_custom_protein", "25");
    localStorage.setItem("fitness_calc_custom_fat", "25");
  });
  await expect(
    panel.getByRole("button", { name: "Confirm Apply", exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Confirm Apply", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText(
    "Recommendation changed",
  );
  expect((await snapshot(page)).nutrition).toBe(before.nutrition);
  await other.close();
});
