// La biblioteca del repertorio (sin React): filtrar y agrupar canciones por su ficha (tono,
// quién canta, grupo, estilo, energía, estado), lo que dura un repertorio, las directivas de
// ficha que llegan al importar y la copia de seguridad del cancionero entero.
import { claveTitulo } from './buscarCanciones';
import type { AjustesCancion, Cancion, Energia, EstadoCancion, FichaCancion, Repertorio, Bolo } from '../types/cancionero';

export const ESTADOS: Record<EstadoCancion, string> = { lista: 'Lista', ensayar: 'Por ensayar', aprender: 'Para aprender' };
export const ENERGIAS: Record<1 | 2 | 3 | 4, string> = { 1: 'Suave', 2: 'Media', 3: 'Media-alta', 4: 'Arriba' };

// Energía y estado: los de siempre por su clave, los propios por su nombre
export const nombreEnergia = (e?: Energia | null): string =>
    e === undefined || e === null || e === '' ? '' : typeof e === 'number' ? ENERGIAS[e as 1] ?? String(e) : ENERGIAS[+e as 1] ?? e;
export function energiaDeNombre(nombre: string): Energia | undefined {
    const t = nombre.trim().slice(0, 40);
    if (!t) return undefined;
    if (/^[1-4]$/.test(t)) return +t as 1 | 2 | 3 | 4;
    const k = (Object.keys(ENERGIAS) as unknown as (1 | 2 | 3 | 4)[]).find(x => ENERGIAS[x].toLowerCase() === t.toLowerCase());
    return k ? (+k as 1 | 2 | 3 | 4) : t;
}
// Para ordenar: las de siempre por su número; las propias, detrás
export const ordenEnergia = (e?: Energia | null) => (typeof e === 'number' ? e : e && /^[1-4]$/.test(e) ? +e : e ? 10 : 0);
export const nombreEstado = (e?: string | null): string => (e ? ESTADOS[e as EstadoCancion] ?? e : '');
export function estadoDeNombre(nombre: string): string | undefined {
    const t = nombre.trim().slice(0, 40);
    if (!t) return undefined;
    return (Object.keys(ESTADOS) as EstadoCancion[]).find(k => k === t || ESTADOS[k].toLowerCase() === t.toLowerCase()) ?? t;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// El tono que se enseña: el de la ficha si lo escribiste; si no, el que se saca de los acordes
export const tonoMostrado = (c: Cancion, deLosAcordes: string | null | undefined) => c.ficha?.tono?.trim() || deLosAcordes || null;
// «G · también A»
export const tonoConAlternativo = (c: Cancion, tono: string | null) => (tono && c.ficha?.tonoAlt ? `${tono} · también ${c.ficha.tonoAlt}` : tono);

export interface Filtros {
    proyectos: string[];
    canta: string[];
    estilos: string[];
    tonos: string[];
    energias: string[];
    estados: string[];
    etiquetas: string[];
}
export type CampoFiltro = keyof Filtros;
export const SIN_FILTROS: Filtros = { proyectos: [], canta: [], estilos: [], tonos: [], energias: [], estados: [], etiquetas: [] };
export const hayFiltros = (f: Filtros) => Object.values(f).some(v => v.length > 0);

export const NOMBRE_CAMPO: Record<CampoFiltro, string> = {
    proyectos: 'Grupo', canta: 'Canta', estilos: 'Estilo', tonos: 'Tono', energias: 'Energía', estados: 'Estado', etiquetas: 'Etiquetas',
};

// Lo que vale una canción en cada campo (puede tener varios grupos)
export function valoresDe(c: Cancion, campo: CampoFiltro, tono: string | null): string[] {
    const f = c.ficha ?? {};
    switch (campo) {
        case 'proyectos': return (f.proyectos ?? []).filter(Boolean);
        case 'canta': return f.canta ? [f.canta] : [];
        case 'estilos': return f.estilo ? [f.estilo] : [];
        case 'tonos': return tono ? [tono] : [];
        case 'energias': return f.energia ? [String(f.energia)] : [];
        case 'estados': return f.estado ? [f.estado] : [];
        case 'etiquetas': return (f.etiquetas ?? []).filter(Boolean);
    }
}

// Cómo se lee un valor en pantalla
export function etiquetaValor(campo: CampoFiltro, valor: string): string {
    if (campo === 'energias') return ENERGIAS[+valor as 1 | 2 | 3 | 4] ?? valor;
    if (campo === 'estados') return ESTADOS[valor as EstadoCancion] ?? valor;
    return valor;
}

// Dentro de un campo vale cualquiera de lo elegido; entre campos, todos a la vez
export function filtrar(canciones: Cancion[], filtros: Filtros, tonoDe: (c: Cancion) => string | null): Cancion[] {
    const activos = (Object.keys(filtros) as CampoFiltro[]).filter(k => filtros[k].length);
    if (!activos.length) return canciones;
    const elegidos = new Map(activos.map(k => [k, new Set(filtros[k].map(norm))]));
    return canciones.filter(c => activos.every(k => valoresDe(c, k, tonoDe(c)).some(v => elegidos.get(k)!.has(norm(v)))));
}

// El orden de los tonos: por la nota (C, C#, D…) y los mayores antes que los menores
const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BEMOL: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
function ordenTono(t: string): number {
    const m = /^([A-G])([#b])?(m)?/.exec(t.trim());
    if (!m) return 999;
    const raiz = BEMOL[m[1] + (m[2] ?? '')] ?? m[1] + (m[2] === '#' ? '#' : '');
    return NOTAS.indexOf(raiz) * 2 + (m[3] ? 1 : 0);
}

export interface Opcion { valor: string; n: number }

// Los valores que existen en un campo, con cuántas canciones tiene cada uno
export function opcionesDe(canciones: Cancion[], campo: CampoFiltro, tonoDe: (c: Cancion) => string | null): Opcion[] {
    const cuenta = new Map<string, { valor: string; n: number }>();
    for (const c of canciones) {
        for (const v of valoresDe(c, campo, tonoDe(c))) {
            const k = norm(v);
            const x = cuenta.get(k);
            if (x) x.n++; else cuenta.set(k, { valor: v, n: 1 });
        }
    }
    const lista = [...cuenta.values()];
    if (campo === 'tonos') return lista.sort((a, b) => ordenTono(a.valor) - ordenTono(b.valor) || a.valor.localeCompare(b.valor));
    if (campo === 'energias') return lista.sort((a, b) => ordenEnergia(a.valor) - ordenEnergia(b.valor) || a.valor.localeCompare(b.valor, 'es'));
    if (campo === 'estados') { const i = (v: string) => { const k = Object.keys(ESTADOS).indexOf(v); return k < 0 ? 9 : k; }; return lista.sort((a, b) => i(a.valor) - i(b.valor) || a.valor.localeCompare(b.valor, 'es')); }
    return lista.sort((a, b) => b.n - a.n || a.valor.localeCompare(b.valor, 'es'));
}

export type Agrupar = 'nada' | 'tonos' | 'canta' | 'estilos' | 'proyectos' | 'energias' | 'estados' | 'etiquetas';
export const NOMBRE_AGRUPAR: Record<Agrupar, string> = {
    nada: 'Sin agrupar', tonos: 'Por tono', canta: 'Por quién canta', estilos: 'Por estilo', proyectos: 'Por grupo', energias: 'Por energía', estados: 'Por estado', etiquetas: 'Por etiqueta',
};

export interface Grupo { titulo: string; canciones: Cancion[] }

// En grupos (una canción de dos grupos sale en los dos); lo que no tiene ficha, al final
export function agrupar(canciones: Cancion[], por: Agrupar, tonoDe: (c: Cancion) => string | null): Grupo[] {
    if (por === 'nada') return [{ titulo: '', canciones }];
    const opciones = opcionesDe(canciones, por, tonoDe);
    const grupos = opciones.map(o => ({
        titulo: etiquetaValor(por, o.valor),
        canciones: canciones.filter(c => valoresDe(c, por, tonoDe(c)).some(v => norm(v) === norm(o.valor))),
    }));
    const sueltas = canciones.filter(c => !valoresDe(c, por, tonoDe(c)).length);
    if (sueltas.length) grupos.push({ titulo: por === 'tonos' ? 'Sin tono' : 'Sin ficha', canciones: sueltas });
    return grupos;
}

// Lo que dura: lo que se sabe de cada canción y, de las que no, una media de 3 min 30 s
export const DURACION_MEDIA = 210;
export function duracionDe(canciones: Cancion[]): { segundos: number; estimada: boolean } {
    let segundos = 0, estimada = false;
    for (const c of canciones) {
        if (c.duracion) segundos += c.duracion;
        else { segundos += DURACION_MEDIA; estimada = true; }
    }
    return { segundos, estimada };
}
export function textoDuracion(segundos: number): string {
    const min = Math.round(segundos / 60);
    return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

// Quién canta cuántas: «Mafe 8 · Ambos 5 · Víctor 2»
export function reparto(canciones: Cancion[]): Opcion[] {
    return opcionesDe(canciones, 'canta', () => null);
}

// Dos temas seguidos en el mismo tono (para avisar al ordenar el repertorio)
export function mismoTonoSeguido(tonos: (string | null)[]): Set<number> {
    const avisos = new Set<number>();
    tonos.forEach((t, i) => { if (i > 0 && t && tonos[i - 1] && norm(t) === norm(tonos[i - 1]!)) avisos.add(i); });
    return avisos;
}

// ——— Directivas de ficha al importar ———
// En un texto ChordPro: {tono: Bm} o {key: Bm}, {capo: 2 · formas de Am}, {canta: Mafe},
// {grupo: Lady Jarana, Cataleya} (o {proyecto: …}), {estilo: Rumba}, {energia: 3}, {estado: lista}.
// Salen del texto y van a la ficha
const DIRECTIVA = /^\s*\{\s*(tono|key|capo|cejilla|canta|voz|grupo|grupos|proyecto|proyectos|estilo|energia|energía|estado|etiquetas?|apto(?: para)?|enlace|url|link)\s*:\s*([^}]*)\}\s*$/i;

function leerEstado(v: string): EstadoCancion | undefined {
    const t = norm(v);
    if (/^(lista|listo|ok|si)/.test(t)) return 'lista';
    if (/ensay|ma o meno|repas/.test(t)) return 'ensayar';
    if (/aprend|nueva|idea|sacar/.test(t)) return 'aprender';
    return undefined;
}

export function sacarFicha(texto: string): { ficha?: FichaCancion; texto: string } {
    const ficha: FichaCancion = {};
    let hay = false;
    const resto = texto.split('\n').filter(linea => {
        const m = DIRECTIVA.exec(linea);
        if (!m) return true;
        const k = norm(m[1]);
        const v = m[2].trim();
        if (!v) return false;
        hay = true;
        if (k === 'tono' || k === 'key') ficha.tono = v.slice(0, 12);
        else if (k === 'capo' || k === 'cejilla') ficha.capo = /^\d+$/.test(v) ? `Capo ${v}` : v.slice(0, 60);
        else if (k === 'canta' || k === 'voz') ficha.canta = v.slice(0, 40);
        else if (k.startsWith('grupo') || k.startsWith('proyecto')) ficha.proyectos = v.split(/\s*[,·]\s*/).filter(Boolean).slice(0, 6).map(x => x.slice(0, 40));
        else if (k === 'estilo') ficha.estilo = v.slice(0, 40);
        else if (k.startsWith('energ')) { const n = Math.round(+v.replace(/[^\d]/g, '')); if (n >= 1 && n <= 4 && /^\s*\d/.test(v)) ficha.energia = n as 1 | 2 | 3 | 4; else if (v.trim()) ficha.energia = energiaDeNombre(v); }
        else if (k === 'estado') ficha.estado = leerEstado(v);
        else if (k.startsWith('etiqueta') || k.startsWith('apto')) ficha.etiquetas = v.split(/\s*[,·]\s*/).filter(Boolean).slice(0, 20).map(x => x.slice(0, 40));
        else if (/^https?:\/\//i.test(v)) ficha.enlace = v.slice(0, 500);
        return false;
    });
    return hay ? { ficha, texto: resto.join('\n').replace(/^\n+/, '') } : { texto };
}

// La ficha que llega se suma a la que había: lo que trae manda, lo que no trae se queda
export function unirFichas(antes: FichaCancion | undefined, nueva: FichaCancion | undefined): FichaCancion | undefined {
    if (!nueva) return antes;
    const unida: FichaCancion = { ...antes };
    for (const [k, v] of Object.entries(nueva) as [keyof FichaCancion, FichaCancion[keyof FichaCancion]][]) {
        if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
        // Las etiquetas se suman a las que ya tenía (no se reemplazan)
        if (k === 'extra' && v && typeof v === 'object' && !Array.isArray(v)) {
            unida.extra = { ...unida.extra, ...(v as Record<string, never>) };
            continue;
        }
        if (k === 'etiquetas' && Array.isArray(v)) {
            const ya = unida.etiquetas ?? [];
            unida.etiquetas = [...ya, ...v.filter(x => !ya.some(y => norm(y) === norm(x)))].slice(0, 30);
            continue;
        }
        (unida as Record<string, unknown>)[k] = v;
    }
    return unida;
}

// ¿Es la misma canción por el título? Igual, o igual sin lo de entre paréntesis
// («Hace calor (Mucho mejor)» = «Hace calor»)
export function mismoTitulo(a: string, b: string): boolean {
    if (norm(a) === norm(b)) return true;
    const ka = claveTitulo(a), kb = claveTitulo(b);
    return !!ka && ka === kb;
}

// ——— Copia de seguridad ———
// Todo el cancionero en un archivo: para no perderlo si se borra el móvil, pasarlo a otro
// sitio o cargar un repertorio preparado. Los repertorios apuntan a las canciones por su
// posición en la lista (dos versiones pueden llamarse igual)
export interface CancionCopia {
    titulo: string;
    artista?: string;
    texto?: string;
    ficha?: FichaCancion;
    ajustes?: Partial<AjustesCancion>;
    portada?: string;
    duracion?: number;
    bpm?: number;
    version?: string;
    notas?: string;          // notas con formato (JSON del editor)
    favorita?: boolean;      // ⭐ la versión que sale por defecto
    spotify?: string;        // su pista en Spotify
    youtube?: string;        // su vídeo para Escuchar (las marcas van en ajustes.marcas)
}
export interface RepertorioCopia { nombre: string; fecha?: string; canciones: number[]; extras?: number[]; notas?: string; hueco?: number }
export interface CatalogoCopia { aspecto?: Record<string, unknown>; campos?: unknown[] }
export interface BoloCopia {
    titulo: string; fecha?: string; lugar?: string; direccion?: string; contacto?: string; telefono?: string; notas?: string;
    horario?: { hora: string; que: string; hasta?: string }[];
    sets: { repertorio: number; hora?: string }[];
}
export interface Copia { app: 'musikeeo-cancionero'; version: 1; creada: string; canciones: CancionCopia[]; repertorios: RepertorioCopia[]; catalogo?: CatalogoCopia; bolos?: BoloCopia[] }

export function crearCopia(canciones: Cancion[], repertorios: Repertorio[], catalogo?: CatalogoCopia, bolos: Bolo[] = []): Copia {
    const posRep = new Map(repertorios.map((r, i) => [r.id, i]));
    const indice = new Map(canciones.map((c, i) => [c.id, i]));
    return {
        app: 'musikeeo-cancionero',
        version: 1,
        creada: new Date().toISOString(),
        canciones: canciones.map(c => ({
            titulo: c.titulo, artista: c.artista || undefined, texto: c.texto || undefined, ficha: c.ficha, ajustes: c.ajustes,
            portada: c.portada, duracion: c.duracion, bpm: c.bpm, version: c.version, notas: c.notas, favorita: c.favorita || undefined, spotify: c.spotify, youtube: c.youtube,
        })),
        repertorios: repertorios.map(r => ({
            nombre: r.nombre, fecha: r.fecha, canciones: r.canciones.map(id => indice.get(id)).filter((i): i is number => i !== undefined),
            ...(r.extras?.length ? { extras: r.extras.map(id => indice.get(id)).filter((i): i is number => i !== undefined) } : {}),
            notas: r.notas, hueco: r.hueco,
        })),
        ...(catalogo && (Object.keys(catalogo.aspecto ?? {}).length || catalogo.campos?.length) ? { catalogo } : {}),
        ...(bolos.length ? {
            bolos: bolos.map(b => ({
                titulo: b.titulo, fecha: b.fecha || undefined, lugar: b.lugar, direccion: b.direccion, contacto: b.contacto, telefono: b.telefono, notas: b.notas,
                horario: b.horario.length ? b.horario : undefined,
                sets: b.sets.map(s => ({ repertorio: posRep.get(s.repertorioId) ?? -1, ...(s.hora ? { hora: s.hora } : {}) })).filter(s => s.repertorio >= 0),
            })),
        } : {}),
    };
}

// Los bolos de una copia, con lo que sabemos leer (sus sets, a repertorios que existen en la copia)
function leerBolos(dato: unknown, repertorios: number): BoloCopia[] | undefined {
    if (!Array.isArray(dato)) return undefined;
    const texto = (x: unknown, max: number) => (typeof x === 'string' && x.trim() ? x.slice(0, max) : undefined);
    const bolos = dato.filter(b => b && typeof b.titulo === 'string').slice(0, 200).map((b): BoloCopia => ({
        titulo: b.titulo.slice(0, 120), fecha: texto(b.fecha, 10), lugar: texto(b.lugar, 200), direccion: texto(b.direccion, 300),
        contacto: texto(b.contacto, 120), telefono: texto(b.telefono, 40), notas: texto(b.notas, 5000),
        horario: Array.isArray(b.horario) ? b.horario.filter((h: unknown) => h && typeof (h as { que: unknown }).que === 'string')
            .map((h: { hora?: unknown; que: string; hasta?: unknown }) => ({ hora: typeof h.hora === 'string' ? h.hora.slice(0, 5) : '', que: h.que.slice(0, 200), ...(typeof h.hasta === 'string' && h.hasta ? { hasta: h.hasta.slice(0, 5) } : {}) })).slice(0, 40) : undefined,
        sets: Array.isArray(b.sets) ? b.sets.filter((s: { repertorio?: unknown }) => s && Number.isInteger(s.repertorio) && (s.repertorio as number) >= 0 && (s.repertorio as number) < repertorios)
            .map((s: { repertorio: number; hora?: unknown }) => ({ repertorio: s.repertorio, ...(typeof s.hora === 'string' ? { hora: s.hora.slice(0, 5) } : {}) })).slice(0, 10) : [],
    }));
    return bolos.length ? bolos : undefined;
}

function leerUnaCopia(texto: string): Copia | null {
    const t = texto.trim();
    if (!t.startsWith('{') || !t.includes('musikeeo-cancionero')) return null;
    try {
        const c = JSON.parse(t) as Partial<Copia>;
        if (c.app !== 'musikeeo-cancionero' || !Array.isArray(c.canciones)) return null;
        const canciones = c.canciones.filter(x => x && typeof x.titulo === 'string' && x.titulo.trim()).slice(0, 2000);
        const repertorios = (Array.isArray(c.repertorios) ? c.repertorios : [])
            .filter(r => r && typeof r.nombre === 'string' && Array.isArray(r.canciones))
            .map(r => ({
                ...r, canciones: r.canciones.filter(i => Number.isInteger(i) && i >= 0 && i < canciones.length),
                extras: Array.isArray(r.extras) ? r.extras.filter(i => Number.isInteger(i) && i >= 0 && i < canciones.length) : undefined,
            }));
        const catalogo = c.catalogo && typeof c.catalogo === 'object' ? c.catalogo : undefined;
        const bolos = leerBolos(c.bolos, repertorios.length);
        return { app: 'musikeeo-cancionero', version: 1, creada: c.creada ?? '', canciones, repertorios, ...(catalogo ? { catalogo } : {}), ...(bolos ? { bolos } : {}) };
    } catch {
        return null;
    }
}

// Una copia o varias seguidas (al abrir varios .json a la vez llegan separadas por «---»):
// se juntan en una; la misma canción en dos copias (título, versión y artista) va una vez
export function leerCopia(texto: string): Copia | null {
    const una = leerUnaCopia(texto);
    if (una) return una;
    const trozos = texto.split(/\n-{3,}\n/).map(x => x.trim()).filter(Boolean);
    if (trozos.length < 2) return null;
    const copias = trozos.map(leerUnaCopia);
    if (copias.some(c => !c)) return null;
    const canciones: CancionCopia[] = [];
    const repertorios: RepertorioCopia[] = [];
    // Por título y versión (el artista puede venir distinto en cada copia: manda la última)
    const clave = (c: CancionCopia) => `${norm(c.titulo)}|${norm(c.version ?? '')}`;
    const indice = new Map<string, number>();
    const bolosJuntos: BoloCopia[] = [];
    for (const copia of copias as Copia[]) {
        const nuevoIndice = copia.canciones.map(c => {
            const k = clave(c);
            const ya = indice.get(k);
            if (ya !== undefined) {
                // La segunda trae algo más: se suma la ficha y lo que falte
                const antes = canciones[ya];
                canciones[ya] = { ...antes, ...c, ficha: unirFichas(antes.ficha, c.ficha), texto: c.texto || antes.texto, notas: c.notas || antes.notas, bpm: antes.bpm ?? c.bpm, duracion: antes.duracion ?? c.duracion };
                return ya;
            }
            indice.set(k, canciones.length);
            canciones.push(c);
            return canciones.length - 1;
        });
        const primerRep = repertorios.length;
        for (const r of copia.repertorios) repertorios.push({ ...r, canciones: r.canciones.map(i => nuevoIndice[i]), extras: r.extras?.map(i => nuevoIndice[i]) });
        for (const b of copia.bolos ?? []) bolosJuntos.push({ ...b, sets: b.sets.map(s => ({ ...s, repertorio: s.repertorio + primerRep })) });
    }
    const catalogo = (copias as Copia[]).reduce<CatalogoCopia | undefined>((a, c) => (c.catalogo ? { aspecto: { ...a?.aspecto, ...c.catalogo.aspecto }, campos: [...(a?.campos ?? []), ...(c.catalogo.campos ?? [])] } : a), undefined);
    return { app: 'musikeeo-cancionero', version: 1, creada: (copias[0] as Copia).creada, canciones, repertorios, ...(catalogo ? { catalogo } : {}), ...(bolosJuntos.length ? { bolos: bolosJuntos } : {}) };
}

// Descargar la copia como archivo (.json)
export function descargarCopia(copia: Copia) {
    const blob = new Blob([JSON.stringify(copia, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cancionero-${new Date().toLocaleDateString('sv-SE')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ——— Versiones de una misma canción ———
// La familia: la original y las versiones que salieron de ella (por «original» o, si no, por título)
export const familiaDe = (c: Cancion) => c.original ?? c.id;
export function versionesDe(c: Cancion, todas: Cancion[]): Cancion[] {
    const raiz = familiaDe(c);
    return todas.filter(x => x.id === raiz || x.original === raiz || x.id === c.id);
}
// Para ordenar: la ⭐ favorita primero; luego tus versiones; luego la original
export const pesoVersion = (c: Cancion) => (c.favorita ? 0 : c.version ? 1 : 2);

// La cejilla que dice la ficha («Capo 3 · formas de E» → 3)
export function cejillaDeFicha(c: Cancion): number {
    const m = /(\d{1,2})/.exec(c.ficha?.capo ?? '');
    const n = m ? +m[1] : 0;
    return n >= 1 && n <= 11 ? n : 0;
}
