// Abrir en el cancionero los documentos de siempre: Word (.docx, también un Google Docs
// descargado como Word) y PDF. Cada línea se rehace a partir de dónde estaba cada letra en el
// documento, para que los acordes sigan encima de su sílaba en el lector (que es de ancho
// fijo), y se limpia como se limpiaron a mano los Docs de Víctor: párrafos vacíos entre
// líneas, rótulos en mayúsculas (CORO, ENTRAMOS TODOS…) como secciones, «TONO G», «SOl»,
// asteriscos y rayas. Un documento con varias canciones (con títulos, o «3 - LA FLACA») sale
// partido. mammoth y pdf.js se cargan solo al abrir un archivo, cada uno en su trozo.
import { esSeccion, leerAcorde, leerLineaAcordes, separarCanciones } from './acordes';

// setlist: el documento entero es un setlist («Hace calor — G»…): el texto va tal cual
export interface CancionDeArchivo { titulo: string; artista: string; texto: string; setlist?: boolean }
// Quien llama dice qué es un setlist (lib/setlist.ts): así ese código no viaja dos veces
export type EsSetlist = (texto: string) => boolean;

// ---------- Anchos de las letras ----------

// Cuánto ocupa cada letra en Arial/Helvetica, en milésimas de eme (del espacio a «~»). Quien
// alinea los acordes con espacios en Docs o Word los pone a ojo con estos anchos: un espacio
// es la mitad de una letra, así que hacen falta el doble de espacios que de letras
const HELVETICA = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
    667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
    278, 278, 278, 469, 556, 333,
    556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
    334, 260, 334, 584,
];
const OTRAS: Record<string, number> = {
    '–': 556, '—': 1000, '…': 1000, '‘': 222, '’': 222, '“': 333, '”': 333, '«': 556, '»': 556,
    '¿': 611, '¡': 333, '·': 278, '♯': 556, '♭': 556, '°': 400, 'º': 365, 'ª': 370, '→': 1000,
};
const MONO = 0.6;   // Courier y compañía: todas las letras iguales

function anchoLetra(c: string): number {
    const n = c.charCodeAt(0);
    if (n >= 32 && n <= 126) return HELVETICA[n - 32] / 1000;
    if (OTRAS[c]) return OTRAS[c] / 1000;
    const b = c.normalize('NFD').charCodeAt(0);   // á → a
    return b >= 32 && b <= 126 ? HELVETICA[b - 32] / 1000 : 0.556;
}

const RE_MONO = /courier|mono|consol|menlo|monaco|lucida console|typewriter|andale|inconsolata|fira code|source code|cousine|fixedsys/i;

// ---------- Lo que se saca del documento ----------

interface Letra { c: string; x: number; a: number; b?: boolean }   // carácter, dónde empieza y cuánto ocupa (en emes), negrita
interface Linea {
    letras: Letra[];        // como se ve en el documento
    columnas?: Letra[];     // Word: como si fuera de ancho fijo (lo tecleado, espacio a espacio)
    negrita: boolean;
    nivel: number;          // 0 texto; 1, 2… títulos, de más a menos importante
    subtitulo?: boolean;
    numerada?: boolean;     // Word: un párrafo de una lista numerada (el número no está en el texto)
}

// Espacios raros a espacio normal; invisibles fuera
const limpiarLetras = (s: string) => s
    .replace(/[\u00a0\u2007\u202f\u2002-\u2006\u2009\u200a]/g, ' ')
    .replace(/[\u200b-\u200d\ufeff\u00ad\r]/g, '')
    .replace(/\u2011/g, '-');

// ---------- Word (.docx) ----------

// El documento como lo deja mammoth (solo lo que se usa aquí)
interface Nodo {
    type: string;
    children?: Nodo[];
    value?: string;
    styleName?: string | null;
    styleId?: string | null;
    numbering?: { isOrdered?: boolean } | null;
    alignment?: string | null;
    indent?: { start?: string | null; firstLine?: string | null; hanging?: string | null };
    isBold?: boolean;
    isAllCaps?: boolean;
    font?: string | null;
    fontSize?: number | null;
    breakType?: string;
}

interface Pieza { texto?: string; tab?: true; salto?: true; negrita?: boolean; mono?: boolean; tamano?: number | null }

function nivelDeEstilo(p: Nodo): number {
    const nombre = `${p.styleName ?? ''} ${p.styleId ?? ''}`;
    const t = /(?:heading|t[ií]?tulo|encabezado)\s*([1-6])/i.exec(nombre);
    if (t) return +t[1] + 1;
    return /\b(title|t[ií]tulo)\b/i.test(nombre) && !/subt/i.test(nombre) ? 1 : 0;
}

