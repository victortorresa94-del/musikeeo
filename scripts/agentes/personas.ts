// Personas simuladas que «usan» el Feed en scripts/agentes/simular-feed.ts.
// Salen de las buyer personas del Master Context (músico, técnico, sala/promotor, tienda)
// y de la escena real de Víctor (rumba, bodas, bolos en Barcelona). Son de mentira y
// nunca escriben en Firestore: solo sirven para medir el algoritmo.
//
// Cada una tiene lo que DICE en su perfil (declarado, lo que la app sabe el primer día)
// y lo que de verdad le gusta (gustoReal, lo que el algoritmo tiene que descubrir).

import type { Rol, TipoItem } from '../../src/lib/recomendador.ts';

export interface Persona {
    id: string;
    nombre: string;
    descripcion: string;
    rol: Rol;
    ciudad: string;
    /** Lo que pone en su perfil (a menudo, menos de lo que le gusta) */
    declarado: string[];
    /** Estilo → cuánto le gusta de verdad (0 a 1) */
    gustoReal: Record<string, number>;
    /** Tipo de cosa → cuánto le interesa (0 a 1) */
    tipos: Partial<Record<TipoItem, number>>;
    /** Si le importa que sea en su ciudad (0 = le da igual, 1 = solo su ciudad) */
    local: number;
    /** Lo fácil que le da a «me gusta» (0 a 1) */
    generosidad: number;
    /** Lo que le cuesta comentar (0 = nunca, 1 = siempre que algo le encanta) */
    charla: number;
}

export const PERSONAS: Persona[] = [
    {
        id: 'rumbero-bcn', nombre: 'Javi, rumbero de Gràcia',
        descripcion: 'Guitarra y voz en una banda de rumba y versiones. Busca bolos de fin de semana y alguna cejilla barata.',
        rol: 'musician', ciudad: 'Barcelona', declarado: ['rumba'],
        gustoReal: { rumba: 1, flamenco: 0.8, latino: 0.6, versiones: 0.6, guitarra: 0.7, bodas: 0.5, pop: 0.3 },
        tipos: { bolo: 1, anuncio: 0.6, post: 0.6, artista: 0.4 }, local: 0.7, generosidad: 0.7, charla: 0.4,
    },
    {
        id: 'dj-bodas-girona', nombre: 'Marta, DJ de bodas',
        descripcion: 'Pincha en bodas y eventos de empresa en Girona y la costa. Le interesa equipo de sonido y bolos de boda.',
        rol: 'musician', ciudad: 'Girona', declarado: ['dj', 'bodas'],
        gustoReal: { dj: 1, electronica: 0.8, bodas: 0.9, disco: 0.6, eventos: 0.6, sonido: 0.5, pop: 0.4 },
        tipos: { bolo: 1, anuncio: 0.8, post: 0.4, artista: 0.3 }, local: 0.4, generosidad: 0.5, charla: 0.2,
    },
    {
        id: 'tecnico-bcn', nombre: 'Marc, técnico de sonido',
        descripcion: 'Técnico de FOH freelance con PA propia. Busca bolos donde haga falta técnico y equipo de segunda mano.',
        rol: 'provider', ciudad: 'Barcelona', declarado: [],
        gustoReal: { sonido: 1, iluminacion: 0.6, rock: 0.4, electronica: 0.3, grabacion: 0.5 },
        tipos: { anuncio: 1, bolo: 0.9, post: 0.3, artista: 0.2 }, local: 0.8, generosidad: 0.4, charla: 0.3,
    },
    {
        id: 'sala-rock-bcn', nombre: 'La Fragua, sala de conciertos',
        descripcion: 'Sala de 200 personas en el Poblenou. Programa rock, indie y algo de soul los jueves. Busca bandas, no equipo.',
        rol: 'organizer', ciudad: 'Barcelona', declarado: ['rock', 'indie'],
        gustoReal: { rock: 1, indie: 0.9, soul: 0.6, funk: 0.6, blues: 0.5, punk: 0.4 },
        tipos: { artista: 1, post: 0.8, anuncio: 0.1, bolo: 0.1 }, local: 0.6, generosidad: 0.6, charla: 0.5,
    },
    {
        id: 'wedding-planner', nombre: 'Laia, organiza bodas',
        descripcion: 'Wedding planner en el Maresme. Busca violín para ceremonias, acústico para el cóctel y una banda para el baile.',
        rol: 'organizer', ciudad: 'Barcelona', declarado: ['bodas'],
        gustoReal: { bodas: 1, violin: 0.9, clasica: 0.8, acustico: 0.8, versiones: 0.6, pop: 0.5, jazz: 0.4 },
        tipos: { artista: 1, post: 0.7, bolo: 0.2, anuncio: 0 }, local: 0.3, generosidad: 0.8, charla: 0.6,
    },
    {
        id: 'jazz-madrid', nombre: 'Sara, guitarrista de jazz',
        descripcion: 'Guitarrista de jazz y bossa en Madrid. Toca en jams y residencias de bar. Mira poco el Mercado.',
        rol: 'musician', ciudad: 'Madrid', declarado: ['jazz'],
        gustoReal: { jazz: 1, bossa: 0.8, soul: 0.6, blues: 0.6, acustico: 0.5, guitarra: 0.6 },
        tipos: { post: 0.9, bolo: 0.8, artista: 0.5, anuncio: 0.2 }, local: 0.9, generosidad: 0.6, charla: 0.3,
    },
    {
        id: 'tienda-bcn', nombre: 'Guitarras Gràcia, tienda',
        descripcion: 'Tienda de guitarras y luthería. Quiere ver qué se vende en el Mercado y a qué guitarristas seguir.',
        rol: 'provider', ciudad: 'Barcelona', declarado: ['guitarra'],
        gustoReal: { guitarra: 1, bajo: 0.6, rumba: 0.4, flamenco: 0.5, rock: 0.5, jazz: 0.4 },
        tipos: { anuncio: 1, post: 0.6, artista: 0.4, bolo: 0.1 }, local: 0.5, generosidad: 0.5, charla: 0.2,
    },
    {
        id: 'cantante-pop-valencia', nombre: 'Lucía, cantante de pop',
        descripcion: 'Voz en un dúo acústico de pop y versiones en Valencia. Sube vídeos y quiere bolos en terrazas.',
        rol: 'musician', ciudad: 'Valencia', declarado: ['pop', 'acústico'],
        gustoReal: { pop: 1, acustico: 0.9, versiones: 0.8, voz: 0.7, latino: 0.4, soul: 0.3 },
        tipos: { bolo: 0.9, post: 0.8, artista: 0.5, anuncio: 0.3 }, local: 0.6, generosidad: 0.8, charla: 0.5,
    },
];
