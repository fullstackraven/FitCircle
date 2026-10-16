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
