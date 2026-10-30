import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const choose = (page: Page, name: string) => page.getByRole('group', { name: 'Appearance', exact: true }).getByText(name, { exact: true }).click();
async function initial(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('fitcircle_appearance')) localStorage.setItem('fitcircle_appearance', 'light');
  });
  await page.goto('display');
  await expect(page.getByRole('heading', { name: 'Display', exact: true })).toBeVisible();
}
const paint = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

test('Display refreshes once after changed preferences, stays put and ignores OS changes', async ({ page }) => {
  let requests = 0;
  page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) requests++; });
  await initial(page); expect(requests).toBe(1);
  for (const [name, preference] of [['Dark', 'dark'], ['Light', 'light'], ['System', 'system']] as const) {
    const count = requests;
    await Promise.all([page.waitForEvent('load'), choose(page, name)]);
    await expect(page).toHaveURL(/\/FitCircle\/display$/);
    await expect(page.getByRole('heading', { name: 'Display', exact: true })).toBeVisible();
    await expect(page.getByRole('radio', { name, exact: true })).toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem('fitcircle_appearance'))).toBe(preference);
    await paint(page); expect(requests).toBe(count + 1);
    await choose(page, name); await paint(page); expect(requests).toBe(count + 1);
  }
  const count = requests;
  await page.emulateMedia({ colorScheme: 'light' }); await expect(page.locator('html')).toHaveAttribute('data-appearance', 'light');
  await page.emulateMedia({ colorScheme: 'dark' }); await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
  await paint(page); expect(requests).toBe(count);
  await expect(page.getByRole('button', { name: 'Refresh FitCircle', exact: true })).toBeEnabled();
});

test('failed appearance save keeps the page and selected preference without refresh', async ({ page }) => {
  await initial(page);
  let requests = 0;
  page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) requests++; });
  await page.evaluate(() => {
    const save = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'fitcircle_appearance') throw new DOMException('Storage unavailable', 'QuotaExceededError');
      return save.call(this, key, value);
    };
  });
  await choose(page, 'Dark');
  await expect(page.getByRole('alert')).toContainText('Appearance preference could not be saved');
  await expect(page.getByRole('radio', { name: 'Light', exact: true })).toBeChecked();
  await paint(page); expect(requests).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('fitcircle_appearance'))).toBe('light');
});

test('appearance reload preserves Display through the actual GitHub Pages 404 redirect', async ({ page }) => {
  await initial(page);
  let fallbackServed = false;
  await page.route('**/FitCircle/display', async route => {
    fallbackServed = true;
    await route.fulfill({ status: 404, contentType: 'text/html', body: fs.readFileSync('client/public/404.html', 'utf8') });
  }, { times: 1 });
  await Promise.all([page.waitForEvent('load'), choose(page, 'Dark')]);
  await expect(page).toHaveURL(/\/FitCircle\/display$/);
  await expect(page.getByRole('heading', { name: 'Display', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  expect(fallbackServed).toBe(true);
});
