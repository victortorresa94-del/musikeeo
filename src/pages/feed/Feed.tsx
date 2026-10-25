import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { claveDe, interaccionService, type Contador, type Objetivo } from '../../services/interaccionService';
import { gustosService } from '../../services/gustosService';
import {
    rasgosDeAnuncio, rasgosDeArtista, rasgosDeBolo, rasgosDePost, recomendar,
    type Declarado, type Rasgos, type Senal,
} from '../../lib/recomendador';
import { OBJETO_3D } from '../../config/objetos3d';
import type { Artist, Event, Listing, Post } from '../../types';
import type { Reel } from '../../types/reels';
import { claveDeReel, idReelArtista, objetivoDeReel, reelsDe } from '../../services/reelsReales';
import { NewPostSheet } from '../../components/feed/NewPostSheet';
import { HojaComentarios, type DestinoComentarios } from '../../components/feed/HojaComentarios';
import {
    Compositor, EsqueletoFeed, FilaArtistas, FilaMercado, TarjetaArtistaGrande, TarjetaBolo, TarjetaPost, Visto,
} from '../../components/feed/TarjetasFeed';

// Feed «Para ti»: todo sale de Firestore. Ritmo: una tarjeta grande (publicación o artista),
// un bolo abierto, una fila del Mercado, y vuelta a empezar. Dentro de cada carril manda el
// algoritmo (src/lib/recomendador.ts): lo que encaja con tus gustos, lo reciente, lo que gusta
// a la comunidad y algo de descubrimiento. El orden se calcula al entrar y no se mueve mientras
// miras: lo que haces hoy cambia el feed de la próxima vez.

const POR_FILA = 8;

type Grande = { kind: 'post'; id: string; p: Post } | { kind: 'artista'; id: string; a: Artist };
type Item = Grande | { kind: 'bolo'; id: string; e: Event } | { kind: 'mercado'; id: string; ls: Listing[] };
type Orden = { grandes: string[]; bolos: string[]; anuncios: string[] };

