// Las tareas del Cancionero, sin React: unir lo escrito a su canción, de quién cuelgan (la
// «madre»: un repertorio o un bolo), el orden y los grupos. Lo usan la vista de Tareas y los
// accesos desde la canción, el repertorio y el bolo.
import type { Bolo, Cancion, PrioridadTarea, Repertorio, Tarea } from '../types/cancionero';

// P1 · P2 · P3 (13-nov, Víctor: «las tareas con el P1 ya vale»)
export const PRIORIDADES: { id: PrioridadTarea; corto: string; nombre: string }[] = [
    { id: 'alta', corto: 'P1', nombre: 'Alta' },
    { id: 'media', corto: 'P2', nombre: 'Media' },
    { id: 'baja', corto: 'P3', nombre: 'Baja' },
];
const PESO: Record<PrioridadTarea, number> = { alta: 0, media: 1, baja: 2 };

// Los arranques de siempre: un toque los escribe y se completa con la canción
export const TIPOS_TAREA = ['Ensayar', 'Aprender la letra de', 'Aprender los acordes de', 'Sacar el tono de', 'Repasar'];

export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ').trim();

// «Ensayar Bamboléo» → la canción «Bamboléo». La que tenga el título entero dentro del texto (de 3
// letras o más); si encajan varias, la de título más largo («La bicicleta» antes que «Bici»). Entre
// versiones de la misma, la favorita
export function cancionDelTexto(texto: string, canciones: Cancion[]): Cancion | null {
    const t = ` ${normalizar(texto)} `;
    let mejor: Cancion | null = null;
    let largo = 0;
    for (const c of canciones) {
        const n = normalizar(c.titulo);
        if (n.length < 3 || !t.includes(` ${n} `)) continue;
        if (n.length > largo || (n.length === largo && c.favorita && !mejor?.favorita)) { mejor = c; largo = n.length; }
    }
    return mejor;
}

// Lo enlazado, por su id o, si ya no existe (se borró e importó de nuevo), por su nombre
export const cancionDe = (t: Tarea, canciones: Cancion[]) =>
    (t.cancionId && canciones.find(c => c.id === t.cancionId))
    || (t.cancionTitulo && canciones.find(c => normalizar(c.titulo) === normalizar(t.cancionTitulo!))) || null;
export const repertorioDe = (t: Tarea, repertorios: Repertorio[]) =>
    (t.repertorioId && repertorios.find(r => r.id === t.repertorioId))
    || (t.repertorioNombre && repertorios.find(r => normalizar(r.nombre) === normalizar(t.repertorioNombre!))) || null;
export const boloDe = (t: Tarea, bolos: Bolo[]) =>
    (t.boloId && bolos.find(b => b.id === t.boloId))
    || (t.boloTitulo && bolos.find(b => normalizar(b.titulo) === normalizar(t.boloTitulo!))) || null;

export interface Datos { canciones: Cancion[]; repertorios: Repertorio[]; bolos: Bolo[] }

// «c:<id>», «r:<id>» o «b:<id>»: una canción, un repertorio o un bolo
export type Contexto = string;
export function tareaEnContexto(t: Tarea, de: Contexto, d: Datos): boolean {
    const [tipo, id] = [de.slice(0, 1), de.slice(2)];
    const cancion = cancionDe(t, d.canciones);
    if (tipo === 'c') return cancion?.id === id;
    const rep = repertorioDe(t, d.repertorios);
    if (tipo === 'r') {
        // Las del repertorio y las de sus canciones (titulares y extras)
        const r = d.repertorios.find(x => x.id === id);
        return rep?.id === id || (!!cancion && !!r && (r.canciones.includes(cancion.id) || !!r.extras?.includes(cancion.id)));
    }
    if (tipo === 'b') {
        const b = d.bolos.find(x => x.id === id);
        const sets = new Set(b?.sets.map(s => s.repertorioId) ?? []);
        if (boloDe(t, d.bolos)?.id === id || (rep && sets.has(rep.id))) return true;
        return !!cancion && d.repertorios.some(r => sets.has(r.id) && (r.canciones.includes(cancion.id) || !!r.extras?.includes(cancion.id)));
    }
    return false;
}

