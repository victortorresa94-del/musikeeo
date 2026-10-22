// Los filtros de la vista de una categoría de Explorar: el modelo, la URL, las facetas
// (qué filtros salen según lo que hay de verdad en los datos) y cómo se aplican.
// Todo en el cliente, sobre lo que ya carga explorarService.
import type { Artist, Listing, ListingCondition, ListingType } from '../../types';
import type { Categoria, TipoCategoria } from '../../config/categorias';
import { enCiudad, norm, type ProviderConFoto, type Sala } from '../../services/explorarService';

export type Formacion = 'solista' | 'duo' | '3-5' | '6+';
export type Extra = 'sonido' | 'viajan' | 'video';
export type Orden = 'recomendados' | 'precio-asc' | 'precio-desc' | 'nuevos';

export interface Filtros {
    q: string;
    ciudad: string | null;
    /** 'sabado' (este sábado), 'finde' (este fin de semana) o 'YYYY-MM-DD' */
    fecha: string | null;
    min: number | null;
    max: number | null;
    estilos: string[];
    musicos: Formacion | null;
    extras: Extra[];
    ideal: string[];
    servicios: string[];
    equipo: string[];
    tipo: ListingType | null;
    estado: ListingCondition[];
    urgente: boolean;
    orden: Orden;
}

export const VACIOS: Filtros = {
    q: '', ciudad: null, fecha: null, min: null, max: null, estilos: [], musicos: null, extras: [], ideal: [],
    servicios: [], equipo: [], tipo: null, estado: [], urgente: false, orden: 'recomendados',
};

export const FORMACIONES: { id: Formacion; nombre: string; pastilla: string }[] = [
    { id: 'solista', nombre: 'Solista', pastilla: 'Solista' },
    { id: 'duo', nombre: 'Dúo', pastilla: 'Dúo' },
    { id: '3-5', nombre: '3-5', pastilla: 'De 3 a 5 músicos' },
    { id: '6+', nombre: '6 o más', pastilla: '6 músicos o más' },
];
export const EXTRAS: { id: Extra; nombre: string; pastilla: string }[] = [
    { id: 'sonido', nombre: 'Llevan sonido propio', pastilla: 'Sonido propio' },
    { id: 'viajan', nombre: 'Viajan fuera de su ciudad', pastilla: 'Viajan' },
    { id: 'video', nombre: 'Con vídeo', pastilla: 'Con vídeo' },
];
export const TIPOS: { id: ListingType; nombre: string }[] = [
    { id: 'venta', nombre: 'Venta' }, { id: 'alquiler', nombre: 'Alquiler' }, { id: 'prestamo', nombre: 'Préstamo' },
];
export const ESTADOS: { id: ListingCondition; nombre: string }[] = [
    { id: 'nuevo', nombre: 'Nuevo' }, { id: 'como_nuevo', nombre: 'Como nuevo' }, { id: 'bueno', nombre: 'Bueno' }, { id: 'aceptable', nombre: 'Aceptable' },
];
export const ORDENES: { id: Orden; nombre: string }[] = [
    { id: 'recomendados', nombre: 'Recomendados' }, { id: 'precio-asc', nombre: 'Precio más bajo' },
    { id: 'precio-desc', nombre: 'Precio más alto' }, { id: 'nuevos', nombre: 'Más nuevos' },
];

// ─── Palabras de cada categoría ─────────────────────────────────────────────
const NOMBRES: Record<string, [string, string]> = {
    bandas: ['banda', 'bandas'], musicos: ['músico', 'músicos'], djs: ['DJ', 'DJs'], tecnicos: ['técnico', 'técnicos'], salas: ['sala', 'salas'],
};
/** «1 banda», «3 bandas», «2 anuncios» */
export const cuantos = (cat: Categoria, n: number) => {
    const [uno, varios] = NOMBRES[cat.slug] ?? ['anuncio', 'anuncios'];
    return `${n} ${n === 1 ? uno : varios}`;
};

