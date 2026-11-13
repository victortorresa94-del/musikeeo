import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import {
    MapPin, Share2, CalendarDays, LogOut, ChevronRight, ChevronLeft,
    Image as ImageIcon, ShoppingBag, Plus, Eye, Sparkles, Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { getArtistByUserId } from '../../services/artistService';
import { getProviderByUserId } from '../../services/providerService';
import { eventService } from '../../services/eventService';
import { postService } from '../../services/postService';
import type { Artist, Event, Listing, Post, ProviderProfile, UserMode } from '../../types';
import { useCancionero } from '../../hooks/useCancionero';
import { ICONO } from '../../components/cancionero/estilo';

const ROLE_LABEL: Record<UserMode, string> = {
    musician: 'Músico · Banda',
    organizer: 'Sala · Promotor',
    provider: 'Técnico · Empresa de sonido',
};

// Dónde se edita el perfil de cada rol (el panel)
const EDIT_PATH: Record<UserMode, string> = {
    musician: '/panel/perfil',
    organizer: '/panel/perfil-organizador',
    provider: '/panel/perfil-tecnico',
};

const priceOf = (l: Listing) =>
    l.type === 'prestamo' ? 'Préstamo' : `${l.price.toLocaleString('es-ES')} €${l.type === 'alquiler' && l.priceUnit ? ({ dia: '/día', semana: '/semana', total: '' } as Record<string, string>)[l.priceUnit] ?? '' : ''}`;

const dateOf = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export default function Profile() {
    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [provider, setProvider] = useState<ProviderProfile | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [params] = useSearchParams();
    const askedTab = params.get('tab');
    // «Mis bolos» va en su propia pantalla (13-nov, Víctor: «lo del bolo ocupa demasiado… otro botón»)
    const verBolos = params.get('ver') === 'bolos' || askedTab === 'bolos';
    const [tab, setTab] = useState<'posts' | 'anuncios'>(askedTab === 'anuncios' ? 'anuncios' : 'posts');
    const { canciones, repertorios, bolos } = useCancionero();
    const [photoBroken, setPhotoBroken] = useState(false);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            const [a, p, l, e, ps] = await Promise.allSettled([
                getArtistByUserId(user.uid),
                getProviderByUserId(user.uid),
                getDocs(query(collection(db, 'listings'), where('userId', '==', user.uid), limit(30))),
                eventService.getEventsByOrganizer(user.uid),
                postService.byAuthor(user.uid),
            ]);
            if (cancelled) return;
            if (a.status === 'fulfilled') setArtist(a.value);
            if (p.status === 'fulfilled') setProvider(p.value);
            if (l.status === 'fulfilled') {
                const list = l.value.docs.map(d => ({ id: d.id, ...d.data() }) as Listing);
                list.sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')));
                setListings(list);
            }
            if (e.status === 'fulfilled') {
                setEvents([...e.value].sort((x, y) => String(y.date || '').localeCompare(String(x.date || ''))));
            }
            const myPosts = ps.status === 'fulfilled' ? ps.value : [];
            setPosts(myPosts);
            // Abre en la pestaña que tenga algo
            if (!askedTab && myPosts.length === 0 && l.status === 'fulfilled' && !l.value.empty) setTab('anuncios');
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [user]);

    if (!user || !userProfile) return null;

    const mode: UserMode = userProfile.primaryMode || 'musician';
    const name = artist?.artistName || provider?.businessName || userProfile.displayName || user.displayName || 'Tu perfil';
    const photo = photoBroken ? '' : (artist?.profilePhoto || userProfile.photoURL || user.photoURL || '');
    const location = artist?.city || userProfile.location || '';
    const bio = artist?.bio || userProfile.bio || '';
    const genres = artist?.genres?.length ? artist.genres : (userProfile.genres || []);
    // La ficha de artista si es pública; si no, el perfil público en modo vista previa
    const publicPath = artist?.slug && artist.isPublic ? `/artist/${artist.slug}` : `/profile/${user.uid}?vista=publica`;
    const shareUrl = artist?.slug && artist.isPublic ? `/artist/${artist.slug}` : `/profile/${user.uid}`;
    const needsArtist = mode === 'musician' && !artist;
    const needsProvider = mode === 'provider' && !provider;

    // El Cancionero, de un vistazo: cuántas, cuántos repertorios y el próximo bolo
    const hoy = new Date().toLocaleDateString('sv-SE');
    const bolosQueVienen = bolos.filter(b => b.fecha && b.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const proximaFecha = bolosQueVienen[0]?.fecha
        ?? repertorios.filter(r => r.fecha && r.fecha >= hoy && r.canciones.length).map(r => r.fecha).sort()[0];
    const resumenCancionero = [
        `${canciones.length} ${canciones.length === 1 ? 'canción' : 'canciones'}`,
        repertorios.length > 0 && `${repertorios.length} ${repertorios.length === 1 ? 'repertorio' : 'repertorios'}`,
        proximaFecha && `próximo bolo ${diaCorto(proximaFecha, hoy)}`,
    ].filter(Boolean).join(' · ');
    const eventosQueVienen = events.filter(ev => ev.date && String(ev.date).slice(0, 10) >= hoy).length;
    const cuantosBolos = bolosQueVienen.length + eventosQueVienen;

    const share = async () => {
        const url = `${window.location.origin}${shareUrl}`;
        try {
            if (navigator.share) await navigator.share({ title: `${name} en Musikeeo`, url });
            else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
        } catch { /* el usuario canceló */ }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/home', { replace: true });
    };

    if (verBolos) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
                <Link to="/profile" className="inline-flex items-center gap-0.5 h-9 -ml-1 pr-2 text-[15px] font-semibold text-muted-foreground active:opacity-60">
                    <ChevronLeft className="h-5 w-5" /> Mi perfil
                </Link>
                <h1 className="mt-1 font-heading font-bold text-[28px] leading-tight text-foreground">Mis bolos</h1>

                {/* Los de tu Cancionero: fecha, horario, sets y el enlace para los músicos */}
                <section className="mt-5" aria-label="Del Cancionero">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Del Cancionero</h2>
                    <div className="mt-2 space-y-2">
                        {[...bolos].sort((a, b) => (b.fecha >= hoy ? 1 : 0) - (a.fecha >= hoy ? 1 : 0) || (a.fecha >= hoy ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha))).map(b => (
                            <Link key={b.id} to={`/cancionero/bolo/${b.id}`} className="pulsable flex items-center gap-3 p-2 rounded-2xl bg-fill">
                                <span className="h-14 w-14 shrink-0 rounded-[14px] bg-pastel-lavanda flex items-center justify-center">
                                    <img src="/images/3d/escenario.webp" alt="" aria-hidden className="h-11 w-11 object-contain" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[16px] font-semibold text-foreground line-clamp-1">{b.titulo || 'Bolo'}</span>
                                    <span className="block text-[13.5px] text-muted-foreground line-clamp-1">{[b.fecha && diaCorto(b.fecha, hoy, true), b.lugar].filter(Boolean).join(' · ') || 'Sin fecha'}</span>
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        ))}
                        <Link to="/cancionero?ver=bolos" className="h-11 rounded-2xl border border-dashed border-hairline-strong flex items-center justify-center gap-1 text-muted-foreground text-[14px] font-semibold active:opacity-70">
                            {bolos.length ? 'Ver y crear en el Cancionero' : <><Plus className="h-4 w-4" /> Crear un bolo en el Cancionero</>}
                        </Link>
                    </div>
                </section>

                {/* Los publicados para contratar (salas y promotores) */}
                <section className="mt-8" aria-label="Publicados">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Publicados para contratar</h2>
                    <div className="mt-2">
                        {loading ? <div className="h-20 rounded-2xl bg-fill animate-pulse" /> : events.length === 0 ? (
                            <Empty icon={CalendarDays} text="¿Buscas banda, DJ o técnico para una fecha? Publícalo y te escriben." cta="Publicar bolo" to="/publicar" />
                        ) : (
                            <div className="space-y-2">
                                {events.map(ev => (
                                    <Link key={ev.id} to={`/eventos/${ev.id}`} className="flex gap-3 p-2 rounded-2xl bg-fill active:opacity-80">
                                        <span className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-fill">
                                            {ev.imageUrl && <img src={ev.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                                        </span>
                                        <span className="min-w-0 flex-1 py-0.5">
                                            <span className="block text-[14px] font-semibold text-foreground line-clamp-1">{ev.title}</span>
                                            <span className="block text-[13px] text-muted-foreground line-clamp-1">{[dateOf(ev.date), ev.location].filter(Boolean).join(' · ')}</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 self-center text-muted-foreground" />
                                    </Link>
                                ))}
                                <Link to="/publicar" className="h-11 rounded-2xl border border-dashed border-hairline-strong flex items-center justify-center gap-1 text-muted-foreground text-[13px] active:opacity-70">
                                    <Plus className="h-4 w-4" /> Nuevo bolo
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
            {/* Cabecera */}
            <div className="flex items-center gap-4">
                <span className="h-[84px] w-[84px] shrink-0 rounded-full overflow-hidden bg-fill-strong flex items-center justify-center text-3xl font-bold text-foreground">
                    {photo
                        ? <img src={photo} alt="" onError={() => setPhotoBroken(true)} className="h-full w-full object-cover" />
                        : name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="font-heading font-bold text-[24px] leading-tight text-foreground line-clamp-2 break-words">{name}</h1>
                    <p className="text-[14px] text-muted-foreground">{ROLE_LABEL[mode]}</p>
                    {location && (
                        <p className="mt-0.5 text-[13px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {location}
                        </p>
                    )}
                </div>
            </div>

            {bio && <p className="mt-4 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">{bio}</p>}
            {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {genres.slice(0, 6).map(g => (
                        <span key={g} className="px-2.5 py-1 rounded-full bg-fill text-[12px] text-foreground/80">{g}</span>
                    ))}
                </div>
            )}

            {/* Acciones (Editar perfil va en su baldosa) */}
            <div className="mt-4 flex gap-2">
                <button onClick={share} className="pulsable h-9 px-4 rounded-full bg-fill-strong text-foreground text-[14px] font-semibold flex items-center gap-1.5">
                    <Share2 className="h-4 w-4" /> Compartir
                </button>
                <Link to={publicPath} className="pulsable h-9 px-4 rounded-full bg-fill-strong text-foreground text-[14px] font-semibold flex items-center gap-1.5">
                    <Eye className="h-4 w-4" /> Ver como público
                </Link>
            </div>

            {/* Perfil público pendiente: la acción principal de la pantalla */}
            {(needsArtist || needsProvider) && (
                <div className="mt-5 rounded-2xl bg-fill border border-hairline p-4">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary-ink" />
                        {needsArtist ? 'Aún no apareces en Explorar' : 'Tu empresa aún no aparece en Técnicos'}
                    </p>
                    <p className="mt-1 text-[14px] text-muted-foreground">
                        {needsArtist
                            ? 'Crea tu perfil de artista con fotos, vídeos y precio para que te encuentren y te contraten.'
                            : 'Crea tu ficha con servicios y zona para que te escriban salas y bandas.'}
                    </p>
                    <Link to={EDIT_PATH[mode]} className="mt-3 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center active:opacity-80">
                        {needsArtist ? 'Crear mi perfil de artista' : 'Crear mi ficha'}
                    </Link>
                </div>
            )}

            {/* El Cancionero, lo primero (13-nov, Víctor: «el cancionero en móvil quiero destacarlo más») */}
            <Link to="/cancionero" className="pulsable mt-6 relative block min-h-[150px] rounded-[22px] overflow-hidden bg-pastel-mantequilla p-4 pr-[150px]">
                <span className="block font-heading text-[26px] font-bold leading-tight text-foreground">Cancionero</span>
                <span className="mt-1 block text-[14.5px] font-semibold leading-snug text-pastel-mantequilla-ink">{resumenCancionero}</span>
                <span className="mt-3 inline-flex h-9 px-5 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">Abrir</span>
                <img src={ICONO.canciones} alt="" aria-hidden draggable={false}
                    className="pointer-events-none absolute right-[64px] top-1/2 -translate-y-1/2 h-[104px] w-[80px] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]" />
                <img src={ICONO.repertorios} alt="" aria-hidden draggable={false}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-[42%] h-[96px] w-[76px] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]" />
            </Link>

            {/* Lo demás, cada cosa en su baldosa con su objeto 3D */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4">
                <Baldosa to="/messages" icono="/images/perfil/mensajes.webp" fondo="bg-pastel-cielo" texto="Mensajes" />
                <Baldosa to="/panel/calendario" icono="/images/3d/calendario.webp" fondo="bg-pastel-rosa" texto="Calendario" />
                <Baldosa to="/mapa" icono="/images/perfil/mapa.webp" fondo="bg-pastel-menta" texto="Musikeers cerca" />
                <Baldosa to="/profile?ver=bolos" icono="/images/3d/escenario.webp" fondo="bg-pastel-lavanda" texto="Mis bolos" numero={cuantosBolos || undefined} />
                <Baldosa to={EDIT_PATH[mode]} icono="/images/perfil/editar-perfil.webp" fondo="bg-pastel-melocoton" texto="Editar perfil" />
                <Baldosa to="/panel/ajustes" icono="/images/perfil/ajustes.webp" fondo="bg-fill-strong" texto="Ajustes" />
            </div>

            {/* Lo que he publicado */}
            <div className="mt-8 flex p-0.5 rounded-[10px] bg-fill">
                {([['posts', `Publicaciones · ${posts.length}`], ['anuncios', `Anuncios · ${listings.length}`]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={cn('flex-1 h-8 rounded-[8px] text-[12px] font-semibold whitespace-nowrap px-1 transition-colors',
                            tab === key ? 'bg-foreground text-background' : 'text-muted-foreground')}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-3">
                {loading && (
                    <div className="grid grid-cols-2 gap-2">
                        {[0, 1].map(i => <div key={i} className="aspect-[4/5] rounded-2xl bg-fill animate-pulse" />)}
                    </div>
                )}

                {!loading && tab === 'posts' && (posts.length === 0 ? (
                    <Empty icon={ImageIcon} text="Sube un vídeo tocando o una foto del bolo: es lo primero que mira quien te quiere contratar." cta="Publicar en el Feed" to="/feed" />
                ) : (
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

                {!loading && tab === 'anuncios' && (listings.length === 0 ? (
                    <Empty icon={ShoppingBag} text="No tienes anuncios. Vende, alquila o presta tu equipo." cta="Publicar anuncio" to="/market/create" />
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {listings.map(l => (
                            <Link key={l.id} to={`/market/${l.id}`} className="rounded-2xl overflow-hidden bg-fill active:opacity-80">
                                <div className="aspect-square bg-fill relative">
                                    {l.images?.[0]
                                        ? <img src={l.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                                        : <ImageIcon className="h-6 w-6 text-muted-foreground absolute inset-0 m-auto" />}
                                    {!l.available && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[11px] font-semibold">No disponible</span>}
                                </div>
                                <div className="p-2.5">
                                    <p className="text-[13px] font-semibold text-foreground line-clamp-1">{l.title}</p>
                                    <p className="text-[13px] text-muted-foreground">{priceOf(l)}</p>
                                </div>
                            </Link>
                        ))}
                        <Link to="/market/create" className="rounded-2xl border border-dashed border-hairline-strong flex flex-col items-center justify-center gap-1 text-muted-foreground text-[13px] min-h-[180px] active:opacity-70">
                            <Plus className="h-5 w-5" /> Nuevo anuncio
                        </Link>
                    </div>
                ))}

            </div>

            {/* Lo que queda: fotos y vídeos del perfil (músico) */}
            {mode === 'musician' && (
                <div className="mt-8 rounded-2xl bg-fill overflow-hidden">
                    <Row to="/panel/multimedia" icon={ImageIcon} label="Fotos y vídeos del perfil" />
                </div>
            )}
            <button onClick={handleLogout} className="mt-3 w-full h-12 rounded-2xl bg-fill text-red-400 text-[15px] font-semibold flex items-center justify-center gap-2 active:opacity-70">
                <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
        </div>
    );
}

// Una baldosa pastel con su objeto 3D y el nombre debajo (sueño elegido «Mi perfil · A»)
function Baldosa({ to, icono, fondo, texto, numero }: { to: string; icono: string; fondo: string; texto: string; numero?: number }) {
    return (
        <Link to={to} className="pulsable block">
            <span className={cn('relative block aspect-[1.9/1] rounded-[20px] overflow-hidden', fondo)}>
                <img src={icono} alt="" aria-hidden draggable={false} loading="lazy"
                    className="pointer-events-none absolute inset-0 m-auto h-[78%] w-[78%] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]" />
                {numero !== undefined && (
                    <span className="absolute top-2 right-2 min-w-[26px] h-[26px] px-1.5 rounded-full bg-background text-foreground text-[13px] font-bold flex items-center justify-center tabular-nums">{numero}</span>
                )}
            </span>
            <span className="mt-1.5 block text-[16px] font-bold leading-tight text-foreground">{texto}</span>
        </Link>
    );
}

// «2026-11-14» → «sáb 14» (o «hoy», «mañana»); con largo, «sábado 14 nov»
function diaCorto(fecha: string, hoy: string, largo = false): string {
    if (fecha === hoy) return 'hoy';
    const [a, m, d] = fecha.split('-').map(Number);
    if (!a) return '';
    const dia = new Date(a, m - 1, d);
    const manana = new Date(); manana.setDate(manana.getDate() + 1);
    if (!largo && manana.toLocaleDateString('sv-SE') === fecha) return 'mañana';
    return dia.toLocaleDateString('es-ES', largo ? { weekday: 'long', day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric' }).replace('.', '');
}

function Row({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
    return (
        <Link to={to} className="flex items-center gap-3 px-4 h-12 active:bg-fill">
            <Icon className="h-[18px] w-[18px] text-muted-foreground" />
            <span className="flex-1 text-[15px] text-foreground">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
    );
}

function Empty({ icon: Icon, text, cta, to }: { icon: React.ElementType; text: string; cta: string; to: string }) {
    return (
        <div className="py-8 text-center">
            <Icon className="h-8 w-8 mx-auto text-muted-foreground" strokeWidth={1.5} />
            <p className="mt-2 text-[14px] text-muted-foreground px-6">{text}</p>
            <Link to={to} className="mt-4 inline-flex h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">{cta}</Link>
        </div>
    );
}
