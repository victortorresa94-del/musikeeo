import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Play, Heart, MessageCircle, Share2, BadgeCheck, ShoppingBag, Calendar,
    ArrowRight, Image as ImageIcon, Plus, Music2, Speaker, Sparkles, MapPin, Info, Check,
    MoreHorizontal, Trash2, Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { MOCK_REELS, LOCAL_REELS, MOCK_POSTS, type FeedPost } from '../../services/reelsData';
import ReelsViewer from '../reels/ReelsViewer';
import { eventService } from '../../services/eventService';
import { getArtists } from '../../services/artistService';
import type { Artist, Event, Listing, Post } from '../../types';
import { postService } from '../../services/postService';
import { NewPostSheet } from '../../components/feed/NewPostSheet';
import { cn } from '../../lib/utils';

type Reel = typeof MOCK_REELS[number];

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K` : String(n);

// ─── Avatar con inicial si la foto no carga (nada de caras inventadas) ───────
const Avatar = ({ src, name, className }: { src?: string; name: string; className?: string }) => {
    const [broken, setBroken] = useState(!src);
    return broken ? (
        <div className={cn('rounded-full bg-fill-strong flex items-center justify-center font-heading font-semibold text-foreground/90', className)}>
            {name.slice(0, 1).toUpperCase()}
        </div>
    ) : (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={cn('rounded-full object-cover', className)} />
    );
};

// Imagen con respaldo de marca si falla la red
const SafeImg = ({ src, alt, className, fallback }: { src?: string; alt: string; className?: string; fallback?: React.ReactNode }) => {
    const [broken, setBroken] = useState(!src);
    if (broken) return <div className={cn('flex items-center justify-center bg-gradient-to-br from-primary/20 via-muted to-muted', className)}>{fallback ?? <Music2 className="h-10 w-10 text-primary-ink/60" />}</div>;
    return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setBroken(true)} className={className} />;
};

// Vídeo del feed: se reproduce solo cuando está en pantalla (como Instagram)
const InlineVideo = ({ src, poster, className }: { src: string; poster: string; className?: string }) => {
    const ref = useRef<HTMLVideoElement>(null);
    const [near, setNear] = useState(false);
    useEffect(() => {
        const v = ref.current;
        if (!v) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const io = new IntersectionObserver(([e]) => {
            if (e.intersectionRatio > 0) setNear(true);
            if (reduce) return;
            if (e.intersectionRatio >= 0.6) v.play().catch(() => {});
            else v.pause();
        }, { threshold: [0, 0.6], rootMargin: '200px 0px' });
        io.observe(v);
        return () => io.disconnect();
    }, []);
    return (
        <video
            ref={ref}
            src={near ? src : undefined}
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            className={className}
            aria-hidden
        />
    );
};

// ─── Historias: tu reel + reels ──────────────────────────────────────────────
const StoriesRow = ({ onOpen, onCreate, signedIn }: { onOpen: (id: string) => void; onCreate: () => void; signedIn: boolean }) => (
    <section aria-label="Reels" className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-3.5 overflow-x-auto hide-scrollbar pb-1">
            <button onClick={onCreate} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]">
                <span className="h-[68px] w-[68px] rounded-full bg-fill flex items-center justify-center text-foreground">
                    <Plus className="h-6 w-6" />
                </span>
                <span className="text-[11px] text-foreground/80 truncate w-full text-center">{signedIn ? 'Tu reel' : 'Súbete'}</span>
            </button>
            {MOCK_REELS.slice(0, 8).map(reel => (
                <button key={reel.id} onClick={() => onOpen(reel.id)} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]" aria-label={`Ver reel de ${reel.authorName}`}>
                    <span className="h-[68px] w-[68px] rounded-full p-[2px] bg-gradient-to-tr from-primary to-amber-200">
                        <span className="block h-full w-full rounded-full p-[2px] bg-background">
                            <SafeImg src={reel.thumbnailUrl} alt="" className="h-full w-full rounded-full object-cover" fallback={<span className="font-heading font-bold text-primary-ink">{reel.authorName[0]}</span>} />
                        </span>
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate w-full text-center">{reel.authorName.split(' ')[0]}</span>
                </button>
            ))}
        </div>
    </section>
);

// ─── Atajos ──────────────────────────────────────────────────────────────────
const SHORTCUTS = [
    { to: '/artistas', label: 'Artistas', Icon: Music2 },
    { to: '/eventos', label: 'Bolos', Icon: Calendar },
    { to: '/sonido', label: 'Técnicos', Icon: Speaker },
    { to: '/market', label: 'Mercado', Icon: ShoppingBag },
    { to: '/rodrigo', label: 'Rodrigo IA', Icon: Sparkles },
];

// ─── Publicar ────────────────────────────────────────────────────────────────
const Composer = ({ user, go, onCreate }: { user: any; go: (p: string) => void; onCreate: () => void }) => (
    <div className="bg-card border border-border rounded-2xl p-3">
        <div className="flex items-center gap-3">
            <Avatar src={user?.photoURL} name={user?.displayName || 'Tú'} className="h-10 w-10 text-sm shrink-0" />
            <button onClick={onCreate} className="flex-1 h-11 text-left bg-muted border border-border rounded-full px-4 text-sm text-muted-foreground hover:border-primary/40 transition-colors">
                {user ? '¿Qué estás tocando estos días?' : 'Entra y comparte tu música'}
            </button>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-2">
            {[
                { label: 'Foto o vídeo', Icon: ImageIcon, to: '' },
                { label: 'Bolo', Icon: Calendar, to: '/publicar' },
                { label: 'Vender', Icon: ShoppingBag, to: '/market/create' },
            ].map(a => (
                <button key={a.label} onClick={() => a.to ? go(a.to) : onCreate()} className="h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary-ink transition-colors">
                    <a.Icon className="h-[18px] w-[18px]" /> {a.label}
                </button>
            ))}
        </div>
    </div>
);

// ─── Tarjeta de reel ─────────────────────────────────────────────────────────
const ReelCard = ({ reel, onOpen }: { reel: Reel; onOpen: () => void }) => {
    const [liked, setLiked] = useState(false);
    const [burst, setBurst] = useState(0);
    const lastTap = useRef(0);

    const like = (force?: boolean) => {
        if (force && liked) { setBurst(b => b + 1); return; }
        setLiked(v => !v);
        if (!liked) setBurst(b => b + 1);
        if (navigator.vibrate) navigator.vibrate(10);
    };

    // Un toque abre el reel; doble toque da like (como en Instagram)
    const onMediaTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 280) { like(true); lastTap.current = 0; return; }
        lastTap.current = now;
        setTimeout(() => { if (lastTap.current === now) onOpen(); }, 290);
    };

    const share = async () => {
        const url = `${window.location.origin}/reels/${reel.id}`;
        try {
            if (navigator.share) await navigator.share({ title: reel.authorName, text: reel.description, url });
            else { await navigator.clipboard.writeText(url); }
        } catch { /* cancelado */ }
    };

    return (
        <article className="bg-card md:border border-y border-border md:rounded-2xl overflow-hidden -mx-4 md:mx-0">
            <header className="flex items-center gap-3 px-4 py-3">
                <Avatar src={reel.authorPhoto} name={reel.authorName} className="h-10 w-10 text-sm" />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground flex items-center gap-1 truncate">
                        {reel.authorName}
                        {reel.authorVerified && <BadgeCheck className="h-4 w-4 text-primary-ink shrink-0" aria-label="Verificado" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{reel.songTitle ? `♪ ${reel.songTitle}` : 'Reel'}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">Demo</span>
            </header>

            <div className="relative cursor-pointer select-none touch-manipulation" onClick={onMediaTap} role="button" aria-label={`Reproducir reel de ${reel.authorName}`}>
                {reel.gumletId ? (
                    <>
                        <SafeImg src={reel.thumbnailUrl} alt="" className="w-full aspect-[4/5] object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center">
                                <Play className="h-7 w-7 text-white fill-white ml-1" />
                            </span>
                        </div>
                    </>
                ) : (
                    <InlineVideo src={reel.videoUrl} poster={reel.thumbnailUrl} className="w-full aspect-[4/5] object-cover bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-3 right-3 text-xs font-semibold text-white/90 bg-black/50 backdrop-blur px-2 py-1 rounded-full">{fmt(reel.views)} vistas</span>
                <AnimatePresence>
                    {burst > 0 && (
                        <motion.div
                            key={burst}
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }}
                            exit={{ scale: 1.4, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            onAnimationComplete={() => setTimeout(() => setBurst(0), 250)}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <Heart className="h-24 w-24 text-primary-ink fill-primary drop-" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center px-2 pt-1">
                <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'} className={cn('h-11 px-2.5 flex items-center gap-1.5 rounded-xl text-sm font-semibold transition-colors', liked ? 'text-primary-ink' : 'text-foreground/80 hover:text-foreground')}>
                    <motion.span animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
                        <Heart className={cn('h-6 w-6', liked && 'fill-current')} />
                    </motion.span>
                    {fmt(reel.likes + (liked ? 1 : 0))}
                </button>
                <button onClick={onOpen} aria-label="Comentarios" className="h-11 px-2.5 flex items-center gap-1.5 rounded-xl text-sm font-semibold text-foreground/80 hover:text-foreground">
                    <MessageCircle className="h-6 w-6" /> {fmt(reel.comments)}
                </button>
                <button onClick={share} aria-label="Compartir" className="h-11 px-2.5 flex items-center gap-1.5 rounded-xl text-sm font-semibold text-foreground/80 hover:text-foreground">
                    <Share2 className="h-6 w-6" />
                </button>
            </div>
            <div className="px-4 pb-4">
                <p className="text-sm text-foreground/90 line-clamp-2"><span className="font-bold mr-1.5">{reel.authorName.split(' ')[0]}</span>{reel.description}</p>
            </div>
        </article>
    );
};

// ─── Post de foto ────────────────────────────────────────────────────────────
const PostCard = ({ post }: { post: FeedPost }) => {
    const [liked, setLiked] = useState(false);
    const [burst, setBurst] = useState(0);
    const lastTap = useRef(0);
    const like = (force?: boolean) => {
        if (force && liked) { setBurst(b => b + 1); return; }
        setLiked(v => !v);
        if (!liked) setBurst(b => b + 1);
        if (navigator.vibrate) navigator.vibrate(10);
    };
    const onTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 280) { like(true); lastTap.current = 0; } else lastTap.current = now;
    };
    return (
        <article className="bg-card md:border border-y border-border md:rounded-2xl overflow-hidden -mx-4 md:mx-0">
            <header className="flex items-center gap-3 px-4 py-3">
                <Avatar name={post.authorName} className="h-10 w-10 text-sm" />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground flex items-center gap-1 truncate">
                        {post.authorName}
                        {post.authorVerified && <BadgeCheck className="h-4 w-4 text-primary-ink shrink-0" aria-label="Verificado" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{post.authorRole}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">Demo</span>
            </header>
            <div className="relative select-none touch-manipulation" onClick={onTap}>
                <SafeImg src={post.image} alt="" className="w-full aspect-[4/5] object-cover" />
                <AnimatePresence>
                    {burst > 0 && (
                        <motion.div key={burst} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }} exit={{ scale: 1.4, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} onAnimationComplete={() => setTimeout(() => setBurst(0), 250)}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Heart className="h-24 w-24 text-primary-ink fill-primary" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex items-center px-2 pt-1">
                <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'} className={cn('h-11 px-2.5 flex items-center gap-1.5 rounded-xl text-sm font-semibold', liked ? 'text-primary-ink' : 'text-foreground/80')}>
                    <Heart className={cn('h-6 w-6', liked && 'fill-current')} /> {fmt(post.likes + (liked ? 1 : 0))}
                </button>
                <span className="h-11 px-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground/80"><MessageCircle className="h-6 w-6" /> {fmt(post.comments)}</span>
            </div>
            <p className="px-4 pb-4 text-sm text-foreground/90 line-clamp-3"><span className="font-bold mr-1.5">{post.authorName}</span>{post.caption}</p>
        </article>
    );
};

// ─── Publicación real de la comunidad ───────────────────────────────────────
const RealPostCard = ({ post, liked, myId, onLike, onOpen, onDelete }: {
    post: Post; liked: boolean; myId?: string;
    onLike: (p: Post, liked: boolean) => void; onOpen: () => void; onDelete: (p: Post) => void;
}) => {
    const [burst, setBurst] = useState(0);
    const [menu, setMenu] = useState(false);
    const lastTap = useRef(0);
    const mine = myId === post.authorId;
    const like = (force?: boolean) => {
        if (force && liked) { setBurst(b => b + 1); return; }
        if (!liked) setBurst(b => b + 1);
        onLike(post, !liked);
        if (navigator.vibrate) navigator.vibrate(10);
    };
    const onTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 280) { like(true); lastTap.current = 0; return; }
        lastTap.current = now;
        if (post.mediaType === 'video') setTimeout(() => { if (lastTap.current === now) onOpen(); }, 290);
    };
    const share = async () => {
        const url = `${window.location.origin}/feed?reel=${post.id}`;
        try {
            if (navigator.share) await navigator.share({ title: post.authorName, text: post.caption, url });
            else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
        } catch { /* cancelado */ }
    };
    const report = async () => {
        setMenu(false);
        if (!myId) { toast('Entra para denunciar una publicación'); return; }
        try { await postService.report(post.id, myId, 'contenido inapropiado'); toast.success('Gracias. Lo revisamos.'); }
        catch { toast.error('No se pudo enviar la denuncia'); }
    };
    const when = (() => {
        const m = Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 60000);
        if (m < 60) return `hace ${Math.max(1, m)} min`;
        if (m < 1440) return `hace ${Math.floor(m / 60)} h`;
        return new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    })();
    return (
        <article className="bg-card md:border border-y border-border md:rounded-2xl overflow-hidden -mx-4 md:mx-0">
            <header className="flex items-center gap-3 px-4 py-3">
                <Link to={`/profile/${post.authorId}`} className="flex items-center gap-3 flex-1 min-w-0 active:opacity-70">
                    <Avatar src={post.authorPhoto} name={post.authorName} className="h-10 w-10 text-sm" />
                    <span className="min-w-0">
                        <span className="block font-bold text-sm text-foreground truncate">{post.authorName}</span>
                        <span className="block text-xs text-muted-foreground">{when}</span>
                    </span>
                </Link>
                <div className="relative">
                    <button onClick={() => setMenu(v => !v)} aria-label="Más opciones" className="h-9 w-9 -mr-2 flex items-center justify-center text-muted-foreground active:opacity-60">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {menu && (
                        <div className="absolute right-0 top-10 z-20 w-44 rounded-xl bg-sheet border border-hairline overflow-hidden shadow-xl">
                            {mine
                                ? <button onClick={() => { setMenu(false); onDelete(post); }} className="w-full h-11 px-3 flex items-center gap-2 text-[14px] text-red-400 active:bg-fill"><Trash2 className="h-4 w-4" /> Eliminar</button>
                                : <button onClick={report} className="w-full h-11 px-3 flex items-center gap-2 text-[14px] text-foreground active:bg-fill"><Flag className="h-4 w-4" /> Denunciar</button>}
                        </div>
                    )}
                </div>
            </header>
            <div className="relative cursor-pointer select-none touch-manipulation bg-black" onClick={onTap} role="button" aria-label={post.mediaType === 'video' ? `Abrir vídeo de ${post.authorName}` : 'Foto'}>
                {post.mediaType === 'video'
                    ? <InlineVideo src={post.mediaUrl} poster={post.posterUrl || ''} className="w-full aspect-[4/5] object-cover bg-muted" />
                    : <SafeImg src={post.mediaUrl} alt="" className="w-full max-h-[75vh] object-cover" />}
                <AnimatePresence>
                    {burst > 0 && (
                        <motion.div key={burst} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }} exit={{ scale: 1.4, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} onAnimationComplete={() => setTimeout(() => setBurst(0), 250)}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Heart className="h-24 w-24 text-primary-ink fill-primary" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex items-center px-2 pt-1">
                <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'} className={cn('h-11 px-2.5 flex items-center gap-1.5 rounded-xl text-sm font-semibold', liked ? 'text-primary-ink' : 'text-foreground/80')}>
                    <Heart className={cn('h-6 w-6', liked && 'fill-current')} /> {post.likeCount > 0 ? fmt(post.likeCount) : ''}
                </button>
                <Link to={`/messages?userId=${post.authorId}`} aria-label="Escribir" className="h-11 px-2.5 flex items-center text-foreground/80">
                    <MessageCircle className="h-6 w-6" />
                </Link>
                <button onClick={share} aria-label="Compartir" className="h-11 px-2.5 flex items-center text-foreground/80">
                    <Share2 className="h-6 w-6" />
                </button>
            </div>
            {post.caption && <p className="px-4 pb-4 text-sm text-foreground/90 whitespace-pre-line line-clamp-4"><span className="font-bold mr-1.5">{post.authorName}</span>{post.caption}</p>}
        </article>
    );
};

const postToReel = (p: Post): Reel => ({
    id: p.id, videoUrl: p.mediaUrl, thumbnailUrl: p.posterUrl || '', description: p.caption,
    authorId: p.authorId, authorName: p.authorName, authorPhoto: p.authorPhoto || '', authorRole: p.authorRole || 'musician',
    likes: p.likeCount, comments: 0, shares: 0, views: 0, timestamp: new Date(p.createdAt).getTime(), duration: 0,
});

// ─── Tarjetas reales ─────────────────────────────────────────────────────────
const Kicker = ({ Icon, children }: { Icon: React.ElementType; children: React.ReactNode }) => (
    <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-ink mb-2"><Icon className="h-3.5 w-3.5" />{children}</p>
);

const ListingCard = ({ l }: { l: Listing }) => (
    <Link to={`/market/${l.id}`} className="flex gap-3 bg-card border border-border rounded-2xl p-3 hover:border-primary/40 active:scale-[0.99] transition-all">
        <SafeImg src={l.images?.[0]} alt={l.title} className="h-24 w-24 rounded-xl object-cover shrink-0" fallback={<ShoppingBag className="h-8 w-8 text-primary-ink/60" />} />
        <div className="min-w-0 flex flex-col">
            <Kicker Icon={ShoppingBag}>{l.type === 'alquiler' ? 'Se alquila' : l.type === 'prestamo' ? 'Se presta' : 'Se vende'}</Kicker>
            <p className="font-semibold text-sm leading-snug line-clamp-2">{l.title}</p>
            <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-heading text-base font-bold text-primary-ink">{l.type === 'prestamo' ? 'Gratis' : `${l.price}€`}</span>
                {l.userLocation && <span className="truncate flex items-center gap-0.5"><MapPin className="h-3 w-3" />{l.userLocation.split(',')[0]}</span>}
            </div>
        </div>
    </Link>
);

const EventCard = ({ e }: { e: Event }) => {
    const d = new Date(e.date);
    const valid = !isNaN(d.getTime());
    return (
        <Link to={`/eventos/${e.id}`} className="flex gap-3 bg-card border border-border rounded-2xl p-3 hover:border-primary/40 active:scale-[0.99] transition-all">
            <div className="h-24 w-20 shrink-0 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center">
                {valid ? (
                    <>
                        <span className="text-xs font-bold uppercase">{d.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        <span className="font-heading text-3xl font-bold leading-none">{d.getDate()}</span>
                    </>
                ) : <Calendar className="h-7 w-7" />}
            </div>
            <div className="min-w-0 flex flex-col">
                <Kicker Icon={Calendar}>Bolo abierto</Kicker>
                <p className="font-semibold text-sm leading-snug line-clamp-2">{e.title}</p>
                <p className="mt-auto text-xs text-muted-foreground flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{e.location}{e.price ? ` · ${e.price}€` : ''}</p>
            </div>
        </Link>
    );
};

const NewArtistsCard = ({ artists }: { artists: Artist[] }) => (
    <section className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
            <Kicker Icon={Music2}>Nuevos en Musikeeo</Kicker>
            <Link to="/artistas" className="text-xs font-semibold text-primary-ink -mt-2">Ver todos</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {artists.map(a => (
                <Link key={a.id} to={a.slug ? `/artist/${a.slug}` : `/profile/${a.userId}`} className="shrink-0 w-28 text-center">
                    <Avatar src={a.profilePhoto} name={a.artistName} className="h-20 w-20 mx-auto text-2xl" />
                    <p className="mt-2 text-sm font-semibold truncate">{a.artistName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.genres?.[0] || a.city}</p>
                </Link>
            ))}
        </div>
    </section>
);

// ─── Página ──────────────────────────────────────────────────────────────────
type FeedItem =
    | { kind: 'reel'; id: string; reel: Reel }
    | { kind: 'post'; id: string; post: FeedPost }
    | { kind: 'mine'; id: string; p: Post }
    | { kind: 'listing'; id: string; l: Listing }
    | { kind: 'event'; id: string; e: Event }
    | { kind: 'artists'; id: string };

export default function Feed() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [composerOpen, setComposerOpen] = useState(false);

    useEffect(() => {
        getDocs(query(collection(db, 'listings'), where('available', '==', true), orderBy('urgent', 'desc'), orderBy('createdAt', 'desc'), limit(4)))
            .then(s => setListings(s.docs.map(d => ({ id: d.id, ...d.data() } as Listing))))
            .catch(() => {});
        eventService.getUpcomingEvents()
            .then(list => {
                const now = Date.now();
                setEvents(list.filter(e => !e.date || new Date(e.date).getTime() >= now - 86400000).slice(0, 3));
            })
            .catch(() => {});
        getArtists().then(list => setArtists(list.filter(a => a.artistName).slice(0, 10))).catch(() => {});
        postService.recent(20).then(setPosts).catch(err => console.warn('No se pudieron cargar las publicaciones', err));
    }, []);

    useEffect(() => {
        if (!user || posts.length === 0) return;
        postService.likedBy(user.uid, posts.map(p => p.id)).then(setLikedIds).catch(() => {});
    }, [user, posts.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const openComposer = () => user ? setComposerOpen(true) : navigate('/login', { state: { from: '/feed' } });

    const toggleLike = async (p: Post, liked: boolean) => {
        if (!user) { navigate('/login', { state: { from: '/feed' } }); return; }
        const apply = (on: boolean) => {
            setLikedIds(prev => { const n = new Set(prev); if (on) n.add(p.id); else n.delete(p.id); return n; });
            setPosts(prev => prev.map(x => x.id === p.id ? { ...x, likeCount: Math.max(0, x.likeCount + (on ? 1 : -1)) } : x));
        };
        apply(liked);
        try { await postService.setLike(p.id, user.uid, liked); }
        catch { apply(!liked); toast.error('No se pudo guardar el me gusta'); }
    };

    const deletePost = async (p: Post) => {
        if (!window.confirm('¿Eliminar esta publicación?')) return;
        try { await postService.remove(p); setPosts(prev => prev.filter(x => x.id !== p.id)); toast.success('Publicación eliminada'); }
        catch { toast.error('No se pudo eliminar'); }
    };

    const go = (path: string) => user ? navigate(path) : navigate('/login', { state: { from: '/feed' } });
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const openReelId = searchParams.get('reel');
    const openReel = (id: string) => setSearchParams({ reel: id });
    const closeReel = () => {
        // Si se abrió desde el feed, «atrás» de verdad; si entró por enlace directo, quitar el parámetro
        if (location.key !== 'default') navigate(-1);
        else setSearchParams({}, { replace: true });
    };
    // El visor recorre primero los vídeos reales y luego los de muestra
    const viewerReels = useMemo(() => [...posts.filter(p => p.mediaType === 'video').map(postToReel), ...MOCK_REELS], [posts]);
    const viewerIndex = openReelId ? Math.max(0, viewerReels.findIndex(r => r.id === openReelId)) : 0;

    // Intercala lo real (bolos, mercado, artistas) entre los reels de muestra
    const items = useMemo<FeedItem[]>(() => {
        // Contenido de muestra: vídeos propios intercalados con posts de foto
        const reels: FeedItem[] = [];
        LOCAL_REELS.forEach((r, i) => {
            reels.push({ kind: 'reel', id: r.id, reel: r });
            if (MOCK_POSTS[i]) reels.push({ kind: 'post', id: MOCK_POSTS[i].id, post: MOCK_POSTS[i] });
        });
        const real: FeedItem[] = [
            ...events.map(e => ({ kind: 'event' as const, id: `e-${e.id}`, e })),
            ...(artists.length >= 2 ? [{ kind: 'artists' as const, id: 'artists' }] : []),
            ...listings.map(l => ({ kind: 'listing' as const, id: `l-${l.id}`, l })),
        ];
        // Lo que sube la gente va primero, más reciente arriba
        const out: FeedItem[] = posts.map(p => ({ kind: 'mine' as const, id: `p-${p.id}`, p }));
        const max = Math.max(reels.length, real.length);
        for (let i = 0; i < max; i++) {
            if (real[i]) out.push(real[i]);
            if (reels[i]) out.push(reels[i]);
        }
        return out;
    }, [events, artists, listings, posts]);

    return (
        <div className="max-w-xl mx-auto px-4 pt-4 md:pt-8 pb-28 space-y-4">
            <StoriesRow onOpen={openReel} onCreate={openComposer} signedIn={!!user} />

            <nav aria-label="Atajos" className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {SHORTCUTS.map(s => (
                    <Link key={s.to} to={s.to} className="shrink-0 h-9 px-3.5 rounded-full bg-fill flex items-center gap-2 text-[14px] font-medium text-foreground/90 active:opacity-60">
                        <s.Icon className="h-4 w-4 text-foreground/70" /> {s.label}
                    </Link>
                ))}
            </nav>

            <Composer user={user} go={go} onCreate={openComposer} />
            <NewPostSheet open={composerOpen} onClose={() => setComposerOpen(false)} onPosted={p => setPosts(prev => [p, ...prev])} />

            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Los reels marcados como <b className="text-foreground/80">Demo</b> son de ejemplo mientras llega la comunidad.</span>
            </div>

            <div className="space-y-4">
                {items.map(it => {
                    if (it.kind === 'reel') return <ReelCard key={it.id} reel={it.reel} onOpen={() => openReel(it.reel.id)} />;
                    if (it.kind === 'post') return <PostCard key={it.id} post={it.post} />;
                    if (it.kind === 'mine') return <RealPostCard key={it.id} post={it.p} liked={likedIds.has(it.p.id)} myId={user?.uid} onLike={toggleLike} onOpen={() => openReel(it.p.id)} onDelete={deletePost} />;
                    if (it.kind === 'listing') return <ListingCard key={it.id} l={it.l} />;
                    if (it.kind === 'event') return <EventCard key={it.id} e={it.e} />;
                    return <NewArtistsCard key={it.id} artists={artists} />;
                })}
            </div>

            {/* Portal: el contenedor de página lleva transform y descolocaría el fixed */}
            {createPortal(
                <AnimatePresence>
                    {openReelId && (
                        <ReelsViewer key="viewer" reels={viewerReels} initialIndex={viewerIndex} onClose={closeReel} />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Final del feed: qué hacer ahora */}
            <section className="text-center rounded-3xl border border-border bg-gradient-to-b from-primary/10 to-transparent px-6 py-10">
                <span className="mx-auto h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="h-6 w-6" strokeWidth={3} /></span>
                <h2 className="mt-4 font-heading text-xl font-bold">Estás al día</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs mx-auto">
                    {user ? 'Sube un vídeo tocando y aparece aquí para toda la escena.' : 'Crea tu perfil gratis para publicar y que te encuentren.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button onClick={() => user ? openComposer() : navigate('/register')} className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                        {user ? 'Subir un vídeo' : 'Crear mi perfil'} <ArrowRight className="h-5 w-5" />
                    </button>
                    <Link to="/artistas" className="h-12 px-6 rounded-2xl border border-border font-bold flex items-center justify-center hover:border-primary/50">Explorar artistas</Link>
                </div>
            </section>
        </div>
    );
}
