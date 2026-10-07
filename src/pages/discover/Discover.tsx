import { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, SlidersHorizontal, Calendar, MapPin, BadgeCheck, Users, X,
    Music2, Speaker, Sparkles, ArrowRight, ArrowUpDown,
} from 'lucide-react';

import { DiscoverSidebar } from '../../components/discover/DiscoverSidebar';
import { ProviderSidebar } from '../../components/discover/ProviderSidebar';
import { MobileFilterDrawer } from '../../components/discover/MobileFilterDrawer';
import { getArtists } from '../../services/artistService';
import { getPublicProviders } from '../../services/providerService';
import { cn } from '../../lib/utils';

import type { Artist, ProviderProfile } from '../../types';

// Unified type for display in the grid
interface UnifiedArtist {
    id: string;
    slug?: string;
    userId?: string;
    name: string;
    city: string;
    coverImage: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
    type: 'musician' | 'band' | 'artist' | 'technician';
    role: string;
    genres: string[];
    priceFrom?: number;
    availability?: { date: string; status: string }[];
    // Provider specific
    providerType?: 'Empresa' | 'Freelance';
    services?: string[];
    equipment?: string[];
    coverage?: string;
}

// Atajos de estilo: lo que más se busca para directo en España
const QUICK_GENRES = ['Pop', 'Rock', 'Flamenco', 'Latin', 'Jazz', 'Electrónica', 'Indie', 'Soul', 'Folk'];

const SORTS = ['Relevancia', 'Mejor valorados', 'Precio: menor a mayor', 'Precio: mayor a menor'] as const;
type Sort = typeof SORTS[number];

const DEFAULT_FILTERS = {
    city: null as string | null,
    genres: [] as string[],
    format: null as string | null,
    priceRange: [100, 2000] as [number, number],
    dateFrom: null as string | null,
    dateTo: null as string | null,
    // Provider specific
    type: null as string | null,
    services: [] as string[],
    equipment: [] as string[],
    coverage: null as string | null,
};

