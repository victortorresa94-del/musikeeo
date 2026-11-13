// El enlace del grupo que se actualiza solo (13-nov). Víctor: «el enlace que comparto con los
// músicos… siempre deben tener mi última versión… la original siempre debe estar actualizada al
// último cambio de cada canción, o de orden».
//
// Cada repertorio compartido lleva en `compartido` el id de su copia pública: compartidos/{id}
// (lectura con el enlace, escribe solo su dueño: firestore.rules). Aquí, sin React: se escucha a
// los almacenes del cancionero y, cuando cambia una canción de un set compartido, su orden o su
// hoja del bolo, se vuelve a subir el set (lib/compartir: el mismo paquete que va tras «#»).
// Se espera un poco para no subir en cada tecla, y no se sube si no ha cambiado nada.
// Sin cuenta o sin reglas desplegadas no se puede: el enlace sigue valiendo con lo que lleva
// tras «#» y la hoja de compartir lo dice (estado()).
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { codificar, descodificar, huella, paquete, type Compartido } from '../lib/compartir';
import { paqueteBolo, type BoloCompartido } from '../lib/compartirBolo';
import { almacenBolos, almacenCanciones, almacenRepertorios } from './cancioneroService';
import type { Bolo, Cancion, Repertorio } from '../types/cancionero';

export type EstadoPublicar = 'al-dia' | 'subiendo' | 'sin-cuenta' | 'sin-permiso' | 'sin-red';

const ESPERA_MS = 2500;
const CLAVE_PUBLICADO = 'musikeeo-compartido-publicado:';   // + id → huella de lo último subido
const esUid = (d: string | null) => !!d && d !== 'invitado';

let iniciado = false;
const pendientes = new Map<string, ReturnType<typeof setTimeout>>();
const estados = new Map<string, EstadoPublicar>();
const oyentes = new Set<() => void>();

const avisar = () => oyentes.forEach(f => f());
function ponerEstado(id: string, e: EstadoPublicar) {
    if (estados.get(id) === e) return;
    estados.set(id, e);
    avisar();
}
const leerPublicado = (id: string) => { try { return localStorage.getItem(CLAVE_PUBLICADO + id); } catch { return null; } };
const guardarPublicado = (id: string, h: string) => { try { localStorage.setItem(CLAVE_PUBLICADO + id, h); } catch { /* */ } };

// Los sets y los bolos que hay que publicar ahora: cada id con su paquete. Un bolo lleva sus
// sets dentro, así que cambiar una canción de un set también lo vuelve a subir
type Paquete = Compartido | BoloCompartido;
function aPublicar(repertorios: Repertorio[], canciones: Cancion[], bolos: Bolo[]): { id: string; p: Paquete }[] {
    const salida: { id: string; p: Paquete }[] = [];
    for (const r of repertorios) {
        if (r.compartido?.cifrado) salida.push({ id: r.compartido.cifrado, p: paquete(r, canciones, false) });
        if (r.compartido?.letra) salida.push({ id: r.compartido.letra, p: paquete(r, canciones, true) });
    }
    for (const b of bolos) {
        if (b.compartido?.cifrado) salida.push({ id: b.compartido.cifrado, p: paqueteBolo(b, repertorios, canciones, false) });
        if (b.compartido?.letra) salida.push({ id: b.compartido.letra, p: paqueteBolo(b, repertorios, canciones, true) });
    }
    return salida;
}
const todo = () => aPublicar(almacenRepertorios.estado().items, almacenCanciones.estado().items, almacenBolos.estado().items);

async function subir(id: string, p: Paquete, uid: string) {
    const h = huella(p);
    ponerEstado(id, 'subiendo');
    try {
        const actualizado = new Date().toISOString();
        await setDoc(doc(db, 'compartidos', id), { duenio: uid, datos: codificar({ ...p, u: actualizado }), nombre: p.n.slice(0, 120), actualizado });
        guardarPublicado(id, h);
        ponerEstado(id, 'al-dia');
    } catch (e) {
        const code = (e as { code?: string })?.code;
        ponerEstado(id, code === 'permission-denied' ? 'sin-permiso' : 'sin-red');
    }
}

// Mira si algo ha cambiado y, si sí, lo sube un poco después (lo último manda)
function revisar() {
    const c = almacenCanciones.estado(), r = almacenRepertorios.estado();
    if (r.duenio === null || c.duenio === null || r.provisional) return;
    for (const { id, p } of todo()) {
        if (!esUid(r.duenio)) { ponerEstado(id, 'sin-cuenta'); continue; }
        if (leerPublicado(id) === huella(p)) { if (!estados.has(id)) ponerEstado(id, 'al-dia'); continue; }
        clearTimeout(pendientes.get(id));
        const uid = r.duenio;
        pendientes.set(id, setTimeout(() => {
            pendientes.delete(id);
            // Con lo de ese momento, no con lo de hace 2,5 s
            const ahora = todo().find(x => x.id === id);
            if (ahora && leerPublicado(id) !== huella(ahora.p)) void subir(id, ahora.p, uid);
        }, ESPERA_MS));
    }
}

export const compartidosService = {
    // Una vez por app (lo llama useCancionero); a partir de ahí, solo
    iniciar() {
        if (iniciado || typeof window === 'undefined') return;
        iniciado = true;
        almacenCanciones.suscribir(revisar);
        almacenRepertorios.suscribir(revisar);
        almacenBolos.suscribir(revisar);
        // Al volver la cobertura, lo que no se pudo subir
        window.addEventListener('online', () => {
            for (const [id, e] of estados) if (e === 'sin-red') localStorage.removeItem(CLAVE_PUBLICADO + id);
            revisar();
        });
        revisar();
    },
    // Subir ya (al abrir la hoja de compartir o al crear el enlace)
    ahora() { revisar(); for (const [id, t] of pendientes) { clearTimeout(t); pendientes.delete(id); } forzar(); },
    estado: (id: string | undefined): EstadoPublicar | null => (id ? estados.get(id) ?? null : null),
    suscribir(f: () => void) { oyentes.add(f); return () => { oyentes.delete(f); }; },
};

function forzar() {
    const r = almacenRepertorios.estado();
    if (!esUid(r.duenio)) return;
    for (const { id, p } of todo()) if (leerPublicado(id) !== huella(p)) void subir(id, p, r.duenio!);
}

// La página del músico: lo último de la nube, en directo. Devuelve el set descodificado (o null
// si no existe, no hay permiso o está mal), y para de escuchar con la función que devuelve
export function escucharCompartido<T = Compartido>(id: string, alLlegar: (p: T) => void, alFallar?: (code: string) => void,
    leer: (codigo: string) => T | null = descodificar as unknown as (codigo: string) => T | null): () => void {
    try {
        return onSnapshot(doc(db, 'compartidos', id), snap => {
            const datos = snap.data()?.datos;
            const p = typeof datos === 'string' ? leer(datos) : null;
            if (p) alLlegar(p);
            else alFallar?.('no-existe');
        }, e => alFallar?.((e as { code?: string })?.code ?? 'error'));
    } catch {
        alFallar?.('error');
        return () => {};
    }
}
