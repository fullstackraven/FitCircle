import { test, expect, type Page } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';
import { placementLogId } from '../../client/src/lib/routine-planning';
import { pillGeometry } from '../fixtures/pill-geometry';
const read=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('workout-tracker-data')!));
test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});
async function catalog(page:Page,routine='r') {
 await page.goto('routines');await page.getByTestId('routine-header-'+routine).click();await page.getByTestId('button-add-workout-'+routine).click();
 await expect(page).toHaveURL(new RegExp(`routines/exercises/add\\?routine=${routine}`));
}
for(const mode of ['light','dark'])test(`${mode}: routed catalog searches aliases, muscle groups and equipment without populating storage`,async({page})=>{
 await seedWellnessAppearance(page,mode);const before=await read(page);await catalog(page);
 await expect(page.getByRole('heading',{name:'Add Exercise',exact:true})).toBeVisible();await page.screenshot({path:`/tmp/exercise-catalog-${mode}.png`});await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByRole('region',{name:'My Custom Exercises',exact:true})).toBeVisible();
 await page.getByLabel('Search exercises').fill('rdl');await expect(page.getByRole('button',{name:'Configure Romanian Deadlift',exact:true})).toBeVisible();
 await page.getByLabel('Search exercises').fill('db bench');await expect(page.getByRole('button',{name:'Configure Dumbbell Bench Press',exact:true})).toBeVisible();
 await page.getByLabel('Search exercises').fill('cable');await expect(page.getByRole('button',{name:'Configure Cable Chest Fly',exact:true})).toBeVisible();
 await page.getByLabel('Search exercises').fill('');await page.getByRole('group',{name:'Body-part filter'}).getByRole('button',{name:'Filter by Chest',exact:true}).click();
 await page.getByRole('group',{name:'Equipment filter'}).getByRole('button',{name:'Bodyweight',exact:true}).click();
 await expect(page.getByRole('button',{name:'Configure Push-ups',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Configure Dumbbell Bench Press',exact:true})).toHaveCount(0);
 await page.getByRole('group',{name:'Equipment filter'}).getByRole('button',{name:'Equipment',exact:true}).click();await expect(page.getByRole('button',{name:'Configure Push-ups',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Configure Dumbbell Bench Press',exact:true})).toBeVisible();
 await page.getByLabel('Search exercises').fill('no matching movement 123');await expect(page.getByText('No exercises match your search.',{exact:true})).toBeVisible();
 await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await pillGeometry(page)).toEqual([]);
 expect(await read(page)).toEqual(before);await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/routines$/);
 await expect(page.getByRole('heading',{name:'FitCircle',exact:true})).toBeVisible();await expect(page.getByText(/exercise placements|unassigned exercise|Training variations/)).toHaveCount(0);
});

test('prebuilt templates create independent customizable placements and reuse a stable definition without touching history',async({page})=>{
 await seedWellnessAppearance(page,'light');await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('workout-tracker-data')!);d.routines.second={id:'second',name:'Second',selectedDays:[1],createdAt:'2026-01-02',placements:[]};localStorage.setItem('workout-tracker-data',JSON.stringify(d));});const before=await read(page);
 for(const [routine,name,reps]of [['r','My chest press','8'],['second','Other press','12']]){
  await catalog(page,routine);await page.getByLabel('Search exercises').fill('dumbbell bench');await page.getByRole('button',{name:'Configure Dumbbell Bench Press',exact:true}).click();
  await expect(page.getByLabel('Workout Name')).toHaveValue('Dumbbell Bench Press');await expect(page.getByRole('button',{name:'Save Exercise',exact:true})).toBeDisabled();
  await page.getByLabel('Workout Name').fill(name);await page.getByLabel('Number of Sets').fill('3');await page.getByLabel('Reps per Set',{exact:true}).fill(reps);await page.getByLabel('Equipment',{exact:true}).fill('My dumbbells');await page.getByLabel('Instructions / notes').fill('Controlled movement');
  await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(page).toHaveURL(/routines$/);
 }
 let d=await read(page);const a=d.routines.r.placements.at(-1),b=d.routines.second.placements[0];expect(a.exerciseId).toBe(b.exerciseId);expect(a.prescription.perSet).toBe(8);expect(b.prescription.perSet).toBe(12);expect(a.name).toBe('My chest press');expect(b.name).toBe('Other press');expect(d.dailyLogs).toEqual(before.dailyLogs);
 await page.goto('./');await page.getByTestId('home-workout-'+placementLogId('r',a.id)).getByRole('button',{name:'Edit My chest press',exact:true}).click();await expect(page.getByLabel('Workout Name')).toHaveValue('My chest press');await page.getByLabel('Workout Name').fill('Adjusted press');await page.getByLabel('Workout color').selectOption('blue');await page.getByLabel('Reps per Set',{exact:true}).fill('9');await page.getByRole('button',{name:'Save Exercise',exact:true}).click();
 d=await read(page);expect(d.routines.second.placements[0]).toEqual(b);await page.goto('./');await expect(page.getByTestId('home-workout-'+placementLogId('r',a.id))).toContainText('Adjusted press');await expect(page.getByTestId('home-workout-'+placementLogId('second',b.id))).toContainText('Other press');
 await page.getByTestId('home-workout-'+placementLogId('r',a.id)).getByRole('button',{name:/Record a set/}).click();d=await read(page);expect(d.dailyLogs['2026-10-19'][placementLogId('r',a.id)]).toMatchObject({count:9,goalAtTime:27,nameAtTime:'Adjusted press'});expect(d.dailyLogs['2026-10-19'][placementLogId('second',b.id)]).toBeUndefined();
});

