// Musikeers cerca: la lógica del mapa sin React ni Firebase (se prueba con scripts/mapa).
// Privacidad: de cada persona solo se guarda la celda del geohash (6 letras, ~1,2 × 0,6 km).
// En pantalla sale en el centro de la celda con un desplazamiento que sale SOLO de su uid:
// estable (no baila al recargar), dentro de la celda y sin decir nada más de dónde está.

import { BARRIOS, CIUDADES, type Lugar } from './barrios';
import { caja, centro, esGeohash, PRECISION_MAPA } from './geohash';

export type Papel = 'musico' | 'tecnico' | 'sala' | 'tienda' | 'otro';
export const PAPELES: Papel[] = ['musico', 'tecnico', 'sala', 'tienda', 'otro'];

export interface PuntoMapa {
    uid: string;
    nombre: string;
    foto: string;          // '' si no tiene
    papel: Papel;
    etiquetas: string[];   // como mucho 3: instrumentos, géneros o equipo
    zona: string;          // «Gràcia, Barcelona»: el barrio o la ciudad, nunca la calle
    geohash: string;       // la celda (6 letras)
    ahora: boolean;        // «Estoy aquí ahora»
    caduca: number | null; // ms; solo con «ahora»
    actualizado: number | null;
}

/** «Estoy aquí ahora» se quita solo a las 4 horas */
export const DURACION_AHORA_MS = 4 * 60 * 60 * 1000;
export const MAX_ETIQUETAS = 3;
export const MAX_ETIQUETA = 24;
export const MAX_NOMBRE = 60;
export const MAX_ZONA = 60;

/** Cuánto se separa cada uno del centro de su celda, como fracción de la celda (±) */
export const DESPLAZAMIENTO_MAX = 0.3;

export const NOMBRE_PAPEL: Record<Papel, string> = {
    musico: 'Músico',
    tecnico: 'Técnico',
    sala: 'Sala',
    tienda: 'Tienda',
    otro: 'Musikeer',
};

const PLURAL: Record<Exclude<Papel, 'otro'>, [string, string]> = {
    musico: ['músico', 'músicos'],
    tecnico: ['técnico', 'técnicos'],
    sala: ['sala', 'salas'],
    tienda: ['tienda', 'tiendas'],
};

// ─── Caducidad ──────────────────────────────────────────────────────────────

/** «Estoy aquí ahora» que ya pasó (o sin hora de fin, que no debería existir) */
export const caducado = (p: Pick<PuntoMapa, 'ahora' | 'caduca'>, ahora = Date.now()) =>
    p.ahora && (p.caduca == null || p.caduca <= ahora);

/** Lo que se pinta en el mapa: todo menos los «ahora» caducados */
export const visible = (p: Pick<PuntoMapa, 'ahora' | 'caduca'>, ahora = Date.now()) => !caducado(p, ahora);

/** Hora de fin de un «Estoy aquí ahora» que empieza en `desde` */
export const finDeAhora = (desde = Date.now()) => desde + DURACION_AHORA_MS;