async function lineasDeWord(datos: ArrayBuffer): Promise<Linea[]> {
    const mammoth = (await import('./lectorWord')).default;
    let raiz: Nodo | null = null;
    try {
        await mammoth.convertToHtml({ arrayBuffer: datos }, {
            // Se lee el documento tal cual (negritas, letra, tabuladores, títulos); el HTML no hace falta
            transformDocument: (d: Nodo) => { raiz = d; return { ...d, children: [] }; },
        });
    } catch {
        throw new Error('No es un Word (.docx) que se pueda abrir. Si es un .doc antiguo, guárdalo como .docx.');
    }
    if (!raiz) return [];

    const parrafos: { piezas: Pieza[]; p: Nodo }[] = [];
    const juntar = (n: Nodo, piezas: Pieza[], run: Omit<Pieza, 'texto'> & { caps?: boolean }) => {
        if (n.type === 'text' && n.value) piezas.push({ ...run, texto: run.caps ? n.value.toUpperCase() : n.value });
        else if (n.type === 'tab') piezas.push({ tab: true });
        else if (n.type === 'break') piezas.push({ salto: true });
        else if (n.type === 'run') {
            const estilo = { negrita: !!n.isBold, caps: !!n.isAllCaps, mono: RE_MONO.test(n.font ?? ''), tamano: n.fontSize };
            n.children?.forEach(h => juntar(h, piezas, estilo));
        } else n.children?.forEach(h => juntar(h, piezas, run));
    };
    const recorrer = (n: Nodo) => {
        if (n.type === 'paragraph') {
            const piezas: Pieza[] = [];
            n.children?.forEach(h => juntar(h, piezas, {}));
            parrafos.push({ piezas, p: n });
        } else n.children?.forEach(recorrer);
    };
    recorrer(raiz);

    // El tamaño de letra más usado es la medida de todo (las sangrías y los tabuladores van en puntos)
    const usos = new Map<number, number>();
    parrafos.forEach(({ piezas }) => piezas.forEach(p => p.texto && p.tamano && usos.set(p.tamano, (usos.get(p.tamano) ?? 0) + p.texto.length)));
    const base = [...usos].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 11;
    const paso = 36 / base;   // un tabulador: hasta la siguiente parada de media pulgada

    const posiciones = (piezas: Pieza[], columnas: boolean, inicio: number, resto: number): Letra[][] => {
        const lineas: Letra[][] = [[]];
        let x = inicio;
        for (const p of piezas) {
            if (p.salto) { lineas.push([]); x = resto; continue; }
            if (p.tab) { x = (Math.floor(x / paso + 0.001) + 1) * paso; continue; }
            const escala = columnas ? 1 : (p.tamano ?? base) / base;
            for (const c of limpiarLetras(p.texto ?? '')) {
                const a = (columnas || p.mono ? MONO : anchoLetra(c)) * escala;
                lineas[lineas.length - 1].push({ c, x, a, b: p.negrita });
                x += a;
            }
        }
        return lineas;
    };
    // Centrado o a la derecha: lo que cuenta es dónde queda respecto a la línea de al lado
    const alinear = (letras: Letra[], alineacion: string | null | undefined) => {
        const llenas = letras.filter(l => l.c.trim());
        if (!llenas.length || !alineacion || !/center|right|end/.test(alineacion)) return letras;
        const fin = llenas[llenas.length - 1].x + llenas[llenas.length - 1].a;
        const mover = alineacion === 'center' ? -(llenas[0].x + fin) / 2 : -fin;
        return letras.map(l => ({ ...l, x: l.x + mover }));
    };

    const lineas: Linea[] = [];
    for (const { piezas, p } of parrafos) {
        const twips = (v: string | null | undefined) => (Number(v) || 0) / 20 / base;
        const sangria = twips(p.indent?.start);
        const primera = sangria + twips(p.indent?.firstLine) - twips(p.indent?.hanging);
        const reales = posiciones(piezas, false, primera, sangria);
        const tecleadas = posiciones(piezas, true, primera, sangria);
        const nivel = nivelDeEstilo(p);
        reales.forEach((letras, k) => {
            const llenas = letras.filter(l => l.c.trim());
            lineas.push({
                letras: alinear(letras, p.alignment),
                columnas: alinear(tecleadas[k], p.alignment),
                negrita: llenas.length > 0 && llenas.every(l => l.b),
                nivel,
                subtitulo: /subt/i.test(`${p.styleName ?? ''} ${p.styleId ?? ''}`),
                numerada: !!p.numbering?.isOrdered,
            });
        });
    }
    return lineas;
}

// ---------- PDF ----------

interface Trozo { x: number; y: number; ancho: number; tam: number; texto: string; mono: boolean }

