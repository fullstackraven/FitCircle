import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import {
  seedWellnessAppearance,
  wellnessBytes,
} from "../fixtures/appearance-wellness";
import {
  seedNutritionAppearance,
  nutritionBytes,
} from "../fixtures/appearance-nutrition";
import { textContrast } from "../fixtures/appearance-contrast";

test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
async function domainBytes(page: Page) {
  const bytes = await wellnessBytes(page);
  delete bytes.fitcircle_appearance;
  return bytes;
}
const title = (value: string) => value[0].toUpperCase() + value.slice(1);
const radio = (page: Page, value: string) =>
  page.getByRole("radio", { name: title(value), exact: true });
async function choose(page: Page, value: string) {
  await page
    .getByRole("group", { name: "Appearance", exact: true })
    .getByText(title(value), { exact: true })
    .click();
  await expect(radio(page, value)).toBeChecked();
}
async function effective(page: Page, value: "light" | "dark") {
  await expect(page.locator("html")).toHaveAttribute("data-appearance", value);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    value === "light" ? "#f8fafc" : "#0f172a",
  );
  expect(
    await page.evaluate(() => document.documentElement.style.colorScheme),
  ).toBe(value);
}

test("public selector defaults Dark without writes; keyboard selection is immediate and survives navigation/reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await seedWellnessAppearance(page, "dark");
  await page.evaluate(() => localStorage.removeItem("fitcircle_appearance"));
  await page.goto("settings");
  const before = await domainBytes(page);
  await expect(radio(page, "dark")).toBeChecked();
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
  ).toBeNull();
  await radio(page, "dark").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(radio(page, "light")).toBeChecked();
  await effective(page, "light");
  await page.keyboard.press("ArrowRight");
  await effective(page, "dark");
  await page.keyboard.press("ArrowRight");
  await expect(radio(page, "system")).toBeChecked();
  await effective(page, "light");
  await page.goto("routines");
  await effective(page, "light");
  await page.goto("settings");
  await page.reload();
  await expect(radio(page, "system")).toBeChecked();
  expect(await domainBytes(page)).toEqual(before);
});

for (const width of [390, 320]) {
  test(`public Settings selector visuals and data at ${width}px in every preference`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: "light" });
    await seedWellnessAppearance(page, "dark");
    await page.goto("settings");
    const before = await domainBytes(page);
    for (const preference of ["dark", "light", "system"] as const) {
      await choose(page, preference);
      await effective(page, preference === "dark" ? "dark" : "light");
      await page
        .getByRole("region", { name: "Appearance", exact: true })
        .scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `docs/review/appearance-phase-five/settings-${preference}-${width}.png`,
        animations: "disabled",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await textContrast(page)).failures).toEqual([]);
      await page.reload();
      await expect(radio(page, preference)).toBeChecked();
    }
    expect(await domainBytes(page)).toEqual(before);
  });
}

