// Generated with every build. Installation succeeds only after the entire build
// is cached, keeping HTML and content-hashed assets on the same version.
const CACHE_NAME = '__CACHE_NAME__';
const PRECACHE = __PRECACHE__;
const BASE = new URL('./', self.location.href).pathname;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    // A broken older shell may not render its update button. Activate only
    // after every asset is ready, so opening the app can recover automatically.
    await self.skipWaiting();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Keep previous build assets available to tabs still running older HTML.
    // Limit retained builds; never remove another app's origin caches.
    const previous = (await caches.keys()).filter(key => key.startsWith('fitcircle-pages-') && key !== CACHE_NAME);
    for (const key of previous.slice(0, -2)) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (event.request.mode === 'navigate') {
      return (await cache.match(BASE + 'index.html', { ignoreVary: true })) || fetch(event.request);
    }
    const options = { ignoreSearch: true, ignoreVary: true };
    const current = await cache.match(event.request, options);
    if (current) return current;
    // Hashed assets from an older open tab must remain usable after activation.
    if (url.pathname.startsWith(BASE + 'assets/')) {
      for (const key of await caches.keys()) {
        if (!key.startsWith('fitcircle-pages-') || key === CACHE_NAME) continue;
        const previous = await (await caches.open(key)).match(event.request, options);
        if (previous) return previous;
      }
    }
    return fetch(event.request);
  })());
});