async function lineasDePdf(datos: ArrayBuffer): Promise<Linea[]> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
    }
    // Solo se saca el texto: sin pintar ni cargar las letras del PDF en la página
    const tarea = pdfjs.getDocument({ data: new Uint8Array(datos), disableFontFace: true, verbosity: 0 });
    const paginas: Trozo[][] = [];
    try {
        let doc;
        try {
            doc = await tarea.promise;
        } catch (e) {
            if ((e as { name?: string }).name === 'PasswordException') throw new Error('El PDF tiene contraseña: quítasela y vuelve a probar.');
            // El lector de PDF se baja la primera vez que se abre uno: sin cobertura no llega
            if (/worker/i.test((e as { message?: string }).message ?? '')) throw new Error('No se pudo cargar el lector de PDF: mira la conexión y vuelve a probar.');
            throw new Error('No parece un PDF que se pueda leer.');
        }
        for (let n = 1; n <= doc.numPages; n++) {
            const pagina = await doc.getPage(n);
            const contenido = await pagina.getTextContent();
            const trozos: Trozo[] = [];
            for (const it of contenido.items) {
                if (!('str' in it) || !it.str) continue;
                const [a, b, c, d, e, f] = it.transform as number[];
                if (Math.abs(b) > Math.abs(a) * 0.1) continue;   // texto girado: no es la canción
                const tam = Math.hypot(c, d) || it.height;
                if (!tam) continue;
                trozos.push({ x: e, y: f, ancho: it.width, tam, texto: limpiarLetras(it.str), mono: contenido.styles[it.fontName]?.fontFamily === 'monospace' });
            }
            paginas.push(trozos);
            pagina.cleanup();
        }
    } finally {
        void tarea.destroy();
    }

    // La letra del cuerpo (la más usada) es la medida
    const usos = new Map<number, number>();
    paginas.flat().forEach(t => { const k = Math.round(t.tam * 2) / 2; usos.set(k, (usos.get(k) ?? 0) + t.texto.length); });
    const cuerpo = [...usos].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!cuerpo || !paginas.flat().some(t => t.texto.trim())) throw new Error('Este PDF no tiene texto: parece una foto o un escaneo.');
    // Los títulos van más grandes: cada tamaño, un nivel
    const grandes = [...usos.keys()].filter(t => t >= cuerpo * 1.2).sort((a, b) => b - a);

    // Renglones: los trozos a la misma altura, de izquierda a derecha
    const renglones = paginas.map(trozos => {
        const ordenados = [...trozos].sort((p, q) => q.y - p.y || p.x - q.x);
        const filas: { y: number; tam: number; trozos: Trozo[] }[] = [];
        for (const t of ordenados) {
            const fila = filas.find(f => Math.abs(f.y - t.y) <= 0.4 * Math.min(cuerpo, t.tam));
            if (fila) { fila.trozos.push(t); fila.tam = Math.max(fila.tam, t.tam); } else filas.push({ y: t.y, tam: t.tam, trozos: [t] });
        }
        filas.sort((p, q) => q.y - p.y);
        return filas.map(f => {
            const letras: Letra[] = [];
            for (const t of f.trozos.sort((p, q) => p.x - q.x)) {
                // Cada letra, en su sitio: el ancho del trozo repartido según lo que ocupa cada una
                const anchos = [...t.texto].map(c => (t.mono ? MONO : anchoLetra(c)));
                const total = anchos.reduce((s, a) => s + a, 0);
                const escala = total && t.ancho ? t.ancho / total / cuerpo : t.tam / cuerpo;
                let x = t.x / cuerpo;
                [...t.texto].forEach((c, k) => { letras.push({ c, x, a: anchos[k] * escala }); x += anchos[k] * escala; });
            }
            const k = Math.round(f.tam * 2) / 2;
            // Acordes en negrita y más grandes que la letra: siguen siendo acordes, no un título
            const nivel = grandes.includes(k) && !leerLineaAcordes(palabras(letras).map(p => p.texto).join(' ')) ? grandes.indexOf(k) + 1 : 0;
            return { y: f.y, letras, nivel, subtitulo: !nivel && Math.abs(k - cuerpo) > cuerpo * 0.05 };
        });
    });

    // Cabeceras y pies: el número de página, o lo mismo arriba (o abajo) en varias páginas
    const texto = (r: { letras: Letra[] }) => r.letras.map(l => l.c).join('').replace(/\s+/g, ' ').trim();
    const repetidas = (cual: (rs: { letras: Letra[] }[]) => { letras: Letra[] } | undefined) => {
        const cuenta = new Map<string, number>();
        renglones.forEach(rs => { const r = cual(rs); if (r) cuenta.set(texto(r), (cuenta.get(texto(r)) ?? 0) + 1); });
        return new Set([...cuenta].filter(([, n]) => n >= 2 && n >= renglones.length / 2).map(([t]) => t));
    };
    const arriba = repetidas(rs => rs[0]), abajo = repetidas(rs => rs[rs.length - 1]);
    const numero = /^(p[aá]g(ina)?\.?\s*)?\d{1,3}(\s*(de|\/|of)\s*\d{1,3})?$/i;

    // El espacio normal entre renglones; uno mucho mayor es una estrofa nueva (o dos, si es enorme)
    const saltos = renglones.flatMap(rs => rs.slice(1).map((r, k) => rs[k].y - r.y)).filter(s => s > 0 && s < cuerpo * 5).sort((a, b) => a - b);
    const normal = Math.max(saltos[Math.floor(saltos.length * 0.3)] ?? cuerpo * 1.2, cuerpo * 0.9);

    const lineas: Linea[] = [];
    renglones.forEach((rs, p) => {
        const utiles = rs.filter((r, k) => {
            const t = texto(r);
            if ((k === 0 || k === rs.length - 1) && numero.test(t)) return false;
            return !((k === 0 && arriba.has(t)) || (k === rs.length - 1 && abajo.has(t)));
        });
        // Entre páginas, una estrofa nueva (salvo que la página acabe en una línea de acordes)
        const anterior = lineas[lineas.length - 1];
        if (p > 0 && anterior?.letras.length && !leerLineaAcordes(texto(anterior))) lineas.push({ letras: [], negrita: false, nivel: 0 });
        utiles.forEach((r, k) => {
            if (k > 0) {
                const hueco = (utiles[k - 1].y - r.y) / normal;
                if (hueco > 1.4) for (let n = Math.max(1, Math.round(hueco) - 1); n > 0; n--) lineas.push({ letras: [], negrita: false, nivel: 0 });
            }
            lineas.push({ letras: r.letras, negrita: false, nivel: r.nivel, subtitulo: r.subtitulo });
        });
    });
    return lineas;
}

