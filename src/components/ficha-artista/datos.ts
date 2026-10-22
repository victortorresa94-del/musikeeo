// Lo que la ficha pública de un artista enseña, sacado SOLO de sus datos (nada inventado).
// Los paquetes de Firestore no siempre tienen la forma de `ServicePackage` (la duración llega
// como «2h 30min», sin `isActive` ni `currency`): aquí se leen con cuidado.
import type { Artist } from '../../types';
import { OBJETO_3D } from '../../config/objetos3d';
import { norm, palabras, raiz } from '../bolos/tablon';

export const euros = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const numero = (v: unknown) => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN;
    return isFinite(n) && n > 0 ? n : null;
};

/** «2h 30min» → «2 h 30 min»; 1.5 → «1 h 30 min» */
function duracion(v: unknown): string {
    if (typeof v === 'number' && isFinite(v) && v > 0) {
        const h = Math.floor(v);
        const m = Math.round((v - h) * 60);
        return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
    }
    return texto(v).replace(/(\d)\s*h(?:oras?)?\b/gi, '$1 h').replace(/(\d)\s*min(?:utos)?\b/gi, '$1 min');
}

export interface Paquete {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number | null;
    duracion: string;
    incluye: string[];
}

export function paquetesDe(a: Artist): Paquete[] {
    const lista: unknown[] = Array.isArray(a.packages) ? a.packages : [];
    return lista.flatMap((raw, i) => {
        if (!raw || typeof raw !== 'object') return [];
        const p = raw as Record<string, unknown>;
        if (p.isActive === false) return [];
        const nombre = texto(p.name);
        if (!nombre) return [];
        return [{
            id: texto(p.id) || `p${i}`,
            nombre,
            descripcion: texto(p.description),
            precio: numero(p.price),
            duracion: duracion(p.duration),
            incluye: Array.isArray(p.includes) ? p.includes.map(texto).filter(Boolean) : [],
        }];
    });
}

export function precioDesde(a: Artist, paquetes: Paquete[]): number | null {
    const propio = numero(a.priceFrom);
    if (propio) return propio;
    const precios = paquetes.map(p => p.precio).filter((x): x is number => x !== null);
    return precios.length ? Math.min(...precios) : null;
}

/** «YYYY-MM-DD» de un día en la hora local (toISOString lo pasaría a UTC y cambiaría de día) */
export const claveDia = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const masDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** El estado de cada día que el artista ha marcado */
export function estadosDe(a: Artist): Map<string, string> {
    const m = new Map<string, string>();
    for (const d of Array.isArray(a.availability) ? a.availability : []) {
        if (d && typeof d.date === 'string' && typeof d.status === 'string') m.set(d.date.slice(0, 10), d.status);
    }
    return m;
}

/** Días libres desde hoy hasta dentro de N días (incluidos) */
export function libresEn(estados: Map<string, string>, dias: number) {
    const desde = hoy();
    let n = 0;
    for (let i = 0; i <= dias; i++) if (estados.get(claveDia(masDias(desde, i))) === 'available') n++;
    return n;
}

// ---- Qué es: «Banda», «Guitarrista»… (de sus etiquetas, en el orden en que las puso) ----
const TIPOS: Record<string, string> = {
    banda: 'Banda', grupo: 'Grupo', orquesta: 'Orquesta', cuarteto: 'Cuarteto', trio: 'Trío', duo: 'Dúo',
    dj: 'DJ', cantautora: 'Cantautora', cantautor: 'Cantautor', cantante: 'Cantante', guitarrista: 'Guitarrista',
    violinista: 'Violinista', pianista: 'Pianista', saxofonista: 'Saxofonista', solista: 'Solista',
};

export function tipoDe(a: Artist): string {
    for (const t of a.tags || []) {
        const tipo = TIPOS[norm(String(t)).trim()];
        if (tipo) return tipo;
    }
    return (a.ficha?.musicos ?? 0) > 1 ? 'Banda' : '';
}

/** «Banda · Barcelona · Rumba, flamenco, pop» */
export function lineaDe(a: Artist) {
    const generos = (a.genres || []).map(g => String(g).trim()).filter(Boolean)
        .map((g, i) => (i === 0 ? g : g.toLowerCase())).join(', ');
    return [tipoDe(a), texto(a.city), generos].filter(Boolean).join(' · ');
}

