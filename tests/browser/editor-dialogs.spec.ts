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
  await expect(dialog).toHaveAttribute('data-form-page', /routine|workout/);
  await expect(dialog.getByLabel(/Routine Name|Workout Name/).first()).toBeVisible();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(page.getByRole('button',{name:'Back',exact:true})).toBeVisible();
  const lastField=dialog.locator('input:visible').last();await lastField.scrollIntoViewIfNeeded();
  await expect(lastField).toBeInViewport();
  const action=dialog.locator('.editor-primary');await action.scrollIntoViewIfNeeded();await expect(action).toBeInViewport();
  await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
}

for (const size of [{ name: 'phone', width: 390, height: 600 }, { name: 'small phone', width: 320, height: 568 }, { name: 'landscape', width: 844, height: 390 }, { name: 'desktop', width: 1280, height: 900 }]) {
  test(`${size.name}: add/edit workout and routine keep fields and actions accessible on routed pages`, async ({ page }) => {
    await page.setViewportSize(size);
    await seed(page);
    await page.goto('routines');
    await page.addStyleTag({ content: `:root { --safe-top: 0px; --safe-bottom: ${size.name === 'landscape' ? 21 : size.name === 'desktop' ? 0 : 34}px; }` });
    await page.getByTestId('button-create-routine').click();
    let dialog = page.getByRole('region', { name: 'Create Routine' });
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await dialog.getByLabel('Routine Name').fill('New test routine');
    await dialog.getByRole('button', { name: 'Weekdays', exact: true }).click();
    await assertContained(page, dialog);
    await dialog.getByTestId('button-save-routine').click();
    await expect(dialog).toBeHidden();
    const added = Object.values((await readData(page)).routines).find((r: any) => r.name === 'New test routine') as any;
    expect(added.selectedDays).toEqual([1,2,3,4,5]);
    await page.getByTestId(`button-edit-routine-${added.id}`).click();
    dialog = page.getByRole('region', { name: 'Edit Routine' });
    await dialog.getByLabel('Routine Name').fill('Updated test routine');
    await assertContained(page, dialog);
    await dialog.getByTestId('button-save-routine').click();
    await expect(dialog).toBeHidden();
    await page.getByRole('heading', { name: 'Strength', exact: true }).click();
    await page.getByTestId('button-add-workout-r1').click();
    await page.getByRole('button',{name:'Create New Exercise',exact:true}).click();
    dialog = page.getByRole('region', { name: 'Add Exercise' });
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await dialog.getByLabel('Workout Name').fill('New test exercise');
    await dialog.getByLabel('Reps per Set', { exact: true }).fill('12');
    await dialog.getByLabel('Weight (lbs) - Optional', { exact: true }).fill('25');
    await dialog.getByLabel('Workout color').selectOption('blue');
    await assertContained(page, dialog);
    await dialog.getByRole('button', { name: 'Save Exercise', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByTestId('button-add-workout-r1').click();
    await page.getByRole('button', { name: 'Edit reusable exercise New test exercise', exact: true }).click();
    dialog = page.getByRole('region', { name: 'Edit Exercise' });
    await dialog.getByLabel('Workout Name').fill('Updated test exercise');
    await dialog.getByLabel('Reps per Set', { exact: true }).fill('15');
    if (size.name === 'phone') {
      await page.setViewportSize({ width: 390, height: 430 });
      await expect.poll(() => page.locator('main').evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(430);
      await expect(dialog.getByLabel('Workout Name')).toHaveValue('Updated test exercise');
      await expect(dialog.getByLabel('Weight (lbs) - Optional', { exact: true })).toHaveValue('25');
    }
    await assertContained(page, dialog);
    await dialog.getByRole('button', { name: 'Save Exercise' }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    const data = await readData(page);
    expect(data.routines[added.id].name).toBe('Updated test routine');
    expect(Object.values(data.workouts).some((w: any) => w.name === 'Updated test exercise' && w.dailyGoal === 15 && w.weightLbs === 25 && w.color === 'blue')).toBe(true);
    await expect.poll(() => page.locator('main').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  });
}

test('routine deletion requires confirmation and preserves shared exercises and history',async({page})=>{
 await seed(page);await page.goto('routines');const before=await readData(page);
 await page.getByTestId('button-edit-routine-r1').click();page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Delete Routine',exact:true}).click();expect(await readData(page)).toEqual(before);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete Routine',exact:true}).click();await expect(page.getByTestId('routine-header-r1')).toHaveCount(0);const after=await readData(page);expect(after.workouts.w1).toMatchObject({id:'w1',name:'Existing exercise'});expect(after.dailyLogs).toEqual(before.dailyLogs);expect(after.routines.r2.id).toBe('r2');
});
