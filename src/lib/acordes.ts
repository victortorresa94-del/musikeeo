// El motor del Cancionero: lee una canción pegada de cualquier web (acordes encima de la
// letra, ChordPro con [Am] dentro del texto o el formato de Ultimate Guitar), la limpia
// y la transporta. Todo es texto: no depende de React ni de Firebase.

export type Notacion = 'original' | 'americana' | 'latina';
export type Alteraciones = 'auto' | 'sostenidos' | 'bemoles';

export interface Acorde {
    raiz: number;          // 0 = Do … 11 = Si
    calidad: string;       // «m7», «sus4», «maj7(9)»…
    bajo: number | null;   // Do/Mi → 4
    latina: boolean;       // escrito como Do, Re, Mi…
    mayusculas: boolean;   // DO, RE, MI
    bemol: boolean;        // escrito con bemol (Bb, Sib)
}

// Lo que va encima de la letra: un acorde o un adorno que no se transporta («x2», «|», «N.C.»)
export interface Marca { antes: string; acorde: Acorde | null; despues: string; texto: string }
export interface Trozo { marca?: Marca; texto: string }

export type Linea =
    | { tipo: 'vacia' }
    | { tipo: 'seccion'; texto: string }
    | { tipo: 'nota'; texto: string }
    | { tipo: 'letra'; texto: string }
    | { tipo: 'acordes'; etiqueta?: string; marcas: Marca[] }
    | { tipo: 'mixta'; trozos: Trozo[] }
    | { tipo: 'tab'; texto: string };

export interface Tono { raiz: number; menor: boolean }

export interface CancionLeida {
    lineas: Linea[];
    acordes: Acorde[];     // todos, en orden de aparición (para el tono y la cejilla)
    meta: { titulo?: string; artista?: string; cejilla?: number };
}

const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BEMOLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const A_LATINA: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const DE_LATINA: Record<string, string> = { DO: 'C', RE: 'D', MI: 'E', FA: 'F', SOL: 'G', LA: 'A', SI: 'B' };
const SEMITONO: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const RAIZ = '(DO|RE|MI|FA|SOL|LA|SI|Do|Re|Mi|Fa|Sol|La|Si|[A-G])([#b♯♭]?)';
const CALIDAD = '((?:maj|Maj|MAJ|min|dim|aug|sus|add|alt|no|M|m|\\+|°|º|ø|Δ|-|\\d{1,2}|[#b♯♭](?=\\d)|\\(|\\)|,|\\/(?=\\d))*)';
const RE_ACORDE = new RegExp(`^${RAIZ}${CALIDAD}(?:\\/${RAIZ})?$`);

function nota(raiz: string, alteracion: string) {
    const letra = DE_LATINA[raiz.toUpperCase()] || raiz;
    let n = SEMITONO[letra];
    if (alteracion === '#' || alteracion === '♯') n += 1;
    if (alteracion === 'b' || alteracion === '♭') n -= 1;
    return (n + 12) % 12;
}

export function leerAcorde(texto: string): Acorde | null {
    const m = RE_ACORDE.exec(texto);
    if (!m) return null;
    const [, raiz, alt, calidad, bajoRaiz, bajoAlt] = m;
    // Paréntesis descompensados: «(Am» o «C)» no son acordes, son adornos mal partidos
    if ((calidad.match(/\(/g) || []).length !== (calidad.match(/\)/g) || []).length) return null;
    const latina = raiz.length > 1;
    return {
        raiz: nota(raiz, alt),
        calidad,
        bajo: bajoRaiz ? nota(bajoRaiz, bajoAlt) : null,
        latina,
        mayusculas: latina && raiz === raiz.toUpperCase(),
        bemol: alt === 'b' || alt === '♭',
    };
}

const esMenor = (a: Acorde) => /^(m(?!aj)|min|-)/.test(a.calidad);
const esDisminuido = (a: Acorde) => /^(dim|°|º|ø|m7b5|m7♭5)/.test(a.calidad);

// ---------- Nombres ----------

// bemoles: null = como estaba escrito (solo tiene sentido sin transportar)
export interface OpcionesNombre { semitonos: number; notacion: Notacion; bemoles: boolean | null }

