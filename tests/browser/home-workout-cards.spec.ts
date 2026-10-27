import {test,expect} from '@playwright/test';
test.use({reducedMotion:'reduce',viewport:{width:390,height:844},timezoneId:'America/New_York'});
for(const theme of ['dark','light']) test(`Home workout cards ${theme}`,async({page})=>{
 await page.clock.install({time:new Date('2026-10-27T12:00:00-04:00')});
 await page.goto('profile');
 await page.evaluate(theme=>{
  localStorage.setItem('fitcircle_appearance',theme);
  localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{a:{id:'a',name:'Push-ups',color:'green',dailyGoal:20,setsGoal:2,count:0},b:{id:'b',name:'Long dumbbell bench press workout',color:'blue',dailyGoal:100,setsGoal:4,weightLbs:40,count:0}},dailyLogs:{},routines:{},journalEntries:{},lastDate:'2026-10-27'}));
 },theme);
 await page.goto('./');
 const card=page.getByTestId('home-workout-a');const ring=card.getByRole('button',{name:/Record a set/});
 await expect(card.getByText('Sets',{exact:true})).toBeVisible();
 await ring.click();await expect(card).toContainText('10 / 20 reps');await expect(ring).toContainText('1/2');
 await ring.click();await ring.click();await expect(ring).toContainText('2/2');await expect(card).toContainText('20 / 20 reps');
 await card.getByRole('heading').click();await expect(ring).toContainText('2/2');
 await card.getByTitle('Undo last set').click();await expect(ring).toContainText('1/2');
 await expect(page.getByTestId('home-workout-b')).toContainText('40 lbs');
 await card.scrollIntoViewIfNeeded();
 await expect(card.locator('..')).toHaveScreenshot(`home-workout-cards-${theme}.png`);
 await page.setViewportSize({width:320,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
 const a=await card.boundingBox(),b=await page.getByTestId('home-workout-b').boundingBox();expect(a!.height).toBe(b!.height);expect(b!.x+b!.width).toBeLessThanOrEqual(320);
 await page.getByTitle('Add new workout').scrollIntoViewIfNeeded();await expect(page.getByTitle('Add new workout')).toBeInViewport();
 await card.getByRole('button',{name:'Edit Push-ups',exact:true}).click();await expect(page.getByLabel('Number of Sets')).toHaveValue('2');
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Delete',exact:true}).click();await expect(card).toBeVisible();
 await card.getByRole('button',{name:'Edit Push-ups',exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete',exact:true}).click();await expect(card).toHaveCount(0);
});
test('holding the ring does not add a release click',async({page})=>{
 await page.clock.install({time:new Date('2026-10-27T12:00:00-04:00')});await page.goto('profile');
 await page.evaluate(()=>localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{a:{id:'a',name:'Push-ups',color:'green',dailyGoal:100,setsGoal:10,count:0}},dailyLogs:{},routines:{},journalEntries:{},lastDate:'2026-10-27'})));
 await page.goto('./');const ring=page.getByRole('button',{name:/Record a set for Push-ups/});
 await page.clock.pauseAt(new Date('2026-10-27T12:01:00-04:00'));
 await ring.dispatchEvent('mousedown');await page.clock.runFor(650);
 const before=await ring.getAttribute('aria-label');expect(before).toContain('1 of 10');
 await ring.dispatchEvent('mouseup');await ring.dispatchEvent('click');await expect(ring).toHaveAttribute('aria-label',before!);
 await ring.click();await expect(ring).toHaveAttribute('aria-label',/2 of 10/);
});