export function nombreContexto(de: Contexto, d: Datos): string {
    const [tipo, id] = [de.slice(0, 1), de.slice(2)];
    if (tipo === 'c') return d.canciones.find(c => c.id === id)?.titulo ?? 'esta canción';
    if (tipo === 'r') return d.repertorios.find(r => r.id === id)?.nombre ?? 'este repertorio';
    if (tipo === 'b') return d.bolos.find(b => b.id === id)?.titulo ?? 'este bolo';
    return '';
}

// Primero las de prioridad alta; luego las que tienen fecha antes; luego las más nuevas
export function ordenTareas(a: Tarea, b: Tarea): number {
    return PESO[a.prioridad] - PESO[b.prioridad]
        || (a.para || '9999').localeCompare(b.para || '9999')
        || b.creadaEn.localeCompare(a.creadaEn);
}

export interface GrupoTareas {
    clave: string;                  // «r:<id>», «b:<id>» o «sueltas»
    tipo: 'repertorio' | 'bolo' | 'sueltas';
    nombre: string;
    fecha?: string;
    enlace?: string;                // abrir la madre
    tareas: Tarea[];
}

// Por madre: los bolos y repertorios que vienen primero (por fecha), luego los pasados, y al final
// las sueltas
export function agruparPorMadre(tareas: Tarea[], d: Datos, hoy: string): GrupoTareas[] {
    const grupos = new Map<string, GrupoTareas>();
    for (const t of tareas) {
        const b = boloDe(t, d.bolos);
        const r = !b ? repertorioDe(t, d.repertorios) : null;
        const g: Omit<GrupoTareas, 'tareas'> = b
            ? { clave: `b:${b.id}`, tipo: 'bolo', nombre: b.titulo || 'Bolo', fecha: b.fecha, enlace: `/cancionero/bolo/${b.id}` }
            : r ? { clave: `r:${r.id}`, tipo: 'repertorio', nombre: r.nombre, fecha: r.fecha, enlace: `/cancionero/repertorio/${r.id}` }
            // Una madre que ya no está (borrada): se agrupa por su nombre copiado
            : t.boloTitulo || t.repertorioNombre ? { clave: `n:${t.boloTitulo || t.repertorioNombre}`, tipo: t.boloTitulo ? 'bolo' : 'repertorio', nombre: (t.boloTitulo || t.repertorioNombre)! }
            : { clave: 'sueltas', tipo: 'sueltas', nombre: 'Sin repertorio ni bolo' };
        const ya = grupos.get(g.clave);
        if (ya) ya.tareas.push(t); else grupos.set(g.clave, { ...g, tareas: [t] });
    }
    const peso = (g: GrupoTareas) => (g.tipo === 'sueltas' ? 3 : !g.fecha ? 2 : g.fecha >= hoy ? 0 : 1);
    return [...grupos.values()]
        .map(g => ({ ...g, tareas: [...g.tareas].sort(ordenTareas) }))
        .sort((a, b) => peso(a) - peso(b) || (peso(a) === 0 ? (a.fecha ?? '').localeCompare(b.fecha ?? '') : (b.fecha ?? '').localeCompare(a.fecha ?? '')) || a.nombre.localeCompare(b.nombre));
}

// Por prioridad: Alta · Media · Baja
export function agruparPorPrioridad(tareas: Tarea[]): GrupoTareas[] {
    return PRIORIDADES.map(p => ({ clave: `p:${p.id}`, tipo: 'sueltas' as const, nombre: `${p.corto} · ${p.nombre}`, tareas: tareas.filter(t => t.prioridad === p.id).sort(ordenTareas) }))
        .filter(g => g.tareas.length);
}
