self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service worker installed.');
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated.');
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle navigations (HTML page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  }
});