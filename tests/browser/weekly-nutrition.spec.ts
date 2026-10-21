import { test, expect, type Page } from "@playwright/test";
test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
const entry = {
  id: "synthetic",
  name: "Synthetic food",
  quantity: 1,
  unit: "serving",
  servings: 1,
  meal: "breakfast",
  timestamp: "2026-10-20T12:00:00-04:00",
  calories: 999,
  protein: 52,
  carbs: 54.2,
  fat: 58.7,
};
async function open(
  page: Page,
  days = ["2026-10-20"],
  targets = { calories: "2902", protein: "290", carbs: "218", fat: "97" },
) {
  await page.clock.install({ time: new Date("2026-10-20T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate(
    ({ entry, days, targets }) => {
      for (const day of days)
        localStorage.setItem(
          `fitcircle_food_${day}`,
          JSON.stringify([
            {
              ...entry,
              timestamp: `${day}T12:00:00-04:00`,
              retained: "synthetic metadata",
            },
          ]),
        );
      for (const [key, value] of Object.entries(targets))
        localStorage.setItem(`fitness_calc_target_${key}`, value);
    },
    { entry, days, targets },
  );
  await page.goto("food-tracker");
  await page
    .getByRole("button", { name: "Weekly Overview", exact: true })
    .click();
}
test("compact weekly rows show logged-day averages, clamped bars and preserve original records", async ({
  page,
}) => {
  await open(page);
  const original = await page.evaluate(() => JSON.stringify(localStorage));
  const modal = page.getByRole("dialog");
  await expect(modal).toContainText("1 of 7 days logged");
  await expect(page.getByTestId("weekly-calories")).toContainText(
    "999 / 2,902 kcal",
  );
  await expect(page.getByTestId("weekly-carbs")).toContainText("54.2 / 218 g");
  await expect(
    modal.getByRole("progressbar", { name: "Protein", exact: true }),
  ).toHaveAttribute("aria-valuenow", "17.9");
  await expect(page.getByTestId("weekly-day-2026-10-20")).toHaveAttribute(
    "data-status",
    "logged",
  );
  await expect(modal.locator("ol li")).toHaveCount(7);
  await expect(modal).not.toContainText("Daily target");
  await expect(modal).toContainText("Daily averages for logged days only");
  await page.screenshot({
    path: "docs/review/weekly-nutrition/weekly-nutrition.png",
  });
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(
    original,
  );
});
test("whole calendar week excludes preceding Saturday and includes Sunday and following Saturday", async ({
  page,
}) => {
  await open(page, ["2026-10-17", "2026-10-18", "2026-10-20", "2026-10-24"]);
  await expect(page.getByRole("dialog")).toContainText("3 of 7 days logged");
  await expect(page.getByTestId("weekly-calories")).toContainText(
    "999 / 2,902 kcal",
  );
  await expect(page.getByTestId("weekly-day-2026-10-18")).toHaveAttribute(
    "data-status",
    "logged",
  );
  await expect(page.getByTestId("weekly-day-2026-10-24")).toHaveAttribute(
    "data-status",
    "logged",
  );
});
test("at and above targets keep actual averages and cap fills", async ({
  page,
}) => {
  await open(page, ["2026-10-20"], {
    calories: "999",
    protein: "26",
    carbs: "27.1",
    fat: "58.7",
  });
  for (const bar of await page
    .getByRole("dialog")
    .getByRole("progressbar")
    .all())
    await expect(bar).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByTestId("weekly-protein")).toContainText("52 / 26 g");
});
test("no recorded days have an explicit empty state without zero averages", async ({
  page,
}) => {
  await open(page, []);
  await expect(page.getByRole("dialog")).toContainText("0 of 7 days logged");
  await expect(page.getByRole("dialog")).toContainText(
    "No recorded intake this week.",
  );
  await expect(page.getByRole("dialog").getByRole("progressbar")).toHaveCount(
    0,
  );
});
test("unreadable day is excluded without overwriting; small enlarged-text modal stays usable", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_food_2026-10-19", "{synthetic malformed"),
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "24px"));
  await page
    .getByRole("button", { name: "Weekly Overview", exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await expect(modal).toContainText("1 day unavailable");
  await expect(page.getByTestId("weekly-day-2026-10-19")).toHaveAttribute(
    "data-status",
    "unavailable",
  );
  expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await expect(
    page.getByRole("button", { name: "Close", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("fitcircle_food_2026-10-19"),
    ),
  ).toBe("{synthetic malformed");
});
for (const invalid of ["0", "-1", "NaN", "Infinity", ""])
  test(`invalid calorie target ${invalid || "missing"} is not fabricated`, async ({
    page,
  }) => {
    await open(page, ["2026-10-20"], {
      calories: invalid,
      protein: "290",
      carbs: "218",
      fat: "97",
    });
    await expect(page.getByTestId("weekly-calories")).toContainText("999 kcal");
    await expect(page.getByRole("dialog").getByRole("progressbar")).toHaveCount(
      0,
    );
  });

test("historical diary navigation opens its calendar week, with actual zero distinct from no logs", async ({
  page,
}) => {
  await open(page, ["2026-10-11"]);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  for (let i = 0; i < 7; i++)
    await page.getByTestId("button-previous-day").click();
  await page
    .getByRole("button", { name: "Weekly Overview", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Oct 11 – Oct 17");
  await expect(page.getByTestId("weekly-day-2026-10-11")).toHaveAttribute(
    "data-status",
    "logged",
  );
  await expect(page.getByTestId("weekly-calories")).toContainText(
    "999 / 2,902 kcal",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(
    (entry) =>
      localStorage.setItem(
        "fitcircle_food_2026-10-11",
        JSON.stringify([{ ...entry, calories: 0 }]),
      ),
    entry,
  );
  await page
    .getByRole("button", { name: "Weekly Overview", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("1 of 7 days logged");
  await expect(page.getByTestId("weekly-calories")).toContainText(
    "0 / 2,902 kcal",
  );
  await expect(
    page.getByRole("progressbar", { name: "Calories", exact: true }),
  ).toHaveAttribute("aria-valuenow", "0");
});
test("a zero macro target omits only its bar rather than inventing a denominator", async ({
  page,
}) => {
  await open(page, ["2026-10-20"], {
    calories: "2000",
    protein: "0",
    carbs: "200",
    fat: "60",
  });
  await expect(page.getByTestId("weekly-protein")).toContainText("52 g");
  await expect(
    page.getByTestId("weekly-protein").getByRole("progressbar"),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog").getByRole("progressbar")).toHaveCount(
    3,
  );
});
