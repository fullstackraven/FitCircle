import { test, expect } from '@playwright/test';

test('presentation variants have distinct installation identities and differ in status-bar metadata', async ({ page, request }) => {
  const manifests = [];
  for (const variant of ['standard', 'control']) {
    await page.goto(`viewport-test/${variant}/index.html`);
    await expect(page.locator('body')).toHaveAttribute('data-variant', variant);
    const meta = page.locator('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (variant === 'standard') await expect(meta).toHaveCount(0);
    else await expect(meta).toHaveAttribute('content', 'black-translucent');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
    const manifest = await (await request.get(`viewport-test/${variant}/manifest.json`)).json();
    expect(manifest.start_url).toBe(`/FitCircle/viewport-test/${variant}/index.html`);
    expect(manifest.scope).toBe(`/FitCircle/viewport-test/${variant}/`);
    expect(manifest.display).toBe('standalone');
    expect(manifest.id).not.toBe('/FitCircle/');
    manifests.push(manifest);
  }
  expect(manifests[0].id).not.toBe(manifests[1].id);
});

test('installed root worker serves diagnostic HTML without the SPA fallback or fitness data access', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const snapshot = async () => {
    // Storage enumeration order can differ across tabs. Compare canonical bytes,
    // and keep large synthetic food records out of assertion failure output.
    const entries = Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(entries)));
    return { storageHash: Array.from(new Uint8Array(digest)), databases: (await indexedDB.databases()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')) };
  };
  const before = await page.evaluate(snapshot);
  // Any accidental read/write by a diagnostic script fails visibly. These APIs
  // are same-origin resources even with distinct manifest IDs, not sandboxes.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Test must not access localStorage'); } });
    Object.defineProperty(window, 'indexedDB', { get() { throw new Error('Test must not access IndexedDB'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.context().setOffline(true);
  for (const variant of ['standard', 'control']) {
    await page.goto(`viewport-test/${variant}/index.html`);
    await expect(page.locator('body')).toHaveAttribute('data-variant', variant);
    await expect(page.locator('#report')).toContainText(`"variant": "${variant}"`);
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Home tapped (1 total)' })).toBeVisible();
    expect(await page.locator('script').evaluateAll(nodes => nodes.map(n => n.getAttribute('src')))).toEqual(['../test.js']);
  }
  expect(errors).toEqual([]);
  // Inspect through a separate tab without the API traps; no application code
  // runs there and changes the storage snapshot between comparisons.
  const inspect = await page.context().newPage();
  await inspect.goto('viewport-test/index.html');
  const after = await inspect.evaluate(snapshot);
  expect(after).toEqual(before);
  await inspect.close();
});

test('test dock, last card, viewport recovery and copy fallback work at phone sizes', async ({ page, context }) => {
  await page.setViewportSize({ width: 402, height: 812 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('viewport-test/standard/index.html');
  for (const size of [{ width: 402, height: 812 }, { width: 874, height: 402 }, { width: 402, height: 812 }]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.locator('nav').evaluate(el => el.getBoundingClientRect().bottom)).toBe(size.height - 4);
    await page.locator('main').evaluate(el => { el.scrollTop = el.scrollHeight; });
    const last = await page.locator('#last-card').boundingBox();
    const dock = await page.locator('nav').boundingBox();
    expect(last!.y + last!.height).toBeLessThanOrEqual(dock!.y);
    await page.getByRole('button', { name: 'Home', exact: true }).click();
  }
  await page.locator('main').evaluate(el => { el.scrollTop = 0; });
  await page.getByLabel('Keyboard test').fill('Synthetic input');
  await page.getByLabel('Keyboard test').blur();
  await page.getByRole('button', { name: 'Copy report' }).click();
  const report = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(report.variant).toBe('standard');
  expect(report.testRevision).toBe('centered-dock-v4');
  expect(report.dockControls).toHaveLength(5);
  expect(report.dockControls.every((control: { height: number }) => control.height >= 48)).toBe(true);
  expect(report.bottomControlTaps).toBe(3);
  expect(report.shellBottom).toBe(812);
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Unavailable'); }; });
  await page.getByRole('button', { name: 'Copy report' }).click();
  await expect(page.locator('#copy-status')).toContainText('Select the report text');
  await expect(page.locator('.boundary')).toBeHidden();
  await page.getByRole('button', { name: 'Show cyan boundary' }).click();
  await expect(page.locator('.boundary')).toBeVisible();
  await page.getByRole('button', { name: 'Hide cyan boundary' }).click();
  await expect(page.locator('.boundary')).toBeHidden();
});


test('test dock centers unchanged production icons and labels without changing capsule geometry', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 812 });
  const measure = async () => {
    await page.addStyleTag({ content: ':root { --safe-top: 0px; --safe-bottom: 34px; }' });
    await page.evaluate(() => document.fonts.ready);
    return page.getByRole('navigation', { name: 'Bottom navigation' }).evaluate(nav => {
      const bounds = nav.getBoundingClientRect();
      return {
        height: bounds.height, bottom: bounds.bottom, width: bounds.width,
        paddingBottom: getComputedStyle(nav).paddingBottom,
        buttons: Array.from(nav.querySelectorAll('button')).map(button => {
          const icon = button.querySelector('svg')!;
          const label = button.querySelector('span')!;
          return {
            label: label.textContent, height: button.getBoundingClientRect().height,
            bottom: button.getBoundingClientRect().bottom,
            icon: icon.outerHTML,
            iconHeight: icon.getBoundingClientRect().height,
            labelBottom: label.getBoundingClientRect().bottom,
            font: getComputedStyle(label).fontFamily,
            fontSize: getComputedStyle(label).fontSize,
          };
        }),
      };
    });
  };
  await page.goto('./');
  const production = await measure();
  await page.goto('viewport-test/standard/index.html');
  const synthetic = await measure();
  for (const [index, button] of synthetic.buttons.entries()) {
    const original = production.buttons[index];
    expect(button).toEqual({ ...original, bottom: original.bottom + 13, labelBottom: original.labelBottom + 13 });
    expect(button.bottom - button.height / 2).toBe(synthetic.bottom - synthetic.height / 2);
  }
  expect(synthetic.paddingBottom).toBe('17px');
  expect(synthetic.width).toBe(production.width);
  expect(synthetic.height).toBe(84);
  expect(synthetic.height).toBeLessThan(production.height);
  expect(synthetic.bottom).toBe(808);
  expect(await page.locator('.test-dock').evaluate(el => el.getBoundingClientRect().bottom)).toBe(812);
  expect(await page.locator('.dock-nav').evaluate(el => getComputedStyle(el).borderRadius)).toBe('9999px');
  for (const button of synthetic.buttons) {
    expect(button.bottom).toBeLessThanOrEqual(synthetic.bottom - 18);
    expect(button.labelBottom).toBeLessThanOrEqual(button.bottom);
    await page.getByRole('button', { name: button.label!, exact: true }).click();
    await expect(page.getByRole('button', { name: button.label!, exact: true })).toHaveAttribute('aria-current', 'page');
  }
  expect(new URL(page.url()).pathname).toBe('/FitCircle/viewport-test/standard/index.html');
});
