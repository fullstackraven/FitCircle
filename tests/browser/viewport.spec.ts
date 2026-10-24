import { test, expect, type Page, type Locator } from '@playwright/test';

// Chromium mobile emulation + injected safe-area variables exercise the layout
// contract. These are not real iOS Safari/standalone device tests.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const root = document.documentElement;
      root.style.setProperty('--safe-top', '59px');
      root.style.setProperty('--safe-bottom', '34px');
    });
    const routines = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`r${i}`, { id: `r${i}`, name: `Routine ${i}`, selectedDays: [0, 1, 2, 3, 4, 5, 6], createdAt: new Date().toISOString() }]));
    const workouts = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`w${i}`, { id: `w${i}`, name: `Exercise ${i}`, color: 'green', count: 0, dailyGoal: 10, scheduledDays: [0, 1, 2, 3, 4, 5, 6] }]));
    // Synthetic fixture only; never modify user storage in application code.
    localStorage.setItem('workout-tracker-data', JSON.stringify({ workouts, routines, dailyLogs: {}, journalEntries: {}, lastDate: new Date().toISOString().slice(0, 10) }));
  });
});

async function assertSafeClose(dialog: Locator, top = 59, bottom = 810) {
  await expect(dialog).toBeVisible();
  await dialog.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
  const box = await dialog.getByRole('button', { name: 'Close', exact: true }).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(top);
  expect(box!.y + box!.height).toBeLessThanOrEqual(bottom);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(await dialog.evaluate(() => window.innerWidth));
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}
async function bottomAboveDock(page: Page, target: Locator) {
  await page.locator('main').evaluate(el => { el.scrollTop = el.scrollHeight; });
  const item = await target.boundingBox();
  const dock = await page.locator('.app-dock').boundingBox();
  expect(item).not.toBeNull(); expect(dock).not.toBeNull();
  expect(item!.y + item!.height).toBeLessThanOrEqual(dock!.y);
  expect(item!.y).toBeGreaterThanOrEqual(59);
}

test('home and routines reach their last items above the measured dock', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('Exercise 9', { exact: true })).toBeAttached();
  await bottomAboveDock(page, page.getByText('Exercise 9', { exact: true }));
  await bottomAboveDock(page, page.getByRole('button', { name: 'Open Timer', exact: true }));
  const dock = await page.locator('.app-dock').boundingBox();
  const measured = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-height')));
  expect(measured).toBeCloseTo(dock!.height, 0);
  const header = await page.getByRole('button', { name: 'Open Menu' }).boundingBox();
  expect(header!.y).toBeGreaterThanOrEqual(59);
  await page.getByRole('button', { name: 'Routines', exact: true }).click();
  await bottomAboveDock(page, page.getByTestId('routine-header-r7'));
  await bottomAboveDock(page, page.getByTestId('button-create-routine'));
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0);
  const nav = await page.getByRole('navigation', { name: 'Bottom navigation' }).boundingBox();
  expect(nav!.x).toBeGreaterThanOrEqual(0);
  expect(nav!.x + nav!.width).toBeLessThanOrEqual(390);
  await page.goto('daily-journal');
  await expect(page.getByTestId('button-save-journal')).toBeVisible();
  await bottomAboveDock(page, page.getByTestId('button-save-journal'));
});

test('Logs grid has one header offset and preserves editable two-column layout', async ({ page }) => {
  await page.goto('wellness');
  const pageHeading = page.locator('.app-header').getByRole('heading', { name: 'FitCircle', exact: true });
  await expect(pageHeading).toBeVisible();
  const heading = await pageHeading.boundingBox();
  const first = await page.getByTestId('card-cardio').boundingBox();
  const next = await page.getByTestId('card-fasting').boundingBox();
  expect(first!.y - (heading!.y + heading!.height)).toBeLessThan(96);
  expect(first!.y).toBeCloseTo(next!.y, 0);
  expect(next!.x).toBeGreaterThan(first!.x);
  await bottomAboveDock(page, page.getByTestId('card-supplements'));
  await page.getByTestId('button-edit-layout').click();
  await expect(page.getByTestId('button-move-right-cardio')).toBeVisible();
  await page.getByTestId('button-done-edit').click();
});