/** Ejemplo para el campo de Rodrigo, según la categoría */
export const EJEMPLO_RODRIGO: Record<TipoCategoria, Record<string, string> & { _: string }> = {
    artistas: {
        _: 'Banda de rumba para una boda el sábado, menos de 1.500 €',
        bandas: 'Banda de rumba para una boda en Sitges el sábado, menos de 1.500 €',
        musicos: 'Violinista para una ceremonia en Barcelona, hasta 400 €',
        djs: 'DJ de house para una terraza este finde, con equipo',
    },
    tecnicos: { _: 'Técnico de sonido en Madrid para esta noche, con mesa digital' },
    salas: { _: 'Salas que programen bandas en Barcelona' },
    equipo: {
        _: 'Algo de segunda mano en buen estado, menos de 300 €',
        alquiler: 'Alquilar una PA para un bolo en Barcelona, urgente',
        guitarras: 'Guitarra eléctrica como nueva por menos de 700 €',
        altavoces: 'Alquilar micrófonos en Barcelona para el sábado',
    },
};
export const ejemploRodrigo = (cat: Categoria) => EJEMPLO_RODRIGO[cat.tipo][cat.slug] ?? EJEMPLO_RODRIGO[cat.tipo]._;

// ─── Euros y fechas ─────────────────────────────────────────────────────────
/** 1500 → «1.500 €» (toLocaleString no separa los miles de 4 cifras en es-ES) */
export const euros = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

export const isoDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const diaDe = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };

/** Los días (YYYY-MM-DD) que cubre un filtro de fecha */
export function diasDeFecha(fecha: string, hoy = new Date()): string[] {
    const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const mas = (n: number) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
    if (fecha === 'sabado') return [isoDia(mas((6 - base.getDay() + 7) % 7))];
    if (fecha === 'finde') {
        // Lo que quede del viernes, sábado y domingo de esta semana
        const hastaDomingo = (7 - base.getDay()) % 7;
        const dias: string[] = [];
        for (let i = 0; i <= hastaDomingo; i++) { const d = mas(i); if ([5, 6, 0].includes(d.getDay())) dias.push(isoDia(d)); }
        return dias;
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? [fecha] : [];
}

export function nombreFecha(fecha: string, hoy = new Date()): string {
    if (fecha === 'sabado') return 'Este sábado';
    if (fecha === 'finde') return 'Este finde';
    const d = diaDe(fecha);
    if (isoDia(d) === isoDia(hoy)) return 'Hoy';
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Lo que se sabe de cada artista ─────────────────────────────────────────
/** Llevan sonido: por etiqueta («equipo propio») o porque su ficha lo dice */
export function llevaSonido(a: Artist): boolean {
    if ((a.tags || []).some(t => /equipo propio|sonido propio|con sonido|pa propia/.test(norm(t)))) return true;
    const e = norm(a.ficha?.equipo || '');
    if (!e || /lo pone la sala|segun sala|no llev/.test(e)) return false;
    return /(sonido|equipo|\bpa\b)/.test(e) && /(llev|propi|incluid|traen|tienen)/.test(e);
}
export const viaja = (a: Artist) => !!a.ficha?.viaja || (a.tags || []).some(t => norm(t).startsWith('viaja'));
export const tieneVideo = (a: Artist) => !!a.clipUrl || (a.multimedia?.videos?.length ?? 0) > 0;
export function formacionDe(a: Artist): Formacion | null {
    const n = a.ficha?.musicos;
    if (!n || n < 1) return null;
    return n === 1 ? 'solista' : n === 2 ? 'duo' : n <= 5 ? '3-5' : '6+';
}
const libres = (a: Artist) => new Set((a.availability || []).filter(d => d.status === 'available').map(d => d.date));
export const libreEn = (a: Artist, dias: string[]) => { const l = libres(a); return dias.some(d => l.has(d)); };

/** La próxima fecha libre en las tres semanas que vienen, para la tarjeta */
export function proximaLibre(a: Artist, hoy = new Date()): string | null {
    const l = [...libres(a)].sort();
    const desde = isoDia(hoy);
    const hasta = isoDia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 21));
    return l.find(d => d >= desde && d <= hasta) ?? null;
}

