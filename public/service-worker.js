const CACHE_NAME = "musikeeo-cache-v2";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
    self.skipWaiting(); // Forzar activación inmediata del nuevo SW
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", (event) => {
    // Estrategia Network First para navegación (HTML) para evitar versiones rotas tras deploy
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match("/index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) return caches.delete(name);
                })
            )
        )
    );
});
