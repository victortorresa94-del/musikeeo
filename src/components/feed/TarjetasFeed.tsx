import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BadgeCheck, Calendar, ChevronRight, Flag, Heart, ImagePlus, MessageCircle, MoreHorizontal,
    Music2, Play, Share2, ShoppingBag, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { objeto3dDeBolo } from '../../config/objetos3d';
import { postService } from '../../services/postService';
import { Foto, TarjetaAnuncio } from '../explorar/Tarjetas';
import type { Artist, Event, Listing, Post } from '../../types';

// Piezas del Feed «Para ti»: tarjeta grande (publicación o artista), bolo abierto y fila del Mercado

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K` : String(n);
const euros = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;
const ciudad = (s?: string) => (s || '').split(',')[0].trim();

/** «sáb 25 oct» */
const fechaCorta = (d: Date) =>
    `${d.toLocaleDateString('es-ES', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('es-ES', { month: 'short' })}`.replace(/\./g, '');

/** «hace 5 min», «hace 3 h» o «20 oct» */
function haceCuanto(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `hace ${Math.max(1, m)} min`;
    if (m < 1440) return `hace ${Math.floor(m / 60)} h`;
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ─── Avatar con inicial si no hay foto (nunca una cara inventada) ────────────
export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
    const [roto, setRoto] = useState(!src);
    return roto ? (
        <span className={cn('rounded-full bg-fill-strong flex items-center justify-center font-semibold text-foreground', className)}>
            {(name || '·').slice(0, 1).toUpperCase()}
        </span>
    ) : (
        <img src={src} alt="" loading="lazy" onError={() => setRoto(true)} className={cn('rounded-full object-cover', className)} />
    );
}

// ─── Vídeo que se reproduce solo cuando está en pantalla ────────────────────
function VideoEnLinea({ src, poster, className }: { src: string; poster?: string; className?: string }) {
    const ref = useRef<HTMLVideoElement>(null);
    const [cerca, setCerca] = useState(false);
    useEffect(() => {
        const v = ref.current;
        if (!v) return;
        const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const io = new IntersectionObserver(([e]) => {
            if (e.intersectionRatio > 0) setCerca(true);
            if (quieto) return;
            if (e.intersectionRatio >= 0.6) v.play().catch(() => {});
            else v.pause();
        }, { threshold: [0, 0.6], rootMargin: '200px 0px' });
        io.observe(v);
        return () => io.disconnect();
    }, []);
    return <video ref={ref} src={cerca ? src : undefined} poster={poster || undefined} muted loop playsInline preload="none" className={className} aria-hidden />;
}

// Corazón que estalla con el doble toque
function Estallido({ n, onFin }: { n: number; onFin: () => void }) {
    return (
        <AnimatePresence>
            {n > 0 && (
                <motion.span
                    key={n}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }}
                    exit={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    onAnimationComplete={() => setTimeout(onFin, 250)}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <Heart className="h-24 w-24 text-white fill-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]" />
                </motion.span>
            )}
        </AnimatePresence>
    );
}

// ─── Tarjeta grande: artista ─────────────────────────────────────────────────
export function TarjetaArtistaGrande({ a }: { a: Artist }) {
    // «House y disco», como en el concepto
    const generos = (a.genres || []).slice(0, 2).map((g, i) => i ? g.toLowerCase() : g).join(' y ');
    const linea = [ciudad(a.city), generos].filter(Boolean).join(' · ');
    return (
        <Link to={`/artist/${a.slug}`} aria-label={`Ver el perfil de ${a.artistName}`}
            className="pulsable relative block aspect-[16/10] rounded-[22px] overflow-hidden bg-fill shadow-e1">
            <Foto src={a.coverPhoto || a.profilePhoto} className="absolute inset-0 h-full w-full" icon={Music2} />
            <span className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-4">
                <Avatar src={a.profilePhoto || a.coverPhoto} name={a.artistName} className="h-11 w-11 shrink-0 ring-2 ring-white text-[17px]" />
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[18px] font-bold leading-tight text-white">
                        <span className="truncate">{a.artistName}</span>
                        {a.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-white" aria-label="Verificado" />}
                    </span>
                    {linea && <span className="mt-0.5 block truncate text-[14px] text-white/85">{linea}</span>}
                </span>
                <span className="shrink-0 h-9 px-3.5 rounded-full bg-white text-black text-[14px] font-semibold flex items-center">Ver perfil</span>
            </span>
        </Link>
    );
}

// ─── Tarjeta grande: publicación real de la comunidad ───────────────────────
export function TarjetaPost({ post, liked, myId, onLike, onOpen, onDelete }: {
    post: Post; liked: boolean; myId?: string;
    onLike: (p: Post, liked: boolean) => void; onOpen: () => void; onDelete: (p: Post) => void;
}) {
    const [burst, setBurst] = useState(0);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const lastTap = useRef(0);
    const menuCerradoEn = useRef(0);
    const mine = myId === post.authorId;
    const video = post.mediaType === 'video';

    // El menú se cierra al tocar fuera (y ese toque no abre el vídeo)
    useEffect(() => {
        if (!menu) return;
        const cerrar = (e: PointerEvent) => {
            if (menuRef.current?.contains(e.target as Node)) return;
            menuCerradoEn.current = Date.now();
            setMenu(false);
        };
        document.addEventListener('pointerdown', cerrar);
        return () => document.removeEventListener('pointerdown', cerrar);
    }, [menu]);

    const like = (force?: boolean) => {
        if (force && liked) { setBurst(b => b + 1); return; }
        if (!liked) setBurst(b => b + 1);
        onLike(post, !liked);
        if (navigator.vibrate) navigator.vibrate(10);
    };
    // Un toque abre el vídeo; doble toque da «me gusta»
    const onTap = () => {
        const now = Date.now();
        if (now - menuCerradoEn.current < 500) return;
        if (now - lastTap.current < 280) { like(true); lastTap.current = 0; return; }
        lastTap.current = now;
        if (video) setTimeout(() => { if (lastTap.current === now) onOpen(); }, 290);
    };
    const share = async () => {
        setMenu(false);
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
    const when = haceCuanto(post.createdAt);

    const opcion = 'w-full h-11 px-3.5 flex items-center gap-2.5 text-[15px] text-left active:bg-fill';
    return (
        <article>
            <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden bg-fill shadow-e1">
                <div className="absolute inset-0 cursor-pointer select-none touch-manipulation" onClick={onTap}
                    role="button" aria-label={video ? `Abrir el vídeo de ${post.authorName}` : `Foto de ${post.authorName}`}>
                    {video
                        ? <VideoEnLinea src={post.mediaUrl} poster={post.posterUrl} className="h-full w-full object-cover" />
                        : <Foto src={post.mediaUrl} className="h-full w-full" />}
                </div>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                {video && (
                    <span className="pointer-events-none absolute top-3 left-3 h-7 px-2.5 rounded-full bg-black/45 backdrop-blur flex items-center gap-1 text-[12px] font-semibold text-white">
                        <Play className="h-3 w-3 fill-white" /> Vídeo
                    </span>
                )}
                <Estallido n={burst} onFin={() => setBurst(0)} />

                {/* Más: compartir, escribir, eliminar o denunciar */}
                <div ref={menuRef} className="absolute top-3 right-3">
                    <button onClick={() => setMenu(v => !v)} aria-label="Más opciones" aria-expanded={menu}
                        className="h-9 w-9 rounded-full bg-black/45 backdrop-blur flex items-center justify-center text-white active:opacity-70">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {menu && (
                        <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl bg-sheet border border-hairline shadow-e3 overflow-hidden text-foreground">
                            <button onClick={share} className={opcion}><Share2 className="h-4 w-4" /> Compartir</button>
                            {!mine && (
                                <Link to={`/messages?userId=${post.authorId}`} className={cn(opcion, 'border-t border-hairline')}>
                                    <MessageCircle className="h-4 w-4 shrink-0" /> <span className="truncate">Escribir a {post.authorName}</span>
                                </Link>
                            )}
                            {mine
                                ? <button onClick={() => { setMenu(false); onDelete(post); }} className={cn(opcion, 'border-t border-hairline text-destructive')}><Trash2 className="h-4 w-4" /> Eliminar</button>
                                : <button onClick={report} className={cn(opcion, 'border-t border-hairline')}><Flag className="h-4 w-4" /> Denunciar</button>}
                        </div>
                    )}
                </div>

                {/* Me gusta, a la derecha como en el concepto */}
                <button onClick={() => like()} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
                    className="absolute right-3 bottom-[76px] w-12 flex flex-col items-center gap-0.5 text-white active:opacity-70">
                    <motion.span animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
                        <Heart className={cn('h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]', liked && 'fill-white')} />
                    </motion.span>
                    {post.likeCount > 0 && <span className="text-[13px] font-semibold">{fmt(post.likeCount)}</span>}
                </button>

                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
                    <Link to={`/profile/${post.authorId}`} className="min-w-0 flex-1 flex items-center gap-3 active:opacity-70">
                        <Avatar src={post.authorPhoto} name={post.authorName} className="h-11 w-11 shrink-0 ring-2 ring-white text-[16px]" />
                        <span className="min-w-0">
                            <span className="block truncate text-[17px] font-bold leading-tight text-white">{post.authorName}</span>
                            <span className="mt-0.5 block text-[13px] text-white/80">{when}</span>
                        </span>
                    </Link>
                    <Link to={`/profile/${post.authorId}`} className="pulsable shrink-0 h-9 px-4 rounded-full bg-white text-black text-[14px] font-semibold flex items-center">Ver perfil</Link>
                </div>
            </div>
            {post.caption && (
                <p className="mt-2.5 px-1 text-[15px] leading-snug text-foreground whitespace-pre-line line-clamp-3">{post.caption}</p>
            )}
        </article>
    );
}

// ─── Bolo abierto: tarjeta compacta con su objeto 3D asomando ───────────────
export function TarjetaBolo({ e }: { e: Event }) {
    const d = new Date(e.date);
    const fecha = isNaN(d.getTime()) ? '' : fechaCorta(d);
    const linea = [e.price && e.price > 0 ? euros(e.price) : ciudad(e.location), fecha].filter(Boolean).join(' · ');
    const boton = 'shrink-0 h-9 px-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold items-center';
    return (
        // El objeto no cabe a propósito: los altos asoman por arriba (de ahí el pt)
        <div className="pt-4">
            <Link to={`/eventos/${e.id}`} aria-label={`Ver el bolo ${e.title}`}
                className="pulsable relative flex items-center gap-3 min-h-[120px] rounded-[22px] bg-card border border-hairline shadow-e1 py-3.5 pl-[112px] pr-3.5">
                <img src={objeto3dDeBolo(e)} alt="" loading="lazy" decoding="async"
                    className="pointer-events-none absolute left-1 bottom-3 h-[146px] w-[100px] object-contain object-bottom drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]" />
                <span className="min-w-0 flex-1">
                    <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-fill text-[12px] font-semibold text-muted-foreground">Bolo abierto</span>
                    <span className="mt-1.5 text-[16px] font-bold leading-[1.22] text-foreground line-clamp-2">{e.title}</span>
                    {/* En el móvil el botón baja junto a la fecha para que el título respire */}
                    <span className="mt-1.5 flex items-center justify-between gap-2">
                        {linea && <span className="min-w-0 truncate text-[14px] text-muted-foreground">{linea}</span>}
                        <span className={cn(boton, 'flex sm:hidden')}>Ver bolo</span>
                    </span>
                </span>
                <span className={cn(boton, 'hidden sm:flex')}>Ver bolo</span>
            </Link>
        </div>
    );
}

// ─── Recién llegado al Mercado ───────────────────────────────────────────────
export function FilaMercado({ anuncios }: { anuncios: Listing[] }) {
    return (
        <section aria-label="Recién llegado al Mercado">
            <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-foreground">Recién llegado al Mercado</h2>
                <Link to="/explorar/segunda-mano" aria-label="Ver todo el Mercado"
                    className="h-9 w-9 -mr-2 rounded-full flex items-center justify-center text-foreground active:bg-fill">
                    <ChevronRight className="h-6 w-6" />
                </Link>
            </div>
            <div className="mt-2 -mx-4 px-4 md:mx-0 md:px-0 flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x scroll-pl-4 md:scroll-pl-0">
                {anuncios.map(l => <div key={l.id} className="snap-start"><TarjetaAnuncio l={l} ancho /></div>)}
            </div>
        </section>
    );
}

// ─── Fila de artistas arriba (solo cuando hay bastantes) ────────────────────
export function FilaArtistas({ artistas }: { artistas: Artist[] }) {
    return (
        <nav aria-label="Artistas en Musikeeo" className="-mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-3.5 overflow-x-auto hide-scrollbar pb-1">
                {artistas.map(a => (
                    <Link key={a.id} to={`/artist/${a.slug}`} className="pulsable shrink-0 w-[72px] flex flex-col items-center gap-1.5">
                        <span className="h-[68px] w-[68px] rounded-full p-[2px] border border-hairline-strong">
                            <Avatar src={a.profilePhoto || a.coverPhoto} name={a.artistName} className="h-full w-full text-[20px]" />
                        </span>
                        <span className="w-full truncate text-center text-[12px] text-muted-foreground">{a.artistName}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}

// ─── Compositor (solo con sesión) ────────────────────────────────────────────
export function Compositor({ nombre, foto, onSubir }: { nombre: string; foto?: string; onSubir: () => void }) {
    const chip = 'pulsable shrink-0 h-9 px-3.5 rounded-full bg-fill flex items-center gap-1.5 text-[14px] font-semibold text-foreground';
    return (
        <section aria-label="Publicar" className="rounded-[22px] bg-card border border-hairline shadow-e1 p-3">
            <div className="flex items-center gap-3">
                <Avatar src={foto} name={nombre} className="h-10 w-10 shrink-0 text-[15px]" />
                <button onClick={onSubir} className="pulsable flex-1 min-w-0 h-11 rounded-full bg-fill pl-4 pr-3 flex items-center justify-between gap-2 text-left">
                    <span className="truncate text-[15px] text-muted-foreground">
                        <span className="sm:hidden">Comparte tu último bolo</span>
                        <span className="hidden sm:inline">Comparte un vídeo de tu último bolo</span>
                    </span>
                    <ImagePlus className="h-5 w-5 shrink-0 text-foreground" />
                </button>
            </div>
            <div className="mt-2.5 flex gap-2 overflow-x-auto hide-scrollbar">
                <Link to="/publicar" className={chip}><Calendar className="h-4 w-4" /> Publicar un bolo</Link>
                <Link to="/market/create" className={chip}><ShoppingBag className="h-4 w-4" /> Vender equipo</Link>
            </div>
        </section>
    );
}

// ─── Esqueletos mientras carga ───────────────────────────────────────────────
export function EsqueletoFeed() {
    return (
        <div aria-hidden className="space-y-5 animate-pulse">
            <div className="aspect-[16/10] rounded-[22px] bg-fill" />
            <div className="pt-4"><div className="h-[120px] rounded-[22px] bg-fill" /></div>
            <div>
                <div className="h-6 w-60 rounded-full bg-fill" />
                <div className="mt-3 flex gap-3 overflow-hidden">
                    {[0, 1, 2].map(i => <div key={i} className="w-[168px] shrink-0 aspect-[168/236] rounded-2xl bg-fill" />)}
                </div>
            </div>
            <div className="aspect-[16/10] rounded-[22px] bg-fill" />
        </div>
    );
}
