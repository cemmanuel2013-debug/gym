// Offline support: app files are served from cache and refreshed in the background,
// exercise images from the CDN are cached the first time they load.
const VERSION = 'gym-v5';
const IMG_CACHE = 'gym-img-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/store.js',
  'js/exercises.js',
  'js/ui.js',
  'js/timers.js',
  'js/components.js',
  'js/views/home.js',
  'js/views/calendar.js',
  'js/views/plan.js',
  'js/views/session.js',
  'js/views/history.js',
  'js/views/chat.js',
  'js/views/settings.js',
  'js/views/steps.js',
  'js/views/train.js',
  'js/views/program.js',
  'js/views/profile.js',
  'js/programs.js',
  'data/exercises.json',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never stores old files.
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== IMG_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      caches.open(IMG_CACHE).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req, { cache: 'no-cache' })
        .then((res) => { if (res.ok) c.put(req, res.clone()); return res; })
        .catch(() => hit);
      return hit || net;
    })
  );
});
