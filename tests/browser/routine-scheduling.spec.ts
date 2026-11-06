import { test, expect, type Page } from '@playwright/test';
import { placementLogId } from '../../client/src/lib/routine-planning';
test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York' });
const read = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker-data')!));
const card = (page: Page, routine: string, placement: string) => page.getByTestId('home-workout-' + placementLogId(routine, placement));
async function seed(page: Page) {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00-05:00') }); await page.goto('profile');
  await page.evaluate(() => localStorage.setItem('workout-tracker-data', JSON.stringify({
    routineSchedulingVersion: 1, lastDate: '2026-11-04', journalEntries: {},
    workouts: {
      w: { id:'w', name:'Rows', color:'blue', count:0, dailyGoal:20, scheduledDays:[0] },
      t: { id:'t', name:'Hold', color:'purple', count:0, dailyGoal:60, scheduledDays:[2] },
      u: { id:'u', name:'Unassigned', color:'green', count:0, dailyGoal:10, scheduledDays:[3] },
    },
    routines: {
      a: { id:'a', name:'Torso', selectedDays:[3], createdAt:'2026-01-01', placements:[
        {id:'row-a',exerciseId:'w',prescription:{targetType:'repetitions',sets:3,perSet:10}},
        {id:'hold-a',exerciseId:'t',prescription:{targetType:'duration',sets:2,perSet:30}},
      ] },
      b: { id:'b', name:'Second', selectedDays:[3], createdAt:'2026-01-02', placements:[
        {id:'row-b',exerciseId:'w',prescription:{targetType:'repetitions',sets:2,perSet:20}},
      ] },
    },
    dailyLogs: { '2026-11-03': { w:{count:7,goalAtTime:20,nameAtTime:'Original rows',targetTypeAtTime:'repetitions'} } },
  })));
  await page.goto('./');
}

test('routine rescheduling controls ordered Home placements; shared definitions log independently and history survives',async({page})=>{
 await seed(page);const before=await read(page);
 await expect(page.locator('[data-testid^=home-workout-]')).toHaveCount(3);
 const ids=await page.locator('[data-testid^=home-workout-]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-testid')));
 expect(ids).toEqual(['home-workout-'+placementLogId('a','row-a'),'home-workout-'+placementLogId('a','hold-a'),'home-workout-'+placementLogId('b','row-b')]);
 await card(page,'a','row-a').getByRole('button',{name:/Record a set/}).click();
 await card(page,'a','hold-a').getByRole('button',{name:/Record a set/}).click();
 await expect(card(page,'b','row-b')).toContainText('0 / 40');
 await card(page,'b','row-b').getByRole('button',{name:/Record a set/}).click();
 const logged=await read(page),day=logged.dailyLogs['2026-11-04'];
 expect(day[placementLogId('a','row-a')]).toMatchObject({count:10,goalAtTime:30,exerciseIdAtTime:'w',routineIdAtTime:'a',placementIdAtTime:'row-a'});
 expect(day[placementLogId('b','row-b')]).toMatchObject({count:20,goalAtTime:40,exerciseIdAtTime:'w'});
 expect(day[placementLogId('a','hold-a')]).toMatchObject({count:30,goalAtTime:60,targetTypeAtTime:'duration'});
 expect(logged.workouts).toEqual(before.workouts);
 await page.goto('routines/edit?id=a');await page.getByRole('button',{name:'Clear Selection',exact:true}).click();await page.getByRole('button',{name:'Thursday',exact:true}).click();await page.getByRole('button',{name:'Save Routine',exact:true}).click();
 await page.goto('./');await expect(page.locator('[data-testid^=home-workout-]')).toHaveCount(1);await expect(card(page,'b','row-b')).toContainText('20 / 40');
 expect((await read(page)).dailyLogs).toEqual(logged.dailyLogs);
 await page.goto('dynamic-overview/2026-11-04');await expect(page.getByText('Rows',{exact:true})).toHaveCount(2);await expect(page.getByText('Hold',{exact:true})).toBeVisible();
 await page.goto('workout-statistics');await expect(page.getByRole('region',{name:'Monthly Statistics',exact:true}).getByText('Monthly Reps',{exact:true}).locator('..').locator('dd')).toHaveText('37');await expect(page.getByText(/Exercise duration logged: 30/)).toBeVisible();
 await page.goto('calendar');await expect(page.getByRole('heading',{name:'Recent Activity',exact:true})).toBeVisible();
 await page.goto('dynamic-overview/2026-11-03');await expect(page.getByText('Original rows',{exact:true})).toBeVisible();
 await page.clock.setFixedTime(new Date('2026-11-05T12:00:00-05:00'));await page.goto('./');
 await expect(page.locator('[data-testid^=home-workout-]')).toHaveCount(2);await expect(card(page,'a','row-a')).toContainText('0 / 30');await expect(card(page,'a','hold-a')).toContainText('0 / 60');
 await page.reload();await expect(page.locator('[data-testid^=home-workout-]')).toHaveCount(2);
 const after=await read(page);expect(after.dailyLogs).toEqual(logged.dailyLogs);expect(after.workouts.w.scheduledDays).toEqual([0]);
});

test('exercise forms have no schedule controls; unassigned definitions stay available for routine assignment',async({page})=>{
 await seed(page);await page.goto('routines/workouts/edit?id=u');
 await expect(page.getByRole('button',{name:/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Weekdays|Weekends)$/})).toHaveCount(0);
 await page.getByLabel('Workout Name').fill('Saved unassigned');await page.getByRole('button',{name:'Save Exercise',exact:true}).click();
 await page.goto('./');await expect(page.getByText('Saved unassigned',{exact:true})).toHaveCount(0);
 await page.goto('routines');await expect(page.getByText('1 unassigned exercise available in Add Exercise.',{exact:true})).toBeVisible();
 await page.getByTestId('routine-header-a').click();await page.getByTestId('button-add-workout-a').click();await page.getByRole('button',{name:'Add Saved unassigned',exact:true}).click();
 await page.goto('./');await expect(page.getByText('Saved unassigned',{exact:true})).toBeVisible();
 await page.goto('routines/workouts/new?routine=a');await expect(page.getByRole('button',{name:'Wednesday',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Cancel',exact:true}).click();
});


test('historical editing updates one placement without changing its sibling or definition',async({page})=>{
 await seed(page);
 for(const [routine,placement] of [['a','row-a'],['b','row-b']])await card(page,routine,placement).getByRole('button',{name:/Record a set/}).click();
 const before=await read(page);await page.goto('dynamic-overview/2026-11-04');
 const row=page.getByText('Rows',{exact:true}).first().locator('../..');
 await row.getByTitle('Edit count').click();await page.getByLabel('Completed sets').fill('2');await page.getByTitle('Save',{exact:true}).click();
 const after=await read(page),key=placementLogId('a','row-a'),other=placementLogId('b','row-b');
 expect(after.dailyLogs['2026-11-04'][key]).toMatchObject({count:20,goalAtTime:30,completedSets:2,exerciseIdAtTime:'w',routineIdAtTime:'a'});
 expect(after.dailyLogs['2026-11-04'][other]).toEqual(before.dailyLogs['2026-11-04'][other]);
 expect(after.workouts).toEqual(before.workouts);
});
