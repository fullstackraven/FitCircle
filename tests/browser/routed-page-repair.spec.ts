import { test,expect } from '@playwright/test';
import fs from 'node:fs';
import { seedWellnessAppearance } from '../fixtures/appearance-wellness';
import { routedFormCases } from '../fixtures/routed-form-cases';
test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});

for(const mode of ['light','dark','system'])test(`${mode}: every migrated editor uses the integrated page shell`,async({page})=>{
 test.setTimeout(120000);await seedWellnessAppearance(page,mode);
 if(mode==='system')await page.emulateMedia({colorScheme:'light'});
 for(const [path,title]of routedFormCases){
  await page.goto(path.slice(1));await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  const body=page.locator('.form-page-content');await expect(body).toHaveCount(1);await expect(page.getByRole('dialog')).toHaveCount(0);
  const geometry=await body.evaluate(el=>{const css=getComputedStyle(el),bounds=el.getBoundingClientRect(),parent=el.closest('.form-page')!.getBoundingClientRect();return {background:css.backgroundColor,border:css.borderTopWidth,radius:css.borderRadius,position:css.position,maxWidth:css.maxWidth,maxHeight:css.maxHeight,overflow:css.overflowY,display:css.display,width:bounds.width,pageWidth:parent.width};});
  expect(geometry,path).toMatchObject({background:'rgba(0, 0, 0, 0)',border:'0px',radius:'0px',position:'static',maxWidth:'none',maxHeight:'none',overflow:'visible',display:'grid'});
  expect(geometry.width,path).toBeCloseTo(geometry.pageWidth,0);
  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
   const margin=await page.locator('.form-page').boundingBox();expect(margin!.x,path).toBeCloseTo(16,0);expect(margin!.width,path).toBeCloseTo(width-32,0);
  }
  const actions=body.locator('.form-action-primary > button');for(const action of await actions.all()){await action.scrollIntoViewIfNeeded();await expect(action,path).toBeInViewport();expect((await action.boundingBox())!.width,path).toBeCloseTo((await body.boundingBox())!.width,0);}
  await expect(page.getByRole('button',{name:'Back',exact:true})).toBeInViewport();
  if(mode==='system'){await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-appearance','dark');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-appearance','light');}
  if(mode!=='system'&&['/cardio/add','/food-tracker/custom/new','/hydration/add','/routines/edit?id=r'].includes(path)){
   await page.locator('main').evaluate(el=>{el.scrollTop=0;});await page.evaluate(()=>document.fonts.ready);fs.mkdirSync('docs/review/routed-page-repair',{recursive:true});await page.screenshot({path:`docs/review/routed-page-repair/${path.split('/')[1]}-${mode}.png`,animations:'disabled'});
  }
 }
});

