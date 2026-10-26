// Pruebas de «Rellénalo con tu web o tu Instagram» (no van en la app ni en el bundle).
// Desde la raíz del repo:   npx tsx scripts/leer-perfil/probar.ts
//
// 1) Leer el HTML y las reglas sin IA, con páginas hechas a mano (fixtures/).
// 2) La comprobación de lo que diga la IA (lo que no sale en la página, fuera).
// 3) Seguridad de la descarga: esquemas, IPs privadas, DNS, redirecciones, tiempo, tamaño, tipo.
//    Con un servidor HTTP local y el interruptor de pruebas (solo loopback).
// 4) La función entera (/api/leer-perfil): Instagram con una sola petición, sin IA, y con un
//    Kimi simulado en local (KIMI_BASE_URL) que se inventa cosas a propósito.
// No sale a internet: todo va contra 127.0.0.1.

import { readFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const AQUI = dirname(fileURLToPath(import.meta.url));
const fixture = (n: string) => readFileSync(join(AQUI, 'fixtures', n), 'utf8');

let pasan = 0;
const fallos: string[] = [];
function ok(cond: unknown, que: string, detalle?: unknown) {
    if (cond) { pasan++; return; }
    fallos.push(que);
    console.log(`  ✗ ${que}${detalle === undefined ? '' : `\n      → ${JSON.stringify(detalle)}`}`);
}
const seccion = (t: string) => console.log(`\n▸ ${t}`);
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ─── Servidores locales ─────────────────────────────────────────────────────
function escuchar(manejar: http.RequestListener): Promise<{ servidor: http.Server; puerto: number }> {
    return new Promise(resolve => {
        const servidor = http.createServer(manejar);
        servidor.listen(0, '127.0.0.1', () => resolve({ servidor, puerto: (servidor.address() as AddressInfo).port }));
    });
}

const peticionesWeb: { url: string; ua: string }[] = [];
const web = await escuchar((req, res) => {
    const url = req.url || '/';
    peticionesWeb.push({ url, ua: String(req.headers['user-agent'] || '') });
    const html = (cuerpo: string | Buffer, extra: Record<string, string> = {}) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...extra }); res.end(cuerpo); };
    const redirige = (a: string, codigo = 302) => { res.writeHead(codigo, { Location: a }); res.end(); };
    if (url === '/banda.html') return html(fixture('banda-jsonld.html'));
    if (url === '/linktree.html') return html(fixture('linktree.html'));
    if (url === '/instagram-bio.html') return html(fixture('instagram-bio.html'));
    if (url === '/instagram-login.html') return html(fixture('instagram-login.html'));
    if (url === '/vacia.html') return html(fixture('vacia.html'));
    if (url === '/ua') return html(`<html><body><p>${String(req.headers['user-agent'])}</p></body></html>`);
    if (url === '/redirige/privada') return redirige('http://192.168.1.1/admin');
    if (url === '/redirige/metadata') return redirige('http://169.254.169.254/latest/meta-data/');
    if (url === '/redirige/metadata-v6') return redirige('http://[::ffff:169.254.169.254]/latest/meta-data/');
    if (url === '/redirige/diez') return redirige('http://10.0.0.1/');
    if (url === '/redirige/fichero') return redirige('file:///etc/passwd');
    if (url === '/redirige/ftp') return redirige('ftp://example.com/secreto');
    if (url === '/redirige/bien') return redirige('/banda.html', 301);
    if (url === '/redirige/ig-login') return redirige('https://www.instagram.com/accounts/login/');
    const cadena = url.match(/^\/redirige\/cadena\/(\d+)$/);
    if (cadena) return Number(cadena[1]) <= 0 ? redirige('/banda.html') : redirige(`/redirige/cadena/${Number(cadena[1]) - 1}`);
    if (url === '/pdf') { res.writeHead(200, { 'Content-Type': 'application/pdf' }); return res.end('%PDF-1.4'); }
    if (url === '/json') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"a":1}'); }
    if (url === '/sin-tipo') { res.writeHead(200); return res.end('<html></html>'); }
    if (url === '/404') { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('no'); }
    if (url === '/gzip') return html(zlib.gzipSync(fixture('banda-jsonld.html')), { 'Content-Encoding': 'gzip' });
    if (url === '/br') return html(zlib.brotliCompressSync(fixture('banda-jsonld.html')), { 'Content-Encoding': 'br' });
    if (url === '/latin1') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=ISO-8859-1' });
        return res.end(Buffer.from('<html><head><title>Coro Gòspel Cádiz</title><meta name="description" content="Somos un coro de música gospel de Cádiz. Cantamos en bodas y ceremonias."></head><body><p>Música en directo</p></body></html>', 'latin1'));
    }
    if (url === '/grande') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const trozo = `<p>${'Rumba '.repeat(1000)}</p>`;
        let enviados = 0;
        const escribir = () => { while (enviados < 3 * 1024 * 1024) { enviados += trozo.length; if (!res.write(trozo)) return res.once('drain', escribir); } res.end(); };
        res.on('close', () => { enviados = Infinity; });
        return escribir();
    }
    if (url === '/bomba') {
        // 20 MB de ceros comprimidos en unos pocos KB
        return html(zlib.gzipSync(Buffer.alloc(20 * 1024 * 1024, 32)), { 'Content-Encoding': 'gzip' });
    }
    if (url === '/lenta') { setTimeout(() => html('<html><title>tarde</title></html>'), 3000); return; }
    if (url === '/goteo') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const t = setInterval(() => res.write('<p>gota</p>'), 100);
        res.on('close', () => clearInterval(t));
        return;
    }
    res.writeHead(404); res.end();
});
const BASE = `http://127.0.0.1:${web.puerto}`;

