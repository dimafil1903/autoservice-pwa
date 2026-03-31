const CACHE_NAME = 'autoservice-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './config.js?v=3',
  './css/app.css',
  './js/app.js?v=3',
  './js/db.js?v=3',
  './js/onboarding.js?v=3',
  './js/auth.js?v=3',
  './js/clients.js?v=3',
  './js/orders.js?v=3',
  './js/finance.js?v=3',
  './js/docs.js?v=3'
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
