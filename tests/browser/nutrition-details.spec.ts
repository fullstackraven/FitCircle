import { test, expect, type Page } from "@playwright/test";
test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
const entry = {
  id: "synthetic",
  name: "Synthetic complete food",
  brand: "Synthetic",
  quantity: 1,
  unit: "serving",
  servings: 1,
  meal: "breakfast",
  timestamp: "2026-10-21T12:00:00.123Z",
  calories: 1000,
  protein: 75,
  carbs: 112,
  fat: 30,
  fiber: 14,
  sugar: 24,
  sodium: 2450,
  saturatedFat: 16,
  cholesterol: 45,
  potassium: 1700,
  calcium: 508,
  iron: 6,
  vitaminA: 0.01,
  vitaminC: 45,
  source: "Open Food Facts",
  retained: "synthetic metadata",
};
async function seed(page: Page, partial = false) {
  await page.clock.install({ time: new Date("2026-10-21T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate(
    ({ entry, partial }) => {
      localStorage.setItem(
        "fitcircle_profile",
        JSON.stringify({
          dateOfBirth: "1995-10-21",
          age: 99,
          gender: "male",
          retained: "profile metadata",
        }),
      );
      localStorage.setItem(
        "fitcircle_nutrition_goals",
        '{"calories":1900,"protein":100,"carbs":200,"fat":65,"retained":"manual goals"}',
      );
      for (const [key, value] of Object.entries({
        calories: 2000,
        protein: 150,
        carbs: 225,
        fat: 65,
      }))
        localStorage.setItem("fitness_calc_target_" + key, String(value));
      localStorage.setItem(
        "fitcircle_food_2026-10-21",
        JSON.stringify(
          partial
            ? [
                entry,
                {
                  ...entry,
                  id: "partial",
                  fiber: undefined,
                  sodium: 0,
                  calcium: undefined,
                  iron: undefined,
                  sugar: undefined,
                  vitaminA: undefined,
                  vitaminC: undefined,
                },
              ]
            : [entry],
        ),
      );
      localStorage.setItem(
        "fitcircle_food_2026-10-20",
        JSON.stringify([
          { ...entry, id: "historical", timestamp: "2026-10-20T18:00:00.123Z" },
        ]),
      );
      localStorage.setItem("fitcircle_food_database", JSON.stringify([entry]));
      localStorage.setItem("fitcircle_food_database_migrated", "true");
    },
    { entry, partial },
  );
  await page.goto("food-tracker");
  await expect(page.getByTestId("button-add-breakfast")).toBeVisible();
}
const originals = (page: Page) =>
  page.evaluate(() =>
    [
      "fitcircle_profile",
      "fitcircle_nutrition_goals",
      "fitcircle_food_2026-10-21",
      "fitcircle_food_2026-10-20",
      "fitcircle_food_database",
      ...["calories", "protein", "carbs", "fat"].map(
        (key) => "fitness_calc_target_" + key,
      ),
    ].map((key) => localStorage.getItem(key)),
  );
const open = async (page: Page) => {
  await page
    .getByRole("button", { name: "Nutrition Details", exact: true })
    .click();
  return page.getByRole("region", { name: "Nutrition Details", exact: true });
};
test("compact rows compare correct age/sex references, limit overflow and preserve all original bytes", async ({
  page,
}) => {
  await seed(page);
  const before = await originals(page);
  const dialog = await open(page);
  await expect(dialog.getByTestId("nutrient-calcium")).toContainText(
    "508 / 1,000 mg",
  );
  await expect(
    dialog.getByRole("progressbar", { name: "Calcium", exact: true }),
  ).toHaveAttribute("aria-valuenow", "50.8");
  await expect(dialog.getByTestId("nutrient-fiber")).toContainText("14 / 28 g");
  await expect(
    dialog.getByRole("progressbar", { name: "Fiber", exact: true }),
  ).toHaveAttribute("aria-valuenow", "50");
  await expect(dialog.getByTestId("nutrient-sodium")).toContainText(
    "2,450 / 2,300 mg",
  );
  await expect(dialog.getByTestId("nutrient-sodium")).not.toContainText(
    "limit",
  );
  await expect(dialog.getByTestId("nutrient-saturatedFat")).not.toContainText(
    "limit",
  );
  await expect(dialog.getByTestId("nutrient-cholesterol")).toContainText(
    "45 / 300 mg",
  );
  const sodium = dialog.getByRole("progressbar", {
    name: "Sodium",
    exact: true,
  });
  await expect(sodium).toHaveAttribute("aria-valuenow", "100");
  expect(
    await sodium
      .locator("div")
      .evaluate((el) => (el as HTMLElement).style.width),
  ).toBe("100%");
  await expect(dialog.getByTestId("nutrient-iron")).toContainText("6 / 8 mg");
  await expect(dialog.getByTestId("nutrient-vitaminC")).toContainText(
    "45 / 90 mg",
  );
  await expect(dialog.getByTestId("nutrient-sugar")).toHaveText(
    "Sugar24 / 75 g",
  );
  await expect(
    dialog.getByTestId("nutrient-sugar").getByRole("progressbar"),
  ).toHaveAttribute("aria-valuenow", "32");
  await expect(
    dialog.getByTestId("nutrient-cholesterol").getByRole("progressbar"),
  ).toHaveAttribute("aria-valuenow", "15");
  await expect(dialog.getByTestId("nutrient-vitaminA")).toHaveCount(0);
  await expect(
    dialog.getByTestId("nutrient-vitaminA").getByRole("progressbar"),
  ).toHaveCount(0);
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await expect(
    dialog.getByText(/foods have data|incomplete total| known/),
  ).toHaveCount(0);
  await expect(
    dialog.getByText(
      "Some nutrient totals are partial; bars show recorded intake only.",
    ),
  ).toHaveCount(0);
  for (const bar of await dialog.getByRole("progressbar").all())
    expect((await bar.boundingBox())!.height).toBe(4);
  expect(await originals(page)).toEqual(before);
  await page
    .getByRole("button", { name: "Nutrition Details", exact: true })
    .click();
  await page.reload();
  expect(await originals(page)).toEqual(before);
});
test("partial values get a single accessible disclosure; confirmed zero and unavailable data remain distinct", async ({
  page,
}) => {
  await seed(page, true);
  const dialog = await open(page);
  await expect(
    dialog.getByText(
      "Some nutrient totals are partial; bars show recorded intake only.",
    ),
  ).toHaveCount(1);
  await expect(dialog.getByTestId("nutrient-calcium")).toHaveAttribute(
    "data-complete",
    "false",
  );
  await expect(dialog.getByTestId("nutrient-calcium")).toContainText(
    "508 / 1,000 mg",
  );
  await expect(
    dialog.getByRole("progressbar", { name: "Calcium", exact: true }),
  ).toHaveAttribute("aria-valuetext", /partial recorded intake/);
  await expect(dialog.getByTestId("nutrient-sodium")).toHaveAttribute(
    "data-complete",
    "true",
  );
  await page
    .getByRole("button", { name: "Nutrition Details", exact: true })
    .click();
  await page.evaluate(() =>
    localStorage.setItem(
      "fitcircle_food_2026-10-21",
      JSON.stringify([
        {
          ...JSON.parse(localStorage.getItem("fitcircle_food_2026-10-21")!)[0],
          fiber: 0,
          sugar: undefined,
        },
      ]),
    ),
  );
  await page.reload();
  const reopened = await open(page);
  await expect(
    reopened.getByRole("progressbar", { name: "Fiber", exact: true }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(reopened.getByTestId("nutrient-sugar")).toContainText(
    "Not available",
  );
  await expect(
    reopened.getByTestId("nutrient-sugar").getByRole("progressbar"),
  ).toHaveCount(0);
});
test("unknown demographics are not inferred; ambiguous legacy vitamin A retains original data without a false unit", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    localStorage.setItem("fitcircle_profile", '{"age":31,"gender":"unknown"}');
    const entries = JSON.parse(
      localStorage.getItem("fitcircle_food_2026-10-21")!,
    );
    delete entries[0].source;
    localStorage.setItem("fitcircle_food_2026-10-21", JSON.stringify(entries));
  });
  await page.reload();
  const before = await originals(page);
  const dialog = await open(page);
  await expect(dialog.getByTestId("nutrient-iron")).toHaveText("Iron6 mg");
  await expect(dialog.getByTestId("nutrient-vitaminC")).toHaveText(
    "Vitamin C45 mg",
  );
  await expect(dialog.getByTestId("nutrient-vitaminA")).toHaveCount(0);
  await expect(dialog.getByTestId("nutrient-calcium")).toContainText(
    "/ 1,000 mg",
  );
  expect(await originals(page)).toEqual(before);
});
test("female and older-age references update on reopening without saving derived references", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "fitcircle_profile",
      '{"dateOfBirth":"1966-10-21","gender":"female"}',
    ),
  );
  await page.reload();
  const before = await originals(page);
  const dialog = await open(page);
  await expect(dialog.getByTestId("nutrient-calcium")).toContainText(
    "508 / 1,200 mg",
  );
  await expect(dialog.getByTestId("nutrient-iron")).toContainText("6 / 8 mg");
  await expect(dialog.getByTestId("nutrient-vitaminC")).toContainText(
    "45 / 75 mg",
  );
  expect(await originals(page)).toEqual(before);
});
test("missing or malformed profile and calorie inputs do not fabricate personalized targets", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    localStorage.setItem("fitcircle_profile", "{ malformed synthetic");
    localStorage.setItem("fitness_calc_target_calories", "NaN");
  });
  await page.reload();
  const before = await originals(page);
  const dialog = await open(page);
  await expect(dialog.getByRole("progressbar")).toHaveCount(0);
  await expect(dialog.getByTestId("nutrient-calcium")).toHaveText(
    "Calcium508 mg",
  );
  expect(await originals(page)).toEqual(before);
});
test("small iPhone inline section scrolls naturally without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seed(page, true);
  await page.addStyleTag({
    content: ":root { --safe-top: 20px; --safe-bottom: 34px; }",
  });
  const dialog = await open(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await dialog.getByTestId("nutrient-vitaminC").scrollIntoViewIfNeeded();
  await expect(dialog.getByTestId("nutrient-vitaminC")).toBeInViewport();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "Nutrition Details", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
});