test('all navigation sheets keep close, profile, Settings, and version accessible and release scroll', async ({ page }) => {
  for (const route of ['', 'wellness', 'routines', 'calendar', 'reminders']) {
    await page.goto(route || './');
    await page.getByRole('button', { name: 'Open Menu' }).click();
    const sheet = page.getByRole('dialog', { name: 'Navigation Menu' });
    await expect(sheet).toBeVisible();
    await assertSafeClose(sheet);
    const version = await sheet.getByRole('button', { name: /^Version \d+\./ }).boundingBox();
    expect(version!.y + version!.height).toBeLessThanOrEqual(810);
    await expect(sheet.getByRole('button', { name: /My Fitness Profile/ })).toBeVisible();
    await expect(sheet.getByText('Account Data', { exact: true })).toBeVisible();
    expect(await page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('hidden');
    const before = await page.locator('main').evaluate(el => el.scrollTop);
    await page.mouse.move(380, 450); await page.mouse.wheel(0, 500);
    expect(await page.locator('main').evaluate(el => el.scrollTop)).toBe(before);
    await sheet.getByRole('button', { name: 'Close', exact: true }).click();
    await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  }
});

test('calculator stays bounded with an always-visible header and close during scrolling and keyboard panning', async ({ page }) => {
  await page.goto('food-tracker');
  await page.getByTestId('button-calculator').click();
  const dialog = page.getByRole('dialog', { name: 'Fitness Calculator' });
  await expect(dialog).toBeVisible(); await assertSafeClose(dialog);
  const title = await dialog.getByRole('heading', { name: 'Fitness Calculator', exact: true }).boundingBox();
  await dialog.locator('.dialog-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect((await dialog.getByRole('heading', { name: 'Fitness Calculator', exact: true }).boundingBox())!.y).toBeCloseTo(title!.y, 0);
  await assertSafeClose(dialog);
  const field = dialog.locator('input').first();
  await field.fill('35');
  // Shrink and pan the visual viewport to model an on-screen keyboard.
  await page.evaluate(() => {
    Object.defineProperties(window.visualViewport!, {
      height: { value: 430, configurable: true },
      offsetTop: { value: 100, configurable: true },
    });
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(() => page.locator('.app-shell').evaluate(el => el.getBoundingClientRect().height)).toBe(430);
  await assertSafeClose(dialog, 159, 496);
  await expect(field).toHaveValue('35');
  const active = await field.boundingBox();
  const body = await dialog.locator('.dialog-body').boundingBox();
  expect(active!.y).toBeGreaterThanOrEqual(body!.y);
  expect(active!.y + active!.height).toBeLessThanOrEqual(body!.y + body!.height);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByTestId('button-calculator')).toBeVisible();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  await page.evaluate(() => {
    Object.defineProperties(window.visualViewport!, {
      height: { value: 844, configurable: true }, offsetTop: { value: 0, configurable: true },
    });
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(() => page.locator('.app-shell').evaluate(el => el.getBoundingClientRect().height)).toBe(844);
});

test('dialogs, rotation, and route changes preserve editing state and scroll recovery', async ({ page }) => {
  await page.goto('routines');
  await page.getByTestId('button-edit-routine-r0').click();
  const dialog = page.getByRole('dialog', { name: 'Edit Routine' });
  const input = dialog.getByLabel('Routine Name');
  await input.fill('Unsaved viewport draft');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-top', '0px'); root.style.setProperty('--safe-bottom', '21px');
    root.style.setProperty('--safe-left', '59px'); root.style.setProperty('--safe-right', '59px');
  });
  await assertSafeClose(dialog, 0, 369);
  await expect(input).toHaveValue('Unsaved viewport draft');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  await page.goto('hydration');
  await page.getByRole('button', { name: 'Goal', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Hydration Goal' })).toBeVisible();
  await page.getByRole('dialog', { name: 'Hydration Goal' }).getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('food-tracker');
  await page.getByTestId('button-calculator').click();
  await assertSafeClose(page.getByRole('dialog', { name: 'Fitness Calculator' }), 59, 866);
});

test('nested dialogs keep background locked until the last overlay closes', async ({ page }) => {
  await page.goto('cardio');
  await page.getByRole('button', { name: 'Log Cardio', exact: true }).click();
  const outer = page.getByRole('dialog', { name: 'Add Cardio Entry' });
  await assertSafeClose(outer);
  await outer.getByRole('button', { name: '', exact: true }).click();
  const inner = page.getByRole('dialog', { name: 'Add Custom Type' });
  await expect(inner).toBeVisible(); await assertSafeClose(inner);
  await inner.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(outer).toBeVisible();
  expect(await page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('hidden');
  await outer.getByRole('combobox').click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('option').first().click();
  await outer.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  await page.goto('journal-log');
  await page.getByRole('button', { name: 'Write new journal entry' }).click();
  const journal = page.getByRole('region', { name: 'Daily Journal' });
  await expect(page).toHaveURL(/journal-entry/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await journal.getByTestId('textarea-journal-entry').fill('Unsaved journal draft');
  await page.setViewportSize({ width: 390, height: 430 });
  const save = await journal.getByTestId('button-save-journal').boundingBox();
  expect(save!.y).toBeGreaterThanOrEqual(59);
  expect(save!.y + save!.height).toBeLessThanOrEqual(396);
  await expect(journal.getByTestId('textarea-journal-entry')).toHaveValue('Unsaved journal draft');
  page.once('dialog', dialog => dialog.accept());
  await journal.getByRole('button', { name: 'Back to journal library' }).click();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
});

test('desktop layout remains bounded without mobile safe-area overrides', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/FitCircle/wellness');
    await page.getByTestId('card-cardio').waitFor();
    expect(await page.locator('.app-shell').evaluate(el => el.getBoundingClientRect().height)).toBe(900);
    await bottomAboveDock(page, page.getByTestId('card-supplements'));
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await assertSafeClose(page.getByRole('dialog', { name: 'Navigation Menu' }), 0, 900);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await page.goto('http://127.0.0.1:4173/FitCircle/food-tracker');
    await page.getByTestId('button-calculator').click();
    await assertSafeClose(page.getByRole('dialog', { name: 'Fitness Calculator' }), 0, 900);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1280);
  } finally { await context.close(); }
});


test('sidebar profile and Settings links retain the Pages path and release their locks', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /My Fitness Profile/ }).click();
  await page.waitForURL(/\/FitCircle\/profile\?from=dashboard/);
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  await page.goto('./?dashboard=open');
  const sidebar = page.getByRole('dialog', { name: 'Navigation Menu' });
  await expect(sidebar).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/FitCircle/');
  await sidebar.getByText('Account Data', { exact: true }).click();
  await page.waitForURL(/\/FitCircle\/account-data\?from=dashboard/);
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
});
