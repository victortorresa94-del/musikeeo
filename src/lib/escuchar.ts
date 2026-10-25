// Escuchar una grabación y sacar sus acordes, el tono y el tempo: procesado de señal clásico
// (lo de Chordify en sus inicios), sin IA ni servidor. Corre en el móvil, en un worker.
// Sin React ni DOM: recibe las muestras en mono y devuelve los acordes por pulsos.
//
// 1. Espectro en escala de notas (3 casillas por semitono), con la afinación de la grabación
// 2. Qué notas suenan en cada momento: cada nota es una serie de armónicos y se busca la mezcla
//    de notas que mejor explica el espectro (así el quinto armónico no se lee como una tercera)
// 3. El pulso: dónde empiezan los sonidos, el tempo que mejor encaja y los golpes uno a uno
// 4. El compás (3 o 4) y dónde cae el 1: donde cambian los acordes
// 5. El acorde de cada pulso (mayor, menor, séptima…) con un modelo que prefiere no cambiar
//    a mitad de compás y los acordes del tono; el tono, de los acordes que más suenan

export type TipoAcorde = 'M' | 'm' | '7' | 'm7' | 'maj7' | 'sus4';

export interface AcordeEscuchado { inicio: number; fin: number; raiz: number; tipo: TipoAcorde | null } // raiz -1: sin acorde

export interface ResultadoEscucha {
    duracion: number;
    bpm: number;
    compas: 3 | 4;
    tiempos: number[];          // segundos de cada pulso
    unos: number[];             // índices de los pulsos que son el 1 del compás
    tono: { raiz: number; menor: boolean };
    afinacion: number;          // centésimas de semitono respecto a La 440
    acordes: AcordeEscuchado[];
}

// Lo que se ha afinado midiendo con grabaciones de acordes conocidos (ver CLAUDE.md, «Sacar acordes»)
export const AJUSTES_ESCUCHA = {
    nitidez: 18,                 // cuánto pesa lo que se oye frente a no cambiar de acorde
    bajo: 0.35,                  // cuánto suma que el bajo dé la raíz
    raiz: 1.1,                   // peso de la raíz en la plantilla
    armonicos: 0.8,              // cada armónico, cuánto más flojo que el anterior
    vueltas: 25,                 // vueltas del reparto entre notas
    cambio4: [0.3, 0.035, 0.12, 0.035],
    cambio3: [0.3, 0.04, 0.05],
    castigo: { M: 0, m: 0, '7': 0.06, m7: 0.06, maj7: 0.08, sus4: 0.1 } as Record<TipoAcorde, number>,
    // Sin «sus4» de serie: los acordes con muchas notas (el funk, el jazz) se leían como sus4
    tipos: ['M', 'm', '7', 'm7', 'maj7'] as TipoAcorde[],
    blanqueo: 0.67,              // semitonos a cada lado para quitar el fondo (0: sin quitarlo)
    comprimir: 0,                // >0: el espectro en escala logarítmica antes de repartir
    compasTempo: 2,              // cuánto pesa, al buscar el tempo, que se repita a 2 y 4 pulsos
    tonoPrimero: 0.1,            // cuánto cuenta para el tono el primer acorde
    tonoUltimo: 0.1,             // y el último
};

// ---------- FFT ----------

function crearFFT(n: number) {
    const bits = Math.log2(n) | 0;
    const inv = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
        let r = 0;
        for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
        inv[i] = r;
    }
    const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
    for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos((2 * Math.PI * i) / n); sin[i] = -Math.sin((2 * Math.PI * i) / n); }
    const re = new Float64Array(n), im = new Float64Array(n);
    // Módulo del espectro (0..n/2) de un trozo real ya enventanado
    return (entrada: Float64Array, salida: Float64Array) => {
        for (let i = 0; i < n; i++) { re[inv[i]] = entrada[i]; im[inv[i]] = 0; }
        for (let tam = 2; tam <= n; tam <<= 1) {
            const mitad = tam >> 1, paso = n / tam;
            for (let i = 0; i < n; i += tam) {
                for (let j = 0, k = 0; j < mitad; j++, k += paso) {
                    const a = i + j, b = a + mitad;
                    const tr = re[b] * cos[k] - im[b] * sin[k], ti = re[b] * sin[k] + im[b] * cos[k];
                    re[b] = re[a] - tr; im[b] = im[a] - ti;
                    re[a] += tr; im[a] += ti;
                }
            }
        }
        for (let i = 0; i <= n / 2; i++) salida[i] = Math.hypot(re[i], im[i]);
    };
}

const hann = (n: number) => Float64Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n));

