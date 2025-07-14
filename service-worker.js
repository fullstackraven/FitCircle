const CACHE_NAME = "fitcircle-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/assets/index-[your-js-file].js",
  "/assets/index-[your-css-file].css",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

// Replace with your actual hashed filenames!

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});