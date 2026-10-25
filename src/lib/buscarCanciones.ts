// El catálogo de canciones grabadas: la búsqueda de Apple (iTunes Search API, sin clave y con
// CORS abierto). De ahí salen la portada, la duración y la muestra de 30 s. Nunca da letras ni
// acordes: esos los copia la persona de su web de acordes (derechos), y aquí solo se enlazan.

export interface CancionCatalogo {
    id: number;                 // trackId de Apple
    titulo: string;
    artista: string;
    disco: string;
    portada: string;            // URL de la carátula (600 px)
    duracion?: number;          // segundos
    muestra?: string;           // URL de 30 s (m4a)
    genero?: string;
    recopilatorio: boolean;     // disco de varios artistas
}

// Por qué no hay resultados: sin cobertura (en el bolo), Apple pide una pausa (deja unas 20
// búsquedas por minuto y contesta 403) o cualquier otro fallo
export type MotivoFallo = 'sin-conexion' | 'ocupado' | 'fallo';
export class FalloCatalogo extends Error {
    motivo: MotivoFallo;
    constructor(motivo: MotivoFallo) {
        super(motivo);
        this.motivo = motivo;
    }
}
export const motivoDe = (e: unknown): MotivoFallo => (e instanceof FalloCatalogo ? e.motivo : 'fallo');
export const esCancelada = (e: unknown) => (e as { name?: string })?.name === 'AbortError';

const URL_BUSQUEDA = 'https://itunes.apple.com/search';
const ESPERA_MAXIMA = 8000;     // con poca cobertura, mejor rendirse que quedarse colgado

interface ResultadoApple {
    kind?: string;
    trackId: number;
    trackName?: string;
    artistName?: string;
    collectionName?: string;
    collectionArtistName?: string;
    artworkUrl100?: string;
    trackTimeMillis?: number;
    previewUrl?: string;
    primaryGenreName?: string;
}