// Kimi simulado: responde como la API de Moonshot (formato OpenAI)
let modoKimi: 'json' | 'roto' | 'error' = 'json';
const peticionesKimi: { auth: string; cuerpo: { model?: string; messages?: { role: string; content: string }[]; temperature?: number } }[] = [];
const RESPUESTA_IA = {
    nombre: 'Rumba Sur',
    tipo: 'banda',
    bio: 'Somos Rumba Sur, cuatro músicos de Barcelona que tocamos rumba catalana, flamenco y versiones en bodas, fiestas y festivales. Llámanos al 600 123 456 o escribe a hola@rumbasur.es.',
    ciudad: 'Sevilla',                                  // inventada: en la página no sale como suya
    generos: ['Rumba', 'Jazz', 'Flamenco', 'Bachata'],  // Jazz solo sale en un script; Bachata no está en la lista
    precio: 1200,                                       // nunca precios: se ignora
    ficha: {
        formacion: 'Voz, dos guitarras y cajón', musicos: 4, duracion: '2 h', repertorio: 'Rumba catalana, flamenco y versiones',
        equipo: 'Sonido propio para 150 personas', viaja: 'Toda Cataluña', idiomas: 'Castellano, catalán e inglés',
        idealPara: ['Bodas', 'Fiestas', 'Empresas'],
    },
};
const kimi = await escuchar((req, res) => {
    let datos = '';
    req.on('data', c => { datos += c; });
    req.on('end', () => {
        peticionesKimi.push({ auth: String(req.headers.authorization || ''), cuerpo: JSON.parse(datos || '{}') });
        if (modoKimi === 'error') { res.writeHead(500, { 'Content-Type': 'application/json' }); return res.end('{"error":"caído"}'); }
        const contenido = modoKimi === 'roto' ? 'Lo siento, no puedo ayudarte con eso.' : `Aquí tienes:\n\`\`\`json\n${JSON.stringify(RESPUESTA_IA)}\n\`\`\``;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: contenido } }] }));
    });
});

// El entorno ANTES de cargar la función (lee KIMI_* y el interruptor al cargarse)
process.env.KIMI_BASE_URL = `http://127.0.0.1:${kimi.puerto}/v1`;
process.env.KIMI_API_KEY = '"Bearer clave-de-prueba"';
process.env.LEER_PERFIL_PERMITIR_LOCAL = '1';
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;
delete process.env.NODE_ENV;

const L = await import('../../src/lib/leerPerfil.ts');
const D = await import('../../api/_descargar.ts');
const F = await import('../../api/leer-perfil.ts');

