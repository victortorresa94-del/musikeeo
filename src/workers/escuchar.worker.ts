import { escuchar } from '../lib/escuchar';

// El análisis va aparte para que la pantalla no se congele mientras escucha (unos segundos)
self.onmessage = (e: MessageEvent<{ muestras: Float32Array; sr: number }>) => {
    try {
        const resultado = escuchar(e.data.muestras, e.data.sr, { progreso: fraccion => self.postMessage({ tipo: 'progreso', fraccion }) });
        self.postMessage({ tipo: 'listo', resultado });
    } catch (err) {
        self.postMessage({ tipo: 'error', mensaje: err instanceof Error ? err.message : String(err) });
    }
};
