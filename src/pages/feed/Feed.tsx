import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ReelsViewer from '../reels/ReelsViewer';
import { eventService } from '../../services/eventService';
import { explorarService } from '../../services/explorarService';
import { postService } from '../../services/postService';
import { OBJETO_3D } from '../../config/objetos3d';
import type { Artist, Event, Listing, Post } from '../../types';
import type { Reel } from '../../types/reels';
import { NewPostSheet } from '../../components/feed/NewPostSheet';
import {
    Compositor, EsqueletoFeed, FilaArtistas, FilaMercado, TarjetaArtistaGrande, TarjetaBolo, TarjetaPost,
} from '../../components/feed/TarjetasFeed';

// Feed «Para ti»: todo sale de Firestore. Ritmo: una tarjeta grande (publicación o artista),
// un bolo abierto, una fila del Mercado, y vuelta a empezar.

const POR_FILA = 8;

const postToReel = (p: Post): Reel => ({
    id: p.id, videoUrl: p.mediaUrl, thumbnailUrl: p.posterUrl || '', description: p.caption,
    authorId: p.authorId, authorName: p.authorName, authorPhoto: p.authorPhoto || '', authorRole: p.authorRole || 'musician',
    likes: p.likeCount, comments: 0, shares: 0, views: 0, timestamp: new Date(p.createdAt).getTime(), duration: 0,
});

type Grande = { kind: 'post'; id: string; p: Post } | { kind: 'artista'; id: string; a: Artist };
type Item = Grande | { kind: 'bolo'; id: string; e: Event } | { kind: 'mercado'; id: string; ls: Listing[] };

