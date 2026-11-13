// El color del Cancionero, el mismo lenguaje que Explorar: baldosas pastel con un objeto 3D.
// Cada bloque del bolo lleva su color y su icono según cómo se llama, y cada tema sus
// etiquetas (quién canta, rumba fuerte…) leídas de la cabecera de su ficha.
import { cn } from '../../lib/utils';
import type { Linea } from '../../lib/acordes';
import type { Cancion } from '../../types/cancionero';
import { catalogoService, claveAspecto, type ColorPastel, type TipoValor } from '../../services/catalogoService';

export interface Pastel { fondo: string; tinta: string }

// Las clases van escritas enteras para que Tailwind las encuentre
export const PASTEL = {
    mantequilla: { fondo: 'bg-pastel-mantequilla', tinta: 'text-pastel-mantequilla-ink' },
    cielo: { fondo: 'bg-pastel-cielo', tinta: 'text-pastel-cielo-ink' },
    menta: { fondo: 'bg-pastel-menta', tinta: 'text-pastel-menta-ink' },
    lavanda: { fondo: 'bg-pastel-lavanda', tinta: 'text-pastel-lavanda-ink' },
    melocoton: { fondo: 'bg-pastel-melocoton', tinta: 'text-pastel-melocoton-ink' },
    rosa: { fondo: 'bg-pastel-rosa', tinta: 'text-pastel-rosa-ink' },
} satisfies Record<string, Pastel>;

const ORDEN: Pastel[] = [PASTEL.mantequilla, PASTEL.cielo, PASTEL.lavanda, PASTEL.menta, PASTEL.melocoton, PASTEL.rosa];

// El gris de lo neutro (un grupo sin color elegido, la cejilla…)
export const PASTEL_GRIS: Pastel = { fondo: 'bg-fill-strong', tinta: 'text-foreground' };
export const pastelDeColor = (c: ColorPastel): Pastel => (c === 'gris' ? PASTEL_GRIS : PASTEL[c]);

// El color que eligió la persona para ese valor (catálogo), si eligió alguno
function elegido(clave: string): Pastel | null {
    const c = catalogoService.aspecto(clave)?.color;
    return c ? pastelDeColor(c) : null;
}
export const pastelValor = (tipo: TipoValor, valor: string): Pastel | null => elegido(claveAspecto(tipo, valor));

// Siempre el mismo color para la misma clave (un repertorio, un bloque sin nombre conocido),
// salvo que se haya elegido uno (claves «etiqueta:…», «canta:…»)
export function pastelDe(clave: string): Pastel {
    const e = elegido(clave);
    if (e) return e;
    let h = 0;
    for (const c of clave) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return ORDEN[h % ORDEN.length];
}

export const ICONO = {
    canciones: '/images/cancionero/micro.webp',
    repertorios: '/images/cancionero/repertorios.webp',
    buscar: '/images/cancionero/buscar.webp',
    importar: '/images/cancionero/importar.webp',
    tono: '/images/cancionero/dame-el-tono.webp',
    claqueta: '/images/cancionero/claqueta.webp',
    escuchar: '/images/cancionero/escuchar.webp',
    pop: '/images/cancionero/pop.webp',
    rumba: '/images/cancionero/rumba.webp',
    latino: '/images/cancionero/latino.webp',
    boda: '/images/categorias/momento-boda-3d.webp',
    escenario: '/images/categorias/momento-banda-sala-3d.webp',
    bolos: '/images/3d/calendario.webp',
    tareas: '/images/cancionero/tareas.webp',
} as const;

// Un bloque del setlist («1 · Arranque pop», «Bis», «Banquillo · Rumba») por su nombre
const BLOQUES: [RegExp, Pastel, string][] = [
    [/banquillo/i, PASTEL.cielo, ICONO.repertorios],
    [/rumba|flamenc|gitan/i, PASTEL.melocoton, ICONO.rumba],
    [/bonit|novios|lent|balad|boda|rom[aá]nt/i, PASTEL.rosa, ICONO.boda],
    [/latin|cataleya|salsa|cumbia|reggaet|bachat|merengue/i, PASTEL.lavanda, ICONO.latino],
    [/final|pico|cierre|fiesta/i, PASTEL.menta, ICONO.escenario],
    [/\bbis\b|cantante|voz|voces/i, PASTEL.cielo, ICONO.canciones],
    [/pop|rock|arranque|inicio|entrada/i, PASTEL.mantequilla, ICONO.pop],
];

export function estiloBloque(nombre: string): { pastel: Pastel; icono: string } {
    const b = BLOQUES.find(([re]) => re.test(nombre));
    const propio = pastelValor('estilo', nombre);
    return b ? { pastel: propio ?? b[1], icono: b[2] } : { pastel: propio ?? pastelDe(nombre), icono: ICONO.repertorios };
}

// El color de un grupo: el elegido o el de siempre (el mismo que su lista y su filtro)
export const pastelGrupo = (g: string): Pastel => pastelValor('grupo', g) ?? pastelDe(`grupo:${g}`);

