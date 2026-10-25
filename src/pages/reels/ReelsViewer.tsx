import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronDown, ChevronLeft, ChevronUp, Heart, BadgeCheck, MessageCircle, Music2, Send, Volume2, VolumeX, Play, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Reel } from '../../types/reels';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import type { Senal } from '../../lib/recomendador';

// Visor de reels a pantalla completa. En el móvil se desliza (como Instagram);
// en el PC, el vídeo vertical va centrado sobre negro, con flechas, rueda y teclado.
// Solo se enseñan las acciones que existen de verdad: me gusta y comentarios.
// Avisa de lo que se ve entero y lo que se salta, para que el Feed aprenda.

interface ReelsViewerProps {
    reels: Reel[];
    initialIndex?: number;
    onClose: () => void;
    /** Publicaciones que el usuario ya ha marcado */
    likedIds?: Set<string>;
    /** Me gusta (quien lo pasa lo guarda en Firestore) */
    onLike?: (reel: Reel, liked: boolean) => void;
    /** Abrir los comentarios de este vídeo */
    onComentar?: (reel: Reel) => void;
    /** Gestos para el algoritmo: impresión, visto entero, saltado */
    onSenal?: (reel: Reel, s: Senal) => void;
}

const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
    return String(n);
};

const textoPresupuesto = (nombre: string) =>
    `Hola, ${nombre}. Me gustaría pedir presupuesto para un bolo.\nFecha: \nLugar: \nTipo de evento: \nDuración aproximada: `;