// Los bolos que no han pasado (los de hoy cuentan), el más cercano primero
function bolosAbiertos(list: Event[]): Event[] {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return list
        .filter(e => { const t = new Date(e.date).getTime(); return !isNaN(t) && t >= hoy.getTime(); })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default function Feed() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, userProfile } = useAuth();
    const [cargando, setCargando] = useState(true);
    const [posts, setPosts] = useState<Post[]>([]);
    const [artistas, setArtistas] = useState<Artist[]>([]);
    const [bolos, setBolos] = useState<Event[]>([]);
    const [anuncios, setAnuncios] = useState<Listing[]>([]);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [composerOpen, setComposerOpen] = useState(false);

    useEffect(() => {
        let vivo = true;
        Promise.all([
            // Las reglas de «posts» pueden no estar desplegadas: sin permiso, lista vacía
            postService.recent(20).catch(() => [] as Post[]),
            explorarService.artistas().catch(() => [] as Artist[]),
            eventService.getUpcomingEvents().catch(() => [] as Event[]),
            explorarService.anuncios().catch(() => [] as Listing[]),
        ]).then(([p, a, e, l]) => {
            if (!vivo) return;
            setPosts(p);
            setArtistas(a.filter(x => x.coverPhoto || x.profilePhoto));
            setBolos(bolosAbiertos(e));
            setAnuncios([...l].sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || '')));
            setCargando(false);
        });
        return () => { vivo = false; };
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

    // Visor de vídeos (?reel=id): recorre los vídeos reales del feed
    const [searchParams, setSearchParams] = useSearchParams();
    const openReelId = searchParams.get('reel');
    const openReel = (id: string) => setSearchParams({ reel: id });
    const closeReel = () => {
        // Si se abrió desde el feed, «atrás» de verdad; si entró por enlace directo, quitar el parámetro
        if (location.key !== 'default') navigate(-1);
        else setSearchParams({}, { replace: true });
    };
    const viewerReels = useMemo(() => posts.filter(p => p.mediaType === 'video').map(postToReel), [posts]);
    const viewerIndex = openReelId ? viewerReels.findIndex(r => r.id === openReelId) : -1;

    // El ritmo del concepto: grande · bolo · mercado, y vuelta a empezar
    const items = useMemo<Item[]>(() => {
        const grandes: Grande[] = [
            ...posts.map(p => ({ kind: 'post' as const, id: `p-${p.id}`, p })),
            ...artistas.map(a => ({ kind: 'artista' as const, id: `a-${a.id}`, a })),
        ];
        const filas: Listing[][] = [];
        for (let i = 0; i < anuncios.length; i += POR_FILA) filas.push(anuncios.slice(i, i + POR_FILA));
        const out: Item[] = [];
        const vueltas = Math.max(grandes.length, bolos.length, filas.length);
        for (let i = 0; i < vueltas; i++) {
            if (grandes[i]) out.push(grandes[i]);
            if (bolos[i]) out.push({ kind: 'bolo', id: `e-${bolos[i].id}`, e: bolos[i] });
            if (filas[i]) out.push({ kind: 'mercado', id: `m-${i}`, ls: filas[i] });
        }
        return out;
    }, [posts, artistas, bolos, anuncios]);

    const nombre = userProfile?.displayName || user?.displayName || 'Tú';
    const foto = userProfile?.photoURL || user?.photoURL || undefined;

    return (
        <div className="max-w-xl mx-auto px-4 pt-4 md:pt-8 pb-28 space-y-5">
            <header className="flex items-center justify-between">
                <h1 className="text-[28px] leading-tight font-bold text-foreground">Para ti</h1>
                <Link to="/explorar" aria-label="Buscar en Musikeeo"
                    className="pulsable h-10 w-10 rounded-full bg-card border border-hairline shadow-e1 flex items-center justify-center text-foreground">
                    <Search className="h-5 w-5" />
                </Link>
            </header>

            {!cargando && artistas.length >= 4 && <FilaArtistas artistas={artistas.slice(0, 12)} />}

            {user && <Compositor nombre={nombre} foto={foto} onSubir={openComposer} />}
            <NewPostSheet open={composerOpen} onClose={() => setComposerOpen(false)} onPosted={p => setPosts(prev => [p, ...prev])} />

            {cargando ? <EsqueletoFeed /> : items.length === 0 ? (
                // Vacío honesto: no hay nada que enseñar todavía
                <section className="rounded-[22px] bg-card border border-hairline shadow-e1 px-6 pt-4 pb-7 text-center">
                    <img src={OBJETO_3D.microfono} alt="" loading="lazy" className="mx-auto h-[120px] w-[90px] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]" />
                    <h2 className="mt-3 text-[20px] font-bold text-foreground">Tu feed aún está en silencio</h2>
                    <p className="mt-1 mx-auto max-w-xs text-[15px] text-muted-foreground">
                        Cuando la gente suba vídeos, publique bolos o venda equipo, lo verás aquí.
                    </p>
                    <button onClick={() => user ? openComposer() : navigate('/register')}
                        className="mt-5 mx-auto h-[52px] px-6 rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold flex items-center justify-center gap-2">
                        {user ? 'Subir el primer vídeo' : 'Crear mi perfil'} <ArrowRight className="h-5 w-5" />
                    </button>
                </section>
            ) : (
                <>
                    <div className="space-y-5">
                        {items.map(it => {
                            if (it.kind === 'post') return <TarjetaPost key={it.id} post={it.p} liked={likedIds.has(it.p.id)} myId={user?.uid} onLike={toggleLike} onOpen={() => openReel(it.p.id)} onDelete={deletePost} />;
                            if (it.kind === 'artista') return <TarjetaArtistaGrande key={it.id} a={it.a} />;
                            if (it.kind === 'bolo') return <TarjetaBolo key={it.id} e={it.e} />;
                            return <FilaMercado key={it.id} anuncios={it.ls} />;
                        })}
                    </div>

                    {/* Final del feed: qué hacer ahora */}
                    <section className="pt-4 pb-2 text-center">
                        <span className="mx-auto h-12 w-12 rounded-full bg-fill flex items-center justify-center text-foreground">
                            <Check className="h-6 w-6" strokeWidth={2.5} />
                        </span>
                        <h2 className="mt-3 text-[20px] font-bold text-foreground">Estás al día</h2>
                        <p className="mt-1 mb-5 mx-auto max-w-xs text-[15px] text-muted-foreground">
                            {user ? 'Sube un vídeo tocando y aparece aquí para toda la escena.' : 'Crea tu perfil gratis para publicar y que te encuentren.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button onClick={() => user ? openComposer() : navigate('/register')}
                                className="h-[52px] px-6 rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold flex items-center justify-center gap-2">
                                {user ? 'Subir un vídeo' : 'Crear mi perfil'} <ArrowRight className="h-5 w-5" />
                            </button>
                            <Link to="/explorar" className="h-[52px] px-6 rounded-[14px] bg-fill text-foreground text-[16px] font-bold flex items-center justify-center">
                                Explorar Musikeeo
                            </Link>
                        </div>
                    </section>
                </>
            )}

            {/* Portal: el contenedor de página lleva transform y descolocaría el fixed */}
            {createPortal(
                <AnimatePresence>
                    {openReelId && viewerIndex >= 0 && (
                        <ReelsViewer key="viewer" reels={viewerReels} initialIndex={viewerIndex} onClose={closeReel} />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
