import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { PNG } from "pngjs";
import { deflateSync } from "node:zlib";
import {
  seedWellnessAppearance,
  wellnessBytes,
} from "../fixtures/appearance-wellness";
import { textContrast } from "../fixtures/appearance-contrast";
test.use({
  baseURL: process.env.APPEARANCE_PRODUCTION_REVIEW
    ? "http://127.0.0.1:4173/FitCircle/"
    : "http://127.0.0.1:4184/FitCircle/",
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
const modes = process.env.APPEARANCE_CAPTURE_BEFORE
  ? ["dark"]
  : ["dark", "light"];
for (const mode of modes)
  test(`${mode}: remaining routes, goals and nested editors preserve visual baseline`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(10000);
    await seedWellnessAppearance(page, mode);
    const before = await wellnessBytes(page);
    async function capture(name: string) {
      await expect(page.locator("#fitcircle-startup")).toHaveCount(0);
      await page.locator("h1").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (mode === "dark" && name !== "synthetic-not-found")
        await expect(page).toHaveScreenshot(`${name === "fasting" || name.startsWith("fasting-") ? `${name}-completed` : name === "journal-editor" ? "journal-editor-full-page" : name === "daily-journal" ? "daily-journal-checkmark" : name === "journal-log" ? `${name}-notes` : ["cardio-recovery", "workout-recovery"].includes(name) ? `${name}-account-data` : name}.png`, {
          animations: "disabled",
          threshold: 0,
          maxDiffPixels: 0,
        }).catch(async error => {
          // Temporary transport diagnostic: artifact downloads are unavailable
          // in this workspace. Keep the assertion failing and report this one
          // synthetic image through the existing GitHub annotation reporter.
          if (name === "energy-level") {
            const actual = PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }));
            const expected = PNG.sync.read(fs.readFileSync("tests/browser/appearance-phase-four.spec.ts-snapshots/energy-level-linux.png"));
            const differences: number[][] = [];
            for (let i = 0; i < actual.data.length; i += 4) {
              if (actual.data.subarray(i,i+4).equals(expected.data.subarray(i,i+4))) continue;
              differences.push([i / 4 % actual.width, Math.floor(i / 4 / actual.width), ...actual.data.subarray(i,i+4)]);
            }
            throw new Error(`ENERGY_PIXEL_DIFFS:${deflateSync(JSON.stringify(differences)).toString("base64")};TOTAL:${differences.length}`);
          }
          throw error;
        });
      await page.screenshot({
        path: `${process.env.APPEARANCE_PRODUCTION_REVIEW ? "docs/review/appearance-phase-five/production" : "docs/review/appearance-phase-four"}/${process.env.APPEARANCE_CAPTURE_BEFORE ? "before" : mode}/${name}.png`,
        animations: "disabled",
      });
      if (mode === "light") {
        const contrast = await textContrast(page);
        fs.writeFileSync(
          `${process.env.APPEARANCE_PRODUCTION_REVIEW ? "docs/review/appearance-phase-five/production" : "docs/review/appearance-phase-four"}/light/${name}-contrast.json`,
          JSON.stringify(contrast, null, 2),
        );
        expect(contrast.failures).toEqual([]);
      }
    }
    for (const route of ["cardio", "fasting", "meditation", "hydration"]) {
      await page.goto(route);
      await capture(route);
      await page.getByRole("button", { name: "Goal", exact: true }).click();
      await capture(`${route}-goal`);
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
    }
    await page.goto("hydration");
    await page
      .getByRole("button", { name: "Edit intake", exact: true })
      .click();
    await capture("hydration-editor");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    for (const route of [
      "calendar",
      "workout-statistics",
      "daily-journal",
      "journal-log",
      "energy-level",
      "supplements-page",
      "recovery",
      "dynamic-overview/2026-10-19",
      "settings",
      "restore-custom-foods",
      "synthetic-not-found",
    ]) {
      await page.goto(route);
      if (route.startsWith("dynamic-overview/")) {
        // The redesigned page has dedicated exact visual references in dynamic-overview.spec.ts.
        await expect(page.getByRole("tab", { name: "Daily Overview", exact: true })).toHaveAttribute("aria-selected", "true");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (mode === "light") expect((await textContrast(page)).failures).toEqual([]);
      } else await capture(route.replace("/", "-"));
      if (route === "calendar") {
        await page.getByTestId("button-toggle-view").click();
        await capture("calendar-weekly");
      }
      if (route === "supplements-page") {
        await page
          .getByRole("button")
          .filter({ has: page.locator("svg.lucide-plus") })
          .first()
          .click();
        await capture("supplement-editor");
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
      }
    }
    await page.goto("cardio");
    await page.getByRole("button", { name: "Log Cardio", exact: true }).click();
    await capture("cardio-editor");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.goto("fasting");
    await page.getByRole("button", { name: "Add Fast", exact: true }).click();
    await capture("fasting-editor");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.goto("journal-log");
    await page
      .getByText("Synthetic journal reflection for appearance review.", {
        exact: false,
      })
      .first()
      .click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await capture("journal-editor");
    await page.getByRole("button", { name: "Back to journal library" }).click();
    await expect(page).toHaveURL(/\/journal-log(?:\?|$)/);
    const after = await wellnessBytes(page);
    // Some existing pages initialize control preferences; domain history must stay byte-exact.
    for (const key of Object.keys(before).filter(
      (k) => !["fitcircle_controls", "fitcircle_selected_date"].includes(k),
    ))
      expect(after[key], key).toBe(before[key]);
    await page.goto("meditation");
    await page.getByTestId("button-add-meditation").click();
    await capture("meditation-editor");
    await page.getByLabel("Duration (minutes)", { exact: true }).fill("10");
    await page.getByTestId("button-start-meditation").click();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(page.getByText("Paused", { exact: true })).toBeVisible();
    // The established baseline shows the bottom of the page. Pin that position
    // rather than depending on click auto-scroll during the timer layout change.
    await page.locator("main").evaluate(el => el.scrollTo(0, el.scrollHeight));
    await capture("meditation-timer");
    await page.evaluate(() =>
      localStorage.setItem("fitcircle_cardio_data", "{synthetic malformed"),
    );
    await page.goto("./");
    await capture("cardio-recovery");
    await page.evaluate(() => {
      localStorage.removeItem("fitcircle_cardio_data");
      localStorage.setItem("workout-tracker-data", "{synthetic malformed");
    });
    await page.goto("./");
    await capture("workout-recovery");
  });

