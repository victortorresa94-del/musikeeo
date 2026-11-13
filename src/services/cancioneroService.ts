import { collection, deleteDoc, doc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { datosDelPegado, leerCancion } from '../lib/acordes';
import type { AjustesCancion, Bolo, Cancion, Lista, Repertorio } from '../types/cancionero';

// El cancionero vive primero en el móvil (funciona sin cuenta y sin cobertura, en el bolo)
// y, con cuenta, se copia a users/{uid}/canciones y users/{uid}/repertorios para tenerlo
// igual en el móvil y en el PC.

export const LIMITE_TEXTO = 50000;
const INVITADO = 'invitado';

export type EstadoNube = 'local' | 'sincronizando' | 'nube' | 'sin-permiso';

interface Documento { id: string; actualizadaEn: string; sincronizada?: boolean }
export interface EstadoAlmacen<T> {
    duenio: string | null;      // uid, 'invitado' o null mientras arranca
    items: T[];
    nube: EstadoNube;
    provisional?: boolean;      // aún no se sabe quién es: lo del móvil de quien entró la última vez
}

const esUid = (duenio: string | null): duenio is string => !!duenio && duenio !== INVITADO;

function crearAlmacen<T extends Documento>(clave: string, subcoleccion: string, paraNube: (x: T) => Record<string, unknown>) {
    let estado: EstadoAlmacen<T> = { duenio: null, items: [], nube: 'local' };
    const oyentes = new Set<() => void>();
    const avisar = (cambio: Partial<EstadoAlmacen<T>>) => {
        estado = { ...estado, ...cambio };
        oyentes.forEach(f => f());
    };

    const leerLocal = (duenio: string): T[] => {
        try {
            const crudo = localStorage.getItem(`${clave}:${duenio}`);
            const lista = crudo ? JSON.parse(crudo) : [];
            return Array.isArray(lista) ? lista : [];
        } catch { return []; }
    };
    const escribirLocal = (duenio: string, lista: T[]) => {
        try { localStorage.setItem(`${clave}:${duenio}`, JSON.stringify(lista)); } catch { /* sin almacenamiento */ }
    };
    const ordenar = (lista: T[]) => [...lista].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn));
    const coleccion = (uid: string) => collection(db, 'users', uid, subcoleccion);

    function fallo(e: unknown) {
        const code = (e as { code?: string })?.code;
        // Sin la regla desplegada todavía: se queda en el móvil sin dar la lata
        avisar({ nube: code === 'permission-denied' ? 'sin-permiso' : 'local' });
    }

    async function subir(uid: string, x: T) {
        if (estado.nube === 'sin-permiso') return;
        try {
            await setDoc(doc(coleccion(uid), x.id), paraNube(x));
            if (estado.duenio !== uid) return;
            const lista = estado.items.map(y => (y.id === x.id && y.actualizadaEn === x.actualizadaEn ? { ...y, sincronizada: true } : y));
            escribirLocal(uid, lista);
            avisar({ items: lista, nube: 'nube' });
        } catch (e) { fallo(e); }
    }

    // Junta lo del móvil con lo de la cuenta: gana la versión más reciente de cada uno
    async function sincronizar(uid: string) {
        avisar({ nube: 'sincronizando' });
        let enNube: T[];
        try {
            const snap = await getDocs(query(coleccion(uid), limit(500)));
            enNube = snap.docs.map(d => ({ ...(d.data() as Omit<T, 'id'>), id: d.id, sincronizada: true }) as T);
        } catch (e) { fallo(e); return; }
        if (estado.duenio !== uid) return;

        const porId = new Map(enNube.map(x => [x.id, x]));
        const pendientes: T[] = [];
        const lista: T[] = [...enNube];
        for (const local of estado.items) {
            const remoto = porId.get(local.id);
            if (!remoto) {
                // Estuvo en la cuenta y ya no: se borró desde otro sitio
                if (local.sincronizada) continue;
                lista.push(local);
                pendientes.push(local);
            } else if (local.actualizadaEn > remoto.actualizadaEn) {
                lista[lista.indexOf(remoto)] = local;
                pendientes.push(local);
            }
        }
        const ordenada = ordenar(lista);
        escribirLocal(uid, ordenada);
        avisar({ items: ordenada, nube: 'nube' });
        await Promise.all(pendientes.map(x => subir(uid, x)));
    }

    // Antes de saber quién es, lo que hay en el móvil de quien lo usó la última vez: Firebase
    // tarda en decirlo y, con cuenta, antes comprueba la sesión en la red (sin cobertura, hasta 30 s)
    function cargarPrevio(duenio: string) {
        if (estado.duenio !== null) return;
        avisar({ duenio, items: leerLocal(duenio), nube: esUid(duenio) ? 'sincronizando' : 'local', provisional: true });
    }

    // Al cambiar de cuenta (o entrar/salir) se carga lo de quien está
    function cargar(uid: string | null) {
        const duenio = uid || INVITADO;
        const yaEstan = estado.provisional && estado.duenio === duenio;
        if (estado.duenio === duenio && !yaEstan) return;
        let items = yaEstan ? estado.items : leerLocal(duenio);
        if (uid) {
            // Lo que se guardó sin cuenta pasa a la cuenta al entrar
            const sueltos = leerLocal(INVITADO);
            if (sueltos.length) {
                const ids = new Set(items.map(x => x.id));
                items = ordenar([...items, ...sueltos.filter(x => !ids.has(x.id)).map(x => ({ ...x, sincronizada: false }))]);
                escribirLocal(duenio, items);
                try { localStorage.removeItem(`${clave}:${INVITADO}`); } catch { /* */ }
            }
        }
        avisar({ duenio, items, nube: 'local', provisional: false });
        if (uid) void sincronizar(uid);
    }

    const esperando = new Map<string, ReturnType<typeof setTimeout>>();

    function guardar(x: T, opciones: { esperar?: boolean } = {}): T {
        const duenio = estado.duenio || INVITADO;
        const actual: T = { ...x, actualizadaEn: new Date().toISOString() };
        const lista = ordenar([actual, ...estado.items.filter(y => y.id !== x.id)]);
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (!esUid(duenio)) return actual;
        // Los ajustes cambian a cada toque: a la cuenta se sube cuando la persona para
        clearTimeout(esperando.get(x.id));
        if (opciones.esperar) esperando.set(x.id, setTimeout(() => { esperando.delete(x.id); void subir(duenio, actual); }, 1500));
        else void subir(duenio, actual);
        return actual;
    }

    // Muchas de golpe (al importar): una sola escritura en el móvil, un solo aviso y una sola
    // subida. Guardarlas una a una reescribía el cancionero entero por cada canción y el
    // iPhone se quedaba colgado
    function guardarVarias(xs: T[]): T[] {
        if (!xs.length) return [];
        const duenio = estado.duenio || INVITADO;
        const ahora = new Date().toISOString();
        const nuevos = xs.map(x => ({ ...x, actualizadaEn: ahora }));
        const ids = new Set(nuevos.map(x => x.id));
        const lista = ordenar([...nuevos, ...estado.items.filter(y => !ids.has(y.id))]);
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (esUid(duenio)) void subirVarias(duenio, nuevos);
        return nuevos;
    }

    async function subirVarias(uid: string, xs: T[]) {
        if (estado.nube === 'sin-permiso') return;
        try {
            await Promise.all(xs.map(x => setDoc(doc(coleccion(uid), x.id), paraNube(x))));
            if (estado.duenio !== uid) return;
            const subidas = new Map(xs.map(x => [x.id, x.actualizadaEn]));
            const lista = estado.items.map(y => (subidas.get(y.id) === y.actualizadaEn ? { ...y, sincronizada: true } : y));
            escribirLocal(uid, lista);
            avisar({ items: lista, nube: 'nube' });
        } catch (e) { fallo(e); }
    }

    async function borrar(id: string) {
        const duenio = estado.duenio || INVITADO;
        clearTimeout(esperando.get(id));
        const lista = estado.items.filter(x => x.id !== id);
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (esUid(duenio) && estado.nube !== 'sin-permiso') {
            try { await deleteDoc(doc(coleccion(duenio), id)); } catch (e) { fallo(e); }
        }
    }

    // Varias de golpe (borrar en lote): una sola escritura en el móvil; en la nube, una a una
    async function borrarVarias(ids: string[]) {
        if (!ids.length) return;
        const duenio = estado.duenio || INVITADO;
        const fuera = new Set(ids);
        fuera.forEach(id => clearTimeout(esperando.get(id)));
        const lista = estado.items.filter(x => !fuera.has(x.id));
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (esUid(duenio) && estado.nube !== 'sin-permiso') {
            for (const id of ids) {
                try { await deleteDoc(doc(coleccion(duenio), id)); } catch (e) { fallo(e); break; }
            }
        }
    }

    // Empezar de cero: el móvil se vacía al momento y, con cuenta, se borra también lo de la nube
    // (lo que el móvil sabía y lo que hubiera allí). Sin permiso en la nube, solo el móvil
    async function vaciar() {
        const duenio = estado.duenio || INVITADO;
        esperando.forEach(t => clearTimeout(t));
        esperando.clear();
        const antes = estado.items.map(x => x.id);
        escribirLocal(duenio, []);
        avisar({ items: [] });
        if (!esUid(duenio) || estado.nube === 'sin-permiso') return;
        try {
            const snap = await getDocs(query(coleccion(duenio), limit(1000)));
            const ids = new Set([...antes, ...snap.docs.map(d => d.id)]);
            await Promise.all([...ids].map(id => deleteDoc(doc(coleccion(duenio), id))));
        } catch (e) { fallo(e); }
    }

    const suscribir = (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };
    return { suscribir, estado: () => estado, cargarPrevio, cargar, guardar, guardarVarias, borrar, borrarVarias, vaciar };
}

