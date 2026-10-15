import { test, expect } from '@playwright/test';

test('glass dock retains compact geometry, semantic selection and visible keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('wellness');
  const nav = page.getByRole('navigation', { name: 'Bottom navigation' });
  await expect(nav).toHaveClass(/glass-nav/);
  expect((await nav.boundingBox())!.height).toBe(89);
  const logs = nav.getByRole('button', { name: 'Logs', exact: true });
  await expect(logs).toHaveAttribute('aria-current', 'page');
  const routines = nav.getByRole('button', { name: 'Routines', exact: true });
  await routines.focus();
  expect(await routines.evaluate(el => getComputedStyle(el).outlineWidth)).toBe('2px');
  await page.keyboard.press('Enter');
  await expect(routines).toHaveAttribute('aria-current', 'page');
  await expect(logs).not.toHaveAttribute('aria-current');
});

test('glass dialog remains nearly opaque, internally scrollable and safely closable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto('food-tracker');
  await page.getByTestId('button-calculator').click();
  const dialog = page.getByRole('dialog', { name: 'Fitness Calculator' });
  await expect(dialog).toHaveClass(/glass-dialog/);
  const alpha = await dialog.evaluate(el => {
    const color = getComputedStyle(el).backgroundColor;
    return color.startsWith('rgba') ? Number(color.split(',').at(-1)!.replace(')', '')) : 1;
  });
  expect(alpha).toBeGreaterThanOrEqual(.94);
  await dialog.locator('.dialog-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
  const close = await dialog.getByRole('button', { name: 'Close', exact: true }).boundingBox();
  expect(close!.y).toBeGreaterThanOrEqual(0);
  expect(close!.y + close!.height).toBeLessThanOrEqual(650);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
});

test('reduced motion and transparency produce static opaque materials', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features: [
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'prefers-reduced-transparency', value: 'reduce' },
  ] });
  await page.goto('wellness');
  const nav = page.getByRole('navigation', { name: 'Bottom navigation' });
  expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(30, 41, 59)');
  expect(await nav.evaluate(el => getComputedStyle(el).backdropFilter)).toBe('none');
  expect(await nav.locator('button').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});

test('unsupported backdrop-filter gate retains the opaque navy fallback', async ({ page }) => {
  // Exercise the fallback CSS branch; this is not a claim to run an old engine.
  await page.route('**/*.css', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/@supports[^{]*backdrop-filter[^{]*\{/g, '@supports (fitcircle-unsupported: true){');
    await route.fulfill({ response, body });
  });
  await page.goto('wellness');
  const nav = page.getByRole('navigation', { name: 'Bottom navigation' });
  await expect(nav).toBeVisible();
  expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(30, 41, 59)');
  expect(await nav.evaluate(el => getComputedStyle(el).backdropFilter)).toBe('none');
});
