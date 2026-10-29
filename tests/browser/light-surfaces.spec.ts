import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York' });
for (const mode of ['light', 'dark']) test(`${mode}: scoped card and editor surface definition`, async ({ page }) => {
  await seedWellnessAppearance(page, mode);
  const before = process.env.SURFACE_REVIEW_BEFORE === '1';
  const capture = async (name: string) => {
    if (mode !== 'light') return;
    await page.evaluate(() => document.fonts.ready);
    const dir = 'docs/review/light-surfaces'; fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: `${dir}/${name}-${before ? 'before' : 'after'}.png`, animations: 'disabled' });
  };
  const contained = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('./');
  const card = page.getByTestId('home-workout-w');
  await expect(card).toBeVisible();
  if (mode === 'light' && !before) await expect(card).toHaveCSS('outline-color', 'rgba(203, 213, 225, 0.7)');
  if (mode === 'dark') await expect(card).toHaveCSS('border-top-width', '0px');
  await contained(); await capture('home');
  await page.getByRole('button', { name: 'Edit Push-ups', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const name = dialog.getByLabel('Workout Name');
  await expect(name).toHaveValue('Push-ups');
  if (mode === 'light' && !before) {
    await expect(name).toHaveCSS('background-color', 'rgb(241, 245, 249)');
    await expect(name).toHaveCSS('border-top-color', 'rgb(203, 213, 225)');
    await expect(dialog.locator('.editor-number-card').first()).toHaveCSS('background-color', 'rgb(241, 245, 249)');
  }
  if (mode === 'dark') {
    await expect(dialog).toHaveCSS('background-color', 'rgb(15, 23, 41)');
    await expect(name).toHaveCSS('background-color', 'rgb(30, 41, 59)');
    await expect(name).toHaveCSS('border-top-width', '0px');
    await expect(dialog.locator('.editor-number-card').first()).toHaveCSS('background-color', 'rgb(30, 41, 59)');
  }
  await capture('workout');
  await name.fill('Unsaved surface check'); await name.focus();
  await expect(name).toHaveCSS('box-shadow', mode === 'light' ? 'rgb(21, 128, 61) 0px 0px 0px 2px inset' : 'rgb(74, 222, 128) 0px 0px 0px 2px inset');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(card).toContainText('Push-ups');
  await page.getByRole('button', { name: 'Add new workout', exact: true }).click();
  await expect(dialog.getByLabel('Workout Name')).toHaveValue('');
  await expect(dialog.getByRole('button', { name: 'Add Workout', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.goto('calendar');
  await expect(page.getByText('Workout Statistics', { exact: true })).toBeVisible();
  if (mode === 'light' && !before) {
    for (const surface of [page.locator('.calendar-date-cell').first(), page.locator('.calendar-statistics-link'), page.getByTestId('recent-activity-panel').locator('.fitcircle-card')]) {
      await expect(surface).toHaveCSS('outline-color', 'rgba(203, 213, 225, 0.7)');
      await expect(surface).toHaveCSS('outline-width', '1px');
    }
  }
  await contained(); await capture('calendar');
  await page.goto('routines');
  await page.getByTestId('button-create-routine').click();
  await expect(dialog.getByLabel('Routine Name')).toBeEditable();
  await dialog.getByLabel('Routine Name').fill('Surface review');
  await dialog.getByRole('button', { name: 'Weekdays', exact: true }).click();
  await expect(dialog).toContainText('5 training days selected');
  await expect(dialog.getByRole('button', { name: 'Create Routine', exact: true })).toBeEnabled();
  await capture('routine');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  const edit = page.locator('[data-testid^="button-edit-routine-"]').first();
  await edit.click(); await expect(dialog.getByLabel('Routine Name')).not.toHaveValue('');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  if (mode === 'light' && !before) {
    await page.evaluate(() => localStorage.setItem('fitcircle_appearance', 'system'));
    await page.emulateMedia({ colorScheme: 'dark' }); await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-appearance', 'light');
    await expect(card).toHaveCSS('outline-color', 'rgba(203, 213, 225, 0.7)');
  }
});
