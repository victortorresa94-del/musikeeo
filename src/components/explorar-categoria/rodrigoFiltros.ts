// «Pídeselo a Rodrigo»: una frase se convierte en filtros. Primero pregunta a Rodrigo
// (POST /api/chat con mode 'filtros'); si la API falla, un intérprete local por palabras
// clave hace lo que puede. Así funciona siempre.
import type { Categoria, TipoCategoria } from '../../config/categorias';
import type { ListingCondition, ListingType } from '../../types';
import { norm } from '../../services/explorarService';
import { isoDia, type Extra, type Facetas, type Filtros, type Formacion } from './filtros';

export type Peticion = Partial<Omit<Filtros, 'orden'>>;
export interface Respuesta { filtros: Peticion; explicacion: string; fuente: 'rodrigo' | 'respaldo' }

// ─── Lugares ────────────────────────────────────────────────────────────────
const CIUDADES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Girona', 'Tarragona', 'Lleida', 'Bilbao', 'Málaga', 'Zaragoza',
    'Granada', 'Alicante', 'Palma', 'Murcia', 'Valladolid', 'Córdoba', 'Cádiz', 'San Sebastián', 'Santander', 'Oviedo', 'Gijón',
    'A Coruña', 'Vigo', 'Pamplona', 'Salamanca', 'Toledo', 'Guadalajara', 'Castellón', 'Almería', 'Huelva', 'Jaén', 'Logroño', 'Burgos', 'León'];

/** Pueblos y barrios que se buscan en su ciudad (la gente dice «Sitges», los perfiles dicen «Barcelona») */
const CERCA: Record<string, string> = {
    sitges: 'Barcelona', badalona: 'Barcelona', castelldefels: 'Barcelona', hospitalet: 'Barcelona', sabadell: 'Barcelona',
    terrassa: 'Barcelona', mataro: 'Barcelona', 'sant cugat': 'Barcelona', granollers: 'Barcelona', vilanova: 'Barcelona',
    gava: 'Barcelona', 'el prat': 'Barcelona', 'sant pere de ribes': 'Barcelona', maresme: 'Barcelona', gracia: 'Barcelona',
    poblenou: 'Barcelona', 'el born': 'Barcelona', vic: 'Barcelona', manresa: 'Barcelona', garraf: 'Barcelona',
    figueres: 'Girona', blanes: 'Girona', lloret: 'Girona', 'costa brava': 'Girona', palamos: 'Girona', olot: 'Girona',
    reus: 'Tarragona', salou: 'Tarragona', cambrils: 'Tarragona',
    'alcala de henares': 'Madrid', getafe: 'Madrid', mostoles: 'Madrid', alcobendas: 'Madrid', 'las rozas': 'Madrid',
    pozuelo: 'Madrid', majadahonda: 'Madrid', leganes: 'Madrid', fuenlabrada: 'Madrid', malasana: 'Madrid', lavapies: 'Madrid',
    gandia: 'Valencia', torrent: 'Valencia', sagunto: 'Valencia', 'dos hermanas': 'Sevilla', marbella: 'Málaga',
    torremolinos: 'Málaga', benidorm: 'Alicante', elche: 'Alicante', getxo: 'Bilbao', barakaldo: 'Bilbao',
};

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** ¿Sale la palabra (o lo que empieza por ella, si prefijo) en el texto ya normalizado? */
const sale = (t: string, palabra: string, prefijo = false) =>
    new RegExp(`(^|[^a-z0-9ñ])${escapar(palabra)}${prefijo ? '' : '([^a-z0-9ñ]|$)'}`).test(t);

/** El valor tal cual está en los datos, si lo hay (sin mayúsculas ni tildes, o empezando igual) */
function aOpcion(v: string, opciones: string[]): string {
    const n = norm(v.trim());
    return opciones.find(o => norm(o) === n)
        ?? opciones.find(o => { const m = norm(o); return n.length >= 4 && m.length >= 4 && (m.startsWith(n) || n.startsWith(m)); })
        ?? v.trim();
}

