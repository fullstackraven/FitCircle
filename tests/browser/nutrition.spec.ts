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
test("dashboard uses calculator targets rather than obsolete nutrition goals and retains offline history", async ({
  page,
  context,
}) => {
  await seed(page);
  const original = await page.evaluate(() =>
    localStorage.getItem("fitcircle_food_2026-10-19"),
  );
  const legacyGoals = '{"calories":150,"protein":80,"carbs":20,"fat":5}';
  await page.evaluate(
    (raw) => localStorage.setItem("fitcircle_nutrition_goals", raw),
    legacyGoals,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Nutrition Goals", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("calories-remaining")).toHaveText("1,600");
  await page.evaluate(() =>
    localStorage.setItem("fitness_calc_target_calories", "3000"),
  );
  await page.reload();
  await expect(page.getByTestId("calories-remaining")).toHaveText("2,800");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_nutrition_goals"),
    ),
  ).toBe(legacyGoals);
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
  await expect(page.getByTestId("calories-remaining")).toHaveText("2,800");
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
test("quota failures retain diary drafts and never show successful logging", async ({
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
  await expect(
    page.getByRole("heading", { name: "Add Entry", exact: true }),
  ).toBeVisible();
  await page.getByText("Edit label nutrition", { exact: true }).click();
  await expect(page.getByLabel("Product Sodium", { exact: true })).toHaveValue(
    "0",
  );
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
test("scans open Add Entry, automatically cache label servings and remain usable offline", async ({
  page,
  context,
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
            serving_size: "1 bar (40 g)",
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
  await page.getByText("Edit label nutrition", { exact: true }).click();
  await expect(page.getByLabel("Product Fiber", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Product Sodium", { exact: true })).toHaveValue(
    "80",
  );
  await expect(
    page.getByLabel("Product serving quantity", { exact: true }),
  ).toHaveValue("40");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByTestId("input-add-servings").fill("1");
  await page.getByTestId("button-save-add-entry").click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_database")!),
  );
  expect(saved).toHaveLength(2);
  expect(saved[0]).toEqual(food);
  expect(saved[1]).toMatchObject({
    barcode: "036000291452",
    source: "Open Food Facts",
    sodium: 80,
  });
  expect(saved[1].fiber).toBeUndefined();
  const entries = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!),
  );
  expect(entries[1]).toMatchObject({
    calories: 100,
    quantity: 40,
    servings: 1,
    meal: "breakfast",
  });
  await page.unroute("https://world.openfoodfacts.org/api/v3/product/**");
  await context.setOffline(true);
  await page.reload();
  await openBarcode(page);
  await page.getByLabel("Manual barcode").fill("036000291452");
  await page.getByRole("button", { name: "Find Product" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Entry", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Product serving quantity", { exact: true }),
  ).toHaveValue("40");
  await expect(
    page.getByRole("button", { name: "Use Reviewed Food" }),
  ).toHaveCount(0);
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
  await page.getByTestId("button-save-add-entry").click();
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

for (const event of ["pagehide", "visibilitychange"])
  test(`camera stops on ${event} without automatically restarting`, async ({
    page,
  }) => {
    await seed(page);
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const stream = canvas.captureStream(5);
      (window as typeof window & { reviewStream: MediaStream }).reviewStream =
        stream;
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
          .evaluate((el) => (el as HTMLVideoElement).srcObject !== null),
      )
      .toBe(true);
    await page.evaluate((event) => {
      if (event === "visibilitychange") {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event(event));
      } else window.dispatchEvent(new Event(event));
    }, event);
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as typeof window & { reviewStream: MediaStream }).reviewStream
            .getTracks()
            .every((track) => track.readyState === "ended"),
        ),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", { name: "Start Camera" }),
    ).toBeVisible();
  });

