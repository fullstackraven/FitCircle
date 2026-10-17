import { test, expect } from '@playwright/test';
const names = ['Synthetic push-ups', 'Synthetic squats', 'Synthetic long workout name with UnbrokenExerciseNameForWrapping'];
async function seed(page: import('@playwright/test').Page, many = false) {
  await page.goto('profile');
  await page.evaluate(({names,many}) => {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    localStorage.setItem('workout-tracker-data', JSON.stringify({ workouts:Object.fromEntries(names.slice(0,many?3:2).map((name,i)=>[String(i),{id:String(i),name,color:['green','blue','purple'][i],count:0,dailyGoal:20}])),
      routines:{r:{id:'r',name:'Synthetic legs routine',selectedDays:[0,1,2,3,4,5,6],createdAt:date}}, dailyLogs:{},journalEntries:{} }));
    localStorage.setItem('fitcircle_daily_quote', JSON.stringify({text:'Synthetic quiet quote for regression testing',author:'Synthetic author'}));
    localStorage.setItem('fitcircle_quote_date', date);
  },{names,many});
  await page.goto('./');
}
test('mobile Home prioritizes routine/session and preserves colored circular rep tracking, undo, hold and editing', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await seed(page);
  const heading = page.getByRole('heading',{name:"Today's Workout",exact:true});
  const start = page.getByRole('button',{name:'Start Workout Session',exact:true});
  const card = page.getByTestId('home-workout-0');
  const circle = card.getByRole('button',{name:/Record a rep/});
  const second = page.getByTestId('home-workout-1');
  const quote = page.getByRole('complementary',{name:'Quote of the Day'});
  await expect(quote).toContainText('Synthetic quiet quote');
  expect((await heading.boundingBox())!.y).toBeLessThan((await start.boundingBox())!.y);
  expect((await start.boundingBox())!.y).toBeLessThan((await circle.boundingBox())!.y);
  expect((await circle.boundingBox())!.width).toBe(114); // Previously 136px, ~16% smaller.
  const primary = await card.locator('svg circle').last().getAttribute('stroke');
  expect(await second.locator('svg circle').last().getAttribute('stroke')).not.toBe(primary);
  const rect = (await card.boundingBox())!;
  expect((await quote.boundingBox())!.y).toBeGreaterThanOrEqual(rect.y+rect.height);
  await expect(card).toContainText('Goal: 20 reps');
  await circle.click();
  await expect(circle).toHaveAttribute('aria-label',/1 of 20/);
  await card.getByTitle('Undo last rep').click(); await expect(circle).toHaveAttribute('aria-label',/0 of 20/);
  await circle.hover(); await page.mouse.down(); await page.waitForTimeout(750); await page.mouse.up();
  await expect.poll(async()=>Number((await circle.getAttribute('aria-label'))!.match(/: (\d+) of/)![1])).toBeGreaterThan(1);
  await page.getByRole('button',{name:`Edit ${names[0]}`,exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  await start.click(); await expect(page.getByTitle('Pause workout')).toBeVisible();
  await page.getByTitle('Pause workout').click(); await expect(page.getByTitle('Resume workout')).toBeVisible();
  await page.getByTitle('Resume workout').click(); await page.getByTitle('Reset without saving').click();
  await expect(start).toBeVisible();
  await quote.getByRole('button',{name:'Refresh quote'}).click();
  await expect(quote).not.toContainText('Synthetic quiet quote');
  await page.locator('.app-content').evaluate(el=>{el.scrollTop=0;});
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:'/tmp/home-workout-focused-mobile.png'});
});
test('multiple exercises and long names remain reachable on narrow and desktop Home', async ({page})=>{
  for (const width of [320,1440]) {
    await page.setViewportSize({width,height:900}); await seed(page,true);
    await expect(page.locator('[data-testid^="home-workout-"]')).toHaveCount(3);
    const last = page.getByTestId('home-workout-2');
    await expect(last.getByText(names[2],{exact:true})).toBeVisible();
    expect(await last.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.getByRole('button',{name:'Add new workout',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
    await page.getByTitle('Open Timer').click(); await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
    await page.locator('.app-content').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    const add = (await page.getByRole('button',{name:'Add new workout',exact:true}).boundingBox())!;
    expect(add.y+add.height).toBeLessThanOrEqual((await page.locator('.app-dock').boundingBox())!.y);
  }
});
