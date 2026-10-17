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

test('read-only probe reports all viewport units, actual env insets and clipping geometry', async ({ page }) => {
  await page.goto('wellness');
  await page.getByTestId('card-supplements').waitFor();
  const result = await page.evaluate(async () => {
    document.documentElement.style.setProperty('--safe-top', '59px');
    document.documentElement.style.setProperty('--safe-bottom', '34px');
    const main = document.querySelector('main')!;
    main.scrollTop = 240;
    const before = { top: main.scrollTop, bottom: main.getBoundingClientRect().bottom, data: JSON.stringify(localStorage) };
    const module = await import(new URL('/FitCircle/layout-diagnostics.js', location.origin).href);
    const report = module.captureViewportGeometry({ cutoffY: 844 });
    const after = { top: main.scrollTop, bottom: main.getBoundingClientRect().bottom, data: JSON.stringify(localStorage) };
    return { report, before, after, remainingProbes: document.querySelectorAll('[data-viewport-probe]').length };
  });
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