function nombreNota(n: number, bemoles: boolean, latina: boolean, mayusculas: boolean) {
    const americana = (bemoles ? BEMOLES : SOSTENIDOS)[((n % 12) + 12) % 12];
    if (!latina) return americana;
    const raiz = A_LATINA[americana[0]];
    return (mayusculas ? raiz.toUpperCase() : raiz) + americana.slice(1);
}

export function nombreAcorde(a: Acorde, o: OpcionesNombre): string {
    const latina = o.notacion === 'latina' || (o.notacion === 'original' && a.latina);
    const mayusculas = o.notacion === 'original' && a.mayusculas;
    const bemoles = o.bemoles ?? a.bemol;
    let s = nombreNota(a.raiz + o.semitonos, bemoles, latina, mayusculas) + a.calidad;
    if (a.bajo !== null) s += '/' + nombreNota(a.bajo + o.semitonos, bemoles, latina, mayusculas);
    return s;
}

export const nombreMarca = (m: Marca, o: OpcionesNombre) =>
    m.acorde ? m.antes + nombreAcorde(m.acorde, o) + m.despues : m.texto;

export function nombreTono(t: Tono, semitonos: number, notacion: Notacion, bemoles: boolean) {
    return nombreNota(t.raiz + semitonos, bemoles, notacion === 'latina', false) + (t.menor ? 'm' : '');
}

// En Fa, Si♭, Mi♭… (y sus relativos menores) se escribe con bemoles
const TONOS_BEMOL_MAYOR = [5, 10, 3, 8, 1];
const TONOS_BEMOL_MENOR = [2, 7, 0, 5, 10, 3];
export function usaBemoles(tono: Tono | null, semitonos: number, preferencia: Alteraciones) {
    if (preferencia !== 'auto') return preferencia === 'bemoles';
    if (!tono) return false;
    const r = (((tono.raiz + semitonos) % 12) + 12) % 12;
    return (tono.menor ? TONOS_BEMOL_MENOR : TONOS_BEMOL_MAYOR).includes(r);
}

// ---------- Leer líneas ----------

const ADORNO = /^(\|+|\|:|:\||[-–—]+|->|=>|\/+|\.+|…|%|\*+|[xX×]\s?\d+|\d+[xX]|\([xX×]?\d+[xX]?\)|N\.?C\.?|n\.c\.|\(|\)|\[|\]|→|>|~|bis|\(bis\)|:|=|\+)$/;

const SECCIONES = 'intro(?:ducci[oó]n)?|verso|estrofa|estribillo|coro|pre-?coro|pre-?estribillo|puente|solo|interludio|instrumental|final|outro|coda|riff|verse|chorus|pre-?chorus|bridge|hook|refr[aã]o|fin';
const RE_SECCION = new RegExp(`^(?:${SECCIONES})(?:\\s+(?:\\d+|[IVX]+))?(?:\\s+de\\s+\\p{L}+)?\\s*(?:\\(?[xX×]\\s?\\d\\)?)?\\s*:?$`, 'iu');

function marca(token: string): Marca | null {
    const a = leerAcorde(token);
    if (a) return { antes: '', acorde: a, despues: '', texto: token };
    if (ADORNO.test(token)) return { antes: '', acorde: null, despues: '', texto: token };
    // Acorde con algo pegado: «(Am)», «|G», «Em…», «Am,»
    const m = /^([(|[]*)(.+?)([)|\].,:;…*]*)$/.exec(token);
    if (m && (m[1] || m[3])) {
        const b = leerAcorde(m[2]);
        if (b) return { antes: m[1], acorde: b, despues: m[3], texto: token };
    }
    return null;
}

export function esSeccion(linea: string): string | null {
    const s = linea.trim();
    const b = /^\[([^\]]{1,40})\]$/.exec(s);
    if (b && !leerAcorde(b[1])) return b[1].trim();
    if (s.length <= 40 && RE_SECCION.test(s)) return s.replace(/\s*:$/, '');
    return null;
}

