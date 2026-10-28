import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });
for (const mode of ['dark', 'light']) test(`update notice preserves an energy draft and uses the existing refresh screen (${mode})`, async ({ page }) => {
  await page.addInitScript(() => {
    const old = Object.assign(new EventTarget(), { state: 'activated' });
    const registration = Object.assign(new EventTarget(), {
      installing: null, waiting: null, active: old,
      update: async () => registration,
    });
    const container = Object.assign(new EventTarget(), {
      controller: old, register: async () => registration,
    });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container });
    Object.assign(window, { simulatePWAUpdate: () => {
      container.controller = Object.assign(new EventTarget(), { state: 'activated' });
      container.dispatchEvent(new Event('controllerchange'));
    } });
  });
  await page.goto('wellness');
  await page.evaluate(mode => localStorage.setItem('fitcircle_appearance', mode), mode);
  await page.goto('energy-level');
  await page.getByRole('slider', { name: 'Energy level', exact: true }).fill('7');
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  // Simulate the browser claiming this loaded page with a newer worker.
  // Registration, detection and the notice use the production integration.
  await page.evaluate(() => (window as unknown as { simulatePWAUpdate(): void }).simulatePWAUpdate());
  await expect(page.getByRole('status').filter({ hasText: 'FitCircle update available' })).toBeVisible();
  await expect(page.getByTestId('selected-energy')).toHaveText('7');
  await expect(page.getByTestId('energy-save-state')).not.toHaveText('Saved');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(before);
  await expect(page).toHaveURL(/energy-level$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Open Display to refresh' }).click();
  await expect(page).toHaveURL(/display$/);
  await expect(page.getByRole('button', { name: 'Refresh FitCircle', exact: true })).toBeVisible();
});
