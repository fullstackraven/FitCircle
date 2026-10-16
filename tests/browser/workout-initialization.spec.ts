import { test, expect, type Page } from '@playwright/test';
import { malformedWorkouts } from '../fixtures/malformed-workouts';
const key = 'workout-tracker-data';
async function seed(page: Page, raw: string) {
  await page.goto('profile');
  await expect(page.getByRole('button', { name: 'Save Profile' })).toBeVisible();
  await page.evaluate(({ key, raw }) => {
    localStorage.setItem(key, raw); localStorage.setItem('unrelated-synthetic', 'retain');
  }, { key, raw });
}
for (const { name, raw } of malformedWorkouts) {
  test(`invalid workout store: ${name} survives mounts, raw export and reloads`, async ({ page }) => {
    await seed(page, raw);
    for (const route of ['./', 'calendar']) {
      await page.goto(route);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
      await expect(page.getByRole('heading', { name: 'Your saved workouts need attention' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toHaveCount(0);
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download original stored data' }).click();
      const file = await download;
      const stream = await file.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
      expect(JSON.parse(Buffer.concat(chunks).toString())).toEqual({ [key]: raw });
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Your saved workouts need attention' })).toBeVisible();
      expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
    }
    expect(await page.evaluate(() => localStorage.getItem('unrelated-synthetic'))).toBe('retain');
  });
}

test('Settings restores a verified backup after a blocked initialization without automatic reset', async ({ page }) => {
  const raw = malformedWorkouts[0].raw;
  await seed(page, raw);
  await page.goto('./');
  await page.getByRole('link', { name: 'Open Settings to restore a backup' }).click();
  await expect(page.getByRole('button', { name: 'Download Complete Backup' })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
  await page.getByRole('button', { name: 'Download Complete Backup' }).click();
  await expect(page.getByText(/Export failed:/)).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
  const data = { workouts: {}, routines: {}, dailyLogs: {}, journalEntries: {} };
  page.on('dialog', dialog => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic-verified-backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ [key]: data })) });
  await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(data);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-synthetic'))).toBe('retain');
});

test('unavailable workout storage offers retry without treating a failed read as an empty store', async ({ page }) => {
  const raw = JSON.stringify({ workouts: {}, dailyLogs: {}, journalEntries: {}, routines: {} });
  await seed(page, raw);
  await page.addInitScript(() => {
    const originalGet = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      if (key === 'workout-tracker-data') throw new DOMException('Synthetic denied read', 'SecurityError');
      return originalGet.call(this, key);
    };
    Object.assign(window, { readOriginalWorkout: () => originalGet.call(localStorage, 'workout-tracker-data') });
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Your saved workouts need attention' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download original stored data' })).toBeDisabled();
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Retry loading' }).click()]);
  await expect(page.getByRole('heading', { name: 'Your saved workouts need attention' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { readOriginalWorkout(): string }).readOriginalWorkout())).toBe(raw);
});

test('quota failures leave an existing valid workout document intact across reloads', async ({ page }) => {
  const raw = JSON.stringify({ workouts: {}, dailyLogs: {}, journalEntries: {}, routines: {} });
  await seed(page, raw);
  await page.addInitScript(() => {
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'workout-tracker-data') throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      return originalSet.call(this, key, value);
    };
  });
  for (let load = 0; load < 2; load++) {
    if (load === 0) await page.goto('./');
    else await page.reload();
    await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
  }
});

test('valid legacy array workout containers are not normalized on initialization', async ({ page }) => {
  const data = { workouts: [{ id: 'legacy-a', name: 'Synthetic legacy array', color: 'green', count: 0, dailyGoal: 20 }],
    dailyLogs: { '2026-01-01': { 'legacy-a': 8 } }, journalEntries: {}, routines: {} };
  await seed(page, JSON.stringify(data));
  await page.goto('./');
  await expect(page.getByText('Synthetic legacy array', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Synthetic legacy array', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(data);
});
