// El catálogo del cancionero (13-nov): cómo se ve cada valor y las columnas propias.
// Víctor: «añadir un icono a cada grupo y proyecto musical, tanto algunos de la app como
// personalizado, para ponerle mi logo» · «añadir desde aquí nuevas etiquetas, estilos, colores
// de cada cosa» · «características o columnas nuevas y personalizadas a elegir entre check,
// etiqueta, número, texto».
//
// Un solo documento por persona: en el móvil (localStorage) y, con cuenta, en
// users/{uid}/catalogo/principal (manda el más nuevo). Sin React: lo lee estilo.ts para los
// colores y useCatalogo para repintar cuando cambia.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type ColorPastel = 'mantequilla' | 'cielo' | 'menta' | 'lavanda' | 'melocoton' | 'rosa' | 'gris';
export const COLORES: ColorPastel[] = ['mantequilla', 'cielo', 'menta', 'lavanda', 'melocoton', 'rosa', 'gris'];

export interface Aspecto {
    nombre?: string;        // cómo se escribe (la clave va en minúsculas); y un valor creado aquí, sin canciones, existe igual
    color?: ColorPastel;
    icono?: string;         // ruta de un icono de la app (/images/…)
    imagen?: string;        // su logo, pequeño (data:image/…), solo para grupos
}

export type TipoCampo = 'casilla' | 'etiqueta' | 'numero' | 'texto';
export interface CampoPropio {
    id: string;             // va en ficha.extra[id]
    nombre: string;
    tipo: TipoCampo;
    opciones?: string[];    // las etiquetas que ya existen (para elegir), en orden
}

export interface Catalogo {
    aspecto: Record<string, Aspecto>;   // «grupo:lady jarana», «estilo:rumba», «etiqueta:tardeo», «canta:víctor»
    campos: CampoPropio[];
    actualizadaEn: string;
}

export type TipoValor = 'grupo' | 'estilo' | 'etiqueta' | 'canta' | 'energia' | 'estado';
export const claveAspecto = (tipo: TipoValor, valor: string) => `${tipo}:${valor.trim().toLowerCase()}`;

const VACIO: Catalogo = { aspecto: {}, campos: [], actualizadaEn: '' };
const CLAVE = 'musikeeo-catalogo-v1:';
let duenio: string | null = null;
let estado: Catalogo = VACIO;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach(f => f());
const esUid = (d: string | null) => !!d && d !== 'invitado';

function leerLocal(d: string): Catalogo {
    try {
        const o = JSON.parse(localStorage.getItem(CLAVE + d) || 'null');
        if (o && typeof o === 'object') return { aspecto: o.aspecto ?? {}, campos: Array.isArray(o.campos) ? o.campos : [], actualizadaEn: o.actualizadaEn ?? '' };
    } catch { /* sin almacenamiento */ }
    return VACIO;
}
const escribirLocal = (d: string, c: Catalogo) => { try { localStorage.setItem(CLAVE + d, JSON.stringify(c)); } catch { /* lleno o sin permiso */ } };
const ref = (uid: string) => doc(db, 'users', uid, 'catalogo', 'principal');

async function subir(uid: string, c: Catalogo) {
    try { await setDoc(ref(uid), { aspecto: c.aspecto, campos: c.campos, actualizadaEn: c.actualizadaEn }); } catch { /* sin reglas o sin red: se queda en el móvil */ }
}

