import { test, expect, type Page } from "@playwright/test";

test.use({
  timezoneId: "America/New_York",
  viewport: { width: 390, height: 844 },
});
async function seed(page: Page, many = false) {
  await page.clock.install({ time: new Date("2026-10-19T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate((many) => {
    const routines = Object.fromEntries(
      Array.from({ length: many ? 8 : 2 }, (_, i) => [
        `r${i}`,
        {
          id: `r${i}`,
          name:
            i === 0
              ? "PUSH"
              : many
                ? `Routine ${i} LongUnbrokenRoutineNameForWrappingAndAccessibleControls`
                : "Recovery",
          selectedDays: i === 0 ? [1] : [2],
          createdAt: "2026-10-01T12:00:00Z",
        },
      ]),
    );
    const workouts = {
      w0: {
        id: "w0",
        name: "Push-ups",
        color: "green",
        count: 0,
        dailyGoal: 20,
        scheduledDays: [1],
      },
      w1: {
        id: "w1",
        name: "Weighted carry",
        color: "blue",
        count: 0,
        dailyGoal: 25,
        weightLbs: 40,
        scheduledDays: [2],
      },
      w2: {
        id: "w2",
        name: many
          ? "Daily LongUnbrokenExerciseNameForWrappingAndReadableTargets"
          : "Daily mobility",
        color: "purple",
        count: 0,
        dailyGoal: 9999,
        scheduledDays: [],
      },
    };
    localStorage.setItem(
      "workout-tracker-data",
      JSON.stringify({
        workouts,
        routines,
        dailyLogs: { "2025-01-02": { w0: { count: 7, goalAtTime: 20 } } },
        journalEntries: {
          "2025-01-02": {
            text: "Synthetic retained journal",
            timestamp: "2025-01-02T12:00:00.123Z",
          },
        },
        lastDate: "2026-10-19",
      }),
    );
    localStorage.setItem(
      "fitcircle_reminders",
      JSON.stringify([
        {
          id: "synthetic",
          text: "Synthetic reminder",
          completed: false,
          createdAt: "2026-10-19T12:00:00Z",
        },
      ]),
    );
  }, many);
  await page.goto("routines");
  await page.getByTestId("routine-header-r0").waitFor();
}
const raw = (page: Page) =>
  page.evaluate(() => localStorage.getItem("workout-tracker-data"));
const data = async (page: Page) => JSON.parse((await raw(page))!);

test("inline expansion is keyboard accessible, independently retained, read-only and configuration-only", async ({
  page,
}) => {
  await seed(page);
  const before = await raw(page);
  const first = page.getByTestId("routine-header-r0");
  await expect(first).toContainText("Mon · 2 exercises");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("routine-exercise-r0-w0")).toContainText(
    "20 reps",
  );
  await expect(page.getByTestId("routine-exercise-r0-w2")).toContainText(
    "9999 reps",
  );
  await expect(page.getByTestId("routine-exercise-r0-w1")).toHaveCount(0);
  await page.getByTestId("routine-header-r1").click();
  await expect(page.getByTestId("routine-exercise-r1-w1")).toContainText(
    "1 × 25 reps · 40 lb",
  );
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("routine-header-r1")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(
    page.getByRole("button", {
      name: /Start Routine|Start Workout Session|Record a rep|Record a set|Open Timer/,
    }),
  ).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  expect(await raw(page)).toBe(before);
});

test("explicit assignments survive routine schedule changes without rewriting exercise definitions or history", async ({page}) => {
 await seed(page); const before=await data(page);
 await page.getByTestId('button-edit-routine-r0').click();
 await page.getByRole('button',{name:'Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Add Weighted carry',exact:true}).click();
 await page.getByRole('button',{name:'Clear Selection',exact:true}).click();await page.getByRole('button',{name:'Tuesday',exact:true}).click();
 await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 const after=await data(page);expect(after.routines.r0.placements.map((p:any)=>p.exerciseId)).toContain('w1');expect(after.workouts).toEqual(before.workouts);expect(after.dailyLogs).toEqual(before.dailyLogs);expect(after.journalEntries).toEqual(before.journalEntries);
 await page.reload();await page.getByTestId('routine-header-r0').click();await expect(page.getByTestId('routine-exercise-r0-w1')).toBeVisible();
 await page.goto('./');await expect(page.getByTestId('home-workout-w0')).toHaveCount(0);
 await page.goto('reminders');await expect(page.getByText('Synthetic reminder',{exact:true})).toBeVisible();
});

test("complete backup restores routine IDs, definitions, schedules, weights, colors and historical records unchanged", async ({
  page,
}) => {
  await seed(page);
  const before = await raw(page);
  await page.goto("settings");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Complete Backup" }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.localStorage["workout-tracker-data"]).toBe(before);
  await page.evaluate(() =>
    localStorage.setItem(
      "workout-tracker-data",
      JSON.stringify({
        workouts: {},
        routines: {},
        dailyLogs: {},
        journalEntries: {},
        lastDate: "2026-10-19",
      }),
    ),
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "synthetic-routines.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await page.waitForURL(/\/FitCircle\/$/);
  expect(await raw(page)).toBe(before);
  await page.goto("routines");
  await page.getByTestId("routine-header-r1").click();
  await expect(page.getByTestId("routine-exercise-r1-w1")).toContainText(
    "1 × 25 reps · 40 lb",
  );
});

for (const width of [320, 390, 1280])
  test(`routine layout at ${width}px wraps names, clears dock and keeps header and edit controls reachable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await seed(page, true);
    await page.addStyleTag({
      content: ":root { --safe-top: 59px; --safe-bottom: 34px; }",
    });
    const original = await raw(page);
    await page.getByTestId("routine-header-r7").click();
    await page.getByTestId("routine-header-r0").click();
    for (const id of ["r0", "r7"]) {
      const card = page.getByTestId(`routine-card-${id}`);
      expect(
        await card.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      const edit = page.getByTestId(`button-edit-routine-${id}`);
      const bounds = (await edit.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      const name = (await card.getByRole("heading").boundingBox())!;
      expect(name.x + name.width).toBeLessThanOrEqual(bounds.x);
    }
    await expect(page.getByText("Exercise Library", { exact: true })).toHaveCount(0);
    await page.getByTestId("button-add-workout-r7").click();
    await page
      .getByRole("button", { name: "Create New Exercise", exact: true })
      .scrollIntoViewIfNeeded();
    const last = page.getByRole("button", {
      name: "Create New Exercise",
      exact: true,
    });
    await page.locator("main").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    expect(
      (await last.boundingBox())!.y + (await last.boundingBox())!.height,
    ).toBeLessThanOrEqual((await page.locator(".app-dock").boundingBox())!.y);
    expect(
      await page
        .getByTestId("routine-card-r7")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    const header = page.locator(".fitcircle-fixed-header");
    expect((await header.boundingBox())!.y).toBe(59);
    expect(
      await page.evaluate(
        () =>
          document
            .elementFromPoint(innerWidth / 2, 80)
            ?.closest(".app-header") !== null,
      ),
    ).toBe(true);
    expect(await raw(page)).toBe(original);
  });