// La carátula al tamaño que haga falta: Apple la sirve a cualquier tamaño cambiando el
// «100x100bb» del final. Otras URLs se quedan como están
export function tamanoPortada(url: string, px: number): string {
    if (!/\.mzstatic\.com\//.test(url)) return url;
    return url.replace(/\/\d+x\d+(?:bb|cc)?(\.\w+)$/, `/${px}x${px}bb$1`);
}
export const portadaGrande = (url: string) => tamanoPortada(url, 600);

// Lo que se busca muchas veces (al borrar y volver a escribir) no se vuelve a pedir
const memoria = new Map<string, CancionCatalogo[]>();

function convertir(r: ResultadoApple): CancionCatalogo | null {
    if (r.kind && r.kind !== 'song') return null;
    if (!r.trackName || !r.artistName) return null;
    return {
        id: r.trackId,
        titulo: r.trackName,
        artista: r.artistName,
        disco: r.collectionName ?? '',
        portada: r.artworkUrl100 ? portadaGrande(r.artworkUrl100) : '',
        duracion: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : undefined,
        muestra: r.previewUrl || undefined,
        genero: r.primaryGenreName,
        recopilatorio: !!r.collectionArtistName && r.collectionArtistName !== r.artistName,
    };
}

// Busca canciones en el catálogo. Se cancela con `signal` (al seguir escribiendo); sin
// cobertura o con Apple saturado lanza FalloCatalogo
export async function buscarCanciones(termino: string, { signal, limite = 25 }: { signal?: AbortSignal; limite?: number } = {}): Promise<CancionCatalogo[]> {
    const t = termino.trim().replace(/\s+/g, ' ');
    if (t.length < 2) return [];
    const clave = `${limite}:${t.toLowerCase()}`;
    const guardada = memoria.get(clave);
    if (guardada) return guardada;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new FalloCatalogo('sin-conexion');

    // La espera máxima y la cancelación de quien llama, en una sola señal
    const control = new AbortController();
    const cancelar = () => control.abort();
    if (signal?.aborted) control.abort();
    signal?.addEventListener('abort', cancelar);
    let caducada = false;
    const reloj = setTimeout(() => { caducada = true; control.abort(); }, ESPERA_MAXIMA);

    try {
        const url = `${URL_BUSQUEDA}?${new URLSearchParams({ term: t, entity: 'song', limit: String(limite), country: 'es' })}`;
        let res: Response;
        try {
            res = await fetch(url, { signal: control.signal });
        } catch (e) {
            if (signal?.aborted) throw e;                       // la canceló quien llama
            throw new FalloCatalogo(caducada || esCancelada(e) || navigator.onLine === false ? 'sin-conexion' : 'fallo');
        }
        if (res.status === 403 || res.status === 429) throw new FalloCatalogo('ocupado');
        if (!res.ok) throw new FalloCatalogo('fallo');
        const datos = (await res.json()) as { results?: ResultadoApple[] };
        const vistas = new Set<number>();
        const lista = (datos.results ?? []).map(convertir).filter((c): c is CancionCatalogo => {
            if (!c || vistas.has(c.id)) return false;
            vistas.add(c.id);
            return true;
        });
        if (memoria.size > 60) memoria.delete(memoria.keys().next().value!);
        memoria.set(clave, lista);
        return lista;
    } finally {
        clearTimeout(reloj);
        signal?.removeEventListener('abort', cancelar);
    }
}

// ---- ¿Es la misma canción? ----

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const VERSION = /\b(remaster\w*|remasteriza\w*|live|en directo|directo|en vivo|vivo|version|edit|mono|stereo|estereo|acustic\w*|acoustic|unplugged|demo|bonus|instrumental|karaoke|mix|remix)\b/;

// «Bamboléo (Remastered 2011)», «La Flaca - Versión 50 Palos» → «bamboleo», «la flaca»
export function claveTitulo(titulo: string): string {
    let t = sinAcentos(titulo)
        .replace(/\s*[([{][^)\]}]*[)\]}]/g, ' ')            // todo lo que va entre paréntesis
        .replace(/\s+(?:feat\.?|ft\.?)\s.*$/, ' ');
    // «Título - 2013 Remaster»: el guion solo corta si lo de detrás es una versión
    const guion = /\s[-–—]\s(.*)$/.exec(t);
    if (guion && VERSION.test(guion[1])) t = t.slice(0, guion.index);
    return t.replace(/&/g, ' y ').replace(/[^a-z0-9ñ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Los artistas por separado: «Rosalía & Ozuna», «Juanes feat. X», «Los Chichos» → rosalia, ozuna…
function claveArtistas(artista: string): string[] {
    return sinAcentos(artista)
        .split(/\s*(?:,|&|\+|\/|;|\bfeat\.?|\bft\.?|\bwith\b|\bvs\.?|\sy\s|\sand\s|\sx\s)\s*/)
        .map(a => a.replace(/^(?:the|los|las|el|la|les|els)\s+/, '').replace(/[^a-z0-9ñ]+/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
}

// El mismo título y uno de los artistas en común (el principal de uno de los dos)
export function mismaCancion(a: { titulo: string; artista: string }, b: { titulo: string; artista: string }): boolean {
    const ta = claveTitulo(a.titulo), tb = claveTitulo(b.titulo);
    if (!ta || ta !== tb) return false;
    const aa = claveArtistas(a.artista), ab = claveArtistas(b.artista);
    if (!aa.length || !ab.length) return false;
    return ab.includes(aa[0]) || aa.includes(ab[0]);
}

// Para guardarla: «Bamboléo (Remastered 2011)» → «Bamboléo», «Tema (feat. X)» → «Tema»
export function tituloLimpio(titulo: string): string {
    const limpio = titulo
        .replace(/\s*[([][^)\]]*\b(?:remaster\w*|remasteriza\w*|feat\.?|ft\.)[^)\]]*[)\]]/gi, '')
        .replace(/\s+[-–—]\s+[^-–—]*\b(?:remaster\w*|remasteriza\w*)\b.*$/i, '')
        .trim();
    return limpio || titulo.trim();
}

