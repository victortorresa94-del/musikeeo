import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sparkles, Filter, Music } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { EventCard } from '../../components/events/EventCard';
import { EventsSidebar } from '../../components/events/EventsSidebar';
import { MobileEventsFilterDrawer } from '../../components/events/MobileEventsFilterDrawer';
import { Navbar } from '../../components/home/Navbar';
// import { MOCK_EVENTS } from '../../services/eventsData';
import { eventService } from '../../services/eventService';
import type { Event } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function EventsV2() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Check if we are in Panel mode (Organizer view)
    const isPanelMode = location.pathname.startsWith('/panel');

    // State
    const [events, setEvents] = useState<Event[]>([]);
    // const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: [] as string[],
        city: '',
        date: ''
    });
    const [sortOption, setSortOption] = useState<string>('Más recientes');

    // Fetch Events
    useEffect(() => {
        const fetchEvents = async () => {
            // setLoading(true);
            try {
                if (isPanelMode && user?.uid) {
                    const myEvents = await eventService.getEventsByOrganizer(user.uid);
                    setEvents(myEvents);
                } else {
                    const allEvents = await eventService.getUpcomingEvents();
                    setEvents(allEvents);
                }
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                // setLoading(false);
            }
        };
        fetchEvents();
    }, [user, isPanelMode]);

    // Filter Logic
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!event.title.toLowerCase().includes(q) &&
                    !event.description?.toLowerCase().includes(q) &&
                    !event.location.toLowerCase().includes(q)) return false;
            }
            if (filters.type.length > 0 && !filters.type.includes(event.type)) return false;

            // Note: Partial match for city is better for real data
            if (filters.city.length > 0 && !event.location.toLowerCase().includes(filters.city.toLowerCase())) return false;

            // Date string precise match might be tricky with ISO strings, keeping simple for now
            if (filters.date && !event.date.startsWith(filters.date)) return false;

            return true;
        });
    }, [searchQuery, filters, events]);

    // Sort Logic
    const sortedEvents = useMemo(() => {
        const sorted = [...filteredEvents];
        switch (sortOption) {
            case 'Presupuesto: Mayor a Menor': return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            case 'Fecha del evento': return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            case 'Más recientes':
            default:
                // Fallback to createdAt or date if no visibility score
                return sorted.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        }
    }, [filteredEvents, sortOption]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex h-screen w-full flex-col bg-background text-white font-sans overflow-hidden">
            {!isPanelMode && <Navbar />}

            <div className="flex flex-1 overflow-hidden pt-20">
                {/* Sidebar Filters */}
                <EventsSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    className="hidden lg:flex"
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 pb-32 relative">

                    {/* Header / Hero Section */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-white/5">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-black font-bold">
                                    <Sparkles size={20} />
                                </div>
                                <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
                                    {isPanelMode ? 'Mis Eventos' : 'Tablón de Oportunidades'}
                                </h1>
                            </div>
                            <p className="text-gray-400 text-lg">
                                {isPanelMode
                                    ? 'Gestiona tus eventos publicados y revisa candidaturas.'
                                    : <>Encuentra tu próximo escenario. <span className="text-white font-bold">{sortedEvents.length}</span> oportunidades abiertas.</>
                                }
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* In-page Search */}
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    className="w-full rounded-lg border border-white/10 bg-surface py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none"
                                    placeholder="Buscar eventos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Sort */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                                <select
                                    className="rounded-lg border-white/10 bg-surface py-2 pl-3 pr-10 text-sm font-medium text-white focus:border-brand-yellow outline-none cursor-pointer"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                >
                                    <option>Más recientes</option>
                                    <option>Presupuesto: Mayor a Menor</option>
                                    <option>Fecha del evento</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {sortedEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {sortedEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-surface/30 rounded-2xl border border-white/5 border-dashed">
                            <Music className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                            <h3 className="text-lg font-bold text-white">No se encontraron eventos</h3>
                            <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda.</p>
                        </div>
                    )}
                </main>

                {/* Mobile Filter Button */}
                <div className="lg:hidden fixed bottom-6 right-6 z-40 flex flex-col gap-4 items-end">
                    <Button
                        onClick={() => navigate('/publicar')}
                        className="rounded-full h-14 w-14 p-0 bg-white text-black hover:bg-gray-200 shadow-lg flex items-center justify-center"
                    >
                        <span className="text-2xl font-light mb-1">+</span>
                    </Button>
                    <Button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="flex items-center gap-2 bg-brand-yellow text-brand-black font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform h-14"
                    >
                        <Filter size={20} />
                        Filtros
                    </Button>
                </div>

                {/* Mobile Events Filter Drawer */}
                <MobileEventsFilterDrawer
                    isOpen={isMobileFiltersOpen}
                    onClose={() => setIsMobileFiltersOpen(false)}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            </div>
        </div>
    );
}
