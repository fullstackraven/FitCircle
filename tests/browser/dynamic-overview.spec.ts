import { test, expect, type Page } from '@playwright/test';
test.use({ viewport: {width:390,height:844}, timezoneId:'America/New_York' });
const day='2026-10-26';
async function seed(page: Page, mode='dark') {
  await page.clock.install({time:new Date('2026-10-26T12:00:00-04:00')});
  await page.goto('profile');
  await page.evaluate(({day,mode})=>{
    localStorage.setItem('fitcircle_appearance',mode);
    localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{},routines:{},dailyLogs:{},journalEntries:{'2025-01-01':{text:'Original\n journal',timestamp:'2025-01-01T10:00:00Z',retained:true}},lastDate:day}));
    localStorage.setItem('fitcircle_energy_levels',JSON.stringify({'2025-01-01':3}));
    localStorage.setItem('fitcircle_recovery_data',JSON.stringify({recoveryDays:['2025-01-01']}));
    localStorage.setItem('fitcircle_supplements',JSON.stringify(['Vitamin D3','Fish Oil','Multi','Protein Shake','B-complex','Creatine','Fiber'].map((name,i)=>({id:i+1,name,measurementType:'pills',amount:1,createdAt:'2025-01-01T10:00:00Z',retained:true}))));
    localStorage.setItem('fitcircle_supplement_logs',JSON.stringify({'2025-01-01':{'1':true}}));
  },{day,mode});
  await page.goto(`dynamic-overview/${day}`);
}
const bytes=(page:Page)=>page.evaluate(()=>Object.fromEntries(['workout-tracker-data','fitcircle_energy_levels','fitcircle_recovery_data','fitcircle_supplements','fitcircle_supplement_logs'].map(key=>[key,localStorage.getItem(key)])));
const daily=(page:Page)=>page.getByRole('tab',{name:'Daily Overview',exact:true});
const supplements=(page:Page)=>page.getByRole('tab',{name:'Supplements',exact:true});
async function energy(page:Page,value:string){await page.getByRole('slider',{name:'Energy level'}).fill(value);}

