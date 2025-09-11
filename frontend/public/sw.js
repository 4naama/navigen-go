// Bump to evict stale assets, make version explicit per env
const IS_DEV = /\blocalhost$|\b127\.0\.0\.1$/.test(self.location.hostname); // dev skip cache
const CACHE_NAME = IS_DEV ? "navigen-go-dev" : "navigen-go-v6"; // bump to evict stale assets

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
    }));
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
    // dev: don’t intercept cross-origin; let page handle CORS
    if (u.origin !== self.location.origin) return;
    event.respondWith(fetch(req));
    return;
  }

  if (u.origin !== self.location.origin) return; // ignore cross-origin

  const accept = req.headers.get("accept") || "";
  const isHTML = req.mode === "navigate" || accept.includes("text/html");

  if (isHTML) {
    // try network, update cache; fallback to cached doc (or /index.html)
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, net.clone());
        return net;
      } catch {
        return (await caches.match(req)) || (await caches.match("/index.html"));
      }
    })());
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

  // unchanged: other assets cache-first
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    const net = await fetch(req);
    if (net && net.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, net.clone());
    }
    return net;
  })());
});
