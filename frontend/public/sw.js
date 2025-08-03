const CACHE_NAME = "navigen-go"; // ✅ renamed from "sziget-cache"

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/navi-style.css",
        "/app.js",
        "/data/locations.json",
        "/data/structure.json",
        "/data/alert.json",
        "/assets/icon-192.png",
        "/assets/icon-512.png",
        "/assets/language.svg",
        "/assets/icon-whatsapp.svg"
      ]);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)) // ✅ remove old "sziget-cache"
      )
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
