// Bump this number whenever you want to force every phone to drop its old cache.
const CACHE_NAME = 'weights-log-v2';
const SHELL_FILES = ['./index.html', './manifest.json', './icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // cache: 'reload' bypasses the browser's HTTP cache so we never store a stale copy
      cache.addAll(SHELL_FILES.map((f) => new Request(f, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first: when you're online you always get the newest version of the
// app files, and the cached copy is only used as an offline fallback.
// API calls to Apps Script (a different origin) are never touched, so your
// logged data is always fetched fresh.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