/** «23:40» */
export const horaCorta = (ms: number) => {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ─── Posición en pantalla ───────────────────────────────────────────────────

/** FNV-1a de 32 bits: el mismo texto da siempre el mismo número */
export function hashTexto(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/** Desplazamiento estable del uid, en fracciones de la celda: [-0,3, 0,3] en cada eje */
export function desplazamiento(uid: string): { lat: number; lng: number } {
    const a = hashTexto(`lat:${uid}`), b = hashTexto(`lng:${uid}`);
    const f = (n: number) => (n / 0xffffffff * 2 - 1) * DESPLAZAMIENTO_MAX;
    return { lat: f(a), lng: f(b) };
}

/** Dónde se pinta a alguien: centro de su celda + su desplazamiento */
export function posicionEnMapa(p: Pick<PuntoMapa, 'uid' | 'geohash'>): { lat: number; lng: number } {
    const c = caja(p.geohash);
    const d = desplazamiento(p.uid);
    return {
        lat: (c.sur + c.norte) / 2 + d.lat * (c.norte - c.sur),
        lng: (c.oeste + c.este) / 2 + d.lng * (c.este - c.oeste),
    };
}

// ─── Recuento y filtros ─────────────────────────────────────────────────────

export type FiltroPapel = 'todos' | Exclude<Papel, 'otro'>;

export interface Recuento { total: number; musico: number; tecnico: number; sala: number; tienda: number; otro: number }

export function contar(puntos: Pick<PuntoMapa, 'papel'>[]): Recuento {
    const r: Recuento = { total: 0, musico: 0, tecnico: 0, sala: 0, tienda: 0, otro: 0 };
    for (const p of puntos) { r.total++; r[p.papel]++; }
    return r;
}

const n = (x: number) => x.toLocaleString('es-ES');

/** «23 musikeers cerca · 12 músicos · 6 técnicos · 3 salas · 2 tiendas» */
export function textoRecuento(r: Recuento, soloAhora = false): string {
    if (!r.total) return soloAhora ? 'Nadie disponible ahora mismo por aquí' : 'Aún no hay musikeers por aquí';
    const cabeza = `${n(r.total)} ${r.total === 1 ? 'musikeer' : 'musikeers'} ${soloAhora ? 'ahora mismo' : 'cerca'}`;
    const partes = (Object.keys(PLURAL) as (keyof typeof PLURAL)[])
        .filter(k => r[k] > 0)
        .map(k => `${n(r[k])} ${PLURAL[k][r[k] === 1 ? 0 : 1]}`);
    return [cabeza, ...partes].join(' · ');
}

/** Los que salen con el filtro elegido (los caducados nunca) */
export function filtrar<T extends Pick<PuntoMapa, 'papel' | 'ahora' | 'caduca'>>(puntos: T[], papel: FiltroPapel, soloAhora: boolean, ahora = Date.now()): T[] {
    return puntos.filter(p => visible(p, ahora) && (!soloAhora || p.ahora) && (papel === 'todos' || p.papel === papel));
}

// ─── Agrupar los que están juntos ───────────────────────────────────────────

export interface Grupo { x: number; y: number; ids: string[] }

/**
 * Agrupa los puntos (en píxeles de pantalla) que caen a menos de `radio` px: cada grupo sale
 * en la media de sus puntos. Mismo orden de entrada → mismos grupos (no parpadea).
 */
export function agrupar(puntos: { id: string; x: number; y: number }[], radio = 44): Grupo[] {
    const orden = [...puntos].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const usado = new Set<string>();
    const r2 = radio * radio;
    const grupos: Grupo[] = [];
    for (const p of orden) {
        if (usado.has(p.id)) continue;
        usado.add(p.id);
        const ids = [p.id];
        let sx = p.x, sy = p.y;
        for (const q of orden) {
            if (usado.has(q.id)) continue;
            const dx = q.x - p.x, dy = q.y - p.y;
            if (dx * dx + dy * dy <= r2) { usado.add(q.id); ids.push(q.id); sx += q.x; sy += q.y; }
        }
        grupos.push({ x: sx / ids.length, y: sy / ids.length, ids });
    }
    return grupos;
}

// ─── Zonas con nombre ───────────────────────────────────────────────────────

/** Distancia en km entre dos puntos (haversine) */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

const masCercano = (lista: Lugar[], p: { lat: number; lng: number }, maxKm: number): Lugar | null => {
    let mejor: Lugar | null = null, d = maxKm;
    for (const l of lista) {
        const x = distanciaKm(p, l);
        if (x <= d) { d = x; mejor = l; }
    }
    return mejor;
};

export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** «Barcelona, España» → «Barcelona» */
export const ciudadLimpia = (s?: string) => (s || '').replace(/,\s*(españa|spain)$/i, '').trim().slice(0, MAX_ZONA);

/**
 * El nombre de la zona de una celda: su barrio (a menos de 1,6 km del centro de la celda), si
 * no la ciudad (a menos de 12 km) y si no la ciudad del perfil. Nunca más fino que la celda.
 */
export function zonaDe(geohash: string, ciudadPerfil?: string): string {
    const c = centro(geohash);
    const b = masCercano(BARRIOS, c, 1.6);
    if (b) return `${b.nombre}, ${b.ciudad}`.slice(0, MAX_ZONA);
    const ciudad = masCercano(CIUDADES, c, 12);
    if (ciudad) return ciudad.nombre;
    return ciudadLimpia(ciudadPerfil);
}

/** Dónde abrir el mapa con la ciudad del perfil («Barcelona, España», «Gràcia (BCN)»…) */
export function centroDeCiudad(texto?: string): Lugar | null {
    const t = normalizar(ciudadLimpia(texto));
    if (!t) return null;
    const exacta = CIUDADES.find(c => normalizar(c.nombre) === t);
    if (exacta) return exacta;
    // Palabra entera: «Sol» no es «Solsona»
    const palabra = (nombre: string) => new RegExp(`(^|[^a-z])${normalizar(nombre).replace(/[^a-z0-9 ]/g, '.')}($|[^a-z])`).test(t);
    const barrio = BARRIOS.find(b => palabra(b.nombre));
    if (barrio) return barrio;
    if (/\bbcn\b/.test(t)) return CIUDADES[0];
    return CIUDADES.find(c => palabra(c.nombre)) || null;
}

/** Barcelona: donde empieza Musikeeo */
export const CENTRO_POR_DEFECTO: Lugar = CIUDADES[0];

// ─── Del perfil al mapa ─────────────────────────────────────────────────────

export interface DatosPerfil {
    primaryMode?: 'musician' | 'organizer' | 'provider';
    tieneArtista: boolean;
    tieneOrganizador: boolean;
    servicios: string[];      // del proveedor (técnico o tienda)
    equipo: string[];         // equipmentTypes del técnico
    skills: string[];         // «¿Qué haces?» del onboarding
    generos: string[];
    tags: string[];           // del artista
}

const SALA = /sala|bar|promot|festival|bodas y eventos|local/;

/** Músico, técnico, sala o tienda con lo que ya dice su perfil */
export function papelDe(d: DatosPerfil): Papel {
    const esTienda = d.servicios.some(s => normalizar(s).includes('tienda'));
    if (d.primaryMode === 'provider') return esTienda ? 'tienda' : 'tecnico';
    if (d.primaryMode === 'organizer') return d.tieneOrganizador || d.skills.some(s => SALA.test(normalizar(s))) ? 'sala' : 'otro';
    if (d.primaryMode === 'musician' || d.tieneArtista) return 'musico';
    if (d.servicios.length) return esTienda ? 'tienda' : 'tecnico';
    return 'otro';
}

/** Hasta 3 etiquetas limpias, sin repetir, con la primera letra en mayúscula */
export function limpiarEtiquetas(xs: (string | undefined | null)[]): string[] {
    const vistas = new Set<string>();
    const fuera: string[] = [];
    for (const x of xs) {
        const t = (x || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length > MAX_ETIQUETA) continue;
        const k = normalizar(t);
        if (vistas.has(k) || k === 'tienda') continue;
        vistas.add(k);
        fuera.push(t[0].toLocaleUpperCase('es-ES') + t.slice(1));
        if (fuera.length === MAX_ETIQUETAS) break;
    }
    return fuera;
}

/** Instrumentos o géneros del músico; el equipo del técnico; lo que vende la tienda */
export function etiquetasDe(papel: Papel, d: DatosPerfil): string[] {
    switch (papel) {
        case 'musico': return limpiarEtiquetas([...d.skills, ...d.tags, ...d.generos]);
        case 'tecnico': return limpiarEtiquetas([...d.equipo, ...d.servicios, ...d.skills]);
        case 'tienda': return limpiarEtiquetas([...d.servicios, ...d.skills]);
        case 'sala': return limpiarEtiquetas(d.skills);
        default: return [];
    }
}

// ─── Leer lo que llega de Firestore (de otros: no se da nada por bueno) ─────

/** Solo fotos https o de la propia web (/seed/…) */
export const fotoSegura = (url: unknown): string =>
    typeof url === 'string' && url.length <= 600 && /^(https:\/\/|\/(?!\/))/i.test(url) ? url : '';

export const iniciales = (nombre: string) =>
    nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toLocaleUpperCase('es-ES')).join('') || '?';

const msDe = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && typeof (v as { toMillis?: () => number }).toMillis === 'function') return (v as { toMillis: () => number }).toMillis();
    return null;
};

/** Un documento de mapa/{uid} → PuntoMapa, o null si no se puede pintar */
export function leerPunto(id: string, data: Record<string, unknown> | undefined): PuntoMapa | null {
    if (!data) return null;
    const geohash = data.geohash;
    if (!esGeohash(geohash) || geohash.length < 4 || geohash.length > PRECISION_MAPA) return null;
    const papel = PAPELES.includes(data.papel as Papel) ? (data.papel as Papel) : 'otro';
    const nombre = typeof data.nombre === 'string' && data.nombre.trim() ? data.nombre.trim().slice(0, MAX_NOMBRE) : '';
    if (!nombre) return null;
    return {
        uid: id,
        nombre,
        foto: fotoSegura(data.foto),
        papel,
        etiquetas: Array.isArray(data.etiquetas) ? limpiarEtiquetas(data.etiquetas.map(x => (typeof x === 'string' ? x : ''))) : [],
        zona: typeof data.zona === 'string' ? data.zona.slice(0, MAX_ZONA) : '',
        geohash,
        ahora: data.ahora === true,
        caduca: msDe(data.caduca),
        actualizado: msDe(data.actualizado),
    };
}
