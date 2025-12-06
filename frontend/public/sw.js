
// dev = localhost only (SW not registered on pages.dev anymore)
const IS_DEV = /\blocalhost$|\b127\.0\.0\.1$/.test(self.location.hostname);

const CACHE_NAME = IS_DEV ? "navigen-go-dev" : "navigen-go-v56"; // bump to evict stale cache

// Precache core shell for offline; keep list lean
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    if (IS_DEV) { // dev: no precache; install fast
      await self.skipWaiting(); // apply new SW immediately after install
      return;
    }
    const cache = await caches.open(CACHE_NAME);
    // Precache a defined set; skip failures so install cannot be bricked by a 404.
    const ASSETS = [
      "/", "/index.html", "/navi-style.css", "/app.js", "/modal-injector.js",
      "/data/locations.json", "/data/structure.json", "/data/alert.json",
      "/assets/icon-192.png", "/assets/icon-512.png", "/assets/language.svg",
      "/assets/icon-whatsapp.svg"
    ];
    // Avoid 'url' name to prevent shadow collisions in some builds.
    await Promise.allSettled(ASSETS.map(async (assetUrl) => {
      try {
        const res = await fetch(assetUrl, { cache: "no-store" });
        if (res && res.ok) await cache.put(assetUrl, res.clone());
      } catch {}
    })); // close map + allSettled
  })()); // invoke the async IIFE so waitUntil gets a Promise

});

// cleanup old caches; claim clients so new SW controls pages now
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // dev: nuke everything; prod: keep only current
    await Promise.all(keys.map(k => (IS_DEV || k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim(); // claim clients so new SW controls pages now
  })());
});

// HTML/network-first; assets cache-first. Keeps offline fallback.
// Only updates comments; behavior changed for documents.
self.addEventListener("fetch", event => {
  const req = event.request;
  const u = new URL(req.url); // dev: need origin to skip cross-origin
  if (req.method !== "GET") return;

  if (IS_DEV) {
    // dev: don’t intercept cross-origin; fetch fresh for CSS/JS
    if (u.origin !== self.location.origin) return;
    const dest = req.destination || '';
    const isAsset = dest === 'style' || dest === 'script' ||
                    u.pathname.endsWith('.css') || u.pathname.endsWith('.js');
    event.respondWith(isAsset ? fetch(req, { cache: 'no-store' }) : fetch(req));
    return;
  }

  if (u.origin !== self.location.origin) return; // ignore cross-origin

  const accept = req.headers.get("accept") || "";
  const isHTML = req.mode === "navigate" || accept.includes("text/html");

  // API: never cache; always hit network
  if (u.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  const dest = req.destination || '';
  if (dest === 'script' || u.pathname.endsWith('.js')) {
    event.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, net.clone());
        return net;
      } catch {
        return (await caches.match(req)) || Response.error();
      }
    })());
    return;
  }

  // other assets cache-first with MIME guard; HTML network-first
  // prevents caching HTML under image keys from locale-prefixed fallbacks
  event.respondWith((async () => {
    if (isHTML) {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        const c = await caches.open(CACHE_NAME);
        c.put(req, net.clone());
        return net;
      } catch {
        return (await caches.match(req)) || Response.error();
      }
    }

    const hit = await caches.match(req);
    if (hit) return hit;

    const net = await fetch(req);
    if (net && net.ok) {
      const ct = (net.headers.get('content-type') || '').toLowerCase();
      const path = new URL(req.url).pathname;
      const isImgReq = /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(path);
      const okToCache = isImgReq ? ct.startsWith('image/') : true;
      if (okToCache) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, net.clone());
      }
    }
    return net;
  })());

});
