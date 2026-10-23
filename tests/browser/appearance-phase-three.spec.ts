import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { textContrast } from "../fixtures/appearance-contrast";
import {
  seedNutritionAppearance,
  nutritionBytes,
  sampleFood,
} from "../fixtures/appearance-nutrition";
test.use({
  baseURL: "http://127.0.0.1:4184/FitCircle/",
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
for (const mode of process.env.APPEARANCE_CAPTURE_BEFORE
  ? ["dark"]
  : ["dark", "light"]) {
  test(`${mode}: nutrition, calculator and measurements visual baseline and data`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await seedNutritionAppearance(page, mode);
    const before = await nutritionBytes(page);
    async function capture(name: string) {
      await expect(page.locator("#fitcircle-startup")).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      if (mode === "dark")
        await expect(page).toHaveScreenshot(`${name}.png`, {
          animations: "disabled",
          maxDiffPixels: 0,
          threshold: 0,
        });
      await page.screenshot({
        path: `docs/review/appearance-phase-three/${process.env.APPEARANCE_CAPTURE_BEFORE ? "before" : mode}/${name}.png`,
        animations: "disabled",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (mode === "light") {
        const contrast = await textContrast(page);
        fs.writeFileSync(
          `docs/review/appearance-phase-three/light/${name}-contrast.json`,
          JSON.stringify(contrast, null, 2),
        );
        expect(contrast.failures).toEqual([]);
      }
    }
    await capture("food-tracker");
    await page
      .getByRole("button", { name: "Nutrition Details", exact: true })
      .click();
    await page
      .getByRole("region", { name: "Nutrition Details" })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("region", { name: "Nutrition Details" }),
    ).toContainText("Some nutrient totals are partial");
    await capture("nutrition-details");
    await page
      .getByRole("button", { name: "Nutrition Details", exact: true })
      .click();
    await page.getByRole("button", { name: /^Breakfast \d+ cal$/ }).click();
    await page
      .getByTestId("food-item-logged-appearance")
      .getByRole("button")
      .first()
      .click();
    await capture("food-entry-editor");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByTestId("button-add-breakfast").click();
    await page.getByTestId("input-search").fill("Synthetic oats");
    await page.getByTestId(`row-food-${sampleFood.id}`).waitFor();
    await capture("food-search");
    await page
      .getByRole("button", { name: "Create Custom Food", exact: true })
      .click();
    await capture("custom-food-create");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await page.getByTestId("button-add-breakfast").click();
    await page
      .getByRole("button", { name: "Scan Barcode", exact: true })
      .click();
    await capture("barcode");
    await page.getByLabel("Manual barcode").fill("123");
    await page
      .getByRole("button", { name: "Find Product", exact: true })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
    await capture("barcode-error");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await page.goto("food-database");
    await page.getByTestId("input-search").fill("Synthetic oats");
    await page.getByTestId(`card-food-${sampleFood.id}`).waitFor();
    await capture("food-database");
    await page.getByTestId(`button-edit-${sampleFood.id}`).click();
    await capture("custom-food-editor");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await page.goto("fitness-calculator");
    await expect(
      page.getByText("Weight: 190 lbs", { exact: true }),
    ).toBeVisible();
    await page.locator(".app-content").evaluate((el) => {
      el.scrollTop = 0;
    });
    await capture("fitness-calculator");
    await page
      .getByText("BMI Calculator", { exact: true })
      .scrollIntoViewIfNeeded();
    await capture("calculator-bmi");
    await page.goto("food-tracker");
    await page.getByTestId("button-calculator").click();
    await capture("calculator-modal");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await page.goto("measurements");
    await expect(page.getByLabel("Weight", { exact: true })).toHaveValue("190");
    await capture("measurements");
    await page
      .getByRole("heading", { name: "Trend Graphs", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(page.locator(".recharts-line").first()).toBeVisible();
    await page.locator(".recharts-line").first().hover();
    await capture("measurement-chart");
    expect(await nutritionBytes(page)).toEqual(before);
  });
}

for (const mode of ["dark", "light"]) {
  test(`${mode}: nutrient values, partial records, empty and exceeded bars retain semantics`, async ({
    page,
  }) => {
    await seedNutritionAppearance(page, mode);
    const before = await nutritionBytes(page);
    await expect(page.getByTestId("calories-remaining")).toHaveText("1,700");
    await page
      .getByRole("button", { name: "Nutrition Details", exact: true })
      .click();
    const region = page.getByRole("region", { name: "Nutrition Details" });
    await expect(region.getByTestId("nutrient-sugar")).toContainText(
      "4 / 75 g",
    );
    await expect(region.getByTestId("nutrient-sodium")).toContainText(
      "0 / 2,300 mg",
    );
    await expect(region.getByTestId("nutrient-sodium")).toHaveAttribute(
      "data-complete",
      "true",
    );
    await expect(region.getByTestId("nutrient-vitaminC")).toContainText(
      "Not available",
    );
    await expect(region.getByTestId("nutrient-vitaminC")).toHaveAttribute(
      "data-complete",
      "false",
    );
    await expect(
      region.getByTestId("nutrient-fiber").getByRole("progressbar"),
    ).toHaveAttribute("aria-valuenow", "28.6");
    const track = region.getByTestId("nutrient-sugar").getByRole("progressbar");
    expect(await track.evaluate((el) => getComputedStyle(el).height)).toBe(
      "4px",
    );
    await page.getByTestId("button-previous-day").click();
    await page.getByTestId("button-previous-day").click();
    await expect(region).toContainText("No foods logged.");
    await expect(
      region.getByText("Not available", { exact: false }),
    ).toHaveCount(0);
    await expect(region.getByRole("progressbar")).toHaveCount(0);
    expect(await region.getByRole("img").count()).toBeGreaterThan(10);
    expect(await nutritionBytes(page)).toEqual(before);
    // Synthetic overage fixture exercises the existing cap, not a new calculation.
    await page.evaluate(() => {
      const key = "fitcircle_food_2026-10-19";
      localStorage.setItem(
        key,
        JSON.stringify([
          {
            id: "over",
            name: "Synthetic overage",
            quantity: 1,
            unit: "serving",
            meal: "breakfast",
            servings: 1,
            calories: 2500,
            protein: 200,
            carbs: 300,
            fat: 100,
            sugar: 150,
            sodium: 3000,
            timestamp: "2026-10-19T12:00:00Z",
          },
        ]),
      );
    });
    await page.reload();
    await page
      .getByRole("button", { name: "Nutrition Details", exact: true })
      .click();
    const sugar = page.getByTestId("nutrient-sugar");
    await expect(sugar).toContainText("150 / 75 g");
    await expect(sugar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(
      await sugar
        .getByRole("progressbar")
        .locator("div")
        .evaluate((el) => el.style.width),
    ).toBe("100%");
  });
  test(`${mode}: search, serving edit, custom food persistence and keyboard scrolling`, async ({
    page,
  }) => {
    await seedNutritionAppearance(page, mode);
    const historical = await page.evaluate(() =>
      localStorage.getItem("fitcircle_food_2026-10-18"),
    );
    await page.getByTestId("button-add-breakfast").click();
    await page.getByTestId("input-search").fill("Synthetic oats");
    await page.getByTestId(`button-add-${sampleFood.id}`).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Add Entry");
    await page.getByTestId("input-add-servings").fill("2");
    await page.getByTestId("button-save-add-entry").click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("calories-remaining")).toHaveText("1,400");
    await page.getByRole("button", { name: /^Breakfast \d+ cal$/ }).click();
    await page
      .getByTestId("food-item-logged-appearance")
      .getByRole("button")
      .first()
      .click();
    await page.getByTestId("input-edit-servings").fill("1");
    await page.getByTestId("button-save-edit-entry").click();
    await expect(page.getByTestId("calories-remaining")).toHaveText("1,550");
    await page.goto("food-database");
    await page.getByTestId(`button-edit-${sampleFood.id}`).click();
    await page.getByTestId("input-edit-name").fill("Synthetic renamed oats");
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId(`text-name-${sampleFood.id}`)).toHaveText(
      "Synthetic renamed oats",
    );
    expect(
      await page.evaluate(() =>
        localStorage.getItem("fitcircle_food_2026-10-18"),
      ),
    ).toBe(historical);
    await page.setViewportSize({ width: 320, height: 844 });
    await page.getByTestId(`button-edit-${sampleFood.id}`).click();
    const field = page.getByTestId("input-edit-name");
    await field.focus();
    await page.evaluate(() => {
      Object.defineProperties(window.visualViewport!, {
        height: { configurable: true, value: 430 },
        offsetTop: { configurable: true, value: 40 },
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("resize"));
    });
    await expect
      .poll(
        async () =>
          await page
            .getByRole("dialog")
            .evaluate((el) => el.getBoundingClientRect().bottom),
      )
      .toBeLessThanOrEqual(470);
    await field.scrollIntoViewIfNeeded();
    expect(
      await field.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("none");
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
  });
  test(`${mode}: camera fallback and cached barcode remain usable offline`, async ({
    page,
    context,
  }) => {
    await seedNutritionAppearance(page, mode);
    const before = await nutritionBytes(page);
    await page.getByTestId("button-add-breakfast").click();
    await page
      .getByRole("button", { name: "Scan Barcode", exact: true })
      .click();
    await page.evaluate(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: () =>
            Promise.reject(
              new DOMException("Synthetic denial", "NotAllowedError"),
            ),
        },
      });
    });
    await page
      .getByRole("button", { name: "Start Camera", exact: true })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Stop Camera", exact: true }),
    ).toBeVisible();
    expect(
      await page
        .getByLabel("Barcode camera preview")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(2, 6, 23)");
    await page
      .getByRole("button", { name: "Stop Camera", exact: true })
      .click();
    await context.setOffline(true);
    await page.getByLabel("Manual barcode").fill(sampleFood.barcode);
    await page
      .getByRole("button", { name: "Find Product", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText("Add Entry");
    await expect(page.getByTestId("input-add-servings")).toHaveValue("1");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    expect(await nutritionBytes(page)).toEqual(before);
  });
}
test("System development appearance updates charts, portals and nutrition without data writes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await seedNutritionAppearance(page, "system");
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  const before = await nutritionBytes(page);
  await page.getByTestId("button-add-breakfast").click();
  const surface = await page
    .getByRole("dialog")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "dark");
  await expect
    .poll(() =>
      page
        .getByRole("dialog")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    )
    .not.toBe(surface);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.goto("measurements");
  const dot = page.locator(".recharts-dot").first();
  const dark = await dot.evaluate((el) => getComputedStyle(el).fill);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  expect(await dot.evaluate((el) => getComputedStyle(el).fill)).not.toBe(dark);
  expect(await nutritionBytes(page)).toEqual(before);
});

for (const mode of ["dark", "light"]) {
  test(`${mode}: calculator objectives, select portals, validation and embedded keyboard form`, async ({
    page,
  }) => {
    await seedNutritionAppearance(page, mode);
    const before = await nutritionBytes(page);
    await page.goto("fitness-calculator");
    const readCalories = () =>
      page
        .getByText("calories per day", { exact: true })
        .locator("..")
        .innerText();
    await expect(
      page.getByText("Weight: 190 lbs", { exact: true }),
    ).toBeVisible();
    const standalone = await readCalories();
    for (const label of ["Lose Weight", "Gain Weight", "Maintain"]) {
      const goal = page.getByRole("button", { name: label, exact: true });
      await goal.click();
      await expect(goal).toHaveAttribute("aria-pressed", "true");
      if (mode === "light")
        expect((await textContrast(page)).failures).toEqual([]);
    }
    await page.getByRole("combobox").first().click();
    await expect(page.getByRole("listbox")).toBeVisible();
    if (mode === "light")
      expect(
        await page
          .getByRole("listbox")
          .evaluate((el) => getComputedStyle(el).color),
      ).not.toBe("rgb(255, 255, 255)");
    await page
      .getByRole("option", { name: "Moderate (3-5 days/week)", exact: true })
      .click();
    expect(await readCalories()).toBe(standalone);
    await page.getByLabel("Carbs %", { exact: true }).fill("200");
    await expect(page.getByRole("alert")).toContainText("total 100%");
    await page.getByLabel("Carbs %", { exact: true }).fill("40");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.goto("food-tracker");
    await page.getByTestId("button-calculator").click();
    await expect(page.getByRole("dialog")).toContainText(
      standalone.split("\n")[0],
    );
    const input = page.getByLabel("Fat %", { exact: true });
    await input.scrollIntoViewIfNeeded();
    await input.focus();
    await page.evaluate(() => {
      Object.defineProperties(window.visualViewport!, {
        height: { configurable: true, value: 430 },
        offsetTop: { configurable: true, value: 40 },
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await expect
      .poll(() =>
        page
          .getByRole("dialog")
          .evaluate((el) => el.getBoundingClientRect().bottom),
      )
      .toBeLessThanOrEqual(470);
    await input.scrollIntoViewIfNeeded();
    expect(
      await input.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("none");
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Close", exact: true }),
    ).toBeVisible();
    expect(await nutritionBytes(page)).toEqual(before);
  });
  test(`${mode}: malformed measurement history stays intact in error state`, async ({
    page,
  }) => {
    await seedNutritionAppearance(page, mode);
    const malformed = '{"weight":"synthetic invalid"}';
    await page.evaluate(
      (raw) => localStorage.setItem("fitcircle_measurements_history", raw),
      malformed,
    );
    await page.goto("measurements");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Measurements", exact: true }),
    ).toBeDisabled();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("fitcircle_measurements_history"),
      ),
    ).toBe(malformed);
    if (mode === "light")
      expect((await textContrast(page)).failures).toEqual([]);
  });
}
test.describe("production gate", () => {
  test.use({ baseURL: "http://127.0.0.1:4173/FitCircle/" });
  test("Phase 3 routes remain Dark with saved Light or System preferences", async ({
    page,
  }) => {
    for (const preference of ["light", "system"]) {
      await page.emulateMedia({ colorScheme: "light" });
      // clock is installed once per page; remaining iterations reuse it.
      if (preference === "light")
        await seedNutritionAppearance(page, preference);
      else
        await page.evaluate(() =>
          localStorage.setItem("fitcircle_appearance", "system"),
        );
      for (const route of [
        "food-tracker",
        "food-database",
        "fitness-calculator",
        "measurements",
      ]) {
        await page.goto(route);
        await expect(page.locator(".app-shell")).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute(
          "data-appearance",
          "dark",
        );
      }
    }
  });
});

for (const mode of ["dark", "light"])
  test(`${mode}: nutrition fills and measurement series retain graphical contrast`, async ({
    page,
  }) => {
    await seedNutritionAppearance(page, mode);
    const barRatios = await page
      .getByRole("progressbar")
      .evaluateAll((bars) => {
        const lum = (s: string) => {
          const rgb = s
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((x) => x / 255)
            .map((x) =>
              x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4,
            );
          return rgb.reduce(
            (v, x, i) => v + x * [0.2126, 0.7152, 0.0722][i],
            0,
          );
        };
        return bars.map((bar) => {
          const values = [
            lum(getComputedStyle(bar).backgroundColor),
            lum(getComputedStyle(bar.firstElementChild!).backgroundColor),
          ].sort((a, b) => a - b);
          return (values[1] + 0.05) / (values[0] + 0.05);
        });
      });
    expect(barRatios).toHaveLength(4);
    barRatios.forEach((ratio) => expect(ratio).toBeGreaterThanOrEqual(3));
    await page.goto("measurements");
    const series = page.locator(".recharts-line-curve").first();
    await expect(series).toBeAttached();
    expect(await series.evaluate((el) => getComputedStyle(el).stroke)).toBe(
      mode === "light" ? "rgb(37, 99, 235)" : "rgb(59, 130, 246)",
    );
    expect(
      await page
        .locator(".recharts-cartesian-axis-tick text")
        .first()
        .evaluate((el) => getComputedStyle(el).fill),
    ).toBe(mode === "light" ? "rgb(71, 85, 105)" : "rgb(148, 163, 184)");
  });
