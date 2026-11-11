import { tempoDeAudio } from '../lib/tempo';

// El tempo de la muestra de 30 s, aparte para que la pantalla no se congele (un segundo o dos)
self.onmessage = (e: MessageEvent<{ muestras: Float32Array; sr: number }>) => {
    try {
        self.postMessage({ tipo: 'listo', tempo: tempoDeAudio(e.data.muestras, e.data.sr) });
    } catch (err) {
        self.postMessage({ tipo: 'error', mensaje: err instanceof Error ? err.message : String(err) });
    }
};
