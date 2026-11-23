/* Bagsy service worker. Code is fetched fresh whenever you're online (so updates show up on the next open);
   the saved copy is only used when you're offline. Pictures and the splash video come from the saved copy. */
const CACHE = 'bagsy-d63d11f1';
const SHELL = ['./','index.html','app.js','api.js','config.js','supabase.js','manifest.webmanifest',
  'img/plane.png','img/key.png','img/tickets.png','img/wallet.png','img/case.png','img/package.png','img/bed.png','img/splash-end.jpg','img/bagsy-black.svg','img/bag-suitcase.png','img/bag-backpack.png','img/bag-duffel.png','img/bag-hatbox.png','img/bag-trunk.png','img/bag-tote.png','img/bag-satchel.png','img/bag-bumbag.png',
  'img/scene-coast.webp','img/scene-city.webp','img/scene-mountains.webp','img/scene-countryside.webp','img/scene-tropical.webp','img/scene-desert.webp','img/scene-snow.webp','img/scene-lakes.webp','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
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

/* ---------- push notifications ---------- */
self.addEventListener('push', e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch (_) { m = { title:'Bagsy', body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(m.title || 'Bagsy', { body: m.body || '', tag: m.tag, data: { url: m.url || './' }, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
    if (/^check-/.test(m.tag || '') && self.navigator.setAppBadge) {          // keep the app-icon count in step with payday checks
      const n = (await self.registration.getNotifications()).filter(x => /^check-/.test(x.tag || '')).length;
      self.navigator.setAppBadge(n).catch(() => {});
    }
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    const c = all.find(x => x.url.startsWith(self.registration.scope));
    if (c) { await c.focus(); c.postMessage({ open: url }); return; }   // already open: jump there without replaying the splash
    await self.clients.openWindow(url);
  })());
});
