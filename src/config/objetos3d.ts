// Los objetos 3D de la app (arcilla, sin fondo, en /public/images/3d). Una sola tabla para
// que Bolos, el detalle, Publicar y el Feed hablen el mismo idioma visual.
import type { Event } from '../types';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const OBJETO_3D = {
    boda: '/images/3d/boda.webp',
    microfono: '/images/3d/microfono.webp',
    tocadiscos: '/images/3d/tocadiscos.webp',
    guitarra: '/images/3d/guitarra.webp',
    calendario: '/images/3d/calendario.webp',
    moneda: '/images/3d/moneda.webp',
    altavoz: '/images/3d/altavoz.webp',
    mesa: '/images/3d/mesa.webp',
    escenario: '/images/3d/escenario.webp',
    banda: '/images/3d/banda.webp',
    cantante: '/images/3d/cantante.webp',
    dj: '/images/3d/dj.webp',
    violinista: '/images/3d/violinista.webp',
} as const;

export type Objeto3D = keyof typeof OBJETO_3D;

// Por orden: la primera regla que case decide. Se mira el tipo, las etiquetas y el título
const REGLAS: { objeto: Objeto3D; palabras: string[] }[] = [
    { objeto: 'boda', palabras: ['boda', 'ceremonia', 'novios', 'social'] },
    { objeto: 'tocadiscos', palabras: ['dj', 'electronica', 'house', 'techno'] },
    { objeto: 'mesa', palabras: ['tecnico', 'foh', 'backline', 'luces'] },  // no «sonido»: «Sonido incluido» no es un bolo de técnico
    { objeto: 'microfono', palabras: ['cantante', 'voz', 'acustico', 'residencia', 'bar', 'jam'] },
    { objeto: 'escenario', palabras: ['festival', 'sala', 'concierto'] },
];

/** El objeto 3D que representa un bolo; la guitarra si no se sabe */
export function objeto3dDeBolo(e: Pick<Event, 'type' | 'tags' | 'title'>): string {
    const bolsa = norm([e.type, ...(e.tags || []), e.title].filter(Boolean).join(' '));
    const r = REGLAS.find(x => x.palabras.some(p => bolsa.includes(p)));
    return OBJETO_3D[r?.objeto ?? 'guitarra'];
}
