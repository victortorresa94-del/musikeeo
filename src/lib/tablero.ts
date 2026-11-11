// La vista Bloques (tablero): columnas por un dato de la ficha, y pasar una canción de una
// columna a otra cambia ese dato. Sin React.
import { DURACION_MEDIA, ENERGIAS, ESTADOS, etiquetaValor, opcionesDe, valoresDe, type CampoFiltro } from './biblioteca';
import { bloqueDe } from '../components/cancionero/estilo';
import type { Cancion, EstadoCancion, FichaCancion } from '../types/cancionero';

export type CampoTablero = CampoFiltro | 'bloque';

export const NOMBRE_TABLERO: Record<CampoTablero, string> = {
    bloque: 'Bloque del set', estilos: 'Estilo', proyectos: 'Grupo', canta: 'Canta', tonos: 'Tono', energias: 'Energía', estados: 'Estado', etiquetas: 'Etiquetas',
};

export interface Columna { clave: string; titulo: string; canciones: Cancion[]; segundos: number; estimada: boolean }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function duracion(cs: Cancion[]) {
    let segundos = 0, estimada = false;
    for (const c of cs) { if (c.duracion) segundos += c.duracion; else { segundos += DURACION_MEDIA; estimada = true; } }
    return { segundos, estimada };
}

// Columnas en orden. En el set (bloque), en el orden en que aparecen; si no, como en los filtros.
// Las que no tienen el dato, en «Sin …» al final (clave '')
export function columnas(canciones: Cancion[], campo: CampoTablero, tonoDe: (c: Cancion) => string | null): Columna[] {
    const salida: Columna[] = [];
    if (campo === 'bloque') {
        const orden: string[] = [];
        for (const c of canciones) { const b = bloqueDe(c); if (b && !orden.includes(b)) orden.push(b); }
        for (const b of orden) { const cs = canciones.filter(c => bloqueDe(c) === b); salida.push({ clave: b, titulo: b, canciones: cs, ...duracion(cs) }); }
        const sueltas = canciones.filter(c => !bloqueDe(c));
        if (sueltas.length || !salida.length) salida.push({ clave: '', titulo: 'Sin bloque', canciones: sueltas, ...duracion(sueltas) });
        return salida;
    }
    let valores = opcionesDe(canciones, campo, tonoDe).map(o => o.valor);
    // Energía y estado: todas sus columnas aunque estén vacías (para poder llevar canciones ahí)
    if (campo === 'energias') valores = Object.keys(ENERGIAS);
    if (campo === 'estados') valores = Object.keys(ESTADOS);
    for (const v of valores) {
        const cs = canciones.filter(c => valoresDe(c, campo, tonoDe(c)).some(x => norm(x) === norm(v)));
        salida.push({ clave: v, titulo: etiquetaValor(campo, v), canciones: cs, ...duracion(cs) });
    }
    const sueltas = canciones.filter(c => !valoresDe(c, campo, tonoDe(c)).length);
    salida.push({ clave: '', titulo: `Sin ${NOMBRE_TABLERO[campo].toLowerCase()}`, canciones: sueltas, ...duracion(sueltas) });
    return salida;
}

// «[Bloque]» en la primera línea del texto (como llegan las fichas del setlist)
export function ponerBloque(texto: string, bloque: string): string {
    const lineas = texto.split('\n');
    const primera = (lineas[0] ?? '').trim();
    const tiene = /^\[([^\]]{1,60})\]$/.test(primera) && bloqueDe({ texto } as Cancion) !== null;
    if (!bloque) return tiene ? lineas.slice(1).join('\n').replace(/^\n+/, '') : texto;
    const cab = `[${bloque.slice(0, 60)}]`;
    if (tiene) return [cab, ...lineas.slice(1)].join('\n');
    return texto.trim() ? `${cab}\n${texto}` : cab;
}

// La canción con el dato cambiado al pasarla de la columna «desde» a la columna «hacia»
export function mover(c: Cancion, campo: CampoTablero, desde: string, hacia: string): Cancion {
    if (desde === hacia) return c;
    if (campo === 'bloque') return { ...c, texto: ponerBloque(c.texto, hacia) };
    const f: FichaCancion = { ...(c.ficha ?? {}) };
    const valor = hacia || undefined;
    switch (campo) {
        case 'estilos': f.estilo = valor; break;
        case 'canta': f.canta = valor; break;
        case 'tonos': f.tono = valor; break;
        case 'energias': f.energia = valor ? (Number(valor) as FichaCancion['energia']) : undefined; break;
        case 'estados': f.estado = valor as EstadoCancion | undefined; break;
        case 'proyectos': case 'etiquetas': {
            const actual = (campo === 'proyectos' ? f.proyectos : f.etiquetas) ?? [];
            const sin = actual.filter(x => !desde || norm(x) !== norm(desde));
            const nueva = valor && !sin.some(x => norm(x) === norm(valor)) ? [...sin, valor] : sin;
            if (campo === 'proyectos') f.proyectos = nueva.length ? nueva : undefined; else f.etiquetas = nueva.length ? nueva : undefined;
            break;
        }
    }
    const limpia = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined)) as FichaCancion;
    return { ...c, ficha: Object.keys(limpia).length ? limpia : undefined };
}
