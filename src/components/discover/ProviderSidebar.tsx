import { Search } from 'lucide-react';
import { Button } from '../ui/button';
import { CityAutocomplete } from '../ui/CityAutocomplete';
import { cn } from '../../lib/utils';

interface ProviderSidebarProps {
    className?: string;
    filters: {
        city: string | null;
        type: string | null; // Empresa vs Freelance
        services: string[];
        equipment: string[];
        coverage: string | null;
        dateFrom: string | null;
        dateTo: string | null;
        priceRange: [number, number];
    };
    onFilterChange: (key: string, value: any) => void;
}

export const ProviderSidebar = ({ className, filters, onFilterChange }: ProviderSidebarProps) => {

    const toggleService = (service: string) => {
        const current = filters.services || [];
        const next = current.includes(service)
            ? current.filter(s => s !== service)
            : [...current, service];
        onFilterChange('services', next);
    };

    const toggleEquipment = (eq: string) => {
        const current = filters.equipment || [];
        const next = current.includes(eq)
            ? current.filter(e => e !== eq)
            : [...current, eq];
        onFilterChange('equipment', next);
    };

    return (
        <aside className={cn("w-full md:w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-surface overflow-y-auto h-full", className)}>
            <div className="p-6 space-y-8">

                {/* Header */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Filtros de Proveedor</h2>
                    <p className="text-xs text-muted-foreground">Encuentra el equipo y personal técnico ideal.</p>
                </div>

                {/* Filters: Location */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ubicación Base</h3>
                    </div>
                    <CityAutocomplete
                        value={filters.city}
                        onChange={(city) => onFilterChange('city', city)}
                        placeholder="Ciudad base..."
                    />
                </div>

                {/* Filters: Date (Event Date) */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fecha del Evento</h3>
                    <input
                        type="date"
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-3 pr-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all [color-scheme:dark]"
                        value={filters.dateFrom || ''}
                        onChange={(e) => onFilterChange('dateFrom', e.target.value || null)}
                    />
                </div>

                {/* Filters: Provider Type */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Proveedor</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {['Empresa', 'Freelance'].map(type => (
                            <button
                                key={type}
                                onClick={() => onFilterChange('type', filters.type === type ? null : type)}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                                    filters.type === type
                                        ? "bg-primary text-black border-primary"
                                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters: Services */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Servicios</h3>
                    <div className="space-y-2">
                        {['Alquiler de Equipo', 'Técnico de Sonido', 'Iluminación', 'Montaje Completo', 'Transporte', 'Backline'].map(service => (
                            <label key={service} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    filters.services?.includes(service)
                                        ? "bg-primary border-primary"
                                        : "border-gray-600 group-hover:border-primary"
                                )}>
                                    {filters.services?.includes(service) && <Search size={10} className="text-black" />}
                                </div>
                                <span className={cn(
                                    "text-sm transition-colors",
                                    filters.services?.includes(service) ? "text-white" : "text-gray-400 group-hover:text-white"
                                )}>
                                    {service}
                                </span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={filters.services?.includes(service)}
                                    onChange={() => toggleService(service)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Filters: Equipment */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Equipamiento</h3>
                    <div className="space-y-2">
                        {['Audio', 'Iluminación', 'Video', 'Escenario', 'Estructuras'].map(eq => (
                            <label key={eq} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    filters.equipment?.includes(eq)
                                        ? "bg-primary border-primary"
                                        : "border-gray-600 group-hover:border-primary"
                                )}>
                                    {filters.equipment?.includes(eq) && <Search size={10} className="text-black" />}
                                </div>
                                <span className={cn(
                                    "text-sm transition-colors",
                                    filters.equipment?.includes(eq) ? "text-white" : "text-gray-400 group-hover:text-white"
                                )}>
                                    {eq}
                                </span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={filters.equipment?.includes(eq)}
                                    onChange={() => toggleEquipment(eq)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Filters: Coverage */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cobertura</h3>
                    <select
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-white focus:border-primary outline-none"
                        value={filters.coverage || ''}
                        onChange={(e) => onFilterChange('coverage', e.target.value || null)}
                    >
                        <option value="">Cualquiera</option>
                        <option value="local">Local (Ciudad)</option>
                        <option value="provincial">Provincial (+50km)</option>
                        <option value="regional">Comunidad Autónoma</option>
                        <option value="nacional">Toda España</option>
                    </select>
                </div>

                <div className="pt-6 border-t border-white/10">
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-white"
                        onClick={() => {
                            onFilterChange('city', null);
                            onFilterChange('type', null);
                            onFilterChange('services', []);
                            onFilterChange('equipment', []);
                            onFilterChange('coverage', null);
                            onFilterChange('dateFrom', null);
                        }}
                    >
                        Limpiar Filtros
                    </Button>
                </div>

            </div>
        </aside>
    );
};