test("base product nutrition and consumed multiplier remain distinct in review and diary", async ({
  page,
}) => {
  await seed(page);
  await openBarcode(page);
  await page.getByLabel("Manual barcode").fill(food.barcode);
  await page.getByRole("button", { name: "Find Product" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Entry", exact: true }),
  ).toBeVisible();
  await page.getByText("Edit label nutrition", { exact: true }).click();
  await page.getByLabel("Product Calories", { exact: true }).fill("120");
  await page.getByLabel("Product serving quantity", { exact: true }).fill("80");
  await page.getByLabel("Servings eaten (multiplier)").fill("2.5");
  await expect(
    page.getByText("2.5 × 80 g = 200 g consumed", { exact: true }),
  ).toBeVisible();
  await page.getByTestId("button-save-add-entry").click();
  const stored = await page.evaluate(() => ({
    catalog: JSON.parse(localStorage.getItem("fitcircle_food_database")!),
    entries: JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!),
  }));
  expect(stored.catalog[0]).toEqual(food);
  expect(stored.entries[1]).toMatchObject({
    calories: 240,
    quantity: 80,
    unit: "g",
    servings: 2.5,
  });
});

test("complete Settings backup restores historical diary bytes, missing nutrients and scanned products without loss", async ({
  page,
}) => {
  await seed(page);
  const before = await page.evaluate((food) => {
    const scanned = {
      ...food,
      id: "custom-scan-review",
      name: "Synthetic scanned product",
      source: "Open Food Facts",
      sourceUrl: "https://world.openfoodfacts.org/product/3017620422003",
      vitaminA: 0.01,
      cholesterol: 0,
      reviewMetadata: { keep: true },
    };
    const legacy = {
      ...food,
      id: "legacy-review",
      meal: "lunch",
      timestamp: "2025-11-17T18:00:00.123456Z",
    };
    const values: Record<string, string> = {
      fitcircle_food_database: JSON.stringify([food, scanned], null, 2),
      "fitcircle_food_2025-11-17": JSON.stringify([legacy], null, 2),
      "fitcircle_food_2026-10-19": JSON.stringify(
        [
          {
            ...scanned,
            meal: "dinner",
            servings: 0.4,
            timestamp: "2026-10-19T18:00:00.123Z",
          },
        ],
        null,
        2,
      ),
      "fitcircle_food_2026-10-20": localStorage.getItem(
        "fitcircle_food_2026-10-20",
      )!,
      fitcircle_nutrition_goals: JSON.stringify({
        calories: 2100,
        protein: 120,
        carbs: 240,
        fat: 70,
      }),
    };
    for (const [key, value] of Object.entries(values))
      localStorage.setItem(key, value);
    return values;
  }, food);
  await page.goto("settings");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Complete Backup" }).click();
  const stream = await (await downloadEvent).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  for (const [key, value] of Object.entries(before))
    expect(backup.localStorage[key]).toBe(value);
  await page.evaluate(() => {
    localStorage.setItem("fitcircle_food_2025-11-17", "[]");
    localStorage.setItem("fitcircle_food_database", "[]");
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic-complete.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.waitForURL(/\/FitCircle\/$/);
  const after = await page.evaluate(
    (keys) =>
      Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
    Object.keys(before),
  );
  expect(after).toEqual(before);
  expect(
    await page.evaluate(() => localStorage.getItem("unrelated-nutrition-test")),
  ).toBe("retain");
  await page.goto("food-tracker");
  await page
    .getByRole("button", { name: "Nutrition Details", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Not available", { exact: true })
      .first(),
  ).toBeVisible();
});

test("nutrition details distinguish a known zero, an incomplete zero total, missing data and trace intake", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate((food) => {
    localStorage.setItem(
      "fitcircle_food_2026-10-20",
      JSON.stringify([
        {
          ...food,
          id: "known-zero",
          servings: 1,
          meal: "breakfast",
          timestamp: "2026-10-20T12:00:00Z",
        },
        {
          ...food,
          id: "partial",
          fiber: undefined,
          vitaminA: 0.01,
          servings: 1,
          meal: "lunch",
          timestamp: "2026-10-20T12:00:00Z",
        },
      ]),
    );
  }, food);
  await page.reload();
  await page
    .getByRole("button", { name: "Nutrition Details", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Fiber", { exact: true }).locator(".."),
  ).toContainText("0 g known");
  await expect(
    dialog.getByText("Sodium", { exact: true }).locator(".."),
  ).toContainText("0 mg");
  await expect(
    dialog.getByText("Sugar", { exact: true }).locator(".."),
  ).toContainText("Not available");
  await expect(
    dialog.getByText("Vitamin A", { exact: true }).locator(".."),
  ).toContainText("< 0.1 µg known");
});

test("unit conversion requests an explicit piece weight and rescales consumed nutrients without altering saved foods", async ({
  page,
}) => {
  await seed(page);
  await addSearch(page);
  await page
    .getByLabel("Product serving unit", { exact: true })
    .selectOption("piece");
  await page.getByLabel("Product serving quantity", { exact: true }).fill("2");
  await page.getByTestId("button-save-add-entry").click();
  await expect(page.getByRole("alert")).toContainText("equivalent");
  await page.getByLabel("Equivalent original quantity").fill("30");
  await page.getByTestId("input-add-servings").fill("2");
  await expect(page.getByTestId("entry-nutrition-summary")).toContainText(
    "300",
  );
  await page.getByTestId("button-save-add-entry").click();
  const data = await page.evaluate(() => ({
    catalog: JSON.parse(localStorage.getItem("fitcircle_food_database")!),
    entries: JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!),
  }));
  expect(data.catalog[0]).toEqual(food);
  expect(data.entries[1]).toMatchObject({
    quantity: 2,
    unit: "piece",
    calories: 150,
    protein: 7.5,
    servings: 2,
    sodium: 0,
  });
});

test("automatic scan caching failure blocks logging; diary failure retains cached product and retry avoids duplicates", async ({
  page,
}) => {
  await seed(page);
  await page.route(
    "https://world.openfoodfacts.org/api/v3/product/**",
    (route) =>
      route.fulfill({
        json: {
          status: 1,
          product: {
            code: "036000291452",
            product_name: "Synthetic retry product",
            serving_size: "30 g",
            nutriments: {
              "energy-kcal_100g": 500,
              proteins_100g: 10,
              carbohydrates_100g: 60,
              fat_100g: 20,
            },
          },
        },
      }),
  );
  await openBarcode(page);
  await page.getByLabel("Manual barcode").fill("036000291452");
  await page.getByRole("button", { name: "Find Product" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Entry", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).restoreSyntheticStorage = () =>
      (Storage.prototype.setItem = original);
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitcircle_food_database")
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByTestId("button-save-add-entry").click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!).length,
    ),
  ).toBe(1);
  await page.evaluate(() => {
    (window as any).restoreSyntheticStorage();
    const original = Storage.prototype.setItem;
    (window as any).restoreSyntheticStorage = () =>
      (Storage.prototype.setItem = original);
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitcircle_food_2026-10-20")
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByTestId("button-save-add-entry").click();
  await expect(page.getByRole("alert")).toContainText(
    "Product is saved offline",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("fitcircle_food_database")!).length,
    ),
  ).toBe(2);
  await page.evaluate(() => (window as any).restoreSyntheticStorage());
  await page.getByTestId("button-save-add-entry").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("fitcircle_food_database")!).length,
    ),
  ).toBe(2);
  const entries = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_food_2026-10-20")!),
  );
  expect(entries).toHaveLength(2);
  expect(entries[1]).toMatchObject({
    quantity: 30,
    unit: "g",
    calories: 150,
    servings: 1,
  });
});

