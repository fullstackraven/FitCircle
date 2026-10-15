import { test, expect, type Page } from '@playwright/test';

// These are Chromium layout regressions with simulated safe areas and a
// deliberately different visual viewport, not physical iPhone/PWA verification.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.setProperty('--safe-top', '59px');
      document.documentElement.style.setProperty('--safe-bottom', '34px');
    });
    const routines = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`r${i}`, {
      id: `r${i}`, name: `Boundary routine ${i}`, selectedDays: [0, 1, 2, 3, 4, 5, 6], createdAt: new Date().toISOString(),
    }]));
    localStorage.setItem('workout-tracker-data', JSON.stringify({ workouts: {}, routines, dailyLogs: {}, journalEntries: {} }));
  });
});

async function setVisualViewport(page: Page, height: number, top: number) {
  await page.evaluate(({ height, top }) => {
    Object.defineProperties(window.visualViewport!, {
      height: { value: height, configurable: true },
      offsetTop: { value: top, configurable: true },
    });
    window.visualViewport!.dispatchEvent(new Event('resize'));
  }, { height, top });
  // Wait for the hook's coalesced frame and subsequent layout.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function assertFullScrollViewport(page: Page, height: number) {
  const shell = await page.locator('.app-shell').boundingBox();
  const main = await page.locator('main').boundingBox();
  expect(shell!.y).toBe(0);
  expect(shell!.height).toBe(height);
  expect(main!.y + main!.height).toBe(height);
}

test('non-scrolling header and safe-area background continuously cover Logs content', async ({ page }) => {
  await page.goto('wellness');
  await page.getByTestId('card-cardio').waitFor();
  for (const scrollTop of [80, 160, 260, 400]) {
    await page.locator('main').evaluate((el, top) => { el.scrollTop = top; }, scrollTop);
    const regions = await page.evaluate(() => {
      const main = document.querySelector('main')!.getBoundingClientRect();
      const header = document.querySelector('.fitcircle-fixed-header')!;
      const bounds = header.getBoundingClientRect();
      // Hit-test every CSS pixel through the safe area and header. Scrolling
      // tiles must never be the painted/hit-tested layer in this top region.
      const uncovered = [];
      for (let y = 1; y < Math.floor(bounds.bottom); y++) {
        const hit = document.elementFromPoint(195, y);
        const cover = hit?.closest('.fitcircle-fixed-header, .app-header');
        if (!cover || (cover.classList.contains('app-header') && hit !== cover) || getComputedStyle(cover).backgroundColor === 'rgba(0, 0, 0, 0)') uncovered.push(y);
      }
      return { mainTop: main.top, headerTop: bounds.top, uncovered };
    });
    expect(regions.headerTop).toBe(59);
    expect(regions.mainTop).toBe(131);
    expect(await page.locator('.app-content .fitcircle-fixed-header').count()).toBe(0);
    expect(regions.uncovered).toEqual([]);
  }
});

test('short visual viewport does not cut off the main scroller beneath the floating dock', async ({ page }) => {
  await page.goto('wellness');
  await page.getByTestId('card-supplements').waitFor();
  await setVisualViewport(page, 710, 20);
  await assertFullScrollViewport(page, 844);
  const dock = await page.locator('.app-dock').boundingBox();
  expect(dock!.y + dock!.height).toBe(844);
  const tile = page.getByTestId('card-supplements');
  // Put a real tile behind the floating dock and across the viewport bottom.
  // Its intersection must stop at the screen edge, not an earlier scroll clip.
  await tile.evaluate(el => {
    const main = document.querySelector('main')!;
    main.scrollTop += el.getBoundingClientRect().top - (window.innerHeight - 80);
  });
  const intersectionBottom = await tile.evaluate(el => new Promise<number>(resolve => {
    const observer = new IntersectionObserver(([entry]) => { observer.disconnect(); resolve(entry.intersectionRect.bottom); });
    observer.observe(el);
  }));
  expect(intersectionBottom).toBe(844);
  await page.locator('main').evaluate(el => { el.scrollTop = el.scrollHeight; });
  const last = await tile.boundingBox();
  expect(last!.y + last!.height).toBeLessThanOrEqual(dock!.y);
  await page.getByRole('button', { name: 'Routines', exact: true }).click();
  await page.getByTestId('routine-header-r7').waitFor();
  await page.locator('main').evaluate(el => { el.scrollTop = el.scrollHeight; });
  const card = await page.getByTestId('routine-header-r7').locator('..').boundingBox();
  expect(card!.y + card!.height).toBeLessThanOrEqual((await page.locator('.app-dock').boundingBox())!.y);
  await assertFullScrollViewport(page, 844);
});

test('normal viewport changes keep full shell geometry while overlays use keyboard bounds', async ({ page }) => {
  await page.goto('wellness');
  await page.getByTestId('card-cardio').waitFor();
  await setVisualViewport(page, 710, 20);
  await page.getByRole('button', { name: 'Open Menu' }).click();
  const sheet = page.getByRole('dialog', { name: 'Navigation Menu' });
  await sheet.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  const sheetClose = await sheet.getByRole('button', { name: 'Close', exact: true }).boundingBox();
  expect(sheetClose!.y).toBeGreaterThanOrEqual(79);
  expect(sheetClose!.y + sheetClose!.height).toBeLessThanOrEqual(696);
  await sheet.getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('food-tracker');
  await page.getByTestId('button-calculator').click();
  const dialog = page.getByRole('dialog', { name: 'Fitness Calculator' });
  await dialog.getByRole('button', { name: 'Tailored', exact: true }).click();
  await setVisualViewport(page, 710, 20);
  const input = dialog.locator('input').first();
  await input.fill('35');
  // Focusing a field alone must not interpret an existing standalone viewport
  // discrepancy as a newly opened keyboard.
  await assertFullScrollViewport(page, 844);
  await setVisualViewport(page, 430, 100);
  await expect.poll(() => page.locator('.app-shell').evaluate(el => el.getBoundingClientRect().height)).toBe(430);
  const close = await dialog.getByRole('button', { name: 'Close', exact: true }).boundingBox();
  expect(close!.y).toBeGreaterThanOrEqual(159);
  expect(close!.y + close!.height).toBeLessThanOrEqual(496);
  await expect(input).toHaveValue('35');
  await input.blur();
  await setVisualViewport(page, 710, 20);
  await assertFullScrollViewport(page, 844);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  await page.setViewportSize({ width: 844, height: 390 });
  await setVisualViewport(page, 300, 10);
  await assertFullScrollViewport(page, 390);
});


test('all shared headers are outside the unpadded scroll surface', async ({ page }) => {
  for (const route of ['./', 'wellness', 'routines', 'calendar', 'reminders']) {
    await page.goto(route);
    const header = page.locator('.app-header .fitcircle-fixed-header');
    await expect(header).toBeVisible();
    const before = await header.boundingBox();
    const geometry = await page.locator('main').evaluate(el => {
      const style = getComputedStyle(el);
      el.scrollTop = el.scrollHeight;
      return {
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
        headerInside: !!el.querySelector('.fitcircle-fixed-header'),
        bottom: el.getBoundingClientRect().bottom,
      };
    });
    expect(geometry.padding).toEqual(['0px', '0px', '0px', '0px']);
    expect(geometry.headerInside).toBe(false);
    expect(geometry.bottom).toBe(844);
    expect(await header.boundingBox()).toEqual(before);
  }
});
