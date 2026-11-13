// «Cifrado» rápido (13-nov, Víctor, con la página del bolo delante: «la vista cifrado… es para ver
// los acordes ahí en modo rápido. Es la vista que usaremos en realidad los que ya nos la sabemos
// pero no nos acordamos de algún acorde o estructura»; la de Bad Bunny salía entera, con la letra).
//
// De cualquier canción, una chuleta: cada parte en UNA línea con sus acordes («Estrofa: D7M – Bm –
// F#m (x2)») y, si se repiten, el orden en que van. Las partes que vienen escritas ([Estribillo],
// «Puente:») se respetan; las que no, se adivinan:
// - la letra que se repite (empieza igual en dos o más bloques) es el estribillo;
// - un bloque sin letra al principio es la intro, al final el final y en medio instrumental;
// - lo demás son estrofas; una parte distinta que sale una sola vez después del estribillo, puente.
// Es aproximado: por eso la letra entera sigue en «Detalle». Sin React (lo usa también el enlace).
import { leerCancion, type Linea } from './acordes';

interface Bloque {
    etiqueta?: string;           // la parte escrita en la canción
    acordes: string[];           // en orden
    resumen: string[];           // filas que ya eran una chuleta («Estrofa: Dm – C»)
    letra: string[];             // las líneas de letra, para saber si se repite
    notas: string[];             // avisos y comentarios, se quedan
}

const clave = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);

// D7M Bm F#m D7M Bm F#m → «D7M – Bm – F#m (x2)»; sin repetir el mismo acorde seguido
export function progresion(acordes: string[]): string {
    const seq = acordes.filter((a, i) => a && a !== acordes[i - 1]);
    if (!seq.length) return '';
    for (let p = 1; p <= seq.length / 2; p++) {
        if (seq.length % p) continue;
        if (seq.every((a, i) => a === seq[i % p])) return `${seq.slice(0, p).join(' – ')}  (x${seq.length / p})`;
    }
    return seq.join(' – ');
}

const filaResumen = (l: Extract<Linea, { tipo: 'acordes' }>) => {
    const base = [l.etiqueta && `${l.etiqueta}:`, l.marcas.map(m => m.texto).join(' – ')].filter(Boolean).join(' ');
    return l.coletilla ? `${base}  ${l.coletilla.startsWith('(') ? l.coletilla : `· ${l.coletilla}`}` : base;
};

function bloquesDe(lineas: Linea[]): Bloque[] {
    const bloques: Bloque[] = [];
    let actual: Bloque = { acordes: [], resumen: [], letra: [], notas: [] };
    let etiquetaSiguiente: string | undefined;
    const tiene = (b: Bloque) => b.acordes.length || b.resumen.length || b.letra.length || b.notas.length;
    const cerrar = () => {
        if (tiene(actual)) bloques.push(actual);
        actual = { acordes: [], resumen: [], letra: [], notas: [], etiqueta: etiquetaSiguiente };
        etiquetaSiguiente = undefined;
    };
    for (const l of lineas) {
        if (l.tipo === 'seccion') { etiquetaSiguiente = l.texto; cerrar(); continue; }
        if (l.tipo === 'vacia') { if (tiene(actual)) cerrar(); continue; }
        if (l.tipo === 'nota') { actual.notas.push(l.aviso ? `> ${l.texto}` : `{c: ${l.texto}}`); continue; }
        if (l.tipo === 'tab') continue;   // los punteos, en «Detalle»
        if (l.tipo === 'acordes') {
            // Una fila con su parte («Estrofa: Dm – C») o con guiones ya es una chuleta: tal cual
            if (l.etiqueta) { actual.resumen.push(filaResumen(l)); continue; }
            actual.acordes.push(...l.marcas.filter(m => m.acorde).map(m => m.texto));
            continue;
        }
        if (l.tipo === 'mixta') {
            actual.acordes.push(...l.trozos.flatMap(t => (t.marca?.acorde ? [t.marca.texto] : [])));
            // La letra va en el texto de cada trozo (también en el que empieza con un acorde)
            const letra = l.trozos.map(t => t.texto).join('').replace(/\s+/g, ' ').trim();
            if (letra) actual.letra.push(letra);
            continue;
        }
        if (l.tipo === 'letra' && l.texto.trim()) actual.letra.push(l.texto.trim());
    }
    cerrar();
    return bloques;
}

