// Vercel Serverless Function — «Rellénalo con tu web o tu Instagram»
// POST /api/leer-perfil { url }    → lee UNA página pública y propone campos del perfil de artista
// POST /api/leer-perfil { texto }  → lo mismo con la bio que la persona pega a mano
// Respuesta: { ok: true, fuente, modo, propuesta, instagram?, pedirTexto?, aviso? }
//          | { ok: false, error, mensaje, pedirTexto }
//
// No guarda nada (ni la página descargada ni la propuesta): la app enseña la propuesta y la
// persona decide qué poner en su perfil y lo guarda ella. La IA (Kimi, como /api/chat) solo
// redacta con lo que dice la página y todo lo que devuelve se comprueba contra el texto; sin
// clave o si falla, se devuelve lo que sacan las reglas (src/lib/leerPerfil.ts).
//
// Instagram: UNA sola petición a la página pública del perfil, como la vista previa de un
// enlace en WhatsApp, y solo se leen sus metaetiquetas (og:title, og:description). Sin iniciar
// sesión, sin seguir redirecciones, sin publicaciones, sin navegadores automáticos y sin
// reintentos. Si sale la pantalla de login, se pide a la persona que pegue su bio.

import { callKimiWithFallbacks, extraerJson, kimiApiKey } from './_kimi.js';
import { descargarPagina, ErrorDescarga, permitirLocalDesde, type Descarga, type OpcionesDescarga } from './_descargar.js';
import {
  AVISO_INSTAGRAM_LOGIN, AVISO_INSTAGRAM_SIN_BIO, MAX_TEXTO_PEGADO, MENSAJES,
  combinar, comprobarIA, contenidoParaIA, datosDeTexto, esInstagram, extraerDePagina, hayAlgo, leerInstagram,
  limpiarPropuesta, normalizarEnlace, promptPerfil, reglas, textoFuente,
  type CodigoError, type DatosPagina, type ErrorLeerPerfil, type FuenteLectura, type PropuestaPerfil, type RespuestaLeerPerfil,
} from '../src/lib/leerPerfil.js';
import type { RedesArtista } from '../src/types/index.js';

// Descarga (8 s) + IA (15 s) caben de sobra
export const config = { maxDuration: 30 };

const RATE_LIMIT = 10;            // lecturas por IP y minuto
const RATE_WINDOW_MS = 60_000;
const MAX_CUERPO = 16 * 1024;     // la petición: una URL o una bio, nunca más
const TIEMPO_IA_MS = 15_000;
const PERMITIR_LOCAL = permitirLocalDesde(process.env);

type Salida = { estado: number; cuerpo: RespuestaLeerPerfil | ErrorLeerPerfil };

export interface Dependencias {
  descargar: (url: string, op: OpcionesDescarga) => Promise<Descarga>;
  /** null = sin IA (no hay clave) */
  pedirIA: ((d: DatosPagina, fuente: FuenteLectura) => Promise<unknown>) | null;
  permitirLocal: boolean;
}

const fallo = (estado: number, error: CodigoError, propuesta?: PropuestaPerfil): Salida => ({
  estado,
  cuerpo: {
    ok: false, error, mensaje: MENSAJES[error],
    pedirTexto: !['demasiadas_peticiones', 'peticion'].includes(error),
    ...(propuesta && hayAlgo(propuesta) ? { propuesta } : {}),
  },
});

function falloDescarga(err: unknown): Salida {
  const codigo = err instanceof ErrorDescarga ? err.codigo : 'red';
  switch (codigo) {
    case 'url_no_valida': return fallo(400, 'url_no_valida');
    case 'url_bloqueada': return fallo(400, 'url_bloqueada');
    case 'no_html': return fallo(422, 'no_html');
    case 'tiempo': return fallo(504, 'tiempo');
    case 'demasiadas_redirecciones': return fallo(422, 'demasiadas_redirecciones');
    case 'http':
    case 'redireccion': return fallo(422, 'http');
    default: return fallo(502, 'red');
  }
}

