import type { Alteraciones, Notacion } from '../lib/acordes';

// Cómo la deja cada persona: se guarda con la canción y se abre igual la próxima vez
export interface AjustesCancion {
    semitonos: number;          // -11 … 11 sobre el tono en que suena lo pegado
    cejilla: number;            // 0 … 11: la que pone quien la toca
    notacion: Notacion;
    alteraciones: Alteraciones;
    tamano: number;             // px de la letra
    columnas: 1 | 2 | 3;
    ajustar: boolean;           // que quepa entera en la pantalla
    vista: 'completa' | 'letra' | 'acordes';
    velocidad: number;          // desplazamiento automático, px por segundo
    alRitmo?: boolean;          // con la duración de la canción: la hoja baja entera en lo que dura
    intro?: number;             // segundos de intro que no cuentan para bajar (10 si no se dice)
    cejillaGuardada?: number;   // la cejilla de «Formas» mientras se ve como suena
    ritmo?: number;             // modo auto de Tocar: 1,2 = la hoja baja un 20 % más rápido en esta canción
    marcas?: { l: number; t: number }[];   // Escuchar: la línea l (en el orden de la hoja) suena en el segundo t del vídeo
}

// En qué punto está para el repertorio
export type EstadoCancion = 'lista' | 'ensayar' | 'aprender';
// Energía: las cuatro de siempre (1 suave · 2 media · 3 media-alta · 4 arriba) o una propia, por su
// nombre (13-nov, Víctor: «poder añadir nuevas desde aquí, igual que en Estilo»)
export type Energia = 1 | 2 | 3 | 4 | string;

// La ficha del tema, como en una base de datos de repertorio: para buscar, filtrar y elegir
// canciones para el bolo de un vistazo. Todo opcional y escrito a mano por su dueño
export interface FichaCancion {
    tono?: string;              // el tono en que SUENA (G, Bm, F#m…), aunque se toque con cejilla
    capo?: string;              // «Capo 2 · formas de Am»: cómo se toca
    canta?: string;             // quién lleva la voz: «Víctor», «Mafe», «Ambos»…
    proyectos?: string[];       // con qué grupo o formación se toca: «Lady Jarana», «Cataleya»
    estilo?: string;            // «Rumba», «Pop-rock», «Latino»…
    energia?: Energia;          // 1 suave · 2 media · 3 media-alta · 4 arriba, o una propia
    estado?: EstadoCancion | (string & {});   // lista · ensayar · aprender, o uno propio
    tonoAlt?: string;           // otro tono en que también la tocáis («G · también A»)
    etiquetas?: string[];       // categorías propias, libres: «Bodas», «Tardeo», «Flamencas»…
    enlace?: string;            // su página de acordes (LaCuerda u otra web)
    extra?: Record<string, ValorExtra>; // columnas propias (catálogo): casilla, etiquetas, número o texto
}
export type ValorExtra = boolean | number | string | string[];

// Privada: solo la ve su dueño (en su móvil, y en su cuenta si tiene)
export interface Cancion {
    id: string;
    titulo: string;
    artista: string;
    texto: string;              // lo pegado, ya limpio
    ajustes: AjustesCancion;
    creadaEn: string;           // ISO
    actualizadaEn: string;      // ISO
    sincronizada?: boolean;     // solo en el móvil: ya estuvo en la cuenta
    // Lo que sabemos de la canción grabada (buscador de canciones, catálogo de Apple)
    portada?: string;           // URL de la carátula
    duracion?: number;          // segundos (para que el desplazamiento dure lo que la canción)
    muestra?: string;           // URL de 30 s para escucharla y coger el tono
    bpm?: number;               // tempo, para la claqueta
    ficha?: FichaCancion;
    // Tu versión de una canción (la mitad, en otro tono, con otra cejilla…): su nombre («Víctor»,
    // «Cataleya») y de cuál salió. Es una canción aparte, con su texto, ajustes y duración
    version?: string;
    original?: string;          // id de la canción de la que se hizo
    favorita?: boolean;         // ⭐ la versión que sale por defecto (al buscar y al añadir a un repertorio)
    spotify?: string;           // la pista en Spotify (open.spotify.com/track/…), se apunta al crear una playlist
    youtube?: string;           // el vídeo para escucharla con la hoja siguiéndola (el id de 11 caracteres)
    // Notas con formato (títulos, negrita, colores, avisos, casillas): el JSON del editor, en texto
    notas?: string;
}

