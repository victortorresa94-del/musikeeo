// El reproductor de YouTube (IFrame Player API) para Escuchar en la canción. Sin React. La API se
// pide a YouTube solo al usarla (al pulsar «Escuchar»), nunca en el arranque: sin red no hay nada
// que bajar y la app sigue igual.

export interface ReproductorYT {
    playVideo(): void;
    pauseVideo(): void;
    seekTo(segundos: number, permitirBuscar: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    getPlaybackRate?(): number;
    destroy(): void;
}

interface OpcionesYT {
    videoId: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, string | number>;
    events?: {
        onReady?: (e: { target: ReproductorYT }) => void;
        onStateChange?: (e: { data: number; target: ReproductorYT }) => void;
        onError?: (e: { data: number; target: ReproductorYT }) => void;
    };
}

interface APIYT { Player: new (el: HTMLElement, opciones: OpcionesYT) => ReproductorYT }

declare global {
    interface Window {
        YT?: APIYT;
        onYouTubeIframeAPIReady?: () => void;
    }
}

// Los estados que da getPlayerState (los de YT.PlayerState, por su número)
export const YT_ESTADO = { sinEmpezar: -1, terminado: 0, sonando: 1, pausa: 2, cargando: 3, listo: 5 } as const;

let cargando: Promise<APIYT> | null = null;

// La API, una sola vez. Falla si no llega en 15 s (sin red, o YouTube bloqueado)
export function cargarYouTube(): Promise<APIYT> {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (cargando) return cargando;
    cargando = new Promise<APIYT>((ok, mal) => {
        const fallar = () => { cargando = null; mal(new Error('SIN_YOUTUBE')); };
        const antes = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            antes?.();
            if (window.YT?.Player) ok(window.YT); else fallar();
        };
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.async = true;
        s.onerror = () => { s.remove(); fallar(); };
        document.head.appendChild(s);
        setTimeout(() => { if (!window.YT?.Player) fallar(); }, 15000);
    });
    return cargando;
}

// Lo que dice YouTube cuando un vídeo no se puede poner aquí (los códigos de onError)
export function motivoYT(codigo: number): string {
    if (codigo === 101 || codigo === 150 || codigo === 153) return 'Este vídeo no se puede ver fuera de YouTube. Prueba con otro.';
    if (codigo === 100) return 'Ese vídeo ya no está en YouTube o es privado.';
    if (codigo === 2) return 'Ese enlace no es de un vídeo de YouTube.';
    return 'YouTube no ha podido poner el vídeo.';
}
