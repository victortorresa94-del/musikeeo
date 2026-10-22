// Las reglas del tablón de bolos: chips por momento, sin acentos y por palabras enteras
// (así «bar» no casa con «Barcelona»). Se mira el tipo, las etiquetas, el título y el sitio.
import type { Event } from '../../types';

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Las palabras sueltas de un texto, sin acentos ni signos */
export const palabras = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

/** La palabra sin su plural: «bodas» → «boda», «festivales» → «festival» */
export const raiz = (w: string) => w.replace(/(es|s)$/, '');

export const CHIPS_BOLO = [
    { id: 'todos', nombre: 'Todos', vacio: '', palabras: [] },
    { id: 'bodas', nombre: 'Bodas', vacio: 'de bodas', palabras: ['boda', 'ceremonia', 'novio', 'novia', 'matrimonio', 'social'] },
    { id: 'salas', nombre: 'Salas', vacio: 'en salas', palabras: ['sala', 'residencia', 'bar', 'club', 'pub', 'concierto', 'jam'] },
    { id: 'fiestas', nombre: 'Fiestas', vacio: 'de fiestas', palabras: ['fiesta', 'privado', 'privada', 'empresa', 'cumpleano', 'aniversario', 'despedida', 'nochevieja'] },
    { id: 'festivales', nombre: 'Festivales', vacio: 'de festivales', palabras: ['festival', 'feria', 'certamen'] },
] as const;
export type ChipBolo = typeof CHIPS_BOLO[number]['id'];

/** Todas las palabras de los chips: son «categoría», no lo que distingue a un bolo */
export const PALABRAS_CATEGORIA = new Set<string>(CHIPS_BOLO.flatMap(c => [...c.palabras]));

/** Las raíces de las palabras de un bolo que deciden su chip */
export const bolsaDe = (e: Pick<Event, 'type' | 'tags' | 'title' | 'location'>) =>
    new Set(palabras([e.type, ...(e.tags || []), e.title, e.location].filter(Boolean).join(' ')).map(raiz));

export function casaChip(bolsa: Set<string>, chip: ChipBolo) {
    const c = CHIPS_BOLO.find(x => x.id === chip);
    if (!c || c.palabras.length === 0) return true;
    return c.palabras.some(p => bolsa.has(raiz(p)));
}

/** Cómo se llama cada tipo de bolo (se compara en minúsculas). Vacío = no se enseña */
const TIPO: Record<string, string> = {
    gig: '',
    jam: 'Jam',
    session: 'Sesión',
    festival: 'Festival',
    collab: 'Colaboración',
    'boda / social': 'Boda',
    'evento privado': 'Evento privado',
    'residencia / bar': 'Residencia',
    otro: '',
};
export const nombreTipo = (t?: string) => TIPO[(t || '').toLowerCase()] ?? t ?? '';

export interface FechaBolo {
    d: Date;
    conHora: boolean;
}

/** La fecha de un bolo. «2026-10-25T18:00» es hora local; «2026-10-25» es el día entero */
export function fechaDe(s?: string): FechaBolo | null {
    if (!s) return null;
    const soloDia = /^\d{4}-\d{2}-\d{2}$/.test(s);
    const d = new Date(soloDia ? `${s}T00:00` : s);
    return isNaN(d.getTime()) ? null : { d, conHora: !soloDia };
}

const sinPunto = (s: string) => s.replace('.', '');
export const diaSemana = (d: Date) => sinPunto(d.toLocaleDateString('es-ES', { weekday: 'short' }));
export const mesCorto = (d: Date) => sinPunto(d.toLocaleDateString('es-ES', { month: 'short' }));
export const horaDe = (f: FechaBolo | null) => f?.conHora ? f.d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';

/** «1.500 €» (con punto también en los miles de cuatro cifras); sin precio, «A convenir» */
export function precioBolo(p?: number) {
    if (!p || !isFinite(p) || p <= 0) return 'A convenir';
    return `${String(Math.round(p)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;
}

export const esUrgente = (e: Pick<Event, 'tags'>) => (e.tags || []).some(t => norm(t) === 'urgente');

/** Las etiquetas que se enseñan, sin «Urgente» ni repetidas («Boda» y «Bodas» son una).
 *  Primero lo que distingue al bolo (estilo, «Sonido incluido»); al final lo que ya dicen
 *  los chips (Bodas, Salas, Bar…) y el tipo */
export function etiquetasDe(e: Pick<Event, 'type' | 'tags'>, max = 3) {
    const vistas = new Set<string>(['urgente']);
    const propias: string[] = [];
    const categoria: string[] = [];
    for (const t of [...(e.tags || []), nombreTipo(e.type)]) {
        const k = palabras(t || '').map(raiz).join(' ');
        if (!k || vistas.has(k)) continue;
        vistas.add(k);
        (k.split(' ').some(w => PALABRAS_CATEGORIA.has(w)) ? categoria : propias).push(t);
    }
    return [...propias, ...categoria].slice(0, max);
}

/** Los filtros de antes (hoja de filtros): el tipo de encargo que se guarda en `type` */
export const TIPOS_ENCARGO = [
    { id: 'todos', nombre: 'Todos', tipos: [] },
    { id: 'bolo', nombre: 'Bolo', tipos: ['gig'] },
    { id: 'jam', nombre: 'Jam', tipos: ['jam'] },
    { id: 'sesion', nombre: 'Sesión', tipos: ['session'] },
    { id: 'colaboracion', nombre: 'Colaboración', tipos: ['collab'] },
] as const;
export type TipoEncargo = typeof TIPOS_ENCARGO[number]['id'];