// ─── 1) Leer el HTML y las reglas ───────────────────────────────────────────
seccion('1. Leer páginas y reglas sin IA');
{
    const d = L.extraerDePagina(fixture('banda-jsonld.html'), 'https://rumbasur.es/inicio');
    ok(d.titulo === 'Rumba Sur | Banda de rumba catalana para bodas y fiestas', 'banda: <title>', d.titulo);
    ok(d.meta['og:site_name'] === 'Rumba Sur' && d.meta['og:image'], 'banda: og:*', d.meta);
    ok(d.jsonld[0]?.tipo === 'MusicGroup' && d.jsonld[0]?.miembros === 4 && d.jsonld[0]?.localidad === 'Barcelona', 'banda: JSON-LD MusicGroup', d.jsonld[0]);
    ok(!/Madrid jazz|font-family|comentario con Valencia/.test(d.texto), 'banda: el texto visible no lleva scripts, estilos ni comentarios', d.texto);
    ok(!/Contacto Sevilla/.test(d.texto), 'banda: los menús (<nav>) fuera del texto');
    const p = L.reglas(d, 'web');
    ok(p.nombre === 'Rumba Sur', 'banda: nombre del JSON-LD', p.nombre);
    ok(p.ciudad === 'Barcelona', 'banda: ciudad', p.ciudad);
    ok(p.generos?.includes('Rumba') && p.generos?.includes('Flamenco') && !p.generos.includes('Jazz') && !p.generos.includes('Metal'), 'banda: estilos por palabras (no los de scripts ni comentarios)', p.generos);
    ok(p.bio?.startsWith('Somos cuatro músicos de Barcelona') && !/@|hola@/.test(p.bio), 'banda: bio de la descripción, sin email', p.bio);
    ok(p.ficha?.musicos === 4, 'banda: 4 músicos (miembros del JSON-LD)', p.ficha);
    ok(igual(p.ficha?.idealPara, ['Bodas', 'Fiestas', 'Festivales']), 'banda: ideal para', p.ficha?.idealPara);
    ok(p.ficha?.idiomas === 'Castellano, catalán', 'banda: idiomas', p.ficha?.idiomas);
    ok(p.ficha?.equipo === 'Sonido propio', 'banda: equipo', p.ficha?.equipo);
    ok(p.ficha?.viaja === 'Toda Cataluña', 'banda: viaja', p.ficha?.viaja);
    ok(igual(p.redes, {
        web: 'https://rumbasur.es/',
        instagram: 'https://www.instagram.com/rumbasur/',
        youtube: 'https://www.youtube.com/@rumbasuroficial',
        spotify: 'https://open.spotify.com/artist/3AbCdEfGhIjKlMnOpQrStU',
        facebook: 'https://www.facebook.com/rumbasurbcn',
    }), 'banda: enlaces (canal mejor que vídeo; sin «compartir» ni WhatsApp)', p.redes);
}
{
    const d = L.extraerDePagina(fixture('linktree.html'), 'https://linktr.ee/lucia.ferrer');
    const p = L.reglas(d, 'web');
    ok(p.nombre === 'Lucía Ferrer', 'linktree: nombre de og:title sin «| Linktree»', p.nombre);
    ok(p.ciudad === 'Valencia', 'linktree: ciudad', p.ciudad);
    ok(igual(p.generos, ['Pop', 'Versiones']), 'linktree: estilos', p.generos);
    ok(p.bio?.startsWith('Cantautora de Valencia') && !/cookies/.test(p.bio || ''), 'linktree: bio de la descripción (no el aviso de cookies)', p.bio);
    ok(igual(p.ficha?.idealPara, ['Bodas', 'Terrazas']), 'linktree: ideal para', p.ficha);
    ok(igual(p.redes, {
        web: 'https://luciaferrer.com/',
        instagram: 'https://www.instagram.com/lucia.ferrer.music/',
        youtube: 'https://www.youtube.com/channel/UCaBcDeFgHiJkLmNoPqRsT',
        spotify: 'https://open.spotify.com/artist/7xYzAbCdEfGhIjKlMnOpQr',
        soundcloud: 'https://soundcloud.com/luciaferrer',
        bandcamp: 'https://luciaferrer.bandcamp.com/',
        tiktok: 'https://www.tiktok.com/@luciaferrer.music',
    }), 'linktree: enlaces (también los del JSON con \\/ y su web)', p.redes);
}
{
    const d = L.extraerDePagina(fixture('instagram-bio.html'), 'https://www.instagram.com/velvetjam/');
    const ig = L.leerInstagram(d);
    ok(ig.estado === 'ok' && ig.nombre === 'Velvet Jam' && ig.usuario === 'velvetjam', 'instagram con bio: nombre y usuario', ig);
    ok(ig.bio?.startsWith('Banda de soul y funk de Madrid'), 'instagram con bio: la bio de la metaetiqueta', ig.bio);
    const login = L.leerInstagram(L.extraerDePagina(fixture('instagram-login.html'), 'https://www.instagram.com/accounts/login/'));
    ok(login.estado === 'login', 'instagram: pantalla de login detectada', login);
    const sinBio = L.leerInstagram(L.extraerDePagina(fixture('instagram-bio.html').replace(/<meta content="2\.345[^>]*>/, ''), 'https://www.instagram.com/velvetjam/'));
    ok(sinBio.estado === 'sin_bio' && sinBio.nombre === 'Velvet Jam', 'instagram sin bio en las metaetiquetas: solo el nombre', sinBio);
}
{
    const d = L.extraerDePagina(fixture('vacia.html'), 'https://cosas.es/');
    const p = L.reglas(d, 'web');
    ok(!L.hayAlgo(p), 'vacía: no hay nada útil (ni «Inicio», ni «Otro sitio con WordPress», ni lo de los scripts)', p);
}
{
    const d = L.datosDeTexto('Dúo acústico de Girona 🎶 Pop, soul y bossa nova para bodas y terrazas. Cantamos en catalán, castellano e inglés.\nMás en instagram.com/duoaroma y https://open.spotify.com/artist/1aBcDeFgHiJkLmNoPqRsTu.');
    const p = L.reglas(d, 'texto');
    ok(!p.nombre, 'texto pegado: sin nombre inventado', p.nombre);
    ok(p.ciudad === 'Girona' && igual(p.generos, ['Pop', 'Latin', 'Soul']) && p.ficha?.musicos === 2, 'texto pegado: ciudad, estilos y dúo = 2', p);
    ok(p.ficha?.idiomas === 'Catalán, castellano, inglés', 'texto pegado: idiomas', p.ficha?.idiomas);
    ok(p.redes?.instagram === 'https://www.instagram.com/duoaroma/' && p.redes?.spotify?.endsWith('1aBcDeFgHiJkLmNoPqRsTu') && !p.redes?.web, 'texto pegado: enlaces (también sin https://)', p.redes);
    ok(p.bio?.startsWith('Dúo acústico de Girona') && !/instagram\.com|https/.test(p.bio || ''), 'texto pegado: bio sin enlaces', p.bio);
}
{
    ok(igual(L.normalizarEnlace('@rumbasur'), { url: 'https://www.instagram.com/rumbasur/', instagram: 'rumbasur' }), 'enlace: @usuario → Instagram');
    ok(igual(L.normalizarEnlace('instagram.com/rumbasur?igsh=abc'), { url: 'https://www.instagram.com/rumbasur/', instagram: 'rumbasur' }), 'enlace: instagram.com/usuario sin https');
    ok(igual(L.normalizarEnlace('rumbasur.es'), { url: 'https://rumbasur.es/' }), 'enlace: dominio sin https');
    ok('error' in L.normalizarEnlace('https://www.instagram.com/p/C0abc/'), 'enlace: una publicación de Instagram no vale');
    ok('error' in L.normalizarEnlace('hola'), 'enlace: una palabra no es una web');
    ok('error' in L.normalizarEnlace('javascript:alert(1)'), 'enlace: javascript: fuera');
    ok('error' in L.normalizarEnlace(`https://a.es/${'x'.repeat(2100)}`), 'enlace: larguísimo fuera');
    ok(L.sinContacto('Llámanos al 600 123 456, al +34 611-222-333 o a hola@banda.es. Desde 2015 - 2024 en @banda_bcn') === 'Llámanos al, al o a. Desde 2015 - 2024 en', 'sin contacto: teléfonos, email y @ fuera; los años se quedan',
        L.sinContacto('Llámanos al 600 123 456, al +34 611-222-333 o a hola@banda.es. Desde 2015 - 2024 en @banda_bcn'));
    ok(L.bioLimpia('Somos de Mataró y tocamos por 1.500 € el pase. Escríbenos a hola@banda.es o al 600 123 456. Bodas y fiestas.') === 'Somos de Mataró y tocamos por 1.500 € el pase. Bodas y fiestas.',
        'bio: fuera la frase entera con el contacto (sin restos), «1.500» no corta', L.bioLimpia('Somos de Mataró y tocamos por 1.500 € el pase. Escríbenos a hola@banda.es o al 600 123 456. Bodas y fiestas.'));
    ok(L.recortar('Una frase. '.repeat(80), 600).length <= 600 && L.recortar('Una frase. '.repeat(80), 600).endsWith('.'), 'bio: 600 caracteres como mucho, cortada en una frase');
    const malo = `<a${'<a '.repeat(20000)}<script>${'<!--'.repeat(20000)}`;
    const t0 = Date.now();
    L.extraerDePagina(malo, 'https://x.es/');
    ok(Date.now() - t0 < 1500, 'HTML hostil (etiquetas y comentarios sin cerrar): se lee en tiempo lineal', `${Date.now() - t0} ms`);
}

// ─── 2) La IA, comprobada ───────────────────────────────────────────────────
seccion('2. Lo que diga la IA se comprueba contra la página');
{
    const d = L.extraerDePagina(fixture('banda-jsonld.html'), 'https://rumbasur.es/');
    const ia = L.comprobarIA(RESPUESTA_IA, d);
    ok(ia.nombre === 'Rumba Sur', 'IA: nombre que sale en la página → se queda');
    ok(!ia.ciudad, 'IA: ciudad inventada (Sevilla) → fuera', ia.ciudad);
    ok(igual(ia.generos, ['Rumba', 'Flamenco']), 'IA: estilos sin rastro en el texto (Jazz) o fuera de la lista (Bachata) → fuera', ia.generos);
    ok(ia.ficha?.idiomas === 'Castellano, catalán', 'IA: idioma que no sale (inglés) → fuera', ia.ficha?.idiomas);
    ok(igual(ia.ficha?.idealPara, ['Bodas', 'Fiestas']), 'IA: ocasión que no sale (Empresas) → fuera', ia.ficha?.idealPara);
    ok(ia.ficha?.musicos === 4 && ia.ficha?.duracion === '2 h', 'IA: músicos y duración con su número en el texto → se quedan', ia.ficha);
    ok(!/600|hola@/.test(ia.bio || ''), 'IA: la bio sin teléfono ni email', ia.bio);
    ok(!('precio' in ia), 'IA: nunca precios');
    const mal = L.comprobarIA({ nombre: 'Los Inventados', ficha: { musicos: 9, duracion: '3 h' } }, d);
    ok(!mal.nombre && !mal.ficha, 'IA: nombre y números que no están en la página → fuera', mal);
    const todo = L.combinar(ia, L.reglas(d, 'web'));
    ok(todo.ciudad === 'Barcelona' && todo.redes?.instagram && todo.ficha?.formacion === 'Voz, dos guitarras y cajón', 'combinar: la IA donde vale, las reglas donde no; enlaces de la página', todo);
    const largo = L.limpiarPropuesta({ bio: 'Somos una banda. '.repeat(100), generos: ['rumba', 'ROCK', 'Trance'], ficha: { musicos: 400 }, redes: { instagram: 'javascript:alert(1)', web: 'https://ok.es/' } });
    ok((largo.bio?.length || 0) <= 600 && igual(largo.generos, ['Rumba', 'Rock']) && !largo.ficha && igual(largo.redes, { web: 'https://ok.es/' }), 'limpiar: tope de bio, estilos de la lista, números razonables, enlaces válidos', largo);
}

// ─── 3) Seguridad de la descarga ────────────────────────────────────────────
seccion('3. Seguridad de la descarga');
{
    ok(D.TIEMPO_MAX_MS === 8000 && D.BYTES_MAX === 1.5 * 1024 * 1024 && D.REDIRECCIONES_MAX === 3 && D.URL_MAX === 2048, 'límites: 8 s, 1,5 MB, 3 redirecciones, 2048 caracteres');
    ok(D.USER_AGENT === 'MusikeeoBot/1.0 (+https://musikeeo.com)', 'User-Agent que se identifica');

    const codigo = (url: string, local = false) => { try { D.validarUrl(url, local); return 'ok'; } catch (e) { return (e as { codigo?: string }).codigo || String(e); } };
    const bloqueadas = [
        'http://127.0.0.1', 'http://127.0.0.1:8787/', 'http://127.1/', 'http://2130706433/', 'http://0x7f000001/', 'http://017700000001/',
        'http://169.254.169.254/latest/meta-data', 'http://[::ffff:169.254.169.254]/', 'http://[64:ff9b::a9fe:a9fe]/',
        'http://localhost:3000', 'http://LOCALHOST/', 'http://localhost./', 'http://api.localhost/', 'http://metadata.google.internal/computeMetadata/v1/',
        'http://servidor.local/', 'http://10.0.0.1/', 'http://10.255.255.255/', 'http://192.168.1.1/', 'http://172.16.0.1/', 'http://172.31.255.255/',
        'http://100.64.0.1/', 'http://0.0.0.0/', 'http://0/', 'http://224.0.0.1/', 'http://255.255.255.255/',
        'http://[::1]/', 'http://[::]/', 'http://[::ffff:127.0.0.1]/', 'http://[fe80::1]/', 'http://[fd00:ec2::254]/', 'http://[2002:7f00:1::]/',
        'https://example.com:22/', 'http://example.com:6379/',
    ];
    for (const u of bloqueadas) ok(codigo(u) === 'url_bloqueada', `bloqueada: ${u}`, codigo(u));
    const invalidas = ['file:///etc/passwd', 'ftp://example.com/archivo', 'gopher://example.com/', 'javascript:alert(1)', 'data:text/html,hola',
        'http://usuario:clave@example.com/', `https://example.com/${'a'.repeat(2100)}`, '', 'no es una url'];
    for (const u of invalidas) ok(codigo(u) === 'url_no_valida', `no válida: ${u.slice(0, 60)}`, codigo(u));
    for (const u of ['https://example.com/', 'http://example.com:8080/x', 'https://93.184.216.34/', 'https://[2606:4700:4700::1111]/', 'https://rumbasur.es/inicio?x=1']) {
        ok(codigo(u) === 'ok', `permitida: ${u}`, codigo(u));
    }
    // El interruptor de pruebas solo abre el loopback
    for (const u of ['http://127.0.0.1:8787/', 'http://localhost:3000/', 'http://[::1]:8787/']) ok(codigo(u, true) === 'ok', `con interruptor, permitida: ${u}`, codigo(u, true));
    for (const u of ['http://169.254.169.254/', 'http://10.0.0.1/', 'http://192.168.1.1/', 'http://[fd00::1]/', 'http://metadata.google.internal/']) {
        ok(codigo(u, true) === 'url_bloqueada', `con interruptor, sigue bloqueada: ${u}`, codigo(u, true));
    }
    ok(codigo('file:///etc/passwd', true) === 'url_no_valida', 'con interruptor, file:// sigue fuera');
    ok(D.permitirLocalDesde({ LEER_PERFIL_PERMITIR_LOCAL: '1' }) === true, 'interruptor: activo en local');
    ok(D.permitirLocalDesde({ LEER_PERFIL_PERMITIR_LOCAL: '1', VERCEL: '1' }) === false, 'interruptor: ignorado en Vercel');
    ok(D.permitirLocalDesde({ LEER_PERFIL_PERMITIR_LOCAL: '1', NODE_ENV: 'production' }) === false, 'interruptor: ignorado en producción');
    ok(D.permitirLocalDesde({}) === false, 'interruptor: apagado por defecto');
}
{
    const falla = async (url: string, op: Parameters<typeof D.descargarPagina>[1] = {}) => {
        try { const r = await D.descargarPagina(url, op); return `ok:${r.url}`; } catch (e) { return (e as { codigo?: string }).codigo || String(e); }
    };
    const local = { permitirLocal: true };
    // Sin interruptor, el servidor local no se puede leer
    ok(await falla(`${BASE}/banda.html`) === 'url_bloqueada', 'sin interruptor: 127.0.0.1 bloqueada');
    ok(await falla(`http://localhost:${web.puerto}/banda.html`) === 'url_bloqueada', 'sin interruptor: localhost bloqueada');
    ok(await falla(`http://[::1]:${web.puerto}/banda.html`) === 'url_bloqueada', 'sin interruptor: [::1] bloqueada');
    // DNS: un nombre que apunta a una IP privada (o a una pública y una privada) no se pide
    const dns = (ips: string[]) => async () => ips.map(address => ({ address, family: address.includes(':') ? 6 : 4 }));
    const antes = peticionesWeb.length;
    ok(await falla('http://malo.example/', { resolver: dns(['10.0.0.5']) }) === 'url_bloqueada', 'DNS a 10.0.0.5 → bloqueada');
    ok(await falla('http://malo.example/', { resolver: dns(['93.184.216.34', '127.0.0.1']) }) === 'url_bloqueada', 'DNS con una pública y una de loopback → bloqueada');
    ok(await falla('http://malo.example/', { resolver: dns(['::ffff:169.254.169.254']) }) === 'url_bloqueada', 'DNS a ::ffff:169.254.169.254 → bloqueada');
    // La conexión va a la IP que devuelve NUESTRO lookup (la comprobada): «loopback.example» → 127.0.0.1
    ok((await falla(`http://loopback.example:${web.puerto}/banda.html`, { ...local, resolver: dns(['127.0.0.1']) })).startsWith('ok:'), 'la conexión usa la IP comprobada por nuestro lookup');
    ok(peticionesWeb.length === antes + 1, 'las bloqueadas no llegan a conectar (solo llegó la permitida)', peticionesWeb.length - antes);

    // Descargas reales contra el servidor local (con el interruptor de pruebas)
    const r = await D.descargarPagina(`${BASE}/banda.html`, local);
    ok(r.html.includes('Rumba Sur') && r.estado === 200 && !r.truncada, 'descarga: página normal');
    ok(peticionesWeb.at(-1)?.ua === D.USER_AGENT, 'descarga: manda el User-Agent de Musikeeo', peticionesWeb.at(-1));
    ok(await falla(`${BASE}/redirige/privada`, local) === 'url_bloqueada', 'redirección a 192.168.1.1 → bloqueada');
    ok(await falla(`${BASE}/redirige/metadata`, local) === 'url_bloqueada', 'redirección a 169.254.169.254 (metadata) → bloqueada');
    ok(await falla(`${BASE}/redirige/metadata-v6`, local) === 'url_bloqueada', 'redirección a [::ffff:169.254.169.254] → bloqueada');
    ok(await falla(`${BASE}/redirige/diez`, local) === 'url_bloqueada', 'redirección a 10.0.0.1 → bloqueada');
    ok(await falla(`${BASE}/redirige/fichero`, local) === 'url_no_valida', 'redirección a file:///etc/passwd → fuera');
    ok(await falla(`${BASE}/redirige/ftp`, local) === 'url_no_valida', 'redirección a ftp:// → fuera');
    ok(await falla(`${BASE}/redirige/bien`, local) === `ok:${BASE}/banda.html`, 'redirección buena (relativa) → se sigue');
    ok(await falla(`${BASE}/redirige/cadena/2`, local) === `ok:${BASE}/banda.html`, '3 redirecciones → bien');
    ok(await falla(`${BASE}/redirige/cadena/3`, local) === 'demasiadas_redirecciones', '4 redirecciones → demasiadas');
    ok(await falla(`${BASE}/redirige/ig-login`, { ...local, maxRedirecciones: 0 }) === 'redireccion', 'con 0 redirecciones (Instagram) no se sigue ninguna');
    ok(await falla(`${BASE}/pdf`, local) === 'no_html', 'un PDF → no_html');
    ok(await falla(`${BASE}/json`, local) === 'no_html', 'un JSON → no_html');
    ok(await falla(`${BASE}/sin-tipo`, local) === 'no_html', 'sin Content-Type → no_html');
    ok(await falla(`${BASE}/404`, local) === 'http', 'un 404 → http');
    const grande = await D.descargarPagina(`${BASE}/grande`, local);
    ok(grande.truncada && grande.bytes === D.BYTES_MAX, 'página de 3 MB → se leen 1,5 MB y se corta', { bytes: grande.bytes, truncada: grande.truncada });
    const bomba = await D.descargarPagina(`${BASE}/bomba`, local);
    ok(bomba.truncada && bomba.bytes === D.BYTES_MAX, 'bomba gzip (20 MB descomprimidos) → se corta en 1,5 MB', { bytes: bomba.bytes });
    ok((await D.descargarPagina(`${BASE}/gzip`, local)).html.includes('Rumba Sur'), 'gzip descomprimido');
    ok((await D.descargarPagina(`${BASE}/br`, local)).html.includes('Rumba Sur'), 'brotli descomprimido');
    const latin = await D.descargarPagina(`${BASE}/latin1`, local);
    ok(latin.html.includes('Cádiz') && latin.html.includes('Música'), 'ISO-8859-1 bien leído', latin.html.slice(0, 80));
    let t0 = Date.now();
    ok(await falla(`${BASE}/lenta`, { ...local, tiempoMs: 800 }) === 'tiempo', 'respuesta lenta → tiempo agotado');
    ok(Date.now() - t0 < 2000, 'el tiempo máximo se cumple', `${Date.now() - t0} ms`);
    t0 = Date.now();
    ok(await falla(`${BASE}/goteo`, { ...local, tiempoMs: 800 }) === 'tiempo', 'respuesta que gotea sin fin → tiempo agotado');
    ok(Date.now() - t0 < 2000, 'el tiempo máximo cuenta también el cuerpo', `${Date.now() - t0} ms`);
}

// ─── 4) La función entera ───────────────────────────────────────────────────
seccion('4. /api/leer-perfil');
{
    // Instagram: una sola petición, sin seguir redirecciones, solo metaetiquetas
    const llamadas: { url: string; op: { maxRedirecciones?: number } }[] = [];
    const conPagina = (nombre: string) => ({
        descargar: async (url: string, op: { maxRedirecciones?: number }) => {
            llamadas.push({ url, op });
            return { url, html: fixture(nombre), estado: 200, tipo: 'text/html', bytes: 1, truncada: false, redirecciones: [] };
        },
        pedirIA: null, permitirLocal: false,
    });
    let r = await F.leerPerfil({ url: 'instagram.com/velvetjam' }, conPagina('instagram-bio.html'));
    ok(llamadas.length === 1 && llamadas[0].url === 'https://www.instagram.com/velvetjam/' && llamadas[0].op.maxRedirecciones === 0, 'instagram: UNA petición a la página pública, sin redirecciones', llamadas);
    let c = r.cuerpo;
    ok(c.ok && c.fuente === 'instagram' && c.instagram === 'ok' && c.modo === 'reglas', 'instagram con bio: se lee', c);
    if (c.ok) {
        ok(c.propuesta.nombre === 'Velvet Jam' && c.propuesta.ciudad === 'Madrid' && igual(c.propuesta.generos, ['Soul', 'Funk']), 'instagram con bio: nombre, ciudad y estilos', c.propuesta);
        ok(c.propuesta.ficha?.musicos === 5 && igual(c.propuesta.ficha?.idealPara, ['Bodas', 'Fiestas', 'Salas']), 'instagram con bio: ficha', c.propuesta.ficha);
        ok(c.propuesta.bio?.startsWith('Banda de soul y funk de Madrid') && !/booking@/.test(c.propuesta.bio || ''), 'instagram con bio: bio sin email', c.propuesta.bio);
        ok(c.propuesta.redes?.instagram === 'https://www.instagram.com/velvetjam/', 'instagram: se guarda el enlace');
    }
    llamadas.length = 0;
    r = await F.leerPerfil({ url: '@velvetjam' }, conPagina('instagram-login.html'));
    c = r.cuerpo;
    ok(llamadas.length === 1, 'instagram con login: tampoco se reintenta', llamadas.length);
    ok(c.ok && c.instagram === 'login' && c.pedirTexto && c.aviso === 'No hemos podido leer tu Instagram: copia tu bio y pégala aquí'
        && c.propuesta.redes?.instagram === 'https://www.instagram.com/velvetjam/' && !c.propuesta.nombre, 'instagram con login: lo dice, pide la bio y guarda el enlace', c);
    r = await F.leerPerfil({ url: '@velvetjam' }, { descargar: async () => { throw new D.ErrorDescarga('redireccion', 'al login', 302); }, pedirIA: null, permitirLocal: false });
    ok(r.cuerpo.ok && r.cuerpo.instagram === 'login', 'instagram que redirige al login → pide la bio', r.cuerpo);
    r = await F.leerPerfil({ url: '@velvetjam' }, {
        descargar: async (url: string) => ({ url, html: fixture('instagram-bio.html').replace(/<meta content="2\.345[^>]*>/, ''), estado: 200, tipo: 'text/html', bytes: 1, truncada: false, redirecciones: [] }),
        pedirIA: null, permitirLocal: false,
    });
    ok(r.cuerpo.ok && r.cuerpo.instagram === 'sin_bio' && r.cuerpo.pedirTexto && r.cuerpo.propuesta.nombre === 'Velvet Jam', 'instagram sin bio: el nombre y que pegue la bio', r.cuerpo);

    // Web real contra el servidor local, sin IA
    const sinIA = { descargar: D.descargarPagina, pedirIA: null, permitirLocal: true };
    r = await F.leerPerfil({ url: `${BASE}/banda.html` }, sinIA);
    ok(r.estado === 200 && r.cuerpo.ok && r.cuerpo.modo === 'reglas' && r.cuerpo.propuesta.nombre === 'Rumba Sur', 'web sin IA: propuesta de las reglas', r.cuerpo);
    r = await F.leerPerfil({ url: `${BASE}/vacia.html` }, sinIA);
    ok(r.estado === 422 && !r.cuerpo.ok && r.cuerpo.error === 'sin_datos' && r.cuerpo.pedirTexto, 'web vacía: «no hemos encontrado datos» y pide pegar la bio', r.cuerpo);
    r = await F.leerPerfil({ url: `${BASE}/redirige/metadata` }, sinIA);
    ok(r.estado === 400 && !r.cuerpo.ok && r.cuerpo.error === 'url_bloqueada', 'web que redirige al metadata: bloqueada', r.cuerpo);
    r = await F.leerPerfil({ url: `${BASE}/pdf` }, sinIA);
    ok(!r.cuerpo.ok && r.cuerpo.error === 'no_html' && r.cuerpo.pedirTexto, 'un PDF: error claro y pide la bio', r.cuerpo);
    r = await F.leerPerfil({ texto: 'hola' }, sinIA);
    ok(!r.cuerpo.ok && r.cuerpo.error === 'texto_corto', 'texto demasiado corto', r.cuerpo);
    r = await F.leerPerfil({ texto: 'Banda de versiones pop y rock de Zaragoza. Somos seis músicos y tocamos en bodas y fiestas.' }, sinIA);
    ok(r.cuerpo.ok && r.cuerpo.fuente === 'texto' && r.cuerpo.propuesta.ciudad === 'Zaragoza' && r.cuerpo.propuesta.ficha?.musicos === 6, 'texto pegado sin IA', r.cuerpo);
    r = await F.leerPerfil({ nada: 1 }, sinIA);
    ok(r.estado === 400 && !r.cuerpo.ok && r.cuerpo.error === 'peticion', 'petición sin url ni texto', r.cuerpo);

    // El handler de Vercel con un Kimi simulado
    const res = () => {
        const out = { codigo: 0, cuerpo: null as unknown as Record<string, unknown>, cabeceras: {} as Record<string, string> };
        const r: { status(c: number): typeof r; json(b: unknown): typeof r; setHeader(k: string, v: string): void } = {
            status(c) { out.codigo = c; return r; }, json(b) { out.cuerpo = b as Record<string, unknown>; return r; }, setHeader(k, v) { out.cabeceras[k] = v; },
        };
        return { r, out };
    };
    const llamar = async (req: { method?: string; headers?: Record<string, string>; body?: unknown }) => { const x = res(); await F.default(req, x.r); return x.out; };
    let o = await llamar({ method: 'GET', headers: {} });
    ok(o.codigo === 405, 'handler: GET → 405', o);
    o = await llamar({ method: 'POST', headers: { 'content-length': '999999' }, body: {} });
    ok(o.codigo === 413, 'handler: cuerpo enorme (Content-Length) → 413', o);
    o = await llamar({ method: 'POST', headers: {}, body: { texto: 'x'.repeat(20000) } });
    ok(o.codigo === 413, 'handler: cuerpo enorme (sin Content-Length) → 413', o.codigo);
    o = await llamar({ method: 'POST', headers: {}, body: '{esto no es json' });
    ok(o.codigo === 400, 'handler: JSON roto → 400', o);
    o = await llamar({ method: 'POST', headers: {}, body: { url: 'http://169.254.169.254/latest/meta-data' } });
    ok(o.codigo === 400 && o.cuerpo.error === 'url_bloqueada' && o.cabeceras['Cache-Control'] === 'no-store', 'handler: metadata → 400 bloqueada, sin caché', o);

    modoKimi = 'json';
    o = await llamar({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' }, body: { url: `${BASE}/banda.html` } });
    const pk = peticionesKimi.at(-1);
    ok(pk?.auth === 'Bearer clave-de-prueba' && pk.cuerpo.model && pk.cuerpo.temperature === 0.2, 'Kimi: clave limpia y modelo, como /api/chat', pk && { auth: pk.auth, model: pk.cuerpo.model });
    ok(pk?.cuerpo.messages?.[0].content.includes('REGLA DURA') && pk.cuerpo.messages?.[1].content.includes('Somos cuatro músicos de Barcelona'), 'Kimi: el encargo y el texto de la página', pk?.cuerpo.messages?.[1].content.slice(0, 120));
    ok(!pk?.cuerpo.messages?.[1].content.includes('Madrid jazz'), 'Kimi: no le llega lo de los scripts');
    ok(!/600 123 456|hola@rumbasur|https?:\/\//.test(pk?.cuerpo.messages?.[1].content || ''), 'Kimi: no le llegan teléfonos, emails ni enlaces (privacidad)', pk?.cuerpo.messages?.[1].content);
    const p = o.cuerpo.propuesta as Record<string, unknown> & { ficha?: Record<string, unknown>; redes?: Record<string, string> };
    ok(o.codigo === 200 && o.cuerpo.modo === 'ia', 'con IA: modo «ia»', o.cuerpo);
    ok(p?.ciudad === 'Barcelona' && igual(p?.generos, ['Rumba', 'Flamenco']), 'con IA: lo inventado fuera (Sevilla, Jazz), lo de la página dentro', p);
    ok(String(p?.bio).startsWith('Somos Rumba Sur') && !/600|hola@/.test(String(p?.bio)), 'con IA: la bio redactada, sin teléfono ni email', p?.bio);
    ok(p?.ficha?.formacion === 'Voz, dos guitarras y cajón' && p?.ficha?.idiomas === 'Castellano, catalán' && igual(p?.ficha?.idealPara, ['Bodas', 'Fiestas']), 'con IA: ficha comprobada', p?.ficha);
    ok(p?.redes?.instagram === 'https://www.instagram.com/rumbasur/' && !('precio' in p), 'con IA: enlaces de la página y sin precio', p);

    modoKimi = 'roto';
    o = await llamar({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.2' }, body: { url: `${BASE}/banda.html` } });
    ok(o.codigo === 200 && o.cuerpo.modo === 'reglas' && (o.cuerpo.propuesta as { nombre?: string }).nombre === 'Rumba Sur', 'IA que no devuelve JSON → reglas', o.cuerpo);
    modoKimi = 'error';
    o = await llamar({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.3' }, body: { texto: 'Somos un trío de jazz y swing de Bilbao. Tocamos en bodas, terrazas y salas.' } });
    ok(o.codigo === 200 && o.cuerpo.modo === 'reglas' && (o.cuerpo.propuesta as { ciudad?: string }).ciudad === 'Bilbao', 'IA caída (500) → reglas, nunca se queda en nada', o.cuerpo);

    for (let i = 0; i < 10; i++) await llamar({ method: 'POST', headers: { 'x-forwarded-for': '9.9.9.9' }, body: { url: 'ftp://x' } });
    o = await llamar({ method: 'POST', headers: { 'x-forwarded-for': '9.9.9.9' }, body: { url: 'ftp://x' } });
    ok(o.codigo === 429 && o.cabeceras['Retry-After'], 'handler: más de 10 por minuto desde la misma IP → 429', o);
}

web.servidor.close();
kimi.servidor.close();
console.log(`\n${fallos.length ? '✗' : '✓'} ${pasan} pasan, ${fallos.length} fallan`);
if (fallos.length) { console.log(fallos.map(f => `  - ${f}`).join('\n')); process.exit(1); }
process.exit(0);