// ---- Ideal para: lo que dice su ficha y, si no, lo que dicen sus etiquetas ----
const OCASIONES: { raices: string[]; nombre: string; objeto: keyof typeof OBJETO_3D }[] = [
    { raices: ['boda', 'ceremonia', 'novio', 'novia'], nombre: 'Bodas', objeto: 'boda' },
    { raices: ['fiesta', 'cumpleano', 'aniversario', 'despedida'], nombre: 'Fiestas', objeto: 'tocadiscos' },
    { raices: ['sala', 'concierto', 'club'], nombre: 'Salas', objeto: 'escenario' },
    { raices: ['festival'], nombre: 'Festivales', objeto: 'escenario' },
    { raices: ['terraza', 'bar', 'restaurante', 'coctel', 'vermut'], nombre: 'Terrazas', objeto: 'microfono' },
    { raices: ['empresa', 'corporativo', 'corporativa'], nombre: 'Empresas', objeto: 'altavoz' },
];

const ocasionDe = (s: string) => {
    const bolsa = new Set(palabras(s).map(raiz));
    return OCASIONES.find(o => o.raices.some(r => bolsa.has(raiz(r))));
};

export interface Ocasion { nombre: string; objeto: string }

export function idealParaDe(a: Artist): Ocasion[] {
    const propias = (a.ficha?.idealPara || []).map(texto).filter(Boolean);
    if (propias.length) {
        return propias.map(nombre => ({ nombre, objeto: OBJETO_3D[ocasionDe(nombre)?.objeto ?? 'guitarra'] }));
    }
    const vistas = new Set<string>();
    const out: Ocasion[] = [];
    for (const t of a.tags || []) {
        const o = ocasionDe(String(t));
        if (o && !vistas.has(o.nombre)) { vistas.add(o.nombre); out.push({ nombre: o.nombre, objeto: OBJETO_3D[o.objeto] }); }
    }
    return out;
}

/** ¿Lleva sonido? Solo si lo dicen sus etiquetas o su ficha */
export function sonidoPropio(a: Artist) {
    const tags = (a.tags || []).map(t => norm(String(t)));
    if (tags.some(t => /\b(equipo|sonido|pa)\s+(propio|propia|incluido|incluida)\b|\bcon sonido\b/.test(t))) return true;
    const equipo = norm(texto(a.ficha?.equipo));
    return !!equipo && !/^(sin|no)\b/.test(equipo) && /\b(sonido|equipo|altavoces|pa)\b/.test(equipo);
}

// ---- La ficha: etiqueta gris → valor, solo las que tienen dato ----
export function filasDe(a: Artist) {
    const f = a.ficha || {};
    const varios = (f.musicos ?? 0) > 1 || ['Banda', 'Grupo', 'Orquesta', 'Cuarteto', 'Trío', 'Dúo'].includes(tipoDe(a));
    const musicos = numero(f.musicos);
    return [
        { etiqueta: 'Formación', valor: texto(f.formacion) },
        { etiqueta: 'Músicos', valor: musicos ? String(Math.round(musicos)) : '' },
        { etiqueta: 'Duración', valor: texto(f.duracion) },
        { etiqueta: 'Repertorio', valor: texto(f.repertorio) },
        { etiqueta: 'Equipo', valor: texto(f.equipo) },
        { etiqueta: varios ? 'Viajan' : 'Viaja', valor: texto(f.viaja) },
        { etiqueta: 'Idiomas', valor: texto(f.idiomas) },
    ].filter(x => x.valor);
}

// ---- Las cuatro tarjetas de arriba, cada una solo si hay dato ----
export interface Tarjeta { id: string; objeto: string; texto: string }

export function tarjetasDe(a: Artist, desde: number | null, libres: number): Tarjeta[] {
    const t: Tarjeta[] = [];
    if (desde) t.push({ id: 'precio', objeto: OBJETO_3D.moneda, texto: `Desde ${euros(desde).replace(' ', '\u00a0')}` });
    const musicos = numero(a.ficha?.musicos);
    if (musicos) {
        const n = Math.round(musicos);
        t.push({ id: 'musicos', objeto: n > 1 ? OBJETO_3D.banda : OBJETO_3D.guitarra, texto: n > 1 ? `${n} músicos` : 'Solista' });
    }
    if (sonidoPropio(a)) t.push({ id: 'sonido', objeto: OBJETO_3D.altavoz, texto: 'Sonido propio' });
    if (libres > 0) t.push({ id: 'fechas', objeto: OBJETO_3D.calendario, texto: libres === 1 ? 'Libre 1\u00a0fecha' : `Libres ${libres}\u00a0fechas` });
    return t;
}
