const CACHE_VERSION = 'v1777784000';
const CACHE_NAME = `recipes-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './recipes.json',
  './stores.json',
  './prices.json',
  './seasons.json',
  './nutrition_estimates.json',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Never cache sync API calls
  if (event.request.url.includes('workers.dev')) return;

  // Network-first for JSON data, cache-first for everything else
  if (event.request.url.endsWith('recipes.json')) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});
