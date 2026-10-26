import { test, expect, type Page, type Locator } from '@playwright/test';

test.use({ timezoneId: 'UTC', locale: 'en-US' });
const longName = 'Synthetic strength and mobility with LongExerciseNameWithoutSpacesForWrapping';
const colors = ['green','blue','purple','amber','red','pink','cyan','lime','orange','indigo','emerald','yellow'];
async function seed(page: Page, mode: 'history' | 'many' | 'empty' = 'history') {
  await page.clock.install({ time: new Date('2026-10-17T12:00:00Z') });
  await page.goto('profile');
  const base = { count: 0, dailyGoal: 10, scheduledDays: [0,1,2,3,4,5,6] };
  const workouts = mode === 'empty' ? {} : mode === 'many'
    ? Object.fromEntries(colors.map((color,index) => [`w${index}`, { ...base, id:`w${index}`, name:`${index} ${longName}`, color }]))
    : { a: { ...base, id:'a', name:'Synthetic Push-ups', color:'green', count:10 }, b: { ...base, id:'b', name:longName, color:'blue', count:20, dailyGoal:20 } };
  await page.evaluate(({workouts, mode}) => {
    localStorage.setItem('workout-tracker-data', JSON.stringify({workouts, routines:{}, dailyLogs:mode === 'history' ? {
      '2026-09-30': {a:10},
      '2026-10-15': {a:{count:10,goalAtTime:10},b:{count:20,goalAtTime:20}},
      '2026-10-16': {a:{count:5,goalAtTime:10}},
      '2026-10-17': {a:{count:10,goalAtTime:10},b:{count:20,goalAtTime:20}},
    } : {}, journalEntries:{'2026-10-15':{text:'Synthetic preserved journal',timestamp:'2026-10-15T18:00:00.555Z'}},lastDate:'2026-10-17'}));
    localStorage.setItem('fitcircle_recovery_data', JSON.stringify({recoveryDays:mode === 'history' ? ['2026-10-14'] : []}));
    localStorage.setItem('unrelated-synthetic', 'retain');
  }, {workouts, mode});
}
const metric = (section: Locator, label: string) => section.getByText(label,{exact:true}).locator('..').locator('dd');
const stored = (page: Page) => page.evaluate(() => ({
  workouts:localStorage.getItem('workout-tracker-data'), recovery:localStorage.getItem('fitcircle_recovery_data'), unrelated:localStorage.getItem('unrelated-synthetic'),
}));

