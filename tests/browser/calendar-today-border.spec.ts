import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York' });
for (const mode of ['light', 'dark']) test(`${mode}: only today's in-month tile has the inset border`, async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-02T12:00:00-05:00') });
  await page.addInitScript(mode => localStorage.setItem('fitcircle_appearance', mode), mode);
  await page.goto('calendar');
  const today = page.locator('[data-calendar-today="true"]');
  await expect(today).toHaveCount(1); await expect(today.locator('[aria-current="date"]')).toHaveText('2');
  const material = await today.evaluate(el => { const css = getComputedStyle(el, '::after'); return { border: css.borderTopWidth, color: css.borderTopColor, style: css.borderTopStyle, pointer: css.pointerEvents }; });
  expect(material).toEqual({ border: '2px', color: mode === 'light' ? 'rgb(71, 85, 105)' : 'rgb(203, 213, 225)', style: 'solid', pointer: 'none' });
  await expect(today.locator('[aria-current="date"]')).toHaveCSS('color', mode === 'light' ? 'rgb(21, 128, 61)' : 'rgb(0, 255, 65)');
  const other = page.locator('.calendar-date-cell:not([data-calendar-today])');
  expect(await other.evaluateAll(els => els.every(el => getComputedStyle(el, '::after').content === 'none'))).toBe(true);
  const next = page.locator('.calendar-date-cell').filter({ has: page.locator('span', { hasText: /^3$/ }) }).first();
  const boxes = [await today.boundingBox(), await next.boundingBox()];
  expect(boxes[0]!.width).toBe(boxes[1]!.width); expect(boxes[0]!.height).toBe(boxes[1]!.height);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Previous period', exact: true }).click();
  await expect(today).toHaveCount(0);
  await page.getByRole('button', { name: 'Next period', exact: true }).click(); await expect(today).toHaveCount(1);
  await today.click(); await expect(page).toHaveURL(/dynamic-overview\/2026-11-02/);
  await page.goBack(); await expect(today).toHaveCount(1);
});

test('border follows midnight and resolved System appearance without styling adjacent months', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-02T23:59:59-05:00') });
  await page.addInitScript(() => localStorage.setItem('fitcircle_appearance', 'system'));
  await page.emulateMedia({ colorScheme: 'light' }); await page.goto('calendar');
  const today = page.locator('[data-calendar-today="true"]');
  await expect(today.locator('[aria-current="date"]')).toHaveText('2');
  await page.clock.fastForward(2000); await expect(today.locator('[aria-current="date"]')).toHaveText('3');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => today.evaluate(el => getComputedStyle(el, '::after').borderTopColor)).toBe('rgb(203, 213, 225)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => today.evaluate(el => getComputedStyle(el, '::after').borderTopColor)).toBe('rgb(71, 85, 105)');
  await page.clock.setSystemTime(new Date('2026-11-30T23:59:59-05:00')); await page.reload();
  await expect(today.locator('[aria-current="date"]')).toHaveText('30');
  await page.getByRole('button', { name: 'Next period', exact: true }).click();
  await expect(today).toHaveCount(0);
  await expect(page.locator('[aria-current="date"]')).toHaveText('30'); // Adjacent November date in December.
  await page.getByRole('button', { name: 'Previous period', exact: true }).click();
  await page.clock.fastForward(2000); await expect(today).toHaveCount(0);
  await page.getByRole('button', { name: 'Next period', exact: true }).click();
  await expect(today.locator('[aria-current="date"]')).toHaveText('1');
});

test('completion styling does not hide the today border', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-02T12:00:00-05:00') });
  await page.addInitScript(() => {
    localStorage.setItem('workout-tracker-data', JSON.stringify({ workouts: { w: { id:'w', name:'Example', color:'green', count:1, dailyGoal:1 } }, routines:{}, dailyLogs:{'2026-11-02':{w:{count:1,goalAtTime:1}}},journalEntries:{},lastDate:'2026-11-02' }));
  });
  await page.goto('calendar');
  const today = page.locator('[data-calendar-today="true"]');
  await expect(today).toContainText('Workouts complete');
  expect(await today.evaluate(el => getComputedStyle(el, '::after').borderTopWidth)).toBe('2px');
  expect(await today.evaluate(el => el.style.backgroundColor)).not.toBe('');
});
