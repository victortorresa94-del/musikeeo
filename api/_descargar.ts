// Descarga segura de UNA página pública cuya dirección manda el usuario (/api/leer-perfil).
// Vercel no publica como ruta los archivos de /api que empiezan por «_».
//
// Contra SSRF (que nos usen para leer cosas de dentro de la nube):
// - solo http y https, sin usuario:contraseña, puertos web y URL de 2048 caracteres como mucho;
// - nombres internos fuera (localhost, *.local, *.internal…) y cualquier IP privada, de loopback,
//   link-local (169.254.x.x, el metadata de la nube), 0.0.0.0, multicast, reservada o ::1;
// - el DNS se resuelve en NUESTRO lookup y la conexión va a la misma IP comprobada: un DNS que
//   cambia de respuesta entre la comprobación y la conexión (DNS rebinding) no cuela;
// - como mucho 3 redirecciones, cada una comprobada igual; 8 s en total; 1,5 MB; solo text/html.
// Para las pruebas en local hay un interruptor que permite 127.0.0.1/localhost/::1 (y nada más):
// LEER_PERFIL_PERMITIR_LOCAL=1, que se ignora en Vercel y con NODE_ENV=production.

import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import type { Readable } from 'node:stream';
import zlib from 'node:zlib';

export const USER_AGENT = 'MusikeeoBot/1.0 (+https://musikeeo.com)';
export const TIEMPO_MAX_MS = 8000;
export const BYTES_MAX = 1.5 * 1024 * 1024;
export const REDIRECCIONES_MAX = 3;
export const URL_MAX = 2048;
const PUERTOS_WEB = new Set(['', '80', '443', '8080', '8443']);

export type CodigoDescarga =
  | 'url_no_valida' | 'url_bloqueada' | 'no_html' | 'tiempo' | 'http' | 'red'
  | 'demasiadas_redirecciones' | 'redireccion';

export class ErrorDescarga extends Error {
  codigo: CodigoDescarga;
  estado?: number;
  destino?: string;
  constructor(codigo: CodigoDescarga, mensaje: string, estado?: number, destino?: string) {
    super(mensaje);
    this.name = 'ErrorDescarga';
    this.codigo = codigo;
    this.estado = estado;
    this.destino = destino;
  }
}

/** El interruptor de pruebas: solo con la variable puesta y fuera de Vercel y de producción */
export function permitirLocalDesde(env: Record<string, string | undefined>): boolean {
  return env.LEER_PERFIL_PERMITIR_LOCAL === '1' && !env.VERCEL && !env.VERCEL_ENV && env.NODE_ENV !== 'production';
}

// ─── IPs ────────────────────────────────────────────────────────────────────
const v4ANumero = (ip: string) => ip.split('.').reduce((n, p) => ((n << 8) | Number(p)) >>> 0, 0);

// [red, bits]: todo lo que no es internet pública (RFC 6890 y compañía)
const RANGOS_V4: [string, number][] = [
  ['0.0.0.0', 8],        // «esta red», 0.0.0.0
  ['10.0.0.0', 8],       // privada
  ['100.64.0.0', 10],    // CGNAT
  ['127.0.0.0', 8],      // loopback
  ['169.254.0.0', 16],   // link-local: el metadata de la nube (169.254.169.254)
  ['172.16.0.0', 12],    // privada
  ['192.0.0.0', 24],     // IETF
  ['192.0.2.0', 24],     // documentación
  ['192.88.99.0', 24],   // relay 6to4
  ['192.168.0.0', 16],   // privada
  ['198.18.0.0', 15],    // pruebas de rendimiento
  ['198.51.100.0', 24],  // documentación
  ['203.0.113.0', 24],   // documentación
  ['224.0.0.0', 4],      // multicast
  ['240.0.0.0', 4],      // reservada y 255.255.255.255
];
const RANGOS_V4_NUM = RANGOS_V4.map(([red, bits]) => [v4ANumero(red), bits] as const);

function v4Bloqueada(ip: string, permitirLocal: boolean): boolean {
  const n = v4ANumero(ip);
  if (permitirLocal && n >>> 24 === 127) return false;
  return RANGOS_V4_NUM.some(([red, bits]) => ((n ^ red) >>> (32 - bits)) === 0);
}

