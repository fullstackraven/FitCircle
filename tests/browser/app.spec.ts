import { test, expect } from '@playwright/test';

test('fitness navigation, workout persistence, food search, and fully offline reload', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByText('New workout', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add new workout', exact: true }).click();
  await page.locator('#workout-name').fill('Migration smoke workout');
  await page.locator('#daily-goal').fill('10');
  await page.getByRole('button', { name: 'Add Workout', exact: true }).click();
  await expect(page.getByText('Migration smoke workout', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Migration smoke workout', { exact: true })).toBeVisible();
  for (const label of ['Calendar', 'Routines', 'Logs', 'Reminders', 'Home']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    expect(new URL(page.url()).pathname).toMatch(/^\/FitCircle\//);
  }
  await page.goto('food-database');
  await page.getByTestId('input-search').fill('chicken');
  await expect(page.locator('[data-testid^="text-name-"]').first()).toContainText(/chicken/i);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.evaluate(() => caches.open('another-app-cache').then(c => c.put('/other-app', new Response('keep'))));
  await context.setOffline(true);
  await page.goto('./');
  await expect(page.getByText('Migration smoke workout', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
  expect(await page.evaluate(() => caches.has('another-app-cache'))).toBe(true);
  expect(errors).toEqual([]);
});

test('settings backup exports local and IndexedDB foods, validates before import, and keeps unrelated keys', async ({ page }) => {
  await page.goto('settings');
  await expect(page.getByRole('button', { name: 'Download Complete Backup' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fitcircle_food_database') !== null)).toBe(true);
  await page.evaluate(async () => {
    localStorage.setItem('other-app-key', 'keep');
    localStorage.setItem('fitcircle_username', 'Before restore');
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('FitCircleCustomFoods', 1);
      req.onsuccess = () => {
        const db = req.result; const tx = db.transaction('foods', 'readwrite');
        tx.objectStore('foods').put({ id: 'custom-idb', name: 'Legacy food', quantity: 100, unit: 'g', calories: 5, carbs: 1, protein: 0, fat: 0 });
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => reject(tx.error);
      };
    });
  });
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Complete Backup' }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk);
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.indexedDB.customFoods).toHaveLength(1);
  expect(backup.localStorage['other-app-key']).toBeUndefined();
  expect(JSON.parse(backup.localStorage.fitcircle_food_database).length).toBeGreaterThan(100);
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ fitcircle_username: 'Should not apply', fitcircle_food_database: ['bad'] })) });
  await expect(page.getByText(/Import failed/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('fitcircle_username'))).toBe('Before restore');
  page.once('dialog', d => d.accept());
  backup.localStorage.fitcircle_username = 'Restored';
  await page.locator('input[type=file]').setInputFiles({ name: 'good.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.waitForURL('http://127.0.0.1:4173/FitCircle/');
  await expect(page.getByText('New workout', { exact: true })).toBeVisible();
  const stored = await page.evaluate(() => ({ name: localStorage.getItem('fitcircle_username'), other: localStorage.getItem('other-app-key'), foods: JSON.parse(localStorage.getItem('fitcircle_food_database') || '[]') }));
  expect(stored.name).toBe('Restored'); expect(stored.other).toBe('keep');
  expect(stored.foods.some((f: {id: string}) => f.id === 'custom-idb')).toBe(true);
  await page.goto('settings');
  await page.getByTestId('button-force-refresh').click();
  await page.waitForURL(/\/FitCircle\/\?refresh=/);
});

test('GitHub Pages 404 recovery preserves deep route and query without a service worker', async ({ page }) => {
  await page.route('**/FitCircle/dynamic-overview/2026-10-14?from=dashboard', async route => {
    const response = await route.fetch({ url: 'http://127.0.0.1:4173/FitCircle/404.html' });
    await route.fulfill({ response, status: 404 });
  });
  await page.goto('dynamic-overview/2026-10-14?from=dashboard');
  await page.waitForURL('http://127.0.0.1:4173/FitCircle/dynamic-overview/2026-10-14?from=dashboard');
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Opening FitCircle');
});

test('all active fitness screens render under the repository base without backend requests', async ({ page }) => {
  const errors: string[] = [];
  const apis: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/api/')) apis.push(r.url()); });
  for (const route of ['profile', 'measurements', 'fasting', 'meditation', 'hydration', 'food-tracker', 'food-database', 'cardio', 'workout-statistics', 'daily-journal', 'journal-log', 'energy-level', 'supplements-page', 'recovery', 'routines', 'wellness', 'reminders', 'settings']) {
    await page.goto(route);
    await expect(page.locator('main')).not.toBeEmpty();
    await expect(page.locator('body')).not.toContainText('404 Page Not Found');
  }
  expect(errors).toEqual([]);
  expect(apis).toEqual([]);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Complete Backup' }).click();
  expect((await downloadEvent).suggestedFilename()).toMatch(/^fitcircle-backup-/);
});
