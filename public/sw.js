const CACHE = 'ff-shell-v1';
const ASSETS = ['/', '/app', '/manifest.webmanifest'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Network-first for navigation, cache fallback
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/app').then(r => r || caches.match('/'))));
    return;
  }
  // Cache-first for same-origin static assets
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(c => c || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(ca => ca.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => c)));
  }
});