const ciudadCorta = (s?: string) => (s || '').split(',')[0].trim();
const contiene = (lista: string[] | undefined, v: string) => (lista || []).some(x => norm(x) === norm(v));
const casaTexto = (t: string, ...xs: (string | undefined)[]) => !t || xs.some(x => x && norm(x).includes(t));
const enRango = (p: number | undefined, f: Filtros) =>
    (f.min === null && f.max === null) || (p !== undefined && p !== null && (f.min === null || p >= f.min) && (f.max === null || p <= f.max));

// ─── Facetas: qué filtros salen (solo los que tienen dato) ──────────────────
export interface Facetas {
    ciudades: string[];
    fechas: boolean;
    precios: number[];          // los precios que hay, para el rango y su histograma
    estilos: string[];
    formaciones: Formacion[];
    extras: Extra[];
    ideal: string[];
    servicios: string[];
    equipo: string[];
    tipos: ListingType[];
    estados: ListingCondition[];
    urgente: boolean;
    ordenes: Orden[];
}

/** Valores por frecuencia, de más a menos; con su forma original */
function porFrecuencia(valores: string[], max = 12): string[] {
    const c = new Map<string, { v: string; n: number }>();
    valores.filter(Boolean).forEach(v => { const k = norm(v.trim()); const x = c.get(k); if (x) x.n++; else c.set(k, { v: v.trim(), n: 1 }); });
    return [...c.values()].sort((a, b) => b.n - a.n || a.v.localeCompare(b.v, 'es')).slice(0, max).map(x => x.v);
}

export type Datos =
    | { tipo: 'artistas'; items: Artist[] }
    | { tipo: 'tecnicos'; items: ProviderConFoto[] }
    | { tipo: 'salas'; items: Sala[] }
    | { tipo: 'equipo'; items: Listing[] };

const VACIA: Facetas = { ciudades: [], fechas: false, precios: [], estilos: [], formaciones: [], extras: [], ideal: [], servicios: [], equipo: [], tipos: [], estados: [], urgente: false, ordenes: ['recomendados'] };

export function facetas(d: Datos): Facetas {
    if (d.tipo === 'artistas') {
        const a = d.items;
        const precios = a.map(x => x.priceFrom).filter((p): p is number => !!p && p > 0);
        return {
            ...VACIA,
            ciudades: porFrecuencia(a.map(x => ciudadCorta(x.city))),
            fechas: a.some(x => (x.availability || []).some(z => z.status === 'available')),
            precios,
            estilos: porFrecuencia(a.flatMap(x => x.genres || [])),
            formaciones: FORMACIONES.map(f => f.id).filter(f => a.some(x => formacionDe(x) === f)),
            extras: EXTRAS.map(e => e.id).filter(e => a.some(x => e === 'sonido' ? llevaSonido(x) : e === 'viajan' ? viaja(x) : tieneVideo(x))),
            ideal: porFrecuencia(a.flatMap(x => x.ficha?.idealPara || []), 10),
            ordenes: ['recomendados', ...(precios.length > 1 ? ['precio-asc', 'precio-desc'] as Orden[] : []), ...(a.some(x => x.createdAt) ? ['nuevos'] as Orden[] : [])],
        };
    }
    if (d.tipo === 'tecnicos') {
        const p = d.items;
        const precios = p.map(x => x.priceFrom).filter((n): n is number => !!n && n > 0);
        return {
            ...VACIA,
            ciudades: porFrecuencia(p.flatMap(x => [ciudadCorta(x.city), ...(x.coverageAreas || [])])),
            precios,
            servicios: porFrecuencia(p.flatMap(x => x.services || [])),
            equipo: porFrecuencia(p.flatMap(x => x.equipmentTypes || [])),
            ordenes: ['recomendados', ...(precios.length > 1 ? ['precio-asc', 'precio-desc'] as Orden[] : []), ...(p.some(x => x.createdAt) ? ['nuevos'] as Orden[] : [])],
        };
    }
    if (d.tipo === 'salas') {
        return { ...VACIA, ciudades: porFrecuencia(d.items.map(x => ciudadCorta(x.location))) };
    }
    const l = d.items;
    const precios = l.filter(x => x.type !== 'prestamo').map(x => x.price).filter(n => n > 0);
    return {
        ...VACIA,
        ciudades: porFrecuencia(l.map(x => ciudadCorta(x.userLocation))),
        precios,
        tipos: TIPOS.map(t => t.id).filter(t => l.some(x => x.type === t)),
        estados: ESTADOS.map(e => e.id).filter(e => l.some(x => x.condition === e)),
        urgente: l.some(x => x.urgent),
        ordenes: ['recomendados', ...(precios.length > 1 ? ['precio-asc', 'precio-desc'] as Orden[] : []), 'nuevos'],
    };
}

