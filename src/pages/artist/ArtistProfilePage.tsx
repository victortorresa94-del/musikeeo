import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Heart, MessageCircle, Music, Play, Share, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { getArtistBySlug } from '../../services/artistService';
import { chatService } from '../../services/chatService';
import type { Artist } from '../../types';
import { OBJETO_3D } from '../../config/objetos3d';
import { cn } from '../../lib/utils';
import {
    estadosDe, euros, filasDe, idealParaDe, libresEn, lineaDe, paquetesDe, precioDesde, tarjetasDe, type Paquete,
} from '../../components/ficha-artista/datos';
import {
    Avatar, CalendarioMes, Pestanas, Portada, SOMBRA_3D, TarjetaPaquete, TarjetasArtista, TiraDias,
} from '../../components/ficha-artista/Partes';

type IdPestana = 'sobre' | 'videos' | 'paquetes' | 'fechas';

// «Me gusta»: aún no hay favoritos en Firestore; se recuerda en este dispositivo
const CLAVE_GUSTA = 'musikeeo-artistas-gustan';
const leerGustan = (): string[] => {
    try { const v = JSON.parse(localStorage.getItem(CLAVE_GUSTA) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
    return (
        <div className="min-h-[70vh] px-4 flex flex-col items-center justify-center text-center">
            <img src={OBJETO_3D.guitarra} alt="" loading="lazy" className={cn('h-28 w-28', SOMBRA_3D)} />
            <h1 className="mt-4 text-[24px] font-bold text-foreground">{titulo}</h1>
            <p className="mt-1 text-[15px] text-muted-foreground max-w-[320px]">{texto}</p>
            <Link to="/explorar/bandas" className="pulsable mt-6 h-[52px] px-6 rounded-[14px] bg-primary text-primary-foreground text-[17px] font-semibold flex items-center">
                Ver más artistas
            </Link>
        </div>
    );
}

export default function ArtistProfilePage() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [pestana, setPestana] = useState<IdPestana | null>(null);
    const [gusta, setGusta] = useState(false);

    useEffect(() => {
        let cancelado = false;
        setLoading(true);
        setPestana(null);
        (async () => {
            if (!slug) { setLoading(false); return; }
            try {
                const data = await getArtistBySlug(slug);
                if (!cancelado) setArtist(data);
            } catch (error) {
                console.error('Error loading artist:', error);
            } finally {
                if (!cancelado) setLoading(false);
            }
        })();
        setGusta(!!slug && leerGustan().includes(slug));
        return () => { cancelado = true; };
    }, [slug]);

    // Todo lo que se enseña sale de sus datos; lo que falta, no sale
    const d = useMemo(() => {
        if (!artist) return null;
        const paquetes = paquetesDe(artist);
        const desde = precioDesde(artist, paquetes);
        const estados = estadosDe(artist);
        const fotoPortada = artist.coverPhoto || artist.clipPoster;
        const videos = Array.isArray(artist.multimedia?.videos) ? artist.multimedia.videos.filter(v => v && v.url) : [];
        const fotos = (Array.isArray(artist.multimedia?.photos) ? artist.multimedia.photos : [])
            .filter(p => p && p.url && p.url !== fotoPortada && p.url !== artist.clipPoster)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const spotify = artist.multimedia?.spotifyVisible && artist.multimedia?.spotifyUri ? artist.multimedia.spotifyUri : '';
        const hayFechas = [...estados.keys()].some(k => k >= new Date().toISOString().slice(0, 7));
        const bio = (artist.bio || '').trim();
        const idealPara = idealParaDe(artist);
        const filas = filasDe(artist);
        const pestanas: { id: IdPestana; nombre: string }[] = [];
        if (bio || idealPara.length || filas.length || fotos.length) pestanas.push({ id: 'sobre', nombre: 'Sobre' });
        if (artist.clipUrl || videos.length || spotify) pestanas.push({ id: 'videos', nombre: 'Vídeos' });
        if (paquetes.length) pestanas.push({ id: 'paquetes', nombre: 'Paquetes' });
        if (hayFechas) pestanas.push({ id: 'fechas', nombre: 'Fechas' });
        return {
            paquetes, desde, estados, fotoPortada, videos, fotos, spotify, hayFechas, bio, idealPara, filas, pestanas,
            tarjetas: tarjetasDe(artist, desde, libresEn(estados, 30)),
            linea: lineaDe(artist),
        };
    }, [artist]);

    const handleBack = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1); else navigate('/explorar/bandas');
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title: artist?.artistName, url });
            else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
        } catch { /* cancelado */ }
    };

    const handleLike = () => {
        if (!slug) return;
        const otra = !gusta;
        setGusta(otra);
        try {
            const lista = leerGustan().filter(s => s !== slug);
            localStorage.setItem(CLAVE_GUSTA, JSON.stringify(otra ? [...lista, slug] : lista));
        } catch { /* sin almacenamiento: queda solo en esta visita */ }
    };

    const handleContact = async () => {
        if (!user) {
            navigate('/login', { state: { from: `/artist/${slug}` } });
            return;
        }
        if (!artist) return;

        try {
            toast.info(`Iniciando conversación con ${artist.artistName}...`);
            const chatId = await chatService.createChat(user.uid, artist.userId);
            navigate('/messages', { state: { selectedChatId: chatId } });
        } catch (error) {
            console.error("Error creating chat:", error);
            toast.error("Error al iniciar chat");
        }
    };

    // Abre el chat con el artista con la petición ya escrita; el usuario la completa y la envía.
    // Si viene de un paquete, la petición lo nombra
    const handleBooking = (paquete?: Paquete) => {
        if (!artist) return;
        const texto = `Hola, ${artist.artistName}. Me gustaría pedir presupuesto para un bolo.\n${paquete ? `Paquete: ${paquete.nombre}\n` : ''}Fecha: \nLugar: \nTipo de evento: \nDuración aproximada: `;
        const target = `/messages?userId=${artist.userId}&texto=${encodeURIComponent(texto)}`;
        if (!user) {
            navigate('/login', { state: { from: target } });
            return;
        }
        navigate(target);
    };

    if (loading) {
        return (
            <div className="max-w-[1080px] mx-auto px-4 md:px-6 pt-2 md:pt-6" aria-busy="true" aria-label="Cargando la ficha">
                <div className="md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-10">
                    <div className="flex flex-col items-center">
                        <div className="w-full aspect-[16/10] md:aspect-[16/9] rounded-[24px] md:rounded-[28px] bg-fill animate-pulse" />
                        <div className="-mt-12 h-24 w-24 rounded-full bg-fill-strong animate-pulse" />
                        <div className="mt-4 h-7 w-48 rounded-lg bg-fill animate-pulse" />
                        <div className="mt-2 h-4 w-64 rounded-lg bg-fill animate-pulse" />
                        <div className="mt-8 w-full grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map(i => <div key={i} className="h-[92px] rounded-[18px] bg-fill animate-pulse" />)}
                        </div>
                    </div>
                    <div className="hidden md:block h-[260px] rounded-[22px] bg-fill animate-pulse" />
                </div>
            </div>
        );
    }

    if (!artist || !d) {
        return <Aviso titulo="Artista no encontrado" texto="El perfil que buscas no existe o no está disponible." />;
    }

    const isOwner = user?.uid === artist.userId;
    if (!artist.isPublic && !isOwner) {
        return <Aviso titulo="Perfil privado" texto="Este perfil es privado y solo lo ve su dueño." />;
    }

    const activa: IdPestana | null = pestana && d.pestanas.some(p => p.id === pestana) ? pestana : d.pestanas[0]?.id ?? null;
    const precioTexto = d.desde ? `Desde ${euros(d.desde)}` : '';

    const boton = (className: string) => isOwner ? (
        <Link to="/panel/perfil" className={cn('pulsable h-[52px] rounded-[14px] px-4 bg-primary text-primary-foreground text-[17px] font-semibold whitespace-nowrap flex items-center justify-center', className)}>
            Editar mi ficha
        </Link>
    ) : (
        <button type="button" onClick={() => handleBooking()} className={cn('pulsable h-[52px] rounded-[14px] px-4 bg-primary text-primary-foreground text-[17px] font-semibold whitespace-nowrap flex items-center justify-center', className)}>
            Pedir presupuesto
        </button>
    );

    const botonRedondo = 'pulsable h-10 w-10 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center';

    return (
        <div className="max-w-[1080px] mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-36 md:pb-12">
            <div className="md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-10">
                <div className="min-w-0">
                    {/* Arriba: el clip (o la foto), con el avatar pisando su borde */}
                    <Portada clipUrl={artist.clipUrl} poster={artist.clipPoster} foto={d.fotoPortada || artist.profilePhoto} nombre={artist.artistName}>
                        <button type="button" onClick={handleBack} aria-label="Volver" className={cn(botonRedondo, 'absolute top-3 left-3')}>
                            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
                        </button>
                        <div className="absolute top-3 right-3 flex gap-2">
                            <button type="button" onClick={handleLike} aria-pressed={gusta}
                                aria-label={gusta ? `Ya no me gusta ${artist.artistName}` : `Me gusta ${artist.artistName}`} className={botonRedondo}>
                                <Heart className="h-[18px] w-[18px]" strokeWidth={2.2} fill={gusta ? 'currentColor' : 'none'} />
                            </button>
                            <button type="button" onClick={handleShare} aria-label="Compartir la ficha" className={botonRedondo}>
                                <Share className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </button>
                        </div>
                    </Portada>

                    <div className="flex flex-col items-center text-center">
                        <Avatar foto={artist.profilePhoto} nombre={artist.artistName} />
                        <h1 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-tight text-foreground break-words">{artist.artistName}</h1>
                        {d.linea && <p className="mt-1 text-[15px] text-muted-foreground">{d.linea}</p>}
                        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                            {artist.isVerified && (
                                <span className="h-7 px-2.5 rounded-full bg-fill text-foreground text-[13px] font-semibold inline-flex items-center gap-1">
                                    <CheckCircle className="h-3.5 w-3.5" /> Verificado
                                </span>
                            )}
                            {artist.reviewCount > 0 ? (
                                <span className="h-7 px-2.5 rounded-full bg-fill text-foreground text-[13px] font-semibold inline-flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                                    {artist.rating.toLocaleString('es-ES', { maximumFractionDigits: 1 })} · {artist.reviewCount} {artist.reviewCount === 1 ? 'reseña' : 'reseñas'}
                                </span>
                            ) : (
                                <span className="h-7 px-2.5 rounded-full bg-fill text-muted-foreground text-[13px] font-semibold inline-flex items-center">Nuevo en Musikeeo</span>
                            )}
                            {artist.gigsCompleted > 0 && (
                                <span className="h-7 px-2.5 rounded-full bg-fill text-foreground text-[13px] font-semibold inline-flex items-center gap-1">
                                    <Music className="h-3.5 w-3.5" /> {artist.gigsCompleted} actuaciones
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Lo importante de un vistazo, un objeto por tarjeta */}
                    <TarjetasArtista tarjetas={d.tarjetas} />

                    {activa && d.pestanas.length > 1 && (
                        <Pestanas opciones={d.pestanas} valor={activa} onCambio={setPestana} />
                    )}

                    {activa && (
                        <motion.div
                            key={activa}
                            id={`panel-${activa}`}
                            role="tabpanel"
                            aria-labelledby={d.pestanas.length > 1 ? `pestana-${activa}` : undefined}
                            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="mt-4"
                        >
                            {activa === 'sobre' && (
                                <div className="space-y-4">
                                    {d.bio && <p className="text-[16px] leading-relaxed text-foreground whitespace-pre-line break-words">{d.bio}</p>}

                                    {d.idealPara.length > 0 && (
                                        <div className="rounded-[18px] bg-card border border-hairline shadow-e1 p-4">
                                            <h2 className="text-[17px] font-bold text-foreground">Ideal para</h2>
                                            <ul className="mt-3 flex flex-wrap gap-2">
                                                {d.idealPara.map(o => (
                                                    <li key={o.nombre} className="h-9 pl-1.5 pr-3.5 rounded-full bg-fill text-foreground text-[15px] font-semibold inline-flex items-center gap-1.5">
                                                        <img src={o.objeto} alt="" loading="lazy" className={cn('h-7 w-7', SOMBRA_3D)} />
                                                        {o.nombre}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {d.filas.length > 0 && (
                                        <section>
                                            <h2 className="text-[19px] font-bold text-foreground">La ficha</h2>
                                            <dl className="mt-1">
                                                {d.filas.map(f => (
                                                    <div key={f.etiqueta} className="grid grid-cols-[112px_minmax(0,1fr)] md:grid-cols-[150px_minmax(0,1fr)] gap-x-3 py-3 border-b border-hairline">
                                                        <dt className="text-[15px] leading-snug text-muted-foreground">{f.etiqueta}</dt>
                                                        <dd className="text-[15px] leading-snug text-foreground break-words">{f.valor}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </section>
                                    )}

                                    {d.hayFechas && (
                                        <section>
                                            <div className="flex items-center justify-between gap-3">
                                                <h2 className="text-[17px] font-bold text-foreground">Próximas dos semanas</h2>
                                                {d.pestanas.some(p => p.id === 'fechas') && (
                                                    <button type="button" onClick={() => setPestana('fechas')} className="pulsable h-9 px-3 rounded-full text-[14px] font-semibold text-foreground">
                                                        Ver el mes
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-2"><TiraDias estados={d.estados} /></div>
                                        </section>
                                    )}

                                    {d.fotos.length > 0 && (
                                        <section>
                                            <h2 className="text-[19px] font-bold text-foreground">Fotos</h2>
                                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {d.fotos.map(f => (
                                                    <img key={f.id || f.url} src={f.url} alt={f.caption || ''} loading="lazy" className="aspect-square w-full rounded-[14px] object-cover bg-fill" />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}

                            {activa === 'videos' && (
                                <div className="space-y-3">
                                    {artist.clipUrl && (
                                        <video src={artist.clipUrl} poster={artist.clipPoster || d.fotoPortada} controls playsInline preload="none"
                                            className="w-full aspect-video rounded-[18px] bg-fill object-cover" />
                                    )}
                                    {d.videos.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {d.videos.map(v => (
                                                <a key={v.id || v.url} href={v.url} target="_blank" rel="noopener noreferrer"
                                                    className="pulsable rounded-[18px] bg-card border border-hairline shadow-e1 overflow-hidden block">
                                                    <span className="relative block aspect-video bg-fill">
                                                        {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                                                        <span className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center">
                                                            <Play className="h-5 w-5 ml-0.5" fill="currentColor" strokeWidth={0} />
                                                        </span>
                                                    </span>
                                                    <span className="block px-3 py-2.5">
                                                        <span className="block text-[15px] font-semibold text-foreground truncate">{v.title || 'Vídeo'}</span>
                                                        {v.duration && <span className="block text-[13px] text-muted-foreground">{v.duration}</span>}
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {d.spotify && (
                                        <div className="rounded-[18px] bg-card border border-hairline shadow-e1 p-4">
                                            <p className="text-[15px] font-semibold text-foreground">Escúchalo en Spotify</p>
                                            <p className="mt-0.5 text-[14px] text-muted-foreground">Conecta para ver sus canciones más escuchadas.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activa === 'paquetes' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {d.paquetes.map(p => (
                                        <TarjetaPaquete key={p.id} p={p} onPedir={isOwner ? undefined : () => handleBooking(p)} />
                                    ))}
                                </div>
                            )}

                            {activa === 'fechas' && (
                                <div className="space-y-4">
                                    <section>
                                        <h2 className="text-[17px] font-bold text-foreground">Próximas dos semanas</h2>
                                        <div className="mt-2"><TiraDias estados={d.estados} /></div>
                                    </section>
                                    <CalendarioMes estados={d.estados} />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Dudas antes de pedir presupuesto: escribirle sin más */}
                    {!isOwner && (
                        <div className="mt-6 pt-4 border-t border-hairline">
                            <button type="button" onClick={handleContact}
                                className="pulsable h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold inline-flex items-center gap-1.5 max-w-full">
                                <MessageCircle className="h-4 w-4 shrink-0" />
                                <span className="truncate">Escribir a {artist.artistName}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* PC: el precio, los paquetes y la acción, a mano mientras se lee */}
                <aside className="hidden md:block">
                    <div className="sticky top-20 rounded-[22px] bg-card border border-hairline shadow-e1 p-5">
                        {d.desde ? (
                            <>
                                <p className="text-[13px] text-muted-foreground">Desde</p>
                                <p className="text-[28px] font-bold leading-tight text-foreground">{euros(d.desde)}</p>
                            </>
                        ) : (
                            <p className="text-[17px] font-bold text-foreground">Precio a consultar</p>
                        )}
                        {d.paquetes.length > 0 && (
                            <ul className="mt-3 border-t border-hairline">
                                {d.paquetes.map(p => (
                                    <li key={p.id} className="py-2.5 border-b border-hairline flex items-baseline justify-between gap-3">
                                        <span className="min-w-0">
                                            <span className="block text-[15px] font-semibold leading-snug text-foreground break-words">{p.nombre}</span>
                                            {p.duracion && <span className="block text-[13px] text-muted-foreground">{p.duracion}</span>}
                                        </span>
                                        {p.precio !== null && <span className="shrink-0 text-[15px] font-semibold text-foreground">{euros(p.precio)}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {boton('mt-4 w-full')}
                        {!isOwner && (
                            <p className="mt-3 text-[13px] leading-snug text-muted-foreground text-center">
                                Se abre un mensaje para {artist.artistName} con lo que necesita saber. Lo completas y lo envías tú.
                            </p>
                        )}
                    </div>
                </aside>
            </div>

            <div className="mt-10">
                <Footer />
            </div>

            {/* Móvil: barra fija con el precio y la acción, encima de la barra de navegación */}
            {createPortal(
                <motion.div
                    initial={reduceMotion ? false : { y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="md:hidden fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-[45] px-3 pb-2"
                >
                    <div className={cn('flex items-center gap-3 rounded-[22px] bg-sheet border border-hairline shadow-e2 py-2', precioTexto ? 'pl-5 pr-2' : 'px-2')}>
                        {precioTexto && (
                            <p className="min-w-0 shrink font-bold text-[18px] leading-none text-foreground truncate">{precioTexto}</p>
                        )}
                        {boton(precioTexto ? 'ml-auto flex-1 max-w-[220px]' : 'flex-1')}
                    </div>
                </motion.div>,
                document.body,
            )}
        </div>
    );
}