/** «::ffff:1.2.3.4», «fe80::1%eth0»… → 8 bloques de 16 bits (o null si no es válida) */
function v6ABloques(ip: string): number[] | null {
  let s = ip.toLowerCase();
  const zona = s.indexOf('%');
  if (zona >= 0) s = s.slice(0, zona);
  const v4 = s.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) {
    if (isIP(v4[2]) !== 4) return null;
    const n = v4ANumero(v4[2]);
    s = `${v4[1]}${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const dobles = s.split('::');
  if (dobles.length > 2) return null;
  const parte = (x: string) => (x ? x.split(':') : []);
  const izq = parte(dobles[0]);
  const der = dobles.length === 2 ? parte(dobles[1]) : [];
  const faltan = 8 - izq.length - der.length;
  if (dobles.length === 1 ? izq.length !== 8 : faltan < 1) return null;
  const todos = [...izq, ...Array(dobles.length === 2 ? faltan : 0).fill('0'), ...der];
  if (todos.length !== 8 || todos.some(b => !/^[0-9a-f]{1,4}$/.test(b))) return null;
  return todos.map(b => parseInt(b, 16));
}

function v6Bloqueada(ip: string, permitirLocal: boolean): boolean {
  const b = v6ABloques(ip);
  if (!b) return true;
  const ceros = (desde: number, hasta: number) => b.slice(desde, hasta).every(x => x === 0);
  const v4De = () => `${b[6] >>> 8}.${b[6] & 255}.${b[7] >>> 8}.${b[7] & 255}`;
  if (ceros(0, 8)) return true;                                   // ::
  if (ceros(0, 7) && b[7] === 1) return !permitirLocal;           // ::1
  if (ceros(0, 5) && (b[5] === 0xffff || b[5] === 0)) return v4Bloqueada(v4De(), permitirLocal); // ::ffff:a.b.c.d
  if (b[0] === 0x64 && b[1] === 0xff9b && ceros(2, 6)) return v4Bloqueada(v4De(), permitirLocal); // NAT64
  if ((b[0] & 0xe000) !== 0x2000) return true;                     // solo unicast global 2000::/3
  if (b[0] === 0x2001 && (b[1] === 0 || b[1] === 0x0db8 || (b[1] & 0xfff0) === 0x0010)) return true; // Teredo, documentación, ORCHID
  if (b[0] === 0x2002) return true;                                // 6to4 (lleva una IPv4 dentro)
  return false;
}

/** ¿Es una IP a la que no se puede ir? (lo que no es una IP, también fuera) */
export function ipBloqueada(ip: string, permitirLocal = false): boolean {
  const tipo = isIP(ip);
  if (tipo === 4) return v4Bloqueada(ip, permitirLocal);
  if (tipo === 6) return v6Bloqueada(ip, permitirLocal);
  return true;
}

// ─── La URL ─────────────────────────────────────────────────────────────────
const NOMBRES_INTERNOS = /(^|\.)(localhost|local|localdomain|internal|intranet|lan|home|corp|home\.arpa)$/i;
const esLocal = (host: string) => host === 'localhost' || host.endsWith('.localhost');

/** Comprueba una URL antes de pedirla (y cada redirección). Devuelve la URL o lanza ErrorDescarga */
export function validarUrl(raw: string, permitirLocal = false): URL {
  if (typeof raw !== 'string' || !raw || raw.length > URL_MAX) throw new ErrorDescarga('url_no_valida', 'URL vacía o demasiado larga');
  let u: URL;
  try { u = new URL(raw); } catch { throw new ErrorDescarga('url_no_valida', 'URL mal formada'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new ErrorDescarga('url_no_valida', `Esquema no permitido: ${u.protocol}`);
  if (u.username || u.password) throw new ErrorDescarga('url_no_valida', 'URL con usuario o contraseña');
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (!host) throw new ErrorDescarga('url_no_valida', 'URL sin servidor');
  const local = permitirLocal && (esLocal(host) || (isIP(host) > 0 && !ipBloqueada(host, true) && ipBloqueada(host, false)));
  if (!local && NOMBRES_INTERNOS.test(host)) throw new ErrorDescarga('url_bloqueada', `Nombre interno: ${host}`);
  // En pruebas el servidor local va en cualquier puerto (las IPs siguen comprobándose igual)
  if (!permitirLocal && !PUERTOS_WEB.has(u.port)) throw new ErrorDescarga('url_bloqueada', `Puerto no permitido: ${u.port}`);
  if (isIP(host) && ipBloqueada(host, permitirLocal)) throw new ErrorDescarga('url_bloqueada', `IP no permitida: ${host}`);
  return u;
}

// ─── DNS ────────────────────────────────────────────────────────────────────
export type Resolver = (host: string) => Promise<LookupAddress[]>;

const resolverDns: Resolver = host => new Promise((resolve, reject) => {
  dnsLookup(host, { all: true, verbatim: true }, (err, direcciones) => (err ? reject(err) : resolve(direcciones)));
});

type Llamada = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/**
 * El lookup que usa la conexión: resuelve, rechaza el nombre entero si ALGUNA de sus IPs está
 * bloqueada y entrega a la conexión exactamente las IPs comprobadas.
 */
export function lookupSeguro(resolver: Resolver, permitirLocal: boolean) {
  return (hostname: string, options: LookupOptions, callback: Llamada) => {
    resolver(hostname).then(direcciones => {
      if (!direcciones.length) throw Object.assign(new Error(`Sin DNS para ${hostname}`), { code: 'ENOTFOUND' });
      const mala = direcciones.find(d => ipBloqueada(d.address, permitirLocal));
      if (mala) throw new ErrorDescarga('url_bloqueada', `${hostname} apunta a una IP no permitida (${mala.address})`);
      const familia = options?.family === 4 || options?.family === 6 ? direcciones.filter(d => d.family === options.family) : direcciones;
      const lista = familia.length ? familia : direcciones;
      if (options?.all) callback(null, lista);
      else callback(null, lista[0].address, lista[0].family);
    }).catch((err: NodeJS.ErrnoException) => callback(err, '', 0));
  };
}

// ─── La petición ────────────────────────────────────────────────────────────
export interface Descarga {
  url: string;           // la URL final (tras las redirecciones)
  html: string;
  estado: number;
  tipo: string;
  bytes: number;
  truncada: boolean;     // se dejó de leer al llegar al tope
  redirecciones: string[];
}

export interface OpcionesDescarga {
  permitirLocal?: boolean;
  maxRedirecciones?: number;
  tiempoMs?: number;
  maxBytes?: number;
  resolver?: Resolver;
}

function charsetDe(tipo: string, cuerpo: Buffer): string {
  const deCabecera = tipo.match(/charset\s*=\s*["']?([\w.:-]+)/i);
  if (deCabecera) return deCabecera[1].toLowerCase();
  const cabeza = cuerpo.subarray(0, 4096).toString('latin1');
  const deMeta = cabeza.match(/<meta[^>]{0,200}?charset\s*=\s*["']?([\w.:-]+)/i);
  return deMeta ? deMeta[1].toLowerCase() : 'utf-8';
}

function decodificarCuerpo(cuerpo: Buffer, tipo: string): string {
  try { return new TextDecoder(charsetDe(tipo, cuerpo)).decode(cuerpo); } catch { return new TextDecoder('utf-8').decode(cuerpo); }
}

type Resultado = { redirige: string; estado: number } | { descarga: Omit<Descarga, 'url' | 'redirecciones'> };

function pedir(u: URL, lookup: ReturnType<typeof lookupSeguro>, signal: AbortSignal, maxBytes: number): Promise<Resultado> {
  return new Promise((resolve, reject) => {
    let hecho = false;
    const fallar = (e: unknown) => { if (!hecho) { hecho = true; reject(e); } };
    const host = u.hostname.replace(/^\[|\]$/g, '');
    const modulo = u.protocol === 'https:' ? https : http;
    const req = modulo.request({
      protocol: u.protocol,
      hostname: host,
      port: u.port || undefined,
      path: `${u.pathname}${u.search}`,
      method: 'GET',
      agent: false,
      lookup,
      signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    }, res => {
      const estado = res.statusCode || 0;
      if (estado >= 300 && estado < 400 && res.headers.location) {
        res.resume();
        hecho = true;
        resolve({ redirige: String(res.headers.location), estado });
        req.destroy();
        return;
      }
      if (estado < 200 || estado >= 300) { res.resume(); fallar(new ErrorDescarga('http', `HTTP ${estado}`, estado)); req.destroy(); return; }
      const tipo = String(res.headers['content-type'] || '').toLowerCase();
      if (!/^text\/html\b/.test(tipo)) { fallar(new ErrorDescarga('no_html', `Tipo ${tipo || '(ninguno)'}`, estado)); req.destroy(); return; }

      const codificacion = String(res.headers['content-encoding'] || '').toLowerCase().trim();
      let flujo: Readable = res;
      if (codificacion === 'gzip' || codificacion === 'x-gzip') flujo = res.pipe(zlib.createGunzip());
      else if (codificacion === 'deflate') flujo = res.pipe(zlib.createInflate());
      else if (codificacion === 'br') flujo = res.pipe(zlib.createBrotliDecompress());
      else if (codificacion && codificacion !== 'identity') { fallar(new ErrorDescarga('no_html', `Codificación ${codificacion}`, estado)); req.destroy(); return; }

      const trozos: Buffer[] = [];
      let bytes = 0;
      const acabar = (truncada: boolean) => {
        if (hecho) return;
        hecho = true;
        const cuerpo = Buffer.concat(trozos).subarray(0, maxBytes);
        resolve({ descarga: { html: decodificarCuerpo(cuerpo, tipo), estado, tipo, bytes: cuerpo.length, truncada } });
      };
      flujo.on('data', (c: Buffer) => {
        if (hecho) return;
        trozos.push(c);
        bytes += c.length;
        // Tope de 1,5 MB (ya descomprimido): se deja de leer y se cierra la conexión
        if (bytes >= maxBytes) { acabar(true); req.destroy(); if (flujo !== res) flujo.destroy(); }
      });
      flujo.on('end', () => acabar(false));
      flujo.on('error', fallar);
      if (flujo !== res) res.on('error', fallar);
    });
    // Pase lo que pase, la promesa acaba al vencer el tiempo
    signal.addEventListener('abort', () => fallar(new ErrorDescarga('tiempo', 'Tiempo agotado')), { once: true });
    req.on('error', fallar);
    req.end();
  });
}

/** Descarga una página pública con todas las comprobaciones. Lanza ErrorDescarga si no se puede */
export async function descargarPagina(raw: string, op: OpcionesDescarga = {}): Promise<Descarga> {
  const permitirLocal = !!op.permitirLocal;
  const maxRedirecciones = op.maxRedirecciones ?? REDIRECCIONES_MAX;
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), op.tiempoMs ?? TIEMPO_MAX_MS);
  const lookup = lookupSeguro(op.resolver ?? resolverDns, permitirLocal);
  const redirecciones: string[] = [];
  try {
    let url = validarUrl(raw, permitirLocal);
    for (let saltos = 0; ; saltos++) {
      const r = await pedir(url, lookup, ctrl.signal, op.maxBytes ?? BYTES_MAX);
      if ('descarga' in r) return { ...r.descarga, url: url.href, redirecciones };
      if (saltos >= maxRedirecciones) {
        throw new ErrorDescarga(maxRedirecciones === 0 ? 'redireccion' : 'demasiadas_redirecciones', `Más de ${maxRedirecciones} redirecciones`, r.estado, r.redirige);
      }
      let siguiente: URL;
      try { siguiente = new URL(r.redirige, url); } catch { throw new ErrorDescarga('url_no_valida', 'Redirección mal formada'); }
      url = validarUrl(siguiente.href, permitirLocal);
      redirecciones.push(url.href);
    }
  } catch (e) {
    if (ctrl.signal.aborted) throw new ErrorDescarga('tiempo', 'Tiempo agotado');
    if (e instanceof ErrorDescarga) throw e;
    throw new ErrorDescarga('red', e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(reloj);
  }
}