test('custom creation preserves a nested routine draft and catalog definition edits/deletion preserve saved placements and backup data',async({page})=>{
 test.setTimeout(90000);await seedWellnessAppearance(page,'dark');const history=(await read(page)).dailyLogs;
 await page.goto('routines');await page.getByTestId('button-create-routine').click();await page.getByLabel('Routine Name').fill('New custom routine');await page.getByRole('button',{name:'Monday',exact:true}).click();await page.getByRole('button',{name:'Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Custom Exercise',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Create Custom Exercise',exact:true})).toBeVisible();await page.getByLabel('Workout Name').fill('My Cable Pull');await page.getByLabel('Body-part category').selectOption('back');await page.getByLabel('Equipment',{exact:true}).fill('Custom equipment');await page.getByLabel('Number of Sets').fill('2');await page.getByLabel('Reps per Set',{exact:true}).fill('7');page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByLabel('Workout Name')).toHaveValue('My Cable Pull');await page.getByRole('button',{name:'Save Exercise',exact:true}).click();
 await expect(page).toHaveURL(/routines\/new$/);await expect(page.getByLabel('Routine Name')).toHaveValue('New custom routine');await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 let d=await read(page);const r:any=Object.values(d.routines).find((r:any)=>r.name==='New custom routine');const custom:any=Object.values(d.workouts).find((w:any)=>w.name==='My Cable Pull');expect(r.placements[0].exerciseId).toBe(custom.id);await page.reload();
 await catalog(page);await page.getByLabel('Search exercises').fill('my cable');await page.getByRole('button',{name:'Add My Cable Pull',exact:true}).click();await page.getByLabel('Reps per Set',{exact:true}).fill('11');await page.getByRole('button',{name:'Save Exercise',exact:true}).click();
 d=await read(page);const placements=structuredClone(d.routines);await catalog(page);await page.getByRole('button',{name:'Edit custom exercise My Cable Pull',exact:true}).click();await page.getByLabel('Workout Name').fill('Renamed custom template');await page.getByLabel('Equipment',{exact:true}).fill('Other equipment');await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(page).toHaveURL(/exercises\/add/);
 d=await read(page);expect(d.routines).toEqual(placements);expect(d.workouts[custom.id].name).toBe('Renamed custom template');await page.getByRole('button',{name:'Edit custom exercise Renamed custom template',exact:true}).click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Delete Exercise',exact:true}).click();
 d=await read(page);expect(d.workouts[custom.id].catalogHidden).toBe(true);expect(d.routines).toEqual(placements);expect(d.dailyLogs).toEqual(history);await expect(page.getByRole('button',{name:'Add Renamed custom template',exact:true})).toHaveCount(0);
 await page.goto('settings');const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download Complete Backup'}).click();const stream=await(await pending).createReadStream();const chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(chunk);const backup=JSON.parse(Buffer.concat(chunks).toString());expect(JSON.parse(backup.localStorage['workout-tracker-data'])).toEqual(d);
 await page.evaluate(()=>localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{},routines:{},journalEntries:{},dailyLogs:{},routineSchedulingVersion:1})));page.once('dialog',dialog=>dialog.accept());await page.locator('input[type=file]').setInputFiles({name:'custom-exercises.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForURL(/\/FitCircle\/$/);expect(await read(page)).toEqual(d);
});

test('active legacy variation targets are promoted without changing history or exposing variation controls',async({page})=>{
 await seedWellnessAppearance(page,'light');await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('workout-tracker-data')!);d.routines.r.placements=[{id:'p',exerciseId:'w',prescription:{targetType:'repetitions',sets:2,perSet:10}}];d.routines.r.variations=[{id:'timed',name:'Legacy timed',targets:{p:{targetType:'duration',sets:2,perSet:30,restSeconds:45}}}];d.routines.r.activeVariationId='timed';d.routineSchedulingVersion=1;localStorage.setItem('workout-tracker-data',JSON.stringify(d));});const before=await read(page);
 await page.goto('routines/edit?id=r');await expect(page.getByText(/Training variations|Current variation|Add Variation|Legacy timed/)).toHaveCount(0);await expect(page.getByRole('button',{name:'Configure Push-ups',exact:true})).toContainText('2 × 30 sec');await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 const after=await read(page);expect(after.routines.r.activeVariationId).toBeUndefined();expect(after.routines.r.placements[0]).toMatchObject({prescription:{targetType:'duration',sets:2,perSet:30},restSeconds:45});expect(after.dailyLogs).toEqual(before.dailyLogs);expect(after.workouts).toEqual(before.workouts);await page.reload();await page.goto('routines/workouts/edit?id=w&routine=r&placement=p');await expect(page.getByLabel('Seconds per Set')).toHaveValue('30');await expect(page.getByLabel('Rest between sets (seconds)')).toHaveValue('45');
});


