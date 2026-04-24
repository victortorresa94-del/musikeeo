import { MapPin, Calendar, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { EVENT_TYPES } from '../../services/eventsData';
import { useState } from 'react';

interface EventSidebarProps {
    className?: string;
    onFilterChange: (filters: any) => void;
}

export const EventSidebar = ({ className = '', onFilterChange }: EventSidebarProps) => {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [city, setCity] = useState('');
    const [date, setDate] = useState('');

    const toggleType = (type: string) => {
        const newTypes = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];

        setSelectedTypes(newTypes);
        onFilterChange({ type: newTypes, city, date });
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCity(e.target.value);
        onFilterChange({ type: selectedTypes, city: e.target.value, date });
    };

    return (
        <aside className={`w-80 shrink-0 hidden lg:flex flex-col gap-6 ${className}`}>

            {/* Rodrigo AI Block */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background to-card border border-primary/30 p-6 shadow-xl group">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all"></div>
                <div className="relative z-10 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl border border-primary/20">
                        🤖
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg leading-tight mb-2">
                        ¿Buscas el evento perfecto?
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        Deja que Rodrigo analice tu perfil y encuentre oportunidades a tu medida.
                    </p>
                    <Button className="w-full bg-primary text-background font-bold hover:opacity-90 hover:scale-105 transition-all">
                        Encuentra oportunidades
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider mb-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                </div>

                {/* Cities */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Ciudad"
                            className="pl-9 bg-muted border-border h-10 text-sm focus:border-primary/50"
                            value={city}
                            onChange={handleCityChange}
                        />
                    </div>
                </div>

                {/* Event Type */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Tipo de Evento</label>
                    <div className="space-y-2">
                        {EVENT_TYPES.map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedTypes.includes(type)
                                    ? 'bg-primary border-primary'
                                    : 'border-border group-hover:border-muted-foreground'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => toggleType(type)}
                                    />
                                    {selectedTypes.includes(type) && (
                                        <div className="h-2 w-2 rounded-sm bg-black" />
                                    )}
                                </div>
                                <span className={`text-sm ${selectedTypes.includes(type) ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                    {type}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="date"
                            className="pl-9 bg-muted border-border h-10 text-sm focus:border-primary/50"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                onFilterChange({ type: selectedTypes, city, date: e.target.value });
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* POST AD CTA */}
            <div className="mt-auto">
                <Button
                    variant="outline"
                    className="w-full h-14 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted text-muted-foreground hover:text-foreground uppercase font-bold tracking-wider text-xs"
                >
                    + Publicar Anuncio
                </Button>
            </div>
        </aside>
    );
};
