// Service worker for RampWatch Wx: cache-first for static assets, network-first for live data
const CACHE_NAME = 'rampwatch-v1';
const STATIC_URLS = ['./index.html', './manifest.webmanifest', './icon.svg', './sw.js'];
const API_CACHE = 'rampwatch-api-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_URLS).catch(() => {
        // Offline install: don't fail if fetch fails, cache what we can
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((n) => n !== CACHE_NAME && n !== API_CACHE)
          .map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Open-Meteo API: network-first, 5-min cache fallback
  if (url.hostname === 'api.open-meteo.com') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (!res.ok) throw new Error('API error');
          caches.open(API_CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Aviation Weather API: network-first
  if (url.hostname === 'aviationweather.gov') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (!res.ok) throw new Error('METAR error');
          caches.open(API_CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Local: cache-first
  e.respondWith(
    caches
      .match(request)
      .then((cached) => cached || fetch(request))
      .catch(() => {
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Background sync (optional): retry failed strikes/logs when back online
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-logs') {
    e.waitUntil(
      // If you add a cloud sync endpoint later, handle it here
      Promise.resolve()
    );
  }
});

// Push notifications (browser shows them; PWA can handle custom actions)
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'RampWatch', body: 'Notification' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icon.svg',
      tag: 'rampwatch',
      renotify: true,
      vibrate: [300, 100, 300],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('./index.html');
      })
  );
});