// El icono de un repertorio por su nombre (una boda, una noche de rumba…)
export function iconoRepertorio(nombre: string): string {
    return BLOQUES.find(([re]) => re.test(nombre))?.[2] ?? ICONO.repertorios;
}

// Los iconos 3D que se pueden poner a un repertorio (13-nov, Víctor: «quiero poder elegir los
// iconos del reper»). Solo objetos sueltos, sin fondo: van encima del pastel del repertorio
export const ICONOS_REPERTORIO: { src: string; nombre: string }[] = [
    { src: ICONO.repertorios, nombre: 'Repertorio' },
    { src: ICONO.canciones, nombre: 'Micro' },
    { src: '/images/3d/cantante.webp', nombre: 'Cantante' },
    { src: '/images/3d/banda.webp', nombre: 'Banda' },
    { src: ICONO.escenario, nombre: 'Escenario' },
    { src: ICONO.pop, nombre: 'Eléctrica' },
    { src: ICONO.rumba, nombre: 'Rumba' },
    { src: ICONO.latino, nombre: 'Maracas' },
    { src: '/images/3d/violinista.webp', nombre: 'Violín' },
    { src: '/images/3d/boda.webp', nombre: 'Anillos' },
    { src: ICONO.boda, nombre: 'Boda' },
    { src: '/images/3d/dj.webp', nombre: 'DJ' },
    { src: '/images/3d/tocadiscos.webp', nombre: 'Vinilo' },
    { src: '/images/3d/altavoz.webp', nombre: 'Altavoz' },
    { src: '/images/3d/mesa.webp', nombre: 'Mesa' },
    { src: ICONO.escuchar, nombre: 'Cascos' },
    { src: ICONO.claqueta, nombre: 'Metrónomo' },
    { src: ICONO.tono, nombre: 'Diapasón' },
    { src: ICONO.bolos, nombre: 'Calendario' },
    { src: '/images/perfil/mapa.webp', nombre: 'Gira' },
    { src: ICONO.importar, nombre: 'Carpeta' },
];

// Una ruta de un icono de la app (lo que llega de una copia o de la nube no se pinta a ciegas)
export const esIconoDeApp = (x: unknown): x is string =>
    typeof x === 'string' && x.length <= 200 && /^\/images\/[\w/-]+\.(webp|png|jpe?g|svg)$/i.test(x);

// El icono de un repertorio: el que se eligió o, si no, el de su nombre
export const iconoDeRepertorio = (r: { nombre: string; icono?: string }): string =>
    esIconoDeApp(r.icono) ? r.icono : iconoRepertorio(r.nombre);

const NO_ES_BLOQUE = /^(intro|estrofa|verso|coro|estribillo|pre|puente|solo|final|outro|interludio|riff|letra|instrumental)\b/i;

// Las líneas de la cabecera de la ficha: hasta la primera línea en blanco
const cabecera = (texto: string) => {
    const lineas = texto.split('\n');
    const corte = lineas.findIndex(l => !l.trim());
    return (corte === -1 ? lineas : lineas.slice(0, corte)).map(l => l.trim());
};

// «[1 · Arranque pop]» en la primera línea: el bloque del bolo al que pertenece
export function bloqueDe(c: Cancion): string | null {
    const m = /^\[([^\]]{1,60})\]$/.exec(cabecera(c.texto)[0] ?? '');
    return m && !NO_ES_BLOQUE.test(m[1]) ? m[1].trim() : null;
}

export interface Etiqueta { texto: string; pastel: Pastel | null; icono?: string; tipo?: 'canta' | 'estilo' | 'estado' | 'capo' }

// Los avisos de la ficha que salen en píldora. «entera»: la píldora lo dice todo (en Tocar la
// línea no se repite en la hoja); «Confirmar: …» se queda también en la hoja, por el detalle
const AVISOS: [RegExp, (m: RegExpExecArray) => Etiqueta, boolean][] = [
    [/^canta (.{1,24})$/i, m => ({ texto: `Canta ${m[1]}`, pastel: PASTEL.rosa, icono: ICONO.canciones }), true],
    [/rasgueo fuerte|rumba fuerte/i, () => ({ texto: 'Rumba fuerte', pastel: PASTEL.melocoton, icono: ICONO.rumba }), true],
    [/^catal[aà]$/i, () => ({ texto: 'Català', pastel: PASTEL.cielo }), true],
    [/^confirmar\b/i, () => ({ texto: 'Por confirmar', pastel: PASTEL.mantequilla }), false],
];

// Lo que hay que saber de un tema de un vistazo, sacado de los avisos de su ficha
export function etiquetasDe(c: Cancion): Etiqueta[] {
    const salida: Etiqueta[] = [];
    for (const l of cabecera(c.texto)) {
        for (const [re, etiqueta] of AVISOS) {
            const m = re.exec(l);
            if (m) { salida.push(etiqueta(m)); break; }
        }
    }
    // La cejilla, antes de empezar: la de la ficha tal cual («Capo 3 · formas de E») o la puesta
    const capo = c.ficha?.capo?.trim();
    if (capo && /\d/.test(capo)) salida.push({ texto: /^(capo|cejilla)/i.test(capo) ? capo : `Capo ${capo}`, pastel: null });
    else if (c.ajustes.cejilla > 0) salida.push({ texto: `Cejilla ${c.ajustes.cejilla}`, pastel: null });
    return salida;
}

