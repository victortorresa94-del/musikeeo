import { Calendar, Filter, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { CityAutocomplete } from '../ui/CityAutocomplete';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface EventsSidebarProps {
    className?: string;
    filters: {
        type: string[];
        city: string;
        date: string;
    };
    onFilterChange: (key: string, value: any) => void;
}

export const EventsSidebar = ({ className, filters, onFilterChange }: EventsSidebarProps) => {
    const navigate = useNavigate();

    const toggleType = (type: string) => {
        const current = filters.type;
        const next = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        onFilterChange('type', next);
    };

    return (
        <aside className={cn("w-full md:w-80 flex-shrink-0 flex flex-col border-r border-border bg-muted overflow-y-auto h-full", className)}>
            <div className="p-6 space-y-8">

                {/* Rodrigo AI Block */}
                <div className="bg-gradient-to-br from-background to-card border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-primary/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={64} className="text-primary" />
                    </div>

                    <div className="relative z-10 flex flex-col items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-2xl">🤖</span>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-foreground mb-1">
                                ¿Buscas el evento perfecto?
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Deja que Rodrigo analice tu perfil y encuentre oportunidades a tu medida.
                            </p>
                        </div>

                        <Button className="w-full bg-primary text-background hover:opacity-90 font-bold">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Encuentra oportunidades
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                        <Filter size={14} /> Filtros
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Ubicación</label>
                        <CityAutocomplete
                            value={filters.city || null}
                            onChange={(city) => onFilterChange('city', city || '')}
                            placeholder="Ciudad..."
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Fecha</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="date"
                                className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-3 text-sm text-foreground focus:border-primary/50 outline-none"
                                value={filters.date}
                                onChange={(e) => onFilterChange('date', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Types */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground">Tipo de Evento</label>
                        <div className="space-y-2">
                            {['Festival', 'Evento Privado', 'Boda / Social', 'Residencia / Bar', 'Otro'].map(type => (
                                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0"
                                        checked={filters.type.includes(type)}
                                        onChange={() => toggleType(type)}
                                    />
                                    <span className={cn(
                                        "text-sm transition-colors",
                                        filters.type.includes(type) ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {type}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Publish CTA */}
                    <div className="pt-4 border-t border-border">
                        <Button
                            onClick={() => navigate('/publicar')}
                            className="w-full bg-muted border border-border hover:bg-elevated text-foreground font-bold"
                        >
                            + Publicar Anuncio
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
};
