import {test,expect} from '@playwright/test';
test.use({baseURL:'http://127.0.0.1:4184/FitCircle/',timezoneId:'America/New_York'});
test('mounted consumers subscribe to edits and persist interleaved journal and set actions',async({page})=>{
 await page.goto('profile');
 await page.evaluate(()=>localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{w:{id:'w',name:'Pushups',color:'green',count:0,dailyGoal:20,setsGoal:1}},dailyLogs:{},routines:{},journalEntries:{}})));
 await page.goto('./');
 await page.evaluate(async()=>{
  const mainSource=await (await fetch('/FitCircle/src/main.tsx')).text();
  const hookSource=await (await fetch('/FitCircle/src/hooks/use-workouts.ts')).text();
  const root=await import(/* @vite-ignore */ mainSource.match(/from "([^"]+react-dom_client\.js[^"]*)"/)![1]);
  const React=await import(/* @vite-ignore */ hookSource.match(/from "([^"]+react\.js[^"]*)"/)![1]);
  const hookURL='/FitCircle/src/hooks/use-workouts.ts';const {useWorkouts}=await import(/* @vite-ignore */ hookURL);
  const host=document.createElement('div');host.style.cssText='position:fixed;top:0;left:0;z-index:9999';document.body.append(host);
  function Probe(){const api=useWorkouts();return React.default.createElement('button',{id:'shared-probe',onClick:()=>{api.updateWorkout('w','From second consumer',20,30,[],'blue',2);api.addJournalEntry('2026-01-01','Retained journal');}},api.workouts.w?.name);}
  root.default.createRoot(host).render(React.default.createElement(Probe));
 });
 await page.locator('#shared-probe').click();await expect(page.getByRole('button',{name:'Edit From second consumer',exact:true})).toBeVisible();
 await page.getByRole('button',{name:/Record a set for From second consumer/}).click();
 const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('workout-tracker-data')!));expect(d.workouts.w.setsGoal).toBe(2);expect(d.journalEntries['2026-01-01'].text).toBe('Retained journal');expect(Object.values(d.dailyLogs)[0]).toMatchObject({w:{count:10,completedSets:1}});
});
test('failed saves keep the workout editor open and original records intact',async({page})=>{
 await page.goto('profile');await page.evaluate(()=>localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{w:{id:'w',name:'Pushups',color:'green',count:0,dailyGoal:20,setsGoal:1}},dailyLogs:{},routines:{},journalEntries:{}})));await page.goto('./');
 await page.getByRole('button',{name:'Edit Pushups',exact:true}).click();await page.getByLabel('Workout Name').fill('Unsaved');
 const before=await page.evaluate(()=>localStorage.getItem('workout-tracker-data'));
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('Synthetic denied write');};});
 await page.getByRole('button',{name:'Update Workout',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByLabel('Workout Name')).toHaveValue('Unsaved');expect(await page.evaluate(()=>localStorage.getItem('workout-tracker-data'))).toBe(before);
});
test('completed one-set Pushups adopts two sets only after confirmation without losing reps',async({page})=>{
 await page.goto('profile');await page.evaluate(()=>localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{w:{id:'w',name:'Pushups',color:'green',count:0,dailyGoal:20,setsGoal:1}},dailyLogs:{},routines:{},journalEntries:{}})));await page.goto('./');
 const circle=page.getByRole('button',{name:/Record a set for Pushups/});await circle.click();await expect(circle).toHaveAttribute('aria-label',/1 of 1/);
 await page.getByRole('button',{name:'Edit Pushups',exact:true}).click();await page.getByLabel('Number of Sets').fill('2');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Update Workout',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Update Workout',exact:true}).click();await expect(circle).toHaveAttribute('aria-label',/0 of 2/);
 await circle.click();await expect(circle).toHaveAttribute('aria-label',/1 of 2/);
 const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('workout-tracker-data')!));expect(Object.values(d.dailyLogs)[0]).toMatchObject({w:{count:30,carriedReps:20,completedSets:1,setsGoalAtTime:2}});
});