// Firestore no admite undefined: los datos opcionales solo van si están
const siHay = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const almacenCanciones = crearAlmacen<Cancion>('musikeeo-cancionero-v1', 'canciones', c => ({
    titulo: c.titulo, artista: c.artista, texto: c.texto, ajustes: c.ajustes, creadaEn: c.creadaEn, actualizadaEn: c.actualizadaEn,
    ...siHay({ portada: c.portada, duracion: c.duracion, muestra: c.muestra, bpm: c.bpm, ficha: c.ficha && siHay(c.ficha), version: c.version, original: c.original, notas: c.notas, favorita: c.favorita || undefined }),
}));

export const almacenRepertorios = crearAlmacen<Repertorio>('musikeeo-repertorios-v1', 'repertorios', r => ({
    nombre: r.nombre, fecha: r.fecha, canciones: r.canciones, creadaEn: r.creadaEn, actualizadaEn: r.actualizadaEn,
    ...siHay({ notas: r.notas, hueco: r.hueco, compartido: r.compartido && siHay(r.compartido), extras: r.extras?.length ? r.extras : undefined }),
}));

export const almacenListas = crearAlmacen<Lista>('musikeeo-listas-v1', 'listas', l => ({
    nombre: l.nombre, canciones: l.canciones, creadaEn: l.creadaEn, actualizadaEn: l.actualizadaEn,
    ...siHay({ color: l.color, regla: l.regla && siHay({ filtros: l.regla.filtros && siHay(l.regla.filtros), texto: l.regla.texto }), orden: l.orden }),
}));

