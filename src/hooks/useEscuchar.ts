import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import { useCancionero } from './useCancionero';
import { cargarYouTube, motivoYT, YT_ESTADO, type ReproductorYT } from '../lib/youtube';
import { conMarca, lineaEnTiempo, minSeg, type Marca } from '../lib/seguir';
import { INTRO } from '../lib/cantar';
import type { AjustesCancion, Cancion } from '../types/cancionero';

// Escuchar la canción con su vídeo de YouTube y que la hoja la siga (13-nov, Víctor, con una
// captura de GuitarTuna: «que se reproduzcan y vaya con los acordes bajando»). La línea que suena
// se marca como en el «Línea a línea» de Tocar (data-ahora + .teleprompter) y se queda a un tercio
// de la pantalla. Mientras suena, tocar una línea dice «esta suena ahora»: se guarda una marca
// (ajustes.marcas) y la hoja queda clavada a la grabación.

export type EstadoEscuchar = 'cargando' | 'listo' | 'sonando' | 'pausa' | 'fin' | 'error';

const CLAVE_EXPLICADO = 'musikeeo-escuchar-marcas-explicado';
const CLAVE_AYUDA = 'musikeeo-escuchar-ayuda';

// La primera vez que suena: cómo se clava la hoja a la canción
function ayudaPrimeraVez() {
    try {
        if (localStorage.getItem(CLAVE_AYUDA)) return;
        localStorage.setItem(CLAVE_AYUDA, '1');
    } catch { return; }
    toast('La hoja baja con la canción', {
        description: 'Si va adelantada o atrasada, toca la línea que está sonando y se queda clavada.',
        duration: 8000,
    });
}

export interface Escuchar {
    video?: string;
    abierto: boolean;              // el reproductor está abajo
    estado: EstadoEscuchar;
    sonando: boolean;              // suena (o carga mientras suena): tocar una línea la marca
    error: string | null;
    pideToque: boolean;            // en el iPhone el primer play lo da la persona tocando el vídeo
    hojaVideo: boolean;
    marcas: number;
    pulsar: () => void;            // el botón «Escuchar» de la canción
    alternar: () => void;          // play / pausa
    cerrar: () => void;
    irA: (segundos: number) => void;
    leer: () => { t: number; duracion: number };
    abrirHojaVideo: () => void;
    cerrarHojaVideo: () => void;
    ponerVideo: (id: string) => void;
    quitarVideo: () => void;
    borrarMarcas: () => void;
    alTocarHoja: (e: React.MouseEvent) => void;
    ponerMarco: (el: HTMLDivElement | null) => void;   // donde va el vídeo
    ponerBarra: (el: HTMLDivElement | null) => void;   // el reproductor (la hoja se guía por encima)
}

