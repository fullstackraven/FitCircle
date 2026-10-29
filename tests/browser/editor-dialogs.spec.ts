import { test, expect, type Page, type Locator } from '@playwright/test';

async function seed(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('workout-tracker-data')) return;
    localStorage.setItem('workout-tracker-data', JSON.stringify({
      workouts: { w1: { id: 'w1', name: 'Existing exercise', color: 'green', count: 7, dailyGoal: 10, routineId: 'r1', scheduledDays: [0,1,2,3,4,5,6] } },
      routines: {
        r1: { id: 'r1', name: 'Strength', selectedDays: [0,1,2,3,4,5,6], createdAt: new Date().toISOString() },
        r2: { id: 'r2', name: 'Keep this routine', selectedDays: [1], createdAt: new Date().toISOString() },
      },
      dailyLogs: { '2025-01-02': { w1: { count: 7, goalAtTime: 10 } } },
      journalEntries: {}, lastDate: new Date().toISOString().slice(0,10),
    }));
  });
}
const readData = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker-data')!));

async function assertContained(page: Page, dialog: Locator) {
  await expect(dialog).toHaveClass(/glass-dialog/);
  await expect(dialog.getByLabel(/Routine Name|Workout Name/).first()).toHaveAttribute('placeholder', /e\.g\. Push Day|Workout name/);
  const body = dialog.locator('.dialog-body');
  expect(await body.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await dialog.evaluate(el => el.scrollHeight <= el.clientHeight)).toBe(true);
  const header = dialog.locator('.dialog-header');
  const footer = dialog.locator('.dialog-footer');
  const before = { header: await header.boundingBox(), footer: await footer.boundingBox(), panel: await dialog.boundingBox() };
  await dialog.locator('.dialog-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect(await body.evaluate(el => Math.abs(el.scrollTop - Math.max(0, el.scrollHeight - el.clientHeight)))).toBeLessThanOrEqual(1);
  expect(await header.boundingBox()).toEqual(before.header);
  expect(await footer.boundingBox()).toEqual(before.footer);
  expect(await dialog.boundingBox()).toEqual(before.panel);
  expect(before.footer!.y + before.footer!.height).toBeLessThanOrEqual(before.panel!.y + before.panel!.height);
  expect(before.footer!.y).toBeGreaterThanOrEqual(before.header!.y + before.header!.height);
  const lastField=dialog.locator('input').last();
  await lastField.scrollIntoViewIfNeeded();
  const field=await lastField.boundingBox(), frame=await body.boundingBox();
  expect(field!.y).toBeGreaterThanOrEqual(frame!.y-1);
  expect(field!.y+field!.height).toBeLessThanOrEqual(frame!.y+frame!.height+1);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('hidden');
}

for (const size of [{ name: 'phone', width: 390, height: 600 }, { name: 'small phone', width: 320, height: 568 }, { name: 'landscape', width: 844, height: 390 }, { name: 'desktop', width: 1280, height: 900 }]) {
  test(`${size.name}: add/edit workout and routine keep headers and actions anchored`, async ({ page }) => {
    await page.setViewportSize(size);
    await seed(page);
    await page.goto('routines');
    await page.addStyleTag({ content: `:root { --safe-top: 0px; --safe-bottom: ${size.name === 'landscape' ? 21 : size.name === 'desktop' ? 0 : 34}px; }` });
    await page.getByTestId('button-create-routine').click();
    let dialog = page.getByRole('dialog', { name: 'New Routine' });
    await expect(dialog).toBeFocused();
    await dialog.getByLabel('Routine Name').fill('New test routine');
    await dialog.getByRole('button', { name: 'Weekdays', exact: true }).click();
    await assertContained(page, dialog);
    await dialog.getByTestId('button-save-routine').click();
    await expect(dialog).toBeHidden();
    const added = Object.values((await readData(page)).routines).find((r: any) => r.name === 'New test routine') as any;
    expect(added.selectedDays).toEqual([1,2,3,4,5]);
    await page.getByTestId(`button-edit-routine-${added.id}`).click();
    dialog = page.getByRole('dialog', { name: 'Edit Routine' });
    await dialog.getByLabel('Routine Name').fill('Updated test routine');
    await assertContained(page, dialog);
    await dialog.getByTestId('button-save-routine').click();
    await expect(dialog).toBeHidden();
    await page.getByRole('heading', { name: 'Strength', exact: true }).click();
    await page.getByTestId('button-add-workout-r1').click();
    dialog = page.getByRole('dialog', { name: 'New Workout' });
    await expect(dialog).toBeFocused();
    await dialog.getByLabel('Workout Name').fill('New test exercise');
    await dialog.getByLabel('Total Reps', { exact: true }).fill('12');
    await dialog.getByLabel('Weight (lbs) - Optional', { exact: true }).fill('25');
    await dialog.getByLabel('Workout color').selectOption('blue');
    await assertContained(page, dialog);
    await dialog.getByRole('button', { name: 'Add Workout', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByText('Edit Workouts', { exact: true }).click();
    await page.getByRole('button', { name: 'Edit workout New test exercise', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Edit Workout' });
    await dialog.getByLabel('Workout Name').fill('Updated test exercise');
    await dialog.getByLabel('Total Reps', { exact: true }).fill('15');
    if (size.name === 'phone') {
      await page.setViewportSize({ width: 390, height: 430 });
      await expect.poll(() => page.locator('.overlay-frame').evaluate(el => el.getBoundingClientRect().height)).toBe(430);
      await expect(dialog.getByLabel('Workout Name')).toHaveValue('Updated test exercise');
      await expect(dialog.getByLabel('Weight (lbs) - Optional', { exact: true })).toHaveValue('25');
    }
    await assertContained(page, dialog);
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    const data = await readData(page);
    expect(data.routines[added.id].name).toBe('Updated test routine');
    expect(Object.values(data.workouts).some((w: any) => w.name === 'Updated test exercise' && w.dailyGoal === 15 && w.weightLbs === 25 && w.color === 'blue')).toBe(true);
    await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  });
}

test('routine trash requires explicit confirmation; cancellation and deletion preserve workouts/history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await seed(page);
  await page.goto('routines');
  const trigger = page.getByRole('button', { name: 'Delete routine Strength', exact: true });
  await expect(trigger.locator('svg')).toHaveClass(/lucide-trash/);
  const before = await readData(page);
  for (const dismiss of ['Cancel', 'Escape', 'Close', 'Backdrop']) {
    await trigger.click();
    const confirmation = page.getByRole('alertdialog', { name: 'Delete routine?' });
    await expect(confirmation).toHaveClass(/glass-dialog/);
    await expect(confirmation).toContainText('Strength');
    await expect(confirmation.getByRole('button', { name: 'Cancel' })).toBeFocused();
    expect(await readData(page)).toEqual(before);
    if (dismiss === 'Escape') await page.keyboard.press('Escape');
    else if (dismiss === 'Backdrop') await page.mouse.click(4, 4);
    else await confirmation.getByRole('button', { name: dismiss, exact: true }).click();
    await expect(confirmation).toBeHidden();
    expect(await readData(page)).toEqual(before);
    await expect(trigger).toBeFocused();
  }
  await trigger.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete routine', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeHidden();
  await expect(page.getByTestId('routine-header-r1')).toHaveCount(0);
  await page.reload();
  const after = await readData(page);
  expect(after.routines.r1).toBeUndefined();
  expect(after.routines.r2).toEqual(before.routines.r2);
  expect(after.workouts.w1).toEqual({ ...before.workouts.w1, routineId: undefined });
  expect(after.dailyLogs).toEqual(before.dailyLogs);
  await page.getByRole('button', { name: 'Delete routine Keep this routine', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete routine', exact: true }).click();
  await expect(page.getByTestId('button-add-routine')).toBeFocused();
  expect((await readData(page)).workouts).toEqual(after.workouts);
  expect((await readData(page)).dailyLogs).toEqual(before.dailyLogs);
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
});
