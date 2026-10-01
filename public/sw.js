/**
 * Belga Móveis - Lightweight & Optimized Push Notification Service Worker
 */

const CACHE_NAME = 'belga-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://i.postimg.cc/MpBZDxmh/Logo-BELGA-Moveis-com-Canario-Amarelo.png',
];

// Install & Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Safe proceed if offline
      });
    })
  );
  self.skipWaiting();
});

// Activate & Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle Push Notifications from Backend / Cloud
self.addEventListener('push', (event) => {
  let data = {
    title: 'Belga Móveis',
    body: 'Atualização importante sobre seu pedido ou novidades do crediário!',
    icon: 'https://i.postimg.cc/MpBZDxmh/Logo-BELGA-Moveis-com-Canario-Amarelo.png',
    badge: 'https://i.postimg.cc/MpBZDxmh/Logo-BELGA-Moveis-com-Canario-Amarelo.png',
    url: '/',
    tag: 'belga-push',
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [150, 50, 100],
    data: { url: data.url || '/' },
    tag: data.tag,
    renotify: true,
    actions: [
      { action: 'open', title: 'Ver Agora' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle Notification Clicks (Open or focus client window)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for direct messages from the main thread (for instant local push notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, tag } = event.data.payload;
    self.registration.showNotification(title || 'Belga Móveis', {
      body: body || 'Novidade na loja!',
      icon: 'https://i.postimg.cc/MpBZDxmh/Logo-BELGA-Moveis-com-Canario-Amarelo.png',
      badge: 'https://i.postimg.cc/MpBZDxmh/Logo-BELGA-Moveis-com-Canario-Amarelo.png',
      vibrate: [100, 50, 100],
      data: { url: url || '/' },
      tag: tag || 'belga-order-alert',
      renotify: true,
    });
  }
});