test("label reference bars cap overages without visible limit suffixes or stored-data changes", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    const key = "fitcircle_food_2026-10-21";
    const entries = JSON.parse(localStorage.getItem(key)!);
    entries[0].sugar = 108;
    entries[0].cholesterol = 360;
    localStorage.setItem(key, JSON.stringify(entries));
  });
  await page.reload();
  const before = await originals(page);
  const dialog = await open(page);
  await expect(dialog.getByTestId("nutrient-sugar")).toContainText(
    "Sugar108 / 75 g",
  );
  await expect(dialog.getByTestId("nutrient-cholesterol")).toContainText(
    "360 / 300 mg",
  );
  for (const key of ["sugar", "cholesterol", "sodium", "saturatedFat"]) {
    await expect(dialog.getByTestId(`nutrient-${key}`)).not.toContainText(
      /limit|known|recommended/i,
    );
  }
  await expect(
    dialog.getByTestId("nutrient-cholesterol").getByRole("progressbar"),
  ).toHaveAttribute("aria-valuenow", "100");
  await expect(
    dialog.getByTestId("nutrient-cholesterol").locator("dd"),
  ).toHaveAttribute("aria-label", /general label reference/);
  await expect(
    dialog.getByTestId("nutrient-sugar").getByRole("progressbar"),
  ).toHaveAttribute("aria-valuenow", "100");
  expect(await originals(page)).toEqual(before);
});

