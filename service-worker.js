/**
 * @file This service worker handles caching of application assets for offline use.
 * It follows a "cache-first, then network" strategy. It also manages the
 * cleanup of old caches upon activation of a new service worker version.
 */

/**
 * The name of the cache, including the version.
 * @type {string}
 */
const CACHE_NAME = 'iou-tracker-v1.0.3';

/**
 * An array of all the assets to be cached upon installation.
 * @type {string[]}
 */
const urlsToCache = [
  // Core files
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './app.js',
  './db.js',
  
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
  './features/transactions/split-utils.js',


  // External CDN
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

/**
 * Handles the 'install' event.
 * This is triggered when the service worker is first installed. It opens the cache
 * and adds all specified URLs from `urlsToCache` to it.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

/**
 * Handles the 'fetch' event.
 * This intercepts all network requests. It first tries to find a matching response
 * in the cache. If a match is found, it returns the cached response. If not, it
 * fetches the resource from the network, caches a copy for future use, and
 * returns the network response. Provides a fallback to the main index.html for
 * page navigations when offline.
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the cached response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response to store it in the cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback for offline navigation to the main page
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

/**
 * Handles the 'activate' event.
 * This is triggered when the new service worker activates. It's used to clean up
 * old, unused caches to prevent the user's device from storing multiple versions
 * of the site's assets.
 */
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If the cacheName is not in our whitelist, delete it
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});