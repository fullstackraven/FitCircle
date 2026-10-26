import { test, expect } from '@playwright/test';

test('wellness materials preserve category colors, two columns and editing navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('wellness');
  const meditation = page.getByTestId('card-meditation');
  const hydration = page.getByTestId('card-hydration');
  expect(await meditation.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(192, 132, 252, 0.1)');
  expect(await hydration.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(34, 211, 238, 0.1)');
  expect(await meditation.evaluate(el => getComputedStyle(el).backdropFilter)).toBe('none');
  const a = await meditation.boundingBox(), b = await hydration.boundingBox();
  expect(a!.y).toBe(b!.y);
  expect(b!.x).toBeGreaterThan(a!.x);
  await page.getByTestId('button-edit-layout').click();
  await expect(page.getByTestId('button-move-right-cardio')).toBeVisible();
  await page.getByTestId('button-done-edit').click();
  await page.getByTestId('card-food-tracker').click();
  await expect(page.getByTestId('button-calculator')).toBeVisible();
});

test('reminder glass rows preserve create, complete and reload behavior', async ({ page }) => {
  await page.goto('reminders');
  await page.getByRole('button', { name: 'New Reminder', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'New reminder', exact: true });
  await input.fill('Material review reminder');
  await input.press('Enter');
  const row = page.locator('.glass-row').filter({ hasText: 'Material review reminder' });
  await expect(row).toBeVisible();
  await row.getByRole('button').first().click();
  await page.reload();
  await expect(page.getByText('Material review reminder', { exact: true })).toBeVisible();
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_reminders')!));
  expect(data.some((r: { text: string; completed: boolean }) => r.text === 'Material review reminder' && r.completed)).toBe(true);
});

test('glass controls do not add nested blur and calculator edits survive closing', async ({ page }) => {
  await page.goto('food-tracker');
  await page.getByTestId('button-calculator').click();
  const dialog = page.getByTestId("fitness-calculator-page");
  await page.getByRole("tab", { name: "Macros", exact: true }).click();
  const input = dialog.getByLabel('Carbs %', { exact: true });
  await input.fill('35');
  await input.blur();
  for (const control of await dialog.locator('.glass-input').all()) {
    expect(await control.evaluate(el => getComputedStyle(el).backdropFilter)).toBe('none');
  }
  await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByTestId('button-calculator').click();
  await page.getByRole("tab", { name: "Macros", exact: true }).click();
  await expect(page.getByTestId('fitness-calculator-page').getByLabel('Carbs %', { exact: true })).toHaveValue('35');
});
