import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function buildFiles(): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  async function visit(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(file);
      else files.set('/FitCircle/' + path.relative('dist', file).split(path.sep).join('/'), await readFile(file));
    }
  }
  await visit('dist');
  return files;
}
function version(files: Map<string, Buffer>, name: string) {
  const next = new Map(files);
  next.set('/FitCircle/sw.js', Buffer.from(files.get('/FitCircle/sw.js')!.toString().replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = 'fitcircle-pages-test-${name}';`)));
  next.set('/FitCircle/index.html', Buffer.from(files.get('/FitCircle/index.html')!.toString().replace('<html lang="en">', `<html lang="en" data-build="${name}">`)));
  return next;
}
async function host(initial: Map<string, Buffer>) {
  let current = initial;
  const server = createServer((req, res) => {
    let url = new URL(req.url!, 'http://localhost').pathname;
    if (url === '/FitCircle/' || !path.extname(url)) url = '/FitCircle/index.html';
    const data = current.get(url);
    if (!data) { res.writeHead(404); res.end('missing'); return; }
    const type = url.endsWith('.js') ? 'application/javascript' : url.endsWith('.html') ? 'text/html' : url.endsWith('.css') ? 'text/css' : url.endsWith('.json') ? 'application/json' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(data);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  return { url: `http://127.0.0.1:${address.port}/FitCircle/`, set: (files: Map<string, Buffer>) => { current = files; }, close: () => { server.closeAllConnections(); server.close(); } };
}

// Emulates the previous deployed worker: cached navigations, waiting updates,
// and an old asset unavailable from the newly deployed static host.
const legacyWorker = `
const CACHE_NAME = 'fitcircle-pages-legacy';
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['/FitCircle/index.html', '/FitCircle/assets/previous.js']))));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => e.respondWith((async () => {
  const c = await caches.open(CACHE_NAME);
  return (await c.match(e.request.mode === 'navigate' ? '/FitCircle/index.html' : e.request)) || fetch(e.request);
})()));
`;

test('an older installed shell recovers after a new deployment and retains old-tab assets and data', async ({ page }) => {
  const files = await buildFiles();
  const legacy = new Map([
    ['/FitCircle/index.html', Buffer.from('<!doctype html><html><body>Previous build<script src="/FitCircle/assets/previous.js"></script></body></html>')],
    ['/FitCircle/assets/previous.js', Buffer.from("navigator.serviceWorker.register('/FitCircle/sw.js');")],
    ['/FitCircle/sw.js', Buffer.from(legacyWorker)],
  ]);
  const site = await host(legacy);
  try {
    await page.goto(site.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.evaluate(async () => {
      localStorage.setItem('fitcircle_username', 'Keep my profile');
      localStorage.setItem('other-app-data', 'keep');
      await caches.open('another-app-cache').then(c => c.put('/another-app', new Response('keep')));
    });
    site.set(version(files, 'recovered'));
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const previous = navigator.serviceWorker.controller;
      // An activated registration/cache does not yet prove clients.claim()
      // has transferred this page away from the legacy cache-first worker.
      const claimed = new Promise<void>(resolve => {
        const onChange = () => {
          if (navigator.serviceWorker.controller !== previous) {
            navigator.serviceWorker.removeEventListener('controllerchange', onChange);
            resolve();
          }
        };
        navigator.serviceWorker.addEventListener('controllerchange', onChange);
        onChange();
      });
      await reg!.update();
      await claimed;
    });
    await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state)).toBe('activated');
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes('fitcircle-pages-test-recovered'))).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/FitCircle/index.html')).text()).includes('data-build="recovered"'))).toBe(true);
    await page.goto(site.url + 'settings');
    await expect(page.getByRole('button', { name: 'Force Refresh App', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-build', 'recovered');
    const retained = await page.evaluate(async () => ({
      profile: localStorage.getItem('fitcircle_username'), other: localStorage.getItem('other-app-data'),
      asset: (await fetch('/FitCircle/assets/previous.js')).status,
      cache: await caches.has('another-app-cache'),
    }));
    expect(retained).toEqual({ profile: 'Keep my profile', other: 'keep', asset: 200, cache: true });
  } finally { site.close(); }
});