test('segments retain drafts, never save defaults, and selected-day saves preserve historical data',async({page})=>{
 await seed(page);const before=await bytes(page);
 await expect(page.getByText('Not saved',{exact:true})).toBeVisible();
 await energy(page,'7');await page.getByLabel('Journal entry',{exact:true}).fill('A new\n reflection');
 await page.getByRole('button',{name:'View and log supplements'}).click();
 await page.getByRole('checkbox',{name:'Vitamin D3',exact:true}).click();
 await daily(page).click();await supplements(page).click();
 await expect(page.getByRole('checkbox',{name:'Vitamin D3',exact:true})).toBeChecked();
 expect(await bytes(page)).toEqual(before);
 await page.getByRole('button',{name:'Add Supplement',exact:true}).click();
 await page.getByLabel('Supplement name').fill('Magnesium');
 await daily(page).click();await expect(page.getByLabel('Journal entry')).toHaveValue('A new\n reflection');await expect(page.getByRole('slider')).toHaveValue('7');
 await supplements(page).click();await expect(page.getByLabel('Supplement name')).toHaveValue('Magnesium');
 await page.getByRole('button',{name:'Add',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Vitamin D3',exact:true})).toBeChecked();
 await page.getByRole('button',{name:'Save Supplement Log',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Supplement log saved');
 await daily(page).click();await expect(page.getByLabel('Journal entry')).toHaveValue('A new\n reflection');
 await page.getByRole('button',{name:'Save Entry',exact:true}).click();
 await page.getByRole('button',{name:'Save Energy Level',exact:true}).click();
 await page.getByRole('button',{name:'Mark as Recovery',exact:true}).click();
 await expect(page.getByRole('button',{name:'Undo Recovery',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.reload();await expect(page.getByLabel('Journal entry')).toHaveValue('A new\n reflection');await expect(page.getByRole('slider')).toHaveValue('7');
 await page.getByRole('button',{name:'Undo Recovery',exact:true}).click();
 const after=await bytes(page);
 expect(JSON.parse(after['workout-tracker-data']!).journalEntries['2025-01-01']).toEqual(JSON.parse(before['workout-tracker-data']!).journalEntries['2025-01-01']);
 expect(JSON.parse(after['fitcircle_energy_levels']!)).toEqual({'2025-01-01':3,[day]:7});
 expect(JSON.parse(after['fitcircle_recovery_data']!).recoveryDays).toEqual(['2025-01-01']);
 expect(JSON.parse(after['fitcircle_supplement_logs']!)['2025-01-01']).toEqual({'1':true});
 expect(JSON.parse(after['fitcircle_supplements']!).slice(0,7)).toEqual(JSON.parse(before['fitcircle_supplements']!));
});

test('save errors retain drafts and do not claim success',async({page})=>{
 await seed(page);const before=await bytes(page);
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Synthetic quota','QuotaExceededError');};});
 await page.getByLabel('Journal entry').fill('Keep this draft');await page.getByRole('button',{name:'Save Entry',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Could not save');
 await energy(page,'8');await page.getByRole('button',{name:'Save Energy Level'}).click();await expect(page.getByRole('alert')).toContainText('Could not save');
 await page.getByRole('button',{name:'Mark as Recovery'}).click();await expect(page.getByRole('alert')).toContainText('Could not save');
 await supplements(page).click();await page.getByRole('checkbox',{name:'Vitamin D3',exact:true}).click();await page.getByRole('button',{name:'Save Supplement Log'}).click();await expect(page.getByRole('alert')).toContainText('Could not save');
 await daily(page).click();await expect(page.getByLabel('Journal entry')).toHaveValue('Keep this draft');expect(await bytes(page)).toEqual(before);
});

test('workout count and duration editors remain available without clearing daily drafts',async({page})=>{
 await seed(page);
 await page.evaluate(day=>{
 const data=JSON.parse(localStorage.getItem('workout-tracker-data')!);data.workouts={w:{id:'w',name:'Push-ups',color:'green',dailyGoal:20,count:0}};data.dailyLogs={[day]:{w:{count:10,goalAtTime:20}}};localStorage.setItem('workout-tracker-data',JSON.stringify(data));
 localStorage.setItem('fitcircle_workout_duration_data',JSON.stringify({completedSessions:[{date:day,startTime:1793026800000,duration:600}]}));
 },day);await page.reload();
 await page.getByLabel('Journal entry').fill('Unsaved workout reflection');
 await page.getByTitle('Edit count').click();await page.locator('input[type=number]').fill('12');await page.getByTitle('Save',{exact:true}).click();
 await page.getByTestId('button-edit-workout-duration').click();await page.getByTestId('input-duration-minutes').fill('15');await page.getByTestId('button-save-duration').click();
 await expect(page.getByLabel('Journal entry')).toHaveValue('Unsaved workout reflection');
 expect(await page.evaluate(day=>JSON.parse(localStorage.getItem('workout-tracker-data')!).dailyLogs[day].w.count,day)).toBe(12);
 await expect(page.getByTestId('button-edit-workout-duration')).toContainText('15');
});

for(const mode of ['dark','light']) test(`${mode}: narrow layout, keyboard, date and navigation preserve shell behavior`,async({page})=>{
 await seed(page,mode);await page.setViewportSize({width:320,height:844});
 await expect(page.getByRole('navigation',{name:'Bottom navigation'})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'October 26, 2026'})).toBeVisible();
 await daily(page).focus();await page.keyboard.press('ArrowRight');await expect(supplements(page)).toBeFocused();
 await page.getByRole('button',{name:'Add Supplement',exact:true}).click();await page.getByLabel('Supplement name').fill('Long supplement draft');
 await page.setViewportSize({width:320,height:430});await page.getByRole('button',{name:'Add',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Add',exact:true})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
 await daily(page).click();await page.getByLabel('Journal entry').fill('Narrow journal');await page.getByRole('button',{name:'Save Entry',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Save Entry',exact:true})).toBeInViewport();
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/\/calendar$/);await expect(page.getByRole('navigation',{name:'Bottom navigation'})).toBeVisible();
});

test('Daily Overview and Supplements reference views',async({page})=>{
 await seed(page);await page.evaluate(day=>{localStorage.setItem('fitcircle_energy_levels',JSON.stringify({[day]:7}));localStorage.setItem('fitcircle_supplement_logs',JSON.stringify({[day]:{'1':true,'6':true}}));},day);await page.reload();await page.addStyleTag({content:'.overview-tabs button { transition: none !important; }'});await page.evaluate(()=>document.fonts.ready);
 await expect(page).toHaveScreenshot('dynamic-overview-compact.png',{animations:'disabled',maxDiffPixels:0,threshold:0});
 await supplements(page).click();await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));await expect(page).toHaveScreenshot('dynamic-overview-supplements.png',{animations:'disabled',maxDiffPixels:0,threshold:0});
});

test('Calendar entry preserves native Back and Forward history',async({page})=>{
 await seed(page);await page.goto('calendar');
 await page.getByText('26',{exact:true}).click();
 await expect(page).toHaveURL(/dynamic-overview\/2026-10-26$/);
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/\/calendar$/);
 await page.goForward();await expect(page).toHaveURL(/dynamic-overview\/2026-10-26$/);
 await expect(page.getByRole('navigation',{name:'Bottom navigation'})).toHaveCount(0);
});