// Pone nombre a los bloques que no lo traen
function nombrar(bloques: Bloque[]): string[] {
    const conAcordes = bloques.filter(b => b.acordes.length);
    // Qué letras se repiten (por su primera línea)
    const veces = new Map<string, number>();
    for (const b of conAcordes) {
        const k = b.letra[0] ? clave(b.letra[0]) : '';
        if (k) veces.set(k, (veces.get(k) ?? 0) + 1);
    }
    const primerEstribillo = bloques.findIndex(b => b.etiqueta ? /estribillo|coro|chorus/i.test(b.etiqueta) : !!(b.letra[0] && (veces.get(clave(b.letra[0])) ?? 0) >= 2));
    // Cuántas veces sale cada dibujo de acordes (para el puente)
    const dibujo = (b: Bloque) => progresion(b.acordes);
    const vecesDibujo = new Map<string, number>();
    for (const b of conAcordes) vecesDibujo.set(dibujo(b), (vecesDibujo.get(dibujo(b)) ?? 0) + 1);
    const estrofas = new Map<string, string>();   // dibujo → «Estrofa», «Estrofa 2»…
    const ultimoConAcordes = bloques.map(b => !!b.acordes.length).lastIndexOf(true);
    const primeroConAcordes = bloques.findIndex(b => b.acordes.length);
    return bloques.map((b, i) => {
        if (b.etiqueta) return b.etiqueta;
        if (!b.acordes.length) return '';
        if (!b.letra.length) return i === primeroConAcordes ? 'Intro' : i === ultimoConAcordes ? 'Final' : 'Instrumental';
        if ((veces.get(clave(b.letra[0])) ?? 0) >= 2) return 'Estribillo';
        const d = dibujo(b);
        const ya = estrofas.get(d);
        if (ya) return ya;
        const nombre = estrofas.size === 0 ? 'Estrofa'
            : primerEstribillo >= 0 && i > primerEstribillo && (vecesDibujo.get(d) ?? 0) === 1 && ![...estrofas.values()].includes('Puente') ? 'Puente'
                : `Estrofa ${estrofas.size + 1}`;
        estrofas.set(d, nombre);
        return nombre;
    });
}

// Si casi no tiene letra (una chuleta ya hecha a mano), se deja como está
// (cuenta la letra suelta y la que lleva los acordes encima)
const esChuleta = (lineas: Linea[]) => lineas
    .filter(l => l.tipo === 'letra' || (l.tipo === 'mixta' && l.trozos.some(t => t.texto.trim()))).length < 8;

export function cifradoRapido(texto: string): string {
    if (!texto.trim()) return texto;
    const lineas = leerCancion(texto).lineas;
    if (esChuleta(lineas)) return texto;
    const bloques = bloquesDe(lineas);
    const nombres = nombrar(bloques);
    const salida: string[] = [];
    // Una parte que vuelve más corta o más larga (el último estribillo una vez en vez de dos) es la misma
    const base = (linea: string) => linea.replace(/\s+\(x\d+\)$/, '');
    const vistas = new Set<string>();
    const orden: string[] = [];
    let repetidas = false;
    bloques.forEach((b, i) => {
        salida.push(...b.notas);
        salida.push(...b.resumen);
        const prog = progresion(b.acordes);
        if (!prog) return;
        const nombre = nombres[i] || 'Acordes';
        const linea = `${nombre}: ${prog}`;
        orden.push(nombre);
        if (vistas.has(base(linea))) { repetidas = true; return; }
        vistas.add(base(linea));
        salida.push(linea);
    });
    // El orden, solo si hay partes que vuelven (si no, ya se lee de arriba abajo)
    if (repetidas && orden.length >= 3) salida.push('', `{c: Orden: ${orden.join(' · ')}}`);
    return salida.join('\n').trim() || texto;
}