function ciudadDe(lugar: string, fac: Facetas): string {
    const n = norm(lugar.trim());
    const enDatos = fac.ciudades.find(c => norm(c) === n);
    if (enDatos) return enDatos;
    if (CERCA[n]) return aOpcion(CERCA[n], fac.ciudades);
    const conocida = CIUDADES.find(c => norm(c) === n);
    return aOpcion(conocida ?? lugar.trim(), fac.ciudades);
}

// ─── Intérprete local (respaldo) ────────────────────────────────────────────
const ESTILOS = ['rumba', 'flamenco', 'pop', 'rock', 'jazz', 'swing', 'house', 'disco', 'electronica', 'techno', 'latin', 'latino',
    'folk', 'acustico', 'clasica', 'soul', 'funk', 'blues', 'reggae', 'salsa', 'indie', 'metal', 'punk', 'cumbia', 'reggaeton',
    'bossa', 'gospel', 'country', 'tango', 'bachata', 'rap', 'hip hop', 'trap', 'boleros', 'copla', 'sevillanas'];
const ESTILO_BONITO: Record<string, string> = { electronica: 'Electrónica', acustico: 'Acústico', clasica: 'Clásica', latino: 'Latin', reggaeton: 'Reguetón', 'hip hop': 'Hip hop' };

