import { routedFormCases as routes } from '../fixtures/routed-form-cases';
import { test, expect, type Page } from '@playwright/test';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';

test.use({ viewport:{width:390,height:844},timezoneId:'America/New_York' });
async function seed(page:Page) {await seedWellnessAppearance(page,'dark');}
test('goal forms are normal routes, save and cancel back to their owners',async({page})=>{
 await seed(page);
 for(const owner of ['cardio','meditation','hydration','fasting']){
  await page.goto(owner);await page.getByRole('button',{name:'Goal',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/${owner}/goal$`));
  await expect(page.locator('[data-form-page]')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.app-dock')).toBeEmpty();
  const field=page.locator('[data-form-page] input[type=number]').first();await field.fill(owner==='hydration'?'80':'22');
  await page.getByRole('button',{name:owner==='fasting'?'Save Settings':'Save Goal',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/${owner}$`));
  await page.getByRole('button',{name:'Goal',exact:true}).click();await expect(field).toHaveValue(owner==='hydration'?'80':'22');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/${owner}$`));
 }
});
test('workout/routine routes retain editing, direct refresh and unsaved Back protection',async({page})=>{
 await seed(page);await page.goto('./');await page.getByRole('button',{name:'Edit Push-ups',exact:true}).click();
 await expect(page).toHaveURL(/workouts\/edit\?id=w/);
 await expect(page.getByLabel('Workout Name')).toHaveValue('Push-ups');await page.reload();
 await expect(page.getByLabel('Workout Name')).toHaveValue('Push-ups');await page.getByLabel('Workout Name').fill('Route edited');
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByLabel('Workout Name')).toHaveValue('Route edited');
 await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);
 await page.goto('routines');await page.getByTestId('button-create-routine').click();await expect(page).toHaveURL(/routines\/new$/);
 await page.getByLabel('Routine Name').fill('Route routine');await page.getByRole('button',{name:'Weekdays',exact:true}).click();
 await page.getByRole('button',{name:'Save Routine',exact:true}).click();await expect(page).toHaveURL(/routines$/);
});


for(const mode of ['light','dark'])test(`${mode}: all registered editor routes are normal mobile pages`,async({page})=>{
 test.setTimeout(120000);await seedWellnessAppearance(page,mode);
 for(const [path,title]of routes){
  await page.goto(path.slice(1));await expect(page.getByRole('heading',{name:title,exact:true}),path).toBeVisible();
  await expect(page.locator('[data-form-page]'),path).toHaveCount(1);await expect(page.getByRole('dialog'),path).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
  await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);await page.setViewportSize({width:390,height:844});
  if(path==='/workouts/edit?id=w'){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`docs/review/routed-forms/workout-${mode}.png`,animations:'disabled'});}
 }
});

test('all record edits reject missing ids without writing personal records',async({page})=>{
 await seed(page);
 const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key==='workout-tracker-data'||key.startsWith('fitcircle_food_')||key==='fitcircle_fasting_logs')));
 for(const path of ['workouts/edit','routines/edit','cardio/edit','hydration/edit','meditation/edit','fasting/edit','food-tracker/entry/edit','food-database/edit','food-tracker/custom/edit','food-tracker/entry/new']){
  await page.goto(`${path}?id=does-not-exist`);await expect(page.getByRole('alert')).toContainText(/no longer exists|unavailable/);await expect(page.locator('[data-form-page]')).toHaveCount(0);
 }
 expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key==='workout-tracker-data'||key.startsWith('fitcircle_food_')||key==='fitcircle_fasting_logs')))).toEqual(before);
});

test('wellness entry pages create and edit records using the existing handlers',async({page})=>{
 await seed(page);
 await page.goto('cardio/add');const cardio=page.locator('[data-form-page]');await cardio.getByRole('combobox').click();await page.getByRole('option',{name:'Walking',exact:true}).click();await cardio.locator('input[type=number]').first().fill('12');
 await cardio.getByRole('button',{name:/Add Cardio|Save/i}).last().click();await expect(page).toHaveURL(/cardio$/);
 await page.goto('cardio/edit?id=cardio');await page.locator('[data-form-page] input[type=number]').first().fill('80');await page.getByRole('button',{name:/Save Changes|Update Entry/}).click();await expect(page).toHaveURL(/cardio$/);
 await page.goto('meditation');await page.getByLabel('Custom duration (minutes)').fill('7');await page.getByRole('button',{name:'Add',exact:true}).click();await expect(page).toHaveURL(/meditation$/);
 await page.goto('meditation/edit?id=practice');await page.locator('#edit-meditation-minutes').fill('12');await page.getByRole('button',{name:'Save Changes',exact:true}).click();await expect(page).toHaveURL(/meditation$/);
 await page.goto('meditation');await page.getByTestId('button-start-meditation').click();await page.getByRole('button',{name:'Start',exact:true}).click();await expect(page).toHaveURL(/meditation$/);await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
 await page.goto('hydration/add');await page.getByLabel('Amount (oz)',{exact:true}).fill('8');await page.getByRole('button',{name:/^Add/}).click();await expect(page).toHaveURL(/hydration$/);
 await page.goto('hydration/edit?id=intake');await page.locator('[data-form-page] input[type=number]').fill('20');await page.getByRole('button',{name:/Save Changes|Update/}).click();await expect(page).toHaveURL(/hydration$/);
 await page.goto('fasting/add');const dates=page.locator('[data-form-page] input[type=date]'),times=page.locator('[data-form-page] input[type=time]');await dates.nth(0).fill('2026-10-18');await dates.nth(1).fill('2026-10-19');await times.nth(0).fill('20:00');await times.nth(1).fill('10:00');await page.getByRole('button',{name:/^Log Fast$|^Save Fast$/}).click();await expect(page).toHaveURL(/fasting$/);
 await page.goto('fasting/edit?id=fast');await page.locator('[data-form-page] input[type=time]').nth(1).fill('09:00');await page.getByRole('button',{name:/Save Changes|Update Fast/}).click();await expect(page).toHaveURL(/fasting$/);
 const data=await page.evaluate(()=>({cardio:JSON.parse(localStorage.getItem('fitcircle_cardio_data')!),meditation:JSON.parse(localStorage.getItem('fitcircle_meditation_logs')!),hydration:JSON.parse(localStorage.getItem('fitcircle_hydration_data')!),fasting:JSON.parse(localStorage.getItem('fitcircle_fasting_logs')!)}));
 expect(data.cardio.dailyLogs['2026-10-19'].sessions.find((s:any)=>s.id==='cardio').duration).toBe(80);
 expect(data.meditation.find((s:any)=>s.id==='practice').duration).toBe(12);expect(data.hydration.logs['2026-10-19'].entries.find((e:any)=>e.id==='intake').amount).toBe(20);expect(data.fasting.find((f:any)=>f.id==='fast').duration).toBe(900);
});

test('food picker, scanner, custom product and diary editors retain nested context',async({page})=>{
 await seed(page);await page.goto('food-tracker');await page.getByRole('button',{name:'Add Food to Lunch',exact:true}).click();
 await expect(page).toHaveURL(/food-tracker\/add\?.*meal=lunch/);await page.getByRole('button',{name:'Most Frequent',exact:true}).click();await expect(page.locator('.your-food-card')).not.toHaveCount(0);
 await page.getByRole('button',{name:'Scan Barcode',exact:true}).click();await expect(page).toHaveURL(/food-tracker\/scan/);
 await page.getByLabel('Manual barcode',{exact:true}).fill('3017620422003');await page.getByRole('button',{name:'Find Product',exact:true}).click();
 await expect(page).toHaveURL(/food-tracker\/entry\/new/);await page.reload();await expect(page.getByTestId('input-add-servings')).toHaveValue('1');
 await page.getByTestId('input-add-servings').fill('2');await page.getByTestId('button-save-add-entry').click();await expect(page).toHaveURL(/food-tracker$/);
 let entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_food_2026-10-19')!));expect(entries.at(-1).meal).toBe('lunch');expect(entries.at(-1).servings).toBe(2);
 await page.goto('food-tracker/entry/edit?id=logged-appearance&date=2026-10-19');await page.getByTestId('input-edit-servings').fill('3');await page.getByTestId('button-save-edit-entry').click();await expect(page).toHaveURL(/food-tracker$/);
 await page.getByRole('button',{name:'Add Food to Breakfast',exact:true}).click();await page.getByRole('button',{name:'Create Custom Food',exact:true}).click();
 await page.getByTestId('input-custom-name').fill('Routed food');for(const [field,value]of [['calories','120'],['carbs','20'],['protein','5'],['fat','2']])await page.getByTestId(`input-custom-${field}`).fill(value);
 await page.getByTestId('button-save-custom').click();await expect(page).toHaveURL(/food-tracker\/entry\/new/);await page.getByTestId('button-save-add-entry').click();await expect(page).toHaveURL(/food-tracker$/);
 await page.goto('food-tracker/custom/edit?id=custom-appearance');await expect(page.getByTestId('input-custom-name')).toHaveValue('Synthetic oats');await page.getByTestId('input-custom-name').fill('Routed oats');await page.getByTestId('button-save-custom').click();await expect(page).toHaveURL(/food-tracker$/);
 await page.goto('food-database/edit?id=custom-appearance');await expect(page.locator('[data-form-page] input').first()).toHaveValue('Routed oats');await page.locator('[data-form-page] input').first().fill('Edited in database');await page.getByRole('button',{name:/Save Changes|^Save$/}).click();await expect(page).toHaveURL(/food-database$/);
 entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_food_2026-10-19')!));expect(entries.find((e:any)=>e.id==='logged-appearance').servings).toBe(3);expect(entries.some((e:any)=>e.name==='Routed food')).toBe(true);
});

test('remaining editors save duration, supplement, profile and goals',async({page})=>{
 await seed(page);
 await page.goto('dynamic-overview/2026-10-19/duration');await page.getByTestId('input-duration-minutes').fill('15');await page.getByTestId('button-save-duration').click();await expect(page).toHaveURL(/dynamic-overview\/2026-10-19$/);
 await page.goto('supplements-page');await page.getByRole('button',{name:'Add Supplement',exact:true}).first().click();await expect(page).toHaveURL(/supplements-page\/new$/);await page.locator('#supplement-name').fill('Routed supplement');await page.getByRole('combobox').click();await page.getByRole('option',{name:'mg (milligrams)',exact:true}).click();await page.locator('#amount').fill('200');await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Add Supplement',exact:true}).click()]);await expect(page).toHaveURL(/supplements-page$/);
 await page.goto('profile/edit');await page.getByLabel('Name',{exact:true}).fill('Routed person');await page.getByRole('button',{name:'Save Profile',exact:true}).click();await expect(page).toHaveURL(/profile$/);
 await page.getByRole('button',{name:'Edit Fitness Goals',exact:true}).click();await expect(page).toHaveURL(/profile\/goals$/);await page.getByLabel('Fitness Goal',{exact:true}).fill('Routed goal');await page.getByRole('button',{name:'Save Profile',exact:true}).click();await expect(page).toHaveURL(/profile$/);
 expect(await page.evaluate(()=>localStorage.getItem('fitcircle_username'))).toBe('Routed person');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_supplements')!).some((s:any)=>s.name==='Routed supplement'))).toBe(true);
});

test('nested Cardio type returns to the unfinished Add Cardio page without losing its draft',async({page})=>{
 await seed(page);await page.goto('cardio');await page.getByRole('button',{name:'Add Cardio',exact:true}).click();await page.locator('[data-form-page] input[type=number]').first().fill('24');
 await page.locator('[data-form-page] button').filter({has:page.locator('svg.lucide-plus')}).first().click();await expect(page).toHaveURL(/cardio\/types\/new$/);
 await page.locator('[data-form-page] input').fill('Routed activity');await page.getByRole('button',{name:'Add Type',exact:true}).click();await expect(page).toHaveURL(/cardio\/add$/);await expect(page.locator('[data-form-page] input[type=number]').first()).toHaveValue('24');
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/cardio\/add$/);
 await page.getByRole('combobox').click();await page.getByRole('option',{name:'Routed activity',exact:true}).click();await page.getByRole('button',{name:'Add Cardio',exact:true}).click();await expect(page).toHaveURL(/cardio$/);
});

test('browser Back protects drafts, Cancel discards explicitly, and Home Timer remains a popup',async({page})=>{
 await seed(page);await page.goto('./');await page.getByRole('button',{name:'Add new workout',exact:true}).click();
 await page.getByLabel('Workout Name').fill('Unsaved Back draft');page.once('dialog',d=>d.dismiss());await page.goBack();
 await expect(page).toHaveURL(/workouts\/new/);await expect(page.getByLabel('Workout Name')).toHaveValue('Unsaved Back draft');
 page.once('dialog',d=>d.accept());await page.goBack();await expect(page).toHaveURL(/\/FitCircle\/$/);
 await page.getByRole('button',{name:'Add new workout',exact:true}).click();await page.getByLabel('Workout Name').fill('Created on page');
 await page.getByRole('button',{name:'Save Exercise',exact:true}).click();await expect(page).toHaveURL(/\/FitCircle\/$/);
 await expect(page.getByRole('button',{name:'Edit Created on page',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Routines',exact:true}).click();await page.getByTestId('routine-header-r').click();await page.getByTestId('button-add-workout-r').click();await page.getByRole('button',{name:'Add Created on page',exact:true}).click();await page.getByRole('button',{name:'Home',exact:true}).click();
 await page.getByRole('button',{name:'Edit Created on page',exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete Exercise',exact:true}).click();
 await expect(page).toHaveURL(/\/FitCircle\/$/);await expect(page.getByText('Created on page',{exact:true})).toHaveCount(0);
 await page.getByTitle('Open Timer').click();await expect(page.getByRole('dialog',{name:'Timer',exact:true})).toBeVisible();
 await expect(page.locator('[data-form-page]')).toHaveCount(0);await page.getByRole('dialog',{name:'Timer',exact:true}).getByRole('button',{name:'Close',exact:true}).click();
 await page.goto('routines/edit?id=r');await page.getByLabel('Routine Name').fill('Edited on page');await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('workout-tracker-data')!).routines.r.name)).toBe('Edited on page');
});

test('dropdown and button-only edits are protected before leaving the form',async({page})=>{
 await seed(page);await page.goto('cardio/add');await page.getByRole('combobox').click();await page.getByRole('option',{name:'Walking',exact:true}).click();
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/cardio\/add$/);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/cardio$/);
 await page.goto('hydration/add');await page.getByRole('button',{name:'Coffee',exact:true}).click();
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(/hydration\/add$/);
 await expect(page.getByRole('button',{name:'Coffee',exact:true})).toHaveAttribute('aria-pressed','true');
});
