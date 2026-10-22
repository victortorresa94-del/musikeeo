// El mapa del marketplace: UNA tabla que leen el inicio de Explorar, la vista de cada
// categoría, el buscador y Rodrigo. Las claves (slug) no cambian aunque cambie la palabra.
import type { ListingCategory, ListingType } from '../types';

export type TipoCategoria = 'artistas' | 'tecnicos' | 'salas' | 'equipo';

export interface Categoria {
    slug: string;
    nombre: string;
    /** Frase corta bajo el título de la vista */
    bajada: string;
    icono: string;            // /images/categorias/<slug>.webp (3D, del sueño de Aura Studio)
    tipo: TipoCategoria;
    grupo: 'Contratar' | 'Comprar y alquilar';
    /** artistas: etiquetas que la incluyen (en tags o géneros, sin mayúsculas) */
    etiquetas?: string[];
    /** equipo: categorías del Mercado y tipo de anuncio */
    mercado?: ListingCategory[];
    tipoAnuncio?: ListingType;
    /** Sinónimos para el buscador */
    sinonimos?: string[];
}

export const CATEGORIAS: Categoria[] = [
    { slug: 'bandas', nombre: 'Bandas', bajada: 'Para bodas, salas, fiestas y festivales', icono: 'bandas', tipo: 'artistas', grupo: 'Contratar',
      etiquetas: ['banda', 'grupo', 'orquesta', 'cuarteto', 'trío', 'trio'], sinonimos: ['grupo', 'orquesta', 'conjunto'] },
    { slug: 'musicos', nombre: 'Músicos', bajada: 'Cantantes, solistas y músicos de sesión', icono: 'musicos', tipo: 'artistas', grupo: 'Contratar',
      etiquetas: ['solista', 'cantante', 'cantautora', 'cantautor', 'guitarrista', 'violinista', 'pianista', 'músico', 'flamenco'], sinonimos: ['cantante', 'solista', 'violinista', 'guitarrista'] },
    { slug: 'djs', nombre: 'DJs', bajada: 'Sesiones para eventos, terrazas y clubs', icono: 'djs', tipo: 'artistas', grupo: 'Contratar',
      etiquetas: ['dj', 'electrónica', 'electronica', 'house'], sinonimos: ['pinchadiscos', 'dj set'] },
    { slug: 'tecnicos', nombre: 'Técnicos', bajada: 'Sonido, luces y backline con técnico', icono: 'tecnicos', tipo: 'tecnicos', grupo: 'Contratar',
      sinonimos: ['sonido', 'técnico de sonido', 'luces', 'backline', 'pa'] },
    { slug: 'salas', nombre: 'Salas', bajada: 'Salas, bares y promotores que programan', icono: 'salas', tipo: 'salas', grupo: 'Contratar',
      sinonimos: ['bar', 'local', 'promotor', 'venue'] },
    { slug: 'guitarras', nombre: 'Guitarras', bajada: 'Eléctricas, acústicas, españolas y bajos', icono: 'guitarras', tipo: 'equipo', grupo: 'Comprar y alquilar',
      mercado: ['guitarras', 'bajos'], sinonimos: ['bajo', 'guitarra', 'fender', 'gibson'] },
    { slug: 'cuerdas', nombre: 'Cuerdas', bajada: 'Violines, violas, chelos y accesorios', icono: 'cuerdas', tipo: 'equipo', grupo: 'Comprar y alquilar',
      mercado: ['cuerdas'], sinonimos: ['violín', 'violin', 'chelo', 'viola'] },
    { slug: 'altavoces', nombre: 'Altavoces', bajada: 'PA, monitores, mesas y microfonía', icono: 'altavoces', tipo: 'equipo', grupo: 'Comprar y alquilar',
      mercado: ['pa_sonido', 'iluminacion', 'recording'], sinonimos: ['pa', 'sonido', 'mesa de mezclas', 'micro', 'monitor'] },
    { slug: 'teclados', nombre: 'Teclados', bajada: 'Pianos, sintes y controladores', icono: 'teclados', tipo: 'equipo', grupo: 'Comprar y alquilar',
      mercado: ['teclados'], sinonimos: ['piano', 'sinte', 'sintetizador'] },
    { slug: 'bateria', nombre: 'Batería', bajada: 'Baterías, cajones y percusión', icono: 'bateria', tipo: 'equipo', grupo: 'Comprar y alquilar',
      mercado: ['bateria'], sinonimos: ['batería', 'cajón', 'percusión'] },
    { slug: 'alquiler', nombre: 'Alquiler', bajada: 'Lo necesitas para un bolo, no para siempre', icono: 'alquiler', tipo: 'equipo', grupo: 'Comprar y alquilar',
      tipoAnuncio: 'alquiler', sinonimos: ['alquilar', 'prestar', 'préstamo'] },
    { slug: 'segunda-mano', nombre: 'Segunda mano', bajada: 'Equipo usado de músicos de verdad', icono: 'segunda-mano', tipo: 'equipo', grupo: 'Comprar y alquilar',
      tipoAnuncio: 'venta', sinonimos: ['usado', 'vender', 'comprar'] },
];

export const categoriaPorSlug = (slug?: string) => CATEGORIAS.find(c => c.slug === slug);
export const iconoCategoria = (c: Categoria) => `/images/categorias/${c.icono}.webp`;

// «Por momento»: entrar por lo que te hace falta hoy (concepto C del sueño)
export interface Momento {
    slug: string;
    titulo: string;
    bajada: string;
    imagen: string;     // objeto 3D sin fondo: se sale de la tarjeta (lo que le gustó del sueño C)
    fondo: string;      // clase del fondo de la tarjeta (color sacado del sueño)
    destino: string;
}

export const MOMENTOS: Momento[] = [
    { slug: 'boda', titulo: 'Tengo una boda', bajada: 'Bandas, violinistas y DJ', imagen: '/images/categorias/momento-boda-3d.webp', fondo: 'bg-[#FDEEB9]', destino: '/explorar/bandas' },
    { slug: 'tecnico-hoy', titulo: 'Bolo esta noche y me falta un técnico', bajada: 'Sonido con técnico, cerca', imagen: '/images/categorias/momento-tecnico-hoy-3d.webp', fondo: 'bg-[#CEE8FD]', destino: '/explorar/tecnicos' },
    { slug: 'cable', titulo: 'Se me ha olvidado el cable', bajada: 'Alquila o compra cerca', imagen: '/images/categorias/momento-cable-3d.webp', fondo: 'bg-[#D8F1DD]', destino: '/explorar/alquiler' },
    { slug: 'banda-sala', titulo: 'Busco banda para mi sala', bajada: 'Publica la fecha y te escriben', imagen: '/images/categorias/momento-banda-sala-3d.webp', fondo: 'bg-[#E0D7FD]', destino: '/publicar' },
    { slug: 'vender', titulo: 'Vendo mi equipo', bajada: 'Publica en un minuto', imagen: '/images/categorias/momento-vender-3d.webp', fondo: 'bg-[#FDD6C8]', destino: '/market/create' },
];
