import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import {
    ArrowLeft, BadgeCheck, CalendarDays, ChevronDown, ChevronRight, Eye, MapPin, MessageCircle, Music2,
    Play, Share, Ticket, Users, Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { getArtistByUserId } from '../../services/artistService';
import { getProviderByUserId } from '../../services/providerService';
import { eventService } from '../../services/eventService';
import { postService } from '../../services/postService';
import { OBJETO_3D } from '../../config/objetos3d';
import { TarjetaBolo } from '../../components/bolos/TarjetaBolo';
import { fechaDe, norm } from '../../components/bolos/tablon';
import { Pestanas } from '../../components/ficha-artista/Partes';
import type { Artist, Event, Listing, Post, ProviderProfile } from '../../types';

// Perfil público (concepto A): portada, avatar, tres datos reales y sus bolos abiertos.
// Solo lo que existe de verdad: nada de seguidores, valoraciones ni aforos inventados.

// En Firestore el proveedor guarda más de lo que dice el tipo: foto, ciudad, bio y precio
type Proveedor = ProviderProfile & { photoURL?: string; city?: string; bio?: string; priceFrom?: string | number };
type Clase = 'musico' | 'sala' | 'organizador' | 'tecnico' | 'tienda';

const SOMBRA_3D = 'object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]';

const OBJETO_DE: Record<Clase, string> = {
    musico: OBJETO_3D.banda,
    sala: OBJETO_3D.escenario,
    organizador: OBJETO_3D.escenario,
    tecnico: OBJETO_3D.mesa,
    tienda: OBJETO_3D.guitarra,
};

interface Base {
    name: string;
    photo?: string;     // el avatar
    covers: string[];   // portadas por orden de preferencia (si una no carga, la siguiente)
    clase: Clase;
    linea: string;      // «Sala de conciertos · Barcelona»
    bio: string;
    createdAt?: string;
    objeto: string;
}

const priceOf = (l: Listing) =>
    l.type === 'prestamo' ? 'Préstamo' : `${l.price.toLocaleString('es-ES')} €${l.type === 'alquiler' && l.priceUnit ? ({ dia: '/día', semana: '/semana', total: '' } as Record<string, string>)[l.priceUnit] ?? '' : ''}`;

const sinPunto = (s: string) => s.replace('.', '');

/** «oct 2026» */
const mesAnio = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : `${sinPunto(d.toLocaleDateString('es-ES', { month: 'short' }))} ${d.getFullYear()}`;
};

/** «Barcelona, España» → «Barcelona» */
const ciudad = (s?: string) => (s || '').replace(/,\s*España$/i, '').trim();

// Las fotos de demostración tienen la grande junto al avatar: /seed/x-avatar.webp → /seed/x.webp
const sinAvatar = (url?: string) => (url && /\/seed\/[^/]+-avatar\.\w+$/.test(url) ? url.replace(/-avatar(\.\w+)$/, '$1') : undefined);

function claseDe(art: Artist | null, prov: Proveedor | null, mode: string | undefined, nombre: string): Clase {
    if (art) return 'musico';
    if (prov) return (prov.services || []).some(s => norm(s).includes('tienda')) ? 'tienda' : 'tecnico';
    if (mode === 'provider') return 'tecnico';
    if (mode === 'organizer') return /\bsala\b/.test(norm(nombre)) ? 'sala' : 'organizador';
    return 'musico';
}

