import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(new URL('wellness', process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4175/FitCircle/').href);
  await page.getByTestId('card-supplements').waitFor();
  const sample = await page.evaluate(async () => {
    const main = document.querySelector('main'), nav = document.querySelector('.app-dock nav');
    const before = nav.getBoundingClientRect().toJSON();
    const longTasks = [];
    const observer = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(e => e.duration)));
    observer.observe({ type: 'longtask', buffered: false });
    const gaps = [];
    let previous;
    for (let i = 0; i < 120; i++) {
      const now = await new Promise(requestAnimationFrame);
      if (previous !== undefined) gaps.push(now - previous);
      previous = now;
      // Triangle-wave scrolling exercises the visible dock over content.
      main.scrollTop = (main.scrollHeight - main.clientHeight) * (1 - Math.abs((i % 60) / 30 - 1));
    }
    await new Promise(requestAnimationFrame);
    observer.disconnect();
    return { frames: 120, maxFrameGapMs: Math.max(...gaps), meanFrameGapMs: gaps.reduce((a,b)=>a+b,0)/gaps.length,
      longTaskDurationsMs: longTasks, navBefore: before, navAfter: nav.getBoundingClientRect().toJSON(),
      filteredElements: [...document.querySelectorAll('*')].filter(el => getComputedStyle(el).backdropFilter !== 'none').length };
  });
  console.log(JSON.stringify({ note: 'Single headless Chromium sample, not physical iOS performance or compositor verification.', ...sample }, null, 2));
} finally { await browser.close(); }
