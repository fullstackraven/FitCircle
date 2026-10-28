import {test,expect} from '@playwright/test';
import {visualRoutes} from '../fixtures/visual-routes';
import {seedWellnessAppearance,wellnessBytes} from '../fixtures/appearance-wellness';
import {pillGeometry} from '../fixtures/pill-geometry';
import fs from 'node:fs';
const protectedControls = JSON.parse(fs.readFileSync('tests/fixtures/protected-food-controls.json','utf8')) as Array<{theme:string;width:number;name:string;rect:unknown;style:Record<string,string>}>;

test.describe.configure({mode:'parallel'});
test.use({baseURL:'http://127.0.0.1:4184/FitCircle/',timezoneId:'America/New_York'});
for(const theme of ['dark','light'])for(const width of [320,390,1280]) {
 test(`all route controls use pill geometry: ${theme} ${width}`,async({page})=>{
  test.setTimeout(180000);await page.setViewportSize({width,height:844});await seedWellnessAppearance(page,theme);
  for(const [route,label] of visualRoutes){
   await page.goto(route==='/'?'./':route.slice(1));await expect(page.locator('h1').first()).toBeAttached();await expect(page.locator('#fitcircle-startup')).toHaveCount(0);
   await page.evaluate(()=>document.fonts.ready);
   expect.soft(await pillGeometry(page),`${label}: action geometry`).toEqual([]);
   expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label}: viewport`).toBe(true);
  }
 });
 if(width<=390) test(`search, protected food actions and conditional controls: ${theme} ${width}`,async({page})=>{
  test.setTimeout(120000);await page.setViewportSize({width,height:844});await seedWellnessAppearance(page,theme);
  const before=await wellnessBytes(page);
  const check=async()=>{expect(await pillGeometry(page)).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);};
  await page.goto('food-tracker');await page.getByRole('button',{name:'Add Food to Breakfast',exact:true}).click();
  const search=page.getByRole('textbox',{name:'Search foods'});await search.fill('Synthetic');await expect(page.getByTestId('button-clear-search')).toBeVisible();await page.getByTestId('button-clear-search').click();await expect(search).toHaveValue('');
  for(const expected of protectedControls.filter(r=>r.theme===theme&&r.width===width)){
   const actual=await page.getByRole('button',{name:expected.name,exact:true}).evaluate((el,keys)=>{const c=getComputedStyle(el),r=el.getBoundingClientRect();return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},style:Object.fromEntries(keys.map(k=>[k,c.getPropertyValue(k)]))};},Object.keys(expected.style));
   expect(actual).toEqual({rect:expected.rect,style:expected.style});
  }
  await check();
  await expect(search).toHaveCSS('border-top-left-radius','9999px');await search.focus();await expect(search).toBeFocused();
  await page.getByRole('button',{name:'Create Custom Food',exact:true}).click();await check();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.goto('routines');await page.getByTestId('routine-header-r').click();await check();await page.getByTestId('button-add-workout-r').click();await check();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.goto('calendar');await page.getByTestId('button-toggle-view').click();await check();await page.getByTestId('button-next-page').click();await check();
  for(const route of ['cardio','hydration','meditation','fasting']){await page.goto(route);await page.getByRole('button',{name:'Goal',exact:true}).click();await check();await page.getByRole('button',{name:'Cancel',exact:true}).click();}
  await page.goto('supplements-page');await page.getByRole('button',{name:'Manage Supplements',exact:false}).click();await check();await page.getByTitle('Edit supplement').click();await check();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.goto('food-database');await page.getByRole('textbox',{name:'Search foods'}).fill('Synthetic');await expect(page.getByRole('textbox',{name:'Search foods'})).toHaveCSS('border-top-left-radius','9999px');await check();
  await page.goto('journal-log');await page.getByRole('searchbox',{name:'Search journal'}).fill('appearance');await check();await page.getByRole('button',{name:'Clear search'}).click();await expect(page.getByRole('searchbox')).toHaveValue('');
  const after=await wellnessBytes(page);for(const key of ['workout-tracker-data','fitcircle_supplements','fitcircle_supplement_logs','fitcircle_energy_levels'])expect(after[key],key).toBe(before[key]);
 });
}

test('System appearance, keyboard focus and search preserve data without a second theme system',async({page})=>{
 await page.setViewportSize({width:320,height:844});await seedWellnessAppearance(page,'system');
 const before=await wellnessBytes(page);await page.goto('food-database');
 const input=page.getByRole('textbox',{name:'Search foods'});await input.fill('Synthetic');await input.focus();
 for(const colorScheme of ['light','dark'] as const){await page.emulateMedia({colorScheme});await expect(page.locator('html')).toHaveAttribute('data-appearance',colorScheme);await expect(input).toHaveValue('Synthetic');await expect(input).toBeFocused();expect(await pillGeometry(page)).toEqual([]);}
 const after=await wellnessBytes(page);for(const key of ['workout-tracker-data','fitcircle_supplements','fitcircle_supplement_logs','fitcircle_energy_levels'])expect(after[key],key).toBe(before[key]);
});
