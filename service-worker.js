self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("v1").then((cache) => {
      const filesToCache = [
        "/",
        "/index.html",
        "/manifest.json",
        "/icon-192.png",
        "/icon-512.png",
        "/assets/index-Dj1Gsl3Z.js",
        "/assets/index-C3jjMwyE.css",
      ];

      // Try to cache everything individually, even if some fail
      return Promise.allSettled(
        filesToCache.map((file) =>
          cache.add(file).catch((err) =>
            console.warn(`⚠️ Failed to cache ${file}:`, err)
          )
        )
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});