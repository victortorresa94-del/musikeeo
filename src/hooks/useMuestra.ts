import { useEffect, useSyncExternalStore } from 'react';

// Las muestras de 30 s del catálogo: un solo reproductor para toda la app, así nunca suenan
// dos a la vez (al darle a otra, la anterior se para)

interface EstadoMuestra {
    url: string | null;         // la que suena (o está cargando)
    cargando: boolean;
}

let audio: HTMLAudioElement | null = null;
let estado: EstadoMuestra = { url: null, cargando: false };
const oyentes = new Set<() => void>();
const avisar = (cambio: Partial<EstadoMuestra>) => {
    estado = { ...estado, ...cambio };
    oyentes.forEach(f => f());
};

function reproductor() {
    if (!audio) {
        audio = new Audio();
        audio.preload = 'none';
        const a = audio;
        a.addEventListener('playing', () => avisar({ cargando: false }));
        a.addEventListener('ended', () => avisar({ url: null, cargando: false }));
        a.addEventListener('error', () => { if (estado.url) avisar({ url: null, cargando: false }); });
        // La para el iPhone (una llamada, otra app que suena, la pantalla bloqueada): el botón
        // vuelve a «escuchar». Al cambiar de muestra también llega una pausa, pero ya suena la
        // nueva (paused es false) y no cuenta
        a.addEventListener('pause', () => { if (a.paused && estado.url && !estado.cargando) avisar({ url: null }); });
    }
    return audio;
}

// La que suena ahora (o null)
export const muestraSonando = () => estado.url;

export function pararMuestra() {
    audio?.pause();
    if (estado.url) avisar({ url: null, cargando: false });
}

// Suena la muestra, o se para si ya sonaba. Hay que llamarla al pulsar (el iPhone no deja
// sonar nada sin un toque). Falla sin cobertura: quien llama lo cuenta
export async function alternarMuestra(url: string): Promise<boolean> {
    const a = reproductor();
    if (estado.url === url) { pararMuestra(); return false; }
    a.pause();
    a.src = url;
    avisar({ url, cargando: true });
    try {
        await a.play();
        return true;
    } catch (e) {
        // Se pulsó otra antes de que empezara a sonar: no es un fallo
        if ((e as { name?: string })?.name === 'AbortError' && estado.url !== url) return false;
        if (estado.url === url) avisar({ url: null, cargando: false });
        throw e;
    }
}

const suscribir = (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };
const leer = () => estado;

// Lo que suena ahora. Con `pararAlSalir`, al irse de la pantalla se calla
export function useMuestra(pararAlSalir = false) {
    const actual = useSyncExternalStore(suscribir, leer);
    useEffect(() => (pararAlSalir ? pararMuestra : undefined), [pararAlSalir]);
    return { ...actual, alternar: alternarMuestra, parar: pararMuestra };
}
