import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {textContrast} from '../fixtures/appearance-contrast';
const review='docs/review/supplements-modernization';
const records=[['Vitamin D3',2,'pills'],['Fish Oil',2,'pills'],['Multi',1,'pills'],['Protein Shake',3,'scoops'],['B-complex',1,'pills'],['Creatine',20,'g'],['Fiber',12,'g'],['Zinc',25,'mg']].map(([name,amount,measurementType],i)=>({id:i+1,name,amount,measurementType,createdAt:'2026-01-01T12:00:00Z'}));
const readLogs=(page:Page)=>page.evaluate(()=>localStorage.getItem('fitcircle_supplement_logs'));
async function seed(page:Page,mode='dark'){
 await page.clock.setFixedTime(new Date('2026-10-28T12:00:00Z'));await page.goto('wellness');
 await page.evaluate(({records,mode})=>{localStorage.setItem('fitcircle_supplements',JSON.stringify(records));localStorage.setItem('fitcircle_supplement_logs',JSON.stringify({'2026-10-28':{'1':true},'2026-09-17':{'2':true}}));localStorage.setItem('fitcircle_appearance',mode);}, {records,mode});
 await page.goto('supplements-page?from=wellness');
}
test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});
test('rows show saved dosages, update progress immediately, and write only on explicit save',async({page})=>{
 await seed(page);const before=await readLogs(page);await expect(page.getByTestId('supplement-completion')).toHaveText('1/8');
 for(const r of records)await expect(page.getByRole('checkbox',{name:String(r.name),exact:true})).toContainText(`${r.amount} ${r.measurementType}`);
 const fish=page.getByRole('checkbox',{name:'Fish Oil',exact:true});await fish.click();await expect(fish).toBeChecked();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','2');expect(await readLogs(page)).toBe(before);
 await fish.focus();await page.keyboard.press('Space');await expect(fish).not.toBeChecked();await page.keyboard.press('Space');await expect(fish).toBeChecked();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:"Save Today's Log",exact:true}).click();
 const after=JSON.parse((await readLogs(page))!);expect(after['2026-09-17']).toEqual({'2':true});expect(after['2026-10-28']['1']).toBe(true);expect(after['2026-10-28']['2']).toBe(true);
 await page.reload();await expect(fish).toBeChecked();await expect(page.getByTestId('supplement-completion')).toHaveText('2/8');
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/wellness$/);
});
test('management keeps the same add form, edit behavior and deletion confirmation',async({page})=>{
 await seed(page);await page.getByRole('button',{name:'Manage Supplements',exact:true}).click();
 await page.getByRole('button',{name:'Edit Vitamin D3',exact:true}).click();await page.getByLabel('Supplement name',{exact:true}).fill('Vitamin D renamed');await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Save',exact:true}).click()]);
 await expect(page.getByRole('checkbox',{name:'Vitamin D renamed',exact:true})).toContainText('2 pills');
 await page.getByRole('button',{name:'Manage Supplements',exact:true}).click();
 const before=await page.evaluate(()=>localStorage.getItem('fitcircle_supplements'));
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Delete Fish Oil',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('fitcircle_supplements'))).toBe(before);
 page.once('dialog',d=>d.accept());await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Delete Fish Oil',exact:true}).click()]);await expect(page.getByRole('checkbox',{name:'Fish Oil',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Manage Supplements',exact:true}).click();await page.getByRole('button',{name:'Add Supplement',exact:true}).last().click();await expect(page.getByRole('dialog',{name:'Add New Supplement'})).toBeVisible();
 await page.getByLabel('Supplement Name',{exact:true}).fill('Magnesium');await page.getByRole('combobox').click();await page.getByRole('option',{name:'mg (milligrams)',exact:true}).click();await page.getByLabel('Amount/Quantity').fill('250');await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Add Supplement',exact:true}).last().click()]);await expect(page.getByRole('checkbox',{name:'Magnesium',exact:true})).toContainText('250 mg');
});
for(const mode of ['dark','light','system'])test(`mobile ${mode} appearance, management and empty state`,async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await seed(page,mode);
 const before=await readLogs(page);fs.mkdirSync(review,{recursive:true});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await expect(page.locator('.app-dock').locator('nav')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(mode==='light')expect((await textContrast(page)).failures).toEqual([]);
  if(mode!=='system')await page.screenshot({path:`${review}/after-${mode}-${width}.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Manage Supplements',exact:true}).click();await page.getByRole('button',{name:'Delete Zinc',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Delete Zinc',exact:true})).toBeInViewport();
  if(mode!=='system'&&width===390)await page.screenshot({path:`${review}/manage-${mode}-${width}.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Manage Supplements',exact:true}).click();await page.locator('.app-content').evaluate(el=>el.scrollTop=0);
 }
 expect(await readLogs(page)).toBe(before);
 await page.evaluate(()=>{const records=JSON.parse(localStorage.getItem('fitcircle_supplements')!);records[0].name='Long supplement name '.repeat(12);records[0].amount=123456;localStorage.setItem('fitcircle_supplements',JSON.stringify(records));});await page.reload();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('checkbox').first()).toContainText('123456 pills');
 if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-appearance','light');}
 await page.evaluate(()=>localStorage.setItem('fitcircle_supplements','[]'));await page.reload();await expect(page.getByText('No supplements added yet',{exact:true})).toBeVisible();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0');
});
test('calendar return and historical overview edits keep today’s supplement log intact',async({page})=>{
 await seed(page);const today=JSON.parse((await readLogs(page))!)['2026-10-28'];
 await page.goto('supplements-page');await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/calendar$/);
 await page.goto('dynamic-overview/2026-09-17');await page.getByRole('tab',{name:'Supplements',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Fish Oil',exact:true})).toBeChecked();await page.getByRole('checkbox',{name:'Vitamin D3',exact:true}).click();await page.getByRole('button',{name:'Save Supplement Log',exact:true}).click();
 const logs=JSON.parse((await readLogs(page))!);expect(logs['2026-09-17']['1']).toBe(true);expect(logs['2026-09-17']['2']).toBe(true);expect(logs['2026-10-28']).toEqual(today);
 await page.goto('supplements-page');await expect(page.getByTestId('supplement-completion')).toHaveText('1/8');
});
