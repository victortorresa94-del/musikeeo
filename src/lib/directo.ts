// «En directo» (13-nov, Víctor: «Es importantísimo que todo esto funcione sin conexión, y que no
// se me reinicie la app en directo ni se me salga ni nada cuando sobre todo esté dentro de un
// reper o modo cantando»). Sin React: lo usan el aviso de versión nueva y quien recuerda dónde
// estabas.

// En directo = dentro de una canción, un repertorio, Tocar, un bolo o la página del grupo.
// La lista del cancionero no cuenta: recargarla no pierde nada
export function enDirecto(ruta: string): boolean {
    return /^\/cancionero\/.+/.test(ruta) || /^\/(grupo|bolo|taller)(\/|$)/.test(ruta);
}

// Las rutas a las que merece la pena volver si el iPhone cierra la app a mitad del bolo
const VOLVER = /^\/cancionero\/(repertorio\/[^/]+(\/tocar)?|[^/]+)$/;
const CLAVE = 'musikeeo-directo';
const VIGENCIA = 4 * 60 * 60 * 1000;    // un bolo largo, con su montaje

export function recordarDirecto(ruta: string, busqueda: string) {
    try {
        if (VOLVER.test(ruta) && !/\/(nueva|escuchar|bolo\/)/.test(ruta)) localStorage.setItem(CLAVE, JSON.stringify({ ruta: ruta + busqueda, hora: Date.now() }));
        else if (!enDirecto(ruta)) localStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento */ }
}

export function rutaParaVolver(): string | null {
    try {
        const r = JSON.parse(localStorage.getItem(CLAVE) || 'null') as { ruta?: string; hora?: number } | null;
        if (!r?.ruta || !r.hora || Date.now() - r.hora > VIGENCIA) return null;
        return r.ruta;
    } catch { return null; }
}

export function olvidarDirecto() {
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
}

// La app instalada en la pantalla de inicio (iPhone: navigator.standalone; Android y PC: display-mode)
export function esAppInstalada(): boolean {
    try {
        return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    } catch { return false; }
}

// Al abrir la app instalada (siempre arranca en «/»): si el iPhone la cerró a mitad del bolo, se
// vuelve a esa canción. Se llama ANTES de pintar nada (main.tsx), así el router ya nace ahí
export const CLAVE_VOLVIO = 'musikeeo-volvio';
export function volverSiHaceFalta() {
    try {
        if (window.location.pathname !== '/' || !esAppInstalada()) return;
        const ruta = rutaParaVolver();
        if (!ruta) return;
        window.history.replaceState(null, '', ruta);
        sessionStorage.setItem(CLAVE_VOLVIO, '1');
    } catch { /* sigue en el inicio */ }
}