test('Calendar navigation and redesigned metrics preserve the pre-redesign historical baseline', async ({page}) => {
  await seed(page);
  await page.goto('calendar');
  const link=page.getByRole('button',{name:'Workout Statistics',exact:true});
  await expect(link).toBeVisible();
  const before=await stored(page);
  await link.click();
  await expect(page).toHaveURL(/\/FitCircle\/workout-statistics$/);
  const total=page.getByRole('region',{name:'All-Time Statistics',exact:true});
  const monthly=page.getByRole('region',{name:'Monthly Statistics',exact:true});
  // Captured from the old page with this same frozen-date, mixed-format fixture.
  await expect(metric(total,'Total Reps')).toHaveText('75');
  await expect(metric(total,'Days Completed')).toHaveText('4');
  await expect(metric(total,'Overall Consistency')).toHaveText('22.2%');
  await expect(metric(monthly,'Monthly Reps')).toHaveText('65');
  await expect(metric(monthly,'Days Completed')).toHaveText('3');
  await expect(metric(monthly,'Monthly Consistency')).toHaveText('17.6%');
  const overall=total.getByRole('progressbar',{name:'Overall Consistency'});
  expect(Number(await overall.getAttribute('value'))).toBeCloseTo(4/18*100);
  await expect(overall).toHaveAttribute('aria-valuetext','22.2%');
  await expect(monthly.getByRole('progressbar',{name:'Monthly Consistency'})).toHaveAttribute('value',String(3/17*100));
  const toggle=page.getByRole('button',{name:'Individual Workout Totals',exact:true});
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.focus(); await toggle.press('Enter');
  const rows=page.getByRole('list',{name:'Individual workout totals'}).locator('li');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Synthetic Push-ups'); await expect(rows.nth(0)).toContainText('35');
  await expect(rows.nth(1)).toContainText(longName); await expect(rows.nth(1)).toContainText('40');
  await expect(rows.nth(0).locator('.workout-green')).toHaveCount(1);
  await expect(rows.nth(1).locator('.workout-blue')).toHaveCount(1);
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(page.getByRole('list',{name:'Individual workout totals'})).not.toBeVisible();
  await monthly.getByRole('button',{name:'Previous month'}).click();
  await expect(monthly).toContainText('September 2026');
  await expect(metric(monthly,'Monthly Reps')).toHaveText('10');
  await expect(metric(monthly,'Days Completed')).toHaveText('1');
  await expect(metric(monthly,'Monthly Consistency')).toHaveText('3.3%');
  await monthly.getByRole('button',{name:'Next month'}).click();
  await expect(metric(monthly,'Monthly Reps')).toHaveText('65');
  await monthly.getByRole('button',{name:'Next month'}).click();
  await expect(monthly).toContainText('November 2026');
  await expect(metric(monthly,'Monthly Reps')).toHaveText('0');
  await expect(metric(monthly,'Days Completed')).toHaveText('0');
  await expect(metric(monthly,'Monthly Consistency')).toHaveText('0.0%');
  await expect(metric(total,'Total Reps')).toHaveText('75');
  await expect(metric(total,'Overall Consistency')).toHaveText('22.2%');
  expect(await stored(page)).toEqual(before);
  await page.getByTitle('Back to Calendar').click();
  await expect(page).toHaveURL(/\/FitCircle\/calendar$/);
});

test('all exercise colors and long names remain reachable in compact expanded rows', async ({page}) => {
  await seed(page,'many');
  for (const width of [320,390,1280]) {
    await page.setViewportSize({width,height:844});
    await page.goto('workout-statistics');
    await page.addStyleTag({content:':root { --safe-bottom: 34px; }'});
    const monthly=page.getByRole('region',{name:'Monthly Statistics',exact:true});
    const previous=(await monthly.getByRole('button',{name:'Previous month'}).boundingBox())!;
    const next=(await monthly.getByRole('button',{name:'Next month'}).boundingBox())!;
    expect(previous.y).toBe(next.y); expect(previous.height).toBeGreaterThanOrEqual(44);
    const total=page.getByRole('region',{name:'All-Time Statistics',exact:true});
    const value=metric(total,'Total Reps');
    const label=total.getByText('Total Reps',{exact:true});
    expect(await value.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(await label.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)));
    await page.getByRole('button',{name:'Individual Workout Totals',exact:true}).click();
    await page.locator('.statistics-workout-totals').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
    const list=page.getByRole('list',{name:'Individual workout totals'});
    await expect(list.locator('li')).toHaveCount(colors.length);
    for (let index=0;index<colors.length;index++) {
      const row=list.locator('li').nth(index);
      await expect(row.locator(`.workout-${colors[index]}`)).toHaveCount(1);
      expect(await row.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    }
    await page.locator('main').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    const last=(await list.locator('li').last().boundingBox())!;
    expect(last.y+last.height).toBeLessThanOrEqual((await page.locator('.app-dock').boundingBox())!.y);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('empty statistics remain zero with a collapsed, keyboard-operable empty totals card', async ({page}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page,'empty'); await page.goto('workout-statistics');
  for (const name of ['All-Time Statistics','Monthly Statistics']) {
    const section=page.getByRole('region',{name,exact:true});
    await expect(metric(section,'Days Completed')).toHaveText('0');
    await expect(section.getByRole('progressbar')).toHaveAttribute('value','0');
  }
  const toggle=page.getByRole('button',{name:'Individual Workout Totals',exact:true});
  await toggle.focus(); await toggle.press('Space');
  await expect(page.getByText('No workouts created yet',{exact:true})).toBeVisible();
});
