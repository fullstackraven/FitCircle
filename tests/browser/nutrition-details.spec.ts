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
  return page.getByRole("dialog", { name: "Nutrition Details", exact: true });
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
    "2,450 / 2,300 mg limit",
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
    "Total sugar24 g",
  );
  await expect(
    dialog.getByTestId("nutrient-sugar").getByRole("progressbar"),
  ).toHaveCount(0);
  await expect(
    dialog.getByTestId("nutrient-cholesterol").getByRole("progressbar"),
  ).toHaveCount(0);
  await expect(dialog.getByTestId("nutrient-vitaminA")).toContainText(
    "< 0.1 µg",
  );
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
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
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
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
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
  await expect(dialog.getByTestId("nutrient-vitaminA")).toContainText(
    "Unit unavailable",
  );
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
test("small iPhone modal scrolls nutrient rows without moving or hiding the close button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seed(page, true);
  await page.addStyleTag({
    content: ":root { --safe-top: 20px; --safe-bottom: 34px; }",
  });
  const dialog = await open(page);
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  const initial = (await close.boundingBox())!;
  await dialog.getByTestId("nutrient-vitaminC").scrollIntoViewIfNeeded();
  await expect(close).toBeInViewport();
  const final = (await close.boundingBox())!;
  expect(final.y).toBe(initial.y);
  expect(final.y).toBeGreaterThanOrEqual(20);
  expect(final.y + final.height).toBeLessThanOrEqual(534);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await close.click();
  await expect(dialog).toHaveCount(0);
});
