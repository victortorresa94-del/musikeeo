import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Loader2, MapPin, MessageCircle, Share } from 'lucide-react';
import { toast } from 'sonner';
import { eventService } from '../../services/eventService';
import { chatService } from '../../services/chatService';
import { userService, type PublicUserProfile } from '../../services/userService';
import { type Event, type UserMode } from '../../types';
import { OBJETO_3D, objeto3dDeBolo } from '../../config/objetos3d';
import { cn } from '../../lib/utils';

import { useAuth } from '../../context/AuthContext';
import { applicationService, type ApplicationWithApplicant } from '../../services/applicationService';
import ReportButton from '../../components/legal/ReportButton';
import { Postulaciones } from '../../components/detalle-bolo/Postulaciones';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// 1500 → «1.500 €» (es-ES no agrupa los números de cuatro cifras)
const euros = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

// El tipo solo se enseña cuando dice algo («Bolo» en la ficha de un bolo, no)
const TIPO: Record<string, string> = {
    jam: 'Jam session',
    session: 'Sesión',
    festival: 'Festival',
    'boda / social': 'Boda o evento social',
    'evento privado': 'Evento privado',
    'residencia / bar': 'Residencia en bar',
};

const MODO: Record<UserMode, string> = {
    musician: 'Músico o banda',
    organizer: 'Organiza bolos',
    provider: 'Técnico de sonido',
};

// El sonido lo pone el organizador si lo dicen las etiquetas o la descripción
const SONIDO = /sonido (esta |va |ya )?incluid|incluye (el )?(equipo de )?sonido|equipo de sonido incluid|tenemos (el |nuestro )?equipo|\b(pa|backline) incluid/;

