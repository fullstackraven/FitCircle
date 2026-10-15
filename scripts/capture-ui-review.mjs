import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { captureViewportGeometry } from './viewport-probe.mjs';
// Use a fresh browser context with synthetic records only. No live-user data.
const output = process.argv[2] || '/tmp/fitcircle-ui-review';
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4175/FitCircle/';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.setProperty('--safe-top', '59px');
      document.documentElement.style.setProperty('--safe-bottom', '34px');
    });
    const routines = Object.fromEntries(Array.from({length: 8}, (_, i) => [`r${i}`, {id: `r${i}`, name: `Review routine ${i + 1}`, selectedDays: [0,1,2,3,4,5,6], createdAt: '2026-01-01T12:00:00Z'}]));
    localStorage.setItem('workout-tracker-data', JSON.stringify({ workouts: {}, routines, dailyLogs: {}, journalEntries: {} }));
  });
  const scenes = [
    ['home', './'], ['logs', 'wellness'], ['routines', 'routines'], ['calendar', 'calendar'], ['reminders', 'reminders'],
    ['sidebar', 'wellness', async () => { await page.getByRole('button', {name:'Open Menu'}).click(); }],
    ['food-tracker', 'food-tracker'],
    ['calculator', 'food-tracker', async () => { await page.getByTestId('button-calculator').click(); }],
    ['dialog', 'routines', async () => { await page.getByTestId('button-edit-routine-r0').click(); }],
  ];
  for (const [name, route, prepare] of scenes) {
    await page.goto(new URL(route, base).href);
    await page.locator('.app-page > *').waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (prepare) await prepare();
    await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
    await page.screenshot({ path: `${output}/${name}.png` });
    await writeFile(`${output}/${name}.json`, JSON.stringify(await page.evaluate(captureViewportGeometry), null, 2));
  }
} finally { await browser.close(); }
