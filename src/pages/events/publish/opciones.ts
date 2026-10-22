// Lo que se elige al publicar un bolo. La necesidad se guarda como etiqueta del evento
// (`tags`, el mismo campo que antes llenaba «¿Qué estás buscando?») y el tipo en `type`.
import { OBJETO_3D } from '../../../config/objetos3d';

export const NECESIDADES = [
    { etiqueta: 'Banda', imagen: OBJETO_3D.banda },
    { etiqueta: 'Cantante', imagen: OBJETO_3D.cantante },
    { etiqueta: 'DJ', imagen: OBJETO_3D.dj },
    { etiqueta: 'Música para ceremonia', imagen: OBJETO_3D.violinista },
    { etiqueta: 'Técnico de sonido', imagen: OBJETO_3D.mesa },
    { etiqueta: 'Sonido y luces', imagen: OBJETO_3D.escenario },
] as const;

// Las que había antes y no tienen tesela: detrás de «Más opciones»
export const OTRAS_NECESIDADES = ['Solista', 'Mariachi', 'Jazz Trío', 'Orquesta', 'Otro'];

export const TODAS_NECESIDADES: string[] = [...NECESIDADES.map(n => n.etiqueta), ...OTRAS_NECESIDADES];

// `valor` es lo que se guarda (los mismos que el desplegable de antes); `texto`, lo que se lee
export const TIPOS_EVENTO = [
    { valor: 'Boda / Social', texto: 'Boda o fiesta', frase: 'para boda' },
    { valor: 'Evento Privado', texto: 'Evento privado', frase: 'para evento privado' },
    { valor: 'Residencia / Bar', texto: 'Bar o residencia', frase: 'para bar' },
    { valor: 'Festival', texto: 'Festival', frase: 'para festival' },
    { valor: 'Otro', texto: 'Otro', frase: '' },
];

// Los tipos que puede traer un borrador de Rodrigo y no están arriba
export const TIPOS_RODRIGO: Record<string, string> = { gig: 'Bolo', jam: 'Jam', session: 'Sesión', festival: 'Festival' };

export const CIUDADES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Girona'];

export const ETIQUETA_NEGOCIABLE = 'Negociable';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** El tipo de un borrador de Rodrigo, llevado a uno de los de la lista si se parece */
export function tipoDesdeBorrador(t?: string): string {
    if (!t) return '';
    const n = norm(t);
    const igual = TIPOS_EVENTO.find(x => norm(x.valor) === n || norm(x.texto) === n);
    if (igual) return igual.valor;
    if (/boda|social|ceremonia/.test(n)) return 'Boda / Social';
    if (/privad|empresa/.test(n)) return 'Evento Privado';
    if (/\bbar\b|residencia/.test(n)) return 'Residencia / Bar';
    if (/festival/.test(n)) return 'Festival';
    return t;
}

// Por orden: la primera que case decide
const PISTAS: [string, RegExp][] = [
    ['Técnico de sonido', /tecnic/],
    ['Sonido y luces', /luces|iluminacion/],
    ['DJ', /\bdj\b|deejay/],
    ['Mariachi', /mariachi/],
    ['Orquesta', /orquesta/],
    ['Música para ceremonia', /ceremonia|violin|cuarteto|iglesia/],
    ['Cantante', /cantante|\bvoz\b/],
    ['Banda', /banda|grupo/],
];

/** Lo que pide un borrador de Rodrigo: por sus etiquetas y, si no, por lo que dice */
export function necesidadDesdeBorrador(etiquetas: string[], texto: string): string | undefined {
    const exacta = TODAS_NECESIDADES.find(n => etiquetas.some(e => norm(e) === norm(n)));
    if (exacta) return exacta;
    const n = norm(texto);
    return PISTAS.find(([, re]) => re.test(n))?.[0];
}

/** «Banda para boda en Sitges»: el título que sale de lo ya elegido */
export function tituloSugerido(necesidad: string | undefined, tipo: string, lugar: string): string {
    if (!necesidad || necesidad === 'Otro') return '';
    const frase = necesidad.includes(' para ') ? '' : (TIPOS_EVENTO.find(t => t.valor === tipo)?.frase ?? '');
    const ciudad = lugar.split(',')[0].trim();
    return [necesidad, frase, ciudad && `en ${ciudad}`].filter(Boolean).join(' ');
}

/** 1500 → «1.500» (es-ES no agrupa los de cuatro cifras) */
export const miles = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** «2026-10-25» → fecha a mediodía, para que la zona horaria no la mueva de día */
export const fechaLocal = (iso: string) => new Date(`${iso}T12:00:00`);

/** El campo de la casa: relleno suave, 52 de alto, esquinas de 14 */
export const CAMPO = 'w-full h-[52px] rounded-[14px] bg-fill px-4 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10';
