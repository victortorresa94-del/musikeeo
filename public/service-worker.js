// La app tiene que abrir sin cobertura (el cancionero se usa en el bolo, en sótanos y salas):
// - Páginas: primero la red (para coger lo último tras publicar); sin red, la última que se vio.
// - /assets (JS y CSS con huella en el nombre, no cambian nunca): de la caché, y lo que falte se guarda al bajarlo.
// - Fuentes, iconos y logo: igual que /assets.
// - Lo demás: la red y, si no hay, lo que haya guardado.
// Firebase, la API y cualquier otro dominio no pasan por aquí.
// Al publicar (vite.config.ts) se rellenan la versión y la lista de todo el código y las fuentes
const VERSION = "/*VERSION*/dev";
const CODIGO = [/*PRECACHE*/];
const CACHE_NAME = `musikeeo-${VERSION}`;
const PRECACHE = ["/", "/index.html", "/manifest.json", "/logo-musikeeo.png?v=6", "/icons/musikeeo-192.png", "/icons/musikeeo-512.png"];

self.addEventListener("install", (event) => {
    self.skipWaiting(); // Forzar activación inmediata del nuevo SW
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => Promise.allSettled([...PRECACHE, ...CODIGO].map((url) => cache.add(url))))
    );
});

self.addEventListener("activate", (event) => {
    // Tomar el control de las pestañas abiertas sin esperar a recargar
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))),
        ])
    );
});

// Por si acaso: como mucho 400 ficheros, se van los más viejos
const MAXIMO = 400;
const guardar = (req, res) => {
    if (res && res.ok && res.type === "basic") {
        const copia = res.clone();
        caches.open(CACHE_NAME).then((cache) =>
            cache.put(req, copia).then(() => cache.keys()).then((claves) => {
                const sobran = claves.filter((k) => !PRECACHE.includes(new URL(k.url).pathname + new URL(k.url).search) && !CODIGO.includes(new URL(k.url).pathname)).slice(0, Math.max(0, claves.length - MAXIMO));
                return Promise.all(sobran.map((k) => cache.delete(k)));
            })
        );
    }
    return res;
};

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

    // Navegación: red primero; la página que llega se guarda como index.html (es una SPA)
    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok) {
                        const copia = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copia));
                    }
                    return res;
                })
                .catch(() => caches.match("/index.html").then((r) => r || caches.match("/")))
        );
        return;
    }

    // Ficheros que no cambian: caché primero
    if (/^\/(assets|fonts|icons)\//.test(url.pathname) || url.pathname.startsWith("/logo-musikeeo")) {
        event.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => guardar(req, res))));
        return;
    }

    event.respondWith(
        fetch(req).catch(() => caches.match(req).then((r) => r || Response.error()))
    );
});
