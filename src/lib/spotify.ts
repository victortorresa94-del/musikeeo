// Spotify (13-nov, Víctor: «habría que poner el link de Spotify para poder ir a escucharlas… e
// incluso sería la puta polla un botón de "crear playlist con este repertorio"»). Sin React.
//
// - Escuchar: el enlace de la canción en Spotify si ya se sabe (`cancion.spotify`) o su búsqueda,
//   que en el móvil abre la app. No hace falta nada configurado.
// - Crear la playlist: la Web API de Spotify con PKCE (sin secreto ni servidor; todo desde el
//   navegador). Hace falta una app de Spotify y su Client ID en VITE_SPOTIFY_CLIENT_ID, con la
//   dirección de vuelta https://www.musikeeo.com/spotify. El pedido (nombre y canciones) viaja en el
//   `state`, así la página de vuelta lo puede hacer sola aunque se abra en otra ventana (la app
//   instalada del iPhone abre Spotify fuera de ella y no ve lo guardado en la app).
import { codificar, descomprimir } from './compartir';
import { esAppInstalada } from './directo';
import type { Cancion } from '../types/cancionero';

const CLIENT_ID = ((import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined) ?? '').trim();
export const spotifyListo = () => !!CLIENT_ID;
export const direccionDeVuelta = () => `${window.location.origin}/spotify`;
const CLAVE_TOKEN = 'musikeeo-spotify-v1';
const CLAVE_VERIFICADOR = 'musikeeo-spotify-verificador';
const PERMISOS = 'playlist-modify-private playlist-modify-public';

// Lo que se busca de una canción: un mix («MIX Bad Bunny (Baile Inolvidable × Nuevayol)», «Mix: A + B»)
// son varias; lo que va entre paréntesis en una canción suelta («(Remastered)», «(en directo)») sobra
export function piezasDe(c: Pick<Cancion, 'titulo' | 'artista'>): { titulo: string; artista: string }[] {
    const artista = (c.artista ?? '').trim();
    const t = c.titulo.trim();
    const esMix = /^mix\b|[×+]|\s\/\s/i.test(t);
    if (esMix) {
        const dentro = /\(([^)]+)\)/.exec(t)?.[1] ?? t.replace(/^mix\s*:?\s*/i, '');
        const delante = /^mix\s+([^(:]+)\(/i.exec(t)?.[1]?.trim();
        const piezas = dentro.split(/\s*(?:×|\+|\s\/\s|,)\s*/).map(x => x.trim()).filter(x => x.length > 1);
        if (piezas.length > 1) return piezas.slice(0, 6).map(p => ({ titulo: p, artista: delante || artista }));
    }
    return [{ titulo: t.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\[[^\]]*\]\s*/g, ' ').trim() || t, artista }];
}

// Escuchar en Spotify: la canción exacta si ya se sabe; si no, su búsqueda
export function enlaceEscuchar(c: Pick<Cancion, 'titulo' | 'artista' | 'spotify'>): string {
    if (c.spotify && /^https:\/\/open\.spotify\.com\//.test(c.spotify)) return c.spotify;
    const p = piezasDe(c)[0];
    return `https://open.spotify.com/search/${encodeURIComponent([p.titulo, p.artista].filter(Boolean).join(' '))}`;
}

// ---- Para cualquiera, sin la app de Spotify ----
// Spotify solo deja 5 cuentas a una app pequeña como Musikeeo (desde febrero de 2026; abrirla a
// todos pide ser empresa con ~250.000 usuarios al mes). Para que cualquiera haga la playlist en
// SU Spotify: se copia la lista («Título - Artista», una por línea; un mix, cada canción) y se abre
// TuneMyMusic (el mismo servicio que usa Spotify para importar), que la crea en su cuenta
export const TUNEMYMUSIC = 'https://www.tunemymusic.com/es/transfer/freetext-to-spotify';
export const listaEnTexto = (canciones: Pick<Cancion, 'titulo' | 'artista'>[]) =>
    canciones.flatMap(c => piezasDe(c)).map(p => [p.titulo, p.artista].filter(Boolean).join(' - ')).join('\n');

// ---- La sesión de Spotify (PKCE) ----
interface Token { acceso: string; refresco?: string; caduca: number }
const leerToken = (): Token | null => { try { return JSON.parse(localStorage.getItem(CLAVE_TOKEN) || 'null'); } catch { return null; } };
const guardarToken = (t: Token) => { try { localStorage.setItem(CLAVE_TOKEN, JSON.stringify(t)); } catch { /* sin almacenamiento */ } };

const aBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const aleatorio = (n: number) => aBase64Url(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async (s: string) => aBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));

