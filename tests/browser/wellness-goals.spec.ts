import { test, expect, type Page } from "@playwright/test";
test.use({
  timezoneId: "America/New_York",
  viewport: { width: 390, height: 844 },
});
const hydrate = {
  dailyGoalOz: 64,
  currentDayOz: 999,
  lastDate: "2024-01-01",
  logs: {
    "2024-01-01": {
      date: "2024-01-01",
      totalOz: 64,
      entries: [
        { id: "old", time: "10:00 AM", amount: 64, liquidType: "Water" },
      ],
    },
  },
};
const meditation = [
  {
    id: "old",
    date: "01/01/2024",
    time: "10:00 AM",
    duration: 20,
    completedAt: "2024-01-01T10:00:00.123Z",
    retained: "synthetic",
  },
];
const fast = [
  {
    id: "old",
    startDate: "2024-01-01",
    startTime: "18:00",
    endDate: "2024-01-02",
    endTime: "10:00",
    duration: 960,
    loggedAt: "2024-01-02T10:00:00.123Z",
  },
];
async function seed(page: Page) {
  await page.clock.install({ time: new Date("2026-10-21T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate(
    ({ hydrate, meditation, fast }) => {
      localStorage.setItem("fitcircle_hydration_data", JSON.stringify(hydrate));
      localStorage.setItem(
        "fitcircle_meditation_logs",
        JSON.stringify(meditation),
      );
      localStorage.setItem("fitcircle_fasting_logs", JSON.stringify(fast));
      localStorage.setItem(
        "fitcircle_goals",
        '{"hydrationOz":64,"meditationMinutes":20,"fastingHours":16,"maxFastingHours":24}',
      );
    },
    { hydrate, meditation, fast },
  );
}
const bytes = (page: Page) =>
  page.evaluate(() =>
    [
      "fitcircle_hydration_data",
      "fitcircle_meditation_logs",
      "fitcircle_fasting_logs",
      "fitcircle_goals",
    ].map((key) => localStorage.getItem(key)),
  );
for (const route of ["hydration", "meditation", "fasting"])
  test(
    route +
      ": year-old history is not current progress and mounts/reloads preserve exact original bytes",
    async ({ page }) => {
      await seed(page);
      const before = await bytes(page);
      await page.goto(route);
      await expect(page.locator(".type-caption").first()).toHaveText("0%");
      if (route === "fasting")
        await expect(page.getByText("Today’s Completed Fast", { exact: true })).toBeVisible();
      else {
        await page.getByRole("button", { name: "Goal", exact: true }).click();
        await expect(page.locator(".type-caption").last()).toHaveText("0%");
      }
      await page.reload();
      expect(await bytes(page)).toEqual(before);
    },
  );
test("weekly cardio uses 75/150 and a calendar week without rewriting saved history", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "fitcircle_cardio_data",
      JSON.stringify({
        dailyLogs: {
          "2026-10-18": {
            date: "2026-10-18",
            totalDuration: 50,
            totalDistance: 0,
            sessions: [
              { id: "a", time: "10:00 AM", type: "walking", duration: 50 },
            ],
          },
          "2026-10-21": {
            date: "2026-10-21",
            totalDuration: 25,
            totalDistance: 0,
            sessions: [
              { id: "b", time: "10:00 AM", type: "walking", duration: 25 },
            ],
          },
        },
        goal: {
          type: "duration",
          target: 150,
          period: "week",
          extra: "synthetic goal metadata",
        },
        goalUserSet: true,
        customTypes: [],
        lastDate: "2026-10-21",
        currentDayDuration: 25,
        currentDayDistance: 0,
      }),
    ),
  );
  const before = await page.evaluate(() =>
    localStorage.getItem("fitcircle_cardio_data"),
  );
  await page.goto("cardio");
  await expect(page.locator(".type-caption").first()).toHaveText("50%");
  await expect(
    page.getByRole("region", { name: "This Week’s Cardio", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("This calendar week", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Goal", exact: true }).click();
  await expect(page.locator(".type-caption").last()).toHaveText("50%");
  await page.reload();
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_cardio_data")),
  ).toBe(before);
  await page.getByRole("button", { name: "Goal", exact: true }).click();
  await page.getByLabel(/Weekly Goal/).fill("100");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Save Goal", exact: true }).click();
  await expect(page.locator(".type-caption").first()).toHaveText("75%");
  await page.getByRole("button", { name: "Goal", exact: true }).click();
  await page.getByRole("button", { name: "Daily", exact: true }).click();
  await expect(page.locator(".type-caption").first()).toHaveText("25%");
  const changed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_cardio_data")!),
  );
  expect(changed.goal.extra).toBe("synthetic goal metadata");
  expect(changed.dailyLogs).toEqual(JSON.parse(before!).dailyLogs);
});
test("completed fast crossing midnight meets duration target rather than display maximum", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "fitcircle_fasting_logs",
      JSON.stringify([
        {
          id: "today",
          startDate: "2026-10-20",
          startTime: "18:00",
          endDate: "2026-10-21",
          endTime: "10:00",
          duration: 960,
          loggedAt: "2026-10-21T10:00:00Z",
        },
      ]),
    ),
  );
  const before = await bytes(page);
  await page.goto("fasting");
  await expect(page.locator(".type-caption").first()).toHaveText("100%");
  await expect(
    page.getByText("Completed today: 16.0 hr · 100% of duration goal"),
  ).toBeVisible();
  await expect(page.getByText("Today’s Completed Fast", { exact: true })).toBeVisible();
  await expect(page.getByText(/1 of 7 days met goal/)).toBeVisible();
  await page.getByRole("button", { name: "Goal", exact: true }).click();
  await expect(page.locator(".type-caption").last()).toHaveText("100%");
  expect(await bytes(page)).toEqual(before);
});
test("midnight changes derived meditation progress while leaving legacy bytes intact", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "fitcircle_meditation_logs",
      JSON.stringify([
        {
          id: "today",
          date: "2026-10-21",
          time: "10:00 AM",
          duration: 20,
          completedAt: "2026-10-21T10:00:00Z",
        },
      ]),
    ),
  );
  const before = await bytes(page);
  await page.clock.setSystemTime(new Date("2026-10-21T23:59:30-04:00"));
  await page.goto("meditation");
  await expect(page.locator(".type-caption").first()).toHaveText("100%");
  await page.clock.runFor(31_000);
  await expect(page.locator(".type-caption").first()).toHaveText("0%");
  expect(await bytes(page)).toEqual(before);
});
for (const route of ["hydration", "meditation", "fasting"])
  test(
    route + ": malformed bytes stay blocked rather than being autosaved",
    async ({ page }) => {
      await seed(page);
      const key =
        route === "hydration"
          ? "fitcircle_hydration_data"
          : route === "meditation"
            ? "fitcircle_meditation_logs"
            : "fitcircle_fasting_logs";
      await page.evaluate(
        (key) => localStorage.setItem(key, "{ malformed synthetic"),
        key,
      );
      await page.goto(route);
      await expect(page.getByRole("alert")).toContainText(
        "could not be read safely",
      );
      await page.reload();
      expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
        "{ malformed synthetic",
      );
    },
  );