function lineaDe(clase: Clase, prov: Proveedor | null, bio: string): string {
    switch (clase) {
        case 'musico': return 'Músico · Banda';
        case 'sala': return 'Sala de conciertos';
        case 'organizador': return norm(bio).includes('boda') ? 'Bodas y eventos' : 'Organiza bolos';
        case 'tienda': return 'Tienda de instrumentos';
        case 'tecnico': return prov?.providerType === 'freelance' ? 'Técnico de sonido' : 'Empresa de sonido';
    }
}

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-ES')} ${n === 1 ? uno : varios}`;

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const reduceMotion = useReducedMotion();
    // «Ver como público» desde Mi perfil: sin esto, tu propio perfil te devuelve a /profile
    const [params] = useSearchParams();
    const esMio = !!id && user?.uid === id;
    const vistaPublica = esMio && params.get('vista') === 'publica';
    const [base, setBase] = useState<Base | null>(null);
    const [artist, setArtist] = useState<Artist | null>(null);
    const [provider, setProvider] = useState<Proveedor | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [tab, setTab] = useState<'posts' | 'anuncios'>('posts');
    const [verPasados, setVerPasados] = useState(false);
    const [portada, setPortada] = useState(0);     // índice de la portada que se intenta pintar
    const [avatarRoto, setAvatarRoto] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        setNotFound(false);
        setPortada(0);
        setAvatarRoto(false);
        setVerPasados(false);
        (async () => {
            const [pp, a, pr, ps, l, e] = await Promise.allSettled([
                userService.getPublicProfile(id),
                getArtistByUserId(id),
                getProviderByUserId(id),
                postService.byAuthor(id),   // las reglas pueden negarlo: entonces no hay publicaciones
                getDocs(query(collection(db, 'listings'), where('userId', '==', id), limit(30))),
                eventService.getEventsByOrganizer(id),
            ]);
            if (cancelled) return;
            const profile = pp.status === 'fulfilled' ? pp.value : null;
            // Una ficha oculta (isPublic false) no la ven los demás: aquí tampoco sale
            const art = a.status === 'fulfilled' && a.value?.isPublic !== false ? a.value : null;
            const prov = pr.status === 'fulfilled' && pr.value?.isPublic !== false ? (pr.value as Proveedor | null) : null;
            if (!profile && !art && !prov) { setNotFound(true); setLoading(false); return; }
            setArtist(art); setProvider(prov);
            const name = art?.artistName || prov?.businessName || profile?.displayName || 'Usuario de Musikeeo';
            const bio = art?.bio || profile?.bio || prov?.bio || '';
            const clase = claseDe(art, prov, profile?.primaryMode, name);
            const photo = art?.profilePhoto || profile?.photoURL || prov?.photoURL || undefined;
            const covers = [prov?.photoURL, sinAvatar(photo), photo].filter((x, i, xs): x is string => !!x && xs.indexOf(x) === i);
            const fechas = [profile?.createdAt, prov?.createdAt, art?.createdAt].filter(Boolean).map(String).sort();
            setBase({
                name, photo, covers, clase, bio,
                linea: [lineaDe(clase, prov, bio), ciudad(art?.city || profile?.location || prov?.city)].filter(Boolean).join(' · '),
                createdAt: fechas[0],
                objeto: clase === 'organizador' && norm(bio).includes('boda') ? OBJETO_3D.boda : OBJETO_DE[clase],
            });
            const myPosts = ps.status === 'fulfilled' ? ps.value : [];
            const myListings = l.status === 'fulfilled'
                ? l.value.docs.map(d => ({ id: d.id, ...d.data() }) as Listing).filter(x => x.available !== false)
                    .sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')))
                : [];
            setPosts(myPosts); setListings(myListings);
            setEvents(e.status === 'fulfilled' ? e.value : []);
            setTab(myPosts.length ? 'posts' : 'anuncios');
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [id]);

    // Abiertos: de hoy en adelante (y los que no tienen fecha), el más cercano primero
    const { abiertos, pasados } = useMemo(() => {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const t = (e: Event) => fechaDe(e.date)?.d.getTime() ?? Infinity;
        return {
            abiertos: events.filter(e => t(e) >= hoy.getTime()).sort((x, y) => t(x) - t(y)),
            pasados: events.filter(e => t(e) < hoy.getTime()).sort((x, y) => t(y) - t(x)),
        };
    }, [events]);

    // Los datos de la fila: solo los que salen de algo real, y como mucho tres
    const datos = useMemo(() => {
        if (!base) return [];
        const out: { icon: React.ElementType; texto: string }[] = [];
        if (abiertos.length) out.push({ icon: Ticket, texto: plural(abiertos.length, 'bolo abierto', 'bolos abiertos') });
        // El aforo solo si lo ha dicho él en un bolo celebrado en su propio local
        const aforo = Math.max(0, ...events
            .filter(e => e.detalles?.lugar && norm(e.detalles.lugar) === norm(base.name))
            .map(e => Number(e.detalles?.invitados) || 0));
        if (aforo > 0) out.push({ icon: Users, texto: `Hasta ${aforo.toLocaleString('es-ES')} personas` });
        if (provider) {
            const servicios = provider.services?.length || 0;
            if (servicios) out.push({ icon: Wrench, texto: plural(servicios, 'servicio', 'servicios') });
            const zonas = provider.coverageAreas || [];
            if (zonas.length) out.push({ icon: MapPin, texto: zonas.length === 1 ? zonas[0] : `${zonas[0]} y ${zonas.length - 1} más` });
        }
        const desde = mesAnio(base.createdAt);
        const fila = out.slice(0, desde ? 2 : 3);
        if (desde) fila.push({ icon: CalendarDays, texto: `En Musikeeo desde ${desde}` });
        return fila;
    }, [base, abiertos, events, provider]);

    if (esMio && !vistaPublica) return <Navigate to="/profile" replace />;

    const back = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1); else navigate('/explorar');
    };

    const share = async () => {
        const url = window.location.href.replace(/[?&]vista=publica/, '');
        try {
            if (navigator.share) await navigator.share({ title: `${base?.name} en Musikeeo`, url });
            else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
        } catch { /* cancelado */ }
    };

    const contact = () => {
        if (esMio) { toast('Así verán el botón los demás: abre un chat contigo'); return; }
        navigate(`/messages?userId=${id}`);
    };

    const contenedor = 'max-w-[1000px] mx-auto px-4 md:px-6 pb-10 md:pt-6';

    if (loading) {
        return (
            <div className={contenedor} aria-busy="true" aria-label="Cargando el perfil">
                <div className="-mx-4 md:mx-0 aspect-[16/10] md:aspect-[1000/380] rounded-b-[28px] md:rounded-[28px] bg-fill animate-pulse" />
                <div className="flex items-end gap-3 md:gap-5 md:px-2">
                    <span className="-mt-[54px] md:-mt-[68px] h-[108px] w-[108px] md:h-[136px] md:w-[136px] shrink-0 rounded-full p-1 bg-background">
                        <span className="block h-full w-full rounded-full bg-fill-strong animate-pulse" />
                    </span>
                    <span className="flex-1 space-y-2 pb-2">
                        <span className="block h-6 w-2/3 rounded bg-fill animate-pulse" />
                        <span className="block h-4 w-1/2 rounded bg-fill animate-pulse" />
                    </span>
                </div>
            </div>
        );
    }

    if (notFound || !base) {
        return (
            <div className="max-w-md mx-auto px-6 py-20 text-center">
                <img src={OBJETO_3D.microfono} alt="" loading="lazy" className={cn('mx-auto h-28 w-28', SOMBRA_3D)} />
                <p className="mt-4 text-[17px] font-bold text-foreground">Este perfil no existe o ya no está disponible</p>
                <p className="mt-1 text-[15px] text-muted-foreground">Puede que lo hayan borrado o que el enlace esté mal.</p>
                <Link to="/explorar" className="pulsable mt-5 inline-flex h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">Ir a Explorar</Link>
            </div>
        );
    }

    const genres = artist?.genres?.length ? artist.genres : provider?.services || [];
    const verified = !!artist?.isVerified;
    const precioDesde = Number(artist?.priceFrom || provider?.priceFrom || 0);
    const cover = base.covers[portada];
    const pestanas = [
        ...(posts.length ? [{ id: 'posts' as const, nombre: 'Publicaciones' }] : []),
        ...(listings.length ? [{ id: 'anuncios' as const, nombre: 'Anuncios' }] : []),
    ];
    const activa = pestanas.find(p => p.id === tab)?.id ?? pestanas[0]?.id;
    const nada = !events.length && !pestanas.length;
    const botonRedondo = 'pulsable h-10 w-10 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center';

    return (
        <div className={contenedor}>
            {vistaPublica && (
                <div className="mt-2 md:mt-0 mb-3 flex items-center gap-3 rounded-2xl bg-fill px-3.5 py-2.5">
                    <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="flex-1 text-[14px] text-foreground">Así ven tu perfil los demás</p>
                    <Link to="/profile" className="pulsable h-8 px-3 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center">Volver</Link>
                </div>
            )}

            {/* Portada: la foto grande; sin foto, el objeto 3D de lo que es */}
            <div className={cn(
                'relative -mx-4 md:mx-0 aspect-[16/10] md:aspect-[1000/380] overflow-hidden bg-fill',
                'rounded-b-[28px] md:rounded-[28px]', vistaPublica && 'rounded-t-[28px] mx-0',
            )}>
                {cover ? (
                    <img src={cover} alt="" onError={() => setPortada(i => i + 1)} className="h-full w-full object-cover" />
                ) : (
                    <img src={base.objeto} alt="" loading="lazy" className={cn('absolute inset-0 m-auto h-[62%] w-[62%]', SOMBRA_3D)} />
                )}
                <button type="button" onClick={back} aria-label="Volver" className={cn(botonRedondo, 'absolute top-3 left-3')}>
                    <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
                </button>
                <button type="button" onClick={share} aria-label="Compartir el perfil" className={cn(botonRedondo, 'absolute top-3 right-3')}>
                    <Share className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </button>
            </div>

            {/* Avatar pisando la portada, con el nombre al lado */}
            <div className="flex items-end gap-3 md:gap-5 md:px-2">
                <span className="relative z-10 -mt-[54px] md:-mt-[68px] h-[108px] w-[108px] md:h-[136px] md:w-[136px] shrink-0 rounded-full p-1 bg-background shadow-e2 flex">
                    <span className="h-full w-full rounded-full overflow-hidden bg-fill flex items-center justify-center">
                        {base.photo && !avatarRoto
                            ? <img src={base.photo} alt="" onError={() => setAvatarRoto(true)} className="h-full w-full object-cover" />
                            : <img src={base.objeto} alt="" loading="lazy" className={cn('h-[72%] w-[72%]', SOMBRA_3D)} />}
                    </span>
                </span>
                <div className="min-w-0 flex-1 pb-1 md:pb-3">
                    <h1 className="text-[24px] md:text-[28px] font-bold leading-[1.15] tracking-tight text-foreground break-words">
                        {base.name}
                        {verified && <BadgeCheck className="inline h-5 w-5 ml-1 -mt-1 text-foreground" aria-label="Verificado" />}
                    </h1>
                    <p className="mt-0.5 text-[15px] text-muted-foreground line-clamp-2">{base.linea}</p>
                </div>
            </div>

            {/* Tres datos reales, con divisores finos */}
            {datos.length > 0 && (
                <div className="mt-5 flex divide-x divide-hairline md:max-w-[640px]">
                    {datos.map(({ icon: Icon, texto }) => (
                        <div key={texto} className="flex-1 min-w-0 px-2 flex flex-col items-center text-center gap-1.5">
                            <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
                            <span className="text-[13px] md:text-[14px] leading-tight text-foreground">{texto}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="md:max-w-[640px] md:px-2">
                {base.bio && <p className="mt-5 text-[16px] leading-relaxed text-foreground whitespace-pre-line break-words">{base.bio}</p>}
                {genres.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {genres.slice(0, 6).map(g => (
                            <span key={g} className="h-7 px-2.5 rounded-full bg-fill text-[13px] font-medium leading-7 text-muted-foreground">{g}</span>
                        ))}
                    </div>
                )}
                {precioDesde > 0 && (
                    <p className="mt-3 text-[15px] text-foreground">
                        Desde <b>{precioDesde.toLocaleString('es-ES')} €</b>{artist ? ' por bolo' : ''}
                    </p>
                )}

                {/* Contactar es la acción principal */}
                <div className="mt-5 flex gap-2.5 md:max-w-[440px]">
                    <button type="button" onClick={contact} className="pulsable flex-1 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[17px] flex items-center justify-center gap-2">
                        <MessageCircle className="h-5 w-5" /> Contactar
                    </button>
                    <button type="button" onClick={share} aria-label="Compartir el perfil" className="pulsable h-[52px] w-[52px] shrink-0 rounded-full bg-fill-strong text-foreground flex items-center justify-center">
                        <Share className="h-5 w-5" />
                    </button>
                </div>
                {artist?.slug && (
                    <Link to={`/artist/${artist.slug}`} className="pulsable mt-2.5 h-12 px-4 rounded-2xl bg-fill flex items-center gap-3 md:max-w-[440px]">
                        <Music2 className="h-[18px] w-[18px] text-muted-foreground" />
                        <span className="flex-1 text-[15px] text-foreground">Ver su ficha de artista: precios, vídeos y fechas</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                )}
            </div>

            {/* Bolos abiertos; los que ya pasaron, atenuados y a petición */}
            {events.length > 0 && (
                <section className="mt-8 md:px-2" aria-labelledby="titulo-bolos">
                    <h2 id="titulo-bolos" className="text-[20px] font-bold text-foreground">Bolos abiertos</h2>
                    {abiertos.length > 0 ? (
                        <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
                            {abiertos.map(e => <TarjetaBolo key={e.id} e={e} />)}
                        </div>
                    ) : (
                        <p className="mt-2 text-[15px] text-muted-foreground">Ahora mismo no tiene ningún bolo abierto.</p>
                    )}
                    {pasados.length > 0 && (
                        <>
                            <button
                                type="button"
                                onClick={() => setVerPasados(v => !v)}
                                aria-expanded={verPasados}
                                className="pulsable mt-3 h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold inline-flex items-center gap-1.5"
                            >
                                {verPasados ? 'Ocultar los que ya pasaron' : `Ver los que ya pasaron (${pasados.length})`}
                                <ChevronDown className={cn('h-4 w-4 transition-transform', verPasados && 'rotate-180')} />
                            </button>
                            {verPasados && (
                                <motion.div
                                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                    className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3"
                                >
                                    {pasados.map(e => <TarjetaBolo key={e.id} e={e} pasado />)}
                                </motion.div>
                            )}
                        </>
                    )}
                </section>
            )}

            {/* Lo demás que ha publicado: solo las secciones que tienen algo */}
            {activa && (
                <section className="mt-8 md:px-2">
                    {pestanas.length > 1
                        ? <div className="md:max-w-[440px]"><Pestanas opciones={pestanas} valor={activa} onCambio={setTab} /></div>
                        : <h2 className="text-[20px] font-bold text-foreground">{pestanas[0].nombre}</h2>}

                    <motion.div
                        key={activa}
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="mt-3"
                    >
                        {activa === 'posts' && (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-0.5 md:gap-2 -mx-4 md:mx-0">
                                {posts.map(p => {
                                    const img = p.mediaType === 'video' ? p.posterUrl : p.mediaUrl;
                                    return (
                                        <Link key={p.id} to={p.mediaType === 'video' ? `/feed?reel=${p.id}` : '/feed'} className="relative aspect-[4/5] bg-fill md:rounded-2xl overflow-hidden active:opacity-80">
                                            {img
                                                ? <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                                                : <Play className="h-6 w-6 text-muted-foreground absolute inset-0 m-auto" />}
                                            {p.mediaType === 'video' && <Play className="absolute top-1.5 right-1.5 h-4 w-4 text-white fill-white drop-shadow" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {activa === 'anuncios' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
                                {listings.map(l => (
                                    <Link key={l.id} to={`/market/${l.id}`} className="pulsable pulsable--flota rounded-2xl overflow-hidden bg-card border border-hairline shadow-e1">
                                        <div className="aspect-square bg-fill relative">
                                            {l.images?.[0]
                                                ? <img src={l.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                                                : <img src={OBJETO_3D.guitarra} alt="" loading="lazy" className={cn('absolute inset-0 m-auto h-[60%] w-[60%]', SOMBRA_3D)} />}
                                        </div>
                                        <div className="p-2.5">
                                            <p className="text-[14px] font-semibold leading-snug text-foreground line-clamp-2">{l.title}</p>
                                            <p className="text-[14px] font-bold text-foreground">{priceOf(l)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </section>
            )}

            {nada && (
                <p className="mt-8 md:px-2 text-[15px] text-muted-foreground">Todavía no ha publicado bolos ni anuncios.</p>
            )}
        </div>
    );
}
