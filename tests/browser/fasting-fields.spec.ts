import { test, expect } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

for (const mode of ['light', 'dark', 'system']) for (const width of [320, 390]) {
  test(`${mode} ${width}: fasting has no timeline and native fields fit Add/Edit margins`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await seedWellnessAppearance(page, mode);
    await page.goto('fasting');
    await expect(page.getByRole('heading', { name: 'Fasting timeline', exact: true })).toHaveCount(0);
    await expect(page.getByText('Not started', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'History', exact: true })).toBeVisible();
    for (const route of ['fasting/add', 'fasting/edit?id=fast']) {
      await page.goto(route);
      const form = page.locator('[data-form-page]');
      const inputs = form.locator('input[type=date], input[type=time]');
      await expect(inputs).toHaveCount(4);
      const dates = form.locator('input[type=date]'), times = form.locator('input[type=time]');
      if (route.includes('edit')) {
        await expect(dates.first()).toHaveValue('2026-10-18');
        await expect(times.first()).toHaveValue('18:00');
      }
      await dates.first().fill('2026-10-18'); await times.first().fill('18:00');
      await dates.last().fill('2026-10-19'); await times.last().fill('11:00');
      for (const height of [844, 430]) {
        await page.setViewportSize({ width, height });
        const content = (await form.locator('.form-page-content').boundingBox())!;
        for (const input of await inputs.all()) {
          await input.scrollIntoViewIfNeeded();
          await input.focus();
          const box = (await input.boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(content.x);
          expect(box.x + box.width).toBeLessThanOrEqual(content.x + content.width + 1);
          await expect(input).toBeInViewport();
          await expect(input).toHaveCSS('appearance', 'none');
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      }
      await expect(dates.first()).toHaveValue('2026-10-18');
      await expect(times.last()).toHaveValue('11:00');
      await form.getByRole('button', { name: /^(Log Fast|Update Fast)$/ }).click();
      await expect(page).toHaveURL(/fasting$/);
      const records = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcircle_fasting_logs')!));
      expect(records.some((record: any) => record.startDate === '2026-10-18' && record.endTime === '11:00' && record.duration === 1020)).toBe(true);
    }
  });
}
