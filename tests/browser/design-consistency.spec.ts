import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { textContrast } from '../fixtures/appearance-contrast';
import { visualRoutes } from '../fixtures/visual-routes';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

const representative = new Set(['/', '/food-tracker', '/hydration', '/energy-level', '/recovery', '/display', '/measurements', '/about']);
test.use({ timezoneId: 'America/New_York' });
for (const mode of ['dark', 'light']) for (const width of [320, 390]) {
  test(`every route: ${mode} at ${width}px`, async ({ page }, info) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width, height: 844 });
    await seedWellnessAppearance(page, mode);
    const results: unknown[] = [];
    for (const [route, label] of visualRoutes) {
      await page.goto(route === '/' ? './' : route.slice(1));
      await expect(page.locator('h1').first(), label).toBeAttached();
      await expect(page.locator('#fitcircle-startup')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector('.app-content')!;
        const rect = main.getBoundingClientRect();
        return {
          viewportOverflow: root.scrollWidth > innerWidth,
          contentOverflow: main.scrollWidth > main.clientWidth + 1,
          bounds: { top: rect.top, bottom: rect.bottom },
          unnamedButtons: [...document.querySelectorAll<HTMLButtonElement>('button')].filter(el => el.checkVisibility() && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.title && !el.textContent?.trim()).map(el => ({className:el.className, testId:el.dataset.testid, html:el.outerHTML.slice(0,220)})),
          sharedHeaders: [...document.querySelectorAll<HTMLElement>('.fc-page-header')].map(el => {
            const button=el.querySelector('button')!, box=el.getBoundingClientRect(), target=button.getBoundingClientRect();
            return {height:box.height, font:getComputedStyle(el.querySelector('h1')!).fontSize, targetWidth:target.width, targetHeight:target.height, leftDifference:Math.abs(target.left-box.left-parseFloat(getComputedStyle(el).paddingLeft))};
          }),
          header: [...document.querySelectorAll('h1')].map(el => ({ text: el.textContent, font: getComputedStyle(el).fontSize })),
          protruding: [...main.querySelectorAll<HTMLElement>('*')].filter(el => {
            const r = el.getBoundingClientRect(), style = getComputedStyle(el);
            return r.width > 0 && style.position !== 'absolute' && style.position !== 'fixed' && r.right > innerWidth + 1 && !el.closest('[aria-hidden=true]');
          }).slice(0, 8).map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 45), className: el.className })),
        };
      });
      const contrast = await textContrast(page);
      results.push({ route, label, ...layout, contrastFailures: contrast.failures });
      {
        for(const header of layout.sharedHeaders) {
          expect.soft(header.height, `${label}: header row`).toBeGreaterThanOrEqual(56);
          expect.soft(header.font, `${label}: page-title size`).toBe('20px');
          expect.soft(header.targetWidth, `${label}: back target width`).toBeGreaterThanOrEqual(44);
          expect.soft(header.targetHeight, `${label}: back target height`).toBeGreaterThanOrEqual(44);
          expect.soft(header.leftDifference, `${label}: back icon alignment`).toBeLessThanOrEqual(1);
        }
        expect.soft(contrast.failures, `${label}: text contrast`).toEqual([]);
        expect.soft(layout.unnamedButtons, `${label}: icon actions need names`).toEqual([]);
        expect.soft(layout.viewportOverflow, `${label}: document overflow`).toBe(false);
        expect.soft(layout.contentOverflow, `${label}: scroll surface overflow`).toBe(false);
        expect.soft(layout.bounds.top, `${label}: safe top`).toBeGreaterThanOrEqual(0);
        expect.soft(layout.bounds.bottom, `${label}: bottom viewport`).toBeLessThanOrEqual(844);
      }
      if (representative.has(route)) {
        const dir = `docs/review/design-consistency/after/${mode}-${width}`;
        fs.mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: `${dir}/${route === '/' ? 'home' : route.slice(1)}.png`, animations: 'disabled' });
      }
    }
    fs.writeFileSync(info.outputPath('route-layout.json'), JSON.stringify(results, null, 2));
    await info.attach('route-layout', { path: info.outputPath('route-layout.json'), contentType: 'application/json' });
  });
}

for (const mode of ['dark', 'light']) for (const width of [320, 390]) {
  test(`overlay chrome: ${mode} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await seedWellnessAppearance(page, mode);
    const dir = `docs/review/design-consistency/after/overlays/${mode}-${width}`;
    fs.mkdirSync(dir, { recursive: true });
    const inspect = async (name: string, role: 'dialog' | 'alertdialog' = 'dialog') => {
      const panel = page.getByRole(role).last();
      await expect(panel).toBeVisible();
      await panel.evaluate(el => el.getAnimations({subtree:true}).filter(animation => animation.effect?.getTiming().iterations !== Infinity).forEach(animation => animation.finish()));
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect((await textContrast(page)).failures, `${name}: text contrast`).toEqual([]);
      await page.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled' });
    };
    await page.goto('./');
    await page.getByRole('button', { name: 'Edit Push-ups', exact: true }).click();
    await inspect('workout-editor');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open Timer', exact: true }).click();
    await inspect('timer');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open Menu', exact: true }).click();
    await inspect('dashboard-sheet');
    await page.keyboard.press('Escape');
    await page.goto('routines');
    const before = await page.evaluate(() => localStorage.getItem('workout-tracker-data'));
    await page.getByRole('button', { name: 'Delete routine PUSH', exact: true }).click();
    await inspect('confirmation', 'alertdialog');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await page.evaluate(() => localStorage.getItem('workout-tracker-data'))).toBe(before);
    await page.goto('supplements-page');
    await page.getByRole('button', { name: 'Add Supplement', exact: true }).click();
    await page.getByRole('combobox').click();
    const option = page.getByRole('option', { name: 'Pills/Capsules', exact: true });
    await expect(option).toBeVisible();
    await page.screenshot({ path: `${dir}/nested-select.png`, animations: 'disabled' });
    await option.click();
    await expect(page.getByRole('combobox')).toContainText('Pills/Capsules');
    await page.keyboard.press('Escape');
  });
}

test('contrast audit measures gradient stops instead of the fallback canvas', async ({ page }) => {
  await page.setContent(`<div class="app-shell" style="background:white">
    <p style="color:black;background:linear-gradient(90deg,#22c55e,#4ade80)">Readable green action</p>
    <p style="color:white;background-color:black;background-image:linear-gradient(90deg,white,white)">Unreadable white gradient</p>
  </div>`);
  const contrast = await textContrast(page);
  expect(contrast.readings.find(row => row.text === 'Readable green action')!.ratio).toBeGreaterThanOrEqual(4.5);
  expect(contrast.failures).toEqual([{ text:'Unreadable white gradient', ratio:1, required:4.5 }]);
});
