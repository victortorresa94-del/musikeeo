// El color del Cancionero, el mismo lenguaje que Explorar: baldosas pastel con un objeto 3D.
// Cada bloque del bolo lleva su color y su icono según cómo se llama, y cada tema sus
// etiquetas (quién canta, rumba fuerte…) leídas de la cabecera de su ficha.
import type { Cancion } from '../../types/cancionero';

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

// Siempre el mismo color para la misma clave (un repertorio, un bloque sin nombre conocido)
export function pastelDe(clave: string): Pastel {
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
    pop: '/images/cancionero/pop.webp',
    rumba: '/images/cancionero/rumba.webp',
    latino: '/images/cancionero/latino.webp',
    boda: '/images/categorias/momento-boda-3d.webp',
    escenario: '/images/categorias/momento-banda-sala-3d.webp',
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
    return b ? { pastel: b[1], icono: b[2] } : { pastel: pastelDe(nombre), icono: ICONO.repertorios };
}

// El icono de un repertorio por su nombre (una boda, una noche de rumba…)
export function iconoRepertorio(nombre: string): string {
    return BLOQUES.find(([re]) => re.test(nombre))?.[2] ?? ICONO.repertorios;
}

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

export interface Etiqueta { texto: string; pastel: Pastel | null }

// Lo que hay que saber de un tema de un vistazo, sacado de los avisos de su ficha
export function etiquetasDe(c: Cancion): Etiqueta[] {
    const salida: Etiqueta[] = [];
    for (const l of cabecera(c.texto)) {
        const canta = /^canta (.{1,24})$/i.exec(l);
        if (canta) salida.push({ texto: `Canta ${canta[1]}`, pastel: PASTEL.rosa });
        else if (/rasgueo fuerte|rumba fuerte/i.test(l)) salida.push({ texto: 'Rumba fuerte', pastel: PASTEL.melocoton });
        else if (/^catal[aà]$/i.test(l)) salida.push({ texto: 'Català', pastel: PASTEL.cielo });
        else if (/^confirmar\b/i.test(l)) salida.push({ texto: 'Por confirmar', pastel: PASTEL.mantequilla });
    }
    if (c.ajustes.cejilla > 0) salida.push({ texto: `Cejilla ${c.ajustes.cejilla}`, pastel: null });
    return salida;
}
