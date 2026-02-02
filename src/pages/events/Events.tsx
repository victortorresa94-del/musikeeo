import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { EventSidebar } from '../../components/events/EventSidebar';
import { EventCard } from '../../components/events/EventCard';
import { MOCK_EVENTS } from '../../services/eventsData';
// import { MobileFilterDrawer } from '../../components/discover/MobileFilterDrawer'; // Might need to adapt this or create simple localized one

export default function Events() {
    const navigate = useNavigate();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({
        type: [] as string[],
        city: '',
        date: ''
    });
    const [sortOption, setSortOption] = useState<string>('Más recientes');

    // Filter Logic
    const filteredEvents = useMemo(() => {
        return MOCK_EVENTS.filter(event => {
            // Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!event.title.toLowerCase().includes(q) &&
                    !event.description.toLowerCase().includes(q) &&
                    !event.location.toLowerCase().includes(q)) return false;
            }
            // Type Filter
            if (filters.type.length > 0 && !filters.type.includes(event.type)) {
                return false;
            }
            // City Filter
            if (filters.city && !event.city.toLowerCase().includes(filters.city.toLowerCase())) {
                return false;
            }
            // Date Filter
            if (filters.date && event.date !== filters.date) {
                return false;
            }
            return true;
        });
    }, [searchQuery, filters]);

    // Sort Logic
    const sortedEvents = useMemo(() => {
        const sorted = [...filteredEvents];
        switch (sortOption) {
            case 'Presupuesto: Mayor a Menor':
                return sorted.sort((a, b) => b.budget - a.budget);
            case 'Fecha del evento':
                return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            case 'Más recientes':
            default:
                return sorted.sort((a, b) => b.visibilityScore - a.visibilityScore);
        }
    }, [filteredEvents, sortOption]);

    return (
        <div className="flex flex-col h-full space-y-6 px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full">

            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
                        Tablón de Eventos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Explora convocatorias, gigs y oportunidades verificadas.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile Filter Toggle */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="lg:hidden border-white/10 text-gray-400"
                        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)} // Simple toggle for now, ideally drawer
                    >
                        <Filter className="h-5 w-5" />
                    </Button>

                    <Button
                        onClick={() => navigate('/eventos/crear')}
                        className="bg-brand-yellow text-brand-black hover:bg-brand-warm font-bold shadow-lg shadow-brand-yellow/10"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Publicar Anuncio
                    </Button>
                </div>
            </div>

            {/* 2. Filters & Search Bar Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card/50 p-4 rounded-xl border border-white/5">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-brand-yellow/50 focus:outline-none placeholder:text-gray-600"
                        placeholder="Buscar por título, ubicación..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="ml-auto flex items-center gap-3 w-full md:w-auto">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Ordenar por:</span>
                    <select
                        className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer hover:text-brand-yellow"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                    >
                        <option className="bg-brand-black">Más recientes</option>
                        <option className="bg-brand-black">Presupuesto: Mayor a Menor</option>
                        <option className="bg-brand-black">Fecha del evento</option>
                    </select>
                </div>
            </div>

            {/* 3. Main Content: Sidebar + Grid */}
            <div className="flex gap-8 items-start h-full overflow-hidden">

                {/* Desktop Sidebar */}
                <aside className={`hidden lg:block w-72 shrink-0 space-y-6 sticky top-0 ${isMobileFiltersOpen ? '!block fixed inset-0 z-50 bg-background p-6 lg:static lg:bg-transparent lg:p-0' : ''}`}>
                    <EventSidebar onFilterChange={setFilters} />
                    {/* Mobile Close Button would go here if using this simple toggle hack */}
                </aside>

                {/* Grid */}
                <div className="flex-1 w-full">
                    {sortedEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                            {sortedEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-50 border-2 border-dashed border-white/10 rounded-2xl">
                            <Search className="h-12 w-12 text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-white">Sin resultados</h3>
                            <p className="text-gray-400">Intenta ajustar tus filtros.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