const IDEAL_SINONIMOS: Record<string, string[]> = {
    boda: ['boda', 'casamiento', 'enlace', 'novios'], ceremonia: ['ceremonia'], fiesta: ['fiesta', 'cumple', 'cumpleanos', 'aniversario'],
    empresa: ['empresa', 'corporativ', 'congreso'], terraza: ['terraza'], sala: ['sala', 'concierto'], cena: ['cena'], hotel: ['hotel'],
    coctel: ['coctel'], festival: ['festival'], restaurante: ['restaurante'], cafe: ['cafe', 'cafeteria'], vermut: ['vermut', 'vermu'], club: ['club', 'discoteca'],
};
const raiz = (s: string) => norm(s).split(/\s+/).map(w => w.replace(/(es|s)$/, '')).join(' ');

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function fechaDe(t: string, hoy: Date): string | null {
    const dia = (n: number) => isoDia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n));
    const m = t.match(/(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
    if (m) {
        let d = new Date(hoy.getFullYear(), MESES.indexOf(m[2]), Number(m[1]));
        if (d < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) d = new Date(hoy.getFullYear() + 1, d.getMonth(), d.getDate());
        return isoDia(d);
    }
    const b = t.match(/(^|[^\d])(\d{1,2})\/(\d{1,2})(?!\d)/);
    if (b) {
        let d = new Date(hoy.getFullYear(), Number(b[3]) - 1, Number(b[2]));
        if (d < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) d = new Date(hoy.getFullYear() + 1, d.getMonth(), d.getDate());
        return isoDia(d);
    }
    if (sale(t, 'finde') || sale(t, 'fin de semana')) return 'finde';
    if (sale(t, 'sabado')) return 'sabado';
    if (sale(t, 'hoy') || sale(t, 'esta noche') || sale(t, 'esta tarde')) return dia(0);
    if (sale(t, 'pasado manana')) return dia(2);
    if (/(^|[^a-z])manana([^a-z]|$)/.test(t) && !/por la manana/.test(t)) return dia(1);
    for (const [i, nombre] of DIAS.entries()) {
        if (nombre === 'sabado' || !sale(t, nombre)) continue;
        return dia(((i - hoy.getDay()) + 7) % 7 || 7);
    }
    return null;
}

const NUM = String.raw`(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[,.](\d{1,2}))?\s*(k|mil)?`;
const NO_PRECIO = /^\s*(musicos?|personas|invitados|horas?|h\b|km|min|pases|componentes|miembros|metros)/;
function numeroDe(entero: string, decimal: string | undefined, mil: string | undefined): number {
    const n = Number(entero.replace(/[.\s]/g, '') + (decimal ? `.${decimal}` : ''));
    return Math.round(mil ? n * 1000 : n);
}
function preciosDe(t: string): { min: number | null; max: number | null } {
    let min: number | null = null, max: number | null = null;
    const entre = t.match(new RegExp(`entre\\s+${NUM}\\s*(?:€|euros?)?\\s+y\\s+${NUM}`));
    if (entre) {
        const a = numeroDe(entre[1], entre[2], entre[3]), b = numeroDe(entre[4], entre[5], entre[6]);
        return { min: Math.min(a, b), max: Math.max(a, b) };
    }
    const re = new RegExp(`(menos de|hasta|maximo|max\\.?|por debajo de|no mas de|como mucho|presupuesto de|presupuesto|mas de|desde|minimo|a partir de|por encima de|<|>)?\\s*${NUM}(?=(\\s*(€|euros?|eur)?))`, 'g');
    for (const m of t.matchAll(re)) {
        const resto = t.slice((m.index ?? 0) + m[0].length);
        const conMoneda = /^\s*(€|euros?|eur\b)/.test(resto);
        if (NO_PRECIO.test(resto) || (!m[1] && !conMoneda)) continue;
        if (!conMoneda && /^\s*(de|del)\s/.test(resto) && !m[1]) continue;
        const n = numeroDe(m[2], m[3], m[4]);
        if (n < 10 && !conMoneda) continue;        // «hasta 3» no es un precio
        if (m[1] && /mas de|desde|minimo|a partir de|por encima de|>/.test(m[1])) min = n; else max = n;
    }
    return { min, max };
}

function formacionDeTexto(t: string): Formacion | null {
    const m = t.match(/(\d+)\s*(musicos|componentes|miembros|personas en el escenario)/);
    if (m) { const n = Number(m[1]); return n <= 1 ? 'solista' : n === 2 ? 'duo' : n <= 5 ? '3-5' : '6+'; }
    if (sale(t, 'solista') || sale(t, 'en solitario') || sale(t, 'una sola persona')) return 'solista';
    if (sale(t, 'duo') || sale(t, 'pareja musical')) return 'duo';
    if (sale(t, 'trio') || sale(t, 'cuarteto') || sale(t, 'quinteto')) return '3-5';
    if (sale(t, 'sexteto') || sale(t, 'septeto') || sale(t, 'orquesta') || sale(t, 'big band')) return '6+';
    return null;
}

const GENERICAS = new Set(['de', 'del', 'y', 'con', 'para', 'el', 'la', 'los', 'las', 'tecnico', 'tecnicos', 'servicio', 'servicios', 'alquiler', 'reparacion', 'tienda']);
const SINONIMOS_SERVICIO: Record<string, string[]> = { iluminacion: ['luces', 'luz'], microfonia: ['microfono', 'micros'], monitores: ['monitor', 'in ear'], tienda: ['tienda', 'comprar'], reparacion: ['reparar', 'arreglar', 'ajuste'] };
/** Un servicio o un tipo de equipo de los datos, si la frase lo nombra */
function nombra(t: string, opcion: string): boolean {
    const o = norm(opcion);
    if (t.includes(o)) return true;
    const palabras = o.split(/[^a-z0-9ñ]+/).filter(w => w && !GENERICAS.has(w));
    const sin = Object.entries(SINONIMOS_SERVICIO).filter(([k]) => o.includes(k)).flatMap(([, v]) => v);
    if (sin.some(s => sale(t, s, true))) return true;
    if (!palabras.length) return false;
    return palabras.every(w => w.length <= 3 ? sale(t, w) : sale(t, w.slice(0, Math.max(4, w.length - 2)), true));
}

export function interpretar(texto: string, tipo: TipoCategoria, fac: Facetas, hoy = new Date()): Peticion {
    const t = norm(texto).replace(/\s+/g, ' ').trim();
    const f: Peticion = {};

    // Dónde: primero lo que hay en los datos, luego ciudades conocidas, luego pueblos cercanos
    const lugar = fac.ciudades.find(c => sale(t, norm(c))) ?? CIUDADES.find(c => sale(t, norm(c)));
    const pueblo = Object.keys(CERCA).find(p => sale(t, p));
    if (lugar) f.ciudad = ciudadDe(lugar, fac);
    else if (pueblo) f.ciudad = aOpcion(CERCA[pueblo], fac.ciudades);

    const { min, max } = preciosDe(t);
    if (min !== null) f.min = min;
    if (max !== null) f.max = max;

    if (tipo === 'artistas') {
        const fecha = fechaDe(t, hoy);
        if (fecha) f.fecha = fecha;
        const estilos = [...new Set([...fac.estilos.map(norm), ...ESTILOS])].filter(e => sale(t, e));
        if (estilos.length) f.estilos = [...new Set(estilos.map(e => aOpcion(ESTILO_BONITO[e] ?? e.charAt(0).toUpperCase() + e.slice(1), fac.estilos)))];
        const musicos = formacionDeTexto(t);
        if (musicos) f.musicos = musicos;
        const extras: Extra[] = [];
        if (/(sonido|equipo|\bpa\b)/.test(t) && !/sin (sonido|equipo)/.test(t)) extras.push('sonido');
        if (/(que viaje|viajen|desplaz|fuera de su ciudad)/.test(t)) extras.push('viajan');
        if (/(video|que se le vea|clip)/.test(t)) extras.push('video');
        if (extras.length) f.extras = extras.filter(e => fac.extras.includes(e));
        const ideal = fac.ideal.filter(i => {
            const r = raiz(i);
            // Los sinónimos, solo para las de una palabra: «boda» no es «Bodas grandes»
            const sin = r.includes(' ') ? [] : IDEAL_SINONIMOS[r] ?? [];
            return sale(t, r, true) || sin.some(s => sale(t, s, true));
        });
        // «Fiestas» y «Fiestas mayores»: si casan las dos, la más concreta
        const concretas = ideal.filter(i => !ideal.some(j => j !== i && raiz(j).startsWith(raiz(i))));
        if (concretas.length) f.ideal = concretas;
    }

    if (tipo === 'tecnicos') {
        const servicios = fac.servicios.filter(s => nombra(t, s));
        if (servicios.length) f.servicios = servicios;
        const equipo = fac.equipo.filter(e => nombra(t, e));
        if (equipo.length) f.equipo = equipo;
    }

    if (tipo === 'equipo') {
        const tipoAnuncio: ListingType | null = /prest/.test(t) ? 'prestamo' : /alquil/.test(t) ? 'alquiler' : /(compr|vend|segunda mano)/.test(t) ? 'venta' : null;
        if (tipoAnuncio && fac.tipos.includes(tipoAnuncio)) f.tipo = tipoAnuncio;
        const estado: ListingCondition[] = [];
        if (/(como nuev|casi nuev|sin uso|sin estrenar)/.test(t)) estado.push('como_nuevo');
        else if (sale(t, 'nuevo') || sale(t, 'nueva')) estado.push('nuevo');
        if (/(buen estado|\bbueno\b|\bbuena\b)/.test(t)) estado.push('bueno');
        if (sale(t, 'aceptable')) estado.push('aceptable');
        if (estado.length) f.estado = estado.filter(e => fac.estados.includes(e));
        if (fac.urgente && /(urgente|\burge\b|hoy|esta noche|cuanto antes|ya mismo)/.test(t)) f.urgente = true;
    }

    // Si no se ha entendido nada, se busca la frase tal cual (p. ej. «Fender»)
    const entendido = Object.values(f).some(v => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''));
    if (!entendido && texto.trim()) f.q = texto.trim().slice(0, 40);
    return f;
}

