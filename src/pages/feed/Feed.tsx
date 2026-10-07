import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Play, Heart, MessageCircle, Share2, BadgeCheck, ShoppingBag, Calendar,
    ArrowRight, Image as ImageIcon, Plus, Music2, Speaker, Sparkles, MapPin, Info, Check,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { MOCK_REELS, LOCAL_REELS, MOCK_POSTS, type FeedPost } from '../../services/reelsData';
import ReelsViewer from '../reels/ReelsViewer';
import { eventService } from '../../services/eventService';
import { getArtists } from '../../services/artistService';
import type { Artist, Event, Listing } from '../../types';
import { cn } from '../../lib/utils';

type Reel = typeof MOCK_REELS[number];

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K` : String(n);

// ─── Avatar con inicial si la foto no carga (nada de caras inventadas) ───────
const Avatar = ({ src, name, className }: { src?: string; name: string; className?: string }) => {
    const [broken, setBroken] = useState(!src);
    return broken ? (
        <div className={cn('rounded-full bg-gradient-to-br from-primary/70 to-primary/30 flex items-center justify-center font-heading font-bold text-primary-foreground', className)}>
            {name.slice(0, 1).toUpperCase()}
        </div>
    ) : (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={cn('rounded-full object-cover', className)} />
    );
};

// Imagen con respaldo de marca si falla la red
const SafeImg = ({ src, alt, className, fallback }: { src?: string; alt: string; className?: string; fallback?: React.ReactNode }) => {
    const [broken, setBroken] = useState(!src);
    if (broken) return <div className={cn('flex items-center justify-center bg-gradient-to-br from-primary/20 via-muted to-muted', className)}>{fallback ?? <Music2 className="h-10 w-10 text-primary/60" />}</div>;
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
                <span className="h-[68px] w-[68px] rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center text-primary bg-primary/5">
                    <Plus className="h-6 w-6" />
                </span>
                <span className="text-[11px] text-foreground/80 truncate w-full text-center">{signedIn ? 'Tu reel' : 'Súbete'}</span>
            </button>
            {MOCK_REELS.slice(0, 8).map(reel => (
                <button key={reel.id} onClick={() => onOpen(reel.id)} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]" aria-label={`Ver reel de ${reel.authorName}`}>
                    <span className="h-[68px] w-[68px] rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-primary to-amber-200">
                        <span className="block h-full w-full rounded-full p-[2px] bg-background">
                            <SafeImg src={reel.thumbnailUrl} alt="" className="h-full w-full rounded-full object-cover" fallback={<span className="font-heading font-bold text-primary">{reel.authorName[0]}</span>} />
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
const Composer = ({ user, go }: { user: any; go: (p: string) => void }) => (
    <div className="bg-card border border-border rounded-2xl p-3">
        <div className="flex items-center gap-3">
            <Avatar src={user?.photoURL} name={user?.displayName || 'Tú'} className="h-10 w-10 text-sm shrink-0" />
            <button onClick={() => go('/panel/multimedia')} className="flex-1 h-11 text-left bg-muted border border-border rounded-full px-4 text-sm text-muted-foreground hover:border-primary/40 transition-colors">
                {user ? '¿Qué estás tocando estos días?' : 'Entra y comparte tu música'}
            </button>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-2">
            {[
                { label: 'Vídeo', Icon: ImageIcon, to: '/panel/multimedia' },
                { label: 'Evento', Icon: Calendar, to: '/publicar' },
                { label: 'Vender', Icon: ShoppingBag, to: '/market/create' },
            ].map(a => (
                <button key={a.label} onClick={() => go(a.to)} className="h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
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
                        {reel.authorVerified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-label="Verificado" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{reel.songTitle ? `♪ ${reel.songTitle}` : 'Reel'}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">Demo</span>
            </header>

            <div className="relative cursor-pointer select-none" onClick={onMediaTap} role="button" aria-label={`Reproducir reel de ${reel.authorName}`}>
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
                            <Heart className="h-24 w-24 text-primary fill-primary drop-shadow-[0_0_24px_rgba(0,0,0,0.5)]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center px-2 pt-1">
                <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'} className={cn('h-11 px-2.5 flex items-center gap-1.5 rounded-xl text-sm font-semibold transition-colors', liked ? 'text-primary' : 'text-foreground/80 hover:text-foreground')}>
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
                        {post.authorVerified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-label="Verificado" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{post.authorRole}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">Demo</span>
            </header>
            <div className="relative select-none" onClick={onTap}>
                <SafeImg src={post.image} alt="" className="w-full aspect-[4/5] object-cover" />
                <AnimatePresence>
                    {burst > 0 && (
                        <motion.div key={burst} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }} exit={{ scale: 1.4, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} onAnimationComplete={() => setTimeout(() => setBurst(0), 250)}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Heart className="h-24 w-24 text-primary fill-primary" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex items-center px-2 pt-1">
                <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'} className={cn('h-11 px-2.5 flex items-center gap-1.5 rounded-xl text-sm font-semibold', liked ? 'text-primary' : 'text-foreground/80')}>
                    <Heart className={cn('h-6 w-6', liked && 'fill-current')} /> {fmt(post.likes + (liked ? 1 : 0))}
                </button>
                <span className="h-11 px-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground/80"><MessageCircle className="h-6 w-6" /> {fmt(post.comments)}</span>
            </div>
            <p className="px-4 pb-4 text-sm text-foreground/90 line-clamp-3"><span className="font-bold mr-1.5">{post.authorName}</span>{post.caption}</p>
        </article>
    );
};

// ─── Tarjetas reales ─────────────────────────────────────────────────────────
const Kicker = ({ Icon, children }: { Icon: React.ElementType; children: React.ReactNode }) => (
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary mb-2"><Icon className="h-3.5 w-3.5" />{children}</p>
);

const ListingCard = ({ l }: { l: Listing }) => (
    <Link to={`/market/${l.id}`} className="flex gap-3 bg-card border border-border rounded-2xl p-3 hover:border-primary/40 active:scale-[0.99] transition-all">
        <SafeImg src={l.images?.[0]} alt={l.title} className="h-24 w-24 rounded-xl object-cover shrink-0" fallback={<ShoppingBag className="h-8 w-8 text-primary/60" />} />
        <div className="min-w-0 flex flex-col">
            <Kicker Icon={ShoppingBag}>{l.type === 'alquiler' ? 'Se alquila' : l.type === 'prestamo' ? 'Se presta' : 'Se vende'}</Kicker>
            <p className="font-semibold text-sm leading-snug line-clamp-2">{l.title}</p>
            <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-heading text-base font-bold text-primary">{l.type === 'prestamo' ? 'Gratis' : `${l.price}€`}</span>
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
            <Link to="/artistas" className="text-xs font-semibold text-primary -mt-2">Ver todos</Link>
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
    | { kind: 'listing'; id: string; l: Listing }
    | { kind: 'event'; id: string; e: Event }
    | { kind: 'artists'; id: string };

export default function Feed() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);

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
    }, []);

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
    const viewerIndex = openReelId ? Math.max(0, MOCK_REELS.findIndex(r => r.id === openReelId)) : 0;

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
        const out: FeedItem[] = [];
        const max = Math.max(reels.length, real.length);
        for (let i = 0; i < max; i++) {
            if (real[i]) out.push(real[i]);
            if (reels[i]) out.push(reels[i]);
        }
        return out;
    }, [events, artists, listings]);

    return (
        <div className="max-w-xl mx-auto px-4 pt-4 md:pt-8 pb-28 space-y-4">
            <StoriesRow onOpen={openReel} onCreate={() => go('/panel/multimedia')} signedIn={!!user} />

            <nav aria-label="Atajos" className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {SHORTCUTS.map(s => (
                    <Link key={s.to} to={s.to} className="shrink-0 h-10 px-4 rounded-full bg-card border border-border flex items-center gap-2 text-sm font-semibold text-foreground/85 hover:border-primary/50 hover:text-primary transition-colors">
                        <s.Icon className="h-4 w-4 text-primary" /> {s.label}
                    </Link>
                ))}
            </nav>

            <Composer user={user} go={go} />

            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Los reels marcados como <b className="text-foreground/80">Demo</b> son de ejemplo mientras llega la comunidad.</span>
            </div>

            <div className="space-y-4">
                {items.map(it => {
                    if (it.kind === 'reel') return <ReelCard key={it.id} reel={it.reel} onOpen={() => openReel(it.reel.id)} />;
                    if (it.kind === 'post') return <PostCard key={it.id} post={it.post} />;
                    if (it.kind === 'listing') return <ListingCard key={it.id} l={it.l} />;
                    if (it.kind === 'event') return <EventCard key={it.id} e={it.e} />;
                    return <NewArtistsCard key={it.id} artists={artists} />;
                })}
            </div>

            {/* Portal: el contenedor de página lleva transform y descolocaría el fixed */}
            {createPortal(
                <AnimatePresence>
                    {openReelId && (
                        <ReelsViewer key="viewer" reels={MOCK_REELS} initialIndex={viewerIndex} onClose={closeReel} />
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
                    <button onClick={() => user ? navigate('/panel/multimedia') : navigate('/register')} className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                        {user ? 'Subir un vídeo' : 'Crear mi perfil'} <ArrowRight className="h-5 w-5" />
                    </button>
                    <Link to="/artistas" className="h-12 px-6 rounded-2xl border border-border font-bold flex items-center justify-center hover:border-primary/50">Explorar artistas</Link>
                </div>
            </section>
        </div>
    );
}
