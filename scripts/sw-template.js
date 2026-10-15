// Generated with every build. Installation succeeds only after the entire build
// is cached, keeping HTML and content-hashed assets on the same version.
const CACHE_NAME = '__CACHE_NAME__';
const PRECACHE = __PRECACHE__;
const BASE = new URL('./', self.location.href).pathname;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Do not touch caches belonging to other apps on this GitHub Pages origin.
    for (const key of await caches.keys()) {
      if (key.startsWith('fitcircle-pages-') && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (event.request.mode === 'navigate') return (await cache.match(BASE + 'index.html')) || fetch(event.request);
    return (await cache.match(event.request, { ignoreSearch: true, ignoreVary: true })) || fetch(event.request);
  })());
});
