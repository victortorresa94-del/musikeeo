// Las listas de Canciones, como en un gestor de música: fijas (Todas, Para aprender, Por ensayar,
// Favoritas), una por grupo (de la ficha) y las tuyas (manuales o con un filtro guardado). Sin React.
import { filtrar, SIN_FILTROS, type Filtros } from './biblioteca';
import { norm } from '../components/cancionero/utilidades';
import type { Cancion, Lista, ReglaLista } from '../types/cancionero';

export type ClaseLista = 'fija' | 'grupo' | 'propia';
export interface EntradaLista { id: string; nombre: string; clase: ClaseLista; color?: string; lista?: Lista }

export const LISTAS_FIJAS: EntradaLista[] = [
    { id: 'todas', nombre: 'Todas', clase: 'fija' },
    { id: 'aprender', nombre: 'Para aprender', clase: 'fija', color: 'lavanda' },
    { id: 'ensayar', nombre: 'Por ensayar', clase: 'fija', color: 'melocoton' },
    { id: 'favoritas', nombre: 'Favoritas', clase: 'fija', color: 'mantequilla' },
];

export const COLORES_LISTA = ['mantequilla', 'cielo', 'menta', 'lavanda', 'melocoton', 'rosa'] as const;

// Los grupos salen de las fichas («Lady Jarana», «Cataleya»…), por cuántas canciones tienen
export function gruposDe(canciones: Cancion[]): EntradaLista[] {
    const n = new Map<string, number>();
    for (const c of canciones) for (const g of c.ficha?.proyectos ?? []) if (g.trim()) n.set(g.trim(), (n.get(g.trim()) ?? 0) + 1);
    const grupos: EntradaLista[] = [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
        .map(([g]) => ({ id: `grupo:${g}`, nombre: g, clase: 'grupo' }));
    // Las que no son de ningún grupo, para repasarlas y ponérselo
    if (grupos.length && canciones.some(c => !(c.ficha?.proyectos ?? []).some(g => g.trim()))) {
        grupos.push({ id: 'sin-grupo', nombre: 'Sin grupo', clase: 'grupo' });
    }
    return grupos;
}

export function entradasPropias(listas: Lista[]): EntradaLista[] {
    return [...listas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.creadaEn.localeCompare(b.creadaEn))
        .map(l => ({ id: l.id, nombre: l.nombre, clase: 'propia', color: l.color, lista: l }));
}

// Lo que busca el buscador, para una lista con texto guardado
const casaTexto = (c: Cancion, t: string) =>
    norm(`${c.titulo} ${c.version ?? ''} ${c.artista} ${c.ficha?.canta ?? ''} ${c.ficha?.estilo ?? ''} ${(c.ficha?.proyectos ?? []).join(' ')} ${(c.ficha?.etiquetas ?? []).join(' ')}`).includes(norm(t));

export function cumpleRegla(canciones: Cancion[], regla: ReglaLista, tonoDe: (c: Cancion) => string | null): Cancion[] {
    const f: Filtros = { ...SIN_FILTROS, ...(regla.filtros as Partial<Filtros> | undefined) };
    const base = filtrar(canciones, f, tonoDe);
    const t = regla.texto?.trim();
    return t ? base.filter(c => casaTexto(c, t)) : base;
}

// Las canciones de una lista (las manuales, en el orden en que se metieron)
export function cancionesDeLista(id: string, canciones: Cancion[], listas: Lista[], tonoDe: (c: Cancion) => string | null): Cancion[] {
    if (id === 'todas') return canciones;
    if (id === 'aprender') return canciones.filter(c => c.ficha?.estado === 'aprender');
    if (id === 'ensayar') return canciones.filter(c => c.ficha?.estado === 'ensayar');
    if (id === 'favoritas') return canciones.filter(c => c.favorita);
    if (id === 'sin-grupo') return canciones.filter(c => !(c.ficha?.proyectos ?? []).some(g => g.trim()));
    if (id.startsWith('grupo:')) {
        const g = id.slice(6);
        return canciones.filter(c => (c.ficha?.proyectos ?? []).some(p => p.trim() === g));
    }
    const l = listas.find(x => x.id === id);
    if (!l) return canciones;
    if (l.regla) return cumpleRegla(canciones, l.regla, tonoDe);
    const porId = new Map(canciones.map(c => [c.id, c]));
    return l.canciones.map(x => porId.get(x)).filter((c): c is Cancion => !!c);
}

export function nombreDeLista(id: string, listas: Lista[]): string {
    const fija = LISTAS_FIJAS.find(l => l.id === id);
    if (fija) return fija.nombre;
    if (id === 'sin-grupo') return 'Sin grupo';
    if (id.startsWith('grupo:')) return id.slice(6);
    return listas.find(l => l.id === id)?.nombre ?? 'Todas';
}

// Lo que dice una lista inteligente, en una línea («Estopa · Pop-rock · tono Am»)
export function resumenRegla(regla: ReglaLista): string {
    const partes = [regla.texto?.trim() && `«${regla.texto.trim()}»`,
        ...Object.values(regla.filtros ?? {}).flatMap(v => v ?? [])].filter(Boolean);
    return partes.join(' · ') || 'Todas';
}
