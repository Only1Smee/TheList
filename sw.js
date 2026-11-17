const CACHE = 'the-list-v4';
const ASSETS = ['./', './index.html', './manifest.json', './engine.js', './world.js', './data.js', './maps.js', './game.js', './audio.js', './progress.js', './story.js', './icons.js', './tutorial.js', './ui.js', './menus.js', './extras.js', './controls.js', './icon-192.png', './icon-512.png', './maskable-192.png', './maskable-512.png', './apple-touch-icon.png', './favicon.ico', './list-display.woff', './list-type.woff', './contract-text.woff', './contract-text-bold.woff', './music.json', './hideout.mp3', './mission.mp3', './combat.mp3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
