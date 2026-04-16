// Swim Tracker — Service Worker
// Strategy:
//   • Navigation (HTML) requests  → network-first, cache as offline fallback
//   • Vite-hashed assets (/assets/) → cache-first (content-addressed, safe forever)
//   • Everything else (icons, manifest, fonts) → network-first, cache as fallback
//
// Rationale: index.html is NOT content-addressed — it changes on every deploy.
// Caching it with cache-first causes blank pages after a new build because the
// old index.html references asset hashes that no longer exist on the CDN.
// Vite's /assets/ files ARE content-addressed (filename includes build hash),
// so they are safe to cache indefinitely.

const CACHE_NAME = 'swim-tracker-v2';

self.addEventListener('install', (e) => {
  // Pre-cache index.html so it is available offline from the first visit
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/index.html'))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Purge all old cache versions (v1, any future stale names)
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // ── 1. Navigation requests (HTML / page loads) — network-first ──────────
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ── 2. Vite-hashed assets — cache-first (immutable, safe to cache forever) ─
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── 3. Everything else (icons, manifest, fonts) — network-first ──────────
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
