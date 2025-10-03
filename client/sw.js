// Service Worker for FitCircle PWA
// Network-first with cached /index.html fallback to prevent white screens

const CACHE_NAME = 'fitcircle-v5-2025-10-03';
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// Allow page to trigger immediate activation
self.addEventListener('message', (evt) => {
  if (evt?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Precache the shell deterministically
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
});

// Claim clients, enable navigation preload, and then clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Take control so page sees controllerchange
    await self.clients.claim();

    // Speeds up first navigation while SW boots
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }

    // Cleanup old versions AFTER the new cache is ready
    const keep = new Set([CACHE_NAME]);
    const names = await caches.keys();
    await Promise.all(names.map(n => (keep.has(n) ? null : caches.delete(n))));
  })());
});

// ---- Fetch strategy ----
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Navigations: Network-first with cached /index.html fallback
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Use preload response if available (faster startup)
        const preload = await event.preloadResponse;
        const netResp = preload || await fetch(req);

        // Only cache successful HTML navigations; write atomically
        if (netResp.ok && (netResp.headers.get('content-type') || '').includes('text/html')) {
          const clone = netResp.clone();
          event.waitUntil((async () => {
            const c = await caches.open(CACHE_NAME);
            // normalize to /index.html so SPA routes share one shell
            await c.put('/index.html', clone);
          })());
        }
        return netResp;
      } catch {
        // Fallback to the app shell (must be precached)
        const c = await caches.open(CACHE_NAME);
        return (
          (await c.match('/index.html', { ignoreSearch: true })) ||
          (await c.match('/')) ||
          Response.error()
        );
      }
    })());
    return;
  }

  // 2) Hashed JS/CSS: Cache-first is fine once you precache or rely on HTTP caching.
  if (/\.(?:js|css|mjs)$/.test(new URL(req.url).pathname)) {
    event.respondWith((async () => {
      const c = await caches.open(CACHE_NAME);
      const hit = await c.match(req);
      if (hit) return hit;
      const resp = await fetch(req);
      if (resp.ok) event.waitUntil(c.put(req, resp.clone()));
      return resp;
    })());
    return;
  }

  // 3) Images & static: Cache-first with network fallback
  if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/.test(req.url)) {
    event.respondWith((async () => {
      const c = await caches.open(CACHE_NAME);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const resp = await fetch(req);
        if (resp.ok) event.waitUntil(c.put(req, resp.clone()));
        return resp;
      } catch {
        return hit || Response.error();
      }
    })());
  }
});
