const CACHE_NAME = "navigen-go";

// Precache core shell for offline; keep list lean
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      "/",
      "/index.html",
      "/navi-style.css",
      "/app.js",
      "/modal-injector.js",
      "/data/locations.json",
      "/data/structure.json",
      "/data/alert.json",
      "/assets/icon-192.png",
      "/assets/icon-512.png",
      "/assets/language.svg",
      "/assets/icon-whatsapp.svg"
    ]);
    // apply new SW immediately after install
    await self.skipWaiting();
  })());
});

// cleanup old caches; claim clients so new SW controls pages now
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))); // ✅ remove old "sziget-cache"
    await self.clients.claim();
  })());
});

// HTML/network-first; assets cache-first. Keeps offline fallback.
// Only updates comments; behavior changed for documents.
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ignore cross-origin

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

  // static assets: cache-first, then network; fill cache for next time
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
