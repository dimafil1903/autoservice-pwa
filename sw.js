const CACHE_NAME = 'autoservice-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './config.js',
  './css/app.css',
  './js/app.js',
  './js/db.js',
  './js/auth.js',
  './js/clients.js',
  './js/orders.js',
  './js/finance.js',
  './js/docs.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('script.google.com')) return; // не кешуємо API
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