// Un repertorio (setlist) para un bolo: canciones del cancionero en el orden en que se tocan
// Una lista tuya dentro de Canciones («Para la boda», «Estopa»…). Manual: las canciones que metes.
// Inteligente: se guarda un filtro (los de la biblioteca y/o un texto) y se llena sola
export interface ReglaLista {
    filtros?: Partial<Record<string, string[]>>;
    texto?: string;
}
export interface Lista {
    id: string;
    nombre: string;
    color?: string;             // nombre de un pastel (mantequilla, cielo, menta, lavanda, melocoton, rosa)
    canciones: string[];        // manual: ids de Cancion
    regla?: ReglaLista;         // inteligente
    orden?: number;
    creadaEn: string;
    actualizadaEn: string;
    sincronizada?: boolean;
}

// Una tarea del músico (13-nov, Víctor: «un apartado de tareas, tipo ensayar x canción, aprender
// letra tal… con prioridades», «relacionar tareas con canciones o bolos», «un listado de tareas y que
// la madre sea "repertorio Pallejà Lady"»). La madre es un repertorio o un bolo (agrupan la lista);
// además puede ir unida a una canción. Los nombres van copiados: si se borra y se vuelve a importar
// el cancionero (ids nuevos), la tarea se vuelve a unir por el nombre
export type PrioridadTarea = 'alta' | 'media' | 'baja';
export interface Tarea {
    id: string;
    texto: string;
    prioridad: PrioridadTarea;
    hecha?: string;             // cuándo se tachó (sin esto, pendiente). Tachada no se borra
    cancionId?: string;
    cancionTitulo?: string;
    repertorioId?: string;      // madre: un repertorio…
    repertorioNombre?: string;
    boloId?: string;            // …o un bolo
    boloTitulo?: string;
    para?: string;              // AAAA-MM-DD, para cuándo
    creadaEn: string;
    actualizadaEn: string;
    sincronizada?: boolean;
}

// Un bolo (13-nov): lo que hay que saber de una actuación para pasárselo a los músicos —cuándo,
// dónde, el horario, los sets (repertorios) con su hora, a quién llamar y las notas—. Aparte del
// repertorio: uno o varios sets por bolo, y el mismo repertorio puede ir en varios bolos
export interface HoraBolo { hora: string; que: string; hasta?: string }   // «10:30» · «Llegada y montaje» (hasta: el concierto, «de 12:30 a 13:30»)
export interface SetBolo { repertorioId: string; hora?: string }  // hora de empezar ese set
export interface Bolo {
    id: string;
    titulo: string;             // «RTF Pallejà»
    fecha: string;              // AAAA-MM-DD
    lugar?: string;             // «Rambla Thomas Frenkel, sala grande»
    direccion?: string;         // para el mapa
    horario: HoraBolo[];
    sets: SetBolo[];
    contacto?: string;          // quién os recibe
    telefono?: string;
    notas?: string;             // aparcar, ropa, comida, pago… (texto)
    compartido?: { cifrado?: string; letra?: string };   // como en el repertorio: compartidos/{id}
    creadaEn: string;
    actualizadaEn: string;
    sincronizada?: boolean;
}

export interface Repertorio {
    id: string;
    nombre: string;
    fecha: string;              // AAAA-MM-DD
    canciones: string[];        // ids de Cancion, en orden
    // Extras: «canciones que tengo en la recámara» (13-nov). A mano en el bolo, pero fuera del
    // orden y de la duración. Nunca a la vez en `canciones`
    extras?: string[];
    spotify?: string;           // la playlist de este repertorio en Spotify
    notas?: string;             // la hoja del bolo, con formato (JSON del editor, en texto)
    hueco?: number;             // minutos que dura el hueco del bolo (para ver si te pasas)
    // El enlace del grupo que se actualiza solo: id de su copia pública (compartidos/{id}),
    // una para el cifrado y otra con letra
    compartido?: { cifrado?: string; letra?: string };
    creadaEn: string;
    actualizadaEn: string;
    sincronizada?: boolean;
}