test('failed saves keep catalog configuration intact; retry and repeated clicks add one placement only',async({page})=>{
 await seedWellnessAppearance(page,'light');await catalog(page);await page.getByLabel('Search exercises').fill('barbell bench');await page.getByRole('button',{name:'Configure Barbell Bench Press',exact:true}).click();await page.getByLabel('Number of Sets').fill('2');await page.getByLabel('Reps per Set',{exact:true}).fill('8');const before=await read(page);
 await page.evaluate(()=>{(window as any).restoreCatalogStorage=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='workout-tracker-data')throw Error('Synthetic denied write');return (window as any).restoreCatalogStorage.call(this,key,value);};});
 await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Changes were not saved');expect(await read(page)).toEqual(before);await expect(page.getByLabel('Number of Sets')).toHaveValue('2');
 await page.evaluate(()=>{Storage.prototype.setItem=(window as any).restoreCatalogStorage;delete (window as any).restoreCatalogStorage;});
 await page.getByRole('button',{name:'Save Exercise',exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});await expect(page).toHaveURL(/routines$/);
 const after=await read(page);expect(after.routines.r.placements.length).toBe((before.routines.r.placements?.length ?? 1)+1);expect(Object.values(after.workouts).filter((w:any)=>w.catalogId==='catalog:barbell-bench-press')).toHaveLength(1);
});

test('catalog browsing remains local while offline and invalid routine context has a safe fallback',async({page,context})=>{
 await seedWellnessAppearance(page,'light');await catalog(page);const before=await read(page);await context.setOffline(true);await page.getByLabel('Search exercises').fill('rdl');await expect(page.getByRole('button',{name:'Configure Romanian Deadlift',exact:true})).toBeVisible();await context.setOffline(false);
 await page.goto('routines/exercises/add?routine=missing');await expect(page.getByRole('alert')).toContainText('no longer exists');expect(await read(page)).toEqual(before);
});
