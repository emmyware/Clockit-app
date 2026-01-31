const CACHE_NAME = 'clockit-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/supabase-config.js',
  '/social-sharing.js',
  '/reminder-system.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
  '/background-pattern.jpg'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification handler (for Dynamic Island support)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Clock It - Time for Memories! 📸';
  const options = {
    body: data.body || "Lift your head 😉, it's time to make memories",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    image: '/logo.png',
    vibrate: [200, 100, 200],
    tag: 'clockit-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'capture',
        title: '📸 Capture Now',
        icon: '/icon-192.png'
      },
      {
        action: 'later',
        title: 'Remind Later',
        icon: '/icon-192.png'
      }
    ],
    data: {
      url: self.registration.scope,
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler (supports Dynamic Island interactions)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'capture') {
    // Open app and trigger camera
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If app is already open, focus it and send message
          for (let client of clientList) {
            if (client.url.includes(self.registration.scope)) {
              client.focus();
              client.postMessage({ action: 'open-camera' });
              return;
            }
          }
          // Otherwise open new window with camera action
          return clients.openWindow(self.registration.scope + '?action=capture');
        })
    );
  } else if (event.action === 'later') {
    // Snooze reminder for 1 hour
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({ action: 'snooze-reminder' });
        }
      })
    );
  } else {
    // Default: open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (let client of clientList) {
            if (client.url.includes(self.registration.scope)) {
              return client.focus();
            }
          }
          return clients.openWindow(self.registration.scope);
        })
    );
  }
});

// Background sync for offline photo uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

async function syncPhotos() {
  // Notify all open clients to sync photos
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ action: 'sync-photos' });
  });
}

// Handle messages from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skip-waiting') {
    self.skipWaiting();
  }
});