// Una línea de la cabecera de la ficha que ya va en una píldora (el bloque, quién canta…)
function vaEnPildora(l: Linea, bloque: string | null): boolean {
    if (l.tipo === 'seccion') return !!bloque && l.texto.trim() === bloque;
    if (l.tipo !== 'letra' && l.tipo !== 'nota') return false;
    const t = l.texto.trim();
    return AVISOS.some(([re, , entera]) => entera && re.test(t));
}

// En Tocar, lo que ya dicen las píldoras no se repite al principio de la hoja
export function sinLoDeLasPildoras(lineas: Linea[], bloque: string | null): Linea[] {
    const corte = lineas.findIndex(l => l.tipo === 'vacia');
    const quitar = (l: Linea, i: number) => (corte === -1 || i < corte) && vaEnPildora(l, bloque);
    return lineas.some(quitar) ? lineas.filter((l, i) => !quitar(l, i)) : lineas;
}

// El color de cada parte de la canción, para saber de un vistazo dónde está el estribillo.
// El estribillo y el puente van en su baldosa; el resto, con la etiqueta de color
export interface EstiloSeccion { bloque?: string; etiqueta: string; icono?: string }

const SECCIONES: [RegExp, EstiloSeccion][] = [
    [/^(estribillo|coro|chorus|refr[aã]o|refrain|hook)\b/i, { bloque: 'bg-pastel-mantequilla', etiqueta: 'text-pastel-mantequilla-ink', icono: ICONO.canciones }],
    [/^(puente|bridge)\b/i, { bloque: 'bg-pastel-lavanda', etiqueta: 'text-pastel-lavanda-ink', icono: ICONO.escenario }],
    [/^(pre-?\s?coro|pre-?\s?estribillo|pre-?chorus)\b/i, { etiqueta: 'bg-pastel-rosa text-pastel-rosa-ink' }],
    [/^(estrofa|verso|verse|\d+ª? estrofa)\b/i, { etiqueta: 'bg-pastel-cielo text-pastel-cielo-ink' }],
    [/^(intro|solo|interludio|instrumental|riff|final|outro|coda)\b/i, { etiqueta: 'bg-pastel-menta text-pastel-menta-ink' }],
];

export function estiloSeccion(nombre: string): EstiloSeccion | null {
    const s = SECCIONES.find(([re]) => re.test(nombre.trim()));
    if (s) return s[1];
    // «1 · Arranque pop»: el bloque del bolo, con su color
    if (/·/.test(nombre)) { const { pastel } = estiloBloque(nombre); return { etiqueta: cn(pastel.fondo, pastel.tinta) }; }
    return null;
}

// ——— La ficha del tema (tono, quién canta, estilo, estado) en píldoras ———
const ESTADO_PILDORA: Record<string, Etiqueta> = {
    ensayar: { texto: 'Por ensayar', pastel: PASTEL.mantequilla },
    aprender: { texto: 'Para aprender', pastel: PASTEL.cielo },
};

// El color de quien canta: siempre el mismo para la misma persona
export const pastelCanta = (quien: string): Pastel => pastelDe(`canta:${quien.trim().toLowerCase()}`);

// Las píldoras de un tema en una lista: quién canta, el estilo y si falta ensayarla. Lo que
// diga la ficha manda sobre lo que se lee de su cabecera (no sale «Canta Mafe» dos veces)
export function etiquetasTema(c: Cancion): Etiqueta[] {
    const f = c.ficha ?? {};
    const salida: Etiqueta[] = [];
    if (f.canta) salida.push({ texto: f.canta, pastel: pastelCanta(f.canta), icono: ICONO.canciones, tipo: 'canta' });
    if (f.estilo) salida.push({ texto: f.estilo, pastel: estiloBloque(f.estilo).pastel, tipo: 'estilo' });
    if (f.estado && ESTADO_PILDORA[f.estado]) salida.push({ ...ESTADO_PILDORA[f.estado], tipo: 'estado' });
    for (const e of etiquetasDe(c)) {
        if (f.canta && /^canta /i.test(e.texto)) continue;
        if (/^cejilla/i.test(e.texto) && f.capo) continue;
        salida.push(e);
    }
    if (f.capo && !/^capo 0\b/i.test(f.capo)) salida.push({ texto: f.capo.replace(/\s*·.*$/, ''), pastel: null, tipo: 'capo' });
    // La cejilla de la ficha ya sale arriba como «Capo 2»: sin repetirla (ni ninguna otra)
    return salida.filter((e, i) => salida.findIndex(x => x.texto.toLowerCase() === e.texto.toLowerCase()) === i);
}