// Un espectro cada «salto» muestras, de uno en uno (guardarlos todos no cabe en un móvil:
// una canción son miles de tramas de miles de valores)
function recorrerEspectro(x: Float32Array, n: number, salto: number, cada: (m: Float64Array, t: number) => void) {
    const fft = crearFFT(n), ventana = hann(n), trozo = new Float64Array(n), m = new Float64Array(n / 2 + 1);
    for (let inicio = -n / 2, t = 0; inicio + n / 2 < x.length; inicio += salto, t++) {
        for (let i = 0; i < n; i++) { const j = inicio + i; trozo[i] = j >= 0 && j < x.length ? x[j] * ventana[i] : 0; }
        fft(trozo, m);
        cada(m, t);
    }
}

// ---------- Bajar la frecuencia de muestreo (a unos 11 kHz: los acordes no necesitan más) ----------

export function reducir(x: Float32Array, sr: number): { muestras: Float32Array; sr: number } {
    const factor = Math.max(1, Math.round(sr / 11025));
    if (factor === 1) return { muestras: x, sr };
    // Filtro paso bajo (seno cardinal con ventana) justo por debajo de la nueva mitad de banda
    const taps = 16 * factor + 1, medio = (taps - 1) / 2, corte = 0.45 / factor;
    const h = new Float64Array(taps);
    let suma = 0;
    for (let i = 0; i < taps; i++) {
        const t = i - medio;
        const s = t === 0 ? 2 * corte : Math.sin(2 * Math.PI * corte * t) / (Math.PI * t);
        h[i] = s * (0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (taps - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (taps - 1)));
        suma += h[i];
    }
    for (let i = 0; i < taps; i++) h[i] /= suma;
    const salida = new Float32Array(Math.floor(x.length / factor));
    for (let o = 0; o < salida.length; o++) {
        const c = o * factor;
        let acc = 0;
        for (let i = 0; i < taps; i++) { const j = c + i - medio; if (j >= 0 && j < x.length) acc += x[j] * h[i]; }
        salida[o] = acc;
    }
    return { muestras: salida, sr: sr / factor };
}

// ---------- Del espectro a las notas ----------

