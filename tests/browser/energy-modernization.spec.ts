import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {textContrast} from '../fixtures/appearance-contrast';
const history={'2026-09-01':10,'2026-10-10':2,'2026-10-22':4,'2026-10-25':8,'2026-10-28':6};
const read=(page:Page)=>page.evaluate(()=>localStorage.getItem('fitcircle_energy_levels'));
async function seed(page:Page,data:Record<string,number>=history,mode='dark'){
 await page.clock.setFixedTime(new Date('2026-10-28T12:00:00Z'));await page.goto('wellness');
 await page.evaluate(({data,mode})=>{localStorage.setItem('fitcircle_energy_levels',JSON.stringify(data));localStorage.setItem('fitcircle_appearance',mode);},{data,mode});await page.goto('energy-level?from=wellness');
}
async function select(page:Page,value:number){await page.getByRole('slider',{name:'Energy level',exact:true}).fill(String(value));}
test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});
test('all direct selections preserve labels and draft-only state; explicit Save and decrement Undo remain compatible',async({page})=>{
 await seed(page);const before=await read(page);await expect(page.getByTestId('energy-save-state')).toHaveText('Saved');
 const labels=['Very Low','Very Low','Low','Low','Moderate','Moderate','High','High','Very High','Very High'];
 for(let value=1;value<=10;value++){await select(page,value);await expect(page.getByTestId('selected-energy')).toHaveText(String(value));await expect(page.getByRole('img',{name:`${value} of 10, ${labels[value-1]}`,exact:true})).toBeVisible();expect(await read(page)).toBe(before);}
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByTestId('selected-energy')).toHaveText('9');expect(await read(page)).toBe(before);
 await page.getByRole('button',{name:'Save Energy',exact:true}).click();await expect(page.getByRole('status')).toContainText('saved successfully');await expect(page.getByTestId('energy-save-state')).toHaveText('Saved');
 const saved=JSON.parse((await read(page))!);expect(saved).toEqual({...history,'2026-10-28':9});await expect(page.getByTestId('energy-today')).toHaveText('9');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByTestId('energy-save-state')).toHaveText('Unsaved changes');expect(JSON.parse((await read(page))!)['2026-10-28']).toBe(9);
 await page.reload();await expect(page.getByTestId('selected-energy')).toHaveText('9');await select(page,1);await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByTestId('selected-energy')).toHaveText('—');await expect(page.getByRole('button',{name:'Save Energy',exact:true})).toBeDisabled();
});
test('statistics and data points follow the selected date range without missing-day zeros',async({page})=>{
 await seed(page);await expect(page.getByTestId('energy-average')).toHaveText('5.0');await expect(page.getByTestId('energy-days')).toHaveText('4');await expect(page.locator('circle[data-energy]')).toHaveCount(4);
 await page.getByRole('button',{name:'7 days',exact:true}).click();await expect(page.getByTestId('energy-average')).toHaveText('6.0');await expect(page.getByTestId('energy-days')).toHaveText('3');await expect(page.locator('circle[data-energy]')).toHaveCount(3);
 await page.getByRole('button',{name:'All time',exact:true}).click();await expect(page.getByTestId('energy-average')).toHaveText('6.0');await expect(page.locator('circle[data-energy]')).toHaveCount(5);
 expect(await page.locator('circle[data-energy="0"]').count()).toBe(0);
});
test('empty state, a single saved point, keyboard selection and failed save remain truthful',async({page})=>{
 await seed(page,{});await expect(page.getByText(/No energy entries yet/)).toBeVisible();await expect(page.getByTestId('energy-average')).toHaveText('—');await expect(page.getByTestId('energy-save-state')).toHaveText('Not saved');
 await page.getByRole('slider').focus();await page.keyboard.press('Home');await expect(page.getByTestId('selected-energy')).toHaveText('1');await page.getByRole('button',{name:'Undo',exact:true}).click();await page.getByRole('slider').focus();await page.keyboard.press('ArrowRight');await expect(page.getByTestId('selected-energy')).toHaveText('2');expect(await read(page)).toBe('{}');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='fitcircle_energy_levels')throw Error('synthetic quota');return original.call(this,key,value);};});
 await page.getByRole('button',{name:'Save Energy',exact:true}).click();await expect(page.getByRole('status')).toContainText('could not be saved');await expect(page.getByTestId('energy-save-state')).not.toHaveText('Saved');
 await seed(page,{'2026-10-25':8});await expect(page.getByTestId('energy-average')).toHaveText('8.0');await expect(page.locator('circle[data-energy]')).toHaveCount(1);await expect(page.getByTestId('energy-today')).toHaveText('—');
});
for(const mode of ['dark','light','system'])test(`mobile ${mode} appearance, saved data and scrolling`,async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await seed(page,history,mode);const before=await read(page);fs.mkdirSync('docs/review/energy-modernization',{recursive:true});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('navigation',{name:'Bottom navigation'})).toHaveCount(0);
  if(mode==='light')expect((await textContrast(page)).failures).toEqual([]);
  await page.locator('.app-content').evaluate(el=>el.scrollTop=0);if(mode!=='system')await page.screenshot({path:`docs/review/energy-modernization/after-${mode}-${width}.png`,animations:'disabled'});
  await page.locator('.energy-card').nth(1).scrollIntoViewIfNeeded();await expect(page.getByTestId('energy-days')).toBeInViewport();if(mode!=='system'&&width===390)await page.screenshot({path:`docs/review/energy-modernization/trends-${mode}-${width}.png`,animations:'disabled'});
 }
 expect(await read(page)).toBe(before);if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-appearance','light');}
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/wellness$/);
});
test('calendar return and historical editing preserve today’s saved energy',async({page})=>{
 await seed(page);await page.goto('energy-level');await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/calendar$/);
 await page.goto('dynamic-overview/2026-10-25');await expect(page.getByRole('slider',{name:'Energy level',exact:true})).toHaveValue('8');await page.getByRole('slider',{name:'Energy level',exact:true}).fill('4');await page.getByRole('button',{name:'Save Energy Level',exact:true}).click();
 expect(JSON.parse((await read(page))!)).toEqual({...history,'2026-10-25':4});await page.goto('energy-level');await expect(page.getByTestId('selected-energy')).toHaveText('6');await expect(page.getByTestId('energy-average')).toHaveText('4.0');
});