// ─── Aplicar ────────────────────────────────────────────────────────────────
const porPrecio = <T,>(l: T[], precio: (x: T) => number | undefined, asc: boolean) =>
    [...l].sort((x, y) => {
        const a = precio(x), b = precio(y);
        if (a == null && b == null) return 0;
        if (a == null) return 1;          // sin precio, al final
        if (b == null) return -1;
        return asc ? a - b : b - a;
    });
const porFecha = <T,>(l: T[], f: (x: T) => string | undefined) => [...l].sort((x, y) => (f(y) || '').localeCompare(f(x) || ''));

export function filtrarArtistas(a: Artist[], f: Filtros, hoy = new Date()): Artist[] {
    const t = norm(f.q.trim());
    const dias = f.fecha ? diasDeFecha(f.fecha, hoy) : null;
    let l = a.filter(x =>
        enCiudad(x.city, f.ciudad) &&
        casaTexto(t, x.artistName, x.bio, x.ficha?.repertorio, ...(x.genres || []), ...(x.tags || [])) &&
        (!dias || libreEn(x, dias)) &&
        enRango(x.priceFrom || undefined, f) &&
        f.estilos.every(e => contiene(x.genres, e)) &&
        (!f.musicos || formacionDe(x) === f.musicos) &&
        (!f.extras.includes('sonido') || llevaSonido(x)) &&
        (!f.extras.includes('viajan') || viaja(x)) &&
        (!f.extras.includes('video') || tieneVideo(x)) &&
        f.ideal.every(i => contiene(x.ficha?.idealPara, i)));
    if (f.orden === 'precio-asc' || f.orden === 'precio-desc') l = porPrecio(l, x => x.priceFrom || undefined, f.orden === 'precio-asc');
    if (f.orden === 'nuevos') l = porFecha(l, x => x.createdAt);
    return l;
}

export function filtrarTecnicos(p: ProviderConFoto[], f: Filtros): ProviderConFoto[] {
    const t = norm(f.q.trim());
    let l = p.filter(x =>
        enCiudad([x.city, ...(x.coverageAreas || [])].join(' · '), f.ciudad) &&
        casaTexto(t, x.businessName, x.bio, ...(x.services || []), ...(x.equipmentTypes || [])) &&
        enRango(x.priceFrom || undefined, f) &&
        f.servicios.every(s => contiene(x.services, s)) &&
        f.equipo.every(e => contiene(x.equipmentTypes, e)));
    if (f.orden === 'precio-asc' || f.orden === 'precio-desc') l = porPrecio(l, x => x.priceFrom || undefined, f.orden === 'precio-asc');
    if (f.orden === 'nuevos') l = porFecha(l, x => x.createdAt);
    return l;
}

