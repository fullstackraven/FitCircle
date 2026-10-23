import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const controllerSource = ts.transpileModule(
  fs.readFileSync(path.join(root, "client/src/lib/appearance.ts"), "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  },
).outputText;

// Exercise the real controller and built stylesheet on an isolated test document.
// No preview route or test harness is included in the shipped app.
async function fixture(page: Page, preference?: string) {
  const asset = fs
    .readdirSync(path.join(root, "dist/assets"))
    .find((name) => name.endsWith(".css"))!;
  const css = fs.readFileSync(path.join(root, "dist/assets", asset), "utf8");
  await page.route("**/appearance-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><style>${css}</style></head><body><div style="color:red;background:blue"><div id="probe" class="bg-background text-foreground border border-input">Semantic token probe</div><div id="alpha" class="text-foreground/50">Alpha probe</div></div></body></html>`,
    }),
  );
  await page.goto("appearance-fixture");
  await page.addScriptTag({
    content: `window.appearanceModule = (() => { const exports = {}; ${controllerSource}\n return exports; })();`,
  });
  if (preference !== undefined)
    await page.evaluate(
      (value) => localStorage.setItem("fitcircle_appearance", value),
      preference,
    );
  await page.evaluate(() => {
    (window as any).appearanceController = (
      window as any
    ).appearanceModule.startAppearanceController();
  });
}

