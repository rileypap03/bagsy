/* Bagsy service worker: keeps the app itself available offline. Your trip data always comes fresh from the database. */
const CACHE = 'bagsy-bfefee5e';
const SHELL = ['./','index.html','app.js','api.js','config.js','supabase.js','manifest.webmanifest','splash.mp4',
  'img/plane.png','img/key.png','img/tickets.png','img/wallet.png','img/case.png','img/bagsy-black.svg',
  'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;           // database calls go straight to the network
  if (e.request.mode === 'navigate') {                                              // the page: newest if online, cached if not
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  if (u.pathname.endsWith('/config.js')) { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