export default function Discover() {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isSoundServices = location.pathname === '/sonido';

    const [firestoreArtists, setFirestoreArtists] = useState<Artist[]>([]);
    const [firestoreProviders, setFirestoreProviders] = useState<ProviderProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        ...DEFAULT_FILTERS,
        city: searchParams.get('city') || null,
        dateFrom: searchParams.get('date') || null,
    });
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [sortOption, setSortOption] = useState<Sort>('Relevancia');

    useEffect(() => {
        (async () => {
            try {
                const [artists, providers] = await Promise.all([getArtists(), getPublicProviders()]);
                setFirestoreArtists(artists);
                setFirestoreProviders(providers);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // La búsqueda vive en la URL: se puede compartir y sobrevive al "atrás"
    useEffect(() => {
        const t = setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            if (searchQuery.trim()) next.set('q', searchQuery.trim()); else next.delete('q');
            if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleGenre = (genre: string) => {
        setFilters(prev => ({
            ...prev,
            genres: prev.genres.includes(genre) ? prev.genres.filter(g => g !== genre) : [...prev.genres, genre],
        }));
    };

    const clearAll = () => {
        setFilters({ ...DEFAULT_FILTERS });
        setSearchQuery('');
    };

    const allArtists: UnifiedArtist[] = useMemo(() => {
        if (isSoundServices) {
            return firestoreProviders.map(p => ({
                id: p.id,
                userId: p.userId,
                name: p.businessName,
                city: p.coverageAreas?.[0] || 'España',
                coverImage: '',
                rating: 0,
                reviewCount: 0,
                verified: false,
                type: 'technician' as const,
                role: p.providerType === 'empresa' ? 'Empresa' : 'Freelance',
                genres: p.services || [],
                providerType: p.providerType === 'empresa' ? 'Empresa' as const : 'Freelance' as const,
                services: p.services,
                equipment: p.equipmentTypes,
                coverage: p.coverageAreas ? p.coverageAreas[0] : '',
            }));
        }

        return firestoreArtists.map(a => {
            const isBand = a.genres.some(g => g.toLowerCase() === 'banda') || a.tags.some(t => t.toLowerCase() === 'banda');
            return {
                id: a.id,
                slug: a.slug,
                userId: a.userId,
                name: a.artistName,
                city: a.city,
                coverImage: a.profilePhoto || a.coverPhoto || a.multimedia?.photos?.[0]?.url || '',
                rating: a.rating,
                reviewCount: a.reviewCount || 0,
                verified: a.isVerified,
                type: isBand ? 'band' as const : 'musician' as const,
                role: a.genres[0] || 'Artista',
                genres: a.genres,
                priceFrom: a.priceFrom,
                availability: a.availability || [],
            };
        });
    }, [isSoundServices, firestoreArtists, firestoreProviders]);

    const filteredArtists = useMemo(() => {
        return allArtists.filter(artist => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const hit = artist.name.toLowerCase().includes(query)
                    || artist.city.toLowerCase().includes(query)
                    || artist.genres.some(g => g.toLowerCase().includes(query))
                    || artist.role.toLowerCase().includes(query);
                if (!hit) return false;
            }

            if (filters.city && !artist.city.toLowerCase().includes(filters.city.toLowerCase())) return false;

            if (isSoundServices) {
                if (filters.type && artist.providerType !== filters.type) return false;
                if (filters.services.length > 0 && !filters.services.some(s => artist.services?.includes(s))) return false;
                if (filters.equipment.length > 0 && !filters.equipment.some(e => artist.equipment?.includes(e))) return false;
                if (filters.coverage && artist.coverage !== filters.coverage) return false;
                return true;
            }

            if (filters.genres.length > 0) {
                const artistGenres = artist.genres.map(g => g.toLowerCase());
                if (!filters.genres.some(g => artistGenres.includes(g.toLowerCase()))) return false;
            }

            if (filters.format) {
                if (filters.format === 'Banda' && artist.type !== 'band') return false;
                if (filters.format === 'Solista' && artist.type === 'band') return false;
            }

            if (filters.dateFrom) {
                const isAvailable = artist.availability?.some(d => d.date === filters.dateFrom && d.status === 'available');
                if (!isAvailable) return false;
            }

            return true;
        });
    }, [allArtists, searchQuery, filters, isSoundServices]);

    const sortedArtists = useMemo(() => {
        const sorted = [...filteredArtists];
        if (sortOption === 'Precio: menor a mayor') return sorted.sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
        if (sortOption === 'Precio: mayor a menor') return sorted.sort((a, b) => (b.priceFrom || 0) - (a.priceFrom || 0));
        if (sortOption === 'Mejor valorados') return sorted.sort((a, b) => b.rating - a.rating);
        // Relevancia: verificados y perfiles con foto primero
        return sorted.sort((a, b) =>
            Number(b.verified) - Number(a.verified)
            || Number(!!b.coverImage) - Number(!!a.coverImage)
            || b.rating - a.rating);
    }, [filteredArtists, sortOption]);

    // Nº de filtros activos (para el badge del botón)
    const activeCount = (filters.city ? 1 : 0) + filters.genres.length + (filters.format ? 1 : 0) + (filters.dateFrom ? 1 : 0)
        + (filters.type ? 1 : 0) + filters.services.length + filters.equipment.length + (filters.coverage ? 1 : 0);
    const hasAnyFilter = activeCount > 0 || !!searchQuery;

    const nounPlural = isSoundServices ? 'técnicos y proveedores' : 'artistas';

    return (
        <div className="flex w-full min-h-full bg-background text-foreground">
            {/* Filtros de escritorio */}
            {isSoundServices ? (
                <ProviderSidebar filters={filters} onFilterChange={handleFilterChange} className="hidden lg:flex sticky top-14 h-[calc(100vh-3.5rem)]" />
            ) : (
                <DiscoverSidebar filters={filters} onFilterChange={handleFilterChange} className="hidden lg:flex sticky top-14 h-[calc(100vh-3.5rem)]" />
            )}

            <div className="flex-1 min-w-0 pb-28 md:pb-10">
                {/* ── Cabecera fija: búsqueda + filtros (siempre a mano con el pulgar) ── */}
                <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 bg-background/85 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.06]">
                    <div className="px-4 md:px-8 pt-3 pb-3 space-y-3">
                        {/* Artistas | Técnicos */}
                        <div className="flex items-center gap-0.5 p-0.5 rounded-[11px] bg-white/[0.08] w-full sm:w-auto sm:inline-flex" role="tablist" aria-label="Qué buscas">
                            {[
                                { to: '/discover', label: 'Artistas', Icon: Music2, active: !isSoundServices },
                                { to: '/sonido', label: 'Técnicos', Icon: Speaker, active: isSoundServices },
                            ].map(t => (
                                <Link
                                    key={t.to}
                                    to={t.to + (searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '')}
                                    role="tab"
                                    aria-selected={t.active}
                                    className={cn(
                                        'flex-1 sm:flex-none h-8 px-5 rounded-[9px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors',
                                        t.active ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'
                                    )}
                                >
                                    {t.label}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="relative flex-1">
                                <span className="sr-only">Buscar {nounPlural}</span>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                <input
                                    type="search"
                                    enterKeyHint="search"
                                    className="w-full rounded-[12px] bg-white/[0.08] h-10 pl-9 pr-9 text-[16px] md:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-white/[0.12]"
                                    placeholder={isSoundServices ? 'Sonido, luces, backline, ciudad…' : 'Nombre, estilo o ciudad…'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} aria-label="Borrar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </label>
                            <button
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="lg:hidden relative h-10 w-10 shrink-0 rounded-[12px] bg-white/[0.08] flex items-center justify-center text-foreground active:opacity-60"
                                aria-label={`Filtros${activeCount ? ` (${activeCount} activos)` : ''}`}
                            >
                                <SlidersHorizontal className="h-5 w-5" />
                                {activeCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">{activeCount}</span>
                                )}
                            </button>
                        </div>

                        {/* Chips de estilo (artistas) */}
                        {!isSoundServices && (
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                                {QUICK_GENRES.map(g => {
                                    const on = filters.genres.includes(g);
                                    return (
                                        <button
                                            key={g}
                                            onClick={() => toggleGenre(g)}
                                            aria-pressed={on}
                                            className={cn(
                                                'shrink-0 h-8 px-3.5 rounded-full text-[14px] font-medium border transition-colors',
                                                on ? 'bg-white text-black border-white' : 'bg-white/[0.07] text-foreground/85 border-transparent'
                                            )}
                                        >
                                            {g}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 md:px-8 pt-5">
                    {/* Resumen + orden */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <p className="text-sm text-muted-foreground" aria-live="polite">
                            {loading ? 'Buscando…' : (
                                <>
                                    <span className="text-foreground font-bold">{sortedArtists.length}</span> {nounPlural}
                                    {filters.dateFrom && ` libres el ${new Date(filters.dateFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })}`}
                                </>
                            )}
                        </p>
                        <label className="relative flex items-center gap-1.5 text-sm text-muted-foreground">
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="sr-only">Ordenar por</span>
                            <select
                                className="appearance-none bg-transparent pr-1 text-sm font-semibold text-foreground outline-none cursor-pointer"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as Sort)}
                            >
                                {SORTS.map(s => <option key={s} className="bg-card">{s}</option>)}
                            </select>
                        </label>
                    </div>

                    {/* Filtros activos */}
                    {hasAnyFilter && (
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                            {searchQuery && <ActiveChip label={`“${searchQuery}”`} onRemove={() => setSearchQuery('')} />}
                            {filters.city && <ActiveChip label={filters.city} onRemove={() => handleFilterChange('city', null)} />}
                            {filters.dateFrom && (
                                <ActiveChip
                                    label={new Date(filters.dateFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                                    icon={<Calendar className="h-3.5 w-3.5" />}
                                    onRemove={() => handleFilterChange('dateFrom', null)}
                                />
                            )}
                            {filters.format && <ActiveChip label={filters.format} onRemove={() => handleFilterChange('format', null)} />}
                            {filters.genres.map(g => <ActiveChip key={g} label={g} onRemove={() => toggleGenre(g)} />)}
                            {[...filters.services, ...filters.equipment].map(s => (
                                <ActiveChip key={s} label={s} onRemove={() => {
                                    handleFilterChange('services', filters.services.filter(x => x !== s));
                                    handleFilterChange('equipment', filters.equipment.filter(x => x !== s));
                                }} />
                            ))}
                            <button onClick={clearAll} className="text-sm font-semibold text-primary hover:underline px-1">Borrar todo</button>
                        </div>
                    )}

                    {/* Resultados */}
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5" aria-hidden>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
                                    <div className="aspect-[4/5] bg-muted animate-pulse" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
                                        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sortedArtists.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                            {sortedArtists.map((artist, i) => (
                                <ArtistCard key={artist.id} artist={artist} dateFilter={filters.dateFrom} index={i} />
                            ))}
                        </div>
                    ) : hasAnyFilter ? (
                        <div className="text-center py-14 px-6 rounded-3xl border border-dashed border-border bg-card/50">
                            <Search className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                            <p className="font-heading text-lg font-bold">Nada con esos filtros</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">Prueba con menos estilos u otra ciudad.</p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <button onClick={clearAll} className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-bold">Borrar filtros</button>
                                <Link to="/rodrigo" className="h-11 px-5 rounded-xl border border-border font-bold flex items-center justify-center gap-2 hover:border-primary/50">
                                    <Sparkles className="h-4 w-4 text-primary" /> Pídeselo a Rodrigo
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <EmptyLaunch isSoundServices={isSoundServices} />
                    )}
                </div>
            </div>

            <MobileFilterDrawer
                isOpen={isMobileFiltersOpen}
                onClose={() => setIsMobileFiltersOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                isSoundServices={isSoundServices}
            />
        </div>
    );
}

const ActiveChip = ({ label, onRemove, icon }: { label: string; onRemove: () => void; icon?: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1 rounded-full bg-white/[0.08] text-foreground text-sm font-medium">
        {icon}{label}
        <button onClick={onRemove} aria-label={`Quitar ${label}`} className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground">
            <X className="h-3.5 w-3.5" />
        </button>
    </span>
);

// Sin perfiles todavía (lanzamiento): convertir el vacío en invitación
const EmptyLaunch = ({ isSoundServices }: { isSoundServices: boolean }) => (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-card to-card p-7 md:p-10">
        <p className="text-primary text-sm font-semibold mb-3">Estamos arrancando</p>
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight max-w-md">
            {isSoundServices ? 'Los primeros técnicos se llevan la portada.' : 'Los primeros artistas se llevan la portada.'}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md">
            {isSoundServices
                ? 'Crea tu perfil de sonido, luces o backline gratis y aparece aquí cuando lleguen las salas y los eventos.'
                : 'Crea tu perfil gratis con tu música, vídeos y precios, y aparece aquí cuando busquen directo en tu ciudad.'}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link to="/register" className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                Crear mi perfil <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/rodrigo" className="h-12 px-6 rounded-2xl border border-white/15 font-bold flex items-center justify-center gap-2 hover:bg-white/5">
                <Sparkles className="h-4 w-4 text-primary" /> Busco música para un evento
            </Link>
        </div>
    </div>
);

function ArtistCard({ artist, dateFilter, index }: { artist: UnifiedArtist; dateFilter: string | null; index: number }) {
    const isAvailable = dateFilter && artist.availability?.some(d => d.date === dateFilter && d.status === 'available');
    const linkTo = artist.type === 'technician'
        ? `/profile/${artist.userId || artist.id}`
        : artist.slug ? `/artist/${artist.slug}` : `/profile/${artist.userId || artist.id}`;
    const hasReviews = artist.reviewCount > 0 && artist.rating > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.3 }}
        >
            <Link
                to={linkTo}
                className="group flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 active:scale-[0.98] transition-all"
            >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {artist.coverImage ? (
                        <img src={artist.coverImage} alt={artist.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/25 via-muted to-muted">
                            {artist.type === 'technician'
                                ? <Speaker className="h-12 w-12 text-primary/70" />
                                : <span className="font-heading text-6xl font-bold text-primary/70">{artist.name.slice(0, 1).toUpperCase()}</span>}
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

                    <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                        {isAvailable && (
                            <span className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[11px] font-bold">
                                <Calendar className="h-3 w-3" /> Libre
                            </span>
                        )}
                        {artist.type === 'band' && (
                            <span className="flex items-center gap-1 bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                <Users className="h-3 w-3" /> Banda
                            </span>
                        )}
                    </div>

                    {artist.priceFrom ? (
                        <span className="absolute bottom-2 left-2 text-white text-sm font-bold drop-shadow">desde {artist.priceFrom}€</span>
                    ) : null}
                </div>

                <div className="p-3 flex flex-col gap-1 min-w-0">
                    <p className="font-heading font-bold text-sm md:text-base text-foreground leading-tight flex items-center gap-1 min-w-0">
                        <span className="truncate">{artist.name}</span>
                        {artist.verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-label="Verificado" />}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{artist.city || 'España'}</span>
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[11px] text-foreground/70 truncate">{artist.genres.slice(0, 2).join(' · ') || artist.role}</span>
                        {hasReviews
                            ? <span className="text-[11px] font-bold text-foreground shrink-0">★ {artist.rating.toFixed(1)}</span>
                            : <span className="text-[10px] font-bold uppercase tracking-wide text-primary shrink-0">Nuevo</span>}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