// Fichas de setlist que no son una canción grabada: «Mix Pop en Sol: …», «Tema A → Tema B»
export const esMezcla = (titulo: string) => /^\s*mix\b/i.test(titulo) || /→|->/.test(titulo);

// Se puede buscar su portada con confianza: tiene artista y no es una mezcla
export const admitePortada = (c: { titulo: string; artista: string }) => !!c.artista.trim() && !!claveTitulo(c.titulo) && !esMezcla(c.titulo);

// Entre las que coinciden, la de su disco y en estudio (no el directo, ni el karaoke, ni el
// recopilatorio de verano), que es la que tiene la portada que la gente reconoce
function puntos(c: CancionCatalogo, buscada: { titulo: string }): number {
    const quiere = sinAcentos(buscada.titulo);
    const lleva = sinAcentos(`${c.titulo} ${c.disco}`);
    let p = 0;
    if (sinAcentos(c.titulo).trim() === quiere.trim()) p += 1;
    if (!c.recopilatorio) p += 2;
    for (const marca of ['live', 'directo', 'en vivo', 'karaoke', 'instrumental', 'remix', 'mix', 'acustic', 'acoustic', 'tribute', 'tributo']) {
        if (lleva.includes(marca) && !quiere.includes(marca)) p -= 3;
    }
    if (/greatest hits|grandes exitos|best of|lo mejor de|antologia/.test(sinAcentos(c.disco))) p -= 1;
    return p;
}

// La grabación de una canción del cancionero, o null si no hay una que coincida de verdad
// (título y artista). Puede lanzar FalloCatalogo (sin cobertura, Apple saturado)
export async function portadaDe(titulo: string, artista: string, { signal }: { signal?: AbortSignal } = {}): Promise<CancionCatalogo | null> {
    const buscada = { titulo, artista };
    if (!admitePortada(buscada)) return null;
    const termino = `${titulo.replace(/\s*[([][^)\]]*[)\]]/g, ' ')} ${artista}`.replace(/\s+/g, ' ').trim();
    const resultados = await buscarCanciones(termino, { signal, limite: 15 });
    let mejor: CancionCatalogo | null = null;
    let maximo = -Infinity;
    for (const c of resultados) {
        if (!c.portada || !mismaCancion(buscada, c)) continue;
        const p = puntos(c, buscada);
        if (p > maximo) { mejor = c; maximo = p; }
    }
    return mejor;
}

// ---- Dónde buscar los acordes y la letra (se abre aparte; luego se copia y se pega) ----
// LaCuerda no va: pone `user-select: none` en la canción y en el móvil no deja copiarla

export interface EnlaceBusqueda { nombre: string; url: string }

const google = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export function enlacesAcordes(titulo: string, artista: string): EnlaceBusqueda[] {
    const q = `${titulo} ${artista}`.replace(/\s+/g, ' ').trim();
    return [
        { nombre: 'Ultimate Guitar', url: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(q)}` },
        { nombre: 'Cifra Club', url: google(`${q} site:cifraclub.com`) },
        { nombre: 'Google', url: google(`${q} acordes`) },
        // Saca los acordes de la grabación (no son texto para copiar: se miran tocando). Con su
        // app instalada, el enlace la abre
        { nombre: 'Chordify', url: google(`${q} site:chordify.net`) },
    ];
}

export const enlaceLetra = (titulo: string, artista: string): EnlaceBusqueda =>
    ({ nombre: 'Letra', url: google(`${titulo} ${artista} letra`.replace(/\s+/g, ' ').trim()) });

// 3:25
export const duracionTexto = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '');
