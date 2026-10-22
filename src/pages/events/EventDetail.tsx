import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Calendar, Check, Clock, Loader2, MapPin, MessageCircle, Share, type LucideIcon } from 'lucide-react';
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
import { TarjetasResumen, SeccionesBolo } from '../../components/detalle-bolo/FichaBolo';
import { fichaDe } from '../../components/detalle-bolo/ficha';
import { TarjetaBolo } from '../../components/bolos/TarjetaBolo';
import { diaSemana, fechaDe, horaDe, mesCorto, precioBolo } from '../../components/bolos/tablon';

const MODO: Record<UserMode, string> = {
    musician: 'Músico o banda',
    organizer: 'Organiza bolos',
    provider: 'Técnico de sonido',
};

const SOMBRA_3D = 'object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]';

/** «octubre de 2026» (y «oct 2026», para el móvil) a partir de `publicProfiles.createdAt`
 *  (ISO; o un Timestamp de Firestore) */
function mesDeAlta(v: unknown): { largo: string; corto: string } | null {
    const toDate = (v as { toDate?: () => Date } | null)?.toDate;
    const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : typeof toDate === 'function' ? toDate.call(v) : null;
    if (!d || isNaN(d.getTime())) return null;
    return {
        largo: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        corto: `${mesCorto(d)} ${d.getFullYear()}`,
    };
}

/** Pastilla gris bajo el título: fecha, sitio, plazo */
function Pastilla({ icono: Icono, children, apagada }: { icono: LucideIcon; children: string; apagada?: boolean }) {
    return (
        <span className={cn('h-8 max-w-full px-3 rounded-full bg-fill text-[14px] font-medium inline-flex items-center gap-1.5', apagada ? 'text-muted-foreground' : 'text-foreground')}>
            <Icono className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{children}</span>
        </span>
    );
}

// Cada bolo, su página: al pasar de un bolo a otro («Más bolos de…») se empieza de cero y arriba
export default function EventDetail() {
    const { id } = useParams();
    useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);
    return <DetalleBolo key={id} />;
}

