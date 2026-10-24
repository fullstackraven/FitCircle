import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { textContrast } from "../fixtures/appearance-contrast";
test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
const entries = {
  "2026-10-24": {
    text: "Leg Day Workout\n\nFocused on quads and hamstrings.\nKeep the original whitespace.  ",
    timestamp: "2026-10-24T14:00:00.123Z",
    metadata: "retain",
  },
  "2026-10-11": "Rest Day Reflections\nFeeling good today.",
  "2026-09-25": "Boundary reflection\nThirty calendar days.",
  "2026-09-24": "Nutrition Progress\nHit my protein goal.",
  "2026-08-02": "Protein Shake Recipe\nTwo scoops.",
  "2025-07-18": "Meal Plan Ideas\nIncrease daily protein.",
  "2024-01-01": "Older reflection\nNew year.",
  unparsed: {
    text: "Undated reflection\nPreserved legacy key",
    timestamp: "invalid",
  },
};
async function seed(
  page: Page,
  mode = "dark",
  records: Record<string, unknown> = entries,
) {
  await page.clock.install({ time: new Date("2026-10-24T15:00:00Z") });
  await page.goto("");
  await page.evaluate(
    ({ mode, records }) => {
      localStorage.setItem("fitcircle_appearance", mode);
      localStorage.setItem(
        "workout-tracker-data",
        JSON.stringify({
          workouts: {},
          dailyLogs: {},
          routines: {},
          journalEntries: records,
          lastDate: "2026-10-24",
        }),
      );
    },
    { mode, records },
  );
  await page.goto("journal-log");
}
async function shot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync("docs/review/journal-notes-revamp/screenshots", {
    recursive: true,
  });
  const contrast = await textContrast(page);
  fs.writeFileSync(
    `docs/review/journal-notes-revamp/screenshots/${name}-contrast.json`,
    JSON.stringify(contrast, null, 2),
  );
  expect(contrast.failures).toEqual([]);
  await page.screenshot({
    path: `docs/review/journal-notes-revamp/screenshots/${name}.png`,
    animations: "disabled",
  });
}
for (const mode of ["light", "dark"])
  test(`${mode}: grouped library, reader, search and editor preserve source records`, async ({
    page,
  }) => {
    await seed(page, mode);
    const raw = await page.evaluate(() =>
      localStorage.getItem("workout-tracker-data"),
    );
    await expect(
      page.getByRole("heading", { name: "Previous 30 Days" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "September", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "2025", exact: true }),
    ).toHaveCount(1);
    await shot(page, `${mode}-library`);
    const search = page.getByRole("searchbox", { name: "Search journal" });
    await page.context().setOffline(true);
    await search.fill("protein");
    await expect(page.getByText("3 results", { exact: true })).toBeVisible();
    await shot(page, `${mode}-search`);
    await search.focus();
    await page.evaluate(() => {
      Object.defineProperties(window.visualViewport!, {
        height: { configurable: true, value: 430 },
        offsetTop: { configurable: true, value: 0 },
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await expect
      .poll(async () => {
        const b = await page.getByRole("search").boundingBox();
        return b!.y + b!.height;
      })
      .toBeLessThanOrEqual(430);
    await shot(page, `${mode}-search-keyboard-simulated`);
    await page.evaluate(() => {
      Object.defineProperties(window.visualViewport!, {
        height: { configurable: true, value: 844 },
        offsetTop: { configurable: true, value: 0 },
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });

    await page.context().setOffline(false);
    await search.fill("10/11/26");
    await expect(page.getByText("1 result", { exact: true })).toBeVisible();
    await page.getByText("Rest Day Reflections", { exact: true }).click();
    await expect(page.getByTestId("journal-reader-text")).toHaveText(
      entries["2026-10-11"],
    );
    await page.getByRole("button", { name: "Back to journal library" }).click();
    await expect(search).toHaveValue("10/11/26");
    await search.fill("no such phrase");
    await expect(page.getByText("No matching entries")).toBeVisible();
    await shot(page, `${mode}-no-results`);
    await page.getByRole("button", { name: "Clear search" }).click();
    await page.getByText("Leg Day Workout", { exact: true }).click();
    await shot(page, `${mode}-reader`);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByTestId("textarea-journal-entry")).toHaveValue(
      entries["2026-10-24"].text,
    );
    await shot(page, `${mode}-editor`);
    await page.evaluate(() => {
      Object.defineProperties(window.visualViewport!, {
        height: { configurable: true, value: 430 },
        offsetTop: { configurable: true, value: 0 },
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator("html")).toHaveClass(/keyboard-open/);
    await shot(page, `${mode}-editor-keyboard-simulated`);
    await expect(page.getByTestId("button-save-journal")).toBeInViewport();
    await page.evaluate(() => {
      Object.defineProperties(window.visualViewport!, {
        height: { configurable: true, value: 844 },
        offsetTop: { configurable: true, value: 0 },
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    expect(
      await page.evaluate(() => localStorage.getItem("workout-tracker-data")),
    ).toBe(raw);
    const toolbar = await page.getByRole("search").boundingBox();
    const dock = await page.locator(".app-dock").boundingBox();
    expect(toolbar!.y + toolbar!.height).toBeLessThanOrEqual(dock?.y ?? 844);
    await page
      .locator("main")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(
      page.getByText("Undated reflection", { exact: true }),
    ).toBeInViewport();
    await page.setViewportSize({ width: 320, height: 700 });
    await shot(page, `${mode}-narrow`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Write new journal entry" }).click();
    await page
      .getByTestId("textarea-journal-entry")
      .fill("Edited reflection\nOriginal date retained.");
    await page.getByTestId("button-save-journal").click();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await search.fill("Edited reflection");
    await expect(page.getByText("1 result", { exact: true })).toBeVisible();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("workout-tracker-data")!),
    );
    expect(saved.journalEntries["2026-10-24"].metadata).toBe("retain");
    for (const [key, value] of Object.entries(entries))
      if (key !== "2026-10-24")
        expect(saved.journalEntries[key]).toEqual(value);
    await page.reload();
    await expect(
      page.getByText("Edited reflection", { exact: true }),
    ).toBeVisible();
  });
test("empty compose, unsaved dismissal, save, delete and System updates", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await seed(page, "system", {});
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  await shot(page, "empty-light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "dark");
  await page.getByRole("button", { name: "Write new journal entry" }).click();
  await shot(page, "new-editor-dark");
  await expect(page.getByTestId("button-save-journal")).toBeDisabled();
  await page
    .getByTestId("textarea-journal-entry")
    .fill("New reflection\nMultiline preserved.");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByTestId("textarea-journal-entry")).toHaveValue(
    "New reflection\nMultiline preserved.",
  );
  await page.getByTestId("button-save-journal").click();
  page.once("dialog", (d) => d.dismiss());
  await page.getByTestId("button-delete-journal").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("button-delete-journal").click();
  await expect(page.getByText("No Journal Entries Yet")).toBeVisible();
});

test("mount preserves original bytes without journal initialization writes and invalid records remain recoverable", async ({
  page,
}) => {
  await seed(page);
  const raw = await page.evaluate(() => {
    const key = "workout-tracker-data";
    const raw = JSON.stringify(JSON.parse(localStorage.getItem(key)!), null, 2);
    localStorage.setItem(key, raw);
    return raw;
  });
  await page.addInitScript(() => {
    const writes: string[] = [];
    const original = Storage.prototype.setItem;
    Object.assign(window, { journalWrites: writes });
    Storage.prototype.setItem = function (key, value) {
      writes.push(key);
      return original.call(this, key, value);
    };
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Journal", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("workout-tracker-data")),
  ).toBe(raw);
  expect(
    await page.evaluate(
      () => (window as unknown as { journalWrites: string[] }).journalWrites,
    ),
  ).not.toContain("workout-tracker-data");
  await page.evaluate(() =>
    localStorage.setItem("workout-tracker-data", '{"journalEntries":false}'),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your saved workouts need attention" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("workout-tracker-data")),
  ).toBe('{"journalEntries":false}');
});

test("browser Back protects a dirty reader and failed persistence retains the draft and original record", async ({
  page,
}) => {
  await seed(page);
  await page.getByText("Leg Day Workout", { exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByTestId("textarea-journal-entry").fill("Unsaved new text");
  page.once("dialog", (d) => d.dismiss());
  await page.goBack();
  await expect(page.getByTestId("textarea-journal-entry")).toHaveValue(
    "Unsaved new text",
  );
  const before = await page.evaluate(() =>
    localStorage.getItem("workout-tracker-data"),
  );
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "workout-tracker-data")
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByTestId("button-save-journal").click();
  await expect(page.getByRole("alert")).toContainText("Could not save");
  await expect(page.getByTestId("textarea-journal-entry")).toHaveValue(
    "Unsaved new text",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("workout-tracker-data")),
  ).toBe(before);
  page.once("dialog", (d) => d.accept());
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Journal", exact: true }),
  ).toBeVisible();
});

test("a small library keeps compose reachable without placeholder saved entries", async ({
  page,
}) => {
  await seed(page, "light", { "2026-10-23": "Short reflection\nA quiet day." });
  await expect(page.getByText("1 entry", { exact: true })).toBeVisible();
  await shot(page, "few-entries-light");
  await page.getByRole("button", { name: "Write new journal entry" }).click();
  await expect(page.getByTestId("textarea-journal-entry")).toHaveValue("");
  await expect(page.getByTestId("button-save-journal")).toBeDisabled();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const records = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("workout-tracker-data")!).journalEntries,
  );
  expect(Object.keys(records)).toEqual(["2026-10-23"]);
});
