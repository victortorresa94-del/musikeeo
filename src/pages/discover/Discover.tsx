import { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Search, Music, Filter, Calendar, MapPin, Star, CheckCircle, Users } from 'lucide-react';
import { Navbar } from '../../components/home/Navbar';
import { DiscoverSidebar } from '../../components/discover/DiscoverSidebar';
import { ProviderSidebar } from '../../components/discover/ProviderSidebar';
import { MobileFilterDrawer } from '../../components/discover/MobileFilterDrawer';
import { getArtists } from '../../services/artistService';
import { getPublicProviders } from '../../services/providerService';

import type { Artist, ProviderProfile } from '../../types';

// Unified type for display in the grid
interface UnifiedArtist {
    id: string;
    slug?: string;
    name: string;
    city: string;
    coverImage: string;
    rating: number;
    verified: boolean;
    type: 'musician' | 'band' | 'artist' | 'technician';
    role: string; // "Banda", "DJ", "Técnico", or first genre
    genres: string[];
    priceFrom?: number;
    availability?: { date: string; status: string }[];
    // Provider specific
    providerType?: 'Empresa' | 'Freelance';
    services?: string[];
    equipment?: string[];
    coverage?: string;
}

export default function Discover() {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isSoundServices = location.pathname === '/sonido';

    // Data from Firestore
    const [firestoreArtists, setFirestoreArtists] = useState<Artist[]>([]);
    const [firestoreProviders, setFirestoreProviders] = useState<ProviderProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // Read URL params for initial filter state
    const urlQuery = searchParams.get('q') || '';
    const urlCity = searchParams.get('city') || '';
    const urlDate = searchParams.get('date') || '';

    const [filters, setFilters] = useState({
        city: urlCity || null as string | null,
        genres: [] as string[],
        format: null as string | null,
        priceRange: [100, 2000] as [number, number],
        dateFrom: urlDate || null as string | null,
        dateTo: null as string | null,
        // Provider specific
        type: null as string | null,
        services: [] as string[],
        equipment: [] as string[],
        coverage: null as string | null,
    });

    const [searchQuery, setSearchQuery] = useState(urlQuery);
    const [sortOption, setSortOption] = useState<string>('Relevancia');

    // Load data from Firestore
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [artists, providers] = await Promise.all([
                getArtists(),
                getPublicProviders()
            ]);
            setFirestoreArtists(artists);
            setFirestoreProviders(providers);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Combine Firestore Data into UnifiedArtist[]
    const allArtists: UnifiedArtist[] = useMemo(() => {
        if (isSoundServices) {
            return firestoreProviders.map(p => ({
                id: p.id,
                name: p.businessName,
                city: 'España', // Placeholder until Provider has city
                coverImage: '',
                rating: 0,
                verified: false,
                type: 'technician',
                role: p.providerType,
                genres: p.services,
                priceFrom: undefined,
                availability: [],
                providerType: p.providerType === 'empresa' ? 'Empresa' : 'Freelance',
                services: p.services,
                equipment: p.equipmentTypes,
                coverage: p.coverageAreas ? p.coverageAreas[0] : ''
            }));
        }

        return firestoreArtists.map(a => {
            const isBand = a.genres.some(g => g.toLowerCase() === 'banda') || a.tags.some(t => t.toLowerCase() === 'banda');

            return {
                id: a.id,
                slug: a.slug,
                name: a.artistName,
                city: a.city,
                coverImage: a.coverPhoto || a.profilePhoto || '',
                rating: a.rating,
                verified: a.isVerified,
                type: isBand ? 'band' : 'musician',
                role: a.genres[0] || 'Artista',
                genres: a.genres,
                priceFrom: a.priceFrom,
                availability: a.availability || [],
                providerType: undefined,
                services: undefined,
                equipment: undefined,
                coverage: undefined
            };
        });
    }, [isSoundServices, firestoreArtists, firestoreProviders]);

    // Filter Logic
    const filteredArtists = useMemo(() => {
        return allArtists.filter(artist => {
            // 1. Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = artist.name.toLowerCase().includes(query);
                const matchesCity = artist.city.toLowerCase().includes(query);
                const matchesGenre = artist.genres.some(g => g.toLowerCase().includes(query));
                const matchesRole = artist.role.toLowerCase().includes(query);

                if (!matchesName && !matchesCity && !matchesGenre && !matchesRole) return false;
            }

            // 2. City Filter
            if (filters.city) {
                if (!artist.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
            }

            // Provider Filters
            if (isSoundServices) {
                if (filters.type && artist.providerType !== filters.type) return false;
                if (filters.services && filters.services.length > 0) {
                    const hasService = filters.services.some(s => artist.services?.includes(s));
                    if (!hasService) return false;
                }
                if (filters.equipment && filters.equipment.length > 0) {
                    const hasEquipment = filters.equipment.some(e => artist.equipment?.includes(e));
                    if (!hasEquipment) return false;
                }
                if (filters.coverage && artist.coverage !== filters.coverage) return false;
                return true;
            }

            // 3. Genre Filter
            if (filters.genres.length > 0) {
                const artistGenres = artist.genres.map(g => g.toLowerCase());
                const selectedGenresLower = filters.genres.map(g => g.toLowerCase());
                const hasMatch = selectedGenresLower.some(g => artistGenres.includes(g));
                if (!hasMatch) return false;
            }

            // 4. Format Filter
            if (filters.format) {
                if (filters.format === 'Banda' && artist.type !== 'band') return false;
                if (filters.format === 'Solista' && (artist.type === 'band')) return false;
            }

            // 5. Date Availability Filter
            if (filters.dateFrom) {
                if (artist.availability && artist.availability.length > 0) {
                    const isAvailable = artist.availability.some(
                        d => d.date === filters.dateFrom && d.status === 'available'
                    );
                    if (!isAvailable) return false;
                }
                if (!artist.availability || artist.availability.length === 0) {
                    return false;
                }
            }

            return true;
        });
    }, [allArtists, searchQuery, filters, isSoundServices]);

    // Sorting Logic
    const sortedArtists = useMemo(() => {
        const sorted = [...filteredArtists];

        if (sortOption === 'Precio: Menor a Mayor') {
            return sorted.sort((a, b) => (a.priceFrom || 0) - (b.priceFrom || 0));
        }
        if (sortOption === 'Precio: Mayor a Menor') {
            return sorted.sort((a, b) => (b.priceFrom || 0) - (a.priceFrom || 0));
        }
        if (sortOption === 'Mejor valorados') {
            return sorted.sort((a, b) => b.rating - a.rating);
        }

        // Default: Relevancia
        if (filters.dateFrom) {
            return sorted.sort((a, b) => {
                const aAvail = a.availability?.some(d => d.date === filters.dateFrom && d.status === 'available') ? 1 : 0;
                const bAvail = b.availability?.some(d => d.date === filters.dateFrom && d.status === 'available') ? 1 : 0;
                if (aAvail !== bAvail) return bAvail - aAvail;
                return b.rating - a.rating;
            });
        }

        return sorted.sort((a, b) => b.rating - a.rating);
    }, [filteredArtists, sortOption, filters.dateFrom]);

    return (
        <div className="flex h-screen w-full flex-col bg-background text-white font-sans overflow-hidden">
            <Navbar />

            <div className="flex flex-1 overflow-hidden pt-20">
                {/* Sidebar Filters */}
                {isSoundServices ? (
                    <ProviderSidebar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        className="hidden lg:flex"
                    />
                ) : (
                    <DiscoverSidebar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        className="hidden lg:flex"
                    />
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 pb-32 relative">

                    {/* Header of Grid */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 font-heading">
                                {isSoundServices ? 'Proveedores' : 'Descubre Músicos'}
                            </h1>
                            <p className="text-muted-foreground">
                                {loading ? 'Cargando...' : `${sortedArtists.length} ${isSoundServices ? 'profesionales' : 'artistas'} disponibles`}
                                {filters.dateFrom && ` para el ${new Date(filters.dateFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })}`}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Date Filter Chip */}
                            {filters.dateFrom && (
                                <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-3 py-2 rounded-lg text-sm">
                                    <Calendar size={16} className="text-primary" />
                                    <span className="text-primary font-medium">
                                        {new Date(filters.dateFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                                    </span>
                                    <button
                                        onClick={() => handleFilterChange('dateFrom', null)}
                                        className="text-primary hover:text-white ml-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {/* In-page Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    className="w-full rounded-lg border border-white/10 bg-surface py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Buscar artistas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                                <select
                                    className="rounded-lg border-white/10 bg-surface py-2 pl-3 pr-10 text-sm font-medium text-white focus:border-primary outline-none cursor-pointer"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                >
                                    <option>Relevancia</option>
                                    <option>Precio: Menor a Mayor</option>
                                    <option>Precio: Mayor a Menor</option>
                                    <option>Mejor valorados</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                        </div>
                    ) : sortedArtists.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sortedArtists.map((artist) => (
                                <ArtistCard key={artist.id} artist={artist} dateFilter={filters.dateFrom} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-surface/30 rounded-2xl border border-white/5 border-dashed">
                            <Music className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                            <p className="text-lg text-white font-bold">No se encontraron resultados.</p>
                            <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda.</p>
                        </div>
                    )}
                </main>

                {/* Mobile Filter Button */}
                <div className="lg:hidden fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-full shadow-lg hover:bg-primary-hover transition-transform hover:scale-105"
                    >
                        <Filter size={20} />
                        Filtros
                    </button>
                </div>

                {/* Mobile Filter Drawer */}
                <MobileFilterDrawer
                    isOpen={isMobileFiltersOpen}
                    onClose={() => setIsMobileFiltersOpen(false)}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    isSoundServices={isSoundServices}
                />
            </div>
        </div>
    );
}

// New Artist Card Component with availability indicator
function ArtistCard({ artist, dateFilter }: { artist: UnifiedArtist; dateFilter: string | null }) {
    const isAvailable = dateFilter && artist.availability?.some(
        d => d.date === dateFilter && d.status === 'available'
    );

    // Link to artist profile page if it's a Firestore artist with slug
    const linkTo = artist.slug ? `/artist/${artist.slug}` : `/profile/${artist.id}`;

    return (
        <Link
            to={linkTo}
            className="group relative flex flex-col bg-surface border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                        backgroundImage: `url(${artist.coverImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'})`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {artist.verified && (
                        <span className="flex items-center gap-1 bg-primary/90 text-black px-2 py-1 rounded-full text-[10px] font-bold">
                            <CheckCircle size={10} /> Verificado
                        </span>
                    )}
                    {isAvailable && (
                        <span className="flex items-center gap-1 bg-green-500/90 text-white px-2 py-1 rounded-full text-[10px] font-bold">
                            <Calendar size={10} /> Disponible
                        </span>
                    )}
                </div>

                {/* Price */}
                {artist.priceFrom && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-sm font-bold">
                        Desde {artist.priceFrom}€
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="text-white font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
                            {artist.name}
                        </h3>
                        <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> {artist.city}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg shrink-0">
                        <Star size={12} className="text-primary fill-primary" />
                        <span className="text-white text-xs font-bold">{artist.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {artist.genres?.slice(0, 2).map((genre: string) => (
                        <span key={genre} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                            {genre}
                        </span>
                    ))}
                    {artist.type === 'band' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            <Users size={10} /> Banda
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
