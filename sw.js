const CACHE_VERSION = 'v1778066946';
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

const NETWORK_FIRST = new Set([
  'index.html',
  'recipes.json',
  'prices.json',
  'seasons.json',
  'nutrition_estimates.json',
  'stores.json',
]);

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
  if (event.request.url.includes('workers.dev')) return;

  const url = new URL(event.request.url);
  const filename = url.pathname.split('/').pop() || 'index.html';

  if (NETWORK_FIRST.has(filename)) {
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