for(const origin of ['','routines','calendar','wellness','reminders'])test(`Profile controls work after SPA navigation from ${origin||'Home'}`,async({page})=>{
 await seedWellnessAppearance(page,'light');await page.goto(origin||'./');
 await page.getByRole('button',{name:'Open Menu',exact:true}).click();await page.getByRole('button',{name:/My Fitness Profile/}).click();
 const profileURL=page.url();await expect(page.getByRole('heading',{name:'My Fitness Profile',exact:true})).toBeVisible();
 const retained=await page.evaluate(()=>({profile:JSON.parse(localStorage.getItem('fitcircle_profile')!),measurements:localStorage.getItem('fitcircle_measurements_history'),workouts:localStorage.getItem('workout-tracker-data')}));
 await page.getByRole('button',{name:'Edit Profile',exact:true}).click();await expect(page).toHaveURL(/profile\/edit/);await page.getByLabel('Name',{exact:true}).fill('Repaired profile');await page.getByRole('button',{name:'Save Profile',exact:true}).click();await expect(page).toHaveURL(profileURL);expect(await page.evaluate(()=>localStorage.getItem('fitcircle_username'))).toBe('Repaired profile');
 await page.getByRole('button',{name:/^Date of Birth/}).click();await page.getByLabel('Date of Birth',{exact:true}).fill('1990-10-18');await page.getByRole('button',{name:'Save Profile',exact:true}).click();await expect(page).toHaveURL(profileURL);
 await page.getByRole('button',{name:'Edit Fitness Goals',exact:true}).click();await page.getByLabel('Primary objective',{exact:true}).selectOption('Build strength');await page.getByLabel('Fitness Goal',{exact:true}).fill('Preserved training goal');await page.getByRole('button',{name:'Save Profile',exact:true}).click();await expect(page).toHaveURL(profileURL);
 await page.getByRole('button',{name:'Fitness Goals',exact:true}).click();await expect(page.getByLabel('Fitness Goal',{exact:true})).toHaveValue('Preserved training goal');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(profileURL);
 await page.getByRole('button',{name:'View Workout Statistics',exact:true}).click();await expect(page.getByRole('heading',{name:'Workout Statistics',exact:true})).toBeVisible();await page.getByRole('button',{name:'Back to Profile',exact:true}).click();await expect(page).toHaveURL(profileURL);
 await page.getByRole('button',{name:/^Body Measurements/}).click();await expect(page.getByRole('heading',{name:'Measurements',exact:true})).toBeVisible();await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(profileURL);
 expect(await page.evaluate(()=>localStorage.getItem('fitcircle_fitness_goal'))).toBe('Preserved training goal');expect(await page.evaluate(()=>localStorage.getItem('fitcircle_measurements_history'))).toBe(retained.measurements);expect(await page.evaluate(()=>localStorage.getItem('workout-tracker-data'))).toBe(retained.workouts);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_profile')!));for(const [key,value]of Object.entries(retained.profile))expect(saved[key],key).toEqual(value);expect(saved.dateOfBirth).toBe('1990-10-18');
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/FitCircle/${origin}$`));
});

test('SPA transitions isolate Home, Routine, Food and Database form controllers',async({page})=>{
 await seedWellnessAppearance(page,'dark');await page.goto('./');await page.getByRole('button',{name:'Routines',exact:true}).click();await page.getByTestId('button-create-routine').click();await page.getByLabel('Routine Name').fill('SPA routine');await page.getByRole('button',{name:'Weekdays',exact:true}).click();await page.getByRole('button',{name:'Create Routine',exact:true}).click();await expect(page.getByText('SPA routine',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Edit Push-ups',exact:true}).click();await expect(page.getByLabel('Workout Name')).toHaveValue('Push-ups');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Logs',exact:true}).click();await page.getByTestId('card-food-tracker').click();await page.getByTestId('button-previous-day').click();await page.getByTestId('button-database').click();await page.getByTestId('button-edit-custom-appearance').click();await expect(page).toHaveURL(/food-database\/edit/);await page.locator('[data-form-page] input').first().fill('SPA database edit');await page.getByTestId('button-save-edit').click();await expect(page).toHaveURL(/food-database\?returnTo=/);
 await page.getByTestId('button-back').click();await expect(page).toHaveURL(/food-tracker\?date=2026-10-18$/);await page.getByTestId('button-add-breakfast').click();await expect(page).toHaveURL(/date=2026-10-18/);await page.getByTestId('input-search').fill('SPA database edit');await expect(page.getByTestId('button-add-custom-appearance')).toBeVisible();
});

test('Profile recovery controls preserve unreadable data and resume editing after Retry',async({page})=>{
 await seedWellnessAppearance(page,'dark');await page.goto('./');await page.getByRole('button',{name:'Open Menu',exact:true}).click();await page.getByRole('button',{name:/My Fitness Profile/}).click();
 const url=page.url();await page.evaluate(()=>{localStorage.setItem('fitcircle_profile','{unreadable');window.dispatchEvent(new Event('storage'));});
 await expect(page.getByRole('alert')).toContainText('could not be read safely');await expect(page.getByRole('button',{name:'Edit Profile',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Open Account Data',exact:true}).click();await expect(page).toHaveURL(/account-data/);expect(await page.evaluate(()=>localStorage.getItem('fitcircle_profile'))).toBe('{unreadable');
 await page.goto(url);await expect(page.getByRole('alert')).toContainText('could not be read safely');await page.evaluate(()=>localStorage.setItem('fitcircle_profile',JSON.stringify({age:31,retained:'keep'})));await page.getByRole('button',{name:'Retry',exact:true}).click();await page.getByRole('button',{name:'Edit Profile',exact:true}).click();await expect(page.getByLabel('Name',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(url);
});

test('zero meditation duration cannot start a timer',async({page})=>{
 await seedWellnessAppearance(page,'light');await page.goto('meditation');await page.getByTestId('button-start-meditation').click();await page.getByRole('listbox',{name:'Minutes',exact:true}).press('Home');await expect(page.getByRole('button',{name:'Start',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/meditation$/);
});

test('Profile validation and Back preserve unsaved values without partial writes',async({page})=>{
 await seedWellnessAppearance(page,'dark');await page.goto('./');await page.getByRole('button',{name:'Open Menu',exact:true}).click();await page.getByRole('button',{name:/My Fitness Profile/}).click();const origin=page.url();
 const before=await page.evaluate(()=>({profile:localStorage.getItem('fitcircle_profile'),name:localStorage.getItem('fitcircle_username')}));
 await page.getByRole('button',{name:'Edit Profile',exact:true}).click();await page.getByLabel('Name',{exact:true}).fill('Unsaved profile name');await page.getByLabel('Date of Birth',{exact:true}).fill('2999-01-01');await page.getByRole('button',{name:'Save Profile',exact:true}).click();await expect(page.getByRole('alert')).toContainText('not in the future');
 expect(await page.evaluate(()=>({profile:localStorage.getItem('fitcircle_profile'),name:localStorage.getItem('fitcircle_username')}))).toEqual(before);
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Unsaved profile name');
 page.once('dialog',d=>d.dismiss());await page.goBack();await expect(page).toHaveURL(/profile\/edit$/);await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Unsaved profile name');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(origin);expect(await page.evaluate(()=>({profile:localStorage.getItem('fitcircle_profile'),name:localStorage.getItem('fitcircle_username')}))).toEqual(before);
});

test('nested Food Cancel returns preserve the diary date',async({page})=>{
 await seedWellnessAppearance(page,'light');
 await page.goto('food-tracker?date=2026-10-18');const records=await page.evaluate(()=>localStorage.getItem('fitcircle_food_2026-10-18'));await page.getByTestId('button-add-breakfast').click();await page.getByRole('button',{name:'Scan Barcode',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/food-tracker\/add/);await page.getByRole('button',{name:'Create Custom Food',exact:true}).click();await page.getByTestId('input-custom-name').fill('Cancelled food');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/food-tracker\/add/);await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(/food-tracker\?date=2026-10-18$/);expect(await page.evaluate(()=>localStorage.getItem('fitcircle_food_2026-10-18'))).toBe(records);
});

test('a bookmarked historical Food Entry returns to its diary date after save and refresh',async({page})=>{
 await seedWellnessAppearance(page,'light');await page.clock.fastForward(24*60*60*1000);await page.goto('food-tracker/entry/edit?id=logged-appearance&date=2026-10-19');await expect(page.getByTestId('input-edit-servings')).toHaveValue('2');await page.getByTestId('input-edit-servings').fill('3');await page.getByTestId('button-save-edit-entry').click();await expect(page).toHaveURL(/food-tracker\?date=2026-10-19$/);await page.reload();await page.getByTestId('button-add-breakfast').click();await expect(page).toHaveURL(/date=2026-10-19/);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_food_2026-10-19')!).find((entry:any)=>entry.id==='logged-appearance').servings)).toBe(3);
});

test('long custom-food pages keep the complete header and Back target visible while scrolling',async({page})=>{
 await seedWellnessAppearance(page,'dark');
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});await page.goto('food-tracker/custom/new');const title=page.getByRole('heading',{name:'Create Custom Food',exact:true}),back=page.getByRole('button',{name:'Back',exact:true});await expect(title).toBeVisible();
  const before=await back.boundingBox();await page.getByTestId('button-save-custom').scrollIntoViewIfNeeded();await expect(back).toBeInViewport({ratio:1});await expect(title).toBeInViewport({ratio:1});expect(await back.boundingBox()).toEqual(before);expect(before!.y).toBeGreaterThanOrEqual(0);expect(before!.height).toBeGreaterThanOrEqual(44);
  await page.locator('main').evaluate(el=>{el.scrollTop=0;});await expect(back).toBeInViewport({ratio:1});
 }
});
