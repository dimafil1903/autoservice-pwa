const CACHE_NAME = 'autoservice-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './config.js?v=2',
  './css/app.css',
  './js/app.js?v=2',
  './js/db.js?v=2',
  './js/onboarding.js?v=2',
  './js/auth.js?v=2',
  './js/clients.js?v=2',
  './js/orders.js?v=2',
  './js/finance.js?v=2',
  './js/docs.js?v=2'
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
  if (e.request.url.includes('supabase.co')) return; // не кешуємо API
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
