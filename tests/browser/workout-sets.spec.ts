import { test, expect, type Page } from '@playwright/test';
test.use({timezoneId:'America/New_York',viewport:{width:390,height:844}});
async function seed(page:Page,legacy=false){
 await page.clock.install({time:new Date('2026-10-27T12:00:00-04:00')});await page.goto('profile');
 await page.evaluate(legacy=>localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{w:{id:'w',name:'Push-ups',color:'green',dailyGoal:20,count:legacy?7:0,...(!legacy?{setsGoal:3}:{})}},dailyLogs:{'2025-01-01':{w:20},...(legacy?{'2026-10-27':{w:7}}:{})},routines:{},journalEntries:{},lastDate:'2026-10-27'})),legacy);
 await page.goto('./');
}
const data=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('workout-tracker-data')!));
const entry=async(page:Page)=>(await data(page)).dailyLogs['2026-10-27'].w;
test('sets credit exact reps, undo, persist targets across edits and agree with Calendar and statistics',async({page})=>{
 await seed(page);const card=page.getByTestId('home-workout-w');const circle=card.getByRole('button',{name:/Record a set/});
 await circle.click();expect(await entry(page)).toEqual({count:6,goalAtTime:20,completedSets:1,setsGoalAtTime:3});await expect(card).toContainText('6 / 20 reps');
 await circle.click();expect((await entry(page)).count).toBe(13);
 await card.getByTitle('Undo last set').click();expect((await entry(page)).count).toBe(6);
 await page.getByRole('button',{name:'Edit Push-ups',exact:true}).click();
 await page.getByLabel('Total Reps',{exact:true}).fill('100');await page.getByLabel('Number of Sets').fill('4');await page.getByRole('button',{name:'Update Workout',exact:true}).click();
 await expect(circle).toHaveAttribute('aria-label',/1 of 3/);await circle.click();await circle.click();await circle.click();
 expect(await entry(page)).toEqual({count:20,goalAtTime:20,completedSets:3,setsGoalAtTime:3});
 expect((await data(page)).dailyLogs['2025-01-01'].w).toEqual({count:20,goalAtTime:20});
 await page.reload();await expect(circle).toHaveAttribute('aria-label',/3 of 3/);
 await page.goto('calendar');await expect(page.locator('[aria-current="date"]').locator('..')).toContainText('Workouts complete');
 await page.goto('workout-statistics');const m=page.getByRole('region',{name:'Monthly Statistics',exact:true});
 await expect(m.getByText('Monthly Reps',{exact:true}).locator('..').locator('dd')).toHaveText('20');
 await page.goto('dynamic-overview/2026-10-27');await expect(page.getByText('20 reps · 3/3 sets')).toBeVisible();
 await page.getByTitle('Edit count').click();await page.getByLabel('Completed sets').fill('2');await page.getByTitle('Save',{exact:true}).click();expect((await entry(page)).count).toBe(13);
 await page.goto('calendar');await expect(page.locator('[aria-current="date"]').locator('..')).not.toContainText('Workouts complete');
 await page.clock.setFixedTime(new Date('2026-10-28T12:00:00-04:00'));await page.goto('./');await expect(circle).toHaveAttribute('aria-label',/0 of 4/);await circle.click();
 expect((await data(page)).dailyLogs['2026-10-28'].w).toEqual({count:25,goalAtTime:100,completedSets:1,setsGoalAtTime:4});
});
test('legacy partial day stays rep-based; following day adopts one set without rewriting history',async({page})=>{
 await seed(page,true);const before=await data(page);const card=page.getByTestId('home-workout-w');await expect(card.getByRole('button',{name:/Record a rep/})).toHaveAttribute('aria-label',/7 of 20/);
 await card.getByRole('button',{name:/Record a rep/}).click();expect(await entry(page)).toEqual({count:8,goalAtTime:20});await card.getByTitle('Undo last rep').click();expect((await entry(page)).count).toBe(7);
 await page.clock.setFixedTime(new Date('2026-10-28T12:00:00-04:00'));await page.goto('./');await card.getByRole('button',{name:/Record a set/}).click();
 const after=await data(page);expect(after.dailyLogs['2026-10-28'].w).toEqual({count:20,goalAtTime:20,completedSets:1,setsGoalAtTime:1});expect(after.dailyLogs['2025-01-01']).toEqual(before.dailyLogs['2025-01-01']);expect(after.workouts.w.setsGoal).toBeUndefined();
});
test('workout form validates positive whole rep/set goals and preserves compact controls',async({page})=>{
 await seed(page);await page.getByRole('button',{name:'Edit Push-ups',exact:true}).click();const save=page.getByRole('button',{name:'Update Workout',exact:true});
 await page.getByLabel('Number of Sets').fill('21');await expect(save).toBeDisabled();await page.getByLabel('Number of Sets').fill('0');await expect(save).toBeDisabled();await page.getByLabel('Number of Sets').fill('2.5');await expect(save).toBeDisabled();await page.getByLabel('Number of Sets').fill('4');await page.getByLabel('Total Reps',{exact:true}).fill('20.5');await expect(save).toBeDisabled();await page.getByLabel('Total Reps',{exact:true}).fill('20');await expect(save).toBeEnabled();
 const reps=page.getByLabel('Total Reps',{exact:true});
 for(const value of ['10000','0','-1','','20.5']) {await reps.fill(value);await expect(reps).toHaveValue(value);await expect(save).toBeDisabled();await expect(page.getByRole('alert')).toBeVisible();}
 await reps.fill('9999');await expect(save).toBeEnabled();
 await page.getByLabel('Number of Sets').fill('');await expect(save).toBeDisabled();await page.getByLabel('Number of Sets').fill('-1');await expect(save).toBeDisabled();await page.getByLabel('Number of Sets').fill('4');await reps.fill('20');
 await page.setViewportSize({width:320,height:568});await expect(save).toBeInViewport();await save.click();expect((await data(page)).workouts.w.setsGoal).toBe(4);
});
test('Calendar waits for every scheduled set workout, including untouched circles',async({page})=>{
 await seed(page);
 await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('workout-tracker-data')!);d.workouts.b={...d.workouts.w,id:'b',name:'Squats',setsGoal:1};localStorage.setItem('workout-tracker-data',JSON.stringify(d));});
 await page.reload();const push=page.getByRole('button',{name:/Record a set for Push-ups/});await push.click();await push.click();await push.click();
 await page.goto('calendar');await expect(page.locator('[aria-current="date"]').locator('..')).not.toContainText('Workouts complete');
 await page.goto('./');await page.getByRole('button',{name:/Record a set for Squats/}).click();await page.goto('calendar');await expect(page.locator('[aria-current="date"]').locator('..')).toContainText('Workouts complete');
});
