import { test, expect } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

test.use({ viewport: { width: 320, height: 740 } });
const sessions = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const value = JSON.parse(localStorage.getItem('fitcircle_meditation_logs')!);
  return Array.isArray(value) ? value : Object.values(value.dailyLogs).flatMap((day: any) => day.sessions);
});
for (const mode of ['light', 'dark', 'system']) test(`${mode}: quick add, timer and fasting fit the page`, async ({ page }) => {
  await seedWellnessAppearance(page, mode);
  await page.goto('meditation');
  const before = await sessions(page);
  await page.getByRole('button', { name: '+5 min', exact: true }).dblclick();
  await expect.poll(async () => (await sessions(page)).length).toBe(before.length + 1);
  await page.waitForTimeout(450);
  const custom = page.getByLabel('Custom duration (minutes)');
  await custom.fill('0'); await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('positive duration');
  await custom.fill('7'); await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect.poll(async () => (await sessions(page)).length).toBe(before.length + 2);
  expect((await sessions(page)).slice(-2).map((s: any) => s.duration)).toEqual([5, 7]);
  await page.getByTestId('button-start-meditation').click();
  await expect(page).toHaveURL(/meditation$/);
  await page.getByRole('listbox', { name: 'Minutes', exact: true }).press('Home');
  await page.getByRole('listbox', { name: 'Seconds', exact: true }).press('ArrowDown');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.runFor(2000);
  expect((await sessions(page)).length).toBe(before.length + 2);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(1500);
  await expect(page.getByText('Session complete', { exact: true })).toBeVisible();
  expect((await sessions(page)).length).toBe(before.length + 3);
  await page.clock.runFor(2000);
  expect((await sessions(page)).length).toBe(before.length + 3);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByTestId('button-start-meditation').click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  expect((await sessions(page)).length).toBe(before.length + 3);
  await page.goto('cardio');
  const cardio = () => page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('fitcircle_cardio_data')!).dailyLogs).flatMap((d: any) => d.sessions));
  const prior = (await cardio()).length;
  await page.getByRole('button', { name: '+20 min', exact: true }).click();
  await expect.poll(async () => (await cardio()).length).toBe(prior + 1);
  await page.waitForTimeout(450);
  await page.getByLabel('Custom duration (minutes)').fill('7'); await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect.poll(async () => (await cardio()).length).toBe(prior + 2);
  expect((await cardio()).slice(-2).map((s: any) => [s.type, s.duration, s.distance ?? null])).toEqual([['Walking', 20, null], ['Walking', 7, null]]);
  await page.getByRole('button', { name: 'Add Cardio', exact: true }).click(); await expect(page).toHaveURL(/cardio\/add$/);
  for (const path of ['fasting/add', 'fasting/edit?id=fast']) {
    await page.goto(path);
    const controls = page.locator('input[type=date], input[type=time]');
    await expect(controls).toHaveCount(4);
    for (const control of await controls.all()) {
      const box = (await control.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(320);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
