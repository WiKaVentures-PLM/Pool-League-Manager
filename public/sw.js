const CACHE_NAME = 'pool-league-v2';

// Only precache public, non-auth-gated resources
const PRECACHE_URLS = [
  '/',
];

// Install: precache app shell (only public pages)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches + notify clients of update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => {
      // Notify all clients that a new version is available
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API/data, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase API calls and auth
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) return;

  // Skip auth-gated routes — don't cache these
  const authRoutes = ['/dashboard', '/standings', '/submit', '/teams', '/schedule', '/admin', '/settings'];
  if (authRoutes.some((route) => url.pathname.startsWith(route))) {
    // Network-only for auth routes, no caching
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline') || caches.match('/'))
    );
    return;
  }

  // Network-first for HTML pages (always try fresh)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('/'))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
