self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("sziget-cache").then(cache => {
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

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
