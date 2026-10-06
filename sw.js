'use strict';

const CACHE_NAME = 'portfolio-v11';
const PAGE_PATHS = new Set([
  '/',
  '/index.html',
  '/projects/f1-analytics.html',
  '/projects/sds-extractor.html',
  '/projects/singularity-wars.html'
]);
const DOCUMENT_PATHS = new Set([
  ...PAGE_PATHS,
  '/style.css', '/script.js', '/case-study.css', '/case-study.js', '/register-sw.js',
  '/cursor.css', '/cursor.js',
  '/robots.txt', '/sitemap.xml', '/favicon_io/site.webmanifest'
]);
const CORE_ASSETS = [
  ...PAGE_PATHS,
  '/style.css?v=5', '/script.js?v=4', '/case-study.css?v=5', '/case-study.js?v=5', '/register-sw.js?v=4',
  '/cursor.css?v=1', '/cursor.js?v=1', '/assets/cursor-precision.svg', '/assets/cursor-link.svg', '/assets/cursor-text.svg',
  '/assets/fonts/space-grotesk-latin.woff2', '/assets/fonts/dm-sans-latin.woff2', '/assets/fonts/ibm-plex-mono-latin.woff2',
  '/assets/jahid1.webp', '/assets/f1-pitwall-analytics.webp', '/assets/f1-pitwall-demo-poster.webp', '/assets/sds-chemical-extractor.webp', '/assets/singularity-wars.webp',
  '/favicon_io/favicon.ico?v=mjh-1', '/favicon_io/favicon.svg?v=mjh-1',
  '/favicon_io/favicon-16x16.png?v=mjh-1', '/favicon_io/favicon-32x32.png?v=mjh-1',
  '/favicon_io/apple-touch-icon.png?v=mjh-1', '/favicon_io/site.webmanifest?v=mjh-1',
  '/favicon_io/android-chrome-192x192.png?v=mjh-1', '/favicon_io/android-chrome-512x512.png?v=mjh-1',
  '/favicon_io/maskable-icon-512x512.png?v=mjh-1'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => /^portfolio-v\d+$/.test(name) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

function offlineResponse() {
  return new Response('This resource is not available offline. Please reconnect and try again.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Let the browser handle media streaming and byte ranges; never cache partial video responses.
  if (request.destination === 'video' || url.pathname.startsWith('/assets/video/') || request.headers.has('range')) return;
  const isDocument = DOCUMENT_PATHS.has(url.pathname);
  const isAsset = url.pathname.startsWith('/assets/') || url.pathname.startsWith('/favicon_io/');
  // Do not take over other GitHub Pages projects hosted under the same origin.
  if (!isDocument && !isAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (!isDocument) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    try {
      const response = await fetch(request, isDocument ? { cache: 'no-cache' } : undefined);
      if (response.ok) {
        // Storage limits must never prevent a successful network response from rendering.
        try { await cache.put(request, response.clone()); } catch { /* Cache is optional. */ }
      }
      return response;
    } catch {
      // Only fall back to the requested resource; never serve the homepage as CSS or another page.
      const cached = await cache.match(request);
      if (cached) return cached;
      if (PAGE_PATHS.has(url.pathname)) {
        return (await cache.match(url.pathname)) || offlineResponse();
      }
      return offlineResponse();
    }
  })());
});
