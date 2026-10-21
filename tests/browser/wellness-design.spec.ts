import { test, expect } from "@playwright/test";
test.use({
  timezoneId: "America/New_York",
  viewport: { width: 390, height: 844 },
});
async function seed(page: import("@playwright/test").Page) {
  await page.clock.install({ time: new Date("2026-10-21T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate(() => {
    localStorage.setItem(
      "fitcircle_goals",
      JSON.stringify({
        hydrationOz: 192,
        meditationMinutes: 20,
        fastingHours: 16,
        maxFastingHours: 24,
      }),
    );
    localStorage.setItem(
      "fitcircle_hydration_data",
      JSON.stringify({
        dailyGoalOz: 192,
        currentDayOz: 999,
        lastDate: "2024-01-01",
        logs: {
          "2026-10-21": {
            date: "2026-10-21",
            totalOz: 16,
            entries: [
              { id: "today", time: "10:00 AM", amount: 16, liquidType: "Tea" },
            ],
          },
          "2024-01-01": {
            date: "2024-01-01",
            totalOz: 8,
            entries: [
              { id: "old", time: "10:00 AM", amount: 8, liquidType: "Water" },
            ],
          },
        },
      }),
    );
    localStorage.setItem(
      "fitcircle_meditation_logs",
      JSON.stringify([
        {
          id: "practice",
          date: "2026-10-21",
          time: "10:00 AM",
          duration: 10,
          completedAt: "2026-10-21T14:00:00Z",
        },
      ]),
    );
    localStorage.setItem(
      "fitcircle_fasting_logs",
      JSON.stringify([
        {
          id: "fast",
          startDate: "2026-10-20",
          startTime: "18:00",
          endDate: "2026-10-21",
          endTime: "10:00",
          duration: 960,
          loggedAt: "2026-10-21T14:00:00Z",
        },
      ]),
    );
  });
}
const saved = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    [
      "fitcircle_goals",
      "fitcircle_hydration_data",
      "fitcircle_meditation_logs",
      "fitcircle_fasting_logs",
      "fitcircle_cardio_data",
    ].map((key) => localStorage.getItem(key)),
  );