export const almacenBolos = crearAlmacen<Bolo>('musikeeo-bolos-v1', 'bolos', b => ({
    titulo: b.titulo, fecha: b.fecha, horario: b.horario, sets: b.sets.map(s => siHay(s)), creadaEn: b.creadaEn, actualizadaEn: b.actualizadaEn,
    ...siHay({ lugar: b.lugar, direccion: b.direccion, contacto: b.contacto, telefono: b.telefono, notas: b.notas, compartido: b.compartido && siHay(b.compartido) }),
}));

export const AJUSTES_INICIALES: AjustesCancion = {
    semitonos: 0,
    cejilla: 0,
    notacion: 'original',
    alteraciones: 'auto',
    tamano: typeof window !== 'undefined' && window.innerWidth >= 768 ? 18 : 16,   // 13-nov: «muy grande… en todas»
    columnas: 1,
    ajustar: false,
    vista: 'completa',
    velocidad: 18,
};

const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Una canción nueva lista para guardar (sin guardarla todavía)
function nuevaCancion(datos: { titulo: string; artista: string; texto: string }, ajustes: Partial<AjustesCancion> = {}): Cancion {
    const ahora = new Date().toISOString();
    const leida = leerCancion(datos.texto);
    return {
        id: nuevoId(),
        titulo: (datos.titulo.trim() || leida.meta.titulo || 'Sin título').slice(0, 120),
        artista: (datos.artista.trim() || leida.meta.artista || '').slice(0, 120),
        texto: datos.texto.slice(0, LIMITE_TEXTO),
        ajustes: { ...AJUSTES_INICIALES, cejilla: leida.meta.cejilla ?? datosDelPegado(datos.texto).cejilla ?? 0, ...ajustes },
        creadaEn: ahora,
        actualizadaEn: ahora,
    };
}

function crear(datos: { titulo: string; artista: string; texto: string }, ajustes: Partial<AjustesCancion> = {}): Cancion {
    return almacenCanciones.guardar(nuevaCancion(datos, ajustes));
}

function crearRepertorio(nombre: string, canciones: string[] = []): Repertorio {
    const ahora = new Date().toISOString();
    return almacenRepertorios.guardar({
        id: nuevoId(),
        nombre: nombre.trim().slice(0, 120) || 'Repertorio',
        fecha: new Date().toLocaleDateString('sv-SE'),
        canciones,
        creadaEn: ahora,
        actualizadaEn: ahora,
    });
}

