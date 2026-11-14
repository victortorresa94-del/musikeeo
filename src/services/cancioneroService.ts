import { collection, deleteDoc, doc, documentId, getDocs, limit, orderBy, query, setDoc, startAfter, type Query, type QuerySnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { datosDelPegado, leerCancion } from '../lib/acordes';
import { apuntarVersion, type MotivoVersion } from './versionesService';
import type { AjustesCancion, Bolo, Cancion, Lista, Repertorio, Tarea } from '../types/cancionero';

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

// `alReemplazar`: avisa cuando una versión de algo deja paso a otra (las canciones guardan su letra
// de antes, ver versionesService)
function crearAlmacen<T extends Documento>(clave: string, subcoleccion: string, paraNube: (x: T) => Record<string, unknown>,
    alReemplazar?: (viejo: T, nuevo: T, motivo: MotivoVersion) => void) {
    let estado: EstadoAlmacen<T> = { duenio: null, items: [], nube: 'local' };
    // Hasta dónde se ha leído la cuenta (fecha y id del último cambio visto), para pedir solo lo
    // cambiado después y en orden. Sin él (no se pudo sincronizar), el refresco sincroniza entero
    let cursor: { fecha: string; id: string } | null = null;
    // Lo que se acaba de borrar aquí (que un refresco a medio borrar no lo traiga de vuelta)
    const borradas = new Set<string>();
    // Lo que la cuenta no acepta (sus reglas aún no conocen algún campo): no se reintenta en esta
    // sesión, se queda en el móvil, y lo demás sigue subiendo. Antes un solo rechazo paraba TODO
    const rechazadas = new Set<string>();
    const subiendo = new Set<string>();
    const enLaNube = new Set<string>();
    const reemplazar = (viejo: T | undefined, nuevo: T, motivo: MotivoVersion) => {
        if (viejo && alReemplazar) { try { alReemplazar(viejo, nuevo, motivo); } catch { /* la copia no frena el guardado */ } }
    };
    const avanzar = (xs: T[]) => {
        for (const x of xs) {
            if (!cursor || x.actualizadaEn > cursor.fecha || (x.actualizadaEn === cursor.fecha && x.id > cursor.id)) cursor = { fecha: x.actualizadaEn, id: x.id };
        }
    };
    // ¿Lo mismo? (las claves de un mapa pueden volver de la nube en otro orden)
    const estable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x)
        ? Object.fromEntries(Object.keys(x).sort().map(k => [k, (x as Record<string, unknown>)[k]])) : x));
    const igual = (a: T, b: T) => estable(paraNube(a)) === estable(paraNube(b));
    const deLaNube = (d: { id: string; data: () => unknown }) => ({ ...(d.data() as Omit<T, 'id'>), id: d.id, sincronizada: true }) as T;
    const sinRed = () => typeof navigator !== 'undefined' && navigator.onLine === false;
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
    const permisoDenegado = (e: unknown) => (e as { code?: string })?.code === 'permission-denied';

    // Sin permiso para LEER (la regla de la colección no está): se queda en el móvil sin dar la lata
    function fallo(e: unknown, leyendo = false) {
        if (permisoDenegado(e)) { if (leyendo) avisar({ nube: 'sin-permiso' }); return; }
        avisar({ nube: 'local' });
    }
    const marcarSubida = (uid: string, xs: T[]) => {
        if (estado.duenio !== uid || !xs.length) return;
        const subidas = new Map(xs.map(x => [x.id, x.actualizadaEn]));
        xs.forEach(x => enLaNube.add(x.id));
        const lista = estado.items.map(y => (subidas.get(y.id) === y.actualizadaEn ? { ...y, sincronizada: true } : y));
        escribirLocal(uid, lista);
        avisar({ items: lista, nube: 'nube' });
    };

    // campos: solo esos (con la fecha), sobre lo que ya hay en la cuenta. Un ajuste (tono, tamaño)
    // no vuelve a subir la letra: si otro aparato la cambió, no se pisa
    async function subir(uid: string, x: T, campos?: string[]) {
        if (estado.nube === 'sin-permiso' || rechazadas.has(x.id)) return;
        subiendo.add(x.id);
        try {
            const datos = paraNube(x);
            const ref = doc(coleccion(uid), x.id);
            if (campos && enLaNube.has(x.id)) {
                await setDoc(ref, { ...Object.fromEntries(campos.filter(k => k in datos).map(k => [k, datos[k]])), actualizadaEn: x.actualizadaEn }, { merge: true });
            } else await setDoc(ref, datos);
            marcarSubida(uid, [x]);
        } catch (e) {
            if (permisoDenegado(e)) rechazadas.add(x.id); else fallo(e);
        } finally { subiendo.delete(x.id); }
    }

    // Junta lo del móvil con lo de la cuenta: gana la versión más reciente de cada uno
    async function sincronizar(uid: string) {
        avisar({ nube: 'sincronizando' });
        const enNube: T[] = [];
        try {
            // Por páginas: con más de las que caben en una, las de más no se daban por borradas
            let ultimo: string | null = null;
            for (let pagina = 0; pagina < 20; pagina++) {
                const q: Query = ultimo
                    ? query(coleccion(uid), orderBy(documentId()), startAfter(ultimo), limit(1000))
                    : query(coleccion(uid), orderBy(documentId()), limit(1000));
                const snap: QuerySnapshot = await getDocs(q);
                // Sin red, Firestore contesta con su copia del móvil (que puede estar incompleta): no
                // se decide nada con ella (borraría lo que no tenga). Se vuelve a intentar al refrescar
                if (snap.metadata.fromCache) { if (estado.duenio === uid) avisar({ nube: 'local' }); return; }
                enNube.push(...snap.docs.map(deLaNube));
                if (snap.size < 1000) break;
                ultimo = snap.docs[snap.docs.length - 1].id;
            }
        } catch (e) { fallo(e, true); return; }
        if (estado.duenio !== uid) return;

        enNube.forEach(x => enLaNube.add(x.id));
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
            } else {
                // Gana la de la cuenta: lo que había aquí se queda como versión anterior
                reemplazar(local, remoto, 'otro');
            }
        }
        // Desde dónde pedir lo nuevo: lo último de la cuenta (o, si está vacía, hace un rato)
        cursor = null;
        avanzar(enNube);
        if (!cursor) cursor = { fecha: new Date(Date.now() - 10 * 60_000).toISOString(), id: '' };
        const ordenada = ordenar(lista);
        escribirLocal(uid, ordenada);
        avisar({ items: ordenada, nube: 'nube' });
        await Promise.all(pendientes.filter(x => !rechazadas.has(x.id)).map(x => subir(uid, x)));
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
        cursor = null;
        avisar({ duenio, items, nube: 'local', provisional: false });
        if (uid) void sincronizar(uid);
    }

    const esperando = new Map<string, ReturnType<typeof setTimeout>>();
    // Lo que espera para subir ENTERO (un cambio sin `campos` todavía sin subir): un ajuste que
    // llegue después no puede subir solo su campo, o ese cambio se quedaría sin subir
    const pendienteEntero = new Set<string>();
    // Los campos sueltos que esperan para subir (un ajuste y luego la letra): se suben juntos
    const camposPendientes = new Map<string, Set<string>>();

    // campos: lo que cambia (p. ej. ['ajustes']): a la cuenta sube solo eso, sobre lo que ya hay
    function guardar(x: T, opciones: { esperar?: boolean; campos?: string[] } = {}): T {
        const duenio = estado.duenio || INVITADO;
        const actual: T = { ...x, actualizadaEn: new Date().toISOString(), sincronizada: false };
        reemplazar(estado.items.find(y => y.id === x.id), actual, 'editar');
        borradas.delete(x.id);
        const lista = ordenar([actual, ...estado.items.filter(y => y.id !== x.id)]);
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (!esUid(duenio)) return actual;
        clearTimeout(esperando.get(x.id));
        esperando.delete(x.id);
        let campos: string[] | undefined;
        if (opciones.campos && !pendienteEntero.has(x.id)) {
            const juntos = new Set([...(camposPendientes.get(x.id) ?? []), ...opciones.campos]);
            camposPendientes.set(x.id, juntos);
            campos = [...juntos];
        } else {
            pendienteEntero.add(x.id);
            camposPendientes.delete(x.id);
        }
        // Al subir, lo que haya en ese momento (no la copia de cuando se tocó)
        const subida = () => {
            if (campos) camposPendientes.delete(x.id); else pendienteEntero.delete(x.id);
            void subir(duenio, estado.items.find(y => y.id === x.id) ?? actual, campos);
        };
        // Los ajustes cambian a cada toque: a la cuenta se sube cuando la persona para
        if (opciones.esperar) esperando.set(x.id, setTimeout(() => { esperando.delete(x.id); subida(); }, 1500));
        else subida();
        return actual;
    }

    // Muchas de golpe (al importar): una sola escritura en el móvil, un solo aviso y una sola
    // subida. Guardarlas una a una reescribía el cancionero entero por cada canción y el
    // iPhone se quedaba colgado
    function guardarVarias(xs: T[]): T[] {
        if (!xs.length) return [];
        const duenio = estado.duenio || INVITADO;
        const ahora = new Date().toISOString();
        const nuevos = xs.map(x => ({ ...x, actualizadaEn: ahora, sincronizada: false }));
        const antes = new Map(estado.items.map(y => [y.id, y]));
        nuevos.forEach(x => {
            reemplazar(antes.get(x.id), x, 'importar');
            borradas.delete(x.id);
            // Lo que esperaba para subir ya va en esta subida (el temporizador subiría lo de antes)
            clearTimeout(esperando.get(x.id)); esperando.delete(x.id); pendienteEntero.delete(x.id); camposPendientes.delete(x.id);
        });
        const ids = new Set(nuevos.map(x => x.id));
        const lista = ordenar([...nuevos, ...estado.items.filter(y => !ids.has(y.id))]);
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (esUid(duenio)) void subirVarias(duenio, nuevos);
        return nuevos;
    }

    async function subirVarias(uid: string, xs: T[]) {
        if (estado.nube === 'sin-permiso') return;
        const aSubir = xs.filter(x => !rechazadas.has(x.id));
        aSubir.forEach(x => subiendo.add(x.id));
        const hechos = await Promise.allSettled(aSubir.map(x => setDoc(doc(coleccion(uid), x.id), paraNube(x))));
        aSubir.forEach(x => subiendo.delete(x.id));
        const bien: T[] = [];
        let otroFallo: unknown = null;
        hechos.forEach((h, i) => {
            if (h.status === 'fulfilled') bien.push(aSubir[i]);
            else if (permisoDenegado(h.reason)) rechazadas.add(aSubir[i].id);
            else otroFallo = h.reason;
        });
        marcarSubida(uid, bien);
        if (otroFallo) fallo(otroFallo);
    }

    async function borrar(id: string) {
        const duenio = estado.duenio || INVITADO;
        clearTimeout(esperando.get(id));
        esperando.delete(id);
        pendienteEntero.delete(id);
        camposPendientes.delete(id);
        borradas.add(id);
        const lista = estado.items.filter(x => x.id !== id);
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (esUid(duenio) && estado.nube !== 'sin-permiso') {
            try { await deleteDoc(doc(coleccion(duenio), id)); enLaNube.delete(id); } catch (e) { fallo(e); }
        }
    }

    // Varias de golpe (borrar en lote): una sola escritura en el móvil; en la nube, una a una
    async function borrarVarias(ids: string[]) {
        if (!ids.length) return;
        const duenio = estado.duenio || INVITADO;
        const fuera = new Set(ids);
        fuera.forEach(id => { clearTimeout(esperando.get(id)); esperando.delete(id); pendienteEntero.delete(id); camposPendientes.delete(id); borradas.add(id); });
        const lista = estado.items.filter(x => !fuera.has(x.id));
        escribirLocal(duenio, lista);
        avisar({ items: lista });
        if (esUid(duenio) && estado.nube !== 'sin-permiso') {
            for (const id of ids) {
                try { await deleteDoc(doc(coleccion(duenio), id)); enLaNube.delete(id); } catch (e) { fallo(e); break; }
            }
        }
    }

    // Empezar de cero: el móvil se vacía al momento y, con cuenta, se borra también lo de la nube
    // (lo que el móvil sabía y lo que hubiera allí). Sin permiso en la nube, solo el móvil
    async function vaciar() {
        const duenio = estado.duenio || INVITADO;
        esperando.forEach(t => clearTimeout(t));
        esperando.clear();
        pendienteEntero.clear();
        camposPendientes.clear();
        const antes = estado.items.map(x => x.id);
        antes.forEach(id => borradas.add(id));
        escribirLocal(duenio, []);
        avisar({ items: [] });
        if (!esUid(duenio) || estado.nube === 'sin-permiso') return;
        try {
            const snap = await getDocs(query(coleccion(duenio), limit(5000)));
            const ids = new Set([...antes, ...snap.docs.map(d => d.id)]);
            // Lo que se haya importado mientras tanto (ya está otra vez en el móvil) no se borra
            const ahora = new Set(estado.items.map(x => x.id));
            await Promise.all([...ids].filter(id => !ahora.has(id)).map(id => deleteDoc(doc(coleccion(duenio), id)).then(() => enLaNube.delete(id))));
        } catch (e) { fallo(e); }
    }

    // Al volver a la app (o cada poco mientras se mira): lo cambiado en la cuenta desde otro aparato.
    // Sin esto, el móvil que llevaba horas abierto guardaba su copia vieja ENTERA al tocar un ajuste
    // (tono, tamaño, zoom) y pisaba la letra escrita en el PC. Pide solo lo cambiado desde lo último
    // visto, en orden y por páginas (tras importar cientos de golpe, todas tienen la misma fecha); lo
    // que otro aparato guarde con el reloj atrasado llega al volver a abrir la app. De paso, sube lo
    // que se quedó sin subir por falta de red
    let refrescando = false;
    async function refrescar() {
        const uid = estado.duenio;
        if (!esUid(uid) || estado.provisional || estado.nube === 'sin-permiso' || refrescando || sinRed()) return;
        if (!cursor) { if (estado.nube !== 'sincronizando') await sincronizar(uid); return; }
        refrescando = true;
        try {
            const remotos: T[] = [];
            let desde = cursor;
            let entero = false;
            for (let pagina = 0; ; pagina++) {
                // Sin id (la cuenta estaba vacía), solo por fecha: un id vacío hace fallar la consulta
                const despues = desde.id ? startAfter(desde.fecha, desde.id) : startAfter(desde.fecha);
                const snap = await getDocs(query(coleccion(uid), orderBy('actualizadaEn'), orderBy(documentId()), despues, limit(300)));
                if (snap.metadata.fromCache) return;   // sin red de verdad: nada que decidir
                const lote = snap.docs.map(deLaNube);
                remotos.push(...lote);
                if (lote.length < 300) break;
                if (pagina >= 3) { entero = true; break; }   // muchísimo cambio: mejor entero
                const u = lote[lote.length - 1];
                desde = { fecha: u.actualizadaEn, id: u.id };
            }
            if (estado.duenio !== uid) return;
            if (entero) { refrescando = false; await sincronizar(uid); return; }
            remotos.forEach(x => enLaNube.add(x.id));
            const porId = new Map(estado.items.map(x => [x.id, x]));
            let cambio = false;
            const lista = [...estado.items];
            // La primera que no se puede decidir ahora (se está subiendo): la marca no pasa de ella,
            // para volver a mirarla en el siguiente refresco (si no, no se miraría nunca más)
            let tope: T | null = null;
            for (const remoto of remotos) {
                if (borradas.has(remoto.id)) continue;
                const local = porId.get(remoto.id);
                if (!local) { lista.push(remoto); cambio = true; continue; }
                if (esperando.has(local.id) || subiendo.has(local.id)) { tope ??= remoto; continue; }
                // Más nuevo en la cuenta, o el mismo momento con otra cosa dentro (un ajuste de aquí
                // subido sobre la letra que puso otro aparato): manda la cuenta
                const masNuevo = remoto.actualizadaEn > local.actualizadaEn;
                const mismoDistinto = remoto.actualizadaEn === local.actualizadaEn && !igual(remoto, local);
                if (mismoDistinto && !local.sincronizada) { tope ??= remoto; continue; }
                if (masNuevo || mismoDistinto) {
                    reemplazar(local, remoto, 'otro');
                    lista[lista.indexOf(local)] = remoto;
                    cambio = true;
                }
            }
            avanzar(tope ? remotos.slice(0, remotos.indexOf(tope)) : remotos);
            if (cambio) {
                const ordenada = ordenar(lista);
                escribirLocal(uid, ordenada);
                avisar({ items: ordenada });
            }
            const sinSubir = estado.items.filter(x => !x.sincronizada && !esperando.has(x.id) && !subiendo.has(x.id) && !rechazadas.has(x.id)).slice(0, 50);
            await Promise.all(sinSubir.map(x => subir(uid, x)));
        } catch (e) {
            if (permisoDenegado(e)) fallo(e, true);   // sin la regla para leer; lo demás (red), al volver
            else if (import.meta.env.DEV) console.warn('[refrescar]', subcoleccion, e);
        } finally { refrescando = false; }
    }

    const suscribir = (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };
    return { suscribir, estado: () => estado, cargarPrevio, cargar, guardar, guardarVarias, borrar, borrarVarias, vaciar, refrescar };
}