for (const mode of ["dark", "light"]) {
  test(`${mode}: current wellness periods, editing, goal circles and historical bytes`, async ({
    page,
  }) => {
    await seedWellnessAppearance(page, mode);
    const before = await wellnessBytes(page);
    for (const [route, percent] of [
      ["cardio", 50],
      ["hydration", 25],
      ["meditation", 50],
      ["fasting", 100],
    ] as const) {
      await page.goto(route);
      await expect(
        page.getByRole("img", { name: `${percent}% of goal`, exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Goal", exact: true }).click();
      await expect(
        page.getByRole("dialog").locator("svg circle").first(),
      ).toHaveAttribute("stroke", "var(--bmi-track)");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
    }
    expect(await wellnessBytes(page)).toEqual(before);
    await page.goto("hydration");
    await page
      .getByRole("button", { name: "Edit intake", exact: true })
      .click();
    await page.getByTestId("input-edit-amount").fill("24");
    await page.getByTestId("button-save-edit").click();
    await expect(
      page.getByRole("img", { name: "38% of goal", exact: true }),
    ).toBeVisible();
    const updated = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("fitcircle_hydration_data")!),
    );
    expect(updated.logs["2026-09-01"]).toEqual(
      JSON.parse(before.fitcircle_hydration_data!).logs["2026-09-01"],
    );
    expect(updated.logs["2026-10-19"].entries[0].amount).toBe(24);
    expect(
      await page.evaluate(() => localStorage.getItem("fitcircle_goals")),
    ).toBe(before.fitcircle_goals);
  });
  test(`${mode}: meditation timer pause, resume and completion retain existing session behavior`, async ({
    page,
  }) => {
    await seedWellnessAppearance(page, mode);
    await page.goto("meditation");
    await page.getByTestId("button-add-meditation").click();
    await page.getByLabel("Duration (minutes)", { exact: true }).fill("1");
    await page.getByTestId("button-start-meditation").click();
    await page.clock.runFor(2000);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const paused = await page.getByText(/^\d{2}:\d{2}$/).innerText();
    await page.clock.runFor(2000);
    expect(await page.getByText(/^\d{2}:\d{2}$/).innerText()).toBe(paused);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.clock.runFor(58000);
    await expect(
      page.getByRole("dialog", { name: "Session Complete", exact: true }),
    ).toBeVisible();
    const records = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("fitcircle_meditation_logs")!),
    );
    expect(
      records.some((r: any) => r.id === "practice" && r.duration === 10),
    ).toBe(true);
    expect(records.length).toBeGreaterThan(1);
  });
  test(`${mode}: Calendar completion/recovery, statistics and navigation keep domain records`, async ({
    page,
  }) => {
    await seedWellnessAppearance(page, mode);
    const before = await wellnessBytes(page);
    await page.goto("calendar");
    await expect(page.locator('[aria-current="date"]')).toHaveText("19");
    await expect(
      page.getByText("Workouts complete", { exact: true }),
    ).toHaveCount(1);
    await expect(page.getByText("Recovery day", { exact: true })).toHaveCount(
      1,
    );
    const cells = await page
      .locator(".calendar-classic [style]")
      .evaluateAll((nodes) =>
        nodes.map((el) => getComputedStyle(el).backgroundColor),
      );
    expect(cells).toContain("rgb(0, 255, 65)");
    expect(cells).toContain("rgb(255, 140, 0)");
    await page.getByTestId("button-toggle-view").click();
    await expect(
      page.getByText("Total Reps: 7", { exact: false }),
    ).toBeVisible();
    await page.goto("workout-statistics");
    await expect(page.getByRole("progressbar")).toHaveCount(2);
    await page
      .getByRole("button", { name: "Individual Workout Totals", exact: false })
      .click();
    await expect(
      page.getByRole("list", { name: "Individual workout totals" }),
    ).toBeVisible();
    if (mode === "light")
      expect((await textContrast(page)).failures).toEqual([]);
    await page.goto("recovery");
    await expect(
      page.getByText("October 18", { exact: false }).first(),
    ).toBeVisible();
    expect(await wellnessBytes(page)).toEqual(before);
  });
  test(`${mode}: journals, supplements and dynamic overview editors remain usable on narrow screens`, async ({
    page,
  }) => {
    await seedWellnessAppearance(page, mode);
    const history = await page.evaluate(() =>
      localStorage.getItem("fitcircle_meditation_logs"),
    );
    await page.goto("daily-journal");
    await page
      .getByTestId("textarea-journal-entry")
      .fill("Synthetic updated journal");
    await page.getByTestId("button-save-journal").click();
    await page.goto("journal-log");
    await expect(
      page.getByText("Synthetic updated journal", { exact: false }).first(),
    ).toBeVisible();
    await page.goto("supplements-page");
    await page
      .getByRole("button", { name: "Manage Supplements", exact: false })
      .click();
    await page.getByTitle("Edit supplement").click();
    await page
      .locator('input[type="text"]')
      .fill("Synthetic renamed supplement");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.reload();
    await expect(
      page.getByText("Synthetic renamed supplement", { exact: false }).first(),
    ).toBeVisible();
    await page.evaluate(() =>
      localStorage.setItem(
        "fitcircle_workout_duration_data",
        JSON.stringify({
          completedSessions: [
            { date: "2026-10-19", startTime: 1792425600000, duration: 600 },
          ],
        }),
      ),
    );
    await page.goto("dynamic-overview/2026-10-19");
    await page.getByTestId("button-edit-workout-duration").click();
    await page.setViewportSize({ width: 320, height: 844 });
    const field = page.getByTestId("input-duration-minutes");
    await field.focus();
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
    await field.scrollIntoViewIfNeeded();
    expect(
      await field.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("none");
    await expect(page.getByTestId("button-cancel-duration")).toBeVisible();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("fitcircle_meditation_logs"),
      ),
    ).toBe(history);
  });
}
test("System preview updates wellness rings, Calendar and recovery surfaces without domain writes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await seedWellnessAppearance(page, "system");
  const before = await wellnessBytes(page);
  await page.goto("hydration");
  const ring = page.locator(".wellness-ring-value");
  const light = await ring.evaluate((el) => getComputedStyle(el).stroke);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "dark");
  await expect
    .poll(() => ring.evaluate((el) => getComputedStyle(el).stroke))
    .not.toBe(light);
  await page.goto("calendar");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  expect(await wellnessBytes(page)).toEqual(before);
});
test.describe("startup placeholder", () => {
  test.use({ serviceWorkers: "block" });
  test("web startup placeholder inherits resolved preview without changing bootstrap or original records", async ({
    page,
  }) => {
    await seedWellnessAppearance(page, "light");
    await page.route(
      process.env.APPEARANCE_PRODUCTION_REVIEW
        ? "**/assets/App-*.js"
        : "**/src/App.tsx*",
      (route) => route.abort(),
    );
    await page.goto("./");
    await expect(page.locator("#fitcircle-startup")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "light",
    );
    expect(
      await page
        .locator("#fitcircle-startup")
        .evaluate((el) => getComputedStyle(el).color),
    ).toBe("rgb(15, 23, 41)");
  });
});