test("unexpected record shapes remain unchanged and cannot become empty defaults", async ({
  page,
}) => {
  await seed(page);
  for (const route of ["hydration", "meditation", "fasting"]) {
    const key =
      route === "hydration"
        ? "fitcircle_hydration_data"
        : route === "meditation"
          ? "fitcircle_meditation_logs"
          : "fitcircle_fasting_logs";
    for (const raw of ["null", '"unexpected"', '{"unrecognized":"shape"}']) {
      await page.goto("profile");
      await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
        key,
        raw,
      });
      await page.goto(route);
      await expect(page.getByRole("alert")).toContainText(
        "could not be read safely",
      );
      expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
        raw,
      );
    }
  }
});
test("hydration goal changes update today and shared sources without rewriting the history record", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "fitcircle_hydration_data",
      JSON.stringify({
        dailyGoalOz: 64,
        currentDayOz: 999,
        lastDate: "2024-01-01",
        logs: {
          "2026-10-21": {
            date: "2026-10-21",
            totalOz: 32,
            entries: [
              {
                id: "today",
                time: "10:00 AM",
                amount: 32,
                liquidType: "Water",
              },
            ],
          },
        },
      }),
    ),
  );
  const before = await bytes(page);
  await page.goto("hydration");
  await expect(page.locator(".type-caption").first()).toHaveText("50%");
  await page.getByRole("button", { name: "Goal", exact: true }).click();
  await page.getByLabel("Daily goal (oz)", { exact: true }).fill("");
  await expect(page.locator(".type-caption").last()).toHaveText("0%");
  await page.getByLabel("Daily goal (oz)", { exact: true }).fill("128");
  await page.getByRole("button", { name: "Set Goal", exact: true }).click();
  await expect(page.locator(".type-caption").first()).toHaveText("25%");
  expect((await bytes(page))[0]).toBe(before[0]);
  await page.reload();
  await expect(page.locator(".type-caption").first()).toHaveText("25%");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("fitcircle_goals")!).hydrationOz,
    ),
  ).toBe(128);
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_goal_hydration")),
  ).toBe("128");
});
test("failed explicit hydration writes preserve original bytes and visible draft", async ({
  page,
}) => {
  await seed(page);
  await page.goto("hydration");
  const before = await bytes(page);
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitcircle_hydration_data")
        throw new DOMException("Synthetic quota failure", "QuotaExceededError");
      return write.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Add Liquid", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount (oz)", {exact: true}).fill("12");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("quota");
  expect(await bytes(page)).toEqual(before);
});