// Firestore no admite undefined: los datos opcionales solo van si están
const siHay = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

// Las claves de la ficha que aceptan las reglas (firestore.rules, canciones): una de más hace que la
// cuenta rechace la canción entera. Lo demás se queda en el móvil
const FICHA_EN_LA_NUBE = ['tono', 'capo', 'canta', 'proyectos', 'estilo', 'energia', 'estado', 'etiquetas', 'enlace', 'tonoAlt', 'extra'] as const;
const fichaParaNube = (f: Cancion['ficha']) => f && siHay(Object.fromEntries(FICHA_EN_LA_NUBE.filter(k => k in f).map(k => [k, f[k]])));

export const almacenCanciones = crearAlmacen<Cancion>('musikeeo-cancionero-v1', 'canciones', c => ({
    titulo: c.titulo, artista: c.artista, texto: c.texto, ajustes: c.ajustes, creadaEn: c.creadaEn, actualizadaEn: c.actualizadaEn,
    ...siHay({ portada: c.portada, duracion: c.duracion, muestra: c.muestra, bpm: c.bpm, ficha: fichaParaNube(c.ficha), version: c.version, original: c.original, notas: c.notas, favorita: c.favorita || undefined, spotify: c.spotify, youtube: c.youtube }),
}), (viejo, nuevo, motivo) => { if (viejo.texto !== nuevo.texto) apuntarVersion(viejo.id, viejo.texto, motivo); });