function DetalleBolo() {
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

    // Del organizador: su perfil público (foto, nombre, desde cuándo está), cuántos bolos ha publicado
    // y sus otros bolos. Cada cosa por su lado: si una falla, solo esa no sale
    const organizerId = event?.organizerId;
    const [bolosPublicados, setBolosPublicados] = useState<number | null>(null);
    const [bolosOrganizador, setBolosOrganizador] = useState<Event[]>([]);
    useEffect(() => {
        if (!organizerId) return;
        let cancelled = false;
        userService.getPublicProfile(organizerId).then(p => { if (!cancelled) setOrganizer(p); });
        eventService.contarBolosDe(organizerId)
            .then(n => { if (!cancelled) setBolosPublicados(n); })
            .catch(err => console.warn('No se pudieron contar los bolos del organizador:', err));
        eventService.getEventsByOrganizer(organizerId).then(list => { if (!cancelled) setBolosOrganizador(list); });
        return () => { cancelled = true; };
    }, [organizerId]);

    const handleApply = async () => {
        if (!user) {
            toast.error("Debes iniciar sesión para postularte");
            navigate('/login', { state: { from: `/eventos/${id}` } });
            return;
        }
        if (!event) return;
        if (fichaDe(event).plazo?.cerrado) {
            toast.error("El plazo para postularse ya ha cerrado");
            return;
        }
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
            <div className="max-w-5xl mx-auto px-4 md:px-6 pt-2 md:pt-6" aria-busy="true" aria-label="Cargando el bolo">
                <div className="aspect-[16/10] md:aspect-auto md:h-[400px] rounded-[24px] md:rounded-[28px] bg-fill animate-pulse" />
                <div className="mt-5 space-y-3 md:max-w-[620px]">
                    <div className="h-7 w-4/5 rounded-lg bg-fill animate-pulse" />
                    <div className="flex gap-2">
                        {['w-[140px]', 'w-[110px]', 'w-[120px]'].map(w => <div key={w} className={cn('h-8 rounded-full bg-fill animate-pulse', w)} />)}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        {[0, 1, 2, 3].map(i => <div key={i} className="h-[104px] rounded-[18px] bg-fill animate-pulse" />)}
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
    const ficha = fichaDe(event, objeto);
    const photo = !photoBroken && event.imageUrl ? event.imageUrl : '';
    const budget = Number(event.price) || 0;
    const priceText = precioBolo(budget);
    const plazoCerrado = !!ficha.plazo?.cerrado;

    // «sáb 31 oct · 21:00» (con el año si no es este)
    const f = fechaDe(event.date);
    const hora = horaDe(f);
    const dia = f
        ? `${diaSemana(f.d)} ${f.d.getDate()} ${mesCorto(f.d)}${f.d.getFullYear() !== new Date().getFullYear() ? ` ${f.d.getFullYear()}` : ''}`
        : '';
    const cuando = dia ? [dia, hora].filter(Boolean).join(' · ') : 'Fecha por fijar';

    // El organizador, con lo que se sabe de verdad: cuántos bolos ha publicado y desde cuándo está
    const organizerName = event.organizerName || organizer?.displayName || 'Organizador';
    const desde = mesDeAlta(organizer?.createdAt);
    const publicados = bolosPublicados ? `Ha publicado ${bolosPublicados} ${bolosPublicados === 1 ? 'bolo' : 'bolos'}` : '';
    // Sin esos dos datos, lo de antes: a qué se dedica y de dónde es
    const organizerLine = (organizer ? [MODO[organizer.primaryMode], organizer.location?.split(',')[0]?.trim()].filter(Boolean).join(' · ') : '') || 'Organiza este bolo';
    const avatar = !avatarBroken && organizer?.photoURL ? organizer.photoURL : '';

    // Sus otros bolos que aún no han pasado, el más cercano primero
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const masBolos = bolosOrganizador
        .filter(b => b.id !== event.id)
        .map(b => ({ b, f: fechaDe(b.date) }))
        .filter((x): x is { b: Event; f: NonNullable<typeof x.f> } => !!x.f && x.f.d >= hoy)
        .sort((a, b) => a.f.d.getTime() - b.f.d.getTime())
        .slice(0, 3)
        .map(x => x.b);

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
        if (plazoCerrado) {
            return (
                <button type="button" disabled className={cn('bg-fill text-muted-foreground', base, className)}>
                    Plazo cerrado
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
                {/* En el móvil, un dato por línea (y el mes corto) para que quepa al lado de «Escribir» */}
                <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">
                    {publicados || desde ? (
                        <>
                            {publicados && <span className="block md:inline">{publicados}</span>}
                            {publicados && desde && <span aria-hidden className="hidden md:inline"> · </span>}
                            {desde && (
                                <span className="block md:inline">
                                    En Musikeeo desde <span className="md:hidden">{desde.corto}</span><span className="hidden md:inline">{desde.largo}</span>
                                </span>
                            )}
                        </>
                    ) : organizerLine}
                </span>
            </span>
        </>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-16 md:pb-10">
            {/* Foto del bolo; sin foto, su objeto 3D en grande */}
            <div className="relative">
                <div className="relative aspect-[16/10] md:aspect-auto md:h-[400px] overflow-hidden rounded-[24px] md:rounded-[28px] bg-fill">
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
                    className="pulsable absolute top-3 left-3 h-10 w-10 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center"
                >
                    <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
                </button>
                <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Compartir el bolo"
                    className="pulsable absolute top-3 right-3 h-10 w-10 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center"
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
                        className={cn('pointer-events-none absolute -bottom-8 right-2 md:right-8 h-[92px] w-[92px] md:h-[120px] md:w-[120px] md:-bottom-10', SOMBRA_3D)}
                    />
                )}
            </div>

            <div className="md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-10">
                <div className="min-w-0">
                    {/* Título (la primera línea deja sitio al objeto que asoma) */}
                    <div className="mt-4 md:mt-6 flow-root">
                        {photo && <span aria-hidden className="md:hidden float-right w-[88px] h-5" />}
                        <h1 className="text-[25px] md:text-[28px] font-bold leading-[1.15] tracking-tight text-foreground break-words">
                            {event.title}
                        </h1>
                    </div>

                    {/* Cuándo, dónde y hasta cuándo se puede uno postular */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Pastilla icono={Calendar}>{cuando}</Pastilla>
                        {event.location && <Pastilla icono={MapPin}>{event.location}</Pastilla>}
                        {ficha.plazo && <Pastilla icono={Clock} apagada={ficha.plazo.cerrado}>{ficha.plazo.texto}</Pastilla>}
                        {ficha.urgente && (
                            <span className="h-8 px-3 rounded-full bg-destructive/10 text-destructive text-[14px] font-semibold inline-flex items-center">Urgente</span>
                        )}
                    </div>

                    {/* Lo importante de un vistazo, un objeto por tarjeta */}
                    <TarjetasResumen tarjetas={ficha.tarjetas} />

                    {/* Quién lo organiza */}
                    <div className="mt-3 flex items-center gap-2 rounded-[18px] bg-card border border-hairline shadow-e1 p-3">
                        {event.organizerId ? (
                            <Link to={`/profile/${event.organizerId}`} aria-label={`Ver el perfil de ${organizerName}`} className="pulsable min-w-0 flex-1 flex items-center gap-3 rounded-[12px]">
                                {organizerContent}
                            </Link>
                        ) : (
                            <div className="min-w-0 flex-1 flex items-center gap-3">{organizerContent}</div>
                        )}
                        {!isOrganizer && (
                            <button
                                type="button"
                                onClick={handleContactOrganizer}
                                className="pulsable shrink-0 h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold"
                            >
                                Escribir
                            </button>
                        )}
                    </div>

                    {/* Postulaciones — solo las ve quien publicó el bolo */}
                    {isOrganizer && (
                        <Postulaciones
                            applications={applications}
                            loading={loadingApps}
                            onContact={handleContactApplicant}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    )}

                    {/* Todo lo demás, por secciones */}
                    <SeccionesBolo secciones={ficha.secciones} sitio={ficha.sitio} />

                    {/* Dudas: escribir al organizador o reportar el bolo */}
                    {!isOrganizer && (
                        <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
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
                </div>

                {/* PC: el presupuesto y la acción, a mano mientras se lee */}
                <aside className="hidden md:block pt-14">
                    <div className="sticky top-20 rounded-[22px] bg-card border border-hairline shadow-e1 p-5">
                        <p className="text-[13px] text-muted-foreground">Presupuesto</p>
                        <p className="text-[28px] font-bold leading-tight text-foreground">{priceText}</p>
                        <p className="mt-1 text-[14px] text-muted-foreground">{cuando}</p>
                        {ficha.plazo && !plazoCerrado && <p className="text-[14px] text-muted-foreground">{ficha.plazo.texto}</p>}
                        {actionButton('mt-4 w-full')}
                        {!isOrganizer && !isApplied && !plazoCerrado && (
                            <p className="mt-3 text-[13px] leading-snug text-muted-foreground text-center">
                                Al postularte, el organizador ve tu perfil y puede escribirte por Musikeeo.
                            </p>
                        )}
                    </div>
                </aside>
            </div>

            {/* Más bolos de quien organiza este */}
            {masBolos.length > 0 && (
                <section className="mt-8 md:mt-12">
                    <h2 className="text-[19px] font-bold text-foreground">Más bolos de {organizerName}</h2>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {masBolos.map(b => <TarjetaBolo key={b.id} e={b} />)}
                    </div>
                </section>
            )}

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