// ---------- De letras colocadas a texto de ancho fijo ----------

interface Palabra { texto: string; x: number; fin: number; letras: Letra[] }

function palabras(letras: Letra[]): Palabra[] {
    const salida: Palabra[] = [];
    let actual: Letra[] = [];
    const cerrar = () => {
        if (!actual.length) return;
        const ultima = actual[actual.length - 1];
        salida.push({ texto: actual.map(l => l.c).join(''), x: actual[0].x, fin: ultima.x + ultima.a, letras: actual });
        actual = [];
    };
    for (const l of letras) {
        if (!l.c.trim()) { cerrar(); continue; }
        const previa = actual[actual.length - 1];
        // En un PDF las palabras pueden venir sin espacio entre medias: las separa el hueco
        if (previa && l.x - (previa.x + previa.a) > 0.15) cerrar();
        actual.push(l);
    }
    cerrar();
    return salida;
}

// Una línea tal cual, con tantos espacios como cabían en cada hueco (al menos uno)
function natural(pals: Palabra[], medio: number): { texto: string; puntos: { x: number; col: number }[] } {
    let texto = '';
    const puntos: { x: number; col: number }[] = [];
    pals.forEach((p, k) => {
        if (k > 0) texto += ' '.repeat(Math.max(1, Math.round((p.x - pals[k - 1].fin) / medio)));
        p.letras.forEach((l, j) => puntos.push({ x: l.x, col: texto.length + j }));
        texto += p.texto;
    });
    if (pals.length) puntos.push({ x: pals[pals.length - 1].fin, col: texto.length });
    return { texto, puntos };
}

// La columna de la letra que hay debajo de x (entre dos letras, a proporción)
function columnaEn(x: number, puntos: { x: number; col: number }[], medio: number): number {
    const primero = puntos[0], ultimo = puntos[puntos.length - 1];
    if (x <= primero.x) return primero.col - Math.round((primero.x - x) / medio);
    if (x >= ultimo.x) return ultimo.col + Math.round((x - ultimo.x) / medio);
    let k = 1;
    while (puntos[k].x < x) k++;
    const a = puntos[k - 1], b = puntos[k];
    return Math.round(a.col + ((x - a.x) / (b.x - a.x || 1)) * (b.col - a.col));
}

// «SOl», «sOL»: notas latinas mal tecleadas (mayúsculas y minúsculas mezcladas). Solo se
// arreglan si así la línea pasa a ser de acordes (si no, puede ser letra)
const NOTAS_LATINAS = ['SOL', 'DO', 'RE', 'MI', 'FA', 'LA', 'SI'];
function arreglarLatinas(letras: Letra[]) {
    const pals = palabras(letras);
    const arreglos = pals.map(p => {
        for (const n of NOTAS_LATINAS) {
            const raiz = p.texto.slice(0, n.length);
            if (raiz.toUpperCase() !== n || raiz === n || raiz === n[0] + n.slice(1).toLowerCase() || raiz === raiz.toLowerCase()) continue;
            return n + p.texto.slice(n.length);
        }
        return p.texto;
    });
    if (arreglos.every((t, k) => t === pals[k].texto)) return;
    if (leerLineaAcordes(pals.map(p => p.texto).join(' ')) || !leerLineaAcordes(arreglos.join(' '))) return;
    pals.forEach((p, k) => p.letras.forEach((l, j) => { l.c = arreglos[k][j]; }));
}

type Clase = 'vacia' | 'acordes' | 'letra' | 'otra';
function clase(texto: string): Clase {
    if (!texto.trim()) return 'vacia';
    const a = leerLineaAcordes(texto);
    if (a) return a.etiqueta ? 'otra' : 'acordes';
    return esSeccion(texto) || /^\[[^\]]+\]$/.test(texto.trim()) ? 'otra' : 'letra';
}

