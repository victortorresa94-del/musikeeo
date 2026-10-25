// Del archivo de audio a sus acordes: el navegador lo descodifica (mp3, m4a, wav…) y el motor
// de escuchar.ts lo analiza en un worker. Nada sale del móvil.
import type { ResultadoEscucha } from './escuchar';

export const DURACION_MAX = 10 * 60;   // segundos

// A 22 050 Hz: el navegador remuestrea al descodificar (rápido) y ocupa la mitad que a 44 100
const SR = 22050;

export class ErrorDeAudio extends Error {}

export async function descodificar(archivo: File): Promise<{ muestras: Float32Array; sr: number; duracion: number }> {
    const datos = await archivo.arrayBuffer();
    const Contexto = window.OfflineAudioContext
        ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Contexto) throw new ErrorDeAudio('Este navegador no sabe leer audio.');
    const ctx = new Contexto(1, 1, SR);
    // Con las dos llamadas de vuelta: los Safari antiguos no devuelven promesa
    const audio = await new Promise<AudioBuffer>((ok, mal) => {
        try {
            const p = ctx.decodeAudioData(datos, ok, () => mal(new ErrorDeAudio('No podemos leer este audio. Prueba con un MP3 o un M4A.')));
            p?.catch?.(() => mal(new ErrorDeAudio('No podemos leer este audio. Prueba con un MP3 o un M4A.')));
        } catch {
            mal(new ErrorDeAudio('No podemos leer este audio. Prueba con un MP3 o un M4A.'));
        }
    });
    if (audio.duration > DURACION_MAX) throw new ErrorDeAudio('Es demasiado largo: como mucho 10 minutos.');
    if (audio.duration < 5) throw new ErrorDeAudio('Es demasiado corto para sacar acordes.');
    // A mono: la media de los canales
    const muestras = new Float32Array(audio.length);
    for (let c = 0; c < audio.numberOfChannels; c++) {
        const canal = audio.getChannelData(c);
        for (let i = 0; i < canal.length; i++) muestras[i] += canal[i] / audio.numberOfChannels;
    }
    return { muestras, sr: audio.sampleRate, duracion: audio.duration };
}

// Analiza en segundo plano. Devuelve el resultado y una forma de pararlo
export function escucharAparte(muestras: Float32Array, sr: number, alProgresar: (fraccion: number) => void): { resultado: Promise<ResultadoEscucha>; cancelar: () => void } {
    const worker = new Worker(new URL('../workers/escuchar.worker.ts', import.meta.url), { type: 'module' });
    let cancelar = () => {};
    const resultado = new Promise<ResultadoEscucha>((ok, mal) => {
        cancelar = () => { worker.terminate(); mal(new DOMException('Cancelado', 'AbortError')); };
        worker.onmessage = (e: MessageEvent<{ tipo: 'progreso'; fraccion: number } | { tipo: 'listo'; resultado: ResultadoEscucha } | { tipo: 'error'; mensaje: string }>) => {
            const m = e.data;
            if (m.tipo === 'progreso') alProgresar(m.fraccion);
            else if (m.tipo === 'listo') { worker.terminate(); ok(m.resultado); }
            else { worker.terminate(); mal(new Error(m.mensaje)); }
        };
        worker.onerror = e => { worker.terminate(); mal(new Error(e.message || 'No se ha podido escuchar el audio.')); };
        // Se pasa sin copiar (son decenas de megas)
        worker.postMessage({ muestras, sr }, [muestras.buffer]);
    });
    return { resultado, cancelar };
}

