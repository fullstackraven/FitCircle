import { test, expect } from '@playwright/test';
test.use({timezoneId:'America/New_York',viewport:{width:390,height:844}});
for(const theme of ['dark','light','system']) test(`${theme}: completed today inherits green tile, incomplete and recovery today retain indicators`,async({page})=>{
  await page.emulateMedia({colorScheme:'light'});
  await page.clock.install({time:new Date('2026-10-26T12:00:00-04:00')});
  await page.goto('profile');
  await page.evaluate(theme=>{
    localStorage.setItem('fitcircle_appearance',theme);
    localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{w:{id:'w',name:'Test',color:'green',count:10,dailyGoal:10,scheduledDays:[0,1,2,3,4,5,6]}},dailyLogs:{'2026-10-26':{w:10}},lastDate:'2026-10-26',routines:{},journalEntries:{}}));
  },theme);
  await page.goto('calendar');
  const today=page.locator('[aria-current="date"]');
  await expect(today).toHaveText('26');
  await expect(today).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(today).toHaveCSS('color','rgb(0, 0, 0)');
  await expect(today.locator('..')).toContainText('Workouts complete');
  const shadow=await today.locator('..').evaluate(el=>getComputedStyle(el).boxShadow);
  // Existing Light palette intentionally disables glows; Dark keeps its glow.
  if(theme === 'dark') expect(shadow).not.toBe('none');
  else expect(shadow).toBe('none');
  await expect(today.locator('..')).toHaveCSS('background-color','rgb(0, 255, 65)');
  await page.goto('workout-statistics');
  const monthly=page.getByRole('region',{name:'Monthly Statistics',exact:true});
  await expect(monthly.getByText('3.8%',{exact:true})).toBeVisible();
  expect(Number(await monthly.getByRole('progressbar',{name:'Monthly Consistency'}).getAttribute('value'))).toBeCloseTo(100/26);
  await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('workout-tracker-data')!);d.workouts.w.count=0;d.dailyLogs={};localStorage.setItem('workout-tracker-data',JSON.stringify(d));});
  await page.goto('calendar');
  await expect(today).toHaveClass('text-calendar-today font-semibold');
  await expect(today).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await page.evaluate(()=>localStorage.setItem('fitcircle_recovery_data',JSON.stringify({recoveryDays:['2026-10-26']})));
  await page.reload();
  await expect(today).toHaveClass('text-calendar-today font-semibold rounded bg-canvas px-1');
  await expect(today.locator('..')).toContainText('Recovery day');
});