// Las líneas de una canción, en texto de ancho fijo: cada línea de acordes se recoloca sobre
// la letra de debajo según dónde quedaban sus acordes. Cuenta también cuántos acordes caen al
// principio de una palabra (para saber si el documento se alineó en Arial o en ancho fijo)
function maquetar(filas: { letras: Letra[]; fija?: string }[], medio: number) {
    const pals = filas.map(f => palabras(f.letras));
    const textos = filas.map((f, i) => f.fija ?? natural(pals[i], medio).texto);
    const clases = textos.map(clase);
    // Acordes, blanco y letra (Docs con un párrafo vacío entre líneas): se juntan si es lo habitual
    let pegadas = 0, separadas = 0;
    clases.forEach((c, i) => {
        if (c !== 'acordes') return;
        if (clases[i + 1] === 'letra') pegadas++;
        else if (clases[i + 1] === 'vacia' && clases[i + 2] === 'letra') separadas++;
    });
    const saltar = separadas >= 2 && separadas >= pegadas;

    const salida: string[] = [];
    const origen: number[] = [];
    let aciertos = 0, total = 0;
    for (let i = 0; i < filas.length; i++) {
        const j = clases[i] !== 'acordes' ? -1
            : clases[i + 1] === 'letra' ? i + 1
                : saltar && clases[i + 1] === 'vacia' && clases[i + 2] === 'letra' ? i + 2 : -1;
        if (j < 0) { salida.push(textos[i]); origen.push(i); continue; }
        const letra = natural(pals[j], medio);
        let cols: number[] = [];
        pals[i].forEach((p, k) => {
            const col = columnaEn(p.x, letra.puntos, medio);
            cols.push(k ? Math.max(col, cols[k - 1] + pals[i][k - 1].texto.length + 1) : col);
        });
        // Un acorde antes de que empiece la letra: la letra se corre a la derecha
        const sobra = Math.max(0, -Math.min(...cols));
        cols = cols.map(c => c + sobra);
        const texto = ' '.repeat(sobra) + letra.texto;
        let linea = '';
        pals[i].forEach((p, k) => { linea = linea.padEnd(cols[k]) + p.texto; });
        cols.forEach(c => {
            total++;
            if ([c - 1, c, c + 1].some(n => n >= 0 && texto[n]?.trim() && (n === 0 || texto[n - 1] === ' '))) aciertos++;
        });
        salida.push(linea, texto);
        origen.push(i, j);
        i = j;
    }
    return { salida, origen, aciertos, total };
}

// ---------- Limpiar y partir en canciones ----------

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\d]+/gu, ' ').trim();
const enMayusculas = (s: string) => /\p{Lu}/u.test(s) && s === s.toUpperCase();
const RE_NUMERADO = /^\s*\d{1,3}\s*[-–—.)]\s*(\S.{1,60})$/;
const RE_TITULO_ARTISTA = /^(.{2,60}?)\s+[-–—]\s+(.{2,40})$/;
// «Título - Artista», pero no «Hace calor — Am (capo 2)», que es una línea de setlist con su
// tono (y «La Pegatina» sí es un artista, aunque «La» sea un acorde)
const tituloYArtista = (s: string) => {
    const m = RE_TITULO_ARTISTA.exec(s.trim());
    const tono = m && /^(\S+?)[,.;:]?(?:\s*(?:\([^)]*\)|\[[^\]]*\]))*\s*$/.exec(m[2]);
    return m && !(tono && leerAcorde(tono[1])) ? m : null;
};
const RE_TONO = /^\s*(?:tono|tonalidad)\s*:?\s+(\S+)(.*)$/i;
const RE_RAYA = /^\s*(?:[-_=–—~]\s*){3,}$/;
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'a', 'al', 'en', 'con', 'por', 'para', 'sin']);

// En mayúsculas, como se escribe en español: «NO ESTABA MUERTO» → «No estaba muerto» (el
// título) y «LOS DEL RÍO» → «Los del Río» (un nombre: el artista)
function tituloBonito(t: string, nombre = false): string {
    const limpio = t.replace(/\*+/g, '').replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim();
    if (!enMayusculas(limpio)) return limpio;
    const bajas = limpio.toLowerCase();
    if (!nombre) return bajas.replace(/\p{L}/u, c => c.toUpperCase());
    return bajas.replace(/\p{L}+/gu, (p, i: number) => (i > 0 && PARTICULAS.has(p) ? p : p[0].toUpperCase() + p.slice(1)));
}

function leerTitulo(t: string): { titulo: string; artista: string } {
    const sinNumero = t.replace(/^\s*\d{1,3}\s*[-–—.)]\s*/, '');
    const m = tituloYArtista(sinNumero);
    if (m) return { titulo: tituloBonito(m[1]), artista: tituloBonito(m[2], true) };
    return { titulo: tituloBonito(sinNumero), artista: '' };
}

