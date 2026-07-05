// Service Worker for portfolio caching
const CACHE_NAME = 'portfolio-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/robots.txt',
  '/sitemap.xml',
  // Warm key visuals so repeat visits render quickly on weak connections.
  '/assets/mjahidul.webp',
  '/assets/Re_Jahid.webp',
  '/assets/f1-analytics.webp',
  '/assets/tripbloom.webp',
  '/assets/singularity-wars.webp',
  '/assets/sds-chemical-extractor.webp',
  '/assets/atm.webp',
  '/assets/weather.webp',
  '/assets/tic-tac-toe.webp',
  '/assets/snake.webp',
  '/assets/cars.webp'
];

// Install: cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (like iconify CDN) - cache them separately
  if (event.request.url.includes('code.iconify.design')) {
    event.respondWith(
      caches.open('iconify-cache').then((cache) => {
        return fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        }).catch(() => cache.match(event.request));
      })
    );
    return;
  }

  // For local assets: cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page if available
        return caches.match('/index.html');
      });
    })
  );
});
