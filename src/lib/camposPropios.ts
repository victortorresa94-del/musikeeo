// Las columnas propias de la ficha (13-nov): casilla, etiquetas, número o texto, como en Notion.
// Víctor: «características o columnas nuevas y personalizadas a elegir entre check, etiqueta,
// número, texto». La definición vive en el catálogo (catalogoService.campos) y el valor de cada
// canción en ficha.extra[id]. Sin React ni Firebase.
import type { Cancion, FichaCancion, ValorExtra } from '../types/cancionero';
import type { CampoPropio, TipoCampo } from '../services/catalogoService';

export const NOMBRE_TIPO: Record<TipoCampo, string> = { casilla: 'Casilla', etiqueta: 'Etiquetas', numero: 'Número', texto: 'Texto' };
export const COL_EXTRA = 'x:';
export const esColExtra = (col: string) => col.startsWith(COL_EXTRA);
export const idDeCol = (col: string) => col.slice(COL_EXTRA.length);

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// El valor de una canción, ya con su forma (lo que no encaja con el tipo no cuenta)
export function valorExtra(c: Cancion, campo: CampoPropio): ValorExtra | undefined {
    const v = c.ficha?.extra?.[campo.id];
    switch (campo.tipo) {
        case 'casilla': return v === true ? true : undefined;
        case 'numero': return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
        case 'texto': return typeof v === 'string' && v.trim() ? v : undefined;
        case 'etiqueta': {
            const lista = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : typeof v === 'string' && v.trim() ? [v] : [];
            return lista.length ? lista : undefined;
        }
    }
}

export const etiquetasExtra = (c: Cancion, campo: CampoPropio): string[] => {
    const v = valorExtra(c, campo);
    return Array.isArray(v) ? v : [];
};

// La canción con ese valor puesto (vacío = quitado; sin ninguno, fuera el mapa)
export function conExtra(c: Cancion, id: string, v: ValorExtra | undefined): Cancion {
    const extra = { ...(c.ficha?.extra ?? {}) };
    const vacio = v === undefined || v === false || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'number' && !Number.isFinite(v));
    if (vacio) delete extra[id]; else extra[id] = v;
    const ficha: FichaCancion = { ...(c.ficha ?? {}) };
    if (Object.keys(extra).length) ficha.extra = extra; else delete ficha.extra;
    return { ...c, ficha: Object.keys(ficha).length ? ficha : undefined };
}

// Lo que se escribe en la celda, leído según el tipo
export function leerExtra(texto: string, tipo: TipoCampo): ValorExtra | undefined {
    const t = texto.trim();
    if (!t) return undefined;
    if (tipo === 'numero') {
        const n = Number(t.replace(',', '.'));
        return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
    }
    if (tipo === 'texto') return t.slice(0, 300);
    return undefined;
}

// Para ordenar y para enseñar
export function textoExtra(c: Cancion, campo: CampoPropio): string {
    const v = valorExtra(c, campo);
    if (v === undefined) return '';
    if (v === true) return 'Sí';
    if (Array.isArray(v)) return v.join(', ');
    return typeof v === 'number' ? String(v).replace('.', ',') : String(v);
}
export function ordenExtra(c: Cancion, campo: CampoPropio): string | number {
    const v = valorExtra(c, campo);
    if (campo.tipo === 'numero') return typeof v === 'number' ? v : Number.POSITIVE_INFINITY;
    if (campo.tipo === 'casilla') return v === true ? 0 : 1;
    return norm(textoExtra(c, campo)) || '￿';
}

// Las etiquetas que se pueden elegir: las guardadas en la columna y las que ya llevan las canciones
export function opcionesExtra(canciones: Cancion[], campo: CampoPropio): string[] {
    const salida: string[] = [];
    const ya = new Set<string>();
    const meter = (x: string) => { const k = norm(x); if (k && !ya.has(k)) { ya.add(k); salida.push(x); } };
    (campo.opciones ?? []).forEach(meter);
    for (const c of canciones) etiquetasExtra(c, campo).forEach(meter);
    return salida;
}

// Para agrupar por una columna propia: los valores de cada canción
export function gruposExtra(c: Cancion, campo: CampoPropio): string[] {
    const v = valorExtra(c, campo);
    if (v === undefined) return [];
    if (Array.isArray(v)) return v;
    if (v === true) return [campo.nombre];
    return [String(v)];
}
