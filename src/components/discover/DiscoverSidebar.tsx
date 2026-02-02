import { Sparkles, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { CityAutocomplete } from '../ui/CityAutocomplete';
import { cn } from '../../lib/utils';
import { GENRES } from '../../lib/constants';

interface DiscoverSidebarProps {
    className?: string;
    filters: {
        city: string | null;
        genres: string[];
        format: string | null;
        priceRange: [number, number];
        dateFrom: string | null;
        dateTo: string | null;
    };
    onFilterChange: (key: string, value: any) => void;
    isSoundServices?: boolean; // To show different filters for providers
}

export const DiscoverSidebar = ({ className, filters, onFilterChange }: DiscoverSidebarProps) => {

    const toggleGenre = (genre: string) => {
        const current = filters.genres;
        const next = current.includes(genre)
            ? current.filter(g => g !== genre)
            : [...current, genre];
        onFilterChange('genres', next);
    };

    return (
        <aside className={cn("w-full md:w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-surface overflow-y-auto h-full", className)}>
            <div className="p-6 space-y-8">

                {/* AI Assistant Banner */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-black">
                            <Sparkles size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold text-sm text-white">Rodrigo AI</h3>
                            <p className="text-xs text-gray-300 mt-1 mb-3">¿Necesitas ayuda para encontrar el sonido perfecto?</p>
                            <Button size="sm" className="w-full text-xs font-bold bg-primary text-black hover:bg-primary-hover">
                                Habla con Rodrigo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters: Location */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ubicación</h3>
                    </div>
                    <CityAutocomplete
                        value={filters.city}
                        onChange={(city) => onFilterChange('city', city)}
                        placeholder="Escribe una ciudad..."
                    />
                    {/* Quick select buttons for popular cities */}
                    <div className="flex flex-wrap gap-2">
                        {['Barcelona', 'Madrid', 'Valencia', 'Sevilla'].map(city => (
                            <button
                                key={city}
                                onClick={() => onFilterChange('city', city === filters.city ? null : city)}
                                className={cn(
                                    "text-xs px-2 py-1 rounded-md border transition-colors",
                                    filters.city === city
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "border-white/10 text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters: Date Range */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fecha</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="date"
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all [color-scheme:dark]"
                                value={filters.dateFrom || ''}
                                onChange={(e) => onFilterChange('dateFrom', e.target.value || null)}
                                placeholder="Desde"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="date"
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all [color-scheme:dark]"
                                value={filters.dateTo || ''}
                                onChange={(e) => onFilterChange('dateTo', e.target.value || null)}
                                min={filters.dateFrom || undefined}
                                placeholder="Hasta"
                            />
                        </div>
                        {(filters.dateFrom || filters.dateTo) && (
                            <button
                                onClick={() => {
                                    onFilterChange('dateFrom', null);
                                    onFilterChange('dateTo', null);
                                }}
                                className="text-xs text-primary hover:text-primary-hover transition-colors"
                            >
                                Limpiar fechas
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters: Price Range */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Presupuesto</h3>
                        <span className="text-xs font-medium text-primary">EUR</span>
                    </div>
                    <div className="pt-2 pb-2">
                        {/* Replaced visually with a simple slider for now as a native range input */}
                        <input
                            type="range"
                            min="100"
                            max="2000"
                            step="50"
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                            value={filters.priceRange[1]}
                            onChange={(e) => onFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                        />
                        <div className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>{filters.priceRange[0]}€</span>
                            <span>{filters.priceRange[1]}€+</span>
                        </div>
                    </div>
                </div>

                {/* Filters: Genre */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Género</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {GENRES.map(genre => (
                            <label key={genre} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                    filters.genres.includes(genre)
                                        ? "bg-primary border-primary"
                                        : "border-white/20 bg-white/5 group-hover:border-white/40"
                                )}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={filters.genres.includes(genre)}
                                        onChange={() => toggleGenre(genre)}
                                    />
                                    {filters.genres.includes(genre) && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm transition-colors",
                                    filters.genres.includes(genre) ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                                )}>{genre}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Filters: Format */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Formato</h3>
                    <div className="flex flex-wrap gap-2">
                        {['Solista', 'Dúo', 'Banda', 'Orquesta'].map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => onFilterChange('format', filters.format === fmt ? null : fmt)}
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                    filters.format === fmt
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-white/10 text-muted-foreground hover:border-primary hover:text-primary"
                                )}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </aside>
    );
};
