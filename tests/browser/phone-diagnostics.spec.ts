import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('five Version taps open phone diagnostics after closing the sheet without storage changes', async ({ page }) => {
  await page.goto('wellness');
  await page.getByRole('button',{name:'Open Menu'}).click();
  const sheet=page.getByRole('dialog',{name:'Navigation Menu'});
  const version=sheet.getByRole('button',{name:/^Version \d+\./});
  expect((await version.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await version.click();
  await expect(page.locator('[data-viewport-diagnostics]')).toHaveCount(0);
  await expect(sheet).toBeVisible();
  for(let i=0;i<4;i++) await version.click();
  await expect(sheet).toBeHidden();
  const panel=page.locator('[data-viewport-diagnostics]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Screen/viewport difference:');
  expect(await panel.locator('pre').first().textContent()).toContain('\nScreen (oriented):');
  await expect(page.locator('[data-viewport-scroll-boundary]')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.dataset.overlayOpen)).toBeUndefined();
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
  await panel.getByRole('button',{name:'Copy report',exact:true}).click();
  await panel.getByRole('button',{name:'Close',exact:true}).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator('[data-viewport-scroll-boundary]')).toHaveCount(0);
  await expect.poll(()=>page.locator('main').evaluate(el=>getComputedStyle(el).overflowY)).toBe('auto');
});

test('all sidebar entry points support controlled activation and complete dismissal', async ({ page }) => {
  for(const route of ['./','calendar','routines','reminders']) {
    await page.goto(route);
    await page.getByRole('button',{name:'Open Menu'}).click();
    const version=page.getByRole('dialog').getByRole('button',{name:/^Version \d+\./});
    for(let i=0;i<5;i++) await version.click();
    const panel=page.locator('[data-viewport-diagnostics]');
    await expect(panel).toBeVisible();
    await panel.getByRole('button',{name:'Close',exact:true}).click();
    await expect(panel).toHaveCount(0);
  }
});

test('light and dark presentations use one navy theme and retain supported PWA metadata', async ({ page, request }) => {
  const manifest=await (await request.get('manifest.json')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.theme_color).toBe('#0f172a');
  expect(manifest.background_color).toBe('#0f172a');
  for(const colorScheme of ['light','dark'] as const) {
    await page.emulateMedia({colorScheme});await page.goto('wellness');await page.getByTestId('card-cardio').waitFor();
    const theme=page.locator('meta[name="theme-color"]');
    await expect(theme).toHaveAttribute('content','#0f172a');
    await expect(theme).not.toHaveAttribute('media');
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveCount(0);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content',/viewport-fit=cover/);
    for(const selector of ['html','body','#root','.app-shell','.app-header']) expect(await page.locator(selector).evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(15, 23, 42)');
    expect(await page.locator('main').evaluate(el=>el.getBoundingClientRect().bottom)).toBe(844);
  }
});