test("System changes and resumption reconcile metadata; manual choices ignore OS changes without changing saved System", async ({
  page,
}) => {
  await page.goto("settings");
  await page.emulateMedia({ colorScheme: "light" });
  await choose(page, "system");
  await effective(page, "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await effective(page, "dark");
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
  ).toBe("system");
  await choose(page, "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await effective(page, "light");
  await choose(page, "system");
  await effective(page, "dark");
  await page.evaluate(() => {
    document.documentElement.dataset.appearance = "light";
    document.documentElement.style.colorScheme = "light";
    dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await effective(page, "dark");
});

test("invalid bytes remain untouched; failed saves retain the choice and report failure accessibly", async ({
  page,
}) => {
  await page.goto("profile");
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_appearance", "auto"),
  );
  await page.goto("settings");
  await effective(page, "dark");
  await expect(radio(page, "dark")).toBeChecked();
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
  ).toBe("auto");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "fitcircle_appearance")
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("group", { name: "Appearance" })
    .getByText("Light", { exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("could not be saved");
  await expect(radio(page, "dark")).toBeChecked();
  await effective(page, "dark");
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
  ).toBe("auto");
});

test("cross-tab appearance changes preserve an open food editor, fields, route, scroll and food bytes", async ({
  page,
  context,
}) => {
  await seedNutritionAppearance(page, "dark");
  const before = await nutritionBytes(page);
  await page.getByRole("button", { name: /^Breakfast \d+ cal$/ }).click();
  await page
    .getByTestId("food-item-logged-appearance")
    .getByRole("button")
    .first()
    .click();
  await page.getByTestId("input-edit-servings").fill("2.25");
  const route = page.url();
  const scroll = await page
    .locator(".app-content")
    .evaluate((el) => el.scrollTop);
  const settings = await context.newPage();
  await settings.goto("settings");
  for (const mode of ["light", "dark"]) {
    await choose(settings, mode);
    await effective(page, mode as "light" | "dark");
    await expect(page.getByTestId("input-edit-servings")).toHaveValue("2.25");
    await expect(
      page.getByRole("dialog", { name: "Edit Entry", exact: true }),
    ).toBeVisible();
    expect(page.url()).toBe(route);
    expect(
      await page.locator(".app-content").evaluate((el) => el.scrollTop),
    ).toBe(scroll);
    expect(await nutritionBytes(page)).toEqual(before);
  }
});

test("changing appearance preserves a running meditation timer and its existing history", async ({
  page,
  context,
}) => {
  await seedWellnessAppearance(page, "dark");
  await page.goto("meditation");
  const before = await domainBytes(page);
  await page.getByTestId("button-add-meditation").click();
  await page.getByLabel("Duration (minutes)", { exact: true }).fill("1");
  await page.getByTestId("button-start-meditation").click();
  const settings = await context.newPage();
  await settings.goto("settings");
  await choose(settings, "light");
  await effective(page, "light");
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.getByText(/^\d{2}:\d{2}$/).innerText();
  await choose(settings, "dark");
  await page.clock.runFor(2000);
  expect(await page.getByText(/^\d{2}:\d{2}$/).innerText()).toBe(paused);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(2000);
  expect(await page.getByText(/^\d{2}:\d{2}$/).innerText()).not.toBe(paused);
  expect(await domainBytes(page)).toEqual(before);
});

test("all preferences survive a real controlled offline refresh, switching and System updates", async ({
  page,
  context,
}) => {
  await seedWellnessAppearance(page, "dark");
  await page.goto("settings");
  const before = await domainBytes(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  for (const preference of ["light", "dark", "system"] as const) {
    await page.emulateMedia({ colorScheme: "light" });
    await choose(page, preference);
    await page.reload();
    await expect(radio(page, preference)).toBeChecked();
    await effective(page, preference === "dark" ? "dark" : "light");
  }
  await page.emulateMedia({ colorScheme: "dark" });
  await effective(page, "dark");
  const reopened = await context.newPage();
  await reopened.emulateMedia({ colorScheme: "dark" });
  await reopened.goto("settings");
  await expect(radio(reopened, "system")).toBeChecked();
  await effective(reopened, "dark");
  expect(await domainBytes(reopened)).toEqual(before);
  expect(await domainBytes(page)).toEqual(before);
});

test.describe("pre-React production startup", () => {
  test.use({ serviceWorkers: "block" });
  for (const os of ["light", "dark"] as const) {
    for (const preference of [undefined, "dark", "light", "system", "auto"]) {
      test(`bootstrap ${preference ?? "missing"} on ${os} runs before main and styles the placeholder`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: os });
        await page.addInitScript((value) => {
          if (value !== undefined)
            localStorage.setItem("fitcircle_appearance", value);
        }, preference);
        await page.route("**/assets/*.js", (route) => route.abort());
        await page.goto("settings");
        const resolved =
          preference === "light" || (preference === "system" && os === "light")
            ? "light"
            : "dark";
        await effective(page, resolved);
        await expect(page.locator("#fitcircle-startup")).toBeVisible();
        await expect(page.locator(".app-shell")).toHaveCount(0);
        expect(
          await page.evaluate(
            () => getComputedStyle(document.documentElement).backgroundColor,
          ),
        ).toBe(resolved === "light" ? "rgb(248, 250, 252)" : "rgb(15, 23, 42)");
        expect(
          await page.evaluate(() =>
            localStorage.getItem("fitcircle_appearance"),
          ),
        ).toBe(preference ?? null);
        expect(
          await page
            .locator("#fitcircle-startup")
            .evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe(resolved === "light" ? "rgb(248, 250, 252)" : "rgb(15, 23, 42)");
      });
    }
  }
  test("interrupted restore reconciles the early hint and recovered preference before any App frame", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fitcircle_appearance", "dark");
      localStorage.setItem(
        "fitcircle_restore_journal_v2",
        JSON.stringify({ fitcircle_appearance: "light" }),
      );
      (window as any).appearanceFrames = [];
      const observe = () => {
        (window as any).appearanceFrames.push({
          appearance: document.documentElement.dataset.appearance,
          app: !!document.querySelector(".app-shell"),
        });
        requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
    });
    await page.goto("settings");
    await expect(radio(page, "light")).toBeChecked();
    await effective(page, "light");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as any).appearanceFrames.filter((f: any) => f.app).length,
        ),
      )
      .toBeGreaterThan(0);
    const frames = await page.evaluate(
      () =>
        (window as any).appearanceFrames as {
          appearance: string;
          app: boolean;
        }[],
    );
    expect(
      frames.filter((f) => f.app).every((f) => f.appearance === "light"),
    ).toBe(true);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("fitcircle_restore_journal_v2"),
      ),
    ).toBeNull();
    expect(
      await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
    ).toBe("light");
  });
});

