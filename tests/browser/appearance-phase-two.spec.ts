import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { seedAppearance } from "../fixtures/appearance-pages";

test.use({
  baseURL: process.env.APPEARANCE_PRODUCTION_REVIEW
    ? "http://127.0.0.1:4173/FitCircle/"
    : "http://127.0.0.1:4184/FitCircle/",
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
async function preview(page: Page, preference: string) {
  await seedAppearance(page);
  await page.evaluate(
    (value) => localStorage.setItem("fitcircle_appearance", value),
    preference,
  );
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    preference,
  );
}
for (const mode of process.env.APPEARANCE_CAPTURE_BEFORE
  ? ["dark"]
  : ["dark", "light"]) {
  test(`${mode}: core pages and nested editors preserve layout and data`, async ({
    page,
  }) => {
    await preview(page, mode);
    const before = await page.evaluate(() =>
      Object.fromEntries(
        [
          "workout-tracker-data",
          "fitcircle_profile",
          "fitcircle_reminders",
        ].map((k) => [k, localStorage.getItem(k)]),
      ),
    );
    const capture = async (name: string) => {
      await expect(page.locator("#fitcircle-startup")).toHaveCount(0);
      await page.locator(".app-shell").waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (mode === "dark")
        await expect(page).toHaveScreenshot(`${["home", "workout-editor", "routines-expanded", "routine-editor", "sidebar"].includes(name) ? `${name}-sets` : name}.png`, {
          animations: "disabled",
          maxDiffPixels: 0,
          threshold: 0,
        });
      await page.screenshot({
        path: `${process.env.APPEARANCE_PRODUCTION_REVIEW ? "docs/review/appearance-phase-five/production" : "docs/review/appearance-phase-two"}/${process.env.APPEARANCE_CAPTURE_BEFORE ? "before" : mode}/${name}.png`,
        animations: "disabled",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (mode === "light") {
        const findings = await textContrast(page);
        expect(findings.failures, `Contrast: ${name}`).toEqual([]);
        fs.writeFileSync(
          `${process.env.APPEARANCE_PRODUCTION_REVIEW ? "docs/review/appearance-phase-five/production" : "docs/review/appearance-phase-two"}/light/${name}-contrast.json`,
          JSON.stringify(findings, null, 2),
        );
      }
    };
    await capture("home");
    await page
      .getByRole("button", { name: "Edit Push-ups", exact: true })
      .click();
    await capture("workout-editor");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "Open Menu", exact: true }).click();
    await capture("sidebar");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.goto("routines");
    await page.getByTestId("routine-header-r").waitFor();
    await capture("routines-collapsed");
    await page.getByTestId("routine-header-r").click();
    await capture("routines-expanded");
    await page
      .getByRole("button", { name: "Edit routine PUSH", exact: true })
      .click();
    await capture("routine-editor");
    await page.goto("reminders");
    await capture("reminders");
    await expect(
      page.getByRole("textbox", { name: "New reminder", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "New Reminder", exact: true })
      .click();
    await capture("reminder-draft");
    const draft = page.getByRole("textbox", {
      name: "New reminder",
      exact: true,
    });
    await expect(draft).toBeFocused();
    const css = await draft.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        border: s.borderTopWidth,
        shadow: s.boxShadow,
        outline: s.outlineStyle,
      };
    });
    expect(css).toEqual({ border: "0px", shadow: "none", outline: "none" });
    await page.goto("wellness");
    await capture("logs");
    await page.goto("profile");
    await capture("profile");
    await page
      .getByRole("button", { name: "Edit Profile", exact: true })
      .click();
    await capture("profile-editor");
    expect(
      await page.evaluate(() =>
        Object.fromEntries(
          [
            "workout-tracker-data",
            "fitcircle_profile",
            "fitcircle_reminders",
          ].map((k) => [k, localStorage.getItem(k)]),
        ),
      ),
    ).toEqual(before);
  });
}

