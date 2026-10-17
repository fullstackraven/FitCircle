import { test, expect } from '@playwright/test';
const longName = 'Synthetic long strength workout with a deliberately unbroken LongWorkoutNameWithoutAnySpacesAtAllForWrapping';
const longRoutine = 'Synthetic full body strength and mobility routine with LongRoutineNameWithoutSpacesForWrapping';
for (const size of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`typography hierarchy and long names at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('profile');
    await page.evaluate(({ longName,longRoutine }) => localStorage.setItem('workout-tracker-data', JSON.stringify({
      workouts: { a: { id:'a', name:longName, color:'green', count:5, dailyGoal:20 } },
      dailyLogs:{}, journalEntries:{}, routines:{ r: { id:'r', name:longRoutine, selectedDays:[0,1,2,3,4,5,6], createdAt:'2026-10-16' } },
    })), {longName,longRoutine});
    await page.goto('./');
    await page.evaluate(() => document.fonts.ready);
    const nav = page.getByRole('navigation', {name:'Bottom navigation'});
    const family = await nav.evaluate(el => getComputedStyle(el).fontFamily);
    expect(family).not.toContain('JetBrains');
    expect(family).toContain('Segoe UI');
    await expect(page.getByRole('heading',{name:'FitCircle',exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name:'FitCircle',exact:true})).toHaveCSS('font-family', /JetBrains Mono/);
    const metric = page.locator('.type-metric').first();
    await expect(metric).toHaveCSS('font-family', /JetBrains Mono/);
    await expect(metric).toHaveCSS('font-variant-numeric', /tabular-nums/);
    const name = page.getByText(longName,{exact:true}).first();
    await expect(name).toBeVisible();
    expect(await name.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const routineOnHome = page.getByText(longRoutine,{exact:true});
    expect(await routineOnHome.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path:`/tmp/typography-home-${size.width}.png` });
    await page.getByRole('button',{name:'Add new workout',exact:true}).click();
    const input = page.locator('#workout-name');
    await expect(input).toBeVisible();
    expect(await input.evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('JetBrains');
    if (size.width < 768) expect(await input.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
    await page.goto('routines');
    await expect(page.getByRole('heading',{name:'FitCircle',exact:true})).toBeVisible();
    const routine = page.getByRole('heading',{name:longRoutine,exact:true});
    await expect(routine).toBeVisible();
    expect(await routine.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const bounds = await routine.boundingBox();
    const deletion = await page.getByRole('button',{name:`Delete routine ${longRoutine}`,exact:true}).boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(deletion!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path:`/tmp/typography-routines-${size.width}.png` });
  });
}