for (const os of ["light", "dark"] as const) {
  test(`public app defaults dark on ${os} devices without writing a preference`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: os });
    await page.goto("settings");
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "dark",
    );
    await expect(
      page.getByRole("heading", { name: "Settings", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
    ).toBeNull();
    await expect(
      page.getByRole("radio", { name: "Dark", exact: true }),
    ).toBeChecked();
    expect(
      await page
        .locator(".app-shell")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(15, 23, 42)");
  });
}
for (const saved of ["dark", "light", "system", "malformed"]) {
  test(`production applies the public appearance from saved ${saved}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(
      (value) => localStorage.setItem("fitcircle_appearance", value),
      saved,
    );
    await page.goto("settings?appearance=light");
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      saved === "light" || saved === "system" ? "light" : "dark",
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      saved === "light" || saved === "system" ? "light" : "dark",
    );
    expect(
      await page.evaluate(() => localStorage.getItem("fitcircle_appearance")),
    ).toBe(saved);
  });
}

test("internal preview follows live System changes and explicit choices survive reload; portals inherit root tokens", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await fixture(page, "system");
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "dark");
  await page.evaluate(() =>
    (window as any).appearanceController.setPreference("light"),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  await page.reload();
  await page.addScriptTag({
    content: `window.appearanceModule = (() => { const exports = {}; ${controllerSource}\n return exports; })();`,
  });
  await page.evaluate(() => {
    (window as any).appearanceController = (
      window as any
    ).appearanceModule.startAppearanceController();
    const portal = document.createElement("div");
    portal.id = "portal";
    portal.className = "glass-dialog text-foreground";
    portal.textContent = "Portal surface";
    document.body.appendChild(portal);
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  const styles = await page.locator("#portal").evaluate((el) => ({
    color: getComputedStyle(el).color,
    background: getComputedStyle(el).backgroundColor,
  }));
  expect(styles.color).toBe("rgb(15, 23, 41)");
  expect(styles.background).toBe("rgba(255, 255, 255, 0.98)");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
});

for (const appearance of ["dark", "light"])
  test(`semantic utilities compute valid ${appearance} colors including opacity modifiers`, async ({
    page,
  }) => {
    await fixture(page, appearance);
    const result = await page.locator("#probe").evaluate((el) => {
      const css = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      const tokens = [
        "background",
        "foreground",
        "card",
        "card-foreground",
        "popover",
        "popover-foreground",
        "primary",
        "primary-foreground",
        "secondary",
        "secondary-foreground",
        "muted",
        "muted-foreground",
        "accent",
        "accent-foreground",
        "destructive",
        "destructive-foreground",
        "border",
        "input",
        "ring",
        "surface",
        "surface-secondary",
        "surface-elevated",
        "progress-track",
        "focus",
        "accent-text",
        "accent-fill",
        "on-accent",
        "sidebar-background",
        "sidebar-foreground",
        "sidebar-primary",
        "sidebar-primary-foreground",
        "sidebar-accent",
        "sidebar-accent-foreground",
        "sidebar-border",
        "sidebar-ring",
        "chart-1",
        "chart-2",
        "chart-3",
        "chart-4",
        "chart-5",
      ];
      return {
        background: css.backgroundColor,
        color: css.color,
        border: css.borderColor,
        alpha: getComputedStyle(document.querySelector("#alpha")!).color,
        invalid: tokens.filter(
          (token) =>
            !CSS.supports(
              "color",
              `hsl(${root.getPropertyValue("--" + token)} / .5)`,
            ),
        ),
      };
    });
    expect(result.invalid).toEqual([]);
    expect(result.color).not.toBe("rgb(255, 0, 0)");
    expect(result.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(result.border).not.toBe(result.color);
    expect(result.alpha).toMatch(/^rgba\(.+, 0\.5\)$/);
  });

test("cross-tab changes update internal preview and ignore unrelated storage", async ({
  page,
}) => {
  await fixture(page, "dark");
  const other = await page.context().newPage();
  await other.goto("profile");
  await other.evaluate(() =>
    localStorage.setItem("fitcircle_appearance", "light"),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  await other.evaluate(() =>
    localStorage.setItem("unrelated-synthetic", "unchanged"),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-appearance",
    "light",
  );
  await other.close();
});

test("blocked preference writes report failure and retain the applied preference", async ({
  page,
}) => {
  await fixture(page, "dark");
  const result = await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("Synthetic quota");
    };
    try {
      const controller = (window as any).appearanceController;
      return {
        save: controller.setPreference("light"),
        state: controller.getSnapshot(),
        stored: localStorage.getItem("fitcircle_appearance"),
      };
    } finally {
      Storage.prototype.setItem = original;
    }
  });
  expect(result.save.ok).toBe(false);
  expect(result.state.applied).toBe("dark");
  expect(result.stored).toBe("dark");
  expect(result.save.error).toMatch(/could not be saved/);
});

test("Settings exports fitness data despite an invalid appearance and discloses the omitted preference", async ({
  page,
}) => {
  const { completeStorage } = await import("../fixtures/complete-storage");
  await page.goto("settings");
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("fitcircle_food_database_migrated"),
      ),
    )
    .toBe("true");
  await page.evaluate((records) => {
    for (const [key, value] of Object.entries(records))
      localStorage.setItem(key, value);
    localStorage.setItem("fitcircle_appearance", "auto");
  }, completeStorage);
  const before = await page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]),
    ),
  );
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download Complete Backup", exact: true })
    .click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.version).toBe(2);
  expect(backup.localStorage.fitcircle_appearance).toBeUndefined();
  expect(backup.manifest.localStorageKeys).toEqual(
    Object.keys(backup.localStorage).sort(),
  );
  for (const [key, value] of Object.entries(completeStorage)) {
    if (key !== "fitcircle_appearance")
      expect(backup.localStorage[key]).toBe(value);
  }
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        Object.keys(localStorage).map((key) => [
          key,
          localStorage.getItem(key),
        ]),
      ),
    ),
  ).toEqual(before);
  await expect(
    page.getByText(
      /Invalid optional appearance preference omitted from backup/,
    ),
  ).toBeVisible();
  // Validate the exported file through the real importer, then cancel at its
  // confirmation. Unit coverage also applies the same backup and compares bytes.
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "valid-omission.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await expect(
    page.getByText("Restore cancelled.", { exact: true }),
  ).toBeVisible();
  // An explicitly invalid restore still rejects before modifying any records.
  backup.localStorage.fitcircle_appearance = "auto";
  backup.manifest.localStorageKeys = Object.keys(backup.localStorage).sort();
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid-appearance.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(
    page.getByText(/Import failed: Invalid appearance preference/),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        Object.keys(localStorage).map((key) => [
          key,
          localStorage.getItem(key),
        ]),
      ),
    ),
  ).toEqual(before);
});
