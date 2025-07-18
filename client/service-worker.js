
const CACHE_NAME = 'fitcircle-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
  console.log('Service worker installed.');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
  console.log('Service worker activated.');
});

self.addEventListener('fetch', (event) => {
  // Skip caching for API calls and hot reload
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/@vite/') ||
      event.request.url.includes('/__vite_ping') ||
      event.request.url.includes('/src/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Network first for main content
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
          return response;
        }
        // If network fails, try cache
        return caches.match(event.request);
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
