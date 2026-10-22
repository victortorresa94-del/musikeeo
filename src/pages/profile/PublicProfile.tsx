import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import {
    ChevronLeft, MapPin, MessageCircle, Share2, BadgeCheck, Play, ChevronRight, Eye,
    Image as ImageIcon, ShoppingBag, CalendarDays, Music2,
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
import type { Artist, Event, Listing, Post, ProviderProfile, UserMode } from '../../types';

const ROLE_LABEL: Record<UserMode, string> = {
    musician: 'Músico · Banda',
    organizer: 'Sala · Promotor',
    provider: 'Técnico · Empresa de sonido',
};

const priceOf = (l: Listing) =>
    l.type === 'prestamo' ? 'Préstamo' : `${l.price} €${l.type === 'alquiler' && l.priceUnit ? `/${l.priceUnit}` : ''}`;

const dateOf = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

interface Base {
    name: string;
    photo?: string;
    role?: UserMode;
    location?: string;
    bio?: string;
}

// Perfil de otra persona: solo lo que existe de verdad (nada de seguidores ni ratings inventados)
export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    // «Ver como público» desde Mi perfil: sin esto, tu propio perfil te devuelve a /profile
    const [params] = useSearchParams();
    const esMio = !!id && user?.uid === id;
    const vistaPublica = esMio && params.get('vista') === 'publica';
    const [base, setBase] = useState<Base | null>(null);
    const [artist, setArtist] = useState<Artist | null>(null);
    const [provider, setProvider] = useState<ProviderProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [tab, setTab] = useState<'posts' | 'anuncios' | 'bolos'>('posts');
    const [photoBroken, setPhotoBroken] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        (async () => {
            const [pp, a, pr, ps, l, e] = await Promise.allSettled([
                userService.getPublicProfile(id),
                getArtistByUserId(id),
                getProviderByUserId(id),
                postService.byAuthor(id),
                getDocs(query(collection(db, 'listings'), where('userId', '==', id), limit(30))),
                eventService.getEventsByOrganizer(id),
            ]);
            if (cancelled) return;
            const profile = pp.status === 'fulfilled' ? pp.value : null;
            const art = a.status === 'fulfilled' ? a.value : null;
            const prov = pr.status === 'fulfilled' ? pr.value : null;
            if (!profile && !art && !prov) { setNotFound(true); setLoading(false); return; }
            setArtist(art); setProvider(prov);
            setBase({
                name: art?.artistName || prov?.businessName || profile?.displayName || 'Usuario de Musikeeo',
                photo: art?.profilePhoto || profile?.photoURL || undefined,
                role: art ? 'musician' : prov ? 'provider' : profile?.primaryMode,
                location: art?.city || profile?.location || '',
                bio: art?.bio || profile?.bio || '',
            });
            const myPosts = ps.status === 'fulfilled' ? ps.value : [];
            const myListings = l.status === 'fulfilled'
                ? l.value.docs.map(d => ({ id: d.id, ...d.data() }) as Listing).filter(x => x.available !== false)
                    .sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')))
                : [];
            const myEvents = e.status === 'fulfilled'
                ? [...e.value].sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')))
                : [];
            setPosts(myPosts); setListings(myListings); setEvents(myEvents);
            setTab(myPosts.length ? 'posts' : myListings.length ? 'anuncios' : myEvents.length ? 'bolos' : 'posts');
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [id]);

    if (esMio && !vistaPublica) return <Navigate to="/profile" replace />;

    const back = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1); else navigate('/discover');
    };

    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title: `${base?.name} en Musikeeo`, url });
            else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
        } catch { /* cancelado */ }
    };

    const contact = () => {
        if (esMio) { toast('Así verán el botón los demás: abre un chat contigo'); return; }
        navigate(`/messages?userId=${id}`);
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-14">
                <div className="flex items-center gap-4">
                    <span className="h-[84px] w-[84px] rounded-full bg-fill animate-pulse" />
                    <span className="flex-1 space-y-2">
                        <span className="block h-5 w-2/3 rounded bg-fill animate-pulse" />
                        <span className="block h-4 w-1/3 rounded bg-fill animate-pulse" />
                    </span>
                </div>
            </div>
        );
    }

    if (notFound || !base) {
        return (
            <div className="max-w-md mx-auto px-6 py-20 text-center">
                <p className="font-semibold text-foreground">Este perfil no existe o ya no está disponible</p>
                <Link to="/discover" className="mt-5 inline-flex h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">Ir a Explorar</Link>
            </div>
        );
    }

    const genres = artist?.genres?.length ? artist.genres : provider?.services || [];
    const verified = !!artist?.isVerified;

    return (
        <div className="max-w-2xl mx-auto px-4 pt-2 pb-10">
            <button onClick={back} className="h-10 -ml-2 pr-3 flex items-center text-[15px] text-foreground active:opacity-60">
                <ChevronLeft className="h-6 w-6" /> Atrás
            </button>

            {vistaPublica && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-fill px-3.5 py-2.5">
                    <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="flex-1 text-[13px] text-foreground">Así ven tu perfil los demás</p>
                    <Link to="/profile" className="h-8 px-3 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center active:opacity-70">Volver</Link>
                </div>
            )}

            {/* Cabecera */}
            <div className="mt-1 flex items-center gap-4">
                <span className="h-[84px] w-[84px] shrink-0 rounded-full overflow-hidden bg-fill-strong flex items-center justify-center text-3xl font-bold text-foreground">
                    {base.photo && !photoBroken
                        ? <img src={base.photo} alt="" onError={() => setPhotoBroken(true)} className="h-full w-full object-cover" />
                        : base.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="font-heading font-bold text-[24px] leading-tight text-foreground line-clamp-2 break-words">
                        {base.name}
                        {verified && <BadgeCheck className="inline h-5 w-5 ml-1 -mt-1 text-foreground" aria-label="Verificado" />}
                    </h1>
                    {base.role && <p className="text-[14px] text-muted-foreground">{ROLE_LABEL[base.role]}</p>}
                    {base.location && (
                        <p className="mt-0.5 text-[13px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {base.location}
                        </p>
                    )}
                </div>
            </div>

            {base.bio && <p className="mt-4 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">{base.bio}</p>}
            {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {genres.slice(0, 6).map(g => (
                        <span key={g} className="px-2.5 py-1 rounded-full bg-fill text-[12px] text-foreground/80">{g}</span>
                    ))}
                </div>
            )}
            {artist?.priceFrom ? <p className="mt-3 text-[14px] text-foreground">Desde <b>{artist.priceFrom} €</b> por bolo</p> : null}

            {/* Acciones: Contactar es la principal */}
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                <button onClick={contact} className="h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-2 active:opacity-80">
                    <MessageCircle className="h-5 w-5" /> Contactar
                </button>
                <button onClick={share} aria-label="Compartir perfil" className="h-[52px] w-[52px] rounded-[14px] bg-fill-strong text-foreground flex items-center justify-center active:opacity-70">
                    <Share2 className="h-5 w-5" />
                </button>
            </div>
            {artist?.slug && (
                <Link to={`/artist/${artist.slug}`} className="mt-2 h-12 px-4 rounded-2xl bg-fill flex items-center gap-3 active:opacity-70">
                    <Music2 className="h-[18px] w-[18px] text-muted-foreground" />
                    <span className="flex-1 text-[15px] text-foreground">Ficha de artista: precios, vídeos y fechas</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
            )}

            {/* Lo que ha publicado */}
            <div className="mt-7 flex p-0.5 rounded-[10px] bg-fill">
                {([['posts', `Publicaciones · ${posts.length}`], ['anuncios', `Anuncios · ${listings.length}`], ['bolos', `Bolos · ${events.length}`]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={cn('flex-1 h-8 rounded-[8px] text-[12px] font-semibold whitespace-nowrap px-1 transition-colors', tab === key ? 'bg-foreground text-background' : 'text-muted-foreground')}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-3">
                {tab === 'posts' && (posts.length === 0 ? <Empty icon={ImageIcon} text="Todavía no ha publicado fotos ni vídeos." /> : (
                    <div className="grid grid-cols-3 gap-0.5 -mx-4">
                        {posts.map(p => (
                            <Link key={p.id} to={p.mediaType === 'video' ? `/feed?reel=${p.id}` : '/feed'} className="relative aspect-[4/5] bg-fill active:opacity-80">
                                {(p.mediaType === 'video' ? p.posterUrl : p.mediaUrl)
                                    ? <img src={p.mediaType === 'video' ? p.posterUrl : p.mediaUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                                    : <Play className="h-6 w-6 text-muted-foreground absolute inset-0 m-auto" />}
                                {p.mediaType === 'video' && <Play className="absolute top-1.5 right-1.5 h-4 w-4 text-white fill-white drop-shadow" />}
                            </Link>
                        ))}
                    </div>
                ))}

                {tab === 'anuncios' && (listings.length === 0 ? <Empty icon={ShoppingBag} text="No tiene anuncios en el Mercado." /> : (
                    <div className="grid grid-cols-2 gap-2">
                        {listings.map(l => (
                            <Link key={l.id} to={`/market/${l.id}`} className="rounded-2xl overflow-hidden bg-fill active:opacity-80">
                                <div className="aspect-square bg-fill relative">
                                    {l.images?.[0]
                                        ? <img src={l.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                                        : <ImageIcon className="h-6 w-6 text-muted-foreground absolute inset-0 m-auto" />}
                                </div>
                                <div className="p-2.5">
                                    <p className="text-[13px] font-semibold text-foreground line-clamp-1">{l.title}</p>
                                    <p className="text-[13px] text-muted-foreground">{priceOf(l)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ))}

                {tab === 'bolos' && (events.length === 0 ? <Empty icon={CalendarDays} text="No tiene bolos publicados." /> : (
                    <div className="space-y-2">
                        {events.map(ev => (
                            <Link key={ev.id} to={`/eventos/${ev.id}`} className="flex gap-3 p-2 rounded-2xl bg-fill active:opacity-80">
                                <span className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-fill">
                                    {ev.imageUrl && <img src={ev.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                                </span>
                                <span className="min-w-0 flex-1 py-0.5">
                                    <span className="block text-[14px] font-semibold text-foreground line-clamp-1">{ev.title}</span>
                                    <span className="block text-[13px] text-muted-foreground line-clamp-1">{[dateOf(ev.date), ev.location, ev.price ? `${ev.price} €` : ''].filter(Boolean).join(' · ')}</span>
                                </span>
                                <ChevronRight className="h-4 w-4 self-center text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="py-10 text-center">
            <Icon className="h-8 w-8 mx-auto text-muted-foreground" strokeWidth={1.5} />
            <p className="mt-2 text-[14px] text-muted-foreground px-6">{text}</p>
        </div>
    );
}
