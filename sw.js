/* Spotter · works at the gym with no signal. Open the app once with a connection and this keeps what it needs on the phone:
   the page, its scripts and styles (whatever index.html links, read at install so a new ?v= is picked up without editing this
   file), the pose engine and model, and the moves network. Everything else the app fetches from its own site is kept the
   first time it's used. Videos are left alone: they're streamed in ranges, and your own videos never leave the phone anyway. */
const CACHE = 'spotter-v1';
const ENGINE = ['vendor/mediapipe/vision_bundle.mjs', 'vendor/mediapipe/wasm/vision_wasm_internal.js', 'vendor/mediapipe/wasm/vision_wasm_internal.wasm',
  'vendor/mediapipe/pose_landmarker_full.task', 'model/moves.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
const SHELL = './';
const KEEP_AWAY = /^https:\/\/([a-z]\.)?(tile|tiles|basemaps|api\.maptiler)/;   // map tiles: too many, and the map is not what you need on the wall

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  const page = await fetch(SHELL, { cache: 'no-cache' });
  const html = await page.clone().text();
  await c.put(SHELL, page);
  // what the page links from this site, at the versions it links them
  const linked = [...html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css|mjs)(?:\?[^"]*)?)"/g)].map(m => m[1]);
  await c.addAll([...new Set([...linked, ...ENGINE])]);
  self.skipWaiting();
})()));

self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

// a new ?v= of a file replaces the old one, so the cache doesn't grow with every release
async function keep(c, req, res) {
  const u = new URL(req.url);
  if (u.search) for (const old of await c.keys()) { const o = new URL(old.url); if (o.origin === u.origin && o.pathname === u.pathname && o.search !== u.search) await c.delete(old); }
  await c.put(req, res);
}

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || req.headers.has('range') || /\.(mp4|mov|webm)$/i.test(u.pathname) || KEEP_AWAY.test(req.url) || u.protocol === 'blob:') return;
  const own = u.origin === location.origin;

  // the page: the newest one when there's signal (gyms often have a little), the kept one after 3 s or with none
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const net = fetch(req).then(r => { if (r.ok) c.put(SHELL, r.clone()); return r; });
      const slow = new Promise(r => setTimeout(r, 3000)).then(() => c.match(SHELL));
      try { return (await Promise.race([net, slow])) || await net; } catch { return (await c.match(SHELL)) || Response.error(); }
    })());
    return;
  }

  // files: kept copy first. Ours carry ?v= or never change; fonts and the map library are versioned too
  if (own || /^(fonts\.(googleapis|gstatic)\.com|unpkg\.com|cdnjs\.cloudflare\.com)$/.test(u.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE), hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === 'opaque') keep(c, req, r.clone());
      return r;
    })());
  }
});