for (const preference of ["dark", "light", "system"]) {
  test(`Settings backup exports and restores ${preference} through the established reload flow`, async ({
    page,
  }) => {
    await seedWellnessAppearance(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("settings");
    await choose(page, preference);
    const before = await domainBytes(page);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("button", { name: "Download Complete Backup", exact: true })
        .click(),
    ]);
    const backup = JSON.parse(
      fs.readFileSync((await download.path())!, "utf8"),
    );
    expect(backup.localStorage.fitcircle_appearance).toBe(preference);
    expect(backup.manifest.localStorageKeys).toContain("fitcircle_appearance");
    await choose(page, preference === "dark" ? "light" : "dark");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('input[type="file"]').setInputFiles({
      name: "synthetic-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await page.waitForURL("**/FitCircle/");
    await effective(page, preference === "dark" ? "dark" : "light");
    await page.goto("settings");
    await expect(radio(page, preference)).toBeChecked();
    await effective(page, preference === "dark" ? "dark" : "light");
    expect(await domainBytes(page)).toEqual(before);
  });
}

test("malformed optional appearance is disclosed and omitted from a valid Settings export without touching source bytes", async ({
  page,
}) => {
  await seedWellnessAppearance(page, "dark");
  await page.evaluate(() =>
    localStorage.setItem("fitcircle_appearance", "auto"),
  );
  await page.goto("settings");
  const before = await domainBytes(page);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Download Complete Backup", exact: true })
      .click(),
  ]);
  const backup = JSON.parse(fs.readFileSync((await download.path())!, "utf8"));
  expect(backup.localStorage.fitcircle_appearance).toBeUndefined();
  expect(backup.manifest.localStorageKeys).not.toContain(
    "fitcircle_appearance",
  );
  await expect(
    page.getByText(/Invalid optional appearance preference omitted/),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
  ).toBe("auto");
  expect(await domainBytes(page)).toEqual(before);
});

test.describe("cold bootstrap and recovery guards", () => {
  test.use({ serviceWorkers: "block" });
  for (const preference of ["light", "system"]) {
    test(`${preference} startup has the right palette before the entry module and every application frame`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "light" });
      await page.addInitScript((value) => {
        localStorage.setItem("fitcircle_appearance", value);
        (window as any).appAppearances = [];
        const sample = () => {
          if (document.querySelector(".app-shell"))
            (window as any).appAppearances.push(
              document.documentElement.dataset.appearance,
            );
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, preference);
      let release!: () => void;
      let observed!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const requested = new Promise<void>((resolve) => {
        observed = resolve;
      });
      await page.route("**/assets/index-*.js", async (route) => {
        observed();
        await gate;
        await route.continue();
      });
      try {
        await page.goto("settings", { waitUntil: "commit" });
        await requested;
        await effective(page, "light");
        await expect(page.locator("#fitcircle-startup")).toBeVisible();
        await expect(page.locator(".app-shell")).toHaveCount(0);
        await page.screenshot({
          path: `docs/review/appearance-phase-five/startup-${preference}.png`,
        });
      } finally {
        release();
      }
      await expect(radio(page, preference)).toBeChecked();
      await expect
        .poll(() => page.evaluate(() => (window as any).appAppearances.length))
        .toBeGreaterThan(0);
      expect(
        await page.evaluate(() =>
          (window as any).appAppearances.every(
            (value: string) => value === "light",
          ),
        ),
      ).toBe(true);
    });
  }
  test("GitHub Pages 404 recovery retains all three public preferences on the repository base path", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("profile");
    for (const preference of ["dark", "light", "system"]) {
      await page.evaluate(
        (value) => localStorage.setItem("fitcircle_appearance", value),
        preference,
      );
      // Pages serves this document at the missing route, not at /404.html.
      await page.route(
        "**/FitCircle/settings?from=dashboard",
        async (route) => {
          const response = await route.fetch({
            url: "http://127.0.0.1:4173/FitCircle/404.html",
          });
          expect(await response.text()).toContain(
            'id="fitcircle-appearance-bootstrap"',
          );
          await route.fulfill({ response, status: 404 });
        },
        { times: 1 },
      );
      await page.goto("settings?from=dashboard");
      await expect(radio(page, preference)).toBeChecked();
      await effective(page, preference === "dark" ? "dark" : "light");
      expect(new URL(page.url()).pathname).toBe("/FitCircle/settings");
      expect(new URL(page.url()).searchParams.get("from")).toBe("dashboard");
    }
  });
  for (const unavailable of ["storage", "matchMedia"]) {
    test(`bootstrap tolerates unavailable ${unavailable} without loading the application`, async ({
      page,
    }) => {
      await page.addInitScript((value) => {
        if (value === "storage")
          Object.defineProperty(window, "localStorage", {
            get() {
              throw new DOMException("Synthetic denied", "SecurityError");
            },
          });
        else {
          localStorage.setItem("fitcircle_appearance", "system");
          Object.defineProperty(window, "matchMedia", { value: undefined });
        }
      }, unavailable);
      await page.route("**/assets/*.js", (route) => route.abort());
      await page.goto("settings");
      await effective(page, "dark");
      await expect(page.locator("#fitcircle-startup")).toBeVisible();
    });
  }
});