// «05 - LA_FLACA (1).docx» → «La flaca»
export function tituloDeArchivo(nombre: string): string {
    const base = nombre.replace(/\.[^.]{1,8}$/, '').replace(/\s*\(\d+\)$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return leerTitulo(base).titulo || 'Sin título';
}

// Un rótulo suelto en mayúsculas («CORO», «INTRO RASGUEO», «ENTRAMOS TODOS:») es una sección
function rotulo(texto: string, negrita: boolean, todoMayusculas: boolean): string | null {
    const s = texto.trim().replace(/^\*+|\*+$/g, '').trim();
    if (!s || s.length > 40 || s.startsWith('[') || !enMayusculas(s)) return null;
    if (s.replace(/[^\p{L}]/gu, '').length < 3 || leerLineaAcordes(s) || RE_TONO.test(s)) return null;
    // Si la canción entera va en mayúsculas, solo cuentan los que van en negrita
    if (todoMayusculas && !negrita) return null;
    return `[${s.replace(/\s*:$/, '')}]`;
}

interface Bloque { titulo?: string; artista?: string; lineas: Linea[]; secciones: Map<Linea, string> }

function esTituloSuelto(texto: string, l: Linea): boolean {
    const s = texto.trim();
    if (!s || s.length > 70 || leerLineaAcordes(s) || esSeccion(s) || RE_TONO.test(s) || /^\[.*\]$/.test(s)) return false;
    return l.negrita || l.nivel > 0 || enMayusculas(s) || !!tituloYArtista(s);
}

// Dónde empieza cada canción: los títulos del documento (el nivel que se repite; los que se
// llaman como una parte, «Coro», «Estrofa 2», no cuentan) o, si no hay, los títulos numerados
// en negrita o mayúsculas («3 - LA FLACA», o una lista numerada de Word)
function partir(lineas: Linea[], textos: Map<Linea, string>): Bloque[] {
    const texto = (l: Linea) => textos.get(l) ?? '';
    const deParte = (t: string) => !!esSeccion(t) || /^\[.*\]$/.test(t.trim());
    const cuenta = new Map<number, { titulos: number; partes: number }>();
    lineas.forEach(l => {
        const t = texto(l).trim();
        if (!l.nivel || !t) return;
        const c = cuenta.get(l.nivel) ?? { titulos: 0, partes: 0 };
        if (deParte(t)) c.partes++; else c.titulos++;
        cuenta.set(l.nivel, c);
    });
    const niveles = [...cuenta].filter(([, c]) => c.titulos > c.partes).map(([n]) => n).sort((a, b) => a - b);
    let nivelCancion = niveles.find(n => (cuenta.get(n)?.titulos ?? 0) >= 2) ?? niveles[0];
    const empiezan = new Set(lineas.filter(l => nivelCancion !== undefined && l.nivel === nivelCancion && texto(l).trim() && !deParte(texto(l))));
    if (empiezan.size < 2) {
        // Numerados: con algo de canción entre uno y otro (si no, es una lista, como un setlist)
        const candidatas = lineas.map((l, i) => ({ l, i })).filter(({ l }) => {
            const t = texto(l).trim();
            const nombre = RE_NUMERADO.exec(t)?.[1] ?? (l.numerada && t.length <= 60 ? t : null);
            return nombre && !l.nivel && (l.negrita || enMayusculas(nombre)) && !leerLineaAcordes(nombre) && !deParte(nombre);
        });
        const llenas = (desde: number, hasta: number) => lineas.slice(desde, hasta).filter(l => texto(l).trim()).length;
        const numeradas = candidatas.filter(({ i }, k) => llenas(i + 1, candidatas[k + 1]?.i ?? lineas.length) >= 2);
        // Con canciones numeradas, el único título que había es el del documento («Letras boda»)
        if (numeradas.length >= 2 && empiezan.size === 1) { empiezan.clear(); nivelCancion = (nivelCancion ?? 0) + 1; }
        numeradas.forEach(({ l }) => empiezan.add(l));
    }

    const bloques: Bloque[] = [{ lineas: [], secciones: new Map() }];
    for (const l of lineas) {
        const t = texto(l).trim();
        if (empiezan.has(l)) {
            bloques.push({ ...leerTitulo(t), lineas: [], secciones: new Map() });
            continue;
        }
        const actual = bloques[bloques.length - 1];
        if (nivelCancion !== undefined && l.nivel && t) {
            if (l.nivel < nivelCancion) continue;                          // el título del documento
            actual.secciones.set(l, `[${t.replace(/^#+\s*/, '').replace(/^\[|\]$/g, '')}]`);    // un título de menos nivel: una parte
        }
        actual.lineas.push(l);
    }
    // Lo de antes de la primera canción, si no lleva acordes, es un índice o un setlist: fuera
    if (bloques.length > 2 && !bloques[0].lineas.some(l => leerLineaAcordes(texto(l)))) bloques[0].lineas = [];
    for (const b of bloques) {
        const primera = b.lineas.findIndex(l => texto(l).trim());
        if (primera < 0) continue;
        const l = b.lineas[primera], t = texto(l).trim();
        if (b.titulo && norm(t) === norm(b.titulo)) {
            b.lineas.splice(primera, 1);                    // el título repetido justo debajo
        } else if (!b.titulo && esTituloSuelto(t, l)) {
            Object.assign(b, leerTitulo(t));
            b.lineas.splice(primera, 1);
        }
        if (!b.titulo || b.artista) continue;
        // Un subtítulo justo debajo del título es el artista
        const siguiente = b.lineas.find(x => texto(x).trim());
        const s = siguiente ? texto(siguiente).trim() : '';
        if (siguiente?.subtitulo && s.length <= 60 && !leerLineaAcordes(s) && !deParte(s) && !RE_TONO.test(s) && !b.secciones.has(siguiente)) {
            b.artista = tituloBonito(s, true);
            b.lineas.splice(b.lineas.indexOf(siguiente), 1);
        }
    }
    return bloques.filter(b => b.lineas.some(l => texto(l).trim()));
}

// Las líneas que cambian enteras antes de maquetar (así un rótulo no se toma por letra bajo unos
// acordes): rayas, «TONO G» y rótulos en mayúsculas
function cambiadas(lineas: Linea[], texto: (l: Linea) => string, fijas: Map<Linea, string>) {
    const letra = lineas.map(texto).filter(t => t.trim().length > 15 && !leerLineaAcordes(t));
    const todoMayusculas = letra.length > 3 && letra.filter(enMayusculas).length > letra.length / 2;
    for (const l of lineas) {
        const t = texto(l);
        if (fijas.has(l) || !t.trim()) continue;
        if (RE_RAYA.test(t)) { fijas.set(l, ''); continue; }      // una raya de adorno no es «---» (partiría la canción)
        const tono = RE_TONO.exec(t.trim());
        if (tono && leerAcorde(tono[1].replace(/[,.;]$/, ''))) { fijas.set(l, `Tono: ${tono[1]}${tono[2]}`.trimEnd()); continue; }
        const r = rotulo(t, l.negrita, todoMayusculas);
        if (r) fijas.set(l, r);
    }
}

// Asteriscos sueltos («*Coro*», «**Am**» copiado de un markdown): fuera, sin mover nada de sitio
function sinAsteriscos(letras: Letra[]): Letra[] {
    const pals = palabras(letras);
    if (!pals.some(p => p.texto.includes('*'))) return letras;
    const fuera = new Set<Letra>();
    for (const p of pals) {
        let i = 0, j = p.letras.length - 1;
        while (i <= j && p.letras[i].c === '*') fuera.add(p.letras[i++]);
        while (j >= i && p.letras[j].c === '*') fuera.add(p.letras[j--]);
    }
    return letras.filter(l => !fuera.has(l));
}

// Los blancos de Docs: un párrafo vacío entre línea y línea, y dos (o más) entre estrofas. Si
// es así, los sueltos sobran y los dobles son la separación de estrofas
function pulir(salida: string[]): string {
    const tramos: number[] = [];
    let vacias = 0;
    salida.forEach(l => { if (l.trim()) { if (vacias) tramos.push(vacias); vacias = 0; } else vacias++; });
    const unidades = salida.filter((l, i) => l.trim() && !(leerLineaAcordes(l) && salida[i + 1]?.trim())).length;
    const sueltos = tramos.filter(n => n === 1).length, dobles = tramos.filter(n => n >= 2).length;
    const docs = dobles >= 1 && sueltos >= unidades * 0.6;

    const final: string[] = [];
    for (let i = 0; i < salida.length; i++) {
        const l = salida[i];
        if (l.trim()) { final.push(l); continue; }
        let n = 1;
        while (i + n < salida.length && !salida[i + n].trim()) n++;
        if (!(docs && n === 1) && final.length) final.push('');
        i += n - 1;
    }
    while (final.length && !final[final.length - 1]) final.pop();
    return final.join('\n');
}

// Las líneas sacadas del documento → canciones
function ordenar(lineas: Linea[], nombre: string, esSetlist: EsSetlist): CancionDeArchivo[] {
    const todas = lineas.flatMap(l => l.letras).filter(l => l.c.trim());
    const medio = todas.length ? todas.reduce((s, l) => s + l.a, 0) / todas.length : 0.5;
    const tecleado = (l: Linea) => natural(palabras(l.columnas ?? l.letras), l.columnas ? MONO : medio).texto;
    for (const l of lineas) {
        arreglarLatinas(l.letras);
        if (l.columnas) arreglarLatinas(l.columnas);
        if (leerLineaAcordes(tecleado(l))) continue;   // «Am*» lleva su asterisco
        l.letras = sinAsteriscos(l.letras);
        if (l.columnas) l.columnas = sinAsteriscos(l.columnas);
    }
    const textos = new Map(lineas.map(l => [l, tecleado(l)]));
    // Un setlist escrito en Word o PDF: tal cual (con sus bloques), y la caja saca una ficha por tema
    const plano = pulir(lineas.map(l => { const t = textos.get(l) ?? ''; return RE_RAYA.test(t) ? '' : t; }));
    if (esSetlist(plano)) return [{ titulo: tituloDeArchivo(nombre), artista: '', texto: plano, setlist: true }];
    // «# Título» escrito a mano (copiado de un markdown): un título como los de Word
    for (const l of lineas) {
        const almohadillas = /^\s*(#{1,6})\s+\S/.exec(textos.get(l) ?? '');
        if (almohadillas && !l.nivel) l.nivel = almohadillas[1].length + 1;
    }
    const bloques = partir(lineas, textos);

    return bloques.map((b, k) => {
        const fijas = new Map(b.secciones);
        cambiadas(b.lineas, l => textos.get(l) ?? '', fijas);
        const filas = (cuales: 'letras' | 'columnas') => b.lineas.map(l => ({ letras: l[cuales] ?? l.letras, fija: fijas.get(l) }));
        let hecho = maquetar(filas('letras'), medio);
        // Word: ¿los acordes se alinearon mirando la letra del documento o contando espacios
        // (copiados de una web, en ancho fijo)? Gana la que deja más acordes al principio de palabra
        if (b.lineas.some(l => l.columnas)) {
            const enColumnas = maquetar(filas('columnas'), MONO);
            if (enColumnas.total && enColumnas.aciertos / enColumnas.total > (hecho.total ? hecho.aciertos / hecho.total : 0)) hecho = enColumnas;
        }
        const texto = pulir(hecho.salida);
        const titulo = b.titulo || (bloques.length > 1 && k > 0 ? `${tituloDeArchivo(nombre)} (${k + 1})` : tituloDeArchivo(nombre));
        return { titulo: titulo.slice(0, 120), artista: (b.artista ?? '').slice(0, 80), texto };
    }).filter(c => c.texto.trim());
}

// ---------- Lo que usa la pantalla de importar ----------

export type TipoDocumento = 'docx' | 'pdf' | 'texto';

// Por el contenido (los primeros bytes) y, si no, por el nombre: en el iPhone el tipo a veces
// llega vacío. Lo que no se sabe abrir avisa con un mensaje claro (nunca sale como texto raro)
export function tipoDocumento(nombre: string, cabecera: Uint8Array): TipoDocumento {
    const inicio = String.fromCharCode(...cabecera.slice(0, 8));
    if (inicio.startsWith('%PDF-')) return 'pdf';
    if (inicio.startsWith('PK\u0003\u0004')) {
        if (/\.(pages|odt|numbers|key|xlsx|pptx|zip)$/i.test(nombre)) throw new Error('No es un Word: expórtalo como Word (.docx) o PDF.');
        return 'docx';
    }
    if (inicio.startsWith('\u00d0\u00cf\u0011\u00e0')) throw new Error('Es un Word antiguo (.doc): guárdalo como .docx o PDF y vuelve a probar.');
    if (inicio.startsWith('{\\rtf')) throw new Error('Es un RTF: guárdalo como Word (.docx) o PDF.');
    if (/\.docx$/i.test(nombre)) return 'docx';
    if (/\.pdf$/i.test(nombre)) return 'pdf';
    return 'texto';
}

export async function leerDocumento(datos: ArrayBuffer, nombre: string, esSetlist: EsSetlist = () => false): Promise<CancionDeArchivo[]> {
    const tipo = tipoDocumento(nombre, new Uint8Array(datos.slice(0, 8)));
    if (tipo === 'texto') throw new Error('No es un Word ni un PDF.');
    const lineas = tipo === 'pdf' ? await lineasDePdf(datos) : await lineasDeWord(datos);
    const canciones = ordenar(lineas, nombre, esSetlist);
    if (!canciones.length) throw new Error(tipo === 'pdf' ? 'Este PDF no tiene texto: parece una foto o un escaneo.' : 'El documento está vacío.');
    return canciones;
}

// Para la caja de «Importar»: «Título - Artista», la canción, y --- entre canciones (lo que ya
// entiende separarCanciones). Si el título se confundiría con otra cosa, va como {title: …}
export function aTexto(canciones: CancionDeArchivo[]): string {
    return canciones.map(c => {
        const raro = c.titulo.length > 60 || RE_TITULO_ARTISTA.test(c.titulo) || leerLineaAcordes(c.titulo) || esSeccion(c.titulo) || /[[{]/.test(c.titulo);
        const cabecera = raro
            ? [`{title: ${c.titulo}}`, c.artista && `{artist: ${c.artista}}`].filter(Boolean).join('\n')
            : c.artista ? `${c.titulo} - ${c.artista}` : c.titulo;
        return `${cabecera}\n\n${c.texto}`;
    }).join('\n---\n');
}

// Lo que sale de un archivo, listo para la caja: el texto tal cual (.txt, ChordPro) o las
// canciones de un Word o un PDF. Si falla, el error dice qué hacer (el nombre lo pone quien llama)
export async function textoDeArchivo(archivo: File, esSetlist?: EsSetlist): Promise<string> {
    if (archivo.size > 40_000_000) throw new Error('Es demasiado grande (más de 40 MB).');
    const datos = await archivo.arrayBuffer();
    if (tipoDocumento(archivo.name, new Uint8Array(datos.slice(0, 8))) !== 'texto') {
        const canciones = await leerDocumento(datos, archivo.name, esSetlist);
        if (canciones.length === 1 && canciones[0].setlist) return canciones[0].texto;
        return aTexto(canciones);
    }
    if (datos.byteLength > 2_000_000) throw new Error('Es demasiado grande para ser una canción.');
    let texto: string;
    try {
        texto = new TextDecoder('utf-8', { fatal: true }).decode(datos);
    } catch {
        texto = new TextDecoder('windows-1252').decode(datos);   // un .txt antiguo de Windows
    }
    // Una foto, un audio o un .pages no son texto: muchos caracteres de control
    const raros = [...texto.slice(0, 4000)].filter(c => (c < ' ' && !'\t\n\r\f'.includes(c)) || c === '\ufffd').length;
    if (raros > 8) throw new Error('No es un Word, un PDF ni un texto.');
    texto = texto.replace(/^\ufeff/, '');
    // Sin título en la primera línea, el del nombre del archivo
    const canciones = separarCanciones(texto);
    if (canciones.length === 1 && canciones[0].titulo === 'Sin título') return aTexto([{ titulo: tituloDeArchivo(archivo.name), artista: '', texto: texto.trim() }]);
    return texto;
}
