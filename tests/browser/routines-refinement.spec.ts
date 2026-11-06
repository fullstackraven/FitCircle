import { test, expect, type Page } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';
import { pillGeometry } from '../fixtures/pill-geometry';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
const read = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker-data')!));
async function setup(page: Page, mode = 'light') {
  await seedWellnessAppearance(page, mode);
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('workout-tracker-data')!);
    d.routineSchedulingVersion = 1;
    d.workouts.b = { ...d.workouts.w, id: 'b', name: 'Row', color: 'blue' };
    d.workouts.c = { ...d.workouts.w, id: 'c', name: 'Hold', color: 'purple' };
    const placements = ['w', 'b', 'c'].map(id => ({ id: 'p-' + id, exerciseId: id, prescription: { targetType: 'repetitions', sets: 2, perSet: 10 } }));
    d.routines.r.placements = placements;
    d.routines.other = { ...d.routines.r, id: 'other', name: 'Other routine', placements: [{ ...placements[0], id: 'other-w' }] };
    localStorage.setItem('workout-tracker-data', JSON.stringify(d));
  });
  await page.goto('routines');
}
async function dragMouse(page: Page) {
  const handle = page.getByRole('button', { name: 'Reorder Push-ups', exact: true });
  const target = page.getByTestId('routine-exercise-r-b');
  await handle.scrollIntoViewIfNeeded();
  const a = (await handle.boundingBox())!, b = (await target.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, b.y + b.height - 5, { steps: 12 });
  await expect(page.locator('[data-sortable-row="p-w"]')).toHaveClass(/ring-2/);
  await page.mouse.up();
}
for (const mode of ['light', 'dark']) test(`${mode}: pointer ordering persists, rows edit placement and library-free forms expose fields`, async ({ page }) => {
  await setup(page, mode); const before = await read(page);
  await expect(page.getByRole('heading', { level: 1, name: 'FitCircle', exact: true })).toBeVisible();
  await expect(page.getByText('Exercise Library', { exact: true })).toHaveCount(0);
  await expect(page.locator('summary')).toHaveCount(0);
  await page.getByTestId('routine-header-r').click();
  await page.screenshot({ path: `/tmp/routines-refinement-${mode}.png` });
  await dragMouse(page);
  await expect(page).toHaveURL(/routines$/);
  let d = await read(page); expect(d.routines.r.placements.map((p: any) => p.exerciseId)).toEqual(['b', 'w', 'c']);
  expect(d.routines.other).toEqual(before.routines.other); expect(d.dailyLogs).toEqual(before.dailyLogs); expect(d.workouts).toEqual(before.workouts);
  await page.reload(); await page.getByTestId('routine-header-r').click();
  expect(await page.getByTestId('routine-card-r').locator('[data-sortable-row]').evaluateAll(rows => rows.map(r => r.getAttribute('data-sortable-row')))).toEqual(['p-b', 'p-w', 'p-c']);
  await page.getByTestId('routine-exercise-r-w').getByRole('button').last().click();
  await expect(page).toHaveURL(/workouts\/edit\?id=w.*placement=p-w/);
  await expect(page.getByLabel('Number of Sets')).toHaveValue('2'); await expect(page.getByLabel('Reps per Set', { exact: true })).toHaveValue('10');
  for (const label of ['Equipment', 'Rest between sets (seconds)', 'Instructions / notes', 'Workout color']) await expect(page.getByLabel(label, { exact: true })).toHaveCount(1);
  await expect(page.locator('details')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByTestId('button-edit-routine-r').click();
  await expect(page.getByLabel('Description / notes')).toHaveCount(1); await expect(page.getByLabel('Current variation', { exact: true })).toHaveCount(0);
  await expect(page.locator('summary')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reorder Hold', exact: true }).focus(); await page.keyboard.press('ArrowUp');
  expect((await read(page)).routines.r.placements.map((p: any) => p.exerciseId)).toEqual(['b', 'w', 'c']);
  page.once('dialog', dialog => dialog.dismiss()); await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/routines\/edit/);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await read(page)).routines.r.placements.map((p: any) => p.exerciseId)).toEqual(['b', 'w', 'c']);
  await page.getByTestId('button-edit-routine-r').click();
  await page.getByRole('button', { name: 'Reorder Hold', exact: true }).focus(); await page.keyboard.press('ArrowUp');
  await page.getByRole('button', { name: 'Save Routine', exact: true }).click(); await page.reload();
  expect((await read(page)).routines.r.placements.map((p: any) => p.exerciseId)).toEqual(['b', 'c', 'w']);
  await page.getByTestId('routine-header-r').click(); await page.getByTestId('button-add-workout-r').click();
  await expect(page).toHaveURL(/routines\/exercises\/add/);
  await page.getByRole('button', { name: 'Edit custom exercise Push-ups', exact: true }).click();
  await page.getByLabel('Equipment', { exact: true }).fill('Bands'); await page.getByLabel('Workout color').selectOption('blue');
  await page.getByRole('button', { name: 'Save Exercise', exact: true }).click();
  d = await read(page); expect(d.workouts.w.equipment).toBe('Bands'); expect(d.workouts.w.color).toBe('blue'); expect(d.dailyLogs).toEqual(before.dailyLogs);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(await pillGeometry(page)).toEqual([]);
});

test('touch capture reorders without navigation; canceled gestures keep persisted order', async ({ page, context }) => {
  await setup(page); await page.getByTestId('routine-header-r').click();
  const original = await read(page);
  const cdp = await context.newCDPSession(page);
  const handle = page.getByRole('button', { name: 'Reorder Push-ups', exact: true }); await handle.scrollIntoViewIfNeeded();
  let a = (await handle.boundingBox())!, b = (await page.getByTestId('routine-exercise-r-b').boundingBox())!;
  const x = a.x + a.width / 2, start = a.y + a.height / 2, end = b.y + b.height - 4;
  for (const cancel of [true, false]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] });
    for (let n = 1; n <= 8; n++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * n / 8 }] });
    await expect(page.locator('[data-sortable-row="p-w"]')).toHaveClass(/ring-2/);
    await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
    await expect(page).toHaveURL(/routines$/);
    if (cancel) expect(await read(page)).toEqual(original);
  }
  expect((await read(page)).routines.r.placements.map((p: any) => p.exerciseId)).toEqual(['b', 'w', 'c']);
  await cdp.detach();
});


test('editing a reusable definition from a routine preserves the parent draft and placement identities', async ({ page }) => {
  await setup(page); const before = await read(page);
  await page.getByTestId('button-edit-routine-r').click();
  await page.getByLabel('Routine Name', { exact: true }).fill('Draft routine');
  await page.getByRole('button', { name: 'Add Exercise', exact: true }).click();
  await page.getByRole('button', { name: 'Edit custom exercise Push-ups', exact: true }).click();
  await page.getByLabel('Equipment', { exact: true }).fill('Bodyweight');
  await page.getByRole('button', { name: 'Save Exercise', exact: true }).click();
  await expect(page).toHaveURL(/routines\/exercises\/add/);await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.getByLabel('Routine Name', { exact: true })).toHaveValue('Draft routine');
  await page.getByRole('button', { name: 'Save Routine', exact: true }).click();
  const after = await read(page);
  expect(after.routines.r.placements.map((p:any)=>[p.id,p.exerciseId,p.prescription])).toEqual(before.routines.r.placements.map((p:any)=>[p.id,p.exerciseId,p.prescription]));
  expect(after.routines.r.name).toBe('Draft routine');
  expect(after.workouts.w.equipment).toBe('Bodyweight');
  expect(after.dailyLogs).toEqual(before.dailyLogs);
});
