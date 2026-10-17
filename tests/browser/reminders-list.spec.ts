import { test, expect } from '@playwright/test';

const records = [
  { id: 'a', text: 'Synthetic active first', completed: false, createdAt: '2026-01-01T12:00:00Z' },
  { id: 'b', text: 'Synthetic completed', completed: true, createdAt: '2026-01-01T12:01:00Z' },
  { id: 'c', text: 'Synthetic active last', completed: false, createdAt: '2026-01-01T12:02:00Z' },
];
async function seed(page: import('@playwright/test').Page, many = false) {
  await page.goto('profile');
  await page.evaluate(items => {
    localStorage.setItem('fitcircle_reminders', JSON.stringify(items));
    localStorage.setItem('unrelated-synthetic', 'retain');
  }, many ? [...records, ...Array.from({length: 24}, (_, i) => ({id: `long-${i}`, text: `Synthetic long reminder ${i} with enough text to wrap gracefully on small screens`, completed: false, createdAt: '2026-01-01T12:03:00Z'}))] : records);
  await page.goto('reminders');
}

test('completion moves below active reminders, survives reload and supports editing and confirmed clearing', async ({ page }) => {
  await seed(page);
  const list = page.getByRole('list', { name: 'Reminders', exact: true });
  await expect(list.locator('li')).toHaveText(['Synthetic active first', 'Synthetic active last', 'Synthetic completed']);
  await page.getByRole('button', { name: 'Mark complete: Synthetic active first', exact: true }).click();
  await expect(list.locator('li').first()).toContainText('Synthetic active last');
  await expect(page.getByText('2 Completed', {exact:true})).toBeVisible();
  await page.reload();
  await expect(list.locator('li').first()).toContainText('Synthetic active last');
  await page.getByRole('button', { name: 'Mark incomplete: Synthetic active first', exact: true }).click();
  await expect(list.locator('li').first()).toContainText('Synthetic active first');
  await page.getByRole('button', {name: 'Edit Synthetic active first', exact: true}).click();
  await page.getByRole('textbox', {name:'Reminder text',exact:true}).fill('Edited synthetic reminder');
  await page.getByRole('textbox', {name:'Reminder text',exact:true}).press('Tab');
  await expect(page.getByRole('button', {name:'Edit Edited synthetic reminder',exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Clear',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByTestId('reminder-b')).toBeVisible();
  await page.getByRole('button', {name:'Clear',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Clear completed',exact:true}).click();
  await expect(page.getByTestId('reminder-b')).toHaveCount(0);
  await expect(list.locator('li')).toHaveCount(2);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-synthetic'))).toBe('retain');
});

test('floating add remains above dock through long-list scrolling and resizing; new dialog does not focus input', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await seed(page, true);
  await page.addStyleTag({content: ':root { --safe-bottom: 34px; }'});
  const add = page.getByRole('button', {name:'New Reminder',exact:true});
  for (const size of [{width:390,height:844},{width:844,height:390},{width:1280,height:900}]) {
    await page.setViewportSize(size);
    await page.locator('main').evaluate(el => {el.scrollTop=el.scrollHeight;});
    await expect.poll(async () => {
      const a=(await add.boundingBox())!, dock=(await page.locator('.app-dock').boundingBox())!;
      return Math.abs(a.y+a.height+12-dock.y);
    }).toBeLessThan(1);
    const a=(await add.boundingBox())!;
    expect(a.width).toBe(56); expect(a.height).toBe(56);
    expect(await add.evaluate(el => {const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
    const last=(await page.getByTestId('reminder-b').boundingBox())!;
    expect(last.y+last.height).toBeLessThanOrEqual(a.y);
  }
  await add.click();
  const dialog=page.getByRole('dialog',{name:'New Reminder',exact:true});
  await expect(dialog).toBeVisible();
  const input=dialog.getByRole('textbox',{name:'New reminder',exact:true});
  await expect(input).not.toBeFocused();
  await input.fill('Added synthetic reminder');
  await dialog.getByRole('button',{name:'Add Reminder',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Edit Added synthetic reminder',exact:true})).toBeVisible();
});

test('empty list and completed selection retain add and delete functionality', async ({page}) => {
  await seed(page);
  await page.getByRole('button',{name:'Select completed',exact:true}).click();
  await page.getByRole('button',{name:'Select All',exact:true}).click();
  await page.getByRole('button',{name:'Delete Selected (1)',exact:true}).click();
  for (const text of ['Synthetic active first','Synthetic active last']) {
    await page.getByRole('button',{name:`Options for ${text}`,exact:true}).click();
    await page.getByRole('button',{name:'Delete',exact:true}).click();
  }
  await expect(page.getByText('No Reminders',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Clear',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'New Reminder',exact:true})).toBeVisible();
});
