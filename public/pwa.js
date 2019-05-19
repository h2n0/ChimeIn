let CACHE_NAME = 'ChimeIn';

// CODELAB: Add list of files to cache here.
let FILES_TO_CACHE = [
  "offline.html",
  "assets/logo.svg",
  "style/out.css",
  "style/pure.css",
  "manifest.json"
];

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  evt.waitUntil(caches.open(CACHE_NAME).then( (cache) => {
    return cache.addAll(FILES_TO_CACHE);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  // CODELAB: Remove previous cached data from disk.
  evt.waitUntil( caches.keys().then( (keyList) => {
    return Promise.all(keyList.map( (key) => {
      if(key !== CACHE_NAME){
        console.log("[ServiceWorker] removing old cache", key);
        return caches.delete(key);
      }
    }));
  }));

  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    // Try the cache
    caches.match(event.request).then(function(response) {
      // Fall back to network
      return response || fetch(event.request);
    }).catch(function() {
      return caches.match('offline.html');
    })
  );
});
