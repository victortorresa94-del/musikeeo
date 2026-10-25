// El sonido del Cancionero: dar el tono (un acorde o una nota, con timbre de piano eléctrico) y
// contar la entrada (claqueta). Todo se fabrica con WebAudio, sin muestras ni archivos, así que
// suena igual sin cobertura. No depende de React.
//
// Nunca suena nada solo: el AudioContext se crea la primera vez que hace falta y se despierta
// (resume) dentro de una pulsación (prepararSonido). Al salir de la página o esconderla se calla
// y se duerme (liberarSonido).
//
// En el iPhone hay dos trampas:
//  - El AudioContext nace parado y solo arranca al SOLTAR el dedo (pointerup, touchend o click;
//    al bajarlo no vale). Por eso «Dame el tono» suena al soltar.
//  - El interruptor de silencio apaga WebAudio (lo trata como el sonido de un juego). En Safari 17
//    o más se pide a la sesión de audio que suene como música: navigator.audioSession.type =
//    'playback', que no hace caso al interruptor. En los anteriores, un <audio> en silencio que
//    suena mientras tanto pasa la sesión a «reproducción» y WebAudio suena con ella (el truco de
//    unmute.js); se para al acabar. Al salir de la página la sesión vuelve a 'auto'.
//    Ojo: en «reproducción» el iPhone para la música de otras apps (una base en Música o
//    Spotify) mientras damos el tono. Solo pasa al pulsar, nunca al abrir la canción.

type ConSesion = Navigator & { audioSession?: { type: string } };

let ctx: AudioContext | null = null;
let salida: GainNode | null = null;
let silencio: HTMLAudioElement | null = null;
let finSilencio: ReturnType<typeof setTimeout> | undefined;
let hastaSilencio = 0;
let usos = 0;                                    // para no dormir el contexto si se vuelve a usar

// Cada cosa que suena (un acorde, una nota, una claqueta) va por su propio bus: al pararla se
// apaga en 30 ms, sin chasquido, y lo siguiente ya suena entero
interface Grupo { bus: GainNode; fuentes: OscillatorNode[] }
const grupos = new Set<Grupo>();
const avisos = new Set<ReturnType<typeof setTimeout>>();
const oyentes = new Set<() => void>();

const ADELANTO = 0.04;                           // segundos: que no se coma el principio

const esIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent)
    || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);

function contexto(): AudioContext | null {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;
    const Clase = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Clase) return null;
    try { ctx = new Clase({ latencyHint: 'interactive' }); } catch { return null; }
    // Todo pasa por un filtro suave (que no chille en el altavoz del móvil) y un compresor
    // (un acorde de cuatro notas no satura)
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 4500;
    filtro.Q.value = 0.5;
    const compresor = ctx.createDynamicsCompressor();
    compresor.threshold.value = -16;
    compresor.knee.value = 10;
    compresor.ratio.value = 4;
    compresor.attack.value = 0.003;
    compresor.release.value = 0.2;
    salida = ctx.createGain();
    salida.gain.value = 0.9;
    salida.connect(filtro);
    filtro.connect(compresor);
    compresor.connect(ctx.destination);
    return ctx;
}

// 0,2 s de silencio en WAV (8 kHz, 8 bits, mono), fabricado aquí mismo
function wavEnSilencio(): string {
    const n = 1600, datos = new DataView(new ArrayBuffer(44 + n));
    const texto = (o: number, s: string) => [...s].forEach((c, i) => datos.setUint8(o + i, c.charCodeAt(0)));
    texto(0, 'RIFF'); datos.setUint32(4, 36 + n, true); texto(8, 'WAVE'); texto(12, 'fmt ');
    datos.setUint32(16, 16, true); datos.setUint16(20, 1, true); datos.setUint16(22, 1, true);
    datos.setUint32(24, 8000, true); datos.setUint32(28, 8000, true); datos.setUint16(32, 1, true); datos.setUint16(34, 8, true);
    texto(36, 'data'); datos.setUint32(40, n, true);
    for (let i = 0; i < n; i++) datos.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([datos.buffer], { type: 'audio/wav' }));
}

function despertarSilencio() {
    if (!silencio) {
        silencio = document.createElement('audio');
        silencio.src = wavEnSilencio();
        silencio.loop = true;
        silencio.preload = 'auto';
        silencio.setAttribute('playsinline', '');
        silencio.setAttribute('x-webkit-airplay', 'deny');
        silencio.disableRemotePlayback = true;
    }
    clearTimeout(finSilencio);
    hastaSilencio = 0;
    void silencio.play().catch(() => {});
    // Si al final no suena nada, que no se quede sonando (ni quitándole la música a otras apps)
    silencioHasta(1);
}

