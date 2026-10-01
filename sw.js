/* ============================================================
   MINGLE KERALA — Service Worker
   Version: v1
   ============================================================ */

const CACHE = 'mingle-kerala-v4';

const ASSETS = [
  './',
  './index.html',
  './age-verify.html',
  './login.html',
  './verify.html',
  './dashboard.html',
  './discover.html',
  './chat.html',
  './settings.html',
  './privacy.html',
  './terms.html',
  './safety.html',
  './manifest.json',
  './css/global.css',
  './css/landing.css',
  './css/dashboard.css',
  './css/chat.css',
  './js/utils.js',
  './js/particles.js',
  './js/rain.js',
  './js/landing.js',
];

/* ── Install: Pre-cache all assets ───────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      const requests = ASSETS.map((asset) => new Request(asset, { cache: 'reload' }));
      return cache.addAll(requests).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

/* ── Activate: Clean old caches ──────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: Cache-first for static, network-first for API ── */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip WebSocket / Socket.io requests — never cache these
  if (url.pathname.includes('/socket.io')) return;

  // Skip external CDN (socket.io, fonts, etc.)
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Don't cache bad responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const cloned = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, cloned));
        return response;
      }).catch(() => {
        // Offline fallback — return cached index
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

/* ── Push Notifications ──────────────────────────────────── */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Mingle Kerala';
  const options = {
    body: data.body || 'You have a new message!',
    icon: './assets/icon-192.png',
    badge: './assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './chat.html' },
    actions: [
      { action: 'view', title: '💬 Open Chat' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification Click ──────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || './chat.html';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
