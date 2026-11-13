// Versiones anteriores de la letra de cada canción (13-nov, Víctor: «había puesto unos apuntes en
// mi canción de Marcha y ahora he entrado y se han borrado la mitad»). Cada vez que el texto de una
// canción cambia —lo editas, llega otra versión de otro aparato o lo pisa una importación— el de
// antes se guarda aquí, para poder recuperarlo. Nada de la letra se pierde sin dejar copia.
//
// Vive en IndexedDB del dispositivo, aparte del cancionero: en localStorage le quitaría sitio (unos
// 5 MB para todo) y el día que no cupiera dejaría de guardarse la canción, que es peor. Sin
// IndexedDB (algún modo privado) no hay versiones, sin avisar: la canción sigue igual.

export type MotivoVersion = 'editar' | 'otro' | 'importar';
export interface Version { texto: string; fecha: string; motivo: MotivoVersion }

const DB = 'musikeeo-versiones';
const ALMACEN = 'versiones';
const POR_CANCION = 25;

let abierta: Promise<IDBDatabase | null> | null = null;
// Se reabre si no se pudo o si el sistema la cerró (en iOS, al volver de segundo plano)
function abrir(): Promise<IDBDatabase | null> {
    if (abierta) return abierta;
    const intento: Promise<IDBDatabase | null> = new Promise(resolver => {
        try {
            const r = indexedDB.open(DB, 1);
            r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ALMACEN)) r.result.createObjectStore(ALMACEN); };
            r.onsuccess = () => {
                const db = r.result;
                db.onclose = () => { abierta = null; };
                db.onversionchange = () => { db.close(); abierta = null; };
                resolver(db);
            };
            r.onerror = () => resolver(null);
            r.onblocked = () => resolver(null);
        } catch { resolver(null); }
    });
    abierta = intento;
    void intento.then(db => { if (!db && abierta === intento) abierta = null; });
    return intento;
}

// null = no se pudo leer (distinto de «no hay ninguna»: entonces no se escribe, o se borrarían las de antes)
function leer(db: IDBDatabase, id: string): Promise<Version[] | null> {
    return new Promise(resolver => {
        try {
            const r = db.transaction(ALMACEN, 'readonly').objectStore(ALMACEN).get(id);
            r.onsuccess = () => resolver(Array.isArray(r.result) ? r.result as Version[] : []);
            r.onerror = () => resolver(null);
        } catch { abierta = null; resolver(null); }
    });
}

function escribir(db: IDBDatabase, id: string, lista: Version[]): Promise<void> {
    return new Promise(resolver => {
        try {
            const t = db.transaction(ALMACEN, 'readwrite');
            t.objectStore(ALMACEN).put(lista, id);
            t.oncomplete = () => resolver();
            t.onerror = () => resolver();
            t.onabort = () => resolver();
        } catch { abierta = null; resolver(); }
    });
}

// Las escrituras van en fila: dos cambios seguidos de la misma canción no se pisan al leer y escribir
let cola: Promise<void> = Promise.resolve();

// Guarda `texto` como versión anterior de la canción `id` (la más nueva, primero). No repite la
// misma si ya es la última guardada
export function apuntarVersion(id: string, texto: string, motivo: MotivoVersion) {
    if (!id || !texto || !texto.trim()) return;
    cola = cola.then(async () => {
        const db = await abrir();
        if (!db) return;
        let lista = await leer(db, id);
        if (lista === null) {   // la conexión se había cerrado: una vez más con una nueva
            const otra = await abrir();
            lista = otra ? await leer(otra, id) : null;
            if (lista === null || !otra) return;
            if (lista[0]?.texto === texto) return;
            lista.unshift({ texto, fecha: new Date().toISOString(), motivo });
            await escribir(otra, id, lista.slice(0, POR_CANCION));
            return;
        }
        if (lista[0]?.texto === texto) return;
        lista.unshift({ texto, fecha: new Date().toISOString(), motivo });
        await escribir(db, id, lista.slice(0, POR_CANCION));
    }).catch(() => { /* sin versiones, sin avisar */ });
}

// Las versiones anteriores de una canción, de la más nueva a la más vieja
export async function versionesDe(id: string): Promise<Version[]> {
    await cola;
    const db = await abrir();
    const lista = db ? await leer(db, id) : null;
    if (lista !== null) return lista;
    const otra = await abrir();
    return (otra && await leer(otra, id)) ?? [];
}