/** Reglas siempre; la IA encima si hay clave y texto. Todo pasa por las comprobaciones */
async function proponer(d: DatosPagina, fuente: FuenteLectura, deps: Dependencias, redesExtra?: RedesArtista, instagram?: 'ok'): Promise<Salida> {
  const base = reglas(d, fuente);
  if (redesExtra) base.redes = { ...base.redes, ...redesExtra };
  let propuesta = base;
  let modo: RespuestaLeerPerfil['modo'] = 'reglas';
  if (deps.pedirIA && textoFuente(d).length >= 40) {
    try {
      const json = await deps.pedirIA(d, fuente);
      if (json) {
        const ia = comprobarIA(json, d);
        propuesta = combinar(ia, base);
        if (ia.bio) modo = 'ia';
      }
    } catch (err) {
      // Sin IA no se queda en nada: siguen las reglas
      console.warn('leer-perfil: IA no disponible:', err instanceof Error ? err.name : 'error');
    }
  }
  propuesta = limpiarPropuesta(propuesta);
  if (!hayAlgo(propuesta)) return fallo(422, 'sin_datos');
  return { estado: 200, cuerpo: { ok: true, fuente, modo, propuesta, ...(instagram ? { instagram } : {}) } };
}

async function leerInstagramPublico(url: string, deps: Dependencias): Promise<Salida> {
  const redes: RedesArtista = { instagram: url };
  const sinLeer: Salida = {
    estado: 200,
    cuerpo: { ok: true, fuente: 'instagram', modo: 'reglas', instagram: 'login', pedirTexto: true, aviso: AVISO_INSTAGRAM_LOGIN, propuesta: limpiarPropuesta({ redes }) },
  };
  let desc: Descarga;
  try {
    // Una sola petición: si Instagram redirige (al login), no se sigue
    desc = await deps.descargar(url, { permitirLocal: deps.permitirLocal, maxRedirecciones: 0 });
  } catch {
    return sinLeer;
  }
  return deInstagram(extraerDePagina(desc.html, desc.url), url, deps, sinLeer);
}

async function deInstagram(d: DatosPagina, url: string, deps: Dependencias, sinLeer: Salida): Promise<Salida> {
  const ig = leerInstagram(d);
  const redes: RedesArtista = { instagram: url };
  if (ig.estado === 'login') return sinLeer;
  if (ig.estado === 'sin_bio' || !ig.bio) {
    return {
      estado: 200,
      cuerpo: { ok: true, fuente: 'instagram', modo: 'reglas', instagram: 'sin_bio', pedirTexto: true, aviso: AVISO_INSTAGRAM_SIN_BIO, propuesta: limpiarPropuesta({ nombre: ig.nombre, redes }) },
    };
  }
  // La bio como si fuera una página: el nombre de título y la bio de descripción
  const deLaBio = datosDeTexto(ig.bio);
  const dBio: DatosPagina = { ...deLaBio, url, titulo: ig.nombre || '', meta: { description: ig.bio } };
  return proponer(dBio, 'instagram', deps, redes, 'ok');
}

/** Todo el trabajo, sin req/res (así se prueba): devuelve el estado HTTP y el cuerpo */
export async function leerPerfil(entrada: unknown, deps: Dependencias): Promise<Salida> {
  const e = (entrada && typeof entrada === 'object' && !Array.isArray(entrada) ? entrada : {}) as { url?: unknown; texto?: unknown };

  if (typeof e.texto === 'string' && e.texto.trim()) {
    const texto = e.texto.trim().slice(0, MAX_TEXTO_PEGADO);
    if (texto.length < 20) return fallo(400, 'texto_corto');
    return proponer(datosDeTexto(texto), 'texto', deps);
  }

  if (typeof e.url !== 'string') return fallo(400, 'peticion');
  const enlace = normalizarEnlace(e.url);
  if ('error' in enlace) return fallo(400, 'url_no_valida');
  if (enlace.instagram) return leerInstagramPublico(enlace.url, deps);

  let desc: Descarga;
  try {
    desc = await deps.descargar(enlace.url, { permitirLocal: deps.permitirLocal });
  } catch (err) {
    return falloDescarga(err);
  }
  const d = extraerDePagina(desc.html, desc.url);
  // Un enlace corto que acaba en Instagram: se lee como Instagram (ha sido una sola petición allí)
  if (esInstagram(desc.url)) {
    const perfil = normalizarEnlace(desc.url);
    const url = 'instagram' in perfil && perfil.instagram ? perfil.url : desc.url;
    const sinLeer: Salida = {
      estado: 200,
      cuerpo: { ok: true, fuente: 'instagram', modo: 'reglas', instagram: 'login', pedirTexto: true, aviso: AVISO_INSTAGRAM_LOGIN, propuesta: limpiarPropuesta({ redes: { instagram: url } }) },
    };
    return deInstagram(d, url, deps, sinLeer);
  }
  return proponer(d, 'web', deps);
}

