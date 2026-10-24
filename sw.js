const C = 'fftk-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);

  if (u.pathname.endsWith('cache.json')) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const cl = r.clone(); caches.open(C).then(c => c.put(e.request, cl)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  if (u.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const cl = res.clone(); caches.open(C).then(c => c.put(e.request, cl)); return res;
    }))
  );
});
