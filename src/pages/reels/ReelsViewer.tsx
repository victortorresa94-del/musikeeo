import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Heart, MessageCircle, Send, Bookmark, BadgeCheck, Music2,
    Volume2, VolumeX, Play, X,
} from 'lucide-react';
import { type Reel, type ReelComment } from '../../types/reels';
import { getReelComments } from '../../services/reelsData';
import { cn } from '../../lib/utils';

interface ReelsViewerProps {
    reels: Reel[];
    initialIndex?: number;
    onClose: () => void;
    onLoadMore?: () => void;
    source?: 'profile' | 'feed' | 'discover' | 'trending';
}

const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
    return String(n);
};

// ─── Un reel ─────────────────────────────────────────────────────────────────
const ReelItem = ({
    reel, isActive, isNear, muted, onToggleMute, onOpenComments, onNavigateProfile,
}: {
    reel: Reel;
    isActive: boolean;
    isNear: boolean;
    muted: boolean;
    onToggleMute: () => void;
    onOpenComments: () => void;
    onNavigateProfile: (userId: string) => void;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [paused, setPaused] = useState(false);
    const [liked, setLiked] = useState(!!reel.isLiked);
    const [saved, setSaved] = useState(!!reel.isSaved);
    const [burst, setBurst] = useState(0);
    const [progress, setProgress] = useState(0);
    const lastTap = useRef(0);
    const isNative = !reel.gumletId;

    // Solo suena/avanza el reel que está en pantalla
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (isActive) {
            v.currentTime = 0;
            v.play().then(() => setPaused(false)).catch(() => setPaused(true));
        } else {
            v.pause();
        }
    }, [isActive]);

    const like = (fromDoubleTap = false) => {
        if (fromDoubleTap && liked) { setBurst(b => b + 1); return; }
        setLiked(v => !v);
        if (!liked) setBurst(b => b + 1);
        if (navigator.vibrate) navigator.vibrate(10);
    };

    // Un toque pausa/reanuda; doble toque = me gusta
    const onTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 280) { lastTap.current = 0; like(true); return; }
        lastTap.current = now;
        setTimeout(() => {
            if (lastTap.current !== now || !videoRef.current) return;
            const v = videoRef.current;
            if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
        }, 290);
    };

    const share = async () => {
        const url = `${window.location.origin}/reels/${reel.id}`;
        try {
            if (navigator.share) await navigator.share({ title: reel.authorName, text: reel.description, url });
            else await navigator.clipboard.writeText(url);
        } catch { /* cancelado */ }
    };

    const isDemo = reel.authorId === 'demo' || reel.id.startsWith('reel_');

    return (
        <section className="relative h-full w-full snap-start snap-always bg-black overflow-hidden" aria-label={`Reel de ${reel.authorName}`}>
            {/* Vídeo */}
            {isNative ? (
                <video
                    ref={videoRef}
                    src={isNear ? reel.videoUrl : undefined}
                    poster={reel.thumbnailUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    muted={muted}
                    loop
                    playsInline
                    preload={isNear ? 'auto' : 'none'}
                    onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        if (v.duration) setProgress(v.currentTime / v.duration);
                    }}
                />
            ) : (
                <>
                    <img src={reel.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    {isActive && (
                        <iframe
                            src={`https://play.gumlet.io/embed/${reel.gumletId}?autoplay=true&loop=true&muted=${muted}&preload=true&controls=false`}
                            className="absolute inset-0 h-full w-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            title={reel.description}
                        />
                    )}
                </>
            )}

            {/* Capa de toques (encima del vídeo, debajo de los botones) */}
            {isNative && <div className="absolute inset-0 z-10" onClick={onTap} />}

            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

            {/* Icono de pausa */}
            <AnimatePresence>
                {paused && isNative && (
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
                        <Heart className="h-28 w-28 text-primary fill-primary drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Acciones a la derecha */}
            <div className="absolute right-2 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-4">
                <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'} className="flex flex-col items-center gap-1 w-14">
                    <motion.span animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
                        <Heart className={cn('h-8 w-8 drop-shadow-lg', liked ? 'text-primary fill-primary' : 'text-white')} />
                    </motion.span>
                    <span className="text-white text-xs font-bold drop-shadow">{fmt(reel.likes + (liked ? 1 : 0))}</span>
                </button>
                <button onClick={onOpenComments} aria-label="Comentarios" className="flex flex-col items-center gap-1 w-14">
                    <MessageCircle className="h-8 w-8 text-white drop-shadow-lg" />
                    <span className="text-white text-xs font-bold drop-shadow">{fmt(reel.comments)}</span>
                </button>
                <button onClick={share} aria-label="Compartir" className="flex flex-col items-center gap-1 w-14">
                    <Send className="h-7 w-7 text-white drop-shadow-lg" />
                    <span className="text-white text-xs font-bold drop-shadow">{fmt(reel.shares)}</span>
                </button>
                <button onClick={() => setSaved(v => !v)} aria-pressed={saved} aria-label={saved ? 'Quitar de guardados' : 'Guardar'} className="w-14 flex justify-center">
                    <Bookmark className={cn('h-7 w-7 drop-shadow-lg', saved ? 'text-primary fill-primary' : 'text-white')} />
                </button>
            </div>

            {/* Info abajo */}
            <div className="absolute left-0 right-16 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-20 px-4">
                <button onClick={() => onNavigateProfile(reel.authorId)} className="flex items-center gap-2.5 mb-2.5 max-w-full">
                    {reel.authorPhoto ? (
                        <img src={reel.authorPhoto} alt="" className="h-9 w-9 rounded-full object-cover border border-white/60" />
                    ) : (
                        <span className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground font-heading font-bold flex items-center justify-center">{reel.authorName[0]}</span>
                    )}
                    <span className="font-bold text-white drop-shadow truncate">{reel.authorName}</span>
                    {reel.authorVerified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                    {isDemo && <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/80 border border-white/40 rounded-full px-2 py-0.5">Demo</span>}
                </button>
                <p className="text-white text-sm leading-snug line-clamp-2 drop-shadow">{reel.description}</p>
                {reel.songTitle && (
                    <p className="mt-2 flex items-center gap-1.5 text-white/85 text-xs">
                        <Music2 className="h-3.5 w-3.5" /> <span className="truncate">{reel.songTitle} · {reel.songArtist}</span>
                    </p>
                )}
            </div>

            {/* Sonido */}
            <button
                onClick={onToggleMute}
                aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-20 h-10 w-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
            >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            {/* Progreso */}
            {isNative && (
                <div className="absolute inset-x-0 bottom-[env(safe-area-inset-bottom)] z-20 h-0.5 bg-white/20">
                    <div className="h-full bg-white/90" style={{ width: `${progress * 100}%` }} />
                </div>
            )}
        </section>
    );
};

// ─── Comentarios ─────────────────────────────────────────────────────────────
const CommentsSheet = ({ reel, onClose }: { reel: Reel; onClose: () => void }) => {
    const [comments, setComments] = useState<ReelComment[]>(() => getReelComments(reel.id));
    const [text, setText] = useState('');
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setComments(c => [{ id: `c_${Date.now()}`, authorId: 'me', authorName: 'Tú', authorPhoto: '', content: text.trim(), timestamp: Date.now(), likes: 0, isLiked: false }, ...c]);
        setText('');
    };
    return (
        <motion.div className="absolute inset-0 z-40 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <motion.div
                role="dialog" aria-label="Comentarios"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}
                className="relative w-full h-[65%] bg-card rounded-t-3xl flex flex-col"
            >
                <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-white/25" />
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <p className="font-heading font-bold">{fmt(reel.comments)} comentarios</p>
                    <button onClick={onClose} aria-label="Cerrar" className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
                    {comments.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Sé el primero en comentar</p>}
                    {comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                            <span className="h-9 w-9 shrink-0 rounded-full bg-muted font-bold flex items-center justify-center">{c.authorName[0]}</span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground">{c.authorName}</p>
                                <p className="text-sm text-foreground/90">{c.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={submit} className="flex items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border">
                    <input value={text} onChange={e => setText(e.target.value)} placeholder="Añade un comentario…" className="flex-1 h-11 rounded-full bg-muted px-4 text-base outline-none focus:ring-1 focus:ring-primary" />
                    <button type="submit" disabled={!text.trim()} className="h-11 px-4 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-40">Enviar</button>
                </form>
            </motion.div>
        </motion.div>
    );
};

// ─── Visor ───────────────────────────────────────────────────────────────────
export default function ReelsViewer({ reels, initialIndex = 0, onClose, onLoadMore }: ReelsViewerProps) {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(initialIndex);
    const [muted, setMuted] = useState(true);
    const [commentsFor, setCommentsFor] = useState<Reel | null>(null);

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
                if (e.isIntersecting && e.intersectionRatio > 0.6) {
                    const idx = Number((e.target as HTMLElement).dataset.index);
                    setCurrent(idx);
                    if (idx >= reels.length - 2) onLoadMore?.();
                }
            });
        }, { root: c, threshold: [0.6] });
        c.querySelectorAll('[data-index]').forEach(el => io.observe(el));
        return () => io.disconnect();
    }, [reels.length, onLoadMore]);

    const go = useCallback((i: number) => {
        const c = containerRef.current;
        if (c && i >= 0 && i < reels.length) c.scrollTo({ top: i * c.clientHeight, behavior: 'smooth' });
    }, [reels.length]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { if (commentsFor) setCommentsFor(null); else onClose(); }
            else if (e.key === 'ArrowDown') go(current + 1);
            else if (e.key === 'ArrowUp') go(current - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [current, go, onClose, commentsFor]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black"
        >
            <div className="absolute inset-0 md:inset-y-0 md:left-1/2 md:-translate-x-1/2 md:w-[min(100%,calc(100dvh*9/16))]">
                <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-contain hide-scrollbar">
                    {reels.map((reel, i) => (
                        <div key={reel.id} data-index={i} className="h-full w-full snap-start snap-always">
                            <ReelItem
                                reel={reel}
                                isActive={i === current}
                                isNear={Math.abs(i - current) <= 1}
                                muted={muted}
                                onToggleMute={() => setMuted(m => !m)}
                                onOpenComments={() => setCommentsFor(reel)}
                                onNavigateProfile={(uid) => { if (uid !== 'demo') navigate(`/profile/${uid}`); }}
                            />
                        </div>
                    ))}
                </div>

                {/* Volver */}
                <div className="absolute left-0 top-[env(safe-area-inset-top)] z-30 flex items-center gap-1 p-2">
                    <button onClick={onClose} aria-label="Volver" className="h-11 w-11 rounded-full flex items-center justify-center text-white bg-black/30 backdrop-blur">
                        <ChevronLeft className="h-7 w-7" />
                    </button>
                    <span className="font-heading font-bold text-white text-lg drop-shadow">Reels</span>
                </div>

                <AnimatePresence>
                    {commentsFor && <CommentsSheet reel={commentsFor} onClose={() => setCommentsFor(null)} />}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
