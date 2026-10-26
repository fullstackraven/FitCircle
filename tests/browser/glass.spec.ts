import { test, expect } from '@playwright/test';

test('glass dock retains compact geometry, semantic selection and visible keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('wellness');
  const nav = page.getByRole('navigation', { name: 'Bottom navigation' });
  await expect(nav).toHaveClass(/glass-nav/);
  expect((await nav.boundingBox())!.height).toBe(66);
  const logs = nav.getByRole('button', { name: 'Logs', exact: true });
  await expect(logs).toHaveAttribute('aria-current', 'page');
  expect(await logs.locator('svg').evaluate(el => getComputedStyle(el).color)).toBe('rgb(0, 255, 65)');
  expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(30, 41, 59, 0.65)');
  const routines = nav.getByRole('button', { name: 'Routines', exact: true });
  await routines.focus();
  expect(await routines.evaluate(el => getComputedStyle(el).outlineWidth)).toBe('2px');
  await page.keyboard.press('Enter');
  await expect(routines).toHaveAttribute('aria-current', 'page');
  await expect(logs).not.toHaveAttribute('aria-current');
  expect(await routines.locator('svg').evaluate(el => getComputedStyle(el).color)).toBe('rgb(0, 255, 65)');
  await expect.poll(() => logs.locator('svg').evaluate(el => getComputedStyle(el).color)).toBe('rgb(141, 157, 177)');
});

test('glass dialog remains nearly opaque, internally scrollable and safely closable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto('food-tracker');
  await page.goto('profile');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit Profile' });
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

test('slim reference dock keeps five reachable targets, safe-area clearance and unobscured final content', async ({ page }) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('wellness');
    await page.addStyleTag({content:':root { --safe-bottom: 34px; }'});
    const nav = page.getByRole('navigation',{name:'Bottom navigation'});
    await expect(nav.getByRole('button')).toHaveCount(5);
    const bounds = (await nav.boundingBox())!;
    expect(bounds.height).toBe(66);
    expect(bounds.y + bounds.height).toBe(844 - 34 - 4);
    for (const label of ['Home','Calendar','Routines','Logs','Reminders']) {
      const button = nav.getByRole('button',{name:label,exact:true});
      const target = (await button.boundingBox())!;
      expect(target.height).toBeGreaterThanOrEqual(48);
      expect(target.width).toBeGreaterThanOrEqual(44);
      const icon = (await button.locator('svg').boundingBox())!;
      await expect(button.locator('svg')).toHaveCSS('width','19px');
      await expect(button.locator('svg')).toHaveCSS('height','19px');
      expect(icon.width).toBeLessThanOrEqual(34); expect(icon.height).toBeLessThanOrEqual(34); // rotated dumbbell bounds
      const caption = (await button.locator('span').boundingBox())!;
      expect(caption.x).toBeGreaterThanOrEqual(bounds.x);
      expect(caption.x + caption.width).toBeLessThanOrEqual(bounds.x + bounds.width);
    }
    await page.locator('.app-content').evaluate(el => { el.scrollTop = el.scrollHeight; });
    const last = (await page.getByTestId('card-supplements').boundingBox())!;
    expect(last.y + last.height).toBeLessThanOrEqual(bounds.y);
    await page.screenshot({path:`/tmp/refined-dock-${width}.png`});
  }
});
