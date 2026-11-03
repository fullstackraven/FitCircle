import { test, expect } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

for (const mode of ['light', 'dark']) test(`${mode}: fixed dashboards retain functionality without widget customization access`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedWellnessAppearance(page, mode);
  const key = 'fitcircle_dashboard_widgets';
  const raw = JSON.stringify([{ id: 'legacy', type: 'timer', title: 'Timer', enabled: false, position: 99, size: 'small' }]);
  await page.evaluate(({ key, raw }) => {
    localStorage.setItem(key, raw);
    localStorage.setItem('fitcircle_workout_duration_data', JSON.stringify({ completedSessions: [{ date: '2026-10-19', startTime: new Date('2026-10-19T10:00:00').getTime(), duration: 600 }] }));
  }, { key, raw });
  await page.addInitScript(key => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
    const calls: string[] = [];
    (window as any).widgetStorage = { calls, value: () => get.call(localStorage, key) };
    Storage.prototype.getItem = function (name) { if (name === key) calls.push('get'); return get.call(this, name); };
    Storage.prototype.setItem = function (name, value) { if (name === key) calls.push('set'); return set.call(this, name, value); };
    Storage.prototype.removeItem = function (name) { if (name === key) calls.push('remove'); return remove.call(this, name); };
  }, key);
  const untouched = async () => {
    expect(await page.evaluate(() => (window as any).widgetStorage.calls)).toEqual([]);
    expect(await page.evaluate(() => (window as any).widgetStorage.value())).toBe(raw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  };
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
  await page.getByTitle('Open Timer', { exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Timer', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await untouched();
  await page.goto('dynamic-overview/2026-10-19');
  await expect(page.getByRole('heading', { name: 'Dynamic Overview', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Widget Settings', exact: true })).toHaveCount(0);
  await expect(page.locator('a[href*="/widgets/"]')).toHaveCount(0);
  await page.getByTestId('button-edit-workout-duration').click();
  await expect(page.getByTestId('input-duration-minutes')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(/dynamic-overview\/2026-10-19$/);
  await untouched();
  await page.goto('calendar');
  await expect(page.getByRole('heading', { name: 'Recent Activity', exact: true })).toBeVisible();
  await untouched();
  await page.goto('widgets/settings');
  await expect(page.getByRole('heading', { name: '404 Page Not Found', exact: true })).toBeVisible();
  await untouched();
});
