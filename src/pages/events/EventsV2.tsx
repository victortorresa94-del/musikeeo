import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, SlidersHorizontal, Calendar, MapPin,
    ArrowRight, Music, Zap, Users, Star, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventService } from '../../services/eventService';
import type { Event } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

// ─── Mock data for when Firestore is empty ────────────────────────────────────
const MOCK_EVENTS: Event[] = [
    {
        id: 'mock_1',
        title: 'Guitarrista eléctrico para gira de verano',
        description: 'Banda de rock busca guitarrista solista para gira de 15 fechas por España.',
        type: 'gig',
        location: 'Madrid, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        price: 800,
        organizerId: 'org_1',
        organizerName: 'Banda Los Sónicos',
        imageUrl: '/images/market/concert_venue_1768143610025.png',
        tags: ['Urgente'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_2',
        title: 'Técnico FOH para festival de jazz',
        description: 'Buscamos técnico de sonido con experiencia en mezcla en vivo para festival.',
        type: 'session',
        location: 'Barcelona, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
        price: 1200,
        organizerId: 'org_2',
        organizerName: 'JazzFest BCN',
        imageUrl: '/images/market/sound_engineer_1768143670792.png',
        tags: ['Premium'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_3',
        title: 'DJ para boda en finca privada',
        description: 'Matrimonio busca DJ profesional para celebración con 200 invitados.',
        type: 'gig',
        location: 'Valencia, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
        price: 600,
        organizerId: 'org_3',
        organizerName: 'Eventos Solís',
        imageUrl: '/images/market/rehearsal_space_1768143644276.png',
        tags: ['Nuevo'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_4',
        title: 'Músicos para sesión de grabación',
        description: 'Productor busca batería y bajo para grabar EP de 5 temas en estudio.',
        type: 'session',
        location: 'Sevilla, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
        price: 350,
        organizerId: 'org_4',
        organizerName: 'Estudio Sur Records',
        imageUrl: '/images/market/recording_studio_1768143540955.png',
        tags: [],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_5',
        title: 'Banda telonera — Festival Rock en Río',
        description: 'Festival necesita banda telonera para apertura del escenario principal.',
        type: 'gig',
        location: 'Madrid, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        price: 2500,
        organizerId: 'org_5',
        organizerName: 'Rock en Río ES',
        imageUrl: '/images/market/concert_venue_1768143610025.png',
        tags: ['Premium'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_6',
        title: 'Cantante para residencia mensual en bar',
        description: 'Bar de jazz en el centro busca cantante para actuaciones de jueves a sábado.',
        type: 'gig',
        location: 'Barcelona, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
        price: 400,
        organizerId: 'org_6',
        organizerName: 'Jazz Club Plata',
        imageUrl: '/images/market/microphone_pro_1768143562847.png',
        tags: ['Urgente'],
        createdAt: new Date().toISOString(),
    },
];

const EVENT_TYPES = ['Todos', 'Bolo', 'Sesión', 'Colaboración', 'Festival', 'Boda / Social'];

const TYPE_MAP: Record<string, string> = {
    'Bolo': 'gig',
    'Sesión': 'session',
    'Colaboración': 'collab',
    'Festival': 'festival',
    'Boda / Social': 'social',
};

// ─── Event card ────────────────────────────────────────────────────────────────
const EventCardNew = ({ event, onClick }: { event: Event; onClick: () => void }) => {
    const dateObj = new Date(event.date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' });
    const daysLeft = Math.ceil((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const badgeColor: Record<string, string> = {
        'Urgente': 'bg-red-500 text-white',
        'Premium': 'bg-purple-500 text-white',
        'Nuevo': 'bg-blue-500 text-white',
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25 }}
            onClick={onClick}
            className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
            {/* Photo */}
            <div className="relative h-44 overflow-hidden bg-muted">
                <img
                    src={event.imageUrl || '/images/market/concert_venue_1768143610025.png'}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Date badge */}
                <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center min-w-[44px]">
                    <p className="text-[10px] font-bold text-primary uppercase leading-none">{month}</p>
                    <p className="text-lg font-black text-foreground leading-tight">{day}</p>
                </div>

                {/* Tags */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                    {(event.tags || []).map(tag => (
                        <span key={tag} className={cn('text-[10px] font-bold px-2 py-1 rounded-full', badgeColor[tag] || 'bg-muted text-muted-foreground')}>
                            {tag === 'Urgente' ? '⚡ Urgente' : tag === 'Premium' ? '💎 Premium' : tag}
                        </span>
                    ))}
                </div>

                {/* Price bottom right */}
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl">
                    <span className="text-primary font-black text-sm">
                        {event.price ? `${event.price.toLocaleString()}€` : 'A negociar'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">
                    {event.type === 'gig' ? 'Bolo' : event.type === 'session' ? 'Sesión' : event.type}
                </span>
                <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-3">
                    {event.title}
                </h3>
                <div className="flex flex-col gap-1.5 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                        <span>
                            {daysLeft <= 0 ? 'Hoy' : daysLeft === 1 ? 'Mañana' : `En ${daysLeft} días`}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{event.organizerName}</span>
                    <button className="flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                        Ver más <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </motion.article>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function EventsV2() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeType, setActiveType] = useState('Todos');
    const [cityFilter, setCityFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const allEvents = await eventService.getUpcomingEvents();
                setEvents(allEvents.length > 0 ? allEvents : MOCK_EVENTS);
            } catch {
                setEvents(MOCK_EVENTS);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [user]);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!event.title.toLowerCase().includes(q) &&
                    !event.location.toLowerCase().includes(q) &&
                    !event.organizerName?.toLowerCase().includes(q)) return false;
            }
            if (activeType !== 'Todos') {
                const mapped = TYPE_MAP[activeType];
                if (mapped && event.type !== mapped) return false;
            }
            if (cityFilter) {
                if (!event.location.toLowerCase().includes(cityFilter.toLowerCase())) return false;
            }
            return true;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events, searchQuery, activeType, cityFilter]);

    return (
        <div className="min-h-full bg-background">
            {/* ── Mobile header ── */}
            <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-7 w-7 rounded-lg object-contain" />
                    <span className="font-heading font-bold text-base text-foreground">Eventos</span>
                </div>
                <button
                    onClick={() => navigate('/publicar')}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full"
                >
                    <Plus className="h-3.5 w-3.5" /> Publicar
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">

                {/* ── Page header ── */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-black text-foreground tracking-tight">
                            Tablón de Oportunidades
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {loading ? 'Cargando...' : (
                                <><span className="font-bold text-foreground">{filteredEvents.length}</span> oportunidades abiertas</>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/publicar')}
                        className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl hover:brightness-105 transition-all flex-shrink-0"
                    >
                        <Plus className="h-4 w-4" /> Publicar anuncio
                    </button>
                </div>

                {/* ── Search + filters ── */}
                <div className="mb-6 space-y-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar eventos, ciudades, organizadores..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-muted border border-border rounded-xl h-10 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={cn(
                                'flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium transition-all',
                                showFilters
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline">Filtros</span>
                        </button>
                    </div>

                    {/* City filter (expandable) */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex gap-2 items-center pt-1">
                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Filtrar por ciudad (Madrid, Barcelona…)"
                                        value={cityFilter}
                                        onChange={(e) => setCityFilter(e.target.value)}
                                        className="flex-1 bg-muted border border-border rounded-xl h-9 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                                    />
                                    {cityFilter && (
                                        <button
                                            onClick={() => setCityFilter('')}
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Type chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {EVENT_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className={cn(
                                    'flex-shrink-0 h-8 px-4 rounded-full text-sm font-medium border transition-all',
                                    activeType === type
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-muted border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Stats row ── */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { icon: Zap, label: 'Urgentes', value: events.filter(e => e.tags?.includes('Urgente')).length, color: 'text-red-500 bg-red-500/10' },
                        { icon: Users, label: 'Organizadores', value: new Set(events.map(e => e.organizerId)).size, color: 'text-blue-500 bg-blue-500/10' },
                        { icon: Star, label: 'Premium', value: events.filter(e => e.tags?.includes('Premium')).length, color: 'text-purple-500 bg-purple-500/10' },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-foreground leading-none">{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Events grid ── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-44 bg-muted" />
                                <div className="p-4 space-y-2">
                                    <div className="h-3 bg-muted rounded w-16" />
                                    <div className="h-5 bg-muted rounded w-3/4" />
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredEvents.map(event => (
                            <EventCardNew
                                key={event.id}
                                event={event}
                                onClick={() => navigate(`/events/${event.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-border border-dashed rounded-2xl bg-card">
                        <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-1">Sin resultados</h3>
                        <p className="text-muted-foreground text-sm mb-4">Intenta ajustar los filtros de búsqueda</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveType('Todos'); setCityFilter(''); }}
                            className="text-primary text-sm font-medium hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
