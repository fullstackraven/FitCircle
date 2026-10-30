import {selectDisplayAppearance} from '../fixtures/display-appearance';
import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {textContrast} from '../fixtures/appearance-contrast';
const review='docs/review/display-account-modernization';
test.use({viewport:{width:390,height:844}});
test('visibility switches preserve existing hide preferences and toggle only the chosen field',async({page})=>{
 await page.goto('display');
 const stored=JSON.stringify({hideQuoteOfTheDay:true,hideTodaysTotals:false,hideRecentActivity:true});
 await page.evaluate(value=>localStorage.setItem('fitcircle_control_settings',value),stored);await page.reload();
 for(const [name,checked] of [['Quote of the Day',false],["Today's Totals",true],['Recent Activity',false]] as const)await expect(page.getByRole('switch',{name,exact:true})).toHaveAttribute('aria-checked',String(checked));
 expect(await page.evaluate(()=>localStorage.getItem('fitcircle_control_settings'))).toBe(stored);
 await page.getByRole('switch',{name:'Quote of the Day',exact:true}).focus();await page.keyboard.press('Space');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_control_settings')!))).toEqual({hideQuoteOfTheDay:false,hideTodaysTotals:false,hideRecentActivity:true});
 await page.reload();await expect(page.getByRole('switch',{name:'Quote of the Day',exact:true})).toHaveAttribute('aria-checked','true');
});
for(const mode of ['light','dark','system'] as const)test(`modernized pages ${mode} retain mobile layout, navigation and data`,async({page})=>{
 await page.goto('display');await page.emulateMedia({colorScheme:'dark'});await selectDisplayAppearance(page,mode[0].toUpperCase()+mode.slice(1));
 await expect(page.locator('html')).toHaveAttribute('data-appearance',mode==='light'?'light':'dark');
 const before=await page.evaluate(()=>localStorage.getItem('workout-tracker-data'));
 fs.mkdirSync(review,{recursive:true});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  for(const route of ['display','account-data']){
   await page.goto(route);await expect(page.getByRole('heading',{name:route==='display'?'Display':'Account Data',exact:true})).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const last=page.getByRole('button',{name:route==='display'?'Refresh FitCircle':'Erase FitCircle Data',exact:true});await last.scrollIntoViewIfNeeded();
   if(mode==='light')expect((await textContrast(page)).failures).toEqual([]);
   const box=await last.boundingBox(),dock=await page.locator('.app-dock').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(dock!.y);
   if(mode==='dark'&&width===390)await page.screenshot({path:`${review}/${route}-dark-390-bottom.png`,animations:'disabled'});
   if(mode!=='system'){await page.locator('.app-content').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`${review}/${route}-${mode}-${width}.png`,animations:'disabled'});}
   expect(await page.evaluate(()=>localStorage.getItem('workout-tracker-data'))).toBe(before);
  }
 }
 if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-appearance','light');}
});
