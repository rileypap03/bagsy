/* Bagsy service worker. Code is fetched fresh whenever you're online (so updates show up on the next open);
   the saved copy is only used when you're offline. Pictures and the splash video come from the saved copy. */
const CACHE = 'bagsy-d241502c';
const SHELL = ['./','index.html','app.js','api.js','config.js','supabase.js','manifest.webmanifest',
  'img/plane.png','img/key.png','img/tickets.png','img/wallet.png','img/case.png','img/package.png','img/bed.png','img/splash-end.jpg','img/bagsy-black.svg',
  'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache:'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;            // database calls go straight to the network
  if (u.pathname.endsWith('.mp4')) return;                                           // iPhone can't play video from the saved copy, so let the browser fetch it
  const fresh = e.request.mode === 'navigate' || /\.(html|js|css|webmanifest)$/.test(u.pathname) || u.pathname.endsWith('/');
  if (fresh) {
    const key = e.request.mode === 'navigate' ? 'index.html' : e.request;
    e.respondWith(fetch(e.request, { cache:'no-store' })
      .then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(key, c)); } return r; })
      .catch(() => caches.match(key, { ignoreSearch:true })));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
