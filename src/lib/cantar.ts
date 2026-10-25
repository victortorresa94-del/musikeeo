// Lo que necesita quien canta: el tono en que SUENA la canción (para dárselo antes de entrar),
// el tempo marcado a toques y la velocidad para que la hoja baje lo que dura la canción.
// Sin React: solo cuentas sobre el motor de acordes.

import { detectarTono, nombreAcorde, nombreTono, usaBemoles, type Acorde, type CancionLeida } from './acordes';
import { octavaDeCantar } from './sonido';
import type { AjustesCancion } from '../types/cancionero';

// ---------- El tono ----------

export interface AcordeQueSuena {
    raiz: number;              // 0 = Do … 11 = Si, como suena
    intervalos: number[];      // semitonos sobre la raíz: [0, 4, 7] = mayor
    bajo: number | null;       // Re/Fa# → el Fa#
    nombre: string;            // como lo escribe esta persona (Do Re Mi o C D E)
}

export interface TonoQueSuena {
    tonica: AcordeQueSuena;                      // el acorde del tono
    primero: AcordeQueSuena;                     // el primero de la canción
    nota: { midi: number; nombre: string };      // la de arranque: la raíz del primer acorde
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

// Las notas del acorde que hay que tocar según cómo se escribe (Am7 → [0, 3, 7, 10])
export function intervalosDe(calidad: string): number[] {
    if (/^5$/.test(calidad)) return [0, 7];                  // quinta sola (power chord)
    const semi = /^(ø|m7b5|m7♭5|m7\(b5\))/.test(calidad);
    const dis = !semi && /^(dim|°|º)/.test(calidad);
    const menor = semi || /^(m(?!aj)|min|-)/.test(calidad);
    let tercera = menor || dis ? 3 : 4;
    if (/sus2/.test(calidad)) tercera = 2;
    else if (/sus/.test(calidad)) tercera = 5;
    const quinta = dis || semi ? 6 : /aug|\+|#5|♯5/.test(calidad) ? 8 : 7;
    const notas = [0, tercera, quinta];
    if (/maj7|Maj7|M7|Δ/.test(calidad)) notas.push(11);
    else if (dis && /7/.test(calidad)) notas.push(9);
    else if (semi || /7/.test(calidad)) notas.push(10);
    return notas;
}

// El tono y el primer acorde tal como SUENAN: con el cambio de tono y la cejilla que traía el
// texto. La cejilla que pone quien toca no cambia lo que suena (solo las posturas), igual que
// tonoSuena en useMusicaCancion, de donde sale «leida» (la misma lectura que se ve en la hoja).
// Los nombres siguen las mismas reglas: el del tono es exactamente tonoSuena.
export function tonoQueSuena(leida: CancionLeida, ajustes: AjustesCancion): TonoQueSuena | null {
    const tono = detectarTono(leida.acordes);
    const primero: Acorde | undefined = leida.acordes[0];
    if (!tono || !primero) return null;
    const suena = (leida.meta.cejilla ?? 0) + ajustes.semitonos;
    const latino = ajustes.notacion === 'latina'
        || (ajustes.notacion === 'original' && leida.acordes.filter(a => a.latina).length > leida.acordes.length / 2);
    const sinMover = ajustes.alteraciones === 'auto' && suena === 0;
    const bemolesTono = sinMover ? leida.acordes.find(a => a.raiz === tono.raiz)?.bemol ?? false : usaBemoles(tono, suena, ajustes.alteraciones);
    const o = { semitonos: suena, notacion: ajustes.notacion, bemoles: sinMover ? null : usaBemoles(tono, suena, ajustes.alteraciones) };
    const raiz = mod12(primero.raiz + suena);
    return {
        tonica: {
            raiz: mod12(tono.raiz + suena),
            intervalos: [0, tono.menor ? 3 : 4, 7],
            bajo: null,
            nombre: nombreTono(tono, suena, latino ? 'latina' : 'americana', bemolesTono),
        },
        primero: {
            raiz,
            intervalos: intervalosDe(primero.calidad),
            bajo: primero.bajo === null ? null : mod12(primero.bajo + suena),
            nombre: nombreAcorde(primero, o),
        },
        // Para cantar, cerca del Do central
        nota: { midi: octavaDeCantar(raiz), nombre: nombreAcorde({ ...primero, calidad: '', bajo: null }, o) },
    };
}

// Si la canción empieza en el acorde del tono (lo más normal), suena una sola vez
export const mismoAcorde = (a: AcordeQueSuena, b: AcordeQueSuena) =>
    a.raiz === b.raiz && a.bajo === b.bajo && a.intervalos.join() === b.intervalos.join();

// ---------- El tempo ----------

export const TEMPO_MIN = 40;
export const TEMPO_MAX = 240;
export const PAUSA_TOQUES = 2000;    // ms sin tocar: se empieza a contar de nuevo

// Tempo a toques: con 4 o más, la media de los intervalos de los últimos 8
export function bpmDeToques(toques: number[]): number | null {
    const ultimos = toques.slice(-8);
    if (ultimos.length < 4) return null;
    const media = (ultimos[ultimos.length - 1] - ultimos[0]) / (ultimos.length - 1);
    if (media <= 0) return null;
    return Math.round(Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, 60000 / media)));
}

// ---------- La hoja al ritmo de la canción ----------

export const INTRO = 10;             // segundos que suena antes de cantar

// Segundos en que la hoja tiene que bajar entera, o null si va a mano
export function segundosAlRitmo(duracion: number | undefined, ajustes: AjustesCancion): number | null {
    if (!ajustes.alRitmo || !duracion || duracion <= 0) return null;
    return Math.max(15, duracion - (ajustes.intro ?? INTRO));
}

// px por segundo para recorrer «recorrido» px en esos segundos
export const velocidadAlRitmo = (recorrido: number, segundos: number) =>
    Math.min(200, Math.max(1, recorrido / segundos));

// La velocidad del desplazamiento automático: la de los ajustes o, al ritmo de la canción, la que
// baja todo lo que se puede bajar en lo que dura (menos la intro)
export function velocidadAlDesplazar(cancion: { duracion?: number; ajustes: AjustesCancion }, el: HTMLElement | null): number {
    const segundos = segundosAlRitmo(cancion.duracion, cancion.ajustes);
    if (!segundos || !el) return cancion.ajustes.velocidad;
    return velocidadAlRitmo(el.scrollHeight - el.clientHeight, segundos);
}

// Al ritmo de la canción y desde el principio de la hoja, se espera la intro antes de bajar
// (como el retardo de OnSong): se le da a ▶ cuando empieza a sonar y la hoja arranca cuando
// se canta. Si ya se había bajado (se para y se sigue), arranca en el momento.
// Segundos de espera (0: sin espera)
export function esperaDeIntro(cancion: { duracion?: number; ajustes: AjustesCancion }, el: HTMLElement | null): number {
    if (!el || segundosAlRitmo(cancion.duracion, cancion.ajustes) === null) return 0;
    if (el.scrollTop > el.clientHeight * 0.25) return 0;
    return Math.max(0, cancion.ajustes.intro ?? INTRO);
}

// 222 → «3:42»
export function minutos(segundos: number): string {
    const s = Math.max(0, Math.round(segundos));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
