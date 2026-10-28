import { captureVisual } from "../fixtures/visual-review";
import { seedNutritionAppearance } from "../fixtures/appearance-nutrition";
import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });
async function seed(page: Page, appearance = "dark") {
  await page.goto("profile");
  await page.evaluate((appearance) => {
    localStorage.setItem("fitcircle_appearance", appearance);
    localStorage.setItem(
      "fitcircle_profile",
      JSON.stringify({ age: 30, gender: "male", retained: true }),
    );
    localStorage.setItem(
      "fitcircle_measurements_history",
      JSON.stringify({
        weight: [{ date: "2026-10-20", value: 190 }],
        height: [{ date: "2026-10-20", value: 70 }],
      }),
    );
  }, appearance);
  await page.goto("food-tracker");
}
const tab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true });

test("calculator icon navigates, tabs preserve draft and saved values, Back returns to origin", async ({
  page,
}) => {
  await seed(page);
  const before = await page.evaluate(() => ({
    profile: localStorage.getItem("fitcircle_profile"),
    measurements: localStorage.getItem("fitcircle_measurements_history"),
  }));
  await page.getByTestId("button-calculator").click();
  await expect(page).toHaveURL(/\/fitness-calculator$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Bottom navigation" })).toHaveCount(0);
  await expect(tab(page, "Calories")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await page.getByRole("button", { name: "Gain Weight", exact: true }).click();
  const calories = await page.evaluate(() =>
    localStorage.getItem("fitness_calc_target_calories"),
  );
  await tab(page, "Goal").click();
  await page.getByLabel("Goal weight (lbs)", { exact: true }).fill("205.5");
  await tab(page, "Macros").click();
  await page.getByLabel("Carbs %", { exact: true }).fill("50");
  await page.getByLabel("Protein %", { exact: true }).fill("25");
  await page.getByLabel("Fat %", { exact: true }).fill("25");
  await tab(page, "BMI").click();
  await expect(page.getByLabel("Weight", { exact: true })).toHaveValue("190");
  await tab(page, "Goal").click();
  await expect(
    page.getByLabel("Goal weight (lbs)", { exact: true }),
  ).toHaveValue("205.5");
  await page.getByRole("button", { name: "Save Goal Weight", exact: true }).click();
  await expect(page.getByText("Goal saved", { exact: true })).toBeVisible();
  await tab(page, "Macros").click();
  await expect(page.getByLabel("Carbs %", { exact: true })).toHaveValue("50");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitness_calc_target_calories"),
    ),
  ).toBe(calories);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/food-tracker$/);
  await page.getByTestId("button-calculator").click();
  await expect(tab(page, "Calories")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/food-tracker$/);
  await page.goForward();
  await tab(page, "Macros").click();
  await expect(page.getByLabel("Carbs %", { exact: true })).toHaveValue("50");
  expect(
    await page.evaluate(() => ({
      profile: localStorage.getItem("fitcircle_profile"),
      measurements: localStorage.getItem("fitcircle_measurements_history"),
    })),
  ).toEqual(before);
});

for (const mode of ["light", "dark"]) {
  test(`${mode}: narrow tabs, keyboard selection and normal page scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await seed(page, mode);
    await page.getByTestId("button-calculator").click();
    await expect(page.locator("html")).toHaveAttribute("data-appearance", mode);
    const first = tab(page, "Calories");
    await first.focus();
    await page.keyboard.press("End");
    await expect(tab(page, "Macros")).toBeFocused();
    await expect(tab(page, "Macros")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByLabel("Carbs %", { exact: true }).fill("45");
    await page.setViewportSize({ width: 320, height: 400 });
    await page.getByLabel("Fat %", { exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByLabel("Fat %", { exact: true })).toBeInViewport();
    expect(
      await page
        .locator("main")
        .evaluate((el) => getComputedStyle(el).overflowY),
    ).toBe("auto");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320);
    await tab(page, "Goal").click();
    await page
      .getByRole("button", { name: "Save Goal Weight", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Save Goal Weight", exact: true }),
    ).toBeInViewport();
  });
}

test("direct route defaults to Calories and has a safe in-app Back fallback", async ({
  page,
}) => {
  await page.goto("wellness");
  await expect(page.getByRole("navigation", { name: "Bottom navigation" })).toBeVisible();
  await page.goto("fitness-calculator");
  await expect(page.getByRole("navigation", { name: "Bottom navigation" })).toHaveCount(0);
  await expect(tab(page, "Calories")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await tab(page, "BMI").click();
  await page
    .getByRole("button", { name: "Go to Measurements", exact: true })
    .click();
  await expect(page).toHaveURL(/\/measurements$/);
  await page.goBack();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/food-tracker$/);
});

// New references for the intentional route/tab redesign; old modal references
// remain untouched. Keep exact screenshot comparison tolerances.
test("routed calculator Dark visual references", async ({ page }) => {
  await seedNutritionAppearance(page, "dark");
  await page.goto("fitness-calculator");
  await expect(page.locator("#fitcircle-startup")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await captureVisual(page, "calculator-reference-calories.png", {
    animations: "disabled",
    maxDiffPixels: 0,
    threshold: 0,
  });
  await tab(page, "BMI").click();
  await expect(page.getByLabel("Weight", { exact: true })).toHaveValue("190");
  await captureVisual(page, "calculator-reference-bmi.png", {
    animations: "disabled",
    maxDiffPixels: 0,
    threshold: 0,
  });
  await tab(page, "Goal").click();
  await captureVisual(page, "calculator-reference-goal.png", { animations: "disabled", maxDiffPixels: 0, threshold: 0 });
  await tab(page, "Macros").click();
  await captureVisual(page, "calculator-reference-macros.png", { animations: "disabled", maxDiffPixels: 0, threshold: 0 });

});
