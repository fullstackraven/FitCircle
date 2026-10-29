import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York' });
const features = [
  ['cardio', 'cardio'], ['fasting', 'fasting'], ['meditation', 'meditation'],
  ['hydration', 'hydration'], ['measurements', 'measurements'], ['food-tracker', 'food-tracker'],
  ['recovery', 'recovery'], ['journal', 'journal-log'], ['energy', 'energy-level'], ['supplements', 'supplements-page'],
];
for (const mode of ['light', 'dark']) test(`${mode}: Logs tiles, navigation and reorder remain usable`, async ({ page }) => {
  await seedWellnessAppearance(page, mode); await page.goto('wellness');
  const tiles = page.locator('.logs-tile'); await expect(tiles).toHaveCount(10);
  const order = await tiles.evaluateAll(elements => elements.map(el => el.getAttribute('data-testid')));
  expect(order).toEqual(features.map(([id]) => `card-${id}`));
  const materials = await tiles.evaluateAll(elements => elements.map(el => {
    const css = getComputedStyle(el), icon = getComputedStyle(el.querySelector('svg')!);
    return { background: css.backgroundColor, border: css.borderColor, width: css.borderTopWidth, radius: css.borderRadius, icon: icon.color, iconWidth: icon.width, label: getComputedStyle(el.querySelector('span')!).color, image: css.backgroundImage, transform: css.transform };
  }));
  for (const material of materials) {
    expect(material).toEqual(materials[0]);
    expect(material.background).toBe(mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(30, 41, 59)');
    expect(material.width).toBe('1px'); expect(material.radius).toBe('16px');
    expect(material.iconWidth).toBe('28px'); expect(material.image).toBe('none'); expect(material.transform).toBe('none');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync('docs/review/logs-tiles', { recursive: true });
  await page.screenshot({ path: `docs/review/logs-tiles/${mode}.png`, animations: 'disabled' });
  const first = page.getByTestId('card-cardio'); await first.focus();
  await expect(first).toHaveCSS('outline-style', 'solid'); await expect(first).toHaveCSS('outline-width', '2px');
  for (const [id, path] of features) {
    await page.getByTestId(`card-${id}`).click();
    await expect(page).toHaveURL(new RegExp(`/${path}\\?from=wellness$`));
    await page.goBack(); await expect(tiles).toHaveCount(10);
  }
  await page.getByTestId('button-edit-layout').click();
  await expect(first).toBeDisabled();
  await page.getByTestId('button-move-right-cardio').click();
  await expect(tiles.first()).toHaveAttribute('data-testid', 'card-fasting');
  await page.getByTestId('button-done-edit').click();
  await page.reload(); await expect(tiles.first()).toHaveAttribute('data-testid', 'card-fasting');
  await expect(page.getByTestId('card-cardio')).toBeEnabled();
  // System resolves through the unchanged appearance provider.
  await page.evaluate(() => localStorage.setItem('fitcircle_appearance', 'system'));
  await page.emulateMedia({ colorScheme: 'light' }); await page.reload();
  await expect(tiles.first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(tiles.first()).toHaveCSS('background-color', 'rgb(30, 41, 59)');
});