// ─── Rodrigo (la API) ───────────────────────────────────────────────────────
/** Sin caracteres de control y recortado */
const sinControl = (s: string) => [...s].map(c => (c.charCodeAt(0) < 32 ? ' ' : c)).join('');
const texto = (v: unknown, max = 40) => (typeof v === 'string' ? sinControl(v).trim().slice(0, max) : '');
const textos = (v: unknown) => (Array.isArray(v) ? [...new Set(v.map(x => texto(x)).filter(Boolean))].slice(0, 6) : []);
const cifra = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100000 ? Math.round(v) : null);

/** Lo que devuelve la API, pasado a filtros de la vista (con los valores tal cual están en los datos) */
export function deRodrigo(raw: Record<string, unknown>, tipo: TipoCategoria, fac: Facetas): Peticion {
    const f: Peticion = {};
    const ciudad = texto(raw.ciudad);
    if (ciudad) f.ciudad = ciudadDe(ciudad, fac);
    const min = cifra(raw.precioMin), max = cifra(raw.precioMax);
    if (min !== null) f.min = min;
    if (max !== null) f.max = max;
    if (f.min != null && f.max != null && f.min > f.max) [f.min, f.max] = [f.max, f.min];
    const q = texto(raw.texto);
    if (q) f.q = q;
    if (tipo === 'artistas') {
        const fecha = texto(raw.fecha, 10);
        if (/^(sabado|finde|\d{4}-\d{2}-\d{2})$/.test(fecha)) f.fecha = fecha;
        const estilos = textos(raw.estilos).map(e => aOpcion(e, fac.estilos));
        if (estilos.length) f.estilos = estilos;
        const m = texto(raw.musicos, 8);
        if (['solista', 'duo', '3-5', '6+'].includes(m)) f.musicos = m as Formacion;
        const extras = textos(raw.extras).filter((e): e is Extra => ['sonido', 'viajan', 'video'].includes(e));
        if (extras.length) f.extras = extras;
        const ideal = textos(raw.idealPara).map(i => aOpcion(i, fac.ideal));
        if (ideal.length) f.ideal = ideal;
    }
    if (tipo === 'tecnicos') {
        const s = textos(raw.servicios).map(x => aOpcion(x, fac.servicios));
        if (s.length) f.servicios = s;
        const e = textos(raw.equipo).map(x => aOpcion(x, fac.equipo));
        if (e.length) f.equipo = e;
    }
    if (tipo === 'equipo') {
        const t = texto(raw.tipo, 10);
        if (['venta', 'alquiler', 'prestamo'].includes(t)) f.tipo = t as ListingType;
        const e = textos(raw.estado).filter((x): x is ListingCondition => ['nuevo', 'como_nuevo', 'bueno', 'aceptable'].includes(x));
        if (e.length) f.estado = e;
        if (raw.urgente === true) f.urgente = true;
    }
    return f;
}

