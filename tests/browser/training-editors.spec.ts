import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {seedWellnessAppearance} from '../fixtures/appearance-wellness';

test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});
const data=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('workout-tracker-data')!));
for(const theme of ['dark','light'])test(`${theme}: new/edit workout and routine pages preserve essential flows`,async({page})=>{
 test.setTimeout(90000);await seedWellnessAppearance(page,theme);await page.goto('./');
 const screenshot=async(name:string)=>{await page.evaluate(()=>document.fonts.ready);const dir='docs/review/training-editors';fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:`${dir}/${name}-${theme}.png`,animations:'disabled'});};
 const contained=async()=>{
  const panel=page.locator('[data-form-page], [role="dialog"]');await expect(panel.locator('.training-editor')).toBeVisible();
  const box=await panel.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(390);
  expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await panel.locator('.editor-primary').scrollIntoViewIfNeeded();await expect(panel.locator('.editor-primary')).toBeInViewport();
  await expect.poll(()=>page.locator('main').evaluate(el=>getComputedStyle(el).overflowY)).toBe('auto');
 };
 await page.getByRole('button',{name:'Edit Push-ups',exact:true}).click();
 let dialog=page.getByRole('region', {name:'Edit Exercise',exact:true});
 await expect(dialog.getByLabel('Workout Name')).toHaveValue('Push-ups');await expect(dialog.getByLabel('Reps per Set',{exact:true})).toHaveValue('20');await expect(dialog.getByLabel('Number of Sets')).toHaveValue('1');await expect(dialog.getByRole('button',{name:'Monday',exact:true})).toHaveCount(0);
 await contained();if(theme==='dark')await screenshot('edit-workout');
 const before=await data(page);await dialog.getByLabel('Workout Name').fill('Discarded');await dialog.getByRole('button',{name:'Cancel',exact:true}).click();expect(await data(page)).toEqual(before);
 await page.getByRole('button',{name:'Edit Push-ups',exact:true}).click();dialog=page.locator('[data-form-page], [role="dialog"]');
 // Reopening hydrates the existing values after the routed editor mounts.
 // Wait for that prefill before fill selects/replaces the input text.
 await expect(dialog.getByLabel('Workout Name')).toHaveValue('Push-ups');
 await dialog.getByLabel('Workout Name').fill('Push-ups updated');
 await expect(dialog.getByLabel('Workout Name')).toHaveValue('Push-ups updated');await dialog.getByLabel('Workout color').selectOption('blue');await dialog.getByLabel('Weight (lbs) - Optional').fill('12');
 await dialog.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(dialog).toBeHidden();let saved=await data(page);expect(saved.routines.r.placements.find((p:any)=>p.exerciseId==='w')).toMatchObject({name:'Push-ups updated',color:'blue',weightLbs:12});expect(saved.workouts.w).toEqual(before.workouts.w);expect(saved.dailyLogs).toEqual(before.dailyLogs);
 await page.getByRole('button',{name:'Edit Push-ups updated',exact:true}).click();page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Delete Exercise',exact:true}).click();expect((await data(page)).workouts.w).toBeDefined();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete Exercise',exact:true}).click();expect((await data(page)).workouts.w).toBeDefined();expect((await data(page)).routines.r.placements).toHaveLength(0);
 await page.getByRole('button',{name:'Add new workout',exact:true}).click();dialog=page.getByRole('region', {name:'Add Exercise',exact:true});
 await expect(dialog.getByLabel('Workout Name')).toHaveValue('');await expect(dialog.getByLabel('Reps per Set',{exact:true})).toHaveValue('10');await expect(dialog.getByLabel('Number of Sets')).toHaveValue('1');await expect(dialog.getByRole('button',{name:'Save Exercise',exact:true})).toBeDisabled();
 await contained();if(theme==='dark')await screenshot('new-workout');
 await dialog.getByLabel('Workout Name').fill('New exercise');await dialog.getByLabel('Reps per Set',{exact:true}).fill('10');await dialog.getByLabel('Number of Sets').fill('3');await dialog.getByLabel('Weight (lbs) - Optional').fill('20');
 // Simulate the existing visual-viewport keyboard path; no arbitrary delay.
 await page.evaluate(()=>{Object.defineProperties(window.visualViewport!,{height:{configurable:true,value:430},offsetTop:{configurable:true,value:40}});window.visualViewport!.dispatchEvent(new Event('resize'));});
 await dialog.getByLabel('Number of Sets').focus();await page.setViewportSize({width:390,height:430});await dialog.getByLabel('Number of Sets').scrollIntoViewIfNeeded();await expect(dialog.getByLabel('Number of Sets')).toBeInViewport();await dialog.getByRole('button',{name:'Save Exercise',exact:true}).scrollIntoViewIfNeeded();await expect(dialog.getByRole('button',{name:'Save Exercise',exact:true})).toBeInViewport();
 await page.evaluate(()=>{Object.defineProperties(window.visualViewport!,{height:{configurable:true,value:844},offsetTop:{configurable:true,value:0}});window.visualViewport!.dispatchEvent(new Event('resize'));});
 await page.setViewportSize({width:390,height:844});await dialog.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(dialog).toBeHidden();saved=await data(page);expect(Object.values(saved.workouts).find((w:any)=>w.name==='New exercise')).toMatchObject({dailyGoal:30,setsGoal:3,weightLbs:20});
 await page.goto('routines');await page.getByTestId('button-create-routine').click();dialog=page.getByRole('region', {name:'Create Routine',exact:true});await contained();
 await expect(dialog.getByTestId('button-save-routine')).toBeDisabled();await dialog.getByLabel('Routine Name').fill('Push Day');await dialog.getByRole('button',{name:'Weekdays',exact:true}).click();await expect(dialog).toContainText('5 training days selected');await dialog.getByRole('button',{name:'Clear Selection',exact:true}).click();await expect(dialog.getByTestId('button-save-routine')).toBeDisabled();
 for(const day of ['Monday','Wednesday','Friday'])await dialog.getByRole('button',{name:day,exact:true}).click();await expect(dialog).toContainText('3 training days selected');await screenshot('new-routine');
 await dialog.getByRole('button',{name:'Save Routine',exact:true}).click();await expect(dialog).toBeHidden();saved=await data(page);const routine:any=Object.values(saved.routines).find((r:any)=>r.name==='Push Day');expect(routine.selectedDays).toEqual([1,3,5]);
 await page.getByTestId(`button-edit-routine-${routine.id}`).click();dialog=page.getByRole('region', {name:'Edit Routine',exact:true});await expect(dialog.getByLabel('Routine Name')).toHaveValue('Push Day');await dialog.getByRole('button',{name:'Weekends',exact:true}).click();await dialog.getByRole('button',{name:'Save Routine',exact:true}).click();await expect(dialog).toBeHidden();expect((await data(page)).routines[routine.id].selectedDays).toEqual([0,6]);
 const last=await data(page);await page.getByTestId(`button-edit-routine-${routine.id}`).click();await page.getByLabel('Routine Name').fill('Discard routine draft');await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await data(page)).toEqual(last);
});
