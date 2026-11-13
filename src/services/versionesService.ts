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
function abrir(): Promise<IDBDatabase | null> {
    if (abierta) return abierta;
    abierta = new Promise(resolver => {
        try {
            const r = indexedDB.open(DB, 1);
            r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ALMACEN)) r.result.createObjectStore(ALMACEN); };
            r.onsuccess = () => resolver(r.result);
            r.onerror = () => resolver(null);
            r.onblocked = () => resolver(null);
        } catch { resolver(null); }
    });
    return abierta;
}

function leer(db: IDBDatabase, id: string): Promise<Version[]> {
    return new Promise(resolver => {
        try {
            const r = db.transaction(ALMACEN, 'readonly').objectStore(ALMACEN).get(id);
            r.onsuccess = () => resolver(Array.isArray(r.result) ? r.result as Version[] : []);
            r.onerror = () => resolver([]);
        } catch { resolver([]); }
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
        } catch { resolver(); }
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
        const lista = await leer(db, id);
        if (lista[0]?.texto === texto) return;
        lista.unshift({ texto, fecha: new Date().toISOString(), motivo });
        await escribir(db, id, lista.slice(0, POR_CANCION));
    }).catch(() => { /* sin versiones, sin avisar */ });
}

// Las versiones anteriores de una canción, de la más nueva a la más vieja
export async function versionesDe(id: string): Promise<Version[]> {
    await cola;
    const db = await abrir();
    return db ? leer(db, id) : [];
}
