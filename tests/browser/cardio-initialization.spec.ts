import { test, expect, type Page } from '@playwright/test';
import { cardioKey, cardioGoalKey, cardioLegacyKeys, modernCardio, legacyCardio, malformedCardio } from '../fixtures/cardio-initialization';
async function seed(page: Page, values: Record<string, string>) {
  await page.goto('profile');
  await expect(page.getByRole('heading', { name: 'My Fitness Profile', exact: true })).toBeVisible();
  await page.evaluate(values => { for (const [key, raw] of Object.entries(values)) localStorage.setItem(key, raw); localStorage.setItem('unrelated-synthetic', 'retain'); }, values);
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    const writes: { key: string; raw: string }[] = [];
    Storage.prototype.setItem = function(key, raw) { if (key === 'fitcircle_cardio_data') writes.push({ key, raw }); return original.call(this, key, raw); };
    Object.assign(window, { cardioWrites: writes });
  });
}
async function writes(page: Page) { return page.evaluate(() => (window as unknown as { cardioWrites: unknown[] }).cardioWrites); }
for (const { name, raw } of malformedCardio) {
  test(`cardio ${name} survives navigation and reload without a fallback write`, async ({ page }) => {
    await seed(page, { [cardioKey]: raw });
    await page.goto('cardio');
    await expect(page.getByRole('heading', { name: 'Your saved cardio data needs attention' })).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe(raw);
    expect(await writes(page)).toEqual([]);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Your saved cardio data needs attention' })).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe(raw);
    expect(await writes(page)).toEqual([]);
    expect(await page.evaluate(() => localStorage.getItem('unrelated-synthetic'))).toBe('retain');
  });
}
test('modern cardio data has no transient default write or initialization normalization', async ({ page }) => {
  const raw = JSON.stringify(modernCardio, null, 2);
  await seed(page, { [cardioKey]: raw });
  for (let i = 0; i < 2; i++) {
    await page.goto('cardio');
    await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe(raw);
    expect(await writes(page)).toEqual([]);
  }
});
for (const key of cardioLegacyKeys) for (const wrapper of [false, true]) {
  test(`legacy ${key} ${wrapper ? 'wrapper' : 'array'} stays byte-exact without creating a primary record`, async ({ page }) => {
    const raw = JSON.stringify(wrapper ? { entries: legacyCardio, goal: { type: 'distance', target: 5, period: 'day' } } : legacyCardio);
    await seed(page, { [key]: raw });
    for (let i = 0; i < 2; i++) {
      await page.goto('cardio');
      await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
      expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
      expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBeNull();
      expect(await writes(page)).toEqual([]);
    }
  });
}
test('failed legacy reads preserve source data, disable unavailable download and allow retry', async ({ page }) => {
  const raw = JSON.stringify(legacyCardio);
  await seed(page, { cardio: raw });
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) { if (key === 'cardio' && !sessionStorage.getItem('synthetic-read-enabled')) throw new DOMException('Synthetic read denial', 'SecurityError'); return original.call(this, key); };
    Object.assign(window, { readOriginalCardio: () => original.call(localStorage, 'cardio') });
  });
  await page.goto('cardio');
  await expect(page.getByRole('heading', { name: 'Your saved cardio data needs attention' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download original stored data' })).toBeDisabled();
  expect(await writes(page)).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { readOriginalCardio(): string }).readOriginalCardio())).toBe(raw);
  await page.evaluate(() => sessionStorage.setItem('synthetic-read-enabled', 'yes'));
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Retry loading' }).click()]);
  await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
  expect(await writes(page)).toEqual([]);
});
test('raw cardio recovery download survives browser handoff and complete backup restore', async ({ page }) => {
  const raw = ' {"entries": ';
  await seed(page, { [cardioKey]: raw });
  await page.goto('cardio');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original stored data' }).click();
  const stream = await (await download).createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(JSON.parse(Buffer.concat(chunks).toString())).toEqual({ [cardioKey]: raw });
  await expect(page.getByRole('status')).toContainText('Download requested');
  await expect(page.locator('a[download]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Open Settings to restore a backup' }).click();
  page.on('dialog', dialog => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic-cardio-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ [cardioKey]: modernCardio })) });
  await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
  await page.goto('cardio');
  await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe(JSON.stringify(modernCardio));
});
test('accepted incomplete cardio backup remains blocked and another verified backup can restore operation', async ({ page }) => {
  await seed(page, { [cardioKey]: JSON.stringify(modernCardio) });
  await page.goto('settings');
  page.on('dialog', dialog => dialog.accept());
  const partial = { goal: { type: 'duration', target: 21 } };
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic-incomplete.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ [cardioKey]: partial })) });
  await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
  await page.goto('cardio');
  await expect(page.getByRole('heading', { name: 'Your saved cardio data needs attention' })).toBeVisible();
  await expect(page.locator('body')).toContainText('cardio tracking has not resumed');
  await expect(page.locator('body')).not.toContainText('successfully');
  expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe(JSON.stringify(partial));
  await page.getByRole('link', { name: 'Open Settings to restore a backup' }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic-complete.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ [cardioKey]: modernCardio })) });
  await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
  await page.goto('cardio');
  await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
});
test('quota failures do not replace a valid source during initialization or an explicit edit', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-03-02T12:00:00Z') });
  const raw = JSON.stringify(modernCardio);
  await seed(page, { [cardioKey]: raw });
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, raw) { if (key === 'fitcircle_cardio_data') throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); return original.call(this, key, raw); };
  });
  await page.goto('cardio');
  await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
  await page.getByTestId('button-edit-session-synthetic-run').first().click();
  await page.getByRole('dialog').getByRole('spinbutton').first().fill('26');
  await page.getByRole('button', { name: 'Update Entry', exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe(raw);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe(raw);
});
test('editing a valid cardio session preserves weekly goals, legacy entries and unrelated metadata', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-03-02T12:00:00Z') });
  const value = { ...modernCardio, entries: legacyCardio };
  await seed(page, { [cardioKey]: JSON.stringify(value) });
  await page.goto('cardio');
  await page.getByTestId('button-edit-session-synthetic-run').first().click();
  await page.getByRole('dialog').getByRole('spinbutton').first().fill('26');
  await page.getByRole('button', { name: 'Update Entry', exact: true }).click();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), cardioKey);
  expect(saved.goal).toEqual(value.goal); expect(saved.entries).toEqual(value.entries); expect(saved.extra).toEqual(value.extra);
  expect(saved.dailyLogs['2025-03-02'].sessions[0].duration).toBe(26);
  expect(saved.dailyLogs['2025-03-04']).toEqual(value.dailyLogs['2025-03-04']);
});
test('dormant dashboard widget settings do not cause hidden cardio writes', async ({ page }) => {
  await seed(page, { [cardioKey]: '{', fitcircle_dashboard_widgets: JSON.stringify([{ id: 'cardio-synthetic', type: 'cardio', title: 'Cardio', enabled: true, position: 0, size: 'small' }]) });
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), cardioKey)).toBe('{');
  expect(await writes(page)).toEqual([]);
});

test('editing a legacy alias keeps the source and produces an exportable canonical primary document', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-03-02T12:00:00Z') });
  const raw = JSON.stringify(legacyCardio);
  await seed(page, { cardio: raw });
  await page.goto('cardio');
  await page.getByTestId('button-edit-session-synthetic-old').first().click();
  await page.getByRole('dialog').getByRole('spinbutton').first().fill('13');
  await page.getByRole('button', { name: 'Update Entry', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('cardio'))).toBe(raw);
  await page.goto('settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Complete Backup' }).click();
  const stream = await (await download).createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.localStorage.cardio).toBe(raw);
  expect(JSON.parse(backup.localStorage[cardioKey]).dailyLogs['2025-03-02'].sessions[0].duration).toBe(13);
  page.on('dialog', dialog => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic-roundtrip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByRole('button', { name: 'Add new workout', exact: true })).toBeVisible();
  await page.goto('cardio');
  await expect(page.getByRole('button', { name: 'Log Cardio', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cardio'))).toBe(raw);
});
