import { test, expect } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York' });
for (const mode of ['light', 'dark']) test(`${mode}: food displays round while saved and serving-adjusted values retain precision`, async ({ page }) => {
  await seedWellnessAppearance(page, mode);
  await page.evaluate(() => {
    const food = { id: 'precise-food', name: 'Precision bun', brand: 'Test', quantity: 50, unit: 'g', calories: 113.3980925, carbs: 25.9998, protein: 5.9976, fat: 1.9992 };
    localStorage.setItem('fitcircle_food_database', JSON.stringify([food]));
    localStorage.setItem('fitcircle_food_2026-10-19', JSON.stringify([{ ...food, id: 'precise-entry', servings: 1, meal: 'breakfast', timestamp: '2026-10-19T10:00:00-04:00' }]));
  });
  const before = await page.evaluate(() => [localStorage.getItem('fitcircle_food_database'), localStorage.getItem('fitcircle_food_2026-10-19')]);
  await page.goto('food-tracker');
  await page.getByRole('button', { name: 'Add Food to Breakfast', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Food', exact: true });
  const macros = dialog.locator('.your-food-card').first().locator('.your-food-macros');
  await expect(macros).toHaveText('Cal: 113C: 26gP: 6gF: 2g');
  await dialog.getByRole('button', { name: 'Most Frequent', exact: true }).click();
  await expect(macros).toHaveText('Cal: 113C: 26gP: 6gF: 2g');
  await dialog.getByRole('textbox', { name: 'Search foods', exact: true }).fill('Precision bun');
  await expect(macros).toHaveText('Cal: 113C: 26gP: 6gF: 2g');
  expect(await page.evaluate(() => [localStorage.getItem('fitcircle_food_database'), localStorage.getItem('fitcircle_food_2026-10-19')])).toEqual(before);
  await dialog.locator('.your-food-card').first().getByTitle('Add to meal').click();
  const entry = page.getByRole('dialog', { name: 'Add Entry', exact: true });
  await entry.getByTestId('input-add-servings').fill('2');
  await expect(entry.getByTestId('entry-nutrition-summary')).toContainText('227');
  await entry.getByRole('button', { name: 'Add', exact: true }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_food_2026-10-19')!));
  expect(saved).toHaveLength(2);
  expect(saved[1]).toMatchObject({ calories: 113.3980925, carbs: 25.9998, protein: 5.9976, fat: 1.9992, servings: 2 });
  expect(JSON.stringify(saved[0])).toBe(JSON.stringify(JSON.parse(before[1]!)[0]));
  expect(await page.evaluate(() => localStorage.getItem('fitcircle_food_database'))).toBe(before[0]);
  await expect(page.locator('html')).toHaveAttribute('data-appearance', mode);
});
