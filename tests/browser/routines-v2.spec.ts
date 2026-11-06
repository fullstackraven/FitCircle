import {pillGeometry} from '../fixtures/pill-geometry';
import fs from 'node:fs';
import {test,expect} from '@playwright/test';
import {seedWellnessAppearance} from '../fixtures/appearance-wellness';
test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});
const stored=(page:import('@playwright/test').Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('workout-tracker-data')!));
for(const mode of ['light','dark','system'])test(`${mode}: routed planning, reuse, targets, variations, Home logging and deletion preserve history`,async({page})=>{
 test.setTimeout(90000);await seedWellnessAppearance(page,mode);await page.goto('routines');
 await expect(page.getByRole('heading',{name:'My Routines',exact:true})).toBeVisible();expect(await pillGeometry(page)).toEqual([]);
 const initial=(await stored(page)).dailyLogs;
 await page.getByTestId('button-create-routine').click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByLabel('Routine Name',{exact:true}).fill('Upper Body');await page.getByRole('button',{name:'Monday',exact:true}).click();
 await page.getByRole('button',{name:'Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Add Push-ups',exact:true}).click();
 await page.getByRole('button',{name:'Create New Exercise',exact:true}).click();await expect(page).toHaveURL(/routines\/workouts\/new/);
 await page.getByLabel('Workout Name',{exact:true}).fill('Timed Hold');await page.getByRole('button',{name:'Duration',exact:true}).click();
 await page.getByLabel('Number of Sets').fill('3');await page.getByLabel('Seconds per Set').fill('30');await page.getByLabel('Weight (lbs) - Optional').fill('0');
 if(process.env.ROUTINES_REVIEW==='1'&&mode==='dark'){fs.mkdirSync('docs/review/routines-v2',{recursive:true});await page.screenshot({path:'docs/review/routines-v2/exercise-dark.png'});}
 await page.getByLabel('Equipment',{exact:true}).fill('Resistance bands');await page.getByLabel('Rest between sets (seconds)').fill('30');expect(await pillGeometry(page)).toEqual([]);await page.getByLabel('Instructions / notes').fill('Maintain a comfortable posture.');
 await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(page).toHaveURL(/routines\/new/);
 await expect(page.getByLabel('Routine Name')).toHaveValue('Upper Body');await expect(page.getByRole('button',{name:'Configure Timed Hold',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Reorder Timed Hold',exact:true}).focus();await page.keyboard.press('ArrowUp');
 if(process.env.ROUTINES_REVIEW==='1'&&mode==='light'){fs.mkdirSync('docs/review/routines-v2',{recursive:true});await page.screenshot({path:'docs/review/routines-v2/routine-light.png'});}
 await page.getByLabel('Description / notes').fill('General training');
 await page.getByRole('button',{name:'Add Variation',exact:true}).click();expect(await pillGeometry(page)).toEqual([]);await page.getByLabel('Variation name New variation').fill('Week B');
 await page.getByRole('button',{name:'Configure Timed Hold',exact:true}).click();await page.getByLabel('Seconds per Set').fill('45');await page.getByLabel('Weight (lbs) - Optional').fill('15');await page.getByLabel('Rest between sets (seconds)').fill('90');
 await page.getByRole('button',{name:'Save Exercise',exact:true}).click();
 await page.getByRole('button',{name:'Save Routine',exact:true}).click();await expect(page).toHaveURL(/routines$/);
 let data=await stored(page);const r:any=Object.values(data.routines).find((r:any)=>r.name==='Upper Body');const hold:any=Object.values(data.workouts).find((w:any)=>w.name==='Timed Hold');
 expect(r.placements.map((p:any)=>p.exerciseId)).toEqual([hold.id,'w']);expect(hold).toMatchObject({equipment:'Resistance bands',restSeconds:30,notes:'Maintain a comfortable posture.',weightLbs:0});expect(r.variations[0].targets[r.placements[0].id].restSeconds).toBe(90);expect(r.placements[0].weightLbs).toBe(15);expect(data.dailyLogs).toEqual(initial);
 await page.getByTestId('routine-header-'+r.id).click();await expect(page.getByTestId(`routine-exercise-${r.id}-${hold.id}`)).toContainText('3 × 45 sec');
 if(process.env.ROUTINES_REVIEW==='1'&&mode==='light')await page.screenshot({path:'docs/review/routines-v2/routines-light.png'});
 await page.goto('./');await expect(page.getByTestId('home-workout-'+hold.id)).toHaveCount(1);
 const circle=page.getByTestId('home-workout-'+hold.id).getByRole('button',{name:/Record a set/});await circle.click();
 data=await stored(page);const day='2026-10-19';expect(data.dailyLogs[day][hold.id]).toMatchObject({count:45,goalAtTime:135,targetTypeAtTime:'duration',completedSets:1});
 await page.getByTestId('home-workout-'+hold.id).getByRole('button',{name:/Undo last set/}).click();expect((await stored(page)).dailyLogs[day][hold.id].count).toBe(0);await circle.click();
 await page.goto(`routines/edit?id=${r.id}`);await page.getByLabel('Current variation',{exact:true}).selectOption('');
 await page.getByRole('button',{name:'Save Routine',exact:true}).click();expect((await stored(page)).dailyLogs[day][hold.id].count).toBe(45);
 await page.goto(`routines/edit?id=${r.id}`);const beforeVariationDelete=(await stored(page)).dailyLogs;page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete variation Week B',exact:true}).click();await page.getByRole('button',{name:'Save Routine',exact:true}).click();expect((await stored(page)).routines[r.id].variations).toHaveLength(0);expect((await stored(page)).dailyLogs).toEqual(beforeVariationDelete);
 await page.goto('./');await expect(page.getByTestId('home-workout-'+hold.id)).toContainText('45 / 135');
 await page.goto('workout-statistics');await expect(page.getByText(/Exercise duration logged: 45/)).toBeVisible();
 await page.goto('calendar');await expect(page.getByRole('heading',{name:'Recent Activity',exact:true})).toBeVisible();
 await page.goto(`dynamic-overview/${day}`);await expect(page.getByText('Timed Hold',{exact:true})).toBeVisible();
 await page.goto(`routines/edit?id=${r.id}`);await page.getByRole('button',{name:'Remove Timed Hold from routine',exact:true}).click();await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 data=await stored(page);expect(data.workouts[hold.id]).toBeDefined();expect(data.dailyLogs[day][hold.id].count).toBe(45);
 await page.goto(`routines/edit?id=${r.id}`);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete Routine',exact:true}).click();expect((await stored(page)).routines[r.id]).toBeUndefined();
 await page.goto(`routines/workouts/edit?id=${hold.id}`);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete Exercise',exact:true}).click();data=await stored(page);expect(data.workouts[hold.id]).toBeUndefined();expect(data.archivedWorkouts[hold.id]).toBeDefined();expect(data.dailyLogs[day][hold.id].count).toBe(45);
 await page.goto(`dynamic-overview/${day}`);await expect(page.getByText('Timed Hold',{exact:true})).toBeVisible();
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.goto('routines');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByTestId('button-create-routine').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Cancel',exact:true}).click();}
});

test('multiple routines reuse a definition, keep independent targets and deduplicate daily logging',async({page})=>{
 await seedWellnessAppearance(page,'light');
 await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('workout-tracker-data')!);d.routines={};d.dailyLogs={};localStorage.setItem('workout-tracker-data',JSON.stringify(d));});
 await page.goto('routines');
 for(const [name,sets,reps] of [['First',3,10],['Second',2,20]] as const){
  await page.getByTestId('button-create-routine').click();await page.getByLabel('Routine Name').fill(name);await page.getByRole('button',{name:'Monday',exact:true}).click();await page.getByRole('button',{name:'Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Add Push-ups',exact:true}).click();await page.getByRole('button',{name:'Configure Push-ups',exact:true}).click();await page.getByLabel('Number of Sets').fill(String(sets));await page.getByLabel('Reps per Set',{exact:true}).fill(String(reps));await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 }
 const d=await stored(page);expect(Object.keys(d.workouts)).toEqual(['w']);const routines:any[]=Object.values(d.routines);expect(routines.map(r=>r.placements[0].prescription.sets*r.placements[0].prescription.perSet)).toEqual([30,40]);
 await page.goto('./');await expect(page.getByTestId('home-workout-w')).toHaveCount(1);await expect(page.getByTestId('home-workout-w')).toContainText('First · Second');
 await page.getByTestId('home-workout-w').getByRole('button',{name:/Record a set/}).click();expect((await stored(page)).dailyLogs['2026-10-19'].w).toMatchObject({count:10,goalAtTime:30,setsGoalAtTime:3});
 const second=routines.find(r=>r.name==='Second');await page.goto(`routines/edit?id=${second.id}`);await page.getByRole('button',{name:'Configure Push-ups',exact:true}).click();await page.getByLabel('Reps per Set',{exact:true}).fill('25');await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 expect((await stored(page)).dailyLogs['2026-10-19'].w).toMatchObject({count:10,goalAtTime:30});expect((await stored(page)).workouts.w.dailyGoal).toBe(20);
 await page.goto('routines/workouts/edit?id=w');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete Exercise',exact:true}).click();
 await page.goto('workout-statistics');await expect(page.getByRole('region',{name:'All-Time Statistics',exact:true}).getByText('Total Reps',{exact:true}).locator('..').locator('dd')).toHaveText('10');

});

test('placement-only edits receive the same Back protection as typed routine fields',async({page})=>{
 await seedWellnessAppearance(page,'light');await page.goto('routines/edit?id=r');const before=await stored(page);
 await page.getByRole('button',{name:'Remove Push-ups from routine',exact:true}).click();page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page).toHaveURL(/routines\/edit\?id=r/);await expect(page.getByRole('button',{name:'Configure Push-ups',exact:true})).toHaveCount(0);
 expect(await stored(page)).toEqual(before);await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/routines$/);expect(await stored(page)).toEqual(before);
});