// Un bolo nuevo, guardado (con lo que se sepa: título, fecha, sets…)
function crearBolo(datos: Partial<Omit<Bolo, 'id' | 'creadaEn' | 'actualizadaEn'>> = {}): Bolo {
    const ahora = new Date().toISOString();
    return almacenBolos.guardar({
        id: nuevoId(),
        titulo: (datos.titulo ?? '').trim().slice(0, 120) || 'Bolo',
        fecha: datos.fecha ?? new Date().toLocaleDateString('sv-SE'),
        horario: datos.horario ?? [],
        sets: datos.sets ?? [],
        ...(datos.lugar ? { lugar: datos.lugar } : {}),
        ...(datos.direccion ? { direccion: datos.direccion } : {}),
        creadaEn: ahora,
        actualizadaEn: ahora,
    });
}

// Al borrar una canción, sale también de los repertorios
async function borrarCancion(id: string) {
    for (const r of almacenRepertorios.estado().items) {
        if (r.canciones.includes(id) || r.extras?.includes(id)) almacenRepertorios.guardar({ ...r, canciones: r.canciones.filter(c => c !== id), extras: r.extras?.filter(c => c !== id) });
    }
    for (const l of almacenListas.estado().items) {
        if (l.canciones.includes(id)) almacenListas.guardar({ ...l, canciones: l.canciones.filter(c => c !== id), actualizadaEn: new Date().toISOString() });
    }
    await almacenCanciones.borrar(id);
}

// Borrar varias canciones de una vez. Si alguna está en un repertorio: con quitarDeRepertorios
// sale también de ahí; si no, las de los repertorios NO se borran. Devuelve lo necesario para
// Deshacer (las canciones y los repertorios y listas como estaban)
function borrarCanciones(ids: string[], quitarDeRepertorios: boolean) {
    const enRep = new Set(almacenRepertorios.estado().items.flatMap(r => [...r.canciones, ...(r.extras ?? [])]));
    const aBorrar = quitarDeRepertorios ? ids : ids.filter(id => !enRep.has(id));
    const fuera = new Set(aBorrar);
    const canciones = almacenCanciones.estado().items.filter(c => fuera.has(c.id));
    const repertorios = almacenRepertorios.estado().items.filter(r => [...r.canciones, ...(r.extras ?? [])].some(c => fuera.has(c)));
    const listas = almacenListas.estado().items.filter(l => l.canciones.some(c => fuera.has(c)));
    almacenRepertorios.guardarVarias(repertorios.map(r => ({ ...r, canciones: r.canciones.filter(c => !fuera.has(c)), extras: r.extras?.filter(c => !fuera.has(c)) })));
    almacenListas.guardarVarias(listas.map(l => ({ ...l, canciones: l.canciones.filter(c => !fuera.has(c)) })));
    void almacenCanciones.borrarVarias(aBorrar);
    return {
        borradas: aBorrar.length,
        deshacer: () => {
            almacenCanciones.guardarVarias(canciones);
            almacenRepertorios.guardarVarias(repertorios);
            almacenListas.guardarVarias(listas);
        },
    };
}

// Quién usó el cancionero la última vez en este dispositivo (uid o 'invitado'): solo una pista
// para enseñar sus canciones al momento, sin esperar a Firebase (en el bolo puede no haber red)
const CLAVE_ULTIMO = 'musikeeo-cancionero-ultimo';

function cargar(uid: string | null) {
    almacenCanciones.cargar(uid);
    almacenRepertorios.cargar(uid);
    almacenListas.cargar(uid);
    almacenBolos.cargar(uid);
    try { localStorage.setItem(CLAVE_ULTIMO, uid || INVITADO); } catch { /* sin almacenamiento */ }
}

// Sin pista (la primera vez) se espera a Firebase como siempre
function cargarPrevio() {
    let ultimo: string | null = null;
    try { ultimo = localStorage.getItem(CLAVE_ULTIMO); } catch { /* sin almacenamiento */ }
    if (!ultimo) return;
    almacenCanciones.cargarPrevio(ultimo);
    almacenRepertorios.cargarPrevio(ultimo);
    almacenListas.cargarPrevio(ultimo);
    almacenBolos.cargarPrevio(ultimo);
}
if (typeof window !== 'undefined') cargarPrevio();

export const cancioneroService = {
    cargar,
    crear,
    nuevaCancion,
    guardar: almacenCanciones.guardar,
    guardarVarias: almacenCanciones.guardarVarias,
    borrar: borrarCancion,
    borrarCanciones,
    crearRepertorio,
    guardarRepertorio: almacenRepertorios.guardar,
    borrarRepertorio: almacenRepertorios.borrar,
    guardarLista: almacenListas.guardar,
    borrarLista: almacenListas.borrar,
    crearBolo,
    guardarBolo: almacenBolos.guardar,
    borrarBolo: almacenBolos.borrar,
    // Borrar todo el cancionero (canciones, repertorios, listas y bolos) para empezar de cero
    vaciarTodo: async () => { await Promise.all([almacenCanciones.vaciar(), almacenRepertorios.vaciar(), almacenListas.vaciar(), almacenBolos.vaciar()]); },
};