for (const route of ["cardio", "fasting", "meditation", "hydration"])
  test(`${route}: shared compact layout, calendar windows, history and no browsing writes`, async ({
    page,
  }) => {
    await seed(page);
    await page.goto(route); // cardio may initialize an absent store through its existing initializer
    const before = await saved(page);
    await expect(
      page.getByRole("heading", {
        name: route[0].toUpperCase() + route.slice(1),
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: /% of goal/ })).toBeVisible();
    const hero = page.locator(".wellness-hero");
    expect((await hero.boundingBox())!.height).toBeLessThan(230);
    for (const days of [30, 90, 7]) {
      await page.getByRole("button", { name: days + "D", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: `Last ${days} days`, exact: true }),
      ).toBeVisible();
      await expect(page.locator(".wellness-bar-column")).toHaveCount(days);
    }
    await expect(
      page.getByRole("heading", { name: "History", exact: true }),
    ).toBeVisible();
    expect(await saved(page)).toEqual(before);
    await page.setViewportSize({ width: 320, height: 568 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Goal", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Goal", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
test("hydration shortcuts update today only, historical editing preserves current intake, high goal is not reset", async ({
  page,
}) => {
  await seed(page);
  await page.goto("hydration");
  await expect(page.getByText(/High daily goal/)).toBeVisible();
  await page.getByRole("button", { name: "+8 oz", exact: true }).click();
  await expect(page.getByText("24 oz today · 168 oz remaining")).toBeVisible();
  await page.getByRole("button", { name: "Add Liquid", exact: true }).click();
  await page.getByText("Customize shortcuts", { exact: true }).click();
  await page.getByLabel("Amount 1 (oz)").fill("10");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("button", { name: "+10 oz", exact: true }).click();
  await expect(page.getByText("34 oz today · 158 oz remaining")).toBeVisible();
  await page.getByRole("button", { name: /January 2024/ }).click();
  await page
    .getByRole("button", { name: "Edit historical intake", exact: true })
    .click();
  await page.getByTestId("input-edit-amount").fill("12");
  await page.getByTestId("button-save-edit").click();
  await expect(page.getByText("34 oz today · 158 oz remaining")).toBeVisible();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_hydration_data")!),
  );
  expect(data.logs["2024-01-01"].entries[0].amount).toBe(12);
  expect(data.dailyGoalOz).toBe(192);
});
test("meditation retains timer and can manually log a completed session", async ({
  page,
}) => {
  await seed(page);
  await page.goto("meditation");
  await expect(
    page.getByText("Practice consistency · 1 of 7 days practiced"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add Meditation", exact: true })
    .click();
  await page.getByLabel("Duration (minutes)", { exact: true }).fill("5");
  await page
    .getByRole("button", { name: "Log completed session", exact: true })
    .click();
  await expect(page.locator(".wellness-hero")).toContainText("15");
  await page
    .getByRole("button", { name: "Add Meditation", exact: true })
    .click();
  await page.getByLabel("Duration (minutes)", { exact: true }).fill("5");
  await page.getByTestId("button-start-meditation").click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
});
test("completed fasts never become active progress and the timeline keeps actual completed dates", async ({
  page,
}) => {
  await seed(page);
  await page.goto("fasting");
  await expect(
    page.getByRole("img", { name: "0% of goal", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Completed today: 16.0 hr · 100% of duration goal"),
  ).toBeVisible();
  await expect(
    page.getByText("2026-10-20 18:00 → 2026-10-21 10:00"),
  ).toBeVisible();
  await page.getByRole("button", { name: /October 2026/ }).click();
  await page.getByRole("button", { name: "Edit fast", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Edit Fast", exact: true }),
  ).toBeVisible();
});

test("legacy meditation history remains editable without changing today", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    const key = "fitcircle_meditation_logs";
    const logs = JSON.parse(localStorage.getItem(key)!);
    logs.push({
      id: "older",
      date: "01/01/2024",
      time: "10:00 AM",
      duration: 30,
      completedAt: "2024-01-01T15:00:00.123Z",
      retained: "synthetic metadata",
    });
    localStorage.setItem(key, JSON.stringify(logs));
  });
  await page.goto("meditation");
  await page.getByRole("button", { name: /January 2024/ }).click();
  await page
    .getByRole("button", {
      name: "Edit historical meditation session",
      exact: true,
    })
    .click();
  await page.getByRole("dialog").getByLabel("Duration (minutes)").fill("15");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(page.locator(".wellness-hero")).toContainText("10");
  const logs = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitcircle_meditation_logs")!),
  );
  expect(Array.isArray(logs)).toBe(true);
  expect(logs[1]).toMatchObject({
    date: "01/01/2024",
    duration: 15,
    retained: "synthetic metadata",
    completedAt: "2024-01-01T15:00:00.123Z",
  });
});

test("long hydration history and custom names wrap and the final controls remain reachable", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => {
    const logs: Record<string, unknown> = {};
    for (let day = 1; day <= 20; day++) {
      const date = "2026-10-" + String(day).padStart(2, "0");
      logs[date] = {
        date,
        totalOz: 8,
        entries: [
          {
            id: "long-" + day,
            time: "10:00 AM",
            amount: 8,
            liquidType:
              "A very long synthetic custom beverage name for narrow iPhone layout coverage",
          },
        ],
      };
    }
    localStorage.setItem(
      "fitcircle_hydration_data",
      JSON.stringify({
        dailyGoalOz: 64,
        currentDayOz: 0,
        lastDate: "2026-10-21",
        logs,
      }),
    );
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("hydration");
  await page.getByRole("button", { name: /October 2026/ }).click();
  const last = page
    .getByRole("button", { name: "Edit historical intake", exact: true })
    .last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  expect(
    await page
      .locator("main")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await last.click();
  await expect(
    page.getByRole("dialog", { name: "Edit Entry", exact: true }),
  ).toBeVisible();
});