async function textContrast(page: Page) {
  return page.evaluate(() => {
    type Color = number[];
    const parse = (value: string): Color => {
      const n = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
      return [n[0], n[1], n[2], n[3] ?? 1];
    };
    const blend = (f: Color, b: Color): Color =>
      [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
    const background = (el: Element | null): Color =>
      el
        ? blend(
            parse(getComputedStyle(el).backgroundColor),
            background(el.parentElement),
          )
        : [248, 250, 252, 1];
    const luminance = (c: Color) =>
      c
        .slice(0, 3)
        .map((x) => x / 255)
        .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
        .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
    const scope =
      document.querySelector('[role="dialog"],[role="alertdialog"]') ??
      document.querySelector(".app-shell")!;
    const readings: { text: string; ratio: number; required: number }[] = [];
    for (const el of [scope, ...scope.querySelectorAll("*")]) {
      const text = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join("")
        .trim();
      const css = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (
        !text ||
        !rect.width ||
        !rect.height ||
        rect.bottom < 0 ||
        rect.top > innerHeight ||
        el.closest(':disabled,[aria-hidden="true"],.sr-only') ||
        css.visibility === "hidden" ||
        css.display === "none"
      )
        continue;
      const bg = background(el),
        fg = blend(parse(css.color), bg);
      const l = [luminance(fg), luminance(bg)].sort((a, b) => a - b);
      const ratio = (l[1] + 0.05) / (l[0] + 0.05);
      const size = parseFloat(css.fontSize);
      const required =
        size >= 24 || (size >= 18.66 && Number(css.fontWeight) >= 700)
          ? 3
          : 4.5;
      readings.push({
        text: text.slice(0, 80),
        ratio: Number(ratio.toFixed(2)),
        required,
      });
    }
    return { readings, failures: readings.filter((x) => x.ratio < x.required) };
  });
}

for (const mode of ["dark", "light"])
  test(`${mode}: editing, blank reminders, navigation and keyboard clearance`, async ({
    page,
  }) => {
    await preview(page, mode);
    const initial = await page.evaluate(() =>
      localStorage.getItem("workout-tracker-data"),
    );
    await page
      .getByRole("button", { name: "Edit Push-ups", exact: true })
      .click();
    await page.locator("#workout-name").fill("Edited synthetic push-ups");
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
    const field = page.locator("#workout-name");
    await field.scrollIntoViewIfNeeded();
    await expect(field).toBeFocused();
    expect(
      await field.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("none");
    await page
      .getByRole("button", { name: "Update Workout", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Edit Edited synthetic push-ups",
        exact: true,
      }),
    ).toBeVisible();
    const edited = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("workout-tracker-data")!),
    );
    expect(edited.workouts.w.color).toBe("green");
    expect(edited.dailyLogs).toEqual(JSON.parse(initial!).dailyLogs);
    await page.goto("reminders");
    await page
      .getByRole("button", { name: "New Reminder", exact: true })
      .click();
    const draft = page.getByRole("textbox", {
      name: "New reminder",
      exact: true,
    });
    await draft.fill("Synthetic reminder");
    await draft.press("Enter");
    await expect(
      page.getByRole("button", {
        name: "Edit Synthetic reminder",
        exact: true,
      }),
    ).toBeVisible();
    await expect(draft).toBeFocused();
    await expect(draft).toHaveValue("");
    await draft.press("Escape");
    await expect(draft).toHaveCount(0);
    await page.getByRole("button", { name: "Logs", exact: true }).click();
    await page.getByTestId("card-cardio").click();
    await expect(page).toHaveURL(/cardio/);
  });

test("System preview changes on device preference without changing records", async ({
  page,
}) => {
  await seedAppearance(page);
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_appearance", "system"),
  );
  const before = await page.evaluate(() =>
    localStorage.getItem("workout-tracker-data"),
  );
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("routines");
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "dark");
  expect(
    await page.evaluate(() => localStorage.getItem("workout-tracker-data")),
  ).toBe(before);
});

