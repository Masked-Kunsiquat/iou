const CACHE_NAME = 'iou-tracker-v1.0.2';  // Update version here too
const urlsToCache = [
  // Core files
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './app.js',
  './db.js',
  './features/persons/contact-helper.js',

  // Core Modules
  './core/main.js',
  './core/state.js',
  './core/constants.js',

  // UI Modules
  './ui/fab.js',
  './ui/modal.js',
  './ui/navigation.js',
  './ui/notifications.js',
  './ui/renderer.js',

  // Feature Modules
  './features/actions.js',
  './features/import-export/data-service.js',
  './features/persons/contact-helper.js',
  './features/persons/person-modals.js',
  './features/persons/person-renderer.js', 
  './features/stats/stats-renderer.js', 
  './features/transactions/transaction-modals.js',
  './features/transactions/transaction-renderer.js',
  './features/transactions/transaction-utils.js',

  // External CDN
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});