// El <audio> en silencio sigue hasta que acaba lo último que suena
function silencioHasta(segundos: number) {
    const fin = Date.now() + segundos * 1000 + 300;
    if (!silencio || fin <= hastaSilencio) return;
    hastaSilencio = fin;
    clearTimeout(finSilencio);
    finSilencio = setTimeout(() => silencio?.pause(), fin - Date.now());
}

// Se llama al pulsar (dentro del gesto): crea o despierta el sonido. false si no hay WebAudio
export function prepararSonido(): boolean {
    if (typeof window === 'undefined') return false;
    const sesion = (navigator as ConSesion).audioSession;
    if (sesion && sesion.type !== 'playback') { try { sesion.type = 'playback'; } catch { /* no deja */ } }
    const c = contexto();
    if (!c) return false;
    usos++;
    if (c.state !== 'running') void c.resume().catch(() => {});
    if (!sesion && esIOS()) despertarSilencio();
    return true;
}

// Ya suena sin esperar a un gesto (el iPhone lo deja una vez desbloqueado)
export const sonidoListo = () => ctx?.state === 'running';

function grupo(c: AudioContext): Grupo {
    const bus = c.createGain();
    bus.connect(salida!);
    const g: Grupo = { bus, fuentes: [] };
    grupos.add(g);
    return g;
}

function oscilador(c: AudioContext, g: Grupo, tipo: OscillatorType, f: number) {
    const o = c.createOscillator();
    o.type = tipo;
    o.frequency.value = f;
    g.fuentes.push(o);
    return o;
}

// Cuando se apaga lo último del grupo, se desconecta
function recoger(g: Grupo, segundos: number) {
    let quedan = g.fuentes.length;
    g.fuentes.forEach(o => {
        o.onended = () => { if (--quedan === 0) { grupos.delete(g); g.bus.disconnect(); } };
    });
    silencioHasta(segundos);
}

