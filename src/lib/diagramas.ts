// Diagramas de acordes de guitarra, calculados (sin imágenes de otras webs y sin red).
// Para un acorde se buscan las posturas que se pueden tocar en el mástil (como mucho 4 dedos,
// con cejilla, 4 trastes de abertura) y se ordenan de la más cómoda a la menos. Las de siempre
// (C, G, Am, D…) van primero, tal como se enseñan. Sin React.
import { leerAcorde, type Acorde } from './acordes';

// Afinación estándar, de la 6.ª (Mi grave) a la 1.ª (Mi agudo), en semitonos MIDI
const CUERDAS = [40, 45, 50, 55, 59, 64];

export interface Postura {
    trastes: (number | null)[];   // por cuerda, de la 6.ª a la 1.ª: null = no se toca, 0 = al aire
    dedos: (number | null)[];     // 1 índice … 4 meñique
    cejilla?: { traste: number; desde: number; hasta: number };   // cuerdas (índices) que pisa
    base: number;                 // primer traste que se dibuja
}

// Las notas del acorde (intervalos desde la raíz) y cuáles se pueden dejar fuera
export function intervalosDe(calidad: string): { notas: number[]; opcionales: number[] } {
    let q = calidad.replace(/[()]/g, '').replace(/♯/g, '#').replace(/♭/g, 'b').replace(/Δ/g, 'maj7').replace(/^-/, 'm').replace(/[º°]/, 'dim');
    if (/^ø/.test(q)) q = 'm7b5' + q.slice(1);
    let tercera: number | null = 4, quinta = 7;
    const extra = new Set<number>();
    if (/^dim7/.test(q)) { tercera = 3; quinta = 6; extra.add(9); q = q.slice(4); }
    else if (/^dim/.test(q)) { tercera = 3; quinta = 6; q = q.slice(3); }
    else if (/^m7b5/.test(q)) { tercera = 3; quinta = 6; extra.add(10); q = q.slice(4); }
    else if (/^(aug|\+)/.test(q)) { quinta = 8; q = q.replace(/^(aug|\+)/, ''); }
    else if (/^(m|min)(?!aj)/.test(q)) { tercera = 3; q = q.replace(/^(min|m)/, ''); }
    if (/^5$/.test(q)) return { notas: [0, 7], opcionales: [] };
    const septima = /^(maj|Maj|MAJ|M)(7|9|11|13)/.test(q) ? 11 : /^(7|9|11|13)/.test(q) ? 10 : null;
    if (septima !== null) {
        extra.add(septima);
        const n = /(\d+)/.exec(q)?.[1];
        if (n === '9' || n === '11' || n === '13') extra.add(2);
        if (n === '11') extra.add(5);
        if (n === '13') extra.add(9);
        q = q.replace(/^(maj|Maj|MAJ|M)?(7|9|11|13)/, '');
    }
    if (/^6/.test(q)) { extra.add(9); if (/^6\/?9/.test(q)) extra.add(2); q = q.replace(/^6(\/?9)?/, ''); }
    for (const m of q.matchAll(/(sus2|sus4|sus|add9|add2|add4|add11|b5|#5|b9|#9|#11|b13|9|11|13)/g)) {
        switch (m[1]) {
            case 'sus2': tercera = null; extra.add(2); break;
            case 'sus4': case 'sus': tercera = null; extra.add(5); break;
            case 'add9': case 'add2': case '9': extra.add(2); break;
            case 'add4': case 'add11': case '11': extra.add(5); break;
            case 'b5': quinta = 6; break;
            case '#5': quinta = 8; break;
            case 'b9': extra.add(1); break;
            case '#9': extra.add(3); break;
            case '#11': extra.add(6); break;
            case 'b13': extra.add(8); break;
            case '13': extra.add(9); break;
        }
    }
    const notas = [...new Set([0, ...(tercera !== null ? [tercera] : []), quinta, ...extra])];
    // Con cuatro notas o más, la quinta justa puede faltar (y en los de 11 y 13, la 9.ª y la 11.ª)
    const opcionales = notas.length >= 4 && quinta === 7 ? [7] : [];
    if (notas.length >= 5) opcionales.push(...[2, 5].filter(i => notas.includes(i) && extra.has(9)));
    return { notas, opcionales };
}

// Las de toda la vida, como se enseñan (de la 6.ª a la 1.ª; x = no se toca)
const CONOCIDAS: Record<string, string[]> = {
    C: ['x32010'], D: ['xx0232'], E: ['022100'], F: ['133211', 'xx3211'], G: ['320003', '320033'], A: ['x02220'], B: ['x24442'],
    Cm: ['x35543'], Dm: ['xx0231'], Em: ['022000'], Fm: ['133111'], Gm: ['355333'], Am: ['x02210'], Bm: ['x24432'],
    C7: ['x32310'], D7: ['xx0212'], E7: ['020100', '022130'], F7: ['131211'], G7: ['320001'], A7: ['x02020'], B7: ['x21202'],
    Am7: ['x02010'], Em7: ['022030', '020000'], Dm7: ['xx0211'], Bm7: ['x20202'],
    Cmaj7: ['x32000'], Dmaj7: ['xx0222'], Emaj7: ['021100'], Fmaj7: ['xx3210'], Gmaj7: ['320002'], Amaj7: ['x02120'],
    Dsus4: ['xx0233'], Dsus2: ['xx0230'], Asus4: ['x02230'], Asus2: ['x02200'], Esus4: ['022200'], Csus4: ['x33011'],
    Cadd9: ['x32030'], 'F#m': ['244222'], 'C#m': ['x46654'], 'G#m': ['466444'], Bb: ['x13331'], 'F#': ['244322'],
};
const NOMBRES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BEMOL_A_SOSTENIDO: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

function deCadena(c: string): (number | null)[] {
    return [...c].map(x => (x === 'x' ? null : parseInt(x, 16)));
}

// ¿Cuántos dedos hacen falta? (una cejilla en el traste más bajo cuenta como uno)
function colocarDedos(trastes: (number | null)[]): { dedos: (number | null)[]; cejilla?: Postura['cejilla']; usados: number } | null {
    const pisadas = trastes.map((t, i) => ({ t, i })).filter(x => x.t !== null && x.t > 0) as { t: number; i: number }[];
    const dedos: (number | null)[] = trastes.map(() => null);
    if (!pisadas.length) return { dedos, usados: 0 };
    const minimo = Math.min(...pisadas.map(p => p.t));
    const enMinimo = pisadas.filter(p => p.t === minimo);
    let cejilla: Postura['cejilla'];
    let resto = pisadas;
    // Cejilla si pisa 3 cuerdas o más en el traste más bajo, o si sin ella faltan dedos
    if (enMinimo.length >= 3 || (enMinimo.length >= 2 && pisadas.length > 4)) {
        const desde = enMinimo[0].i, hasta = enMinimo[enMinimo.length - 1].i;
        // La cejilla solo vale si ninguna cuerda de en medio va al aire o callada
        const limpia = trastes.slice(desde, hasta + 1).every(t => t !== null && t >= minimo);
        if (limpia) {
            cejilla = { traste: minimo, desde, hasta };
            enMinimo.forEach(p => { dedos[p.i] = 1; });
            resto = pisadas.filter(p => p.t !== minimo);
        }
    }
    let dedo = cejilla ? 2 : 1;
    const ordenadas = [...resto].sort((a, b) => a.t - b.t || a.i - b.i);
    for (const p of ordenadas) {
        if (dedo > 4) return null;
        dedos[p.i] = dedo++;
    }
    return { dedos, cejilla, usados: dedo - 1 };
}

function aPostura(trastes: (number | null)[]): Postura | null {
    const d = colocarDedos(trastes);
    if (!d) return null;
    const pisados = trastes.filter((t): t is number => t !== null && t > 0);
    const max = pisados.length ? Math.max(...pisados) : 0;
    const base = max <= 4 ? 1 : Math.min(...pisados);
    return { trastes, dedos: d.dedos, cejilla: d.cejilla, base };
}

const memo = new Map<string, Postura[]>();

// Todas las posturas razonables de un acorde, de la más cómoda a la menos
export function posturas(acorde: Acorde): Postura[] {
    const clave = `${acorde.raiz}|${acorde.calidad}|${acorde.bajo}`;
    const hecha = memo.get(clave);
    if (hecha) return hecha;

    const { notas, opcionales } = intervalosDe(acorde.calidad);
    const clases = new Set(notas.map(n => (acorde.raiz + n) % 12));
    const necesarias = notas.filter(n => !opcionales.includes(n)).map(n => (acorde.raiz + n) % 12);
    const bajo = acorde.bajo ?? acorde.raiz;
    if (acorde.bajo !== null) clases.add(acorde.bajo);

    const candidatas: { trastes: (number | null)[]; puntos: number }[] = [];
    for (let ini = 0; ini <= 12; ini++) {
        // Por cuerda: callada, al aire (si es nota del acorde) o un traste de la ventana
        const opciones = CUERDAS.map(abierta => {
            const o: (number | null)[] = [null];
            if (clases.has(abierta % 12)) o.push(0);
            for (let f = Math.max(1, ini); f <= ini + 3; f++) if (clases.has((abierta + f) % 12)) o.push(f);
            return o;
        });
        const actual: (number | null)[] = [];
        const recorrer = (c: number) => {
            if (c === 6) {
                const suenan = actual.map((t, i) => (t === null ? null : CUERDAS[i] + t));
                const primera = suenan.findIndex(x => x !== null);
                if (primera === -1) return;
                const sonando = suenan.filter((x): x is number => x !== null);
                if (sonando.length < Math.min(4, notas.length + 1) && sonando.length < 3) return;
                if (sonando.length < 4 && notas.length <= 3 && primera > 2) return;
                // Calladas solo por abajo (como mucho una suelta arriba)
                const despues = actual.slice(primera);
                const calladasDentro = despues.slice(0, -1).filter(t => t === null).length;
                if (calladasDentro > 0) return;
                if (suenan[primera]! % 12 !== bajo) return;
                const pc = new Set(sonando.map(x => x % 12));
                if (!necesarias.every(n => pc.has(n))) return;
                const pisados = actual.filter((t): t is number => t !== null && t > 0);
                if (pisados.length && Math.max(...pisados) - Math.min(...pisados) > 3) return;
                if (ini > 0 && pisados.length && Math.min(...pisados) !== ini) return;   // cada ventana, la suya
                const d = colocarDedos(actual);
                if (!d) return;
                const minimo = pisados.length ? Math.min(...pisados) : 0;
                const puntos = minimo * 1.2 + (6 - sonando.length) * 1.5 + d.usados * 0.6
                    + (actual.at(-1) === null ? 2 : 0) + (d.cejilla ? 1.2 : 0)
                    + (pc.size < clases.size ? 0.8 : 0)
                    // Al aire suena bien abajo del mástil; arriba, mezclado con trastes altos, es raro
                    + actual.filter(t => t === 0).length * (minimo >= 5 ? 1.5 : -0.4);
                candidatas.push({ trastes: [...actual], puntos });
                return;
            }
            for (const o of opciones[c]) { actual[c] = o; recorrer(c + 1); }
        };
        recorrer(0);
    }
    candidatas.sort((a, b) => a.puntos - b.puntos);

    const lista: Postura[] = [];
    const vistas = new Set<string>();
    const meter = (t: (number | null)[]) => {
        const k = t.map(x => (x === null ? 'x' : x)).join(',');
        if (vistas.has(k)) return;
        const p = aPostura(t);
        if (!p) return;
        vistas.add(k);
        lista.push(p);
    };
    // Las conocidas primero
    if (acorde.bajo === null) {
        const nombre = NOMBRES[acorde.raiz] + normalizarCalidad(acorde.calidad);
        const alias = Object.entries(BEMOL_A_SOSTENIDO).find(([, s]) => s === NOMBRES[acorde.raiz])?.[0];
        for (const n of [nombre, alias ? alias + normalizarCalidad(acorde.calidad) : '']) (CONOCIDAS[n] ?? []).forEach(c => meter(deCadena(c)));
    }
    // Y de las calculadas, como mucho una por zona del mástil para que «Cambiar» enseñe otras
    const porZona = new Map<number, number>();
    for (const c of candidatas) {
        if (lista.length >= 8) break;
        const pisados = c.trastes.filter((t): t is number => t !== null && t > 0);
        const zona = pisados.length ? Math.min(...pisados) : 0;
        if ((porZona.get(zona) ?? 0) >= (zona === 0 ? 2 : 1)) continue;
        porZona.set(zona, (porZona.get(zona) ?? 0) + 1);
        meter(c.trastes);
    }
    memo.set(clave, lista);
    return lista;
}

// «maj7», «M7» y «Δ» se escriben igual en la tabla; «min» = «m»
function normalizarCalidad(q: string) {
    return q.replace(/^(min|-)/, 'm').replace(/^(Maj|MAJ|M|Δ)(?=7)/, 'maj').replace(/^Δ$/, 'maj7').replace(/[()]/g, '');
}

export function posturasDe(nombre: string): Postura[] {
    const a = leerAcorde(nombre.trim());
    return a ? posturas(a) : [];
}
