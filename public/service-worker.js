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

const ESPERA_RED = 2500;
async function navegar(req) {
    const red = fetch(req).then((res) => {
        if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copia));
        }
        return res;
    });
    red.catch(() => {}); // si pierde la carrera y luego falla, que no salte un error suelto
    const guardada = () => caches.match("/index.html").then((r) => r || caches.match("/"));
    let espera;
    try {
        const tarde = new Promise((res) => { espera = setTimeout(res, ESPERA_RED); });
        const res = await Promise.race([red, tarde]);
        if (res) return res;
    } catch { /* sin red: falla al momento */ } finally {
        clearTimeout(espera);
    }
    // Nada guardado todavía: no queda otra que esperar a la red
    return (await guardada()) || red;
}

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

    // Navegación: red primero; la página que llega se guarda como index.html (es una SPA).
    // Con «una rayita» la red no falla, se queda colgada (y la app en blanco): si no contesta
    // en ESPERA_RED, la última que se vio. La de la red sigue llegando y queda para la próxima
    if (req.mode === "navigate") {
        event.respondWith(navegar(req));
        return;
    }

    // Ficheros que no cambian: caché primero. Sin mirar Vary: los módulos se piden con Origin y,
    // si el servidor contestó con «Vary: Origin», no casarían con lo guardado y sin red no arrancaría
    if (/^\/(assets|fonts|icons)\//.test(url.pathname) || url.pathname.startsWith("/logo-musikeeo")) {
        event.respondWith(caches.match(req, { ignoreVary: true }).then((r) => r || fetch(req).then((res) => guardar(req, res))));
        return;
    }

    event.respondWith(
        fetch(req).catch(() => caches.match(req).then((r) => r || Response.error()))
    );
});
