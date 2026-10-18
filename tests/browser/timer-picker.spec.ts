import { test, expect } from '@playwright/test';

test('compact picker supports keyboard, scrolling, cancellation and existing timer controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.clock.install();
  await page.getByTitle('Open Timer').click();
  const dialog = page.getByRole('dialog', { name: 'Timer', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input')).toHaveCount(0);
  await expect(dialog.getByText('Quick Presets')).toHaveCount(0);
  const start = dialog.getByRole('button', { name: 'Start', exact: true });
  await expect(start).toBeDisabled();
  const hours = dialog.getByRole('listbox', { name: 'Hours', exact: true });
  const minutes = dialog.getByRole('listbox', { name: 'Minutes', exact: true });
  const seconds = dialog.getByRole('listbox', { name: 'Seconds', exact: true });
  await hours.press('ArrowDown');
  await minutes.press('ArrowDown'); await minutes.press('ArrowDown');
  await seconds.evaluate(el => { el.scrollTop = 3 * 44; });
  await expect(seconds.getByRole('option', { name: '3 seconds', exact: true })).toHaveAttribute('aria-selected', 'true');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByTitle('Open Timer')).toBeVisible();
  await page.getByTitle('Open Timer').click();
  await expect(hours.getByRole('option', { name: '1 hours', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(minutes.getByRole('option', { name: '2 minutes', exact: true })).toHaveAttribute('aria-selected', 'true');
  await start.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('62:03', { exact: true })).toBeVisible();
  await page.getByTitle('Pause Timer', { exact: true }).click();
  await page.clock.runFor(2100);
  await expect(page.getByText('62:03', { exact: true })).toBeVisible();
  await page.getByTitle('Resume Timer', { exact: true }).click();
  await page.clock.runFor(1100);
  await expect(page.getByText('62:02', { exact: true })).toBeVisible();
  await page.getByTitle('Restart timer from beginning').click();
  await expect(page.getByText('62:03', { exact: true })).toBeVisible();
  await page.getByTitle('Stop timer', { exact: true }).click();
  await page.getByTitle('Open Timer').click();
  await seconds.press('ArrowDown'); await seconds.press('ArrowDown');
  await start.click();
  await page.clock.runFor(2300);
  await expect(page.getByText('Completed!', { exact: true })).toBeVisible();
  await page.getByTitle('Reset Timer', { exact: true }).click();
  await expect(start).toBeDisabled();
});

test('picker remains bounded, centered and keyboard accessible across mobile and desktop sizes', async ({ page }) => {
  for (const size of [
    { width: 320, height: 568, top: 20, bottom: 20 },
    { width: 390, height: 844, top: 59, bottom: 34 },
    { width: 844, height: 390, top: 59, bottom: 34 },
    { width: 1280, height: 900, top: 0, bottom: 0 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('./');
    await page.addStyleTag({ content: `:root { --safe-top: ${size.top}px; --safe-bottom: ${size.bottom}px; }` });
    await page.getByTitle('Open Timer').click();
    const dialog = page.getByRole('dialog', { name: 'Timer', exact: true });
    await dialog.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
    const box = (await dialog.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(size.top);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height - size.bottom);
    expect(await dialog.evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBe(true);
    const selected = await dialog.locator('[role="option"][aria-selected="true"]').all();
    const row = (await dialog.locator('.timer-picker-selection').boundingBox())!;
    for (const option of selected) {
      const bounds = (await option.boundingBox())!;
      expect(bounds.y + bounds.height / 2).toBeCloseTo(row.y + row.height / 2, 0);
    }
    const hours = dialog.getByRole('listbox', { name: 'Hours', exact: true });
    await hours.press('End');
    await expect(hours.getByRole('option', { name: '23 hours', exact: true })).toHaveAttribute('aria-selected', 'true');
    await hours.press('ArrowDown');
    await expect(hours.getByRole('option', { name: '23 hours', exact: true })).toHaveAttribute('aria-selected', 'true');
    await hours.press('Home');
    await hours.press('ArrowUp');
    await expect(hours.getByRole('option', { name: '0 hours', exact: true })).toHaveAttribute('aria-selected', 'true');
    for (const label of ['Minutes', 'Seconds']) {
      const wheel = dialog.getByRole('listbox', { name: label, exact: true });
      await wheel.press('End');
      await expect(wheel.getByRole('option', { name: `59 ${label.toLowerCase()}`, exact: true })).toHaveAttribute('aria-selected', 'true');
    }
    const close = dialog.getByRole('button', { name: 'Close', exact: true });
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await close.click();
    await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).not.toBe('hidden');
  }
});