export const frecuencia = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Una tecla de piano eléctrico: FM 1:1 con el brillo cayendo (suena brillante al golpe y luego
// redonda) y una campanita aguda que se apaga enseguida. Devuelve cuándo deja de sonar
function tecla(c: AudioContext, g: Grupo, midi: number, t: number, dur: number, vol: number) {
    const f = frecuencia(midi);
    const amp = c.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(vol, t + 0.006);
    amp.gain.setTargetAtTime(vol * 0.3, t + 0.006, 0.4);       // se apaga poco a poco
    amp.gain.setTargetAtTime(0, t + dur, 0.09);                // y se suelta
    amp.connect(g.bus);

    const portadora = oscilador(c, g, 'sine', f);
    const moduladora = oscilador(c, g, 'sine', f);
    const indice = c.createGain();
    indice.gain.setValueAtTime(f * 1.2, t);
    indice.gain.setTargetAtTime(f * 0.15, t, 0.3);
    moduladora.connect(indice);
    indice.connect(portadora.frequency);
    portadora.connect(amp);

    const campana = oscilador(c, g, 'sine', f * 4);
    const brillo = c.createGain();
    brillo.gain.setValueAtTime(0, t);
    brillo.gain.linearRampToValueAtTime(vol * 0.25, t + 0.004);
    brillo.gain.setTargetAtTime(0, t + 0.004, 0.06);
    campana.connect(brillo);
    brillo.connect(g.bus);

    const fin = t + dur + 0.6;
    for (const o of [portadora, moduladora, campana]) { o.start(t); o.stop(fin); }
    return fin;
}

interface Cuando { cuando?: number; duracion?: number; volumen?: number }

// Una nota (número MIDI: 60 = Do central). Devuelve los segundos hasta que acaba
export function tocarNota(midi: number, { cuando = 0, duracion = 1.6, volumen = 0.34 }: Cuando = {}): number {
    const c = contexto();
    if (!c || !salida) return 0;
    const g = grupo(c);
    const fin = tecla(c, g, midi, c.currentTime + ADELANTO + cuando, duracion, volumen) - c.currentTime;
    recoger(g, fin);
    return fin;
}

// La octava para cantar: de Fa#3 a Fa4, con el Do central en medio (raíz 0 = Do … 11 = Si)
export const octavaDeCantar = (raiz: number) => 54 + ((((raiz - 6) % 12) + 12) % 12);

// Las notas de un acorde como en un piano: la raíz una octava más grave (o el bajo, si lo
// lleva) y el acorde cerrado encima, en la octava de cantar
export function notasDelAcorde(raiz: number, intervalos: number[], bajo: number | null = null): number[] {
    const r = octavaDeCantar(raiz);
    const grave = (bajo === null ? r : octavaDeCantar(bajo)) - 12;
    return [grave, ...intervalos.map(i => r + i)];
}

// Un acorde. raiz: 0 = Do … 11 = Si. Sin intervalos, la tríada mayor o menor
export function tocarAcorde(raiz: number, menor: boolean, { cuando = 0, duracion = 1.2, volumen = 0.22, intervalos, bajo = null }: Cuando & { intervalos?: number[]; bajo?: number | null } = {}): number {
    const c = contexto();
    if (!c || !salida) return 0;
    const g = grupo(c);
    const t = c.currentTime + ADELANTO + cuando;
    let fin = t;
    notasDelAcorde(raiz, intervalos ?? [0, menor ? 3 : 4, 7], bajo).forEach((m, i) => {
        // Un pelín arpegiado, como al tocarlo con la mano
        fin = Math.max(fin, tecla(c, g, m, t + i * 0.022, duracion - i * 0.022, i === 0 ? volumen * 0.8 : volumen));
    });
    const segundos = fin - c.currentTime;
    recoger(g, segundos);
    return segundos;
}

// Un golpe de claqueta: el primero, más agudo y más fuerte
function golpe(c: AudioContext, g: Grupo, t: number, acento: boolean) {
    const o = oscilador(c, g, 'triangle', acento ? 1760 : 1320);
    const a = c.createGain();
    a.gain.setValueAtTime(0, t);
    a.gain.linearRampToValueAtTime(acento ? 0.9 : 0.55, t + 0.002);
    a.gain.setTargetAtTime(0, t + 0.002, 0.025);
    o.connect(a);
    a.connect(g.bus);
    o.start(t);
    o.stop(t + 0.2);
}

// La claqueta para entrar: «tiempos» golpes a ese tempo. alPulso(1…tiempos) avisa de cada golpe
// (para verlo) y alPulso(0) cuando acaba o se para. Devuelve los segundos que dura
export function claqueta(bpm: number, tiempos = 4, alPulso?: (n: number) => void): number {
    const c = contexto();
    if (!c || !salida) return 0;
    const g = grupo(c);
    const pulso = 60 / Math.min(300, Math.max(30, bpm));
    const t0 = c.currentTime + ADELANTO;
    for (let i = 0; i < tiempos; i++) {
        golpe(c, g, t0 + i * pulso, i === 0);
        if (alPulso) cuandoSuene(ADELANTO + i * pulso, () => alPulso(i + 1));
    }
    const total = ADELANTO + tiempos * pulso;
    if (alPulso) {
        cuandoSuene(total, () => alPulso(0));
        const fuera = alParar(() => { fuera(); alPulso(0); });
        cuandoSuene(total, fuera);
    }
    recoger(g, total);
    return total;
}

// Para enseñar algo justo cuando suena (segundos desde ahora). Se cancela al parar
export function cuandoSuene(segundos: number, f: () => void) {
    const id = setTimeout(() => { avisos.delete(id); f(); }, Math.max(0, segundos * 1000));
    avisos.add(id);
}

// Avisa cuando se para todo (para que los botones dejen de marcar que suena)
export function alParar(f: () => void): () => void {
    oyentes.add(f);
    return () => { oyentes.delete(f); };
}

// Calla todo lo que suena o está por sonar
export function pararSonido() {
    avisos.forEach(clearTimeout);
    avisos.clear();
    if (ctx) {
        const t = ctx.currentTime;
        grupos.forEach(g => {
            g.bus.gain.cancelScheduledValues(t);
            g.bus.gain.setValueAtTime(g.bus.gain.value, t);
            g.bus.gain.linearRampToValueAtTime(0, t + 0.03);
            g.fuentes.forEach(o => { try { o.stop(t + 0.05); } catch { /* ya estaba parada */ } });
        });
        grupos.clear();
    }
    [...oyentes].forEach(f => f());
}

// Al salir de la página o esconderla: calla, duerme el contexto y devuelve la sesión de audio
export function liberarSonido() {
    pararSonido();
    clearTimeout(finSilencio);
    silencio?.pause();
    const sesion = (navigator as ConSesion).audioSession;
    if (sesion && sesion.type === 'playback') { try { sesion.type = 'auto'; } catch { /* no deja */ } }
    const antes = usos;
    // Después del fundido; si mientras tanto se pulsa otra vez, se queda despierto
    setTimeout(() => { if (ctx && usos === antes && ctx.state === 'running') void ctx.suspend().catch(() => {}); }, 120);
}