const esEtiqueta = (t: string) =>
    (/^[\p{L}][\p{L}\d .'-]*:$/u.test(t) && !leerAcorde(t.slice(0, -1)))
    || RE_SECCION.test(t)
    || (/^\[[^\]]+\]$/.test(t) && !leerAcorde(t.slice(1, -1)));

export function esTab(linea: string) {
    const s = linea.trim();
    return /^[A-Ga-g][#b]?\s*[|:]/.test(s) && (s.match(/-/g) || []).length >= 4 && /^[A-Ga-g][#b]?\s*[|:][\s\-\d|hpbrx/\\~^().*:=<>sPHtTvV]+$/.test(s);
}

interface LineaDeAcordes { etiqueta?: string; marcas: { col: number; marca: Marca }[] }

export function leerLineaAcordes(linea: string): LineaDeAcordes | null {
    const tokens = [...linea.matchAll(/\S+/g)].map(m => ({ t: m[0], col: m.index ?? 0 }));
    if (!tokens.length) return null;
    let etiqueta: string | undefined;
    if (tokens.length > 1 && esEtiqueta(tokens[0].t)) {
        etiqueta = tokens.shift()!.t.replace(/^\[|\]$|:$/g, '');
    }
    const marcas: LineaDeAcordes['marcas'] = [];
    for (const { t, col } of tokens) {
        const m = marca(t);
        if (!m) return null;
        marcas.push({ col, marca: m });
    }
    if (!marcas.some(m => m.marca.acorde)) return null;
    return { etiqueta, marcas };
}

// Acordes encima de la letra → trozos de letra con su acorde al principio
function combinar(acordes: LineaDeAcordes['marcas'], letra: string): Trozo[] {
    const trozos: Trozo[] = [];
    if (acordes[0].col > 0) trozos.push({ texto: letra.slice(0, acordes[0].col) });
    acordes.forEach((a, k) => {
        const fin = k + 1 < acordes.length ? acordes[k + 1].col : undefined;
        trozos.push({ marca: a.marca, texto: letra.slice(a.col, fin) });
    });
    // Un acorde que cae en el hueco entre dos palabras va con la siguiente
    trozos.forEach((t, k) => {
        const m = /^(\s+)(\S[\s\S]*)$/.exec(t.texto);
        if (!t.marca || !m) return;
        if (k > 0) trozos[k - 1].texto += m[1];
        t.texto = m[2];
    });
    // La sangría de la letra no aporta nada
    if (trozos[0] && !trozos[0].marca) {
        trozos[0].texto = trozos[0].texto.trimStart();
        if (!trozos[0].texto) trozos.shift();
    }
    return trozos;
}

// ChordPro: «Te [Am]quiero [G]más»
function leerChordPro(linea: string): Linea | null {
    const partes = linea.split(/\[([^\]]+)\]/);
    if (partes.length < 3) return null;
    const trozos: Trozo[] = [];
    if (partes[0]) trozos.push({ texto: partes[0] });
    for (let i = 1; i < partes.length; i += 2) {
        const m = marca(partes[i]);
        if (!m) return null;
        trozos.push({ marca: m, texto: partes[i + 1] || '' });
    }
    if (trozos.every(t => !t.texto.trim())) {
        return { tipo: 'acordes', marcas: trozos.flatMap(t => (t.marca ? [t.marca] : [])) };
    }
    return { tipo: 'mixta', trozos };
}

const RE_DIRECTIVA = /^\{\s*([\w-]+)\s*(?::\s*(.*?))?\s*\}$/;

// ---------- Limpiar lo pegado ----------

// Lo que se cuela al copiar de una web de acordes y no es la canción
const BASURA = /^(publicidad|anuncio|advertisement|sponsored|imprimir|versi[oó]n para imprimir|transportar|transponer|autoscroll|desplazamiento autom[aá]tico|auto ?scroll|compartir|comentarios?|tama[nñ]o( de letra)?|ver acordes|mostrar acordes|ocultar acordes|acordes para|tutorial|v[ií]deo|report bad tab|print|share|transpose|font|x|cerrar|×)$/i;

export function limpiarTexto(texto: string): string {
    const lineas = texto
        .replace(/\r\n?/g, '\n')
        .replace(/[\u00a0\u2007\u202f]/g, ' ')
        .replace(/[\u200b-\u200d\ufeff]/g, '')
        // Etiquetas de Ultimate Guitar: [ch]Am[/ch], [tab]…[/tab]
        .replace(/\[\/?(ch|tab)\]/g, '')
        .split('\n')
        .map(l => {
            // Tabuladores a espacios (paradas cada 4) para no descolocar los acordes
            let s = '';
            for (const c of l) s += c === '\t' ? ' '.repeat(4 - (s.length % 4)) : c;
            return s.replace(/\s+$/, '');
        })
        .filter(l => !BASURA.test(l.trim()));
    // Como mucho una línea en blanco seguida
    const salida: string[] = [];
    for (const l of lineas) {
        if (!l && (!salida.length || !salida[salida.length - 1])) continue;
        salida.push(l);
    }
    while (salida.length && !salida[salida.length - 1]) salida.pop();
    return salida.join('\n');
}

const RE_CEJILLA = /^(?:capo|cejilla)\s*(?:[:-]|en)?\s*(?:el\s*)?(?:traste\s*)?(\d{1,2})/i;

// Al pegar: título, artista y cejilla si vienen en el texto
export interface DatosPegado { titulo?: string; artista?: string; cejilla?: number; primeraLineaEsTitulo?: boolean }

export function datosDelPegado(texto: string): DatosPegado {
    const lineas = texto.split('\n').map(l => l.trim());
    const datos: DatosPegado = {};
    for (const l of lineas) {
        const d = RE_DIRECTIVA.exec(l);
        if (d) {
            const [, k, v] = d;
            if (/^(title|t)$/i.test(k) && v) datos.titulo = v;
            if (/^(artist|subtitle|st)$/i.test(k) && v && !datos.artista) datos.artista = v;
            if (/^capo$/i.test(k) && v && +v >= 0) datos.cejilla = Math.min(11, +v);
        }
        const c = RE_CEJILLA.exec(l);
        if (c && datos.cejilla === undefined) datos.cejilla = Math.min(11, +c[1]);
    }
    if (!datos.titulo) {
        const primera = lineas.find(l => l);
        const m = primera && /^(.{2,60}?)\s+[-–—]\s+(.{2,40})$/.exec(primera);
        if (primera && m && !leerLineaAcordes(primera) && !esSeccion(primera)) {
            // «Acordes de Canción - Artista» y similares
            datos.titulo = m[1].replace(/^(acordes|letra( y acordes)?|chords|tab)\s+(de|of)\s+/i, '');
            datos.artista = datos.artista || m[2];
            datos.primeraLineaEsTitulo = true;
        }
    }
    return datos;
}

// ---------- Leer la canción ----------

export function leerCancion(texto: string): CancionLeida {
    const crudas = limpiarTexto(texto).split('\n');
    const lineas: Linea[] = [];
    const acordes: Acorde[] = [];
    const meta: CancionLeida['meta'] = {};
    let enTab = false;
    const meter = (l: Linea) => {
        if (l.tipo === 'vacia' && (!lineas.length || lineas[lineas.length - 1].tipo === 'vacia')) return;
        lineas.push(l);
        if (l.tipo === 'acordes') l.marcas.forEach(m => m.acorde && acordes.push(m.acorde));
        if (l.tipo === 'mixta') l.trozos.forEach(t => t.marca?.acorde && acordes.push(t.marca.acorde));
    };
    const esDirectiva = (l: string) => RE_DIRECTIVA.test(l.trim());
    const llevaChordPro = (l: string) => /\[[^\]]+\]/.test(l) && leerChordPro(l) !== null;
    const esLetra = (l: string | undefined): l is string => l !== undefined && l.trim() !== ''
        && !esTab(l) && !esSeccion(l) && !esDirectiva(l) && !leerLineaAcordes(l) && !llevaChordPro(l);
    // Pegado de Word o Docs, con una línea en blanco entre cada línea: si los acordes van casi
    // siempre separados de su letra por un blanco, se juntan igual
    let pegadas = 0, separadas = 0;
    crudas.forEach((l, i) => {
        const a = l.trim() ? leerLineaAcordes(l) : null;
        if (!a || a.etiqueta) return;
        if (esLetra(crudas[i + 1])) pegadas++;
        else if (crudas[i + 1]?.trim() === '' && esLetra(crudas[i + 2])) separadas++;
    });
    const dobleEspacio = separadas >= 3 && separadas > pegadas * 2;

    for (let i = 0; i < crudas.length; i++) {
        const l = crudas[i];
        if (!l.trim()) { meter({ tipo: 'vacia' }); continue; }

        const d = RE_DIRECTIVA.exec(l.trim());
        if (d) {
            const k = d[1].toLowerCase(), v = d[2] || '';
            if (k === 'title' || k === 't') meta.titulo = v;
            else if (k === 'artist' || k === 'subtitle' || k === 'st') meta.artista = meta.artista || v;
            else if (k === 'capo' && +v >= 0) meta.cejilla = Math.min(11, +v);
            else if (['comment', 'c', 'ci', 'cb', 'comment_italic', 'comment_box', 'highlight'].includes(k) && v) meter({ tipo: 'nota', texto: v });
            else if (k === 'start_of_chorus' || k === 'soc') meter({ tipo: 'seccion', texto: v || 'Estribillo' });
            else if (k === 'start_of_verse' || k === 'sov') { if (v) meter({ tipo: 'seccion', texto: v }); }
            else if (k === 'start_of_bridge' || k === 'sob') meter({ tipo: 'seccion', texto: v || 'Puente' });
            else if (k === 'start_of_tab' || k === 'sot') enTab = true;
            else if (k === 'end_of_tab' || k === 'eot') enTab = false;
            continue;
        }

        if (enTab || esTab(l)) { meter({ tipo: 'tab', texto: l }); continue; }

        // «Cejilla 2» va a los controles, no al texto (si no, se contradice al cambiarla)
        const capo = RE_CEJILLA.exec(l.trim());
        if (capo && l.trim().length <= 40) { meta.cejilla = Math.min(11, +capo[1]); continue; }

        const seccion = esSeccion(l);
        if (seccion) { meter({ tipo: 'seccion', texto: seccion }); continue; }

        if (/\[[^\]]+\]/.test(l)) {
            const cp = leerChordPro(l);
            if (cp) { meter(cp); continue; }
        }

        const enLinea = leerLineaAcordes(l);
        if (enLinea) {
            const salto = esLetra(crudas[i + 1]) ? 1
                : dobleEspacio && crudas[i + 1]?.trim() === '' && esLetra(crudas[i + 2]) ? 2 : 0;
            if (!enLinea.etiqueta && salto) {
                meter({ tipo: 'mixta', trozos: combinar(enLinea.marcas, crudas[i + salto]) });
                i += salto;
            } else {
                meter({ tipo: 'acordes', etiqueta: enLinea.etiqueta, marcas: enLinea.marcas.map(m => m.marca) });
            }
            continue;
        }

        meter({ tipo: 'letra', texto: l });
    }
    while (lineas.length && lineas[lineas.length - 1].tipo === 'vacia') lineas.pop();
    return { lineas, acordes, meta };
}

