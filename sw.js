// Network-only — no caching, always requires internet
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Wipe all existing caches from previous versions
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// No fetch handler: requests go straight to the network (browser default).
// A pass-through respondWith(fetch()) rejected unhandled when offline, so it was removed.