const NOTA_MIN = 26;            // Re 1 (36 Hz)
const NOTA_MAX = 98;            // Re 7 (2349 Hz)
const POR_SEMITONO = 3;
const CASILLAS = (NOTA_MAX - NOTA_MIN) * POR_SEMITONO + 1;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Cada casilla en escala de notas recoge los armónicos del espectro que le caen cerca (por
// arriba suman; por abajo, donde el espectro es más grueso que un semitono, se interpola)
function matrizNotas(n: number, sr: number, afinacion: number): { desde: Int32Array; pesos: Float64Array[] } {
    const df = sr / n;
    const desde = new Int32Array(CASILLAS);
    const pesos: Float64Array[] = [];
    for (let c = 0; c < CASILLAS; c++) {
        const midi = NOTA_MIN + c / POR_SEMITONO + afinacion / 100;
        const f = hz(midi), fAbajo = hz(midi - 1 / POR_SEMITONO), fArriba = hz(midi + 1 / POR_SEMITONO);
        const k0 = Math.max(1, Math.floor(fAbajo / df)), k1 = Math.min(n / 2, Math.ceil(fArriba / df));
        const w = new Float64Array(k1 - k0 + 1);
        let suma = 0;
        for (let k = k0; k <= k1; k++) {
            const fk = k * df;
            const p = fk < f ? (fk - fAbajo) / (f - fAbajo) : (fArriba - fk) / (fArriba - f);
            if (p > 0) { w[k - k0] = p; suma += p; }
        }
        if (suma < 1e-9) {
            // Más fina que el espectro: entre los dos armónicos que la rodean
            const k = Math.min(n / 2 - 1, Math.floor(f / df)), t = f / df - k;
            desde[c] = k; pesos.push(Float64Array.of(1 - t, t));
            continue;
        }
        for (let i = 0; i < w.length; i++) w[i] /= suma;
        desde[c] = k0; pesos.push(w);
    }
    return { desde, pesos };
}

function aNotas(m: Float64Array, matriz: { desde: Int32Array; pesos: Float64Array[] }, salida: Float64Array) {
    for (let c = 0; c < CASILLAS; c++) {
        const w = matriz.pesos[c], k0 = matriz.desde[c];
        let s = 0;
        for (let i = 0; i < w.length; i++) s += m[k0 + i] * w[i];
        salida[c] = s;
    }
}

// La afinación de la grabación: dónde caen, dentro del semitono, los picos del espectro medio
// (en centésimas: un tercio de semitono a la derecha son +33)
function afinacionDe(notas: Float64Array): number {
    let re = 0, im = 0;
    for (let c = 1; c < CASILLAS - 1; c++) {
        if (notas[c] <= notas[c - 1] || notas[c] < notas[c + 1]) continue;   // solo picos
        const a = (2 * Math.PI * (c % POR_SEMITONO)) / POR_SEMITONO;
        re += notas[c] * Math.cos(a); im += notas[c] * Math.sin(a);
    }
    return Math.max(-50, Math.min(50, (Math.atan2(im, re) / (2 * Math.PI)) * 100));
}

// Mover el espectro en notas la afinación (una fracción de casilla), para que cada nota caiga
// en su casilla
function afinar(s: Float32Array, desplazamiento: number, salida: Float64Array) {
    for (let c = 0; c < CASILLAS; c++) {
        const p = c + desplazamiento, i = Math.floor(p), f = p - i;
        const a = i >= 0 && i < CASILLAS ? s[i] : 0, b = i + 1 >= 0 && i + 1 < CASILLAS ? s[i + 1] : 0;
        salida[c] = a * (1 - f) + b * f;
    }
}

// Cada nota, como su serie de armónicos (cada uno más flojo que el anterior)
const PRIMERA = 28, ULTIMA = 96, NOTAS = ULTIMA - PRIMERA + 1;
function diccionario(): Float64Array[] {
    const notas: Float64Array[] = [];
    for (let p = PRIMERA; p <= ULTIMA; p++) {
        const d = new Float64Array(CASILLAS);
        for (let h = 1; h <= 12; h++) {
            const c = (p - NOTA_MIN + 12 * Math.log2(h)) * POR_SEMITONO;
            if (c > CASILLAS - 1) break;
            const a = AJUSTES_ESCUCHA.armonicos ** (h - 1);
            for (let e = -2; e <= 2; e++) {
                const i = Math.round(c) + e;
                if (i >= 0 && i < CASILLAS) d[i] += a * Math.exp(-0.5 * ((i - c) / 0.7) ** 2);
            }
        }
        const norma = Math.hypot(...d);
        for (let i = 0; i < CASILLAS; i++) d[i] /= norma;
        notas.push(d);
    }
    return notas;
}

// Lo que sobresale del entorno (media de una octava alrededor): quita el ruido y el timbre
function blanquear(s: Float64Array): Float64Array {
    if (!AJUSTES_ESCUCHA.blanqueo) return s;
    const r = Math.max(1, Math.round(AJUSTES_ESCUCHA.blanqueo * POR_SEMITONO));
    const salida = new Float64Array(s.length);
    const acum = new Float64Array(s.length + 1), acum2 = new Float64Array(s.length + 1);
    for (let i = 0; i < s.length; i++) { acum[i + 1] = acum[i] + s[i]; acum2[i + 1] = acum2[i] + s[i] * s[i]; }
    for (let i = 0; i < s.length; i++) {
        const a = Math.max(0, i - r), b = Math.min(s.length, i + r + 1), k = b - a;
        const media = (acum[b] - acum[a]) / k;
        const desv = Math.sqrt(Math.max(1e-12, (acum2[b] - acum2[a]) / k - media * media));
        salida[i] = s[i] > media ? (s[i] - media) / desv : 0;
    }
    return salida;
}

// ---------- El pulso ----------

// Cuánto «empieza algo» en cada momento: lo que sube el espectro de una trama a la siguiente
function fuerzaDeAtaque(x: Float32Array, n: number, salto: number): Float64Array {
    const crudo: number[] = [];
    const l = new Float64Array(n / 2 + 1), previa = new Float64Array(n / 2 + 1);
    recorrerEspectro(x, n, salto, (m, t) => {
        let s = 0;
        for (let k = 0; k < m.length; k++) {
            l[k] = Math.log1p(1000 * m[k]);
            if (t > 0 && k > 0) { const d = l[k] - previa[k]; if (d > 0) s += d; }
            previa[k] = l[k];
        }
        crudo.push(s);
    });
    const o = Float64Array.from(crudo);
    // Sin la tendencia lenta (el volumen): media móvil de ~1 s
    const r = 20, salida = new Float64Array(o.length);
    let suma = 0;
    for (let t = 0; t < o.length; t++) {
        suma += o[t]; if (t - 2 * r - 1 >= 0) suma -= o[t - 2 * r - 1];
        const c = t - r;
        if (c >= 0) salida[c] = Math.max(0, o[c] - suma / Math.min(t + 1, 2 * r + 1));
    }
    let desv = 0;
    for (const v of salida) desv += v * v;
    desv = Math.sqrt(desv / salida.length) || 1;
    for (let t = 0; t < salida.length; t++) salida[t] /= desv;
    return salida;
}

// El tempo (en tramas por pulso) que mejor se repite, con preferencia por los tempos habituales
function periodo(o: Float64Array, tramasPorSegundo: number): number {
    const min = Math.floor((60 / 220) * tramasPorSegundo), max = Math.ceil((60 / 45) * tramasPorSegundo);
    const hasta = Math.min(o.length - 1, 4 * max + 2);
    const ac = new Float64Array(hasta + 1);
    for (let l = min; l <= hasta; l++) { let s = 0; for (let t = l; t < o.length; t++) s += o[t] * o[t - l]; ac[l] = s / (o.length - l); }
    // El pico de la autocorrelación cerca de un periodo (un pulso no cae siempre en la misma trama)
    const en = (x: number) => { const i = Math.round(x); if (i + 1 > hasta) return 0; return Math.max(ac[i - 1], ac[i], ac[i + 1]); };
    const centro = (60 / 112) * tramasPorSegundo;
    let mejor = min, puntos = -Infinity;
    for (let l = min; l <= max; l++) {
        // El pulso de verdad también se repite a los dos y a los cuatro pulsos (el compás); el
        // pulso con puntillo de un rasgueo en swing, no
        const s = (ac[l] + AJUSTES_ESCUCHA.compasTempo * (0.5 * en(2 * l) + 0.5 * en(4 * l)))
            * Math.exp(-0.5 * (Math.log2(l / centro) / 0.9) ** 2);
        if (s > puntos) { puntos = s; mejor = l; }
    }
    // Afinar con el pico (parábola)
    const a = ac[mejor - 1] ?? ac[mejor], b = ac[mejor], c = ac[mejor + 1] ?? ac[mejor];
    const d = a - 2 * b + c;
    return mejor + (d < 0 ? 0.5 * (a - c) / d : 0);
}

// Los golpes uno a uno: cada pulso cae donde hay ataque y a un periodo del anterior
// (programación dinámica, como en el seguidor de pulso de Ellis)
function seguirPulso(o: Float64Array, per: number): number[] {
    const n = o.length;
    const suave = new Float64Array(n), anchura = Math.max(1, Math.round(per / 16));
    for (let t = 0; t < n; t++) {
        let s = 0;
        for (let d = -2 * anchura; d <= 2 * anchura; d++) { const j = t + d; if (j >= 0 && j < n) s += o[j] * Math.exp(-0.5 * (d / anchura) ** 2); }
        suave[t] = s;
    }
    const total = new Float64Array(n), atras = new Int32Array(n).fill(-1);
    const desde = Math.round(per * 2), hasta = Math.max(1, Math.round(per / 2));
    for (let t = 0; t < n; t++) {
        let mejor = 0, cual = -1;
        for (let p = t - desde; p <= t - hasta; p++) {
            if (p < 0) continue;
            const s = total[p] - 100 * Math.log((t - p) / per) ** 2;
            if (cual < 0 || s > mejor) { mejor = s; cual = p; }
        }
        total[t] = suave[t] + (cual >= 0 ? Math.max(0, mejor) : 0);
        atras[t] = cual >= 0 && mejor > 0 ? cual : -1;
    }
    // El último pulso: el mejor en el último periodo
    let fin = n - 1;
    for (let t = Math.max(0, n - Math.round(per)); t < n; t++) if (total[t] > total[fin]) fin = t;
    const pulsos: number[] = [];
    for (let t = fin; t >= 0; t = atras[t]) pulsos.push(t);
    return pulsos.reverse();
}

// ---------- Los acordes ----------

const INTERVALOS: Record<TipoAcorde, number[]> = {
    M: [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7],
};

interface Estado { raiz: number; tipo: TipoAcorde | null }
function estados(tipos: TipoAcorde[]): Estado[] {
    const e: Estado[] = [{ raiz: -1, tipo: null }];
    for (const tipo of tipos) for (let r = 0; r < 12; r++) e.push({ raiz: r, tipo });
    return e;
}

// Correlación de un croma con la plantilla del acorde (las notas del acorde, más peso la raíz)
function plantilla(e: Estado): Float64Array {
    const t = new Float64Array(12);
    if (e.raiz < 0) return t.fill(1);
    for (const [i, iv] of INTERVALOS[e.tipo!].entries()) t[(e.raiz + iv) % 12] = i === 0 ? AJUSTES_ESCUCHA.raiz : i === 3 ? 0.7 : 1;
    return t;
}
function correlacion(a: ArrayLike<number>, b: ArrayLike<number>): number {
    let ma = 0, mb = 0;
    for (let i = 0; i < 12; i++) { ma += a[i]; mb += b[i]; }
    ma /= 12; mb /= 12;
    let s = 0, sa = 0, sb = 0;
    for (let i = 0; i < 12; i++) { const x = a[i] - ma, y = b[i] - mb; s += x * y; sa += x * x; sb += y * y; }
    return sa && sb ? s / Math.sqrt(sa * sb) : 0;
}

// Perfiles de tono (Krumhansl–Kessler)
const PERFIL_MAYOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const PERFIL_MENOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function tonoDeCroma(croma: ArrayLike<number>): { raiz: number; menor: boolean } {
    let mejor = { raiz: 0, menor: false }, puntos = -Infinity;
    for (let r = 0; r < 12; r++) {
        for (const menor of [false, true]) {
            const perfil = menor ? PERFIL_MENOR : PERFIL_MAYOR;
            const rot = Array.from({ length: 12 }, (_, i) => perfil[(i - r + 12) % 12]);
            const c = correlacion(croma, rot);
            if (c > puntos) { puntos = c; mejor = { raiz: r, menor }; }
        }
    }
    return mejor;
}

// Los acordes propios del tono pesan más al decidir (y los habituales de fuera: el Mi mayor en
// La menor, el séptimo grado rebajado…)
function pesoEnElTono(e: Estado, tono: { raiz: number; menor: boolean }): number {
    if (e.raiz < 0) return 0.25;
    const g = (e.raiz - tono.raiz + 12) % 12;
    const menorDeTipo = e.tipo === 'm' || e.tipo === 'm7';
    const propios = tono.menor
        ? { 0: 'm', 2: 'dis', 3: 'M', 5: 'm', 7: 'Mm', 8: 'M', 10: 'M' } as Record<number, string>
        : { 0: 'M', 2: 'm', 4: 'm', 5: 'M', 7: 'M', 9: 'm' } as Record<number, string>;
    const q = propios[g];
    if (q === 'Mm') return 1;
    if (q === 'M' && !menorDeTipo) return 1;
    if (q === 'm' && menorDeTipo) return 1;
    // Dominantes secundarios (Re mayor en Do, Mi mayor en Do…) y préstamos frecuentes (el Si♭
    // del rock en Do: si contara como propio, Do mayor y Sol mayor empatarían)
    if (!menorDeTipo && (g === 2 || g === 4 || g === 9 || g === 10)) return 0.45;
    if (menorDeTipo && (g === 5 || g === 7) && !tono.menor) return 0.4;
    return 0.2;
}

// Viterbi sobre los pulsos: cada pulso un acorde; cambiar cuesta, y más fuera del 1 del compás
function decidir(puntos: Float64Array[], est: Estado[], posicion: number[], compas: number, tono: { raiz: number; menor: boolean } | null): number[] {
    const B = puntos.length, S = est.length;
    const cambio = compas === 4 ? AJUSTES_ESCUCHA.cambio4 : AJUSTES_ESCUCHA.cambio3;
    const previo = est.map(e => Math.log(tono ? pesoEnElTono(e, tono) : 1));
    let v = new Float64Array(S), siguiente = new Float64Array(S);
    const atras: Int32Array[] = [];
    for (let s = 0; s < S; s++) v[s] = previo[s] + puntos[0][s];
    for (let b = 1; b < B; b++) {
        const pc = cambio[posicion[b] % compas];
        const quedarse = Math.log(1 - pc), irse = Math.log(pc / (S - 1));
        let mejorCual = 0;
        for (let s = 1; s < S; s++) if (v[s] > v[mejorCual]) mejorCual = s;
        const a = new Int32Array(S);
        for (let s = 0; s < S; s++) {
            const seguir = v[s] + quedarse;
            const venir = v[mejorCual] + irse + previo[s];
            if (seguir >= venir || mejorCual === s) { siguiente[s] = seguir + puntos[b][s]; a[s] = s; }
            else { siguiente[s] = venir + puntos[b][s]; a[s] = mejorCual; }
        }
        atras.push(a);
        [v, siguiente] = [siguiente, v];
    }
    let fin = 0;
    for (let s = 1; s < S; s++) if (v[s] > v[fin]) fin = s;
    const camino = new Array<number>(B);
    camino[B - 1] = fin;
    for (let b = B - 1; b > 0; b--) camino[b - 1] = atras[b - 1][camino[b]];
    return camino;
}

// ---------- Todo junto ----------

export interface OpcionesEscucha {
    progreso?: (fraccion: number) => void;
    tipos?: TipoAcorde[];
    // Para las pruebas: el croma de cada pulso (agudos y bajo)
    depurar?: (datos: { agudos: Float64Array[]; graves: Float64Array[]; tiempos: number[] }) => void;
}

export function escuchar(entrada: Float32Array, srEntrada: number, opciones: OpcionesEscucha = {}): ResultadoEscucha {
    const avisar = opciones.progreso ?? (() => {});
    const { muestras: x, sr } = reducir(entrada, srEntrada);
    const duracion = entrada.length / srEntrada;
    avisar(0.05);

    // Armonía: tramas largas (afinan bien los graves), una cada ~90 ms, pasadas a notas
    const N = 4096, SALTO = 1024;
    const matriz = matrizNotas(N, sr, 0);
    const tramas: Float32Array[] = [];
    const energia: number[] = [];
    const notasMedias = new Float64Array(CASILLAS), notasEn = new Float64Array(CASILLAS);
    const totalTramas = Math.ceil(x.length / SALTO);
    recorrerEspectro(x, N, SALTO, (m, t) => {
        aNotas(m, matriz, notasEn);
        let e = 0;
        for (let c = 0; c < CASILLAS; c++) { e += notasEn[c]; notasMedias[c] += notasEn[c]; }
        energia.push(e);
        tramas.push(Float32Array.from(notasEn));
        if (t % 100 === 0) avisar(0.05 + 0.25 * (t / totalTramas));
    });
    const afinacion = afinacionDe(notasMedias);
    const desplazamiento = (afinacion / 100) * POR_SEMITONO;

    // Qué notas suenan: el espectro en notas, sin lo que no sobresale, y repartido entre notas
    // (actualizaciones multiplicativas: siempre positivas, una docena de vueltas bastan)
    const dic = diccionario();
    const DtD = dic.map(a => Float64Array.from(dic, b => { let s = 0; for (let i = 0; i < CASILLAS; i++) s += a[i] * b[i]; return s; }));
    const graves: Float64Array[] = [], agudos: Float64Array[] = [];
    const pesoGrave = Array.from({ length: NOTAS }, (_, i) => { const p = PRIMERA + i; return p < 31 ? 0.5 : p <= 52 ? 1 : Math.max(0, 1 - (p - 52) / 8); });
    const pesoAgudo = Array.from({ length: NOTAS }, (_, i) => { const p = PRIMERA + i; return p < 43 ? Math.max(0, (p - 35) / 8) : p <= 84 ? 1 : Math.max(0, 1 - (p - 84) / 10); });
    const xs = new Float64Array(NOTAS), Dty = new Float64Array(NOTAS);
    for (let t = 0; t < tramas.length; t++) {
        afinar(tramas[t], desplazamiento, notasEn);
        if (AJUSTES_ESCUCHA.comprimir) for (let c = 0; c < CASILLAS; c++) notasEn[c] = Math.log1p(AJUSTES_ESCUCHA.comprimir * notasEn[c]);
        const y = blanquear(notasEn);
        for (let j = 0; j < NOTAS; j++) { let s = 0; const d = dic[j]; for (let i = 0; i < CASILLAS; i++) s += d[i] * y[i]; Dty[j] = Math.max(0, s); xs[j] = Dty[j]; }
        for (let it = 0; it < AJUSTES_ESCUCHA.vueltas; it++) {
            for (let j = 0; j < NOTAS; j++) {
                if (xs[j] <= 0) continue;
                let den = 1e-9; const fila = DtD[j];
                for (let k = 0; k < NOTAS; k++) den += fila[k] * xs[k];
                xs[j] *= Dty[j] / den;
            }
        }
        const g = new Float64Array(12), a = new Float64Array(12);
        for (let j = 0; j < NOTAS; j++) { const pc = (PRIMERA + j) % 12; g[pc] += xs[j] * pesoGrave[j]; a[pc] += xs[j] * pesoAgudo[j]; }
        graves.push(g); agudos.push(a);
        if (t % 200 === 0) avisar(0.3 + 0.4 * (t / tramas.length));
    }
    avisar(0.7);

    // El pulso, con tramas cortas (~23 ms)
    const NP = 1024, SP = 256;
    const tps = sr / SP;
    const ataque = fuerzaDeAtaque(x, NP, SP);
    const per = periodo(ataque, tps);
    const pulsosEnTramas = seguirPulso(ataque, per);
    // Fuera los pulsos del silencio del principio y del final
    const fuerte = energia.map(e => e > 0.02 * mediana(energia));
    const tramaArmonia = (s: number) => Math.min(tramas.length - 1, Math.max(0, Math.round((s * sr) / SALTO)));
    let tiempos = pulsosEnTramas.map(t => t / tps).filter(s => fuerte[tramaArmonia(s)]);
    if (tiempos.length < 8) tiempos = Array.from({ length: Math.floor(duracion / 0.5) }, (_, i) => i * 0.5);
    const bpm = Math.round((60 * tps) / per);
    avisar(0.8);

    // El croma de cada pulso (la media de sus tramas)
    const B = tiempos.length;
    const cromaPulso = (fuente: Float64Array[], b: number) => {
        const c = new Float64Array(12);
        const t0 = tramaArmonia(tiempos[b]), t1 = Math.max(t0 + 1, tramaArmonia(b + 1 < B ? tiempos[b + 1] : tiempos[b] + 60 / bpm));
        for (let t = t0; t < t1 && t < fuente.length; t++) for (let i = 0; i < 12; i++) c[i] += fuente[t][i];
        return c;
    };
    const ag = Array.from({ length: B }, (_, b) => cromaPulso(agudos, b));
    const gr = Array.from({ length: B }, (_, b) => cromaPulso(graves, b));
    const en = Array.from({ length: B }, (_, b) => { const t0 = tramaArmonia(tiempos[b]); return energia[t0]; });
    const enMedia = mediana(en);
    opciones.depurar?.({ agudos: ag, graves: gr, tiempos });

    // Puntos de cada acorde en cada pulso: lo agudo con la plantilla, más si el bajo da la raíz
    const tipos = opciones.tipos ?? AJUSTES_ESCUCHA.tipos;
    const est = estados(tipos);
    const plantillas = est.map(plantilla);
    const puntos = ag.map((a, b) => {
        const g = gr[b], gmax = Math.max(...g) || 1;
        const silencio = en[b] < 0.04 * enMedia;
        return Float64Array.from(est, (e, s) => {
            const k = AJUSTES_ESCUCHA.nitidez;
            if (e.raiz < 0) return k * (silencio ? 1 : -0.3);
            const bajo = g[e.raiz] / gmax;
            return k * (correlacion(a, plantillas[s]) + AJUSTES_ESCUCHA.bajo * bajo - AJUSTES_ESCUCHA.castigo[e.tipo!]);
        });
    });

    // El compás y su 1: donde cambian los acordes (y donde pega más fuerte el bajo)
    const cambio = ag.map((a, b) => (b ? 1 - correlacion(a, ag[b - 1]) : 0));
    const cambioBajo = gr.map((g, b) => (b ? 1 - correlacion(g, gr[b - 1]) : 0));
    let compas: 3 | 4 = 4, fase = 0, mejor = -Infinity;
    for (const M of [4, 3] as const) {
        for (let f = 0; f < M; f++) {
            let si = 0, no = 0, nsi = 0, nno = 0;
            for (let b = 1; b < B; b++) {
                const v = cambio[b] + 0.5 * cambioBajo[b];
                if ((b - f) % M === 0) { si += v; nsi++; } else { no += v; nno++; }
            }
            const s = (si / (nsi || 1)) - (no / (nno || 1)) * (M === 4 ? 1 : 1.15);
            if (s > mejor) { mejor = s; compas = M; fase = f; }
        }
    }
    const posicion = Array.from({ length: B }, (_, b) => ((b - fase) % compas + compas) % compas);
    avisar(0.88);

    // Primera pasada sin tono; el tono, de los acordes que más suenan; segunda, con el tono
    const primera = decidir(puntos, est, posicion, compas, null);
    const tono = tonoDeAcordes(primera.map(s => est[s]), ag) ;
    const camino = decidir(puntos, est, posicion, compas, tono);
    avisar(0.97);

    // A tramos: cada acorde desde su primer pulso hasta que cambia
    const acordes: AcordeEscuchado[] = [];
    for (let b = 0; b < B; b++) {
        const e = est[camino[b]];
        const inicio = b === 0 ? 0 : tiempos[b];
        const fin = b + 1 < B ? tiempos[b + 1] : duracion;
        const ultimo = acordes[acordes.length - 1];
        if (ultimo && ultimo.raiz === e.raiz && ultimo.tipo === e.tipo) ultimo.fin = fin;
        else acordes.push({ inicio, fin, raiz: e.raiz, tipo: e.tipo });
    }
    const unos = posicion.flatMap((p, b) => (p === 0 ? [b] : []));
    avisar(1);
    return { duracion, bpm, compas, tiempos, unos, tono, afinacion, acordes };
}

function mediana(v: number[]): number {
    const s = [...v].sort((a, b) => a - b);
    return s.length ? s[s.length >> 1] : 0;
}

// El tono: el acorde que más dura y sus vecinos (I, IV, V), con el croma de apoyo; y las
// canciones suelen empezar y, sobre todo, acabar en la tónica
function tonoDeAcordes(camino: Estado[], ag: Float64Array[]): { raiz: number; menor: boolean } {
    const croma = new Float64Array(12);
    for (const a of ag) { const m = Math.max(...a) || 1; for (let i = 0; i < 12; i++) croma[i] += a[i] / m; }
    const porCroma = tonoDeCroma(croma);
    const cuenta = new Map<string, number>();
    for (const e of camino) if (e.raiz >= 0) { const k = `${e.raiz}:${e.tipo === 'm' || e.tipo === 'm7' ? 'm' : 'M'}`; cuenta.set(k, (cuenta.get(k) ?? 0) + 1); }
    const sonando = camino.filter(e => e.raiz >= 0);
    const esMenor = (e?: Estado) => e?.tipo === 'm' || e?.tipo === 'm7';
    const total = sonando.length, primero = sonando[0], ultimo = sonando[sonando.length - 1];
    let mejor = porCroma, puntos = -Infinity;
    for (let r = 0; r < 12; r++) {
        for (const menor of [false, true]) {
            const tono = { raiz: r, menor };
            let s = 0;
            if (primero?.raiz === r && esMenor(primero) === menor) s += total * AJUSTES_ESCUCHA.tonoPrimero;
            if (ultimo?.raiz === r && esMenor(ultimo) === menor) s += total * AJUSTES_ESCUCHA.tonoUltimo;
            for (const [k, n] of cuenta) {
                const [raiz, q] = k.split(':');
                const e: Estado = { raiz: +raiz, tipo: q === 'm' ? 'm' : 'M' };
                const w = pesoEnElTono(e, tono);
                s += n * (w >= 1 ? 1 : w >= 0.4 ? 0.3 : -0.5);
                if (+raiz === r && (q === 'm') === menor) s += n * 0.6;                     // la tónica
            }
            if (r === porCroma.raiz && menor === porCroma.menor) s *= 1.05;
            if (s > puntos) { puntos = s; mejor = tono; }
        }
    }
    return mejor;
}

// ---------- Nombres y la hoja ----------

const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BEMOLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SUFIJO: Record<TipoAcorde, string> = { M: '', m: 'm', '7': '7', m7: 'm7', maj7: 'maj7', sus4: 'sus4' };

// Con bemoles en los tonos de bemoles (Fa, Si♭… y sus relativos menores)
export function conBemoles(tono: { raiz: number; menor: boolean }): boolean {
    const mayor = tono.menor ? (tono.raiz + 3) % 12 : tono.raiz;
    return [5, 10, 3, 8, 1, 6].includes(mayor);
}

export function nombreAcorde(a: { raiz: number; tipo: TipoAcorde | null }, bemoles: boolean): string {
    if (a.raiz < 0 || !a.tipo) return 'N.C.';
    return (bemoles ? BEMOLES : SOSTENIDOS)[a.raiz] + SUFIJO[a.tipo];
}

export function nombreTonoEscuchado(tono: { raiz: number; menor: boolean }): string {
    return (conBemoles(tono) ? BEMOLES : SOSTENIDOS)[tono.raiz] + (tono.menor ? 'm' : '');
}

export interface CompasEscuchado { inicio: number; fin: number; acordes: string[] }

// Los compases, de 1 en 1, con los acordes que suenan en cada uno (en orden, sin repetir).
// Lo de antes del primer 1 (la anacrusa) va con el primer compás; sin «sin acorde» al
// principio ni al final
export function compasesDe(r: ResultadoEscucha): CompasEscuchado[] {
    const bemoles = conBemoles(r.tono);
    const acordeEn = (s: number) => r.acordes.find(a => s >= a.inicio && s < a.fin) ?? r.acordes[r.acordes.length - 1];
    const unos = r.unos.length ? r.unos : [0];
    const compases: CompasEscuchado[] = [];
    for (let i = 0; i < unos.length; i++) {
        const desde = i === 0 ? 0 : unos[i], hasta = i + 1 < unos.length ? unos[i + 1] : r.tiempos.length;
        const acordes: string[] = [];
        for (let b = desde; b < hasta; b++) {
            const n = nombreAcorde(acordeEn(r.tiempos[b] + 0.01), bemoles);
            if (acordes[acordes.length - 1] !== n) acordes.push(n);
        }
        compases.push({ inicio: i === 0 ? 0 : r.tiempos[desde], fin: hasta < r.tiempos.length ? r.tiempos[hasta] : r.duracion, acordes });
    }
    const vacio = (c: CompasEscuchado) => c.acordes.length === 1 && c.acordes[0] === 'N.C.';
    while (compases.length && vacio(compases[0])) compases.shift();
    while (compases.length && vacio(compases[compases.length - 1])) compases.pop();
    return compases;
}

// La canción escrita por compases, cuatro por línea: «| Am | G | F | E |». Un compás con dos
// acordes los lleva juntos («| F G |»). Las líneas que se repiten seguidas van una vez con «x2»
export function hojaDeAcordes(r: ResultadoEscucha): string {
    const compases = compasesDe(r).map(c => c.acordes.join(' '));
    const lineas: string[] = [];
    for (let i = 0; i < compases.length; i += 4) lineas.push(`| ${compases.slice(i, i + 4).join(' | ')} |`);
    const salida: string[] = [];
    for (let i = 0; i < lineas.length;) {
        let veces = 1;
        while (lineas[i + veces] === lineas[i]) veces++;
        salida.push(veces > 1 ? `${lineas[i]}  x${veces}` : lineas[i]);
        i += veces;
    }
    return salida.join('\n');
}
