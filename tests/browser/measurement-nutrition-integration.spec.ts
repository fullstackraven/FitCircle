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
test("Measurements has no goal feature and does not rewrite stored goals", async ({
  page,
}) => {
  await seed(page);
  const before = await snapshot(page);
  await page.goto("measurements");
  await expect(
    page.getByRole("button", { name: "Goal", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Target 180 lb", { exact: false })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Fitness Calculator", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Weight", { exact: true }).fill("185");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Save Measurements", exact: true })
    .click();
  const after = await snapshot(page);
  expect(after.goals).toBe(before.goals);
  expect(after.food).toBe(before.food);
  expect(after.nutrition).toBe(before.nutrition);
  const history = JSON.parse(after.measurements!);
  expect(history.height).toEqual(JSON.parse(before.measurements!).height);
  expect(history.bodyFat).toEqual(JSON.parse(before.measurements!).bodyFat);
  await page.goto("food-tracker");
  await page.getByTestId("button-calculator").click();
  await expect(
    page.getByText("Weight: 185 lbs", { exact: true }),
  ).toBeVisible();
});

test("simple calculator goal reuses existing records, shows progress and keeps macro fields", async ({
  page,
}) => {
  await seed(page);
  const before = await snapshot(page);
  await page.getByTestId("button-calculator").click();
  const dialog = page.getByRole("dialog", {
    name: "Fitness Calculator",
    exact: true,
  });
  await expect(
    dialog.getByLabel("Goal weight (lbs)", { exact: true }),
  ).toHaveValue("180");
  await expect(
    dialog.getByRole("progressbar", { name: "Weight goal progress" }),
  ).toHaveAttribute("aria-valuenow", "50");
  await expect(
    dialog.getByText("Weight: 190 lbs", { exact: true }),
  ).toBeVisible();
  for (const label of ["Carbs %", "Protein %", "Fat %"])
    await expect(dialog.getByLabel(label, { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("Compare Styles:", { exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByText("Calculation sex", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("target-review")).toHaveCount(0);
  await dialog.getByLabel("Goal weight (lbs)", { exact: true }).fill("175");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    dialog.getByRole("status").filter({ hasText: "Goal saved" }),
  ).toBeVisible();
  const after = await snapshot(page);
  expect(after.measurements).toBe(before.measurements);
  expect(after.food).toBe(before.food);
  expect(after.nutrition).toBe(before.nutrition);
  expect(JSON.parse(after.goals!)).toEqual({
    ...JSON.parse(before.goals!),
    targetWeight: 175,
  });
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_goal_weight")),
  ).toBe("175");
  await page.reload();
  await page.getByTestId("button-calculator").click();
  await expect(
    page.getByLabel("Goal weight (lbs)", { exact: true }),
  ).toHaveValue("175");
});

test("measurement updates quietly refresh BMI and calories without changing goal or rate", async ({
  page,
}) => {
  await seed(page);
  await page.getByTestId("button-calculator").click();
  const before = await page.evaluate(() =>
    localStorage.getItem("fitness_calc_target_calories"),
  );
  await page.evaluate(() => {
    const data = JSON.parse(
      localStorage.getItem("fitcircle_measurements_history")!,
    );
    data.weight = data.weight.filter(
      (entry: any) => entry.date !== "2026-10-20",
    );
    data.weight.push({ date: "2026-10-20", value: 185 });
    localStorage.setItem(
      "fitcircle_measurements_history",
      JSON.stringify(data),
    );
    window.dispatchEvent(new Event("fitcircleIntegrationChanged"));
  });
  await expect(
    page.getByText("Weight: 185 lbs", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("fitness_calc_target_calories")),
    )
    .not.toBe(before);
  expect(
    await page.evaluate(() => localStorage.getItem("fitness_calc_goal_rate")),
  ).toBe("0.5");
  expect(
    await page.evaluate(() => localStorage.getItem("fitness_calc_goal_type")),
  ).toBe("gain");
});

test("malformed measurements and failed goal saves preserve original bytes", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    localStorage.setItem("fitcircle_measurements_history", "{");
    localStorage.setItem("fitness_calc_target_calories", "2222");
  });
  await page.getByTestId("button-calculator").click();
  await expect(
    page.getByRole("alert").filter({ hasText: "could not be read safely" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitness_calc_target_calories"),
    ),
  ).toBe("2222");
  await page.getByLabel("Goal weight (lbs)", { exact: true }).fill("175");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitcircle_goals")
        throw new DOMException("Quota full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Goal saved", { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("fitcircle_goals")!).targetWeight,
    ),
  ).toBe(180);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_measurements_history"),
    ),
  ).toBe("{");
});

test("cross-tab weight changes update the calculator without changing stored goals", async ({
  page,
  context,
}) => {
  await seed(page);
  await page.getByTestId("button-calculator").click();
  const before = await snapshot(page);
  const other = await context.newPage();
  await other.goto("profile");
  await other.evaluate(() => {
    const data = JSON.parse(
      localStorage.getItem("fitcircle_measurements_history")!,
    );
    data.weight = data.weight.filter(
      (entry: any) => entry.date !== "2026-10-20",
    );
    data.weight.push({ date: "2026-10-20", value: 188 });
    localStorage.setItem(
      "fitcircle_measurements_history",
      JSON.stringify(data),
    );
  });
  await expect(
    page.getByText("Weight: 188 lbs", { exact: true }),
  ).toBeVisible();
  expect((await snapshot(page)).goals).toBe(before.goals);
  await other.close();
});

test("missing measurements keep existing calorie targets and never invent goal progress", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    localStorage.removeItem("fitcircle_measurements_history");
    localStorage.setItem("fitness_calc_target_calories", "2222");
  });
  await page.getByTestId("button-calculator").click();
  await expect(
    page.getByText("Add height and weight in Measurements to see your BMI", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Weight goal progress" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitness_calc_target_calories"),
    ),
  ).toBe("2222");
  await page.getByLabel("Goal weight (lbs)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Enter a valid goal weight.",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("fitcircle_goals")!).targetWeight,
    ),
  ).toBe(180);
});
