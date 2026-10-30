import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York' });
const editors = [
  { route: 'cardio', title: 'Cardio Goal', input: '#goalTarget', value: '47', save: 'Save Goal' },
  { route: 'fasting', title: 'Fasting Goal', input: '#goalHours', value: '17', save: 'Save Settings' },
  { route: 'meditation', title: 'Meditation Goal', input: '#goalMinutes', value: '25', save: 'Save Goal' },
  { route: 'hydration', title: 'Hydration Goal', input: '#goal', value: '80', save: 'Save Goal' },
];
for (const mode of ['light', 'dark']) test(`${mode}: four goal editors open, save and close`, async ({ page }) => {
  await seedWellnessAppearance(page, mode);
  for (const editor of editors) {
    await page.goto(editor.route);
    await page.getByRole('button', { name: 'Goal', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: editor.title, exact: true });
    await expect(dialog.locator('h2')).toHaveText(editor.title);
    await expect(dialog.locator('.goal-editor')).toHaveCSS('background-color', mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(15, 23, 41)');
    await expect(dialog.locator(editor.input)).toHaveCSS('font-size', '24px');
    await expect(dialog.locator('.goal-editor-ring')).toHaveCSS('width', '100px');
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    if (editor.route === 'cardio') {
      await dialog.getByRole('button', { name: 'Weekly', exact: true }).click();
      await expect(dialog.getByRole('button', { name: 'Weekly', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await dialog.getByRole('button', { name: 'Miles', exact: true }).click();
      await expect(dialog.getByRole('button', { name: 'Miles', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await dialog.getByRole('button', { name: 'Daily', exact: true }).click();
      await dialog.getByRole('button', { name: 'Minutes', exact: true }).click();
    }
    if (editor.route === 'fasting') await dialog.locator('#maxHours').fill('22');
    await dialog.locator(editor.input).fill(editor.value);
    if (editor.route === 'cardio' || editor.route === 'hydration') {
      await page.evaluate(() => document.fonts.ready);
      fs.mkdirSync('docs/review/goal-editors', { recursive: true });
      await page.screenshot({ path: `docs/review/goal-editors/${editor.route}-${mode}.png`, animations: 'disabled' });
    }
    const save = dialog.getByRole('button', { name: editor.save, exact: true });
    await save.scrollIntoViewIfNeeded(); await expect(save).toBeInViewport(); await save.click(); await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Goal', exact: true }).click();
    await expect(dialog.locator(editor.input)).toHaveValue(editor.value);
    if (editor.route === 'fasting') await expect(dialog.locator('#maxHours')).toHaveValue('22');
    await dialog.getByRole('button', { name: 'Close', exact: true }).click(); await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Goal', exact: true }).click();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialog).toBeHidden();
  }
  await page.evaluate(() => localStorage.setItem('fitcircle_appearance', 'system'));
  await page.emulateMedia({ colorScheme: 'light' }); await page.reload();
  await page.getByRole('button', { name: 'Goal', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
});
