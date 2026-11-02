import { test, expect } from '@playwright/test';
import { selectDisplayAppearance } from '../fixtures/display-appearance';
test.use({ viewport: { width: 390, height: 844 } });
test('Reminders add action follows explicit and System appearance without layout changes', async ({ page }) => {
  let geometry: unknown;
  for (const preference of ['Light', 'Dark', 'System']) {
    await page.goto('display'); await page.emulateMedia({colorScheme:'light'});
    await selectDisplayAppearance(page, preference); await page.goto('reminders'); await page.mouse.move(0,0);
    const add = page.getByRole('button', {name:'New Reminder',exact:true});
    const dark = preference === 'Dark';
    await expect(add).toHaveCSS('background-color',dark ? 'rgb(74, 222, 128)' : 'rgb(21, 128, 61)');
    await expect(add.locator('svg')).toHaveCSS('color',dark ? 'rgb(2, 6, 23)' : 'rgb(255, 255, 255)');
    const current = await add.evaluate(el => { const r=el.getBoundingClientRect(),s=getComputedStyle(el); return {x:r.x,y:r.y,width:r.width,height:r.height,radius:s.borderRadius}; });
    expect(await add.evaluate(el => getComputedStyle(el).boxShadow)).toContain(dark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(15, 23, 42, 0.12)');
    if (!geometry) geometry=current; else expect(current).toEqual(geometry);
    if (preference === 'System') {
      await page.emulateMedia({colorScheme:'dark'}); await expect(add).toHaveCSS('background-color','rgb(74, 222, 128)');
      await page.emulateMedia({colorScheme:'light'}); await expect(add).toHaveCSS('background-color','rgb(21, 128, 61)');
    }
  }
  await page.getByRole('button',{name:'New Reminder',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'New reminder',exact:true})).toBeVisible();
});