test("calculator immediately controls diary calories and personal macros, survives reopening and rejects invalid splits", async ({
  page,
  context,
}) => {
  await seed(page);
  await page.evaluate(() => {
    localStorage.setItem("fitcircle_age", "31");
    localStorage.setItem(
      "fitcircle_measurements_history",
      JSON.stringify({
        weight: [{ date: "2026-10-01", value: 170 }],
        height: [{ date: "2026-10-01", value: 70 }],
      }),
    );
    localStorage.setItem(
      "fitcircle_nutrition_goals",
      "{synthetic obsolete goals",
    );
    localStorage.setItem("fitness_calc_macro_style", "standard");
  });
  const history = await page.evaluate(() =>
    localStorage.getItem("fitcircle_food_2026-10-20"),
  );
  await page.getByTestId("button-calculator").click();
  const dialog = page.getByRole("dialog", {
    name: "Fitness Calculator",
    exact: true,
  });
  for (const name of ["Standard", "High Protein", "Low Carb", "Tailored"])
    await expect(dialog.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(
    dialog.getByText("Compare Styles:", { exact: true }),
  ).toHaveCount(0);
  await dialog.getByLabel("Carbs %", { exact: true }).fill("50");
  await dialog.getByLabel("Protein %", { exact: true }).fill("25");
  await dialog.getByLabel("Fat %", { exact: true }).fill("25");
  await dialog
    .getByRole("button", { name: "Gain Weight", exact: true })
    .click();
  const calories = await page.evaluate(() =>
    Number(localStorage.getItem("fitness_calc_target_calories")),
  );
  expect(calories).toBeGreaterThan(1800);
  await expect(page.getByTestId("calories-remaining")).toHaveText(
    (calories - 200).toLocaleString(),
  );
  expect(
    await page.evaluate(() =>
      Number(localStorage.getItem("fitness_calc_target_protein")),
    ),
  ).toBe(Math.round((calories * 0.25) / 4));
  const targets = await page.evaluate(() =>
    ["calories", "protein", "carbs", "fat"].map((key) =>
      localStorage.getItem(`fitness_calc_target_${key}`),
    ),
  );
  await dialog.getByLabel("Carbs %", { exact: true }).fill("");
  await expect(dialog.getByRole("alert")).toContainText("total 100%");
  expect(
    await page.evaluate(() =>
      ["calories", "protein", "carbs", "fat"].map((key) =>
        localStorage.getItem(`fitness_calc_target_${key}`),
      ),
    ),
  ).toEqual(targets);
  await dialog.getByLabel("Carbs %", { exact: true }).fill("50");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByTestId("button-calculator").click();
  await expect(dialog.getByLabel("Carbs %", { exact: true })).toHaveValue("50");
  await expect(dialog.getByLabel("Protein %", { exact: true })).toHaveValue(
    "25",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await expect(page.getByTestId("calories-remaining")).toHaveText(
    (calories - 200).toLocaleString(),
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_nutrition_goals"),
    ),
  ).toBe("{synthetic obsolete goals");
  expect(
    await page.evaluate(() => localStorage.getItem("fitness_calc_macro_style")),
  ).toBe("standard");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_food_2026-10-20"),
    ),
  ).toBe(history);
  const other = await context.newPage();
  await other.goto("profile");
  await other.evaluate(() =>
    localStorage.setItem("fitness_calc_target_calories", "2200"),
  );
  await expect(page.getByTestId("calories-remaining")).toHaveText("2,000");
  await other.close();
});

test("calculator target write failures are visible and do not claim a successful dashboard update", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    localStorage.setItem("fitcircle_age", "31");
    localStorage.setItem(
      "fitcircle_measurements_history",
      JSON.stringify({
        weight: [{ date: "2026-10-01", value: 170 }],
        height: [{ date: "2026-10-01", value: 70 }],
      }),
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("fitness_calc_target_"))
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByTestId("button-calculator").click();
  const dialog = page.getByRole("dialog", {
    name: "Fitness Calculator",
    exact: true,
  });
  await expect(dialog.getByRole("alert")).toContainText(
    "Could not save calculator targets",
  );
  await dialog
    .getByRole("button", { name: "Gain Weight", exact: true })
    .click();
  await expect(page.getByTestId("calories-remaining")).toHaveText("1,600");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitness_calc_target_calories"),
    ),
  ).toBe("1800");
});