export function useEscuchar({ cancion, ajustes, cambiar, zonaRef, seguir, onSuena }: {
    cancion: Cancion;
    ajustes: AjustesCancion;
    cambiar: (cambio: Partial<AjustesCancion>) => void;
    zonaRef: RefObject<HTMLDivElement | null>;       // la hoja de la canción (sus [data-linea])
    seguir: boolean;                                   // mover la página (no con «que quepa» ni editando)
    onSuena?: () => void;
}): Escuchar {
    const { guardar } = useCancionero();
    const video = cancion.youtube;
    const [abierto, setAbierto] = useState(false);
    const [estado, setEstado] = useState<EstadoEscuchar>('cargando');
    const [error, setError] = useState<string | null>(null);
    const [pideToque, setPideToque] = useState(false);
    const [hojaVideo, setHojaVideo] = useState(false);

    const marcoRef = useRef<HTMLDivElement>(null);
    const barraRef = useRef<HTMLDivElement>(null);
    const reproductor = useRef<ReproductorYT | null>(null);
    const quiereSonar = useRef(false);
    const tiempo = useRef(0);
    const lineas = useRef<HTMLElement[]>([]);

    // Lo último de la canción, para el bucle y los toques (sin volver a montarlo en cada cambio)
    const marcas = ajustes.marcas ?? [];
    const vivos = useRef({ marcas, intro: ajustes.intro ?? INTRO, duracion: cancion.duracion ?? 0, seguir, cambiar, onSuena });
    useEffect(() => {
        vivos.current = { marcas, intro: ajustes.intro ?? INTRO, duracion: cancion.duracion ?? 0, seguir, cambiar, onSuena };
    });

    // ---- El reproductor: se monta al abrir y se quita al cerrar o al cambiar de vídeo ----
    useEffect(() => {
        if (!abierto || !video) return;
        let vivo = true;
        let p: ReproductorYT | null = null;
        let espera: ReturnType<typeof setTimeout> | undefined;
        const marco = marcoRef.current;
        cargarYouTube().then(YT => {
            if (!vivo || !marco) return;
            // YouTube cambia el elemento por su iframe: uno nuestro, fuera de React
            const sitio = document.createElement('div');
            marco.appendChild(sitio);
            p = new YT.Player(sitio, {
                videoId: video,
                width: '100%',
                height: '100%',
                playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
                events: {
                    onReady: e => {
                        if (!vivo) return;
                        reproductor.current = e.target;
                        setEstado('listo');
                        if (!quiereSonar.current) return;
                        quiereSonar.current = false;
                        e.target.playVideo();
                        // En el iPhone no arranca si no se toca el vídeo: se dice
                        espera = setTimeout(() => {
                            const s = reproductor.current?.getPlayerState();
                            if (vivo && s !== YT_ESTADO.sonando && s !== YT_ESTADO.cargando) setPideToque(true);
                        }, 1800);
                    },
                    onStateChange: e => {
                        if (!vivo) return;
                        if (e.data === YT_ESTADO.sonando || e.data === YT_ESTADO.cargando) {
                            setEstado('sonando');
                            setPideToque(false);
                            setError(null);
                            vivos.current.onSuena?.();
                            ayudaPrimeraVez();
                        } else if (e.data === YT_ESTADO.pausa) setEstado('pausa');
                        else if (e.data === YT_ESTADO.terminado) setEstado('fin');
                        else setEstado('listo');
                    },
                    onError: e => {
                        if (!vivo) return;
                        setError(motivoYT(e.data));
                        setEstado('error');
                    },
                },
            });
        }).catch(() => {
            if (!vivo) return;
            toast.error('No se pudo cargar YouTube', { description: 'Mira la conexión y vuelve a probar.' });
            setAbierto(false);
        });
        return () => {
            vivo = false;
            clearTimeout(espera);
            try { p?.destroy(); } catch { /* ya no estaba */ }
            reproductor.current = null;
            if (marco) marco.replaceChildren();
        };
    }, [abierto, video]);

    // ---- La hoja sigue a la canción: la línea que suena, marcada y a un tercio de la pantalla ----
    useEffect(() => {
        if (!abierto) return;
        const zona = zonaRef.current;
        if (!zona) return;
        let raf = 0, antes = performance.now(), resto = 0, manualHasta = 0;
        let base = { t: -1, en: 0 };
        let marcada: HTMLElement | null = null;
        let sucias = true;
        const cambios = new MutationObserver(() => { sucias = true; });
        cambios.observe(zona, { childList: true, subtree: true });
        // Si la persona mueve la hoja con el dedo o la rueda, se le deja un rato
        const aMano = () => { manualHasta = performance.now() + 3500; };
        const teclas = (e: KeyboardEvent) => { if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) aMano(); };
        window.addEventListener('wheel', aMano, { passive: true });
        window.addEventListener('touchmove', aMano, { passive: true });
        window.addEventListener('keydown', teclas);

        const paso = (ahora: number) => {
            raf = requestAnimationFrame(paso);
            const dt = Math.min(100, ahora - antes);
            antes = ahora;
            const p = reproductor.current;
            if (!p) return;
            if (sucias) { lineas.current = Array.from(zona.querySelectorAll<HTMLElement>('[data-hoja-cancion] [data-linea]')); sucias = false; }
            const ls = lineas.current;
            // El tiempo de YouTube llega a saltos: entre uno y otro se cuenta con el reloj
            let s: number = YT_ESTADO.sinEmpezar, crudo = 0, ritmo = 1;
            try { s = p.getPlayerState(); crudo = p.getCurrentTime() || 0; ritmo = p.getPlaybackRate?.() || 1; } catch { return; }
            if (crudo !== base.t) base = { t: crudo, en: ahora };
            const t = s === YT_ESTADO.sonando ? base.t + Math.min(1.5, (ahora - base.en) / 1000) * ritmo : crudo;
            tiempo.current = t;
            const n = ls.length;
            if (!n) return;
            const { marcas: ms, intro, duracion } = vivos.current;
            let dur = 0;
            try { dur = p.getDuration() || 0; } catch { /* sin vídeo aún */ }
            const l = lineaEnTiempo(t, n, dur || duracion, ms, intro);
            const i = Math.min(n - 1, Math.floor(l + 1e-6));
            const linea = ls[i];
            if (linea !== marcada) {
                marcada?.removeAttribute('data-ahora');
                linea.setAttribute('data-ahora', '');
                marcada = linea;
            }
            // Mover la página solo mientras suena, y sin pelearse con la mano
            if (!vivos.current.seguir || (s !== YT_ESTADO.sonando && s !== YT_ESTADO.cargando) || ahora < manualHasta) return;
            const a = linea.getBoundingClientRect().top;
            const b = i + 1 < n ? ls[i + 1].getBoundingClientRect().top : a;
            const y = a + (b - a) * Math.max(0, Math.min(1, l - i));
            const arriba = Math.max(0, document.querySelector('header')?.getBoundingClientRect().bottom ?? 0);
            const abajo = barraRef.current?.getBoundingClientRect().top ?? window.innerHeight;
            const guia = arriba + Math.max(0, abajo - arriba) / 3;
            const falta = y - guia;
            if (Math.abs(falta) < 1) { resto = 0; return; }
            resto += falta * Math.min(1, (dt / 1000) * 4);
            const px = Math.trunc(resto);
            if (px) { resto -= px; window.scrollBy(0, px); }
        };
        raf = requestAnimationFrame(paso);
        return () => {
            cancelAnimationFrame(raf);
            cambios.disconnect();
            window.removeEventListener('wheel', aMano);
            window.removeEventListener('touchmove', aMano);
            window.removeEventListener('keydown', teclas);
            marcada?.removeAttribute('data-ahora');
        };
    }, [abierto, zonaRef]);

    const alternar = useCallback(() => {
        const p = reproductor.current;
        if (!p) return;
        try {
            const s = p.getPlayerState();
            if (s === YT_ESTADO.sonando || s === YT_ESTADO.cargando) p.pauseVideo();
            else p.playVideo();
        } catch { /* el vídeo aún no está */ }
    }, []);

    const pulsar = () => {
        if (!navigator.onLine) { toast('Sin conexión: YouTube necesita internet', { id: 'escuchar-sin-red' }); return; }
        if (!video) { setHojaVideo(true); return; }
        if (!abierto) { quiereSonar.current = true; setError(null); setEstado('cargando'); setAbierto(true); return; }
        alternar();
    };

    const cerrar = () => {
        setAbierto(false);
        setPideToque(false);
        setError(null);
        quiereSonar.current = false;
    };

    const ponerVideo = (id: string) => {
        const otro = id !== video;
        if (otro || !video) {
            const sinMarcas = otro && ajustes.marcas?.length ? { ...ajustes, marcas: [] } : ajustes;
            guardar({ ...cancion, ajustes: sinMarcas, youtube: id }, { esperar: true, campos: ['ajustes', 'youtube'] });
        }
        setHojaVideo(false);
        if (!navigator.onLine) { toast('Vídeo guardado. Sin conexión: YouTube necesita internet', { id: 'escuchar-sin-red' }); return; }
        quiereSonar.current = true;
        setError(null);
        setPideToque(false);
        setEstado('cargando');
        setAbierto(true);
    };

    const quitarVideo = () => {
        const antes = { ...cancion, ajustes };
        guardar({ ...cancion, youtube: undefined, ajustes: ajustes.marcas?.length ? { ...ajustes, marcas: [] } : ajustes }, { esperar: true });
        setHojaVideo(false);
        cerrar();
        toast('Vídeo quitado', { action: { label: 'Deshacer', onClick: () => guardar(antes, { esperar: true }) } });
    };

    const borrarMarcas = () => {
        const antes = ajustes.marcas ?? [];
        cambiar({ marcas: [] });
        toast('Marcas borradas', { action: { label: 'Deshacer', onClick: () => vivos.current.cambiar({ marcas: antes }) } });
    };

    // Refs de función: el reproductor las pone al pintarse
    const ponerMarco = useCallback((el: HTMLDivElement | null) => { marcoRef.current = el; }, []);
    const ponerBarra = useCallback((el: HTMLDivElement | null) => { barraRef.current = el; }, []);

    const irA = useCallback((segundos: number) => {
        try { reproductor.current?.seekTo(Math.max(0, segundos), true); } catch { /* aún no */ }
    }, []);

    const leer = useCallback(() => {
        const p = reproductor.current;
        let duracion = 0;
        try { duracion = p?.getDuration() || 0; } catch { /* aún no */ }
        return { t: tiempo.current, duracion: duracion || vivos.current.duracion };
    }, []);

    // Mientras suena: tocar una línea = «esta línea suena ahora» (en vez de editarla)
    const alTocarHoja = useCallback((e: React.MouseEvent) => {
        const el = (e.target as HTMLElement).closest<HTMLElement>('[data-linea]');
        const i = el ? lineas.current.indexOf(el) : -1;
        if (i < 0) return;
        e.stopPropagation();
        e.preventDefault();
        const t = tiempo.current;
        if (t <= 0) return;
        const antes: Marca[] = vivos.current.marcas;
        vivos.current.cambiar({ marcas: conMarca(antes, { l: i, t }) });
        const deshacer = { label: 'Deshacer', onClick: () => vivos.current.cambiar({ marcas: antes }) };
        let explicado = false;
        try { explicado = !!localStorage.getItem(CLAVE_EXPLICADO); localStorage.setItem(CLAVE_EXPLICADO, '1'); } catch { /* sin almacenamiento */ }
        if (!explicado) {
            toast(`Esta línea suena en el ${minSeg(t)}`, {
                id: 'marca-linea',
                description: 'Mientras suena, toca cada línea cuando empiece y la hoja irá clavada a la canción. Se guarda en la canción para la próxima vez.',
                duration: 9000,
                action: deshacer,
            });
        } else {
            toast(`Clavada en el ${minSeg(t)}`, { id: 'marca-linea', duration: 2000, action: deshacer });
        }
    }, []);

    return {
        video, abierto, estado, error, pideToque, hojaVideo,
        sonando: abierto && estado === 'sonando',
        marcas: marcas.length,
        pulsar, alternar, cerrar, irA, leer,
        abrirHojaVideo: () => setHojaVideo(true),
        cerrarHojaVideo: () => setHojaVideo(false),
        ponerVideo, quitarVideo, borrarMarcas, alTocarHoja,
        ponerMarco, ponerBarra,
    };
}
