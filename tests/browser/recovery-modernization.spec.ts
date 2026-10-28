import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {textContrast} from '../fixtures/appearance-contrast';
const localDate=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function dates(count:number){return Array.from({length:count},(_,i)=>{const date=new Date(2026,9,28);date.setDate(date.getDate()-i);return localDate(date);});}
async function seed(page:Page,mode='dark',recoveryDays=dates(49),workoutDays=166){
 await page.clock.setFixedTime(new Date('2026-10-28T12:00:00Z'));await page.goto('wellness');
 await page.evaluate(({mode,recoveryDays,workoutDates})=>{
  localStorage.setItem('fitcircle_appearance',mode);localStorage.setItem('fitcircle_recovery_data',JSON.stringify({recoveryDays}));
  localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{w:{id:'w',name:'Synthetic workout',color:'green',dailyGoal:20,setsGoal:2,count:0}},dailyLogs:Object.fromEntries(workoutDates.map(date=>[date,{w:{count:20,goalAtTime:20,completedSets:2,setsGoalAtTime:2}}])),journalEntries:{},routines:{},lastDate:'2026-10-28'}));
 },{mode,recoveryDays,workoutDates:dates(workoutDays)});await page.goto('recovery?from=wellness');
}
const bytes=(page:Page)=>page.evaluate(()=>({recovery:localStorage.getItem('fitcircle_recovery_data'),workouts:localStorage.getItem('workout-tracker-data')}));
test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});
test('overview retains 49 / 166 = 29.5%, and filters/expansion do not change domain data',async({page})=>{
 await seed(page);const before=await bytes(page);await expect(page.getByTestId('recovery-days')).toHaveText('49');await expect(page.getByTestId('workout-days')).toHaveText('166');await expect(page.getByTestId('recovery-rate')).toHaveText('29.5%');await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','29.5');
 const rows=page.getByRole('list',{name:'Recovery dates'}).getByRole('button');await expect(rows).toHaveCount(5);await expect(rows.first()).toContainText('October 28, 2026');
 await page.getByRole('button',{name:'7 days',exact:true}).click();await page.getByRole('button',{name:'Show More Recovery Days',exact:true}).click();await expect(rows).toHaveCount(7);await page.getByRole('button',{name:'Show Less',exact:true}).click();await expect(rows).toHaveCount(5);
 await page.getByRole('button',{name:'All',exact:true}).click();for(const count of [25,45,49]){await page.getByRole('button',{name:'Show More Recovery Days',exact:true}).click();await expect(rows).toHaveCount(count);}
 await page.getByRole('button',{name:'Show Less',exact:true}).click();await expect(rows).toHaveCount(5);expect(await bytes(page)).toEqual(before);await page.reload();await expect(page.getByTestId('recovery-rate')).toHaveText('29.5%');expect(await bytes(page)).toEqual(before);
});
test('history uses the established dated overview workflow and reflects mark/unmark after returning',async({page})=>{
 await seed(page);await page.getByRole('button',{name:'View recovery day October 28, 2026',exact:true}).click();await expect(page).toHaveURL(/dynamic-overview\/2026-10-28$/);
 await page.getByRole('button',{name:'Undo Recovery',exact:true}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/recovery/);await expect(page.getByTestId('recovery-days')).toHaveText('48');
 await page.goto('recovery');await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/calendar$/);
});
test('empty periods and zero/over-target statistics stay truthful',async({page})=>{
 await seed(page,'dark',['2025-12-12']);await expect(page.getByText('No recovery days recorded in this period.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'All',exact:true}).click();await expect(page.getByRole('button',{name:'View recovery day December 12, 2025',exact:true})).toBeVisible();
 await seed(page,'dark',[],0);await expect(page.getByTestId('recovery-rate')).toHaveText('0.0%');await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0');
 await seed(page,'dark',['2026-10-28','2026-10-29','2026-10-30'],1);await expect(page.getByTestId('recovery-rate')).toHaveText('300.0%');await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext',/300.0%/);
});
for(const mode of ['dark','light','system'])test(`mobile ${mode} appearance, instructions, data and scrolling`,async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await seed(page,mode);const before=await bytes(page);fs.mkdirSync('docs/review/recovery-modernization',{recursive:true});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await expect(page.getByRole('navigation',{name:'Bottom navigation'})).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(mode==='light')expect((await textContrast(page)).failures).toEqual([]);
  await page.locator('.app-content').evaluate(el=>el.scrollTop=0);if(mode!=='system')await page.screenshot({path:`docs/review/recovery-modernization/after-${mode}-${width}.png`,animations:'disabled'});
  const summary=page.locator('summary');await summary.focus();await page.keyboard.press('Enter');await expect(page.locator('details')).toHaveAttribute('open','');await page.getByText('Recovery days count toward consistency without requiring a workout.',{exact:true}).scrollIntoViewIfNeeded();
  if(mode!=='system'&&width===390){await summary.evaluate(el=>(el as HTMLElement).blur());}if(mode!=='system'&&width===390)await page.screenshot({path:`docs/review/recovery-modernization/instructions-${mode}-${width}.png`,animations:'disabled'});
  await summary.click();await expect(page.locator('details')).not.toHaveAttribute('open','');
 }
 expect(await bytes(page)).toEqual(before);if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-appearance','light');}
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/wellness$/);
});
