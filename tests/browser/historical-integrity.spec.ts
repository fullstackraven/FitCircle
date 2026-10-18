import { test, expect } from '@playwright/test';
import { historicalIntegrityFixtures } from '../fixtures/historical-integrity';

test.use({ timezoneId: 'UTC' });
for (const fixture of historicalIntegrityFixtures) {
  test(`real mounts and reloads preserve ${fixture.name}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
    // Profile does not mount useWorkouts. Seed once, before any workout reader;
    // addInitScript reseeding on reload would conceal destructive migration.
    await page.goto('profile');
    await expect(page.getByRole('heading', { name: 'My Fitness Profile', exact: true })).toBeVisible();
    const data = { ...fixture.data, lastDate: '2026-10-16' };
    await page.evaluate(data => {
      localStorage.setItem('workout-tracker-data', JSON.stringify(data));
      localStorage.setItem('workout-tracker-logs', JSON.stringify(data.dailyLogs));
      localStorage.setItem('unrelated-synthetic-history', 'retain');
    }, data);
    const privateLogFragments: string[] = [];
    page.on('console', message => {
      if (message.text().includes('Removing estimated timestamp')) privateLogFragments.push(message.text());
    });
    async function assertPreserved() {
      await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
      // Let mount effects and initial async work run before reading persistence.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const stored = await page.evaluate(() => ({
        data: JSON.parse(localStorage.getItem('workout-tracker-data')!),
        legacy: JSON.parse(localStorage.getItem('workout-tracker-logs')!),
        unrelated: localStorage.getItem('unrelated-synthetic-history'),
      }));
      expect(stored).toEqual({ data, legacy: data.dailyLogs, unrelated: 'retain' });
      expect(privateLogFragments).toEqual([]);
    }
    await page.goto('./');
    await assertPreserved();
    await page.reload();
    await assertPreserved();
    // Calendar mounts two readers (page and Recent Activity) in the same app.
    await page.getByRole('button', { name: 'Calendar', exact: true }).click();
    await expect(page).toHaveURL(/\/calendar$/);
    await assertPreserved();
    await page.reload();
    await assertPreserved();
  });
}