export function filtrarSalas(s: Sala[], f: Filtros): Sala[] {
    const t = norm(f.q.trim());
    return s.filter(x => enCiudad(x.location, f.ciudad) && casaTexto(t, x.displayName, x.bio, x.location));
}

export function filtrarAnuncios(a: Listing[], f: Filtros): Listing[] {
    const t = norm(f.q.trim());
    let l = a.filter(x =>
        enCiudad(x.userLocation, f.ciudad) &&
        casaTexto(t, x.title, x.description) &&
        (!f.tipo || x.type === f.tipo) &&
        (!f.estado.length || f.estado.includes(x.condition)) &&
        (!f.urgente || x.urgent) &&
        enRango(x.type === 'prestamo' ? 0 : x.price, f));
    if (f.orden === 'precio-asc' || f.orden === 'precio-desc') l = porPrecio(l, x => (x.type === 'prestamo' ? 0 : x.price), f.orden === 'precio-asc');
    if (f.orden === 'nuevos') l = porFecha(l, x => x.createdAt);
    return l;
}

export function filtrar(d: Datos, f: Filtros): Datos {
    switch (d.tipo) {
        case 'artistas': return { tipo: 'artistas', items: filtrarArtistas(d.items, f) };
        case 'tecnicos': return { tipo: 'tecnicos', items: filtrarTecnicos(d.items, f) };
        case 'salas': return { tipo: 'salas', items: filtrarSalas(d.items, f) };
        case 'equipo': return { tipo: 'equipo', items: filtrarAnuncios(d.items, f) };
    }
}

// ─── La URL ─────────────────────────────────────────────────────────────────
const lista = (s: string | null) => (s ? s.split(',').map(x => x.trim()).filter(Boolean) : []);
const numero = (s: string | null) => { if (!s) return null; const n = Number(s); return Number.isFinite(n) && n >= 0 ? Math.round(n) : null; };

export function leerFiltros(p: URLSearchParams): Filtros {
    const musicos = p.get('musicos') as Formacion | null;
    const tipo = p.get('tipo') as ListingType | null;
    const orden = p.get('orden') as Orden | null;
    return {
        q: p.get('q') || '',
        ciudad: p.get('ciudad') || null,
        fecha: p.get('fecha') || null,
        min: numero(p.get('min')),
        max: numero(p.get('max')),
        estilos: lista(p.get('estilo')),
        musicos: musicos && FORMACIONES.some(f => f.id === musicos) ? musicos : null,
        extras: lista(p.get('extras')).filter((e): e is Extra => EXTRAS.some(x => x.id === e)),
        ideal: lista(p.get('ideal')),
        servicios: lista(p.get('servicio')),
        equipo: lista(p.get('equipo')),
        tipo: tipo && TIPOS.some(t => t.id === tipo) ? tipo : null,
        estado: lista(p.get('estado')).filter((e): e is ListingCondition => ESTADOS.some(x => x.id === e)),
        urgente: p.get('urgente') === '1',
        orden: orden && ORDENES.some(o => o.id === orden) ? orden : 'recomendados',
    };
}

/** Escribe los filtros en la URL; conserva lo que no es un filtro (p. ej. la vista) */
export function escribirFiltros(f: Filtros, base?: URLSearchParams): URLSearchParams {
    const p = new URLSearchParams(base);
    const poner = (k: string, v: string | null | undefined) => { if (v) p.set(k, v); else p.delete(k); };
    poner('q', f.q.trim());
    poner('ciudad', f.ciudad);
    poner('fecha', f.fecha);
    poner('min', f.min !== null ? String(f.min) : null);
    poner('max', f.max !== null ? String(f.max) : null);
    poner('estilo', f.estilos.join(','));
    poner('musicos', f.musicos);
    poner('extras', f.extras.join(','));
    poner('ideal', f.ideal.join(','));
    poner('servicio', f.servicios.join(','));
    poner('equipo', f.equipo.join(','));
    poner('tipo', f.tipo);
    poner('estado', f.estado.join(','));
    poner('urgente', f.urgente ? '1' : null);
    poner('orden', f.orden === 'recomendados' ? null : f.orden);
    return p;
}

