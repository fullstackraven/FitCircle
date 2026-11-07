import { test, expect } from '@playwright/test';
const key='fitcircle_routine_sort';
for(const theme of ['light','dark','system'])test(`${theme}: six sorting choices persist without mutating routines; menu supports Cancel, Escape and outside dismissal`,async({page})=>{
 await page.setViewportSize({width:320,height:844});await page.goto('profile');
 await page.evaluate(theme=>{
  const date=new Date();const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const rows=[['b','Beta','2026-01-01',[1,6]],['a','Alpha','2026-02-01',[0,4]],['c','Gamma','2026-01-15',[2,5]],['d','Legacy','2026-02-02',[]]];
  localStorage.setItem('fitcircle_appearance',theme);localStorage.setItem('fitcircle_routine_sort','invalid');
  localStorage.setItem('workout-tracker-data',JSON.stringify({routineSchedulingVersion:1,lastDate:day,workouts:{},routines:Object.fromEntries(rows.map(([id,name,createdAt,selectedDays])=>[id,{id,name,createdAt,selectedDays,placements:[]}])),dailyLogs:{},journalEntries:{}}));
 },theme);await page.goto('routines');await expect(page.getByRole('heading',{name:'Routines',exact:true})).toBeVisible();const raw=await page.evaluate(()=>localStorage.getItem('workout-tracker-data'));
 const order=()=>page.locator('[data-testid^="routine-card-"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-testid')!.replace('routine-card-','')));
 await expect.poll(order).toEqual(['b','c','a','d']);await expect(page.getByRole('heading',{name:'Routines',exact:true})).toBeVisible();await expect(page.getByText('My Routines',{exact:true})).toHaveCount(0);
 const trigger=page.getByRole('button',{name:'Sort Routines',exact:true});const bounds=(await trigger.boundingBox())!;expect(bounds.width).toBeGreaterThanOrEqual(44);expect(bounds.height).toBeGreaterThanOrEqual(44);expect(bounds.x).toBeLessThan((await page.getByTestId('button-create-routine').boundingBox())!.x);
 const cases=[['A–Z','name-asc',['a','b','c','d']],['Z–A','name-desc',['d','c','b','a']],['Newest First','created-desc',['d','a','c','b']],['Oldest First','created-asc',['b','c','a','d']],['Sunday → Saturday','days-asc',['a','b','c','d']],['Saturday → Sunday','days-desc',['b','c','a','d']]] as const;
 for(const [label,value,expected]of cases){
  await trigger.click();const dialog=page.getByRole('dialog',{name:'Sort Routines',exact:true});await dialog.getByRole('button',{name:label,exact:true}).click();await expect(dialog).toBeHidden();await expect.poll(order).toEqual(expected);expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(value);
  await page.reload();await expect.poll(order).toEqual(expected);expect(await page.evaluate(()=>localStorage.getItem('workout-tracker-data'))).toBe(raw);
 }
 await trigger.click();const dialog=page.getByRole('dialog',{name:'Sort Routines',exact:true});if(theme==='dark'){await expect(dialog).toHaveCSS('opacity','1');await page.screenshot({path:'/tmp/routine-sort-dark.png'});}await expect(dialog.getByRole('button',{name:'Saturday → Sunday',exact:true})).toHaveAttribute('aria-pressed','true');await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(trigger).toBeFocused();await expect.poll(order).toEqual(['b','c','a','d']);
 await trigger.click();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
 await trigger.click();await page.mouse.click(2,2);await expect(dialog).toBeHidden();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('days-desc');
 await page.goto('./');await page.getByRole('button',{name:'Routines',exact:true}).click();await expect.poll(order).toEqual(['b','c','a','d']);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByTestId('routine-header-b').click();await expect(page.getByTestId('button-add-workout-b')).toBeVisible();await page.getByTestId('button-edit-routine-b').click();await expect(page.getByLabel('Routine Name')).toHaveValue('Beta');await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('workout-tracker-data'))).toBe(raw);
});