const SIN_CUENTA: Contador = { likes: 0, comentarios: 0 };

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
    const { user, userProfile, loading, profileLoading } = useAuth();
    const [cargando, setCargando] = useState(true);
    const [posts, setPosts] = useState<Post[]>([]);
    const [artistas, setArtistas] = useState<Artist[]>([]);
    const [bolos, setBolos] = useState<Event[]>([]);
    const [anuncios, setAnuncios] = useState<Listing[]>([]);
    const [contadores, setContadores] = useState<Map<string, Contador>>(new Map());
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());   // claves: post_… / artista_…
    const [orden, setOrden] = useState<Orden | null>(null);
    const [recienSubidos, setRecienSubidos] = useState<string[]>([]);
    const [composerOpen, setComposerOpen] = useState(false);
    const [comentarios, setComentarios] = useState<DestinoComentarios | null>(null);

    // Se espera a saber quién es (y su perfil) para ordenar una sola vez
    const listo = !loading && !profileLoading;
    const uid = user?.uid;
    useEffect(() => {
        if (!listo) return;
        let vivo = true;
        Promise.all([
            // Las reglas de «posts» pueden no estar desplegadas: sin permiso, lista vacía
            postService.recent(40).catch(() => [] as Post[]),
            explorarService.artistas().catch(() => [] as Artist[]),
            eventService.getUpcomingEvents().catch(() => [] as Event[]),
            explorarService.anuncios().catch(() => [] as Listing[]),
            gustosService.usar(uid ?? null),
        ]).then(async ([p, a, e, l, gustos]) => {
            const conImagen = a.filter(x => x.coverPhoto || x.profilePhoto || x.clipUrl);
            const abiertos = bolosAbiertos(e);
            const claves = [...p.map(x => `post_${x.id}`), ...conImagen.map(x => `artista_${x.id}`)];
            const [cuentas, mios] = await Promise.all([
                interaccionService.contadores(claves).catch(() => new Map<string, Contador>()),
                uid ? interaccionService.misMeGusta(uid, claves).catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
            ]);
            if (!vivo) return;

            // El orden de cada carril, con lo que se sabe ahora
            const artistaDe = new Map(a.map(x => [x.userId, x]));
            const declarado: Declarado = {
                uid, rol: userProfile?.primaryMode, estilos: userProfile?.genres, ciudad: userProfile?.location,
            };
            const ahora = Date.now();
            const grandes = recomendar([
                ...p.map(x => rasgosDePost(x, cuentas.get(`post_${x.id}`), artistaDe.get(x.authorId))),
                ...conImagen.map(x => rasgosDeArtista(x, cuentas.get(`artista_${x.id}`))),
            ], gustos, declarado, ahora);
            const ordenBolos = recomendar(abiertos.map(rasgosDeBolo), gustos, declarado, ahora);
            const ordenAnuncios = recomendar(l.map(rasgosDeAnuncio), gustos, declarado, ahora);

            setPosts(p);
            setArtistas(conImagen);
            setBolos(abiertos);
            setAnuncios(l);
            setContadores(cuentas);
            setLikedIds(mios);
            setOrden({
                grandes: grandes.map(x => x.rasgos.clave),
                bolos: ordenBolos.map(x => x.rasgos.clave),
                anuncios: ordenAnuncios.map(x => x.rasgos.clave),
            });
            setCargando(false);
        });
        return () => { vivo = false; };
    }, [listo, uid]); // eslint-disable-line react-hooks/exhaustive-deps

    // Rasgos de cada cosa, para apuntar los gestos
    const rasgosPorClave = useMemo(() => {
        const artistaDe = new Map(artistas.map(x => [x.userId, x]));
        const m = new Map<string, Rasgos>();
        const poner = (r: Rasgos) => m.set(r.clave, r);
        posts.forEach(x => poner(rasgosDePost(x, contadores.get(`post_${x.id}`), artistaDe.get(x.authorId))));
        artistas.forEach(x => poner(rasgosDeArtista(x, contadores.get(`artista_${x.id}`))));
        bolos.forEach(x => poner(rasgosDeBolo(x)));
        anuncios.forEach(x => poner(rasgosDeAnuncio(x)));
        return m;
    }, [posts, artistas, bolos, anuncios, contadores]);

    const senal = useCallback((clave: string, s: Senal) => {
        const r = rasgosPorClave.get(clave);
        if (r) gustosService.registrar(r, s);
    }, [rasgosPorClave]);

    const openComposer = () => user ? setComposerOpen(true) : navigate('/login', { state: { from: '/feed' } });

    const objetivoPost = (p: Post): Objetivo => ({ tipo: 'post', refId: p.id, duenioId: p.authorId });
    const objetivoArtista = (a: Artist): Objetivo => ({ tipo: 'artista', refId: a.id, duenioId: a.userId });
    const cuenta = (clave: string) => contadores.get(clave) || SIN_CUENTA;

    const moverContador = (clave: string, campo: keyof Contador, delta: number) =>
        setContadores(prev => {
            const n = new Map(prev);
            const c = n.get(clave) || SIN_CUENTA;
            n.set(clave, { ...c, [campo]: Math.max(0, c[campo] + delta) });
            return n;
        });

    const cambiarMeGusta = async (o: Objetivo, on: boolean) => {
        if (!user) { navigate('/login', { state: { from: location.pathname + location.search } }); return; }
        const clave = claveDe(o);
        const aplicar = (x: boolean) => {
            setLikedIds(prev => { const n = new Set(prev); if (x) n.add(clave); else n.delete(clave); return n; });
            moverContador(clave, 'likes', x ? 1 : -1);
        };
        aplicar(on);
        senal(clave, on ? 'me_gusta' : 'quitar_me_gusta');
        try { await interaccionService.setMeGusta(o, user.uid, on); }
        catch { aplicar(!on); toast.error('No se pudo guardar el me gusta'); }
    };
    const toggleLike = (p: Post, on: boolean) => cambiarMeGusta(objetivoPost(p), on);

    const abrirComentarios = (o: Objetivo, titulo: string) => setComentarios({ objetivo: o, titulo });
    const cerrarComentarios = useCallback(() => setComentarios(null), []);
    const alComentar = (d: DestinoComentarios) => {
        const clave = claveDe(d.objetivo);
        moverContador(clave, 'comentarios', 1);
        senal(clave, 'comentar');
    };
    const alBorrarComentario = (d: DestinoComentarios) => moverContador(claveDe(d.objetivo), 'comentarios', -1);

    const deletePost = async (p: Post) => {
        if (!window.confirm('¿Eliminar esta publicación?')) return;
        try { await postService.remove(p); setPosts(prev => prev.filter(x => x.id !== p.id)); toast.success('Publicación eliminada'); }
        catch { toast.error('No se pudo eliminar'); }
    };

    const alPublicar = (p: Post) => {
        setPosts(prev => [p, ...prev]);
        setRecienSubidos(prev => [`post_${p.id}`, ...prev]);
    };

    // Visor de vídeos (?reel=id): recorre los vídeos reales (publicaciones y clips de artista)
    const [searchParams, setSearchParams] = useSearchParams();
    const openReelId = searchParams.get('reel');
    const openReel = (id: string) => setSearchParams({ reel: id });
    const closeReel = () => {
        // Si se abrió desde el feed, «atrás» de verdad; si entró por enlace directo, quitar el parámetro
        if (location.key !== 'default') navigate(-1);
        else setSearchParams({}, { replace: true });
    };
    // El visor sigue el mismo orden que el feed
    const viewerReels = useMemo(() => {
        const pos = new Map((orden?.grandes || []).map((c, i) => [c, i]));
        return reelsDe(posts, artistas)
            .map(r => { const c = contadores.get(claveDeReel(r)) || SIN_CUENTA; return { ...r, likes: c.likes, comments: c.comentarios }; })
            .sort((x, y) => (pos.get(claveDeReel(x)) ?? 1e9) - (pos.get(claveDeReel(y)) ?? 1e9));
    }, [posts, artistas, orden, contadores]);
    const likeDesdeVisor = (r: Reel, on: boolean) => void cambiarMeGusta(objetivoDeReel(r), on);
    const comentarDesdeVisor = (r: Reel) => abrirComentarios(objetivoDeReel(r), r.authorName);
    const senalDesdeVisor = (r: Reel, s: Senal) => senal(claveDeReel(r), s);
    const likedReels = useMemo(() => new Set(viewerReels.filter(r => likedIds.has(claveDeReel(r))).map(r => r.id)), [viewerReels, likedIds]);
    const viewerIndex = openReelId ? viewerReels.findIndex(r => r.id === openReelId) : -1;

    // El ritmo del concepto: grande · bolo · mercado, y vuelta a empezar. Cada carril, en el
    // orden del algoritmo; lo que acabas de subir, arriba del todo
    const items = useMemo<Item[]>(() => {
        if (!orden) return [];
        const porClave = new Map<string, Grande>([
            ...posts.map(p => [`post_${p.id}`, { kind: 'post' as const, id: `p-${p.id}`, p }] as const),
            ...artistas.map(a => [`artista_${a.id}`, { kind: 'artista' as const, id: `a-${a.id}`, a }] as const),
        ]);
        const claves = [...recienSubidos, ...orden.grandes.filter(c => !recienSubidos.includes(c))];
        const grandes = claves.map(c => porClave.get(c)).filter((x): x is Grande => !!x);
        const boloDe = new Map(bolos.map(e => [`bolo_${e.id}`, e]));
        const ordenBolos = orden.bolos.map(c => boloDe.get(c)).filter((x): x is Event => !!x);
        const anuncioDe = new Map(anuncios.map(x => [`anuncio_${x.id}`, x]));
        const ordenAnuncios = orden.anuncios.map(c => anuncioDe.get(c)).filter((x): x is Listing => !!x);
        const filas: Listing[][] = [];
        for (let i = 0; i < ordenAnuncios.length; i += POR_FILA) filas.push(ordenAnuncios.slice(i, i + POR_FILA));
        const out: Item[] = [];
        const vueltas = Math.max(grandes.length, ordenBolos.length, filas.length);
        for (let i = 0; i < vueltas; i++) {
            if (grandes[i]) out.push(grandes[i]);
            if (ordenBolos[i]) out.push({ kind: 'bolo', id: `e-${ordenBolos[i].id}`, e: ordenBolos[i] });
            if (filas[i]) out.push({ kind: 'mercado', id: `m-${i}`, ls: filas[i] });
        }
        return out;
    }, [orden, recienSubidos, posts, artistas, bolos, anuncios]);

    // La fila de arriba, con los artistas en el orden del feed
    const artistasArriba = useMemo(() => items
        .filter((x): x is Extract<Item, { kind: 'artista' }> => x.kind === 'artista')
        .map(x => x.a).slice(0, 12), [items]);

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

            {!cargando && artistasArriba.length >= 4 && (
                <FilaArtistas artistas={artistasArriba} onAbrir={a => senal(`artista_${a.id}`, 'perfil')} />
            )}

            {user && <Compositor nombre={nombre} foto={foto} onSubir={openComposer} />}
            <NewPostSheet open={composerOpen} onClose={() => setComposerOpen(false)} onPosted={alPublicar} />
            <HojaComentarios destino={comentarios} onCerrar={cerrarComentarios} onComentado={alComentar} onBorrado={alBorrarComentario} />

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
                            if (it.kind === 'post') {
                                const clave = `post_${it.p.id}`;
                                const c = cuenta(clave);
                                return (
                                    <Visto key={it.id} onVisto={() => senal(clave, 'impresion')}>
                                        <TarjetaPost post={it.p} liked={likedIds.has(clave)} likes={c.likes} comentarios={c.comentarios} myId={user?.uid}
                                            onLike={toggleLike} onComentar={() => abrirComentarios(objetivoPost(it.p), it.p.authorName)}
                                            onOpen={() => { senal(clave, 'abrir'); openReel(it.p.id); }} onDelete={deletePost}
                                            onPerfil={() => senal(clave, 'perfil')} />
                                    </Visto>
                                );
                            }
                            if (it.kind === 'artista') {
                                const clave = `artista_${it.a.id}`;
                                const c = cuenta(clave);
                                return (
                                    <Visto key={it.id} onVisto={() => senal(clave, 'impresion')}>
                                        <TarjetaArtistaGrande a={it.a} liked={likedIds.has(clave)} likes={c.likes} comentarios={c.comentarios}
                                            onLike={on => void cambiarMeGusta(objetivoArtista(it.a), on)}
                                            onComentar={() => abrirComentarios(objetivoArtista(it.a), it.a.artistName)}
                                            onAbrirClip={() => { senal(clave, 'abrir'); openReel(idReelArtista(it.a)); }}
                                            onPerfil={() => senal(clave, 'perfil')} />
                                    </Visto>
                                );
                            }
                            if (it.kind === 'bolo') {
                                const clave = `bolo_${it.e.id}`;
                                return (
                                    <Visto key={it.id} onVisto={() => senal(clave, 'impresion')}>
                                        <TarjetaBolo e={it.e} onAbrir={() => senal(clave, 'abrir')} />
                                    </Visto>
                                );
                            }
                            return <FilaMercado key={it.id} anuncios={it.ls} onAbrir={l => senal(`anuncio_${l.id}`, 'abrir')} />;
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
                        <ReelsViewer key="viewer" reels={viewerReels} initialIndex={viewerIndex} onClose={closeReel}
                            likedIds={likedReels} onLike={likeDesdeVisor} onComentar={comentarDesdeVisor} onSenal={senalDesdeVisor} />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
