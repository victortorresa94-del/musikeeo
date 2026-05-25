import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock, Music, Send, Users, Check, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { eventService } from '../../services/eventService';
import { chatService } from '../../services/chatService';
import { type Event } from '../../types';
import { Loader2 } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { applicationService, type ApplicationWithApplicant } from '../../services/applicationService';

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

    const handleApply = async () => {
        if (!user) {
            toast.error("Debes iniciar sesión para postularte");
            navigate('/login');
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

    if (loading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-20 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-white mb-4">Evento no encontrado</h2>
                <Button onClick={() => navigate('/events')}>Volver a Eventos</Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Volver
            </Button>

            {/* Hero Section */}
            <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                <img
                    src={event.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1000&q=80"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />

                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                        <div>
                            <span className="bg-brand-lime text-black text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                                {event.type}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white leading-tight mb-2">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                    <Calendar className="h-4 w-4 text-brand-cyan" />
                                    {new Date(event.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                    <Clock className="h-4 w-4 text-brand-cyan" />
                                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                    <MapPin className="h-4 w-4 text-brand-cyan" />
                                    {event.location}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {event.price ? (
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Presupuesto</p>
                                    <p className="text-2xl font-bold text-white">{event.price}€</p>
                                </div>
                            ) : null}
                            {!isOrganizer && (
                                <Button
                                    className={`h-12 px-6 font-bold ${isApplied ? 'bg-zinc-700 text-white' : 'bg-brand-cyan text-black hover:bg-brand-cyan/90'}`}
                                    onClick={handleApply}
                                    disabled={isApplied || applying}
                                >
                                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                        isApplied ? "Solicitud Enviada" : "Postularme"}
                                    {!isApplied && !applying && <Send className="w-4 h-4 ml-2" />}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-heading font-bold text-white mb-4">Detalles</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {event.description || "Sin descripción detallada. Contacta al organizador para más información."}
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-heading font-bold text-white mb-4 flex items-center gap-2">
                            <Music className="h-5 w-5 text-brand-lime" /> Requisitos
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {event.tags?.map(tag => (
                                <span key={tag} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full border border-white/10">
                                    {tag}
                                </span>
                            )) || <span className="text-muted-foreground">No especificado</span>}
                        </div>
                    </div>

                    {/* Applicants section — only visible to organizer */}
                    {isOrganizer && (
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                            <h3 className="font-heading font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="h-5 w-5 text-brand-cyan" />
                                Aplicantes {applications.length > 0 && <span className="text-muted-foreground text-sm">({applications.length})</span>}
                            </h3>

                            {loadingApps ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
                                </div>
                            ) : applications.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Aún no hay aplicantes a este evento.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {applications.map(app => (
                                        <li key={app.id} className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                                                    {app.applicant?.photoURL ? (
                                                        <img src={app.applicant.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-white text-sm uppercase">
                                                            {(app.applicant?.displayName || '?').substring(0, 2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white text-sm truncate">
                                                        {app.applicant?.displayName || 'Usuario desconocido'}
                                                    </p>
                                                    {app.applicant?.primaryMode && (
                                                        <p className="text-xs text-muted-foreground capitalize">{app.applicant.primaryMode}</p>
                                                    )}
                                                    {app.message && (
                                                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">{app.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {app.status === 'pending' ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-white/10 hover:bg-white/5 text-xs gap-1"
                                                            onClick={() => app.applicantId && handleContactApplicant(app.applicantId)}
                                                        >
                                                            <MessageSquare size={12} /> Chat
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-brand-lime text-black hover:bg-brand-lime/90 text-xs gap-1"
                                                            onClick={() => app.id && handleUpdateStatus(app.id, 'accepted')}
                                                        >
                                                            <Check size={12} /> Aceptar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs gap-1"
                                                            onClick={() => app.id && handleUpdateStatus(app.id, 'rejected')}
                                                        >
                                                            <X size={12} /> Rechazar
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                        app.status === 'accepted'
                                                            ? 'bg-brand-lime/20 text-brand-lime'
                                                            : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {app.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-heading font-bold text-white mb-4">Organizador</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                                <span className="font-bold text-white">{event.organizerName.substring(0, 2)}</span>
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{event.organizerName}</p>
                                <p className="text-xs text-muted-foreground">Promotor Verificado</p>
                            </div>
                        </div>
                        {!isOrganizer && (
                            <Button
                                variant="outline"
                                className="w-full border-white/10 hover:bg-white/5 text-xs"
                                onClick={async () => {
                                    if (!user) {
                                        toast.error("Debes iniciar sesión");
                                        navigate('/login');
                                        return;
                                    }
                                    if (!event.organizerId) {
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
                                }}
                            >
                                Enviar Mensaje
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