// ─── Un reel ─────────────────────────────────────────────────────────────────
const ReelItem = ({
    reel, isActive, isNear, muted, onToggleMute, liked, onLike, onComentar, onSenal, onPedirPresupuesto,
}: {
    reel: Reel;
    isActive: boolean;
    isNear: boolean;
    muted: boolean;
    onToggleMute: () => void;
    liked: boolean;
    onLike?: (liked: boolean) => void;
    onComentar?: () => void;
    onSenal?: (s: Senal) => void;
    onPedirPresupuesto: () => void;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [paused, setPaused] = useState(false);
    const [roto, setRoto] = useState(false);
    const [burst, setBurst] = useState(0);
    const progreso = useMotionValue(0);
    const lastTap = useRef(0);
    const esArtista = reel.origen === 'artista';
    const perfil = reel.perfilUrl || `/profile/${reel.authorId}`;

    // React no siempre pone el atributo «muted»: sin él, el navegador no deja arrancar solo
    useEffect(() => {
        const v = videoRef.current;
        if (v) { v.defaultMuted = true; v.muted = muted; }
    }, [muted]);

    // Lo que se ve entero (60 %) y lo que se salta (menos de 1,5 s), para el algoritmo
    const aviso = useRef(onSenal);
    useEffect(() => { aviso.current = onSenal; }, [onSenal]);
    const visto60 = useRef(false);
    useEffect(() => {
        if (!isActive) return;
        visto60.current = false;
        const desde = Date.now();
        aviso.current?.('impresion');
        return () => { if (Date.now() - desde < 1500 && !visto60.current) aviso.current?.('saltar'); };
    }, [isActive]);

    // Solo avanza el reel que está en pantalla
    useEffect(() => {
        const v = videoRef.current;
        if (!v || roto) return;
        if (isActive) {
            v.currentTime = 0;
            v.play().then(() => setPaused(false)).catch(() => setPaused(true));
        } else {
            v.pause();
        }
    }, [isActive, roto]);

    const like = (fromDoubleTap = false) => {
        if (!onLike) return;
        if (fromDoubleTap && liked) { setBurst(b => b + 1); return; }
        if (!liked) setBurst(b => b + 1);
        onLike(!liked);
        if (navigator.vibrate) navigator.vibrate(10);
    };

    // Un toque pausa o reanuda; en las publicaciones, doble toque = me gusta
    const onTap = () => {
        const v = videoRef.current;
        if (!v || roto) return;
        const alternar = () => { if (v.paused) { v.play().then(() => setPaused(false)).catch(() => {}); } else { v.pause(); setPaused(true); } };
        if (!onLike) { alternar(); return; }
        const now = Date.now();
        if (now - lastTap.current < 280) { lastTap.current = 0; like(true); return; }
        lastTap.current = now;
        setTimeout(() => { if (lastTap.current === now) alternar(); }, 290);
    };

    const share = async () => {
        const url = `${window.location.origin}${reel.shareUrl || `/reels/${reel.id}`}`;
        try {
            if (navigator.share) await navigator.share({ title: reel.authorName, text: reel.description, url });
            else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
        } catch { /* cancelado */ }
    };

    const likes = reel.likes;

    return (
        <section className="relative h-full w-full bg-black overflow-hidden" aria-label={`Vídeo de ${reel.authorName}`}>
            {/* Vídeo; si no carga, el póster (nunca una pantalla negra) */}
            <video
                ref={videoRef}
                src={isNear && !roto ? reel.videoUrl : undefined}
                poster={reel.thumbnailUrl || undefined}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay={isActive}
                muted
                loop
                playsInline
                preload={isNear ? 'auto' : 'none'}
                onError={() => setRoto(true)}
                onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (!v.duration) return;
                    progreso.set(v.currentTime / v.duration);
                    if (isActive && !visto60.current && v.currentTime / v.duration >= 0.6) {
                        visto60.current = true;
                        aviso.current?.('ver_entero');
                    }
                }}
            />
            {roto && reel.thumbnailUrl && (
                <img src={reel.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}

            {/* Capa de toques (encima del vídeo, debajo de los botones) */}
            <div className="absolute inset-0 z-10 touch-manipulation" onClick={onTap} />

            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

            {/* Icono de pausa */}
            <AnimatePresence>
                {paused && !roto && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <span className="h-20 w-20 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                            <Play className="h-9 w-9 text-white fill-white ml-1" />
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Corazón al dar doble toque */}
            <AnimatePresence>
                {burst > 0 && (
                    <motion.div
                        key={burst}
                        initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
                        animate={{ scale: [0.3, 1.2, 1], opacity: [0, 1, 1], rotate: 0 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        onAnimationComplete={() => setTimeout(() => setBurst(0), 250)}
                        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                    >
                        <Heart className="h-28 w-28 text-white fill-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Acciones a la derecha: solo las que existen */}
            <div className="absolute right-2 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-4">
                {onLike && (
                    <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'} className="flex flex-col items-center gap-1 w-14 active:opacity-70">
                        <motion.span animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
                            <Heart className={cn('h-8 w-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]', liked && 'fill-white')} />
                        </motion.span>
                        {likes > 0 && <span className="text-white text-xs font-bold drop-shadow">{fmt(likes)}</span>}
                    </button>
                )}
                {onComentar && (
                    <button onClick={onComentar} aria-label={reel.comments > 0 ? `Ver los ${reel.comments} comentarios` : 'Comentar'} className="flex flex-col items-center gap-1 w-14 active:opacity-70">
                        <MessageCircle className="h-8 w-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                        {reel.comments > 0 && <span className="text-white text-xs font-bold drop-shadow">{fmt(reel.comments)}</span>}
                    </button>
                )}
                <button onClick={share} aria-label={esArtista ? `Compartir el perfil de ${reel.authorName}` : 'Compartir'} className="w-14 flex justify-center active:opacity-70">
                    <Send className="h-7 w-7 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                </button>
            </div>

            {/* Quién es y qué hacer */}
            <div className="absolute left-0 right-16 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-20 px-4">
                <Link to={perfil} className="flex items-center gap-2.5 mb-2 max-w-full active:opacity-70">
                    {reel.authorPhoto ? (
                        <img src={reel.authorPhoto} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white" />
                    ) : (
                        <span className="h-10 w-10 shrink-0 rounded-full bg-white text-black font-bold flex items-center justify-center">{(reel.authorName || '·')[0].toUpperCase()}</span>
                    )}
                    <span className="text-[17px] font-bold text-white drop-shadow truncate">{reel.authorName}</span>
                    {reel.authorVerified && <BadgeCheck className="h-4 w-4 text-white shrink-0" aria-label="Verificado" />}
                </Link>
                {reel.description && <p className="text-white text-[15px] leading-snug line-clamp-2 drop-shadow">{reel.description}</p>}
                {reel.songTitle && (
                    <p className="mt-2 flex items-center gap-1.5 text-white/85 text-xs">
                        <Music2 className="h-3.5 w-3.5" /> <span className="truncate">{reel.songTitle} · {reel.songArtist}</span>
                    </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                    {esArtista ? (
                        <>
                            <Link to={perfil} className="pulsable h-9 px-4 rounded-full bg-primary text-primary-foreground text-[14px] font-bold flex items-center">Ver perfil</Link>
                            <button onClick={onPedirPresupuesto} className="pulsable h-9 px-4 rounded-full bg-white text-black text-[14px] font-semibold flex items-center">Pedir presupuesto</button>
                        </>
                    ) : (
                        <Link to={perfil} className="pulsable h-9 px-4 rounded-full bg-white text-black text-[14px] font-semibold flex items-center">Ver perfil</Link>
                    )}
                </div>
            </div>

            {/* Sonido: los clips de artista no llevan */}
            {!esArtista && (
                <button
                    onClick={onToggleMute}
                    aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                    className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-20 h-10 w-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
                >
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
            )}

            {/* Progreso */}
            {!roto && (
                <div className="absolute inset-x-0 bottom-[env(safe-area-inset-bottom)] z-20 h-0.5 bg-white/20">
                    <motion.div className="h-full w-full origin-left bg-white/90" style={{ scaleX: progreso }} />
                </div>
            )}
        </section>
    );
};

// ─── Visor ───────────────────────────────────────────────────────────────────
export default function ReelsViewer({ reels, initialIndex = 0, onClose, likedIds, onLike, onComentar, onSenal }: ReelsViewerProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const rootRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(initialIndex);
    const [muted, setMuted] = useState(true);
    // Arrastrar para cerrar solo con el dedo: con el ratón estorba
    const [tactil] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

    // Bloquear el scroll de la página de debajo
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // Empezar en el reel tocado
    useEffect(() => {
        const c = containerRef.current;
        if (c) c.scrollTop = initialIndex * c.clientHeight;
    }, [initialIndex]);

    // El reel activo es el que ocupa la pantalla
    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && e.intersectionRatio > 0.6) setCurrent(Number((e.target as HTMLElement).dataset.index));
            });
        }, { root: c, threshold: [0.6] });
        c.querySelectorAll('[data-index]').forEach(el => io.observe(el));
        return () => io.disconnect();
    }, [reels.length]);

    const go = useCallback((i: number) => {
        const c = containerRef.current;
        if (c && i >= 0 && i < reels.length) c.scrollTo({ top: i * c.clientHeight, behavior: 'smooth' });
    }, [reels.length]);

    // La rueda se engancha una vez: lee el reel actual y «go» de estas referencias
    const currentRef = useRef(current);
    const goRef = useRef(go);
    useEffect(() => { currentRef.current = current; goRef.current = go; }, [current, go]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(current + 1); }
            else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(current - 1); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [current, go, onClose]);

    // Rueda del ratón o trackpad: un gesto = un reel (también fuera de la columna del vídeo)
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        let acumulado = 0;
        let ultimo = 0;
        let bloqueadoHasta = 0;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const ahora = Date.now();
            if (ahora - ultimo > 250) acumulado = 0;
            ultimo = ahora;
            if (ahora < bloqueadoHasta) return;
            acumulado += e.deltaY;
            if (Math.abs(acumulado) < 40) return;
            goRef.current(currentRef.current + (acumulado > 0 ? 1 : -1));
            acumulado = 0;
            bloqueadoHasta = ahora + 700;
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const pedirPresupuesto = (reel: Reel) => {
        const destino = `/messages?userId=${reel.authorId}&texto=${encodeURIComponent(textoPresupuesto(reel.authorName))}`;
        if (user) navigate(destino);
        else navigate('/login', { state: { from: destino } });
    };

    // Deslizar hacia la derecha = volver (como Instagram): el reel se arrastra
    // y el fondo se aclara dejando ver lo que hay detrás
    const dragX = useMotionValue(0);
    const backdrop = useTransform(dragX, [0, 320], [1, 0.25]);

    const flecha = 'h-11 w-11 rounded-full bg-fill-strong text-foreground flex items-center justify-center active:opacity-70 disabled:opacity-30';

    return (
        // «dark»: el visor siempre es oscuro, como una sala con las luces apagadas
        <motion.div
            ref={rootRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="dark fixed inset-0 z-[70] text-foreground"
            role="dialog"
            aria-modal="true"
            aria-label="Vídeos"
        >
            <motion.div className="absolute inset-0 bg-background" style={{ opacity: backdrop }} aria-hidden />
            <motion.div
                className="absolute inset-0"
                style={{ x: dragX }}
                drag={tactil ? 'x' : false}
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.9 }}
                dragMomentum={false}
                onDragEnd={(_, info) => { if (info.offset.x > 110 || info.velocity.x > 600) onClose(); }}
            >
                {/* En el PC, columna vertical 9:16 centrada */}
                <div className="absolute inset-0 md:inset-y-4 md:left-1/2 md:-translate-x-1/2 md:w-[min(100%,calc((100dvh-2rem)*9/16))] md:rounded-[22px] overflow-hidden bg-black">
                    <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-contain hide-scrollbar">
                        {reels.map((reel, i) => (
                            <div key={reel.id} data-index={i} className="h-full w-full snap-start snap-always">
                                <ReelItem
                                    reel={reel}
                                    isActive={i === current}
                                    isNear={Math.abs(i - current) <= 1}
                                    muted={muted}
                                    onToggleMute={() => setMuted(m => !m)}
                                    liked={!!likedIds?.has(reel.id)}
                                    onLike={onLike ? (on) => onLike(reel, on) : undefined}
                                    onComentar={onComentar ? () => onComentar(reel) : undefined}
                                    onSenal={onSenal ? (x) => onSenal(reel, x) : undefined}
                                    onPedirPresupuesto={() => pedirPresupuesto(reel)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Volver (móvil) */}
                    <div className="md:hidden absolute left-0 top-[env(safe-area-inset-top)] z-30 flex items-center gap-1 p-2">
                        <button onClick={onClose} aria-label="Volver" className="h-11 w-11 rounded-full flex items-center justify-center text-white bg-black/30 backdrop-blur">
                            <ChevronLeft className="h-7 w-7" />
                        </button>
                        <span className="font-bold text-white text-lg drop-shadow">Vídeos</span>
                    </div>
                </div>

                {/* PC: cerrar arriba y flechas al lado */}
                <button onClick={onClose} aria-label="Cerrar" className={cn(flecha, 'hidden md:flex absolute top-5 right-5 z-30')}>
                    <X className="h-6 w-6" />
                </button>
                {reels.length > 1 && (
                    <div className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 flex-col gap-3">
                        <button onClick={() => go(current - 1)} disabled={current <= 0} aria-label="Vídeo anterior" className={flecha}>
                            <ChevronUp className="h-6 w-6" />
                        </button>
                        <button onClick={() => go(current + 1)} disabled={current >= reels.length - 1} aria-label="Vídeo siguiente" className={flecha}>
                            <ChevronDown className="h-6 w-6" />
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
