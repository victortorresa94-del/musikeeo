// El tempo de una canción a partir de un trozo de audio (la muestra de 30 s del catálogo de Apple),
// con el motor de «Sacar acordes» (escuchar.ts). Sin React: lo usan el worker y scripts/tempo.
// Solo se da por bueno si las dos mitades de la muestra dicen lo mismo: si no, mejor no poner nada
// (un tempo mal puesto hace bajar la hoja a destiempo en el bolo).
import { escuchar } from './escuchar';

export interface TempoEscuchado {
    bpm: number;            // negras por minuto
    fiable: boolean;
    mitades: [number, number];
}

// Mismo tempo (con un margen del 4 %), o uno el doble del otro: el pulso o el medio pulso
const parecidos = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b) <= 0.04;

export function tempoDeAudio(x: Float32Array, sr: number): TempoEscuchado {
    const entera = escuchar(x, sr).bpm;
    const mitad = Math.floor(x.length / 2);
    const a = escuchar(x.subarray(0, mitad), sr).bpm;
    const b = escuchar(x.subarray(mitad), sr).bpm;
    // Vale si las dos mitades coinciden con la entera (a veces una mitad sale al doble o a la mitad)
    const casa = (m: number) => parecidos(m, entera) || parecidos(m, entera * 2) || parecidos(m, entera / 2);
    const fiable = x.length / sr >= 15 && casa(a) && casa(b) && (parecidos(a, entera) || parecidos(b, entera));
    return { bpm: entera, fiable, mitades: [a, b] };
}
