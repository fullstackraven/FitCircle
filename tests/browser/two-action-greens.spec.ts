import { test, expect } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';
import { selectDisplayAppearance } from '../fixtures/display-appearance';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York' });
test('two green actions follow Light, Dark and System without changing geometry or behavior', async ({ page }) => {
  await seedWellnessAppearance(page, 'dark');
  const geometry = new Map<string, unknown>();
  const verify = async (route: string, mode: 'light' | 'dark') => {
    await page.goto(route); await page.mouse.move(0, 0);
    const button = route === './' ? page.getByRole('button', { name: 'Start Workout Session', exact: true }) : page.getByTestId('button-create-routine');
    await expect(button).toHaveCSS('background-color', mode === 'light' ? 'rgb(21, 128, 61)' : 'rgb(74, 222, 128)');
    await expect(button).toHaveCSS('color', mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(2, 6, 23)');
    await expect(button.locator('svg')).toHaveCSS('color', mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(2, 6, 23)');
    await expect(button).toHaveCSS('background-image', 'none');
    const size = await button.evaluate(el => { const style = getComputedStyle(el), box = el.getBoundingClientRect(); return { width: box.width, height: box.height, radius: style.borderRadius, padding: style.padding, font: style.fontSize }; });
    if (!geometry.has(route)) geometry.set(route, size); else expect(size).toEqual(geometry.get(route));
  };
  for (const preference of ['Light', 'Dark', 'System', 'Light', 'System', 'Dark']) {
    await page.goto('display');
    await page.emulateMedia({ colorScheme: 'light' });
    await selectDisplayAppearance(page, preference);
    const mode = preference === 'Dark' ? 'dark' : 'light';
    await verify('./', mode); await verify('routines', mode);
    if (preference === 'System') {
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(page.getByTestId('button-create-routine')).toHaveCSS('background-color', 'rgb(74, 222, 128)');
      await verify('./', 'dark');
      await page.emulateMedia({ colorScheme: 'light' });
      await expect(page.getByRole('button', { name: 'Start Workout Session', exact: true })).toHaveCSS('background-color', 'rgb(21, 128, 61)');
    }
  }
  await page.goto('routines'); await page.getByTestId('button-create-routine').click();
  await expect(page.getByRole('dialog', { name: 'New Routine', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.goto('./'); await page.getByRole('button', { name: 'Start Workout Session', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Workout Session', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
});