/** Las opciones reales que puede usar Rodrigo, para que no se invente valores */
export const opcionesPara = (fac: Facetas) => ({
    ciudades: fac.ciudades, estilos: fac.estilos, idealPara: fac.ideal, servicios: fac.servicios, equipo: fac.equipo,
    tipos: fac.tipos, estados: fac.estados, formaciones: fac.formaciones, extras: fac.extras,
});

export async function pedirFiltros(peticion: string, cat: Categoria, fac: Facetas, hoy = new Date()): Promise<Respuesta> {
    const respaldo = (): Respuesta => ({ filtros: interpretar(peticion, cat.tipo, fac, hoy), explicacion: '', fuente: 'respaldo' });
    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), 9000);
    try {
        const r = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'filtros', message: peticion.slice(0, 300), hoy: isoDia(hoy),
                categoria: { slug: cat.slug, nombre: cat.nombre, tipo: cat.tipo }, opciones: opcionesPara(fac),
            }),
            signal: ctrl.signal,
        });
        if (!r.ok) return respaldo();
        const data = await r.json() as { filtros?: Record<string, unknown>; explicacion?: unknown };
        if (!data || typeof data.filtros !== 'object' || data.filtros === null) return respaldo();
        const filtros = deRodrigo(data.filtros, cat.tipo, fac);
        const explicacion = texto(data.explicacion, 160);
        if (!Object.keys(filtros).length && !explicacion) return respaldo();
        return { filtros, explicacion, fuente: 'rodrigo' };
    } catch {
        return respaldo();
    } finally {
        clearTimeout(reloj);
    }
}
