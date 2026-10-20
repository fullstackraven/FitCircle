import { test, expect, type Page } from '@playwright/test';
test.use({ timezoneId:'America/New_York', locale:'en-US' });
const originalProfile = { age:42, gender:'female', height:68, retained:{synthetic:true} };
const measurements = {weight:[{date:'2026-10-17',value:170},{date:'2026-10-01',value:175}],height:[{date:'2026-10-01',value:70}]};
async function seed(page: Page) {
  await page.clock.install({time:new Date('2026-10-17T12:00:00-04:00')});
  await page.goto('profile');
  await page.evaluate(({originalProfile,measurements})=>{
    localStorage.setItem('fitcircle_username','Legacy athlete'); localStorage.setItem('fitcircle_age','37'); localStorage.setItem('fitcircle_fitness_goal','Legacy goal');
    localStorage.setItem('fitcircle_profile',JSON.stringify(originalProfile));localStorage.setItem('fitcircle_measurements_history',JSON.stringify(measurements));
    localStorage.setItem('fitness_calc_target_calories','2222');localStorage.setItem('unrelated-synthetic','retain');
    localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{a:{id:'a',name:'Synthetic workout',color:'green',dailyGoal:10,count:0}},routines:{},dailyLogs:{'2026-10-15':{a:{count:10,goalAtTime:10}},'2026-10-16':{a:5}},journalEntries:{'2026-10-15':{text:'Preserve',timestamp:'2026-10-15T18:00:00.123Z'}},lastDate:'2026-10-17'}));
  },{originalProfile,measurements});
  await page.reload();
}
const snapshot = (page:Page)=>page.evaluate(()=>({workouts:localStorage.getItem('workout-tracker-data'),measurements:localStorage.getItem('fitcircle_measurements_history'),oldAge:localStorage.getItem('fitcircle_age'),foreign:localStorage.getItem('unrelated-synthetic')}));

