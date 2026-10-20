import { test, expect, type Page } from "@playwright/test";
test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
const food = {
  id: "synthetic-food",
  name: "Synthetic oats",
  brand: "Synthetic brand",
  barcode: "3017620422003",
  quantity: 40,
  unit: "g",
  calories: 100,
  carbs: 12,
  protein: 5,
  fat: 3,
  fiber: 0,
  sodium: 0,
  potassium: 120,
  vitaminC: 5,
};
const today = "2026-10-20",
  yesterday = "2026-10-19";
async function seed(page: Page) {
  await page.clock.install({ time: new Date("2026-10-20T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate(
    ({ food, today, yesterday }) => {
      localStorage.setItem("fitcircle_food_database", JSON.stringify([food]));
      localStorage.setItem("fitcircle_food_database_migrated", "true");
      localStorage.setItem(
        `fitcircle_food_${today}`,
        JSON.stringify([
          {
            ...food,
            id: "today",
            servings: 2,
            meal: "breakfast",
            timestamp: `${today}T12:00:00Z`,
          },
        ]),
      );
      localStorage.setItem(
        `fitcircle_food_${yesterday}`,
        JSON.stringify([
          {
            ...food,
            id: "yesterday",
            servings: 1,
            meal: "lunch",
            timestamp: `${yesterday}T12:00:00Z`,
          },
        ]),
      );
      localStorage.setItem("unrelated-nutrition-test", "retain");
      localStorage.setItem("fitness_calc_target_calories", "1800");
      localStorage.setItem("fitness_calc_target_protein", "110");
      localStorage.setItem("fitness_calc_target_carbs", "200");
      localStorage.setItem("fitness_calc_target_fat", "65");
    },
    { food, today, yesterday },
  );
  await page.goto("food-tracker");
}
async function addSearch(page: Page, meal = "breakfast") {
  await page.getByTestId(`button-add-${meal}`).click();
  await page.getByTestId("input-search").fill("Synthetic oats");
  await page
    .getByTestId(`row-food-${food.id}`)
    .getByTestId(`button-add-${food.id}`)
    .click();
}
test("dashboard, explicit goals, detailed data coverage, weekly averages and offline reload", async ({
  page,
  context,
}) => {
  await seed(page);
  const original = await page.evaluate(() =>
    localStorage.getItem("fitcircle_food_2026-10-19"),
  );
  await expect(page.getByTestId("calories-remaining")).toHaveText("1,600");
  await page
    .getByRole("button", { name: "Nutrition Goals", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Calories target")).not.toBeFocused();
  await expect(dialog.getByLabel("Nutrition focus")).not.toBeFocused();
  await dialog
    .getByRole("button", { name: "Review Saved Calculator Estimate" })
    .click();
  await expect(dialog.getByLabel("Calories target")).toHaveValue("1800");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_nutrition_goals"),
    ),
  ).toBeNull();
  await dialog.getByLabel("Calories target").fill("150");
  await dialog.getByLabel("Protein target").fill("80");
  await dialog.getByLabel("Nutrition focus").selectOption("Maintain weight");
  await dialog.getByRole("button", { name: "Save Goals", exact: true }).click();
  await expect(
    page.getByText("Above daily target", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("calories-remaining")).toHaveText("50");
  await page.evaluate(() =>
    localStorage.setItem("fitness_calc_target_calories", "3000"),
  );
  await page.reload();
  await expect(page.getByTestId("calories-remaining")).toHaveText("50");
  await page
    .getByRole("button", { name: "Nutrition Details", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "1 of 1 foods have data",
  );
  await expect(page.getByRole("dialog")).toContainText("Not available");
  await expect(
    page.getByRole("dialog").getByText("240 mg", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Weekly Overview", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "2 days with recorded intake",
  );
  await expect(
    page.getByRole("dialog").getByText("150 kcal", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("calories-remaining")).toHaveText("50");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_food_2026-10-19"),
    ),
  ).toBe(original);
});
test("historical add, serving edits, meal changes and deletion touch only the selected date", async ({
  page,
}) => {
  await seed(page);
  const current = await page.evaluate(() =>
    localStorage.getItem("fitcircle_food_2026-10-20"),
  );
  await page.getByTestId("button-previous-day").click();
  await addSearch(page, "dinner");
  await page.getByTestId("input-add-servings").fill("2.5");
  await page.getByTestId("button-save-add-entry").click();
  await page
    .getByRole("button", { name: "Dinner 250 cal", exact: true })
    .click();
  const row = page
    .locator('[data-testid^="food-item-"]')
    .filter({ hasText: "Synthetic oats" })
    .last();
  await row.getByRole("button").first().click();
  await page.getByTestId("input-edit-servings").fill("0.5");
  await page.locator("#edit-meal").click();
  await page.getByRole("option", { name: "Snack", exact: true }).click();
  await page.getByTestId("button-save-edit-entry").click();
  await expect(
    page.getByRole("button", { name: "Snacks 50 cal", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Snacks 50 cal", exact: true })
    .click();
  await row.getByRole("button", { name: "Delete Synthetic oats" }).click();
  await expect(
    page.getByRole("button", { name: "Dinner 0 cal", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_food_2026-10-20"),
    ),
  ).toBe(current);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_2026-10-19")!),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0].id).toBe("yesterday");
});
test("quota failures retain diary and goal drafts and never show successful logging", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (
        key === "fitcircle_food_2026-10-20" ||
        key === "fitcircle_nutrition_goals"
      )
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await addSearch(page);
  await page.getByTestId("input-add-servings").fill("3");
  await page.getByTestId("button-save-add-entry").click();
  await expect(
    page.getByRole("dialog", { name: "Add Entry", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("input-add-servings")).toHaveValue("3");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!).length,
    ),
  ).toBe(1);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Nutrition Goals", exact: true })
    .click();
  await page.getByLabel("Calories target").fill("1800");
  await page.getByRole("button", { name: "Save Goals", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "could not be saved",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_nutrition_goals"),
    ),
  ).toBeNull();
});
test("malformed diary cannot be replaced by empty initialization or editing", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_food_2026-10-20", "{synthetic"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "Original records are unchanged",
  );
  await expect(page.getByTestId("button-add-breakfast")).toBeDisabled();
  await page.getByTestId("button-previous-day").click();
  await page.getByTestId("button-next-day").click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_food_2026-10-20"),
    ),
  ).toBe("{synthetic");
});
async function openBarcode(page: Page) {
  await page.getByTestId("button-add-breakfast").click();
  await page.getByRole("button", { name: "Scan Barcode", exact: true }).click();
}
test("manual barcode uses local products offline and retains all nutrients when logged", async ({
  page,
  context,
}) => {
  await seed(page);
  await context.setOffline(true);
  await openBarcode(page);
  await page.getByLabel("Manual barcode").fill(food.barcode);
  await page.getByRole("button", { name: "Find Product" }).click();
  await expect(page.getByText("Review Product", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Product Sodium", { exact: true })).toHaveValue(
    "0",
  );
  await page.getByRole("button", { name: "Use Reviewed Food" }).click();
  await page.getByTestId("button-save-add-entry").click();
  const entries = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!),
  );
  expect(entries).toHaveLength(2);
  expect(entries[1]).toMatchObject({
    potassium: 120,
    vitaminC: 5,
    sodium: 0,
    meal: "breakfast",
  });
});
test("remote product review preserves unknown fields, saves offline product explicitly and does not overwrite another food", async ({
  page,
}) => {
  await seed(page);
  await page.route(
    "https://world.openfoodfacts.org/api/v3/product/**",
    (route) =>
      route.fulfill({
        json: {
          status: "success",
          product: {
            code: "036000291452",
            product_name: "Synthetic scanned bar",
            brands: "Synthetic maker",
            nutrition: {
              aggregated_set: {
                per: "100g",
                preparation: "as_sold",
                nutrients: {
                  "energy-kcal": { value: 250, unit: "kcal" },
                  proteins: { value: 8, unit: "g" },
                  carbohydrates: { value: 40, unit: "g" },
                  fat: { value: 6, unit: "g" },
                  salt: { value: 0.5, unit: "g" },
                },
              },
            },
          },
        },
      }),
  );
  await openBarcode(page);
  await page.getByLabel("Manual barcode").fill("036000291452");
  await page.getByRole("button", { name: "Find Product" }).click();
  await expect(page.getByLabel("Product Fiber", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Product Sodium", { exact: true })).toHaveValue(
    "200",
  );
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Use Reviewed Food" }).click();
  await page.getByTestId("input-add-servings").fill("0.4");
  await page.getByTestId("button-save-add-entry").click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_database")!),
  );
  expect(saved).toHaveLength(2);
  expect(saved[0]).toEqual(food);
  expect(saved[1]).toMatchObject({
    barcode: "036000291452",
    source: "Open Food Facts",
    sodium: 200,
  });
  expect(saved[1].fiber).toBeUndefined();
  const entries = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!),
  );
  expect(entries[1]).toMatchObject({
    calories: 250,
    servings: 0.4,
    meal: "breakfast",
  });
});
test("missing core barcode nutrients require label review; camera denial leaves manual fallback usable", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(
            new DOMException("Synthetic camera denied", "NotAllowedError"),
          ),
      },
    }),
  );
  await openBarcode(page);
  await page.getByRole("button", { name: "Start Camera" }).click();
  await expect(page.getByRole("alert")).toContainText("printed barcode");
  await page.getByRole("button", { name: "Stop Camera" }).click();
  await expect(page.getByLabel("Manual barcode")).toBeVisible();
  await page.route(
    "https://world.openfoodfacts.org/api/v3/product/**",
    (route) =>
      route.fulfill({
        json: {
          status: 1,
          product: {
            code: "036000291452",
            product_name: "Synthetic incomplete label",
            nutriments: { fat_serving: 0 },
          },
        },
      }),
  );
  await page.getByLabel("Manual barcode").fill("036000291452");
  await page.getByRole("button", { name: "Find Product" }).click();
  await page.getByRole("button", { name: "Use Reviewed Food" }).click();
  await expect(page.getByRole("alert")).toContainText("required");
  await expect(
    page.getByLabel("Product Calories", { exact: true }),
  ).toHaveValue("");
});
test("camera permission resolved after closing releases tracks and cannot reopen the review", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    const state = window as typeof window & {
      resolveCamera?: (value: unknown) => void;
      stopped?: number;
    };
    state.stopped = 0;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          new Promise((resolve) => {
            state.resolveCamera = resolve;
          }),
      },
    });
  });
  await openBarcode(page);
  await page.getByRole("button", { name: "Start Camera" }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() => {
    const state = window as typeof window & {
      resolveCamera?: (value: unknown) => void;
      stopped: number;
    };
    state.resolveCamera?.({
      getTracks: () => [{ stop: () => state.stopped++ }],
    });
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { stopped: number }).stopped,
      ),
    )
    .toBe(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("compact nutrition layouts and secondary views stay reachable at small and desktop sizes", async ({
  page,
}) => {
  await seed(page);
  for (const width of [320, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Nutrition Details", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByText("Vitamin C", { exact: true })
      .scrollIntoViewIfNeeded();
    await expect(dialog.getByText("Vitamin C", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByTestId("button-add-snack").scrollIntoViewIfNeeded();
    const add = await page.getByTestId("button-add-snack").boundingBox();
    const dock = await page.locator(".app-dock").boundingBox();
    const boundary = dock?.y ?? 844;
    expect(add!.y + add!.height).toBeLessThanOrEqual(boundary);
  }
});

test("custom foods retain missing nutrient data and enter the shared serving confirmation", async ({
  page,
}) => {
  await seed(page);
  await page.getByTestId("button-add-lunch").click();
  await page.getByTestId("button-create-custom-food").click();
  await page.getByTestId("input-custom-name").fill("Synthetic homemade soup");
  for (const key of ["calories", "protein", "carbs", "fat"])
    await page
      .getByTestId(`input-custom-${key}`)
      .fill(key === "calories" ? "85" : "5");
  await page.getByTestId("button-save-custom").click();
  await expect(
    page.getByRole("dialog", { name: "Add Entry", exact: true }),
  ).toBeVisible();
  await page.getByTestId("button-save-add-entry").click();
  const entries = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!),
  );
  expect(entries[1]).toMatchObject({
    name: "Synthetic homemade soup",
    meal: "lunch",
    calories: 85,
  });
  expect(entries[1].sodium).toBeUndefined();
  await page.reload();
  await page.getByRole("button", { name: "Lunch 85 cal", exact: true }).click();
  await expect(
    page.getByText("Synthetic homemade soup", { exact: true }),
  ).toBeVisible();
});
test("closing an active decoder stops the synthetic video stream", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext("2d")!.fillRect(0, 0, 320, 240);
    const stream = canvas.captureStream(5);
    (window as typeof window & { testStream: MediaStream }).testStream = stream;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => stream },
    });
  });
  await openBarcode(page);
  await page.getByRole("button", { name: "Start Camera" }).click();
  await expect
    .poll(() =>
      page
        .getByLabel("Barcode camera preview")
        .evaluate((video) => (video as HTMLVideoElement).srcObject !== null),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as typeof window & { testStream: MediaStream }).testStream
          .getTracks()
          .every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
});
