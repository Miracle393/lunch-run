// Offline shell. Bump CACHE when you change any file below.
const CACHE = 'lunchrun-v3';
const ASSETS = [
  './', './index.html', './styles.css', './app.js',
  './manifest.webmanifest', './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate.
//
// Answer instantly from cache — the app must open with no signal at all, that is
// rule 2 and it is not negotiable. But ALSO fetch a fresh copy in the background
// and overwrite the cache with it, so the next open has the newer file.
//
// Why not pure cache-first: it made a fixed bug immortal. The item sheet was
// repaired in styles.css, but every reload kept serving the broken cached copy,
// and the only escape was unregistering the worker by hand in DevTools. Nobody
// inheriting this app will know to do that. Offline-first must not mean
// update-never.
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      const fresh = fetch(e.request).then(res => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => hit || caches.match('./index.html'));

      return hit || fresh;   // cached copy now, fresher copy next time
    })
  );
});