export const almacenRepertorios = crearAlmacen<Repertorio>('musikeeo-repertorios-v1', 'repertorios', r => ({
    nombre: r.nombre, fecha: r.fecha, canciones: r.canciones, creadaEn: r.creadaEn, actualizadaEn: r.actualizadaEn,
    ...siHay({ notas: r.notas, hueco: r.hueco, compartido: r.compartido && siHay(r.compartido), extras: r.extras?.length ? r.extras : undefined, spotify: r.spotify, icono: r.icono }),
}));

export const almacenListas = crearAlmacen<Lista>('musikeeo-listas-v1', 'listas', l => ({
    nombre: l.nombre, canciones: l.canciones, creadaEn: l.creadaEn, actualizadaEn: l.actualizadaEn,
    ...siHay({ color: l.color, regla: l.regla && siHay({ filtros: l.regla.filtros && siHay(l.regla.filtros), texto: l.regla.texto }), orden: l.orden }),
}));

export const almacenBolos = crearAlmacen<Bolo>('musikeeo-bolos-v1', 'bolos', b => ({
    titulo: b.titulo, fecha: b.fecha, horario: b.horario, sets: b.sets.map(s => siHay(s)), creadaEn: b.creadaEn, actualizadaEn: b.actualizadaEn,
    ...siHay({ lugar: b.lugar, direccion: b.direccion, contacto: b.contacto, telefono: b.telefono, notas: b.notas, compartido: b.compartido && siHay(b.compartido) }),
}));

