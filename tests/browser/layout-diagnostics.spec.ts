import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function start(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const module = await import(new URL('/FitCircle/layout-diagnostics.js', location.origin).href);
    module.startViewportDiagnostics();
  });
  const panel = page.locator('[data-viewport-diagnostics]');
  await panel.locator(':scope > summary').click();
  return panel;
}

test('diagnostics do not activate with ordinary navigation', async ({ page }) => {
  await page.goto('wellness');
  await page.getByTestId('card-cardio').waitFor();
  await expect(page.locator('[data-viewport-diagnostics]')).toHaveCount(0);
  expect(await page.evaluate(() => 'fitcircleViewportDiagnostics' in window)).toBe(false);
});

async function captureReadyProbe(page: import('@playwright/test').Page) {
  await page.getByTestId('card-supplements').waitFor();
  await expect.poll(() => page.evaluate(() =>
    localStorage.getItem('fitcircle_food_database_migrated') === 'true' &&
    localStorage.getItem('fitcircle_food_database') !== null
  )).toBe(true);
  return page.evaluate(async () => {
    // Loading the probe can yield to pending application initialization. Do it
    // before the snapshots, then measure synchronously without an await.
    const module = await import(new URL('/FitCircle/layout-diagnostics.js', location.origin).href);
    const storageBytes = () => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
    document.documentElement.style.setProperty('--safe-top', '59px');
    document.documentElement.style.setProperty('--safe-bottom', '34px');
    const main = document.querySelector('main')!;
    main.scrollTop = 240;
    const before = { top: main.scrollTop, bottom: main.getBoundingClientRect().bottom, data: storageBytes() };
    const report = module.captureViewportGeometry({ cutoffY: 844 });
    const after = { top: main.scrollTop, bottom: main.getBoundingClientRect().bottom, data: storageBytes() };
    return { report, before, after, remainingProbes: document.querySelectorAll('[data-viewport-probe]').length };
  });
}

test('read-only probe reports all viewport units, actual env insets and clipping geometry', async ({ page }) => {
  await page.goto('wellness');
  const result = await captureReadyProbe(page);
  expect(result.after).toEqual(result.before);
  expect(result.remainingProbes).toBe(0);
  for (const unit of ['vh', 'dvh', 'svh', 'lvh']) expect(result.report.viewportUnits[unit]).toEqual({ supported: true, height: 844 });
  expect(result.report.innerHeight).toBe(844);
  expect(result.report.outerHeight).toBeGreaterThan(0);
  expect(result.report.visualViewport.width).toBe(390);
  expect(result.report.visualViewport.scale).toBe(1);
  expect(result.report.devicePixelRatio).toBeGreaterThan(0);
  expect(result.report.safeArea.bottom).toBe('0px');
  expect(result.report.appSafeArea.bottom).toBe('34px');
  expect(result.report.elements['.app-header']).not.toBeNull();
  expect(result.report.elements['.app-content'].margin).toHaveProperty('bottom');
  // Compact Logs tiles may have less than 240px of overflow. Verify the actual
  // browser-clamped position instead of assuming a minimum content height.
  expect(result.before.top).toBeGreaterThan(0);
  expect(result.report.elements['.app-content'].scrollTop).toBe(result.before.top);
  expect(result.report.ancestors.at(-1).element).toBe('HTML');
  expect(result.report.cutoffComparison.matchingWithinOneCssPixel).toContain('contentBottom');
  expect(result.report.cutoffComparison.matchingWithinOneCssPixel).toContain('cssDvh');
});

test('read-only probe waits for deliberately delayed food initialization', async ({ page }) => {
  await page.addInitScript(() => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    (window as any).releaseFoodInitialization = release;
    const open = indexedDB.open.bind(indexedDB);
    const success = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess')!;
    indexedDB.open = (...args: Parameters<IDBFactory['open']>) => {
      const request = open(...args);
      if (args[0] === 'FitCircleCustomFoods') {
        Object.defineProperty(request, 'onsuccess', {
          set(handler) {
            success.set!.call(request, function (event: Event) {
              void gate.then(() => handler.call(request, event));
            });
          },
        });
      }
      return request;
    };
  });
  await page.goto('wellness');
  await page.getByTestId('card-supplements').waitFor();
  expect(await page.evaluate(() => localStorage.getItem('fitcircle_food_database_migrated'))).toBeNull();
  let finished = false;
  const pending = captureReadyProbe(page).then(result => { finished = true; return result; });
  // A browser round-trip while the explicit gate is closed; no timed sleeps.
  expect(await page.evaluate(() => localStorage.getItem('fitcircle_food_database'))).toBeNull();
  expect(finished).toBe(false);
  await page.evaluate(() => (window as any).releaseFoodInitialization());
  const result = await pending;
  expect(JSON.parse(result.before.data).fitcircle_food_database_migrated).toBe('true');
  expect(result.after).toEqual(result.before);
  expect(result.report.elements['.app-content'].scrollTop).toBe(result.before.top);
  expect(result.after.bottom).toBe(result.before.bottom);
  expect(result.remainingProbes).toBe(0);
});

test('marking the observed cutoff records coordinates without opening a fitness feature', async ({ page }) => {
  await page.goto('wellness');
  await page.getByTestId('card-cardio').waitFor();
  const panel = await start(page);
  await panel.getByRole('button', { name: 'Mark cutoff', exact: true }).click();
  await page.touchscreen.tap(200, 700);
  await expect(page.locator('[data-viewport-cutoff-picker]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).fitcircleViewportDiagnostics.capture().cutoffComparison.observedCssY)).toBe(700);
  expect(new URL(page.url()).pathname).toBe('/FitCircle/wellness');
  await expect(page.locator('[data-viewport-cutoff-marker]')).toHaveCount(1);
  await page.setViewportSize({ width: 844, height: 390 });
  expect(await page.evaluate(() => (window as any).fitcircleViewportDiagnostics.capture().cutoffComparison.observedCssY)).toBeNull();
  await expect(page.locator('[data-viewport-cutoff-marker]')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator('[data-viewport-cutoff-marker]')).toHaveCount(0);
  expect(await page.evaluate(() => 'fitcircleViewportDiagnostics' in window)).toBe(false);
});

test('cancel and repeated start clean up temporary diagnostic layers', async ({ page }) => {
  await page.goto('wellness');
  await page.getByTestId('card-cardio').waitFor();
  let panel = await start(page);
  await panel.getByRole('button', { name: 'Mark cutoff', exact: true }).click();
  await page.locator('[data-viewport-cutoff-picker]').getByRole('button', { name: 'Cancel', exact: true }).tap();
  await expect(page.locator('[data-viewport-cutoff-picker]')).toHaveCount(0);
  panel = await start(page);
  await expect(page.locator('[data-viewport-diagnostics]')).toHaveCount(1);
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByTestId('card-food-tracker').click();
  await expect(page.getByTestId('button-calculator')).toBeVisible();
});