// ─── Pastillas: los filtros puestos, cada uno con su forma de quitarlo ──────
export interface Pastilla { clave: string; texto: string; quitar: (f: Filtros) => Filtros }

export function nombrePrecio(min: number | null, max: number | null): string {
    if (min !== null && max !== null) return `${euros(min)} – ${euros(max)}`;
    if (max !== null) return `Hasta ${euros(max)}`;
    return `Desde ${euros(min ?? 0)}`;
}

export function pastillas(f: Filtros, hoy = new Date()): Pastilla[] {
    const p: Pastilla[] = [];
    const sin = <K extends keyof Filtros>(k: K, v: Filtros[K]) => (x: Filtros) => ({ ...x, [k]: v });
    if (f.q.trim()) p.push({ clave: 'q', texto: `«${f.q.trim()}»`, quitar: sin('q', '') });
    if (f.ciudad) p.push({ clave: 'ciudad', texto: f.ciudad, quitar: sin('ciudad', null) });
    if (f.fecha) p.push({ clave: 'fecha', texto: nombreFecha(f.fecha, hoy), quitar: sin('fecha', null) });
    if (f.min !== null || f.max !== null) p.push({ clave: 'precio', texto: nombrePrecio(f.min, f.max), quitar: x => ({ ...x, min: null, max: null }) });
    f.estilos.forEach(e => p.push({ clave: `estilo-${e}`, texto: e, quitar: x => ({ ...x, estilos: x.estilos.filter(y => y !== e) }) }));
    if (f.musicos) p.push({ clave: 'musicos', texto: FORMACIONES.find(x => x.id === f.musicos)!.pastilla, quitar: sin('musicos', null) });
    f.extras.forEach(e => p.push({ clave: `extra-${e}`, texto: EXTRAS.find(x => x.id === e)!.pastilla, quitar: x => ({ ...x, extras: x.extras.filter(y => y !== e) }) }));
    f.ideal.forEach(i => p.push({ clave: `ideal-${i}`, texto: `Para ${i.toLowerCase()}`, quitar: x => ({ ...x, ideal: x.ideal.filter(y => y !== i) }) }));
    f.servicios.forEach(s => p.push({ clave: `servicio-${s}`, texto: s, quitar: x => ({ ...x, servicios: x.servicios.filter(y => y !== s) }) }));
    f.equipo.forEach(s => p.push({ clave: `equipo-${s}`, texto: s, quitar: x => ({ ...x, equipo: x.equipo.filter(y => y !== s) }) }));
    if (f.tipo) p.push({ clave: 'tipo', texto: TIPOS.find(x => x.id === f.tipo)!.nombre, quitar: sin('tipo', null) });
    f.estado.forEach(e => p.push({ clave: `estado-${e}`, texto: ESTADOS.find(x => x.id === e)!.nombre, quitar: x => ({ ...x, estado: x.estado.filter(y => y !== e) }) }));
    if (f.urgente) p.push({ clave: 'urgente', texto: 'Urgente', quitar: sin('urgente', false) });
    return p;
}

/** Borra los filtros (no el orden ni el texto del buscador) */
export const sinFiltros = (f: Filtros): Filtros => ({ ...VACIOS, q: f.q, orden: f.orden });

/** Cuántos filtros hay puestos (sin contar el texto del buscador ni el orden) */
export const cuantosFiltros = (f: Filtros) => pastillas(f).filter(x => x.clave !== 'q').length;

/** Los filtros, sin el orden ni la vista: para comparar dos búsquedas */
export const firma = (f: Filtros) => escribirFiltros({ ...f, orden: 'recomendados' }).toString();