export const almacenTareas = crearAlmacen<Tarea>('musikeeo-tareas-v1', 'tareas', t => ({
    texto: t.texto, prioridad: t.prioridad, creadaEn: t.creadaEn, actualizadaEn: t.actualizadaEn,
    ...siHay({ hecha: t.hecha, cancionId: t.cancionId, cancionTitulo: t.cancionTitulo, repertorioId: t.repertorioId, repertorioNombre: t.repertorioNombre, boloId: t.boloId, boloTitulo: t.boloTitulo, para: t.para }),
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

// Una tarea nueva, guardada (sin campos vacíos: Firestore no admite undefined)
function crearTarea(datos: Partial<Omit<Tarea, 'id' | 'creadaEn' | 'actualizadaEn'>> & { texto: string }): Tarea {
    const ahora = new Date().toISOString();
    const limpio = Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== undefined && v !== '')) as Partial<Tarea>;
    return almacenTareas.guardar({
        ...limpio,
        id: nuevoId(),
        texto: datos.texto.trim().slice(0, 300) || 'Tarea',
        prioridad: datos.prioridad ?? 'media',
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
    almacenTareas.cargar(uid);
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
    almacenTareas.cargarPrevio(ultimo);
}
if (typeof window !== 'undefined') cargarPrevio();
// Solo en desarrollo: para las pruebas (en producción no existe)
if (import.meta.env.DEV && typeof window !== 'undefined') Object.assign(window, { __cancionero: { canciones: almacenCanciones } });

// Ponerse al día con la cuenta al volver a la app, al recuperar la red y cada minuto mientras se
// mira: así un aparato abierto desde hace horas no guarda su copia vieja encima de lo escrito en
// otro (ver refrescar en crearAlmacen). Como mucho una vez cada 15 s
let ultimoRefresco = 0;
function refrescarTodo() {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (Date.now() - ultimoRefresco < 15_000) return;
    ultimoRefresco = Date.now();
    void almacenCanciones.refrescar();
    void almacenRepertorios.refrescar();
    void almacenListas.refrescar();
    void almacenBolos.refrescar();
    void almacenTareas.refrescar();
}
let refrescoIniciado = false;
function iniciarRefresco() {
    if (refrescoIniciado || typeof window === 'undefined') return;
    refrescoIniciado = true;
    document.addEventListener('visibilitychange', refrescarTodo);
    window.addEventListener('focus', refrescarTodo);
    window.addEventListener('online', refrescarTodo);
    window.setInterval(refrescarTodo, 60_000);
}

export const cancioneroService = {
    cargar,
    iniciarRefresco,
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
    crearTarea,
    guardarTarea: almacenTareas.guardar,
    borrarTarea: almacenTareas.borrar,
    // Borrar todo el cancionero (canciones, repertorios, listas y bolos) para empezar de cero
    vaciarTodo: async () => { await Promise.all([almacenCanciones.vaciar(), almacenRepertorios.vaciar(), almacenListas.vaciar(), almacenBolos.vaciar()]); },
};
