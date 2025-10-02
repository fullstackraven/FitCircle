// Simple Service Worker for FitCircle PWA
// Provides basic caching for offline functionality

const CACHE_NAME = 'fitcircle-v3-2024-10-02';
const urlsToCache = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Install Service Worker (don't auto-skip waiting)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
});

// Listen for SKIP_WAITING message from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate Service Worker and claim clients immediately
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network first for navigations and code, cache first for images
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Network-first strategy for navigations (critical for updates)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(async () => {
          // Fallback to cached index.html for offline
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('/')) || (await cache.match('/index.html')) || Response.error();
        })
    );
    return;
  }
  
  // Network-first strategy for CSS, JS, and HTML
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.tsx') || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for images and static assets
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request);
        })
        .catch(() => {
          if (request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});