for (const mode of ["dark", "light"])
  test(`${mode}: profile forms, layout reordering and small-screen text scaling`, async ({
    page,
  }) => {
    await preview(page, mode);
    const workouts = await page.evaluate(() =>
      localStorage.getItem("workout-tracker-data"),
    );
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("profile");
    await page.addStyleTag({
      content: ":root {font-size:20px;--safe-top:20px;--safe-bottom:34px;}",
    });
    await page
      .getByRole("button", { name: "Edit Profile", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("Synthetic edited name");
    await page
      .getByRole("button", { name: "Save Profile", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Synthetic edited name", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Edit Fitness Goals", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Primary objective", exact: true })
      .selectOption("Build strength");
    await page
      .getByRole("textbox", { name: "Fitness Goal", exact: true })
      .fill("Synthetic personal objective");
    await page
      .getByRole("button", { name: "Save Profile", exact: true })
      .click();
    await expect(
      page.getByText("Synthetic personal objective", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("workout-tracker-data")),
    ).toBe(workouts);
    await page.goto("wellness");
    await page.addStyleTag({
      content: ":root {font-size:20px;--safe-top:20px;--safe-bottom:34px;}",
    });
    await page.getByTestId("button-edit-layout").click();
    await page.getByTestId("button-move-right-cardio").click();
    await page.getByTestId("button-done-edit").click();
    await page.reload();
    await expect(page.getByTestId("card-cardio")).toBeVisible();
    await page.addStyleTag({
      content: ":root {font-size:20px;--safe-top:20px;--safe-bottom:34px;}",
    });
    const order = await page
      .locator('[data-testid^="card-"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));
    expect(order.slice(0, 2)).toEqual(["card-fasting", "card-cardio"]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("Light: all twelve workout hues retain identifiers and visible progress against the surface", async ({
  page,
}) => {
  await preview(page, "light");
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("workout-tracker-data")!);
    data.workouts = Object.fromEntries(
      [
        "green",
        "blue",
        "purple",
        "amber",
        "red",
        "pink",
        "cyan",
        "lime",
        "orange",
        "indigo",
        "emerald",
        "yellow",
      ].map((color, i) => [
        "h" + i,
        {
          id: "h" + i,
          name: "Synthetic " + color,
          color,
          count: 5,
          dailyGoal: 20,
          scheduledDays: [1],
        },
      ]),
    );
    Object.keys(data.workouts).forEach((id) => {
      data.dailyLogs["2026-10-19"][id] = { count: 5, goalAtTime: 20 };
    });
    localStorage.setItem("workout-tracker-data", JSON.stringify(data));
  });
  const before = await page.evaluate(() =>
    localStorage.getItem("workout-tracker-data"),
  );
  await page.reload();
  await expect(page.locator(".workout-progress-fill")).toHaveCount(12);
  const strokes = await page
    .locator(".workout-progress-fill")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).stroke));
  expect(new Set(strokes).size).toBe(12);
  expect(strokes).not.toContain("none");
  for (const color of [
    "green",
    "blue",
    "purple",
    "amber",
    "red",
    "pink",
    "cyan",
    "lime",
    "orange",
    "indigo",
    "emerald",
    "yellow",
  ])
    await expect(page.locator(".workout-" + color).first()).toBeAttached();
  expect(
    await page.evaluate(() => localStorage.getItem("workout-tracker-data")),
  ).toBe(before);
});

for (const mode of ["dark", "light"])
  test(`${mode}: timer picker and profile error states remain usable`, async ({
    page,
  }) => {
    await preview(page, mode);
    await page.getByTitle("Open Timer").click();
    const timer = page.getByRole("dialog", { name: "Timer", exact: true });
    await timer
      .getByRole("listbox", { name: "Seconds", exact: true })
      .press("ArrowDown");
    await expect(
      timer.getByRole("button", { name: "Start", exact: true }),
    ).toBeEnabled();
    await timer.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(timer).toHaveCount(0);
    await page.goto("profile");
    await page
      .getByRole("button", { name: "Edit Profile", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("Synthetic blocked save");
    const before = await page.evaluate(() =>
      localStorage.getItem("fitcircle_profile"),
    );
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      (window as any).restoreStorage = () =>
        (Storage.prototype.setItem = original);
      Storage.prototype.setItem = function (key, value) {
        if (key === "fitcircle_username") throw Error("Synthetic quota");
        original.call(this, key, value);
      };
    });
    await page
      .getByRole("button", { name: "Save Profile", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("fitcircle_profile")),
    ).toBe(before);
    if (mode === "light")
      expect((await textContrast(page)).failures).toEqual([]);
    await page.evaluate(() => (window as any).restoreStorage());
  });

test("Light: native checkbox accent and reminder completion preserve state semantics", async ({
  page,
}) => {
  await preview(page, "light");
  await page.goto("reminders");
  await page.getByRole("button", { name: "New Reminder", exact: true }).click();
  const draft = page.getByRole("textbox", {
    name: "New reminder",
    exact: true,
  });
  await draft.fill("Synthetic checkbox reminder");
  await draft.press("Enter");
  await draft.press("Escape");
  await page
    .getByRole("button", {
      name: "Mark complete: Synthetic checkbox reminder",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Mark incomplete: Synthetic checkbox reminder",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  const accent = await page.evaluate(() => {
    const field = document.createElement("input");
    field.type = "checkbox";
    field.checked = true;
    document.body.append(field);
    const color = getComputedStyle(field).accentColor;
    field.remove();
    return color;
  });
  expect(accent).toBe("rgb(21, 128, 61)");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("fitcircle_reminders")!)[0].completed,
    ),
  ).toBe(true);
});
