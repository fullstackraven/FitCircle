import { test, expect, type Page } from "@playwright/test";
test.use({
  timezoneId: "America/New_York",
  viewport: { width: 390, height: 844 },
});
const overnight = {
  id: "overnight",
  startDate: "2026-10-20",
  startTime: "18:00",
  endDate: "2026-10-21",
  endTime: "10:00",
  duration: 960,
  loggedAt: "2026-10-21T14:00:00Z",
  metadata: "retain",
};
async function seed(
  page: Page,
  logs: unknown[] = [overnight],
  time = "2026-10-21T12:00:00-04:00",
) {
  await page.clock.install({ time: new Date(time) });
  await page.goto("profile");
  await page.evaluate((logs) => {
    localStorage.setItem("fitcircle_fasting_logs", JSON.stringify(logs));
    localStorage.setItem(
      "fitcircle_goals",
      JSON.stringify({ fastingHours: 16, maxFastingHours: 24 }),
    );
  }, logs);
  await page.goto("fasting");
}
const hero = (page: Page) =>
  page.getByRole("region", { name: "Today’s Completed Fast", exact: true });
test("overnight completion drives the ring and edits/deletions recalculate it without rewriting other records", async ({
  page,
}) => {
  const yesterday = {
    ...overnight,
    id: "old",
    startDate: "2026-10-19",
    endDate: "2026-10-20",
    loggedAt: "2026-10-20T14:00:00Z",
  };
  await seed(page, [yesterday, overnight]);
  const raw = await page.evaluate(() =>
    localStorage.getItem("fitcircle_fasting_logs"),
  );
  await expect(
    hero(page).getByRole("img", { name: "100% of goal", exact: true }),
  ).toBeVisible();
  await expect(hero(page).locator(".wellness-value")).toHaveText("16 / 16 hr");
  await expect(
    page.getByText("2026-10-20 18:00 → 2026-10-21 10:00", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_fasting_logs")),
  ).toBe(raw);
  await page.getByRole("button", { name: /October 2026/ }).click();
  await page
    .getByRole("button", { name: "Edit fast", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .locator('input[type="time"]')
    .nth(1)
    .fill("02:00");
  await page.getByRole("button", { name: "Update Fast", exact: true }).click();
  await expect(
    hero(page).getByRole("img", { name: "50% of goal", exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_fasting_logs")!),
  );
  expect(saved.find((f: any) => f.id === "old")).toEqual(yesterday);
  expect(saved.find((f: any) => f.id === "overnight").metadata).toBe("retain");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete fast", exact: true })
    .first()
    .click();
  await expect(
    hero(page).getByRole("img", { name: "0% of goal", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No completed fast today", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("fitcircle_fasting_logs")!),
    ),
  ).toEqual([yesterday]);
});
test("multiple same-day completions show the longest, while activity retains their sum", async ({
  page,
}) => {
  const small = {
    ...overnight,
    id: "same",
    startDate: "2026-10-21",
    startTime: "06:00",
    duration: 240,
  };
  await seed(page, [overnight, small]);
  await expect(hero(page).locator(".wellness-value")).toHaveText("16 / 16 hr");
  await expect(
    page.getByText(/Recent fasts · 2 completed in last 7 days/),
  ).toBeVisible();
  await expect(page.getByText("20 hr total", { exact: true })).toBeVisible();
  for (const days of ["30D", "90D"]) {
    await page.getByRole("button", { name: days, exact: true }).click();
    await expect(page.getByText("20 hr total", { exact: true })).toBeVisible();
  }
});
test("midnight clears yesterday’s completed progress without writes", async ({
  page,
}) => {
  await seed(page, [overnight], "2026-10-21T23:59:30-04:00");
  const raw = await page.evaluate(() =>
    localStorage.getItem("fitcircle_fasting_logs"),
  );
  await expect(
    hero(page).getByRole("img", { name: "100% of goal" }),
  ).toBeVisible();
  await page.clock.runFor(31_000);
  await expect(
    hero(page).getByRole("img", { name: "0% of goal" }),
  ).toBeVisible();
  await expect(
    page.getByText("No completed fast today", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_fasting_logs")),
  ).toBe(raw);
});
test("future and malformed completions remain stored but show no completed progress", async ({
  page,
}) => {
  const logs = [
    { ...overnight, id: "future", endDate: "2026-10-22" },
    { ...overnight, id: "invalid", endTime: "bad" },
  ];
  await seed(page, logs);
  const raw = await page.evaluate(() =>
    localStorage.getItem("fitcircle_fasting_logs"),
  );
  await expect(
    hero(page).getByRole("img", { name: "0% of goal" }),
  ).toBeVisible();
  await expect(
    page.getByText("No completed fast today", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_fasting_logs")),
  ).toBe(raw);
});

for (const [hours, percent] of [
  [8, 50],
  [20, 100],
]) {
  test(`${hours}-hour completion displays its actual duration and ${percent}% progress`, async ({
    page,
  }) => {
    const record = {
      ...overnight,
      startDate: hours === 8 ? "2026-10-21" : "2026-10-20",
      startTime: hours === 8 ? "02:00" : "14:00",
      duration: hours * 60,
    };
    await seed(page, [record]);
    await expect(hero(page).locator(".wellness-value")).toHaveText(
      `${hours} / 16 hr`,
    );
    await expect(
      hero(page).getByRole("img", { name: `${percent}% of goal`, exact: true }),
    ).toBeVisible();
  });
}