async function pedirToken(cuerpo: Record<string, string>): Promise<Token> {
    const r = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, ...cuerpo }),
    });
    if (!r.ok) {
        const motivo = await r.json().then((j: { error_description?: string; error?: string }) => j?.error_description || j?.error).catch(() => undefined);
        throw new Error(`Spotify no ha dado permiso${motivo ? ` (${motivo})` : ''}. Prueba otra vez.`);
    }
    const j = await r.json() as { access_token: string; refresh_token?: string; expires_in: number };
    const viejo = leerToken();
    const t: Token = { acceso: j.access_token, refresco: j.refresh_token ?? viejo?.refresco, caduca: Date.now() + (j.expires_in - 60) * 1000 };
    guardarToken(t);
    return t;
}

// Un token que sirve ahora (lo renueva si ha caducado); null si hay que volver a entrar
export async function tokenVivo(): Promise<string | null> {
    const t = leerToken();
    if (!t) return null;
    if (Date.now() < t.caduca) return t.acceso;
    if (!t.refresco) return null;
    try { return (await pedirToken({ grant_type: 'refresh_token', refresh_token: t.refresco })).acceso; } catch { return null; }
}

// ---- El pedido: la playlist que hay que hacer ----
export interface Pedido {
    v: 1;
    n: string;                                  // nombre de la playlist
    c: { i?: string; t: string; a: string }[];  // canciones: id en el cancionero, título, artista
    r?: string;                                 // el repertorio, para apuntarle la playlist
    volver: string;                             // a dónde volver en Musikeeo
    k?: string;                                 // el verificador, solo si la vuelta no puede leerlo
}

export async function irASpotify(pedido: Omit<Pedido, 'v' | 'k'>) {
    const verificador = aleatorio(48);
    try { localStorage.setItem(CLAVE_VERIFICADOR, verificador); } catch { /* sin almacenamiento */ }
    // En la app instalada del iPhone, Spotify se abre en una ventana aparte que no ve lo guardado
    // en la app: el verificador va con el pedido (la vuelta es a nuestra propia dirección)
    const aparte = esAppInstalada() && /iPhone|iPad|iPod/.test(navigator.userAgent);
    const state = codificar({ v: 1, ...pedido, ...(aparte ? { k: verificador } : {}) });
    const url = new URL('https://accounts.spotify.com/authorize');
    url.search = new URLSearchParams({
        client_id: CLIENT_ID, response_type: 'code', redirect_uri: direccionDeVuelta(), scope: PERMISOS,
        code_challenge_method: 'S256', code_challenge: await sha256(verificador), state,
    }).toString();
    window.location.assign(url.toString());
}

// La vuelta de Spotify (/spotify?code=…&state=…): entra y devuelve el pedido
export async function vueltaDeSpotify(params: URLSearchParams): Promise<Pedido> {
    if (params.get('error')) throw new Error(params.get('error') === 'access_denied' ? 'No le diste permiso a Musikeeo en Spotify.' : 'Spotify ha dado un error. Prueba otra vez.');
    const pedido = descomprimir(params.get('state') ?? '') as Pedido | null;
    if (!pedido || pedido.v !== 1 || !Array.isArray(pedido.c)) throw new Error('El enlace de vuelta de Spotify llegó cortado. Prueba otra vez desde el repertorio.');
    let verificador = '';
    try { verificador = localStorage.getItem(CLAVE_VERIFICADOR) ?? ''; } catch { /* */ }
    verificador ||= pedido.k ?? '';
    const code = params.get('code');
    if (!verificador || !code) throw new Error('Vuelve al repertorio y pulsa otra vez «Crear playlist».');
    await pedirToken({ grant_type: 'authorization_code', code, redirect_uri: direccionDeVuelta(), code_verifier: verificador });
    try { localStorage.removeItem(CLAVE_VERIFICADOR); } catch { /* */ }
    return pedido;
}