test('Force Refresh applies a real new service worker before navigating to the entry point', async ({ page }) => {
  const files = await buildFiles();
  const site = await host(version(files, 'before'));
  try {
    await page.goto(site.url + 'settings');
    await page.getByRole('button', { name: 'Force Refresh App', exact: true }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.evaluate(() => localStorage.setItem('fitcircle_username', 'Keep during update'));
    site.set(version(files, 'after'));
    await page.getByRole('button', { name: 'Force Refresh App', exact: true }).click();
    await page.waitForURL(/\/FitCircle\/\?refresh=/);
    await expect(page.locator('html')).toHaveAttribute('data-build', 'after');
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('fitcircle_username'))).toBe('Keep during update');
  } finally { site.close(); }
});

test('failed offline update stays on a usable settings page', async ({ page, context }) => {
  await page.goto('settings');
  await page.getByRole('button', { name: 'Force Refresh App', exact: true }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Force Refresh App', exact: true }).click();
  await expect(page.getByText('You are offline. Reconnect before checking for app updates.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Force Refresh App', exact: true })).toBeEnabled();
  expect(new URL(page.url()).pathname).toBe('/FitCircle/settings');
});

test('missing entry script shows recovery and safe reload preserves local data', async ({ page }) => {
  const files = await buildFiles();
  const broken = new Map(files);
  const entry = /src="([^"]+\/assets\/index-[^"]+\.js)"/.exec(files.get('/FitCircle/index.html')!.toString())![1];
  broken.delete(entry);
  const site = await host(broken);
  try {
    await page.goto(site.url);
    await expect(page.getByRole('button', { name: 'Reload app safely' })).toBeVisible();
    await page.evaluate(() => {
      localStorage.setItem('fitcircle_username', 'Keep recovery data');
      localStorage.setItem('other-app-data', 'keep');
    });
    site.set(files);
    await page.getByRole('button', { name: 'Reload app safely' }).click();
    await page.waitForURL(/\?recovery=/);
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
    expect(await page.evaluate(() => [localStorage.getItem('fitcircle_username'), localStorage.getItem('other-app-data')])).toEqual(['Keep recovery data', 'keep']);
  } finally { site.close(); }
});

test('incomplete new deployment keeps the installed app and profile usable', async ({ page }) => {
  const files = await buildFiles();
  const site = await host(version(files, 'complete'));
  try {
    await page.goto(site.url + 'settings');
    await page.getByRole('button', { name: 'Force Refresh App', exact: true }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.evaluate(() => localStorage.setItem('fitcircle_username', 'Keep failed update data'));
    const incomplete = version(files, 'incomplete');
    incomplete.set('/FitCircle/sw.js', Buffer.from(incomplete.get('/FitCircle/sw.js')!.toString().replace('const PRECACHE = [', 'const PRECACHE = ["/FitCircle/missing-new-asset.js",')));
    site.set(incomplete);
    await page.getByRole('button', { name: 'Force Refresh App', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Force Refresh App', exact: true })).toBeEnabled({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-build', 'complete');
    expect(await page.evaluate(() => localStorage.getItem('fitcircle_username'))).toBe('Keep failed update data');
    await page.goto(site.url);
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-build', 'complete');
  } finally { site.close(); }
});

test('unresponsive update checks time out without leaving settings or deleting data', async ({ page }) => {
  await page.goto('settings');
  await page.getByRole('button', { name: 'Force Refresh App', exact: true }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.clock.install();
  await page.evaluate(() => {
    ServiceWorkerRegistration.prototype.update = () => new Promise(() => {});
    localStorage.setItem('fitcircle_username', 'Keep timeout data');
  });
  await page.getByRole('button', { name: 'Force Refresh App', exact: true }).click();
  await expect(page.getByText('Checking for updates...')).toBeVisible();
  await page.clock.fastForward(16000);
  await expect(page.getByText('The update check timed out. Please try again when the connection is stable.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Force Refresh App', exact: true })).toBeEnabled();
  expect(new URL(page.url()).pathname).toBe('/FitCircle/settings');
  expect(await page.evaluate(() => localStorage.getItem('fitcircle_username'))).toBe('Keep timeout data');
});
