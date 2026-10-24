import { test, expect, type Page, type Locator } from "@playwright/test";
test.use({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/New_York",
});
const food = {
  id: "custom-modal-food",
  name: "Synthetic modal food",
  brand: "Synthetic",
  quantity: 100,
  unit: "g",
  calories: 100,
  protein: 5,
  carbs: 15,
  fat: 2,
};
async function seed(page: Page) {
  await page.clock.install({ time: new Date("2026-10-21T12:00:00-04:00") });
  await page.goto("profile");
  await page.evaluate((food) => {
    localStorage.setItem(
      "fitcircle_profile",
      JSON.stringify({ age: 31, gender: "male", retained: "synthetic" }),
    );
    localStorage.setItem(
      "fitcircle_measurements_history",
      JSON.stringify({
        weight: [{ date: "2026-10-21", value: 170 }],
        height: [{ date: "2026-10-21", value: 70 }],
      }),
    );
    localStorage.setItem(
      "workout-tracker-data",
      JSON.stringify({
        workouts: {
          w: {
            id: "w",
            name: "Synthetic exercise",
            color: "green",
            dailyGoal: 20,
            count: 0,
          },
        },
        routines: {
          r: {
            id: "r",
            name: "Synthetic routine",
            selectedDays: [0, 1, 2, 3, 4, 5, 6],
            createdAt: "2026-10-01T12:00:00Z",
          },
        },
        dailyLogs: { "2026-10-21": { w: { count: 7, goalAtTime: 20 } } },
        journalEntries: {},
        lastDate: "2026-10-21",
      }),
    );
    localStorage.setItem(
      "fitcircle_workout_duration_data",
      JSON.stringify({
        completedSessions: [
          { date: "2026-10-21", startTime: 1792598400000, duration: 600 },
        ],
      }),
    );
    localStorage.setItem("fitcircle_food_database", JSON.stringify([food]));
    localStorage.setItem("fitcircle_food_database_migrated", "true");
    localStorage.setItem(
      "fitcircle_food_2026-10-21",
      JSON.stringify([
        {
          ...food,
          meal: "breakfast",
          servings: 1,
          timestamp: "2026-10-21T12:00:00-04:00",
        },
      ]),
    );
  }, food);
}
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const cases: {
  name: string;
  route: string;
  open: (page: Page) => Promise<unknown>;
}[] = [
  {
    name: "food search",
    route: "food-tracker",
    open: (page) => page.getByTestId("button-add-breakfast").click(),
  },
  {
    name: "custom food",
    route: "food-tracker",
    open: async (page) => {
      await page.getByTestId("button-add-breakfast").click();
      await page.getByTestId("button-create-custom-food").click();
    },
  },
  {
    name: "food Add Entry",
    route: "food-tracker",
    open: async (page) => {
      await page.getByTestId("button-add-breakfast").click();
      await page.getByTestId("input-search").fill(food.name);
      await page.getByTestId(`button-add-${food.id}`).click();
    },
  },
  {
    name: "food Edit Entry",
    route: "food-tracker",
    open: async (page) => {
      await button(page, "Breakfast 100 cal").click();
      await page
        .getByTestId(`food-item-${food.id}`)
        .getByRole("button")
        .first()
        .click();
    },
  },
  {
    name: "barcode manual entry",
    route: "food-tracker",
    open: async (page) => {
      await page.getByTestId("button-add-breakfast").click();
      await button(page, "Scan Barcode").click();
    },
  },
  {
    name: "Fitness Calculator",
    route: "food-tracker",
    open: (page) => page.getByTestId("button-calculator").click(),
  },
  {
    name: "food database editor",
    route: "food-database",
    open: async (page) => {
      await page
        .getByRole("textbox", { name: "Search foods", exact: true })
        .fill(food.name);
      await page.getByTestId(`button-edit-${food.id}`).click();
    },
  },
  {
    name: "profile name and birth date",
    route: "profile",
    open: (page) => button(page, "Edit Profile").click(),
  },
  {
    name: "profile goals textarea",
    route: "profile",
    open: (page) => button(page, "Edit Fitness Goals").click(),
  },
  {
    name: "routine editor",
    route: "routines",
    open: (page) => page.getByTestId("button-edit-routine-r").click(),
  },
  {
    name: "workout editor",
    route: "routines",
    open: async (page) => {
      await page.getByText("Edit Workouts", { exact: true }).click();
      await button(page, "Edit workout Synthetic exercise").click();
    },
  },
  {
    name: "journal textarea",
    route: "journal-log",
    open: (page) => button(page, "Write new journal entry").click(),
  },
  {
    name: "supplement form",
    route: "supplements-page",
    open: (page) =>
      page
        .locator('button[aria-haspopup="dialog"]')
        .filter({ has: page.locator("svg.lucide-plus") })
        .click(),
  },
  {
    name: "daily duration",
    route: "dynamic-overview/2026-10-21",
    open: (page) => page.getByTestId("button-edit-workout-duration").click(),
  },
  {
    name: "cardio entry",
    route: "cardio",
    open: (page) => button(page, "Log Cardio").click(),
  },
  {
    name: "nested cardio type",
    route: "cardio",
    open: async (page) => {
      await button(page, "Log Cardio").click();
      await page
        .getByRole("dialog")
        .locator('button[aria-haspopup="dialog"]')
        .filter({ has: page.locator("svg.lucide-plus") })
        .click();
    },
  },
  {
    name: "hydration entry",
    route: "hydration",
    open: (page) => button(page, "Add Liquid").click(),
  },
  {
    name: "meditation entry",
    route: "meditation",
    open: (page) => button(page, "Add Meditation").click(),
  },
  {
    name: "fasting entry",
    route: "fasting",
    open: (page) => button(page, "Add Fast").click(),
  },
  ...["cardio", "hydration", "meditation", "fasting"].map((route) => ({
    name: `${route} custom goal`,
    route,
    open: (page: Page) => button(page, "Goal").click(),
  })),
];
async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function inspectFields(page: Page, dialog: Locator) {
  const fields = dialog.locator(
    "input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):visible, textarea:visible, select:not([aria-hidden=true]):visible, button[role=combobox]:visible",
  );
  expect(await fields.count()).toBeGreaterThan(0);
  for (const field of await fields.all()) {
    if (!(await field.isEnabled())) continue;
    if (await field.evaluate((el) => el.matches("select, button")))
      await field.focus();
    else
      await field.evaluate((el) =>
        (el as HTMLElement).focus({ preventScroll: true }),
      );
    await settle(page);
    const result = await field.evaluate((el) => {
      const style = getComputedStyle(el);
      const bounds = el.getBoundingClientRect();
      const owner = el.closest(
        '.dialog-body, .sheet-body, .viewport-overlay [role="dialog"]',
      )!;
      const frame = owner.getBoundingClientRect();
      const panel = el.closest('[role="dialog"]')!.getBoundingClientRect();
      return {
        field: el.getAttribute("aria-label") || el.id || el.tagName,
        hitElement: document
          .elementFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
          )
          ?.outerHTML.slice(0, 180),
        outline: style.outlineStyle,
        shadow: style.boxShadow,
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        frame: {
          left: frame.left,
          right: frame.right,
          top: frame.top,
          bottom: frame.bottom,
        },
        panel: { left: panel.left, right: panel.right },
        overflow: owner.scrollWidth > owner.clientWidth + 1,
        hit: el.contains(
          document.elementFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
          ),
        ),
      };
    });
    expect(result.outline).toBe("none");
    expect(result.shadow).toContain("inset");
    expect(result.shadow).not.toContain("203, 213, 225");
    expect(result.left).toBeGreaterThanOrEqual(
      Math.max(result.frame.left, result.panel.left) - 1,
    );
    expect(result.right).toBeLessThanOrEqual(
      Math.min(result.frame.right, result.panel.right) + 1,
    );
    expect(result.top).toBeGreaterThanOrEqual(result.frame.top - 1);
    expect(result.bottom).toBeLessThanOrEqual(result.frame.bottom + 1);
    expect(result.overflow).toBe(false);
    expect(result.hit, JSON.stringify(result)).toBe(true);
  }
  const actions = dialog
    .locator('button:not([aria-label="Close"])')
    .filter({ hasNotText: /^Close$/ });
  if (await actions.count()) {
    const action = actions.last();
    await action.scrollIntoViewIfNeeded();
    const bounds = (await action.boundingBox())!;
    const panel = (await dialog.boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(panel.y);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(
      panel.y + panel.height + 1,
    );
  }
  await expect(
    dialog.getByRole("button", { name: "Close", exact: true }),
  ).toBeVisible();
}
for (const example of cases)
  test(`${example.name}: contained focus and fields stay reachable through keyboard shrink`, async ({
    page,
  }) => {
    await seed(page);
    await page.goto(example.route);
    await page.addStyleTag({
      content: ":root { --safe-top: 59px; --safe-bottom: 34px; }",
    });
    await example.open(page);
    if (example.name === "journal textarea") {
      await expect(page).toHaveURL(/journal-entry/);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      const field = page.getByTestId("textarea-journal-entry");
      await field.fill("Full-page journal draft");
      await page.evaluate(() => {
        Object.defineProperties(window.visualViewport!, {
          height: { configurable: true, value: 430 },
          offsetTop: { configurable: true, value: 40 },
        });
        window.visualViewport!.dispatchEvent(new Event("resize"));
      });
      await settle(page);
      await field.scrollIntoViewIfNeeded();
      await expect(field).toBeInViewport();
      await expect(field).toHaveValue("Full-page journal draft");
      const style = await field.evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, shadow: getComputedStyle(el).boxShadow, horizontalOverflow: el.closest('main')!.scrollWidth > el.closest('main')!.clientWidth }));
      expect(style.outline).toBe("none");
      expect(style.shadow).not.toContain("203, 213, 225");
      expect(style.horizontalOverflow).toBe(false);
      await expect(page.getByTestId("button-save-journal")).toBeInViewport();
      await expect(page.getByRole("button", { name: "Back to journal library" })).toBeInViewport();
      return;
    }
    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    await dialog.evaluate((el) =>
      Promise.all(
        el
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    await inspectFields(page, dialog);
    await page.evaluate(() => {
      Object.defineProperties(window.visualViewport!, {
        height: { configurable: true, value: 430 },
        offsetTop: { configurable: true, value: 40 },
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await settle(page);
    await inspectFields(page, dialog);
    await expect
      .poll(() => dialog.evaluate((el) => el.getBoundingClientRect().bottom))
      .toBeLessThanOrEqual(470);
  });

test("small-width compact editor scrolls without hiding its field or fixed actions", async ({
  page,
}) => {
  await seed(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("routines");
  await page.getByTestId("button-edit-routine-r").click();
  const dialog = page.getByRole("dialog");
  await page.getByTestId("input-routine-name").focus();
  await page.evaluate(() => {
    Object.defineProperties(window.visualViewport!, {
      height: { configurable: true, value: 280 },
      offsetTop: { configurable: true, value: 0 },
    });
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  await settle(page);
  await inspectFields(page, dialog);
  await expect(dialog.getByTestId("button-save-routine")).toBeVisible();
  expect(
    await dialog.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
  ).toBe(true);
});

test("forced-color focus remains inside the profile field and ordinary button focus is preserved", async ({
  page,
}) => {
  await seed(page);
  await page.goto("profile");
  await button(page, "Edit Profile").click();
  const field = page.getByRole("textbox", { name: "Name", exact: true });
  await field.focus();
  await page.emulateMedia({ forcedColors: "active" });
  const outline = await field.evaluate((el) => {
    const style = getComputedStyle(el);
    return { width: style.outlineWidth, offset: style.outlineOffset };
  });
  expect(outline).toEqual({ width: "1px", offset: "-2px" });
  await page.emulateMedia({ forcedColors: "none" });
  const cancel = page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true });
  await cancel.focus();
  expect(
    await cancel.evaluate((el) =>
      parseFloat(getComputedStyle(el).outlineWidth),
    ),
  ).toBeGreaterThan(0);
});
