import { test, expect, type Page } from '@playwright/test';
import { placementLogId } from '../../client/src/lib/routine-planning';
const manage = (page:Page) => page.getByRole('button',{name:'Manage Today’s Session',exact:true});
const read = (page:Page) => page.evaluate(()=>localStorage.getItem('workout-tracker-data'));
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'America/New_York'});
async function seed(page:Page,count:number,theme='light') {
 await page.clock.install({time:new Date('2026-11-04T12:00:00-05:00')});await page.goto('profile');
 await page.evaluate(({count,theme})=>{
  localStorage.setItem('fitcircle_appearance',theme);
  localStorage.setItem('workout-tracker-data',JSON.stringify({routineSchedulingVersion:1,lastDate:'2026-11-04',workouts:{w:{id:'w',name:'Rows',color:'blue',dailyGoal:20,count:0}},routines:Object.fromEntries(Array.from({length:Math.max(1,count)},(_,i)=>['r'+i,{id:'r'+i,name:'Routine '+i,createdAt:'2026-01-01',selectedDays:[count?3:4],placements:[{id:'p'+i,exerciseId:'w',prescription:{targetType:'repetitions',sets:2,perSet:10}}]}])),dailyLogs:{'2026-11-03':{w:5}},journalEntries:{}}));
 },{count,theme});await page.goto('./');await expect(manage(page)).toBeVisible();
}
for(const theme of ['light','dark','system'])test(`${theme}: one routine opens its existing editor, nested catalog preserves context, saving returns Home and logging works`,async({page})=>{
 await seed(page,1,theme);const before=JSON.parse((await read(page))!);
 await expect(page.getByRole('button',{name:'Add new workout',exact:true})).toHaveCount(0);
 await manage(page).click();await expect(page).toHaveURL(/routines\/edit\?id=r0$/);await expect(page.getByLabel('Routine Name')).toHaveValue('Routine 0');
 await page.getByRole('button',{name:'Add Exercise',exact:true}).click();await expect(page).toHaveURL(/routines\/exercises\/add\?routine=r0/);
 await page.getByLabel('Search exercises').fill('plank');await page.getByRole('button',{name:'Configure Plank',exact:true}).click();
 await page.getByLabel('Number of Sets').fill('2');await page.getByLabel('Seconds per Set',{exact:true}).fill('30');await page.getByRole('button',{name:'Save Exercise',exact:true}).click();
 await expect(page).toHaveURL(/routines\/edit\?id=r0$/);await page.getByLabel('Routine Name').fill('Updated routine');await page.getByRole('button',{name:'Save Routine',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);
 await expect(page.getByText('Plank',{exact:true})).toBeVisible();await expect(page.getByText('Updated routine',{exact:true})).toBeVisible();
 const circle=page.getByTestId('home-workout-'+placementLogId('r0','p0')).getByRole('button',{name:/Record a set/});await circle.click();await expect(circle).toHaveAttribute('aria-label',/1 of 2/);
 const after=JSON.parse((await read(page))!);expect(after.dailyLogs['2026-11-03']).toEqual(before.dailyLogs['2026-11-03']);expect(after.routines.r0.selectedDays).toEqual([3]);expect(after.routines.r0.placements[0].id).toBe('p0');
 await expect(page.getByRole('button',{name:'Start Workout Session',exact:true})).toBeVisible();
 if(theme==='light'){await page.goBack();await expect(page).toHaveURL(/profile$/);}
});
test('multiple routines offer a cancelable chooser, then open the selected routine only',async({page})=>{
 await seed(page,2);const before=await read(page);await manage(page).click();const dialog=page.getByRole('dialog',{name:'Manage Today’s Session',exact:true});
 await expect(dialog.getByRole('button',{name:'Routine 0',exact:true})).toBeVisible();await expect(dialog).toHaveCSS('opacity','1');await page.screenshot({path:'/tmp/home-session-choice.png'});await expect(dialog.getByRole('button',{name:'Routine 1',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toBeHidden();await expect(manage(page)).toBeFocused();expect(await read(page)).toBe(before);
 await manage(page).click();await dialog.getByRole('button',{name:'Routine 1',exact:true}).click();await expect(page.getByLabel('Routine Name')).toHaveValue('Routine 1');await expect(page).toHaveURL(/routines\/edit\?id=r1/);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);expect(await read(page)).toBe(before);
});
test('recovery day stays intact; create/view options never invent a schedule and Cancel keeps data',async({page})=>{
 await seed(page,0);const before=await read(page);await expect(page.getByText('Enjoy an active recovery day!',{exact:true})).toBeVisible();
 await manage(page).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();expect(await read(page)).toBe(before);
 await manage(page).click();await page.getByRole('button',{name:'View Routines',exact:true}).click();await expect(page.getByRole('heading',{name:'Routines',exact:true})).toBeVisible();
 await page.goto('./');await manage(page).click();await page.getByRole('button',{name:'Create New Routine',exact:true}).click();await expect(page).toHaveURL(/routines\/new$/);await expect(page.getByTestId('button-save-routine')).toBeDisabled();
 await expect(page.getByRole('button',{name:'Wednesday',exact:true})).toHaveAttribute('aria-pressed','false');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);expect(await read(page)).toBe(before);
 await manage(page).click();await page.getByRole('button',{name:'Create New Routine',exact:true}).click();await page.getByLabel('Routine Name').fill('Thursday routine');await page.getByRole('button',{name:'Thursday',exact:true}).click();await page.getByRole('button',{name:'Save Routine',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);await expect(page.getByText('Enjoy an active recovery day!',{exact:true})).toBeVisible();
});
test('Back and reload retain route context; unsaved routine changes can be kept or discarded',async({page})=>{
 await seed(page,1);const before=await read(page);await manage(page).click();await page.reload();await expect(page.getByLabel('Routine Name')).toHaveValue('Routine 0');
 await page.getByLabel('Routine Name').fill('Unsaved routine');page.once('dialog',d=>d.dismiss());await page.goBack();await expect(page.getByLabel('Routine Name')).toHaveValue('Unsaved routine');expect(await read(page)).toBe(before);
 page.once('dialog',d=>d.accept());await page.goBack();await expect(page).toHaveURL(/\/FitCircle\/$/);expect(await read(page)).toBe(before);
 await manage(page).click();await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);
 await page.goto('routines/edit?id=r0');await page.reload();await expect(page.getByLabel('Routine Name')).toHaveValue('Routine 0');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/routines$/);
});
test('closing a Home-launched editor consumes its navigation entries instead of leaving duplicate Home pages',async({page})=>{
 await seed(page,1);await manage(page).click();await page.getByLabel('Routine Name').fill('Saved routine');await page.getByRole('button',{name:'Save Routine',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);
 await page.goBack();await expect(page).toHaveURL(/profile$/);
});