export const catalogoService = {
    cargar(uid: string | null) {
        const d = uid || 'invitado';
        if (duenio === d) return;
        duenio = d;
        // Lo guardado sin cuenta pasa a la cuenta al entrar (si la cuenta no tiene nada)
        let local = leerLocal(d);
        let deInvitado = false;
        if (uid && !local.actualizadaEn) {
            const suelto = leerLocal('invitado');
            if (suelto.actualizadaEn) { local = suelto; deInvitado = true; escribirLocal(d, local); }
        }
        estado = local;
        avisar();
        if (!esUid(d)) return;
        void getDoc(ref(d)).then(snap => {
            if (duenio !== d) return;
            const nube = snap.exists() ? (snap.data() as Catalogo) : null;
            // Lo hecho sin cuenta, en una cuenta que ya tenía su catálogo: se juntan (lo de la cuenta manda)
            if (nube && deInvitado) {
                const suelto = estado;
                estado = { aspecto: nube.aspecto ?? {}, campos: Array.isArray(nube.campos) ? nube.campos : [], actualizadaEn: nube.actualizadaEn ?? '' };
                if (!catalogoService.mezclar(suelto)) { escribirLocal(d, estado); avisar(); }
                return;
            }
            if (nube && (nube.actualizadaEn ?? '') > estado.actualizadaEn) {
                estado = { aspecto: nube.aspecto ?? {}, campos: Array.isArray(nube.campos) ? nube.campos : [], actualizadaEn: nube.actualizadaEn };
                escribirLocal(d, estado);
                avisar();
            } else if (estado.actualizadaEn && (!nube || (nube.actualizadaEn ?? '') < estado.actualizadaEn)) {
                void subir(d, estado);
            }
        }).catch(() => { /* sin reglas o sin red */ });
    },
    estado: () => estado,
    paraCopia: () => ({ aspecto: estado.aspecto, campos: estado.campos }),
    suscribir(f: () => void) { oyentes.add(f); return () => { oyentes.delete(f); }; },
    aspecto: (clave: string): Aspecto | undefined => estado.aspecto[clave],
    // Los valores de un tipo creados aquí (aunque ninguna canción los lleve todavía)
    valores: (tipo: TipoValor): string[] => Object.entries(estado.aspecto)
        .filter(([k, a]) => k.startsWith(`${tipo}:`) && a.nombre)
        .map(([, a]) => a.nombre!),
    guardar(cambio: Partial<Pick<Catalogo, 'aspecto' | 'campos'>>) {
        const d = duenio || 'invitado';
        estado = { ...estado, ...cambio, actualizadaEn: new Date().toISOString() };
        escribirLocal(d, estado);
        avisar();
        if (esUid(d)) void subir(d, estado);
    },
    // Columnas propias
    crearCampo(nombre: string, tipo: TipoCampo): CampoPropio {
        const campo: CampoPropio = { id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, nombre: nombre.trim().slice(0, 40), tipo };
        catalogoService.guardar({ campos: [...estado.campos, campo] });
        return campo;
    },
    cambiarCampo(id: string, cambio: Partial<Omit<CampoPropio, 'id'>>) {
        catalogoService.guardar({ campos: estado.campos.map(c => (c.id === id ? { ...c, ...cambio, nombre: (cambio.nombre ?? c.nombre).trim().slice(0, 40) || c.nombre } : c)) });
    },
    borrarCampo(id: string) {
        catalogoService.guardar({ campos: estado.campos.filter(c => c.id !== id) });
    },
    // Lo que trae una copia (.json): se añade lo que no tienes; lo tuyo no se pisa
    mezclar(copia: { aspecto?: Record<string, unknown>; campos?: unknown[] } | undefined): number {
        if (!copia) return 0;
        const aspecto = { ...estado.aspecto };
        let nuevos = 0;
        for (const [k, v] of Object.entries(copia.aspecto ?? {})) {
            if (aspecto[k] || !/^(grupo|estilo|etiqueta|canta):/.test(k) || !v || typeof v !== 'object') continue;
            const o = v as Aspecto;
            const limpio: Aspecto = {};
            if (typeof o.nombre === 'string') limpio.nombre = o.nombre.slice(0, 40);
            if (o.color && COLORES.includes(o.color)) limpio.color = o.color;
            if (typeof o.icono === 'string' && o.icono.startsWith('/images/')) limpio.icono = o.icono.slice(0, 200);
            if (typeof o.imagen === 'string' && /^data:image\/(webp|png|jpeg);base64,/.test(o.imagen) && o.imagen.length < 60000) limpio.imagen = o.imagen;
            if (Object.keys(limpio).length) { aspecto[k] = limpio; nuevos++; }
        }
        const campos = [...estado.campos];
        for (const v of copia.campos ?? []) {
            const c = v as CampoPropio;
            if (!c || typeof c.id !== 'string' || typeof c.nombre !== 'string' || !['casilla', 'etiqueta', 'numero', 'texto'].includes(c.tipo)) continue;
            if (campos.some(x => x.id === c.id || (x.nombre.toLowerCase() === c.nombre.toLowerCase() && x.tipo === c.tipo))) continue;
            campos.push({ id: c.id.slice(0, 30), nombre: c.nombre.slice(0, 40), tipo: c.tipo, ...(Array.isArray(c.opciones) ? { opciones: c.opciones.filter(o => typeof o === 'string').slice(0, 60) } : {}) });
            nuevos++;
        }
        if (nuevos) catalogoService.guardar({ aspecto, campos });
        return nuevos;
    },
    ponerAspecto(clave: string, a: Aspecto | null) {
        const aspecto = { ...estado.aspecto };
        // Sin nada que guardar se borra; con solo el nombre se queda (un valor nuevo, aún sin canciones)
        const limpio = a ? Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined && v !== '')) as Aspecto : null;
        if (limpio && Object.keys(limpio).length) aspecto[clave] = limpio; else delete aspecto[clave];
        catalogoService.guardar({ aspecto });
    },
};

// Un logo subido, pequeño y cuadrado (128 px, webp) para que quepa en el documento y cargue al momento
export async function logoPequeno(archivo: File): Promise<string> {
    const url = URL.createObjectURL(archivo);
    try {
        const img = await new Promise<HTMLImageElement>((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = url; });
        const lado = 128;
        const lienzo = document.createElement('canvas');
        lienzo.width = lienzo.height = lado;
        const ctx = lienzo.getContext('2d')!;
        // Entero, centrado y sin recortar (un logo apaisado no pierde los bordes)
        const k = Math.min(lado / img.width, lado / img.height);
        const w = img.width * k, h = img.height * k;
        ctx.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
        const webp = lienzo.toDataURL('image/webp', 0.85);
        return webp.startsWith('data:image/webp') ? webp : lienzo.toDataURL('image/png');
    } finally {
        URL.revokeObjectURL(url);
    }
}