export const pedidoDe = (nombre: string, canciones: Cancion[], volver: string, repertorioId?: string): Omit<Pedido, 'v' | 'k'> => ({
    n: nombre.slice(0, 100), c: canciones.slice(0, 200).map(c => ({ i: c.id, t: c.titulo, a: c.artista ?? '' })), volver, ...(repertorioId ? { r: repertorioId } : {}),
});

export interface Resultado { url: string; total: number; enlaces: Record<string, string>; faltan: string[] }

// Busca cada canción y crea la playlist (privada). `enlaces`: id de la canción → su pista en Spotify
export async function crearPlaylist(pedido: Pick<Pedido, 'n' | 'c'>, alAvanzar?: (hechas: number, total: number) => void): Promise<Resultado> {
    const token = await tokenVivo();
    if (!token) throw new Error('SIN_SESION');
    const api = async <T>(ruta: string, opciones: RequestInit = {}, intento = 0): Promise<T> => {
        const r = await fetch(`https://api.spotify.com/v1${ruta}`, { ...opciones, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        if (r.status === 401) throw new Error('SIN_SESION');
        // Si se le pide mucho, Spotify dice cuánto esperar
        if (r.status === 429 && intento < 3) {
            await new Promise(f => setTimeout(f, (Number(r.headers.get('Retry-After')) || 2) * 1000));
            return api<T>(ruta, opciones, intento + 1);
        }
        if (r.status === 403) throw new Error('Spotify no deja a esta cuenta usar Musikeeo: tiene que estar en «User Management» de la app de Spotify (máximo 5) y quien creó la app necesita Spotify Premium.');
        if (!r.ok) {
            const motivo = await r.json().then((j: { error?: { message?: string } }) => j?.error?.message).catch(() => undefined);
            throw new Error(`Spotify no ha contestado bien (${r.status}${motivo ? `: ${motivo}` : ''}). Prueba otra vez.`);
        }
        return (r.status === 204 ? null : await r.json()) as T;
    };
    type Pista = { uri: string; external_urls: { spotify: string } };
    const buscar = async (titulo: string, artista: string): Promise<Pista | null> => {
        const consulta = async (q: string) => (await api<{ tracks: { items: Pista[] } }>(`/search?type=track&limit=1&market=from_token&q=${encodeURIComponent(q)}`)).tracks.items[0] ?? null;
        return (artista && await consulta(`track:${titulo} artist:${artista}`)) || await consulta([titulo, artista].filter(Boolean).join(' '));
    };
    const uris: string[] = [];
    const enlaces: Record<string, string> = {};
    const faltan: string[] = [];
    for (let i = 0; i < pedido.c.length; i++) {
        const c = pedido.c[i];
        let alguna = false;
        for (const p of piezasDe({ titulo: c.t, artista: c.a })) {
            const pista = await buscar(p.titulo, p.artista);
            if (!pista) continue;
            alguna = true;
            if (!uris.includes(pista.uri)) uris.push(pista.uri);
            if (c.i && !enlaces[c.i]) enlaces[c.i] = pista.external_urls.spotify;
        }
        if (!alguna) faltan.push(c.t);
        alAvanzar?.(i + 1, pedido.c.length);
    }
    // Desde febrero de 2026 Spotify quitó /users/{id}/playlists y /playlists/{id}/tracks a las apps
    // en modo desarrollo: ahora son /me/playlists y /playlists/{id}/items. Pública, para que los
    // músicos la abran con el enlace (ellos no conectan Spotify: solo caben 5 cuentas)
    const lista = await api<{ id: string; external_urls: { spotify: string } }>('/me/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: pedido.n, description: 'Hecha con el Cancionero de Musikeeo', public: true }),
    });
    for (let i = 0; i < uris.length; i += 100) {
        await api(`/playlists/${lista.id}/items`, { method: 'POST', body: JSON.stringify({ uris: uris.slice(i, i + 100) }) });
    }
    return { url: lista.external_urls.spotify, total: uris.length, enlaces, faltan };
}
