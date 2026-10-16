import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/New_York' });

test('profile fields persist across navigation and reload without changing unrelated keys', async ({ page }) => {
  await page.goto('profile');
  await page.evaluate(() => localStorage.setItem('unrelated-regression-key', 'retain'));
  await page.getByLabel('Name', { exact: true }).fill('Synthetic athlete');
  await page.getByLabel('Age', { exact: true }).fill('37');
  await page.getByLabel('Fitness Goal', { exact: true }).fill('Consistent movement');
  await page.getByRole('button', { name: 'Save Profile' }).click();
  await page.goto('profile');
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Synthetic athlete');
  await expect(page.getByLabel('Age', { exact: true })).toHaveValue('37');
  await expect(page.getByLabel('Fitness Goal', { exact: true })).toHaveValue('Consistent movement');
  expect(await page.evaluate(() => localStorage.getItem('unrelated-regression-key'))).toBe('retain');
});

test('dated food history remains distinct when selecting yesterday and reloading today', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-16T12:00:00-04:00') });
  await page.goto('profile');
  const meal = { id: 'synthetic-meal', name: 'Synthetic oats', quantity: 100, unit: 'g',
    calories: 100, carbs: 15, protein: 5, fat: 2, servings: 1, meal: 'breakfast', timestamp: '2026-10-15T12:00:00Z' };
  await page.evaluate(meal => {
    localStorage.setItem('fitcircle_food_2026-10-15', JSON.stringify([meal]));
    localStorage.setItem('fitcircle_food_2026-10-16', '[]');
  }, meal);
  await page.goto('food-tracker');
  await expect(page.getByTestId('food-item-synthetic-meal')).toHaveCount(0);
  await page.getByTestId('button-previous-day').click();
  await page.getByRole('button', { name: 'Breakfast 100 cal', exact: true }).click();
  await expect(page.getByTestId('food-item-synthetic-meal')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_food_2026-10-15')!))).toEqual([meal]);
  await page.getByTestId('button-next-day').click();
  await expect(page.getByTestId('food-item-synthetic-meal')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('button-calculator')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_food_2026-10-15')!))).toEqual([meal]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_food_2026-10-16')!))).toEqual([]);
});

test('hydration midnight reset clears the daily counter while retaining historical entries', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-16T23:59:30-04:00') });
  await page.goto('profile');
  const historical = { date: '2026-10-16', totalOz: 24,
    entries: [{ id: 'synthetic-water', time: '11:00 PM', amount: 24, liquidType: 'Water' }] };
  await page.evaluate(log => localStorage.setItem('fitcircle_hydration_data', JSON.stringify({
    dailyGoalOz: 80, currentDayOz: 24, lastDate: '2026-10-16', logs: { '2026-10-16': log },
  })), historical);
  await page.goto('hydration');
  await expect(page.getByRole('heading', { name: 'Hydration', exact: true })).toBeVisible();
  await page.clock.runFor(61_000);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_hydration_data')!).lastDate)).toBe('2026-10-17');
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_hydration_data')!));
  expect(data.currentDayOz).toBe(0);
  expect(data.dailyGoalOz).toBe(80);
  expect(data.logs['2026-10-16']).toEqual(historical);
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_hydration_data')!).logs['2026-10-16'])).toEqual(historical);
});
