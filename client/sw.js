// Simple Service Worker for FitCircle PWA
// Provides basic caching for offline functionality

const CACHE_NAME = 'fitcircle-v2-2024-10-02';
const urlsToCache = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Install Service Worker and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
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

// Fetch Event - Network first for CSS/JS, cache first for images
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first strategy for CSS, JS, and HTML
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.tsx') || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for images and static assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});