test.describe("production", () => {
  test.use({ baseURL: "http://127.0.0.1:4173/FitCircle/" });
  test("all remaining production routes apply Dark, Light and System with the public selector", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await seedWellnessAppearance(page, "dark");
    for (const preference of ["dark", "light", "system"]) {
      await page.evaluate(
        (value) => localStorage.setItem("fitcircle_appearance", value),
        preference,
      );
      await page.emulateMedia({ colorScheme: "light" });
      for (const route of [
        "cardio",
        "fasting",
        "meditation",
        "hydration",
        "calendar",
        "workout-statistics",
        "daily-journal",
        "journal-log",
        "energy-level",
        "supplements-page",
        "recovery",
        "dynamic-overview/2026-10-19",
        "restore-custom-foods",
        "settings",
        "synthetic-not-found",
      ]) {
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute(
          "data-appearance",
          preference === "dark" ? "dark" : "light",
        );
        await expect(page.locator("h1").first()).toBeVisible();
      }
      await page.goto("settings");
      await expect(
        page.getByRole("radio", { name: preference, exact: false }),
      ).toBeChecked();
    }
  });
});

for (const mode of ["dark", "light"])
  test(`${mode}: goal rings clamp zero partial complete and over-target without saving goals`, async ({
    page,
  }) => {
    await seedWellnessAppearance(page, mode);
    const before = await wellnessBytes(page);
    await page.goto("cardio");
    await page.getByRole("button", { name: "Goal", exact: true }).click();
    const offsets: number[] = [];
    for (const target of ["0", "150", "75", "50"]) {
      await page.locator("#goalTarget").fill(target);
      offsets.push(
        Number(
          await page
            .getByRole("dialog")
            .locator("svg circle")
            .last()
            .getAttribute("stroke-dashoffset"),
        ),
      );
    }
    expect(offsets[0]).toBeGreaterThan(offsets[1]);
    expect(offsets[1]).toBeGreaterThan(0);
    expect(offsets[2]).toBe(0);
    expect(offsets[3]).toBe(0);
    expect(await wellnessBytes(page)).toEqual(before);
  });