test('overview preserves legacy data, saves explicit edits and updates age at a birthday without writes',async({page})=>{
  await seed(page);const before=await snapshot(page);
  await expect(page.getByRole('heading',{name:'Legacy athlete',exact:true})).toBeVisible();
  await expect(page.getByText('Legacy goal',{exact:true})).toBeVisible();
  await expect(page.getByText('170 lb · 70 in',{exact:true})).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await page.getByRole('button',{name:'Edit Profile',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Edit Profile',exact:true});
  await expect(dialog.getByLabel('Name',{exact:true})).not.toBeFocused();
  await dialog.getByLabel('Name',{exact:true}).fill('Updated synthetic athlete');
  await dialog.getByLabel('Date of Birth',{exact:true}).fill('1990-10-18');
  await dialog.getByRole('button',{name:'Save Profile',exact:true}).click();
  await page.getByRole('button',{name:'Edit Fitness Goals',exact:true}).click();
  await page.getByLabel('Primary objective',{exact:true}).selectOption('Build strength');
  await page.getByLabel('Fitness Goal',{exact:true}).fill('Synthetic long free-form objective');
  await page.getByRole('button',{name:'Save Profile',exact:true}).click();
  await page.reload();
  await expect(page.getByText('1990-10-18 · Age 35',{exact:true})).toBeVisible();
  await expect(page.getByText('Build strength',{exact:true})).toBeVisible();
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_profile')!));
  expect(profile).toMatchObject({...originalProfile,dateOfBirth:'1990-10-18',primaryObjective:'Build strength'});
  expect(await snapshot(page)).toEqual(before);
  expect(await page.evaluate(()=>localStorage.getItem('fitness_calc_target_calories'))).toBe('2222');
  await page.clock.fastForward(24*60*60*1000);
  await expect(page.getByText('1990-10-18 · Age 36',{exact:true})).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
});

test('Home dashboard card, profile totals and existing statistics share definitions and return behavior',async({page})=>{
  await seed(page);await page.goto('./');
  await page.getByRole('button',{name:'Open Menu',exact:true}).click();
  const sheet=page.getByRole('dialog',{name:'Navigation Menu',exact:true});
  const card=sheet.getByRole('button',{name:/My Fitness Profile/});
  await expect(card).toContainText('Training overview & goals');await expect(card).toContainText('1 active day');
  await card.click();await expect(page).toHaveURL(/profile\?from=dashboard/);
  const training=page.getByRole('region',{name:'Your Training',exact:true});
  await expect(training.getByText('33.3%',{exact:true})).toBeVisible();await expect(training.getByText('15',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(sheet).toBeVisible();
  await card.click();await page.getByRole('button',{name:'View Workout Statistics',exact:true}).click();
  const totals=page.getByRole('region',{name:'All-Time Statistics',exact:true});
  await expect(totals.getByText('33.3%',{exact:true})).toBeVisible();await expect(totals.getByText('15',{exact:true})).toBeVisible();
  await page.goto('profile');await page.getByRole('button',{name:/Body Measurements/}).click();await expect(page).toHaveURL(/\/measurements$/);
});

test('calculator uses latest dated weight, then prefers explicit DOB without changing sex or profile metadata',async({page})=>{
  await seed(page);await page.goto('food-tracker');await page.getByTestId('button-calculator').click();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('fitness_calc_target_calories'))).toBe('2343');
  await page.goto('profile');await page.getByRole('button',{name:'Edit Profile',exact:true}).click();
  await page.getByLabel('Date of Birth',{exact:true}).fill('1990-10-18');await page.getByRole('button',{name:'Save Profile',exact:true}).click();
  await page.goto('food-tracker');await page.getByTestId('button-calculator').click();await expect.poll(()=>page.evaluate(()=>localStorage.getItem('fitness_calc_target_calories'))).toBe('2397');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcircle_profile')!))).toMatchObject(originalProfile);
});

test('calculator missing age is explicit and retains saved targets; malformed profile is not overwritten',async({page})=>{
  await page.goto('profile');await page.evaluate(()=>{localStorage.setItem('fitness_calc_target_calories','2222');localStorage.setItem('fitcircle_profile','{');});
  await page.reload();await expect(page.getByRole('alert')).toContainText('could not be read safely');
  await expect(page.getByRole('button',{name:'Edit Profile',exact:true})).toBeDisabled();
  await page.goto('food-tracker');await page.getByTestId('button-calculator').click();await expect(page.getByRole('status')).toContainText('age or date of birth is needed');
  expect(await page.evaluate(()=>localStorage.getItem('fitness_calc_target_calories'))).toBe('2222');
  expect(await page.evaluate(()=>localStorage.getItem('fitcircle_profile'))).toBe('{');
});

test('profile long names and goals wrap and the final detail stays above the dock',async({page})=>{
  await seed(page);await page.evaluate(()=>{localStorage.setItem('fitcircle_username','LongSyntheticNameWithoutAnySpacesToExerciseWrappingOnSmallScreens');localStorage.setItem('fitcircle_fitness_goal','A long personal objective '.repeat(12));});
  for(const width of [320,390,430,1280]) {
    await page.setViewportSize({width,height:844});await page.goto('profile');
    await expect(page.getByRole('heading',{name:'My Fitness Profile',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const text of await page.locator('.entity-name').all()) expect(await text.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await page.locator('main').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    const last=(await page.getByRole('button',{name:'Fitness Goals',exact:true}).boundingBox())!;
    expect(last.y+last.height).toBeLessThanOrEqual((await page.locator('.app-dock').boundingBox())!.y);
  }
});

for (const route of ['', 'calendar', 'routines', 'wellness', 'reminders']) {
  test(`shared profile card and return navigation work from ${route || 'home'}`, async ({ page }) => {
    await seed(page);
    await page.goto(route || './');
    const before = await snapshot(page);
    await page.getByRole('button', { name: 'Open Menu', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Navigation Menu', exact: true });
    const card = sheet.getByRole('button', { name: /My Fitness Profile/ });
    await expect(card).toContainText('Training overview & goals');
    await expect(card).toContainText('1 active day');
    await expect(sheet.getByText('view profile', { exact: true })).toHaveCount(0);
    await card.click();
    await expect(page.getByRole('heading', { name: 'My Fitness Profile', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/FitCircle/${route}$`));
    await expect(sheet).toBeVisible();
    await expect(card).toContainText('1 active day');
    expect(await snapshot(page)).toEqual(before);
  });
}