// ─── La IA ──────────────────────────────────────────────────────────────────
async function pedirIAKimi(apiKey: string, d: DatosPagina, fuente: FuenteLectura): Promise<unknown> {
  const messages = [
    { role: 'system', content: promptPerfil() },
    { role: 'user', content: contenidoParaIA(d, fuente) },
  ];
  const { upstream, endpoint, model } = await callKimiWithFallbacks(apiKey, messages, 900, { temperature: 0.2 }, TIEMPO_IA_MS);
  if (!upstream || !upstream.ok) {
    console.error('leer-perfil: Kimi', upstream?.status ?? 'sin respuesta', endpoint.baseUrl, model);
    return null;
  }
  const data = await upstream.json() as { choices?: { message?: { content?: string } }[] };
  return extraerJson(data.choices?.[0]?.message?.content ?? '');
}

// ─── Límites y el handler ───────────────────────────────────────────────────
const rateStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  if (rateStore.size > 500) for (const [k, v] of rateStore) if (v.resetAt <= now) rateStore.delete(k);
  const entry = rateStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, resetAt: now + RATE_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT) return { ok: false, resetAt: entry.resetAt };
  entry.count += 1;
  return { ok: true, resetAt: entry.resetAt };
}

interface Peticion { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown }
interface Respuesta { status(code: number): Respuesta; json(body: unknown): unknown; setHeader(name: string, value: string): unknown }

const cabecera = (req: Peticion, nombre: string) => {
  const v = req.headers?.[nombre];
  return Array.isArray(v) ? v[0] : v;
};

export default async function handler(req: Peticion, res: Respuesta) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json(fallo(405, 'peticion').cuerpo);
  }

  const ip = cabecera(req, 'x-forwarded-for')?.split(',')[0]?.trim() || cabecera(req, 'x-real-ip') || 'desconocida';
  const rl = rateLimit(ip);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))));
    return res.status(429).json(fallo(429, 'demasiadas_peticiones').cuerpo);
  }

  // El cuerpo que entra: una URL o una bio, 16 KB como mucho
  if (Number(cabecera(req, 'content-length') || 0) > MAX_CUERPO) return res.status(413).json(fallo(413, 'peticion').cuerpo);
  let body: unknown;
  try {
    body = req.body;
    if (body instanceof Uint8Array) body = new TextDecoder().decode(body);
    if (typeof body === 'string') {
      if (body.length > MAX_CUERPO) return res.status(413).json(fallo(413, 'peticion').cuerpo);
      body = JSON.parse(body);
    }
    if (JSON.stringify(body ?? null).length > MAX_CUERPO) return res.status(413).json(fallo(413, 'peticion').cuerpo);
  } catch {
    return res.status(400).json(fallo(400, 'peticion').cuerpo);
  }

  try {
    const apiKey = kimiApiKey();
    const r = await leerPerfil(body, {
      descargar: descargarPagina,
      pedirIA: apiKey ? (d, fuente) => pedirIAKimi(apiKey, d, fuente) : null,
      permitirLocal: PERMITIR_LOCAL,
    });
    return res.status(r.estado).json(r.cuerpo);
  } catch (err) {
    // Sin detalles en la respuesta (es pública) ni contenido de la página en el log
    console.error('leer-perfil: error', err instanceof Error ? err.name : 'desconocido');
    return res.status(500).json(fallo(500, 'red').cuerpo);
  }
}