const SOMBRA_3D = 'object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();
    const [isApplied, setIsApplied] = useState(false);
    const [applying, setApplying] = useState(false);

    const [applications, setApplications] = useState<ApplicationWithApplicant[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);

    const [organizer, setOrganizer] = useState<PublicUserProfile | null>(null);
    const [photoBroken, setPhotoBroken] = useState(false);
    const [avatarBroken, setAvatarBroken] = useState(false);
    const reduceMotion = useReducedMotion();

    const isOrganizer = !!event && !!user && user.uid === event.organizerId;

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            try {
                const data = await eventService.getEventById(id);
                setEvent(data);

                if (user && data) {
                    if (user.uid !== data.organizerId) {
                        const applied = await applicationService.hasApplied(id, user.uid);
                        setIsApplied(applied);
                    }
                }
            } catch (error) {
                console.error("Failed to load event", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, user]);

    // Load applications when current user IS the organizer of this event
    useEffect(() => {
        if (!isOrganizer || !event) return;
        let cancelled = false;
        setLoadingApps(true);
        applicationService.getApplicationsForEvent(event.id)
            .then(apps => { if (!cancelled) setApplications(apps); })
            .catch(err => console.error("Error loading applications:", err))
            .finally(() => { if (!cancelled) setLoadingApps(false); });
        return () => { cancelled = true; };
    }, [isOrganizer, event]);

    // El perfil público del organizador (foto, ciudad y a qué se dedica). Si no hay, se tira del bolo
    const organizerId = event?.organizerId;
    useEffect(() => {
        if (!organizerId) return;
        let cancelled = false;
        userService.getPublicProfile(organizerId).then(p => { if (!cancelled) setOrganizer(p); });
        return () => { cancelled = true; };
    }, [organizerId]);

    const handleApply = async () => {
        if (!user) {
            toast.error("Debes iniciar sesión para postularte");
            navigate('/login', { state: { from: `/eventos/${id}` } });
            return;
        }
        if (!event) return;
        if (!event.organizerId) {
            toast.error("Este evento no tiene organizador asignado");
            return;
        }

        setApplying(true);
        try {
            await applicationService.apply(event.id, user.uid, event.organizerId);
            setIsApplied(true);
            toast.success("¡Solicitud enviada con éxito!");
        } catch (error) {
            console.error("Error applying:", error);
            toast.error("Error al enviar solicitud. Inténtalo de nuevo.");
        } finally {
            setApplying(false);
        }
    };

    const handleContactApplicant = async (applicantId: string) => {
        if (!user) return;
        try {
            const chatId = await chatService.createChat(user.uid, applicantId);
            navigate('/messages', { state: { selectedChatId: chatId } });
        } catch (err) {
            console.error(err);
            toast.error("Error al iniciar chat");
        }
    };

    const handleContactOrganizer = async () => {
        if (!user) {
            toast.error("Debes iniciar sesión");
            navigate('/login', { state: { from: `/eventos/${id}` } });
            return;
        }
        if (!event?.organizerId) {
            toast.error("No se puede contactar al organizador (ID desconocido)");
            return;
        }
        try {
            toast.info("Iniciando chat...");
            const chatId = await chatService.createChat(user.uid, event.organizerId);
            navigate('/messages', { state: { selectedChatId: chatId } });
        } catch (err) {
            console.error(err);
            toast.error("Error al iniciar chat");
        }
    };

    const handleUpdateStatus = async (appId: string, status: 'accepted' | 'rejected') => {
        try {
            await applicationService.updateStatus(appId, status);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
            toast.success(status === 'accepted' ? "Aplicante aceptado" : "Aplicante rechazado");
        } catch (err) {
            console.error(err);
            toast.error("No se pudo actualizar el estado");
        }
    };

    // Si se entró por un enlace (sin historial), «volver» lleva a los bolos y no fuera de la app
    const handleBack = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1); else navigate('/eventos');
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title: event?.title, url });
            else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
        } catch { /* cancelado */ }
    };

    const verPostulaciones = () =>
        document.getElementById('postulaciones')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto md:px-6 md:pt-6" aria-busy="true" aria-label="Cargando el bolo">
                <div className="aspect-[16/10] md:aspect-auto md:h-[400px] rounded-b-[28px] md:rounded-[28px] bg-fill animate-pulse" />
                <div className="px-4 md:px-0 mt-5 space-y-3 md:max-w-[620px]">
                    <div className="h-7 w-4/5 rounded-lg bg-fill animate-pulse" />
                    <div className="h-[72px] rounded-[18px] bg-fill animate-pulse" />
                    <div className="grid grid-cols-3 gap-2.5">
                        {[0, 1, 2].map(i => <div key={i} className="h-[128px] rounded-[18px] bg-fill animate-pulse" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-md mx-auto px-6 py-16 text-center">
                <img src={OBJETO_3D.guitarra} alt="" loading="lazy" className={cn('mx-auto h-28 w-28', SOMBRA_3D)} />
                <h1 className="mt-4 text-[22px] font-bold text-foreground">Este bolo ya no está</h1>
                <p className="mt-1.5 text-[15px] text-muted-foreground">Puede que lo hayan borrado o que el enlace esté mal.</p>
                <button
                    type="button"
                    onClick={() => navigate('/eventos')}
                    className="pulsable mt-6 h-[52px] px-6 rounded-[14px] bg-primary text-primary-foreground text-[17px] font-semibold"
                >
                    Ver los bolos
                </button>
            </div>
        );
    }

    // ── Lo que el bolo sabe, en frases cortas ──
    const objeto = objeto3dDeBolo(event);
    const photo = !photoBroken && event.imageUrl ? event.imageUrl : '';
    const budget = Number(event.price) || 0;
    const priceText = budget > 0 ? euros(budget) : 'A convenir';

    const fecha = new Date(event.date);
    const fechaValida = !isNaN(fecha.getTime());
    const quitaPuntos = (s: string) => s.replace(/\./g, '');
    const dia = fechaValida
        ? quitaPuntos(`${fecha.toLocaleDateString('es-ES', { weekday: 'short' })} ${fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`)
        : 'Por fijar';
    const hora = fechaValida ? fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Fecha';
    const otroAno = fechaValida && fecha.getFullYear() !== new Date().getFullYear();

    const conSonido = SONIDO.test(norm([...(event.tags || []), event.description || ''].join(' ')));
    const [lugar, ...zona] = (event.location || '').split(',').map(s => s.trim()).filter(Boolean);
    const tipo = TIPO[norm(event.type || '')];

    const tiles = [
        { key: 'fecha', objeto: OBJETO_3D.calendario, arriba: dia, abajo: otroAno ? `${fecha.getFullYear()} · ${hora}` : hora },
        { key: 'dinero', objeto: OBJETO_3D.moneda, arriba: priceText, abajo: 'Presupuesto' },
        conSonido
            ? { key: 'sonido', objeto: OBJETO_3D.altavoz, arriba: 'Sonido', abajo: 'Incluido' }
            : { key: 'lugar', objeto: OBJETO_3D.escenario, arriba: lugar || 'Por confirmar', abajo: zona.join(', ') || 'Lugar' },
    ];

    // Bajo el título: el tipo si aporta, y el lugar cuando no está en las teselas
    const showPlace = conSonido && !!event.location;

    const organizerName = event.organizerName || organizer?.displayName || 'Organizador';
    const organizerLine = organizer
        ? [MODO[organizer.primaryMode], organizer.location?.split(',')[0]?.trim()].filter(Boolean).join(' · ') || 'Organiza este bolo'
        : 'Organiza este bolo';
    const avatar = !avatarBroken && organizer?.photoURL ? organizer.photoURL : '';

    const actionButton = (className: string) => {
        const base = 'h-[52px] rounded-[14px] px-5 text-[17px] font-semibold flex items-center justify-center gap-2';
        if (isOrganizer) {
            return (
                <button type="button" onClick={verPostulaciones} className={cn('pulsable bg-primary text-primary-foreground', base, className)}>
                    Ver postulaciones
                    {applications.length > 0 && (
                        <span className="h-6 min-w-6 px-1.5 rounded-full bg-foreground text-background text-[13px] font-bold flex items-center justify-center">
                            {applications.length}
                        </span>
                    )}
                </button>
            );
        }
        if (isApplied) {
            return (
                <button type="button" disabled className={cn('bg-fill text-foreground', base, className)}>
                    <Check className="h-5 w-5" /> Solicitud enviada
                </button>
            );
        }
        return (
            <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                aria-busy={applying}
                className={cn('pulsable bg-primary text-primary-foreground disabled:opacity-80', base, className)}
            >
                {applying ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Enviando" /> : 'Postularme'}
            </button>
        );
    };

    const organizerContent = (
        <>
            <span className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-fill-strong flex items-center justify-center text-[18px] font-bold text-foreground">
                {avatar
                    ? <img src={avatar} alt="" loading="lazy" onError={() => setAvatarBroken(true)} className="h-full w-full object-cover" />
                    : organizerName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold leading-tight text-foreground truncate">{organizerName}</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground truncate">{organizerLine}</span>
            </span>
        </>
    );
    const organizerCard = 'mt-4 flex items-center gap-3 rounded-[18px] bg-card border border-hairline shadow-e1 p-3';

    return (
        <div className="max-w-5xl mx-auto md:px-6 md:pt-6 pb-16 md:pb-10">
            {/* Foto del bolo; sin foto, su objeto 3D en grande */}
            <div className="relative">
                <div className="relative aspect-[16/10] md:aspect-auto md:h-[400px] overflow-hidden rounded-b-[28px] md:rounded-[28px] bg-fill">
                    {photo ? (
                        <img src={photo} alt={event.title} onError={() => setPhotoBroken(true)} className="h-full w-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img src={objeto} alt="" loading="lazy" className={cn('h-[70%] w-[70%]', SOMBRA_3D)} />
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleBack}
                    aria-label="Volver"
                    className="pulsable absolute top-3 left-4 h-10 w-10 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center"
                >
                    <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
                </button>
                <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Compartir el bolo"
                    className="pulsable absolute top-3 right-4 h-10 w-10 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center"
                >
                    <Share className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </button>

                {/* El objeto del bolo asoma por la esquina de la foto */}
                {photo && (
                    <motion.img
                        src={objeto}
                        alt=""
                        loading="lazy"
                        initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
                        className={cn('pointer-events-none absolute -bottom-8 right-4 md:right-8 h-[92px] w-[92px] md:h-[120px] md:w-[120px] md:-bottom-10', SOMBRA_3D)}
                    />
                )}
            </div>

            <div className="px-4 md:px-0 md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-10">
                <div className="min-w-0">
                    {/* Título (la primera línea deja sitio al objeto que asoma) */}
                    <div className="mt-4 md:mt-6 flow-root">
                        {photo && <span aria-hidden className="md:hidden float-right w-[96px] h-5" />}
                        <h1 className="text-[25px] md:text-[28px] font-bold leading-[1.15] tracking-tight text-foreground break-words">
                            {event.title}
                        </h1>
                        {(tipo || showPlace) && (
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[15px] text-muted-foreground">
                                {tipo && <span>{tipo}</span>}
                                {tipo && showPlace && <span aria-hidden>·</span>}
                                {showPlace && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-4 w-4 shrink-0" /> {event.location}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>

                    {/* Quién lo organiza */}
                    {event.organizerId ? (
                        <Link to={`/profile/${event.organizerId}`} className={cn('pulsable', organizerCard)}>
                            {organizerContent}
                            <span className="shrink-0 flex items-center text-[14px] text-muted-foreground">
                                Ver perfil <ChevronRight className="h-4 w-4 -mr-0.5" />
                            </span>
                        </Link>
                    ) : (
                        <div className={organizerCard}>{organizerContent}</div>
                    )}

                    {/* Tres datos, un objeto cada uno */}
                    <div className="mt-3 grid grid-cols-3 gap-2.5">
                        {tiles.map((t, i) => (
                            <div key={t.key} className="rounded-[18px] bg-card border border-hairline shadow-e1 px-2 pt-3.5 pb-3 text-center flex flex-col items-center">
                                <motion.img
                                    src={t.objeto}
                                    alt=""
                                    loading="lazy"
                                    initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.05 + i * 0.06 }}
                                    className={cn('h-[60px] w-[60px] md:h-[72px] md:w-[72px]', SOMBRA_3D)}
                                />
                                <p className="mt-2 w-full text-[15px] md:text-[16px] font-bold leading-tight text-foreground line-clamp-2 break-words">{t.arriba}</p>
                                <p className="mt-0.5 w-full text-[13px] text-muted-foreground truncate">{t.abajo}</p>
                            </div>
                        ))}
                    </div>

                    {/* Qué buscan */}
                    <section className="mt-6">
                        <h2 className="text-[19px] font-bold text-foreground">Qué buscan</h2>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                            {event.description || 'No han añadido más detalles. Escríbeles para saber qué necesitan.'}
                        </p>
                        {!!event.tags?.length && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {event.tags.map(tag => (
                                    <span key={tag} className="h-8 px-3.5 rounded-full bg-fill text-[14px] font-medium text-foreground flex items-center">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Dudas: escribir al organizador o reportar el bolo */}
                    {!isOrganizer && (
                        <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleContactOrganizer}
                                className="pulsable h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold flex items-center gap-1.5 min-w-0"
                            >
                                <MessageCircle className="h-4 w-4 shrink-0" />
                                <span className="truncate">Escribir al organizador</span>
                            </button>
                            <ReportButton targetType="event" targetId={event.id} variant="text" />
                        </div>
                    )}

                    {/* Postulaciones — solo las ve quien publicó el bolo */}
                    {isOrganizer && (
                        <Postulaciones
                            applications={applications}
                            loading={loadingApps}
                            onContact={handleContactApplicant}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    )}
                </div>

                {/* PC: el presupuesto y la acción, a mano mientras se lee */}
                <aside className="hidden md:block pt-14">
                    <div className="sticky top-20 rounded-[22px] bg-card border border-hairline shadow-e1 p-5">
                        <p className="text-[13px] text-muted-foreground">Presupuesto</p>
                        <p className="text-[28px] font-bold leading-tight text-foreground">{priceText}</p>
                        <p className="mt-1 text-[14px] text-muted-foreground">
                            {fechaValida ? `${dia}${otroAno ? ` ${fecha.getFullYear()}` : ''} · ${hora}` : 'Fecha por fijar'}
                        </p>
                        {actionButton('mt-4 w-full')}
                        {!isOrganizer && !isApplied && (
                            <p className="mt-3 text-[13px] leading-snug text-muted-foreground text-center">
                                Al postularte, el organizador ve tu perfil y puede escribirte por Musikeeo.
                            </p>
                        )}
                    </div>
                </aside>
            </div>

            {/* Móvil: barra fija con el presupuesto y la acción, encima de la barra de navegación */}
            {createPortal(
                <motion.div
                    initial={reduceMotion ? false : { y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="md:hidden fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-[45] px-3 pb-2"
                >
                    <div className="flex items-center gap-3 rounded-[22px] bg-sheet border border-hairline shadow-e2 pl-5 pr-2 py-2">
                        <p className={cn('min-w-0 shrink font-bold leading-none text-foreground truncate', budget > 0 ? 'text-[24px]' : 'text-[17px]')}>
                            {priceText}
                        </p>
                        {actionButton('ml-auto flex-1 max-w-[230px]')}
                    </div>
                </motion.div>,
                document.body,
            )}
        </div>
    );
}