test("Sugar automatically follows confirmed calories without settings or storage writes", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem("fitness_calc_target_calories", "2902"),
  );
  await page.reload();
  const original = await originals(page);
  const dialog = await open(page);
  await expect(dialog.getByTestId("nutrient-sugar")).toHaveText(
    "Sugar24 / 108.8 g",
  );
  await expect(
    dialog.getByTestId("nutrient-sugar").getByRole("progressbar"),
  ).toHaveAttribute("aria-valuenow", "22.1");
  await expect(
    dialog.getByText(/Set Sugar target|Edit Sugar target|Save target/),
  ).toHaveCount(0);
  expect(await originals(page)).toEqual(original);
  await page.evaluate(() => {
    localStorage.setItem("fitness_calc_target_calories", "3000");
    window.dispatchEvent(new Event("fitcircleCalculatorTargetsChanged"));
  });
  await expect(dialog.getByTestId("nutrient-sugar")).toHaveText(
    "Sugar24 / 112.5 g",
  );
  const after = await originals(page);
  original.forEach((raw, index) => {
    if (index !== 5) expect(after[index]).toBe(raw);
  });
  await page.reload();
  await open(page);
  await expect(page.getByTestId("nutrient-sugar")).toHaveText(
    "Sugar24 / 112.5 g",
  );
});

test("empty days show empty bars inline without unavailable text or Vitamin A, and preserve storage", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_food_2026-10-21", "[]"),
  );
  await page.reload();
  const before = await originals(page);
  const toggle = page.getByRole("button", {
    name: "Nutrition Details",
    exact: true,
  });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("button", { name: "Weekly Overview", exact: true }),
  ).toHaveCount(0);
  const region = await open(page);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(region.getByText("Not available", { exact: true })).toHaveCount(
    0,
  );
  await expect(region.getByTestId("nutrient-vitaminA")).toHaveCount(0);
  await expect(
    region.getByRole("img", { name: /no foods logged/ }),
  ).toHaveCount(13);
  await expect(region.getByTestId("nutrient-calories")).toContainText(
    "— / 2,000 kcal",
  );
  await toggle.click();
  await expect(region).toHaveCount(0);
  expect(await originals(page)).toEqual(before);
});

test("expanded details follow the selected historical date without modifying records", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_food_2026-10-21", "[]"),
  );
  await page.reload();
  const before = await originals(page);
  const region = await open(page);
  await page.screenshot({
    path: "docs/review/inline-nutrition/empty-day.png",
    fullPage: true,
  });
  await page.getByTestId("button-previous-day").click();
  await expect(region.getByTestId("nutrient-calories")).toContainText(
    "1,000 / 2,000 kcal",
  );
  await expect(
    region.getByRole("progressbar", { name: "Calories", exact: true }),
  ).toHaveAttribute("aria-valuenow", "50");
  await page.screenshot({
    path: "docs/review/inline-nutrition/logged-day.png",
    fullPage: true,
  });
  await page.getByTestId("button-next-day").click();
  await expect(
    region.getByRole("img", { name: /no foods logged/ }),
  ).toHaveCount(13);
  expect(await originals(page)).toEqual(before);
});