// Cuántas líneas de letra tiene (con o sin acordes encima): una chuleta de acordes o una
// ficha del setlist apenas tienen; una canción entera, muchas
export function lineasDeLetra(leida: CancionLeida): number {
    return leida.lineas.filter(l => l.tipo === 'mixta' || l.tipo === 'letra').length;
}

// Acordes por un lado y letra por otro (la chuleta de acordes y, debajo, la letra pegada
// aparte): cada fila de acordes se pone encima de su línea de letra, repartida por las
// palabras, como en LaCuerda. Devuelve null si no tiene esa forma o ya están juntos
const RE_SIN_LETRA = /^(intro|solo|interludio|instrumental|riff|final|outro|coda|puente instrumental)\b/i;

function repartir(fila: string, letra: string): string {
    const acordes = fila.trim().split(/\s+/);
    const palabras = [...letra.matchAll(/\S+/g)].map(m => m.index ?? 0);
    let linea = '';
    acordes.forEach((a, k) => {
        const objetivo = palabras.length ? palabras[Math.min(palabras.length - 1, Math.floor((k * palabras.length) / acordes.length))] : 0;
        linea = linea.padEnd(linea ? Math.max(objetivo, linea.length + 1) : objetivo) + a;
    });
    return linea;
}

export function juntarAcordesYLetra(texto: string): string | null {
    const crudas = limpiarTexto(texto).split('\n');
    const esFila = (l: string | undefined) => { const a = l?.trim() ? leerLineaAcordes(l) : null; return !!a && !a.etiqueta; };
    const esLetra = (l: string | undefined) => !!l?.trim() && !leerLineaAcordes(l) && !esSeccion(l) && !esTab(l) && !RE_DIRECTIVA.test(l.trim());
    // Ya juntos: filas con su letra justo debajo
    if (crudas.filter((l, i) => esFila(l) && esLetra(crudas[i + 1])).length > 2) return null;

    // Las filas que van con letra (las de intro y solos se quedan como están)
    const filas: number[] = [];
    let seccion = '';
    // Una fila por línea de letra va en bloques (dos o más seguidas) y sin guiones; una sola
    // fila bajo cada sección o «G – C – D» es el resumen de la progresión, no se reparte
    const deLinea = (i: number) => esFila(crudas[i]) && !/\s[-–—]\s/.test(crudas[i]);
    crudas.forEach((l, i) => {
        const s = esSeccion(l);
        if (s || !l.trim()) { seccion = s ?? ''; return; }   // el intro o el solo acaban en el primer blanco
        if (deLinea(i) && (deLinea(i - 1) || deLinea(i + 1)) && !RE_SIN_LETRA.test(seccion)) filas.push(i);
    });
    if (filas.length < 4) return null;
    const ultima = filas[filas.length - 1];
    const letras = crudas.map((l, i) => (i > ultima && esLetra(l) ? i : -1)).filter(i => i >= 0);
    if (letras.length < 4) return null;

    const primera = filas[0];
    const enFilas = new Set(filas);
    const salida = crudas.slice(0, primera);
    // Lo que había entre las filas y no es fila (solos, intros a mitad) se queda, sin blancos repetidos
    const entre = crudas.slice(primera, ultima + 1).filter((l, k) => !enFilas.has(primera + k) && l.trim() && !/^letra$/i.test(esSeccion(l) ?? ''));
    const resto = entre.filter((l, k) => !esSeccion(l) || (entre[k + 1] !== undefined && !esSeccion(entre[k + 1])));
    let n = 0;
    for (const l of crudas.slice(ultima + 1)) {
        if (/^letra$/i.test(esSeccion(l) ?? '')) continue;
        if (esLetra(l) && n < filas.length) salida.push(repartir(crudas[filas[n++]], l));
        salida.push(l);
    }
    // Si sobran acordes, al final; nada se pierde
    const sobran = filas.slice(n).map(i => crudas[i]);
    if (sobran.length) salida.push('', ...sobran);
    if (resto.length) salida.push('', ...resto);
    return salida.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Para que una línea larga pueda partirse en el móvil: se agrupa por palabras y un
// acorde nunca se separa de la sílaba que lleva debajo.
export function enPalabras(trozos: Trozo[]): Trozo[][] {
    const grupos: Trozo[][] = [];
    let actual: Trozo[] = [];
    for (const t of trozos) {
        const partes = t.texto.match(/\S*\s*/g)?.filter(Boolean) ?? [];
        if (!partes.length) partes.push('');
        partes.forEach((p, k) => {
            actual.push({ marca: k === 0 ? t.marca : undefined, texto: p });
            if (/\s$/.test(p)) { grupos.push(actual); actual = []; }
        });
    }
    if (actual.length) grupos.push(actual);
    return grupos;
}

// Estrofas: lo que va entre líneas en blanco. Un título de sección suelto se une a lo que sigue.
export function enEstrofas(lineas: Linea[]): Linea[][] {
    const estrofas: Linea[][] = [];
    let actual: Linea[] = [];
    for (const l of lineas) {
        if (l.tipo === 'vacia') {
            if (actual.length && !actual.every(x => x.tipo === 'seccion')) { estrofas.push(actual); actual = []; }
            continue;
        }
        actual.push(l);
    }
    if (actual.length) estrofas.push(actual);
    return estrofas;
}

// ---------- Tono y cejilla ----------

// Grados de la escala: [semitonos desde la tónica, tipo de acorde]
type Clase = 'M' | 'm' | 'd';
const GRADOS_MAYOR: [number, Clase][] = [[0, 'M'], [2, 'm'], [4, 'm'], [5, 'M'], [7, 'M'], [9, 'm'], [11, 'd']];
const GRADOS_MENOR: [number, Clase][] = [[0, 'm'], [2, 'd'], [3, 'M'], [5, 'm'], [7, 'm'], [7, 'M'], [8, 'M'], [10, 'M']];
const clase = (a: Acorde): Clase => (esDisminuido(a) ? 'd' : esMenor(a) ? 'm' : 'M');

export function detectarTono(acordes: Acorde[]): Tono | null {
    if (!acordes.length) return null;
    let mejor: { tono: Tono; puntos: number } | null = null;
    for (let raiz = 0; raiz < 12; raiz++) {
        for (const menor of [false, true]) {
            const grados = menor ? GRADOS_MENOR : GRADOS_MAYOR;
            const tonica: Clase = menor ? 'm' : 'M';
            let puntos = 0;
            for (const a of acordes) {
                const g = (a.raiz - raiz + 12) % 12;
                const c = clase(a);
                if (grados.some(([s, k]) => s === g && k === c)) puntos += g === 0 && c === tonica ? 2 : 1;
                else puntos -= 0.5;
            }
            const primero = acordes[0], ultimo = acordes[acordes.length - 1];
            if (primero.raiz === raiz && clase(primero) === tonica) puntos += 2;
            if (ultimo.raiz === raiz && clase(ultimo) === tonica) puntos += 2.5;
            if (!mejor || puntos > mejor.puntos) mejor = { tono: { raiz, menor }, puntos };
        }
    }
    return mejor?.tono ?? null;
}

// Las posturas abiertas de guitarra que sabe tocar cualquiera
const FACILES = new Set([
    'C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em',
    'A7', 'B7', 'C7', 'D7', 'E7', 'G7', 'Am7', 'Dm7', 'Em7',
    'Cmaj7', 'Dmaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Emaj7',
    'Asus2', 'Asus4', 'Dsus2', 'Dsus4', 'Esus4', 'Cadd9', 'E5', 'A5', 'D5', 'G6', 'A6', 'D6', 'E6',
]);
const facil = (a: Acorde, semitonos: number) => FACILES.has(SOSTENIDOS[(((a.raiz + semitonos) % 12) + 12) % 12] + a.calidad);

// La cejilla con la que la canción se toca con más posturas abiertas, sonando igual
export function cejillaRecomendada(acordes: Acorde[], semitonos: number): { cejilla: number; dificiles: number } | null {
    if (!acordes.length) return null;
    let mejor: { cejilla: number; dificiles: number } | null = null;
    for (let cejilla = 0; cejilla <= 7; cejilla++) {
        const dificiles = acordes.filter(a => !facil(a, semitonos - cejilla)).length;
        if (!mejor || dificiles < mejor.dificiles) mejor = { cejilla, dificiles };
    }
    return mejor;
}

export const cuantosDificiles = (acordes: Acorde[], semitonos: number) => acordes.filter(a => !facil(a, semitonos)).length;

// ---- Varias canciones de golpe (un repertorio entero en un archivo o pegado) ----

// Se separan con {new_song} / {ns} (ChordPro) o con una línea que solo tenga --- o ===
export function separarCanciones(texto: string): { titulo: string; artista: string; texto: string }[] {
    const bloques = texto.replace(/\r\n?/g, '\n').split(/^[ \t]*(?:\{\s*(?:new_song|ns)\s*\}|-{3,}|={3,})[ \t]*$/m);
    const canciones: { titulo: string; artista: string; texto: string }[] = [];
    for (const bloque of bloques) {
        let limpio = limpiarTexto(bloque);
        if (!limpio.trim()) continue;
        const datos = datosDelPegado(limpio);
        const { artista } = datos;
        let { titulo } = datos;
        if (datos.primeraLineaEsTitulo) {
            limpio = limpio.split('\n').slice(1).join('\n').replace(/^\n+/, '');
        } else if (!titulo) {
            // Una primera línea suelta que no es ni acordes ni sección es el título
            const lineas = limpio.split('\n');
            const primera = lineas[0].trim();
            if (primera.length <= 80 && !leerLineaAcordes(primera) && !esSeccion(primera) && !/[[{]/.test(primera)) {
                titulo = primera;
                limpio = lineas.slice(1).join('\n').replace(/^\n+/, '');
            }
        }
        canciones.push({ titulo: titulo || 'Sin título', artista: artista || '', texto: limpio });
    }
    return canciones;
}

// ---- Añadir la letra a una ficha o chuleta: lo copiado de una web, en el tono del setlist ----

// Cuántos semitonos hay que mover una canción (escrita como esté) para que caiga en el tono de
// destino: el que mejor encaja, pesando más el principio (hay temas que modulan al final). Las
// rumbas «en Mi» (arrancan en Mi y llevan Fa y Sol: la cadencia andaluza) llevan ese Mi al destino.
export function semitonosHacia(acordes: Acorde[], destino: Acorde): number {
    if (!acordes.length) return 0;
    const menor = esMenor(destino);
    const abre = acordes[0];
    const mod = (n: number) => ((n % 12) + 12) % 12;
    const hay = (raiz: number, s: number) => acordes.some(a => mod(a.raiz + s) === mod(raiz) && !esMenor(a));
    const sAbre = ((mod(destino.raiz - abre.raiz) + 5) % 12) - 5;
    if (!menor && !esMenor(abre) && hay(destino.raiz + 1, sAbre) && hay(destino.raiz + 3, sAbre)) return sAbre;
    const grados = menor ? GRADOS_MENOR : GRADOS_MAYOR;
    let mejor = -Infinity, elegido = 0;
    for (let s = -5; s <= 6; s++) {
        let p = 0;
        acordes.forEach((a, i) => {
            const g = mod(a.raiz + s - destino.raiz), c = clase(a);
            const peso = i < acordes.length * 0.6 ? 1.5 : 1;
            if (grados.some(([x, k]) => x === g && k === c)) p += (g === 0 && c === (menor ? 'm' : 'M') ? 2 : 1) * peso;
            else p -= 0.5 * peso;
            if (i === 0 && g === 0) p += 2;
        });
        p -= Math.abs(s) * 0.01;
        if (p > mejor) { mejor = p; elegido = s; }
    }
    return elegido;
}

// Al copiar con «Seleccionar todo» viene la página entera: se queda de la primera línea de
// acordes a la última (más la letra que cuelga de ella), y fuera la cejilla de la web
export function recortarCancion(texto: string): string {
    const lineas = limpiarTexto(texto).split('\n').filter(l => !RE_CEJILLA.test(l.trim()) && !/^\s*(tono|key)\s*:/i.test(l));
    const conAcordes = lineas.map((l, i) => (leerLineaAcordes(l) ? i : -1)).filter(i => i >= 0);
    if (!conAcordes.length) return lineas.join('\n').trim();
    let desde = conAcordes[0], hasta = conAcordes[conAcordes.length - 1];
    // La sección que lo anuncia («Intro», «[Verso]») se queda
    if (desde > 0 && esSeccion(lineas[desde - 1])) desde--;
    let extra = 0;
    const finDeLaWeb = /^\s*(comentarios?|publicidad|anuncio|versi[oó]n para imprimir|imprimir|compartir|valora|votos?|enviad[ao]|tutorial|v[ií]deo|©|https?:)/i;
    while (hasta + 1 < lineas.length && lineas[hasta + 1].trim() && !finDeLaWeb.test(lineas[hasta + 1]) && extra < 6) { hasta++; extra++; }
    return lineas.slice(desde, hasta + 1).join('\n').trim();
}
