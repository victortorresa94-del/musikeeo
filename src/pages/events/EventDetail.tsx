import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock, Music, Users, Send } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { type Event } from '../../types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isApplied, setIsApplied] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            try {
                const data = await eventService.getEventById(id);
                setEvent(data);
            } catch (error) {
                console.error("Failed to load event", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleApply = () => {
        setIsApplied(true);
        // Here we would call eventService.applyToEvent(eventId, userId)
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
                            <Button
                                className={`h-12 px-6 font-bold ${isApplied ? 'bg-zinc-700 text-white' : 'bg-brand-cyan text-black hover:bg-brand-cyan/90'}`}
                                onClick={handleApply}
                                disabled={isApplied}
                            >
                                {isApplied ? "Solicitud Enviada" : "Postularme"}
                                {!isApplied && <Send className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-heading font-bold text-white mb-4">Detalles</h3>
                        <p className="text-gray-300 leading-relaxed">
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
                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-xs" onClick={() => navigate('/messages')}>
                            Enviar Mensaje
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
