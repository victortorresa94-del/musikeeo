import { Button } from '../../components/ui/button';
import { Calendar, MapPin, Plus, Sliders } from 'lucide-react';

export default function Events() {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-primary">Gestor de Eventos</h1>
                    <p className="text-muted-foreground">Organiza tus gigs, ensayos y sesiones.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Nuevo Evento
                </Button>
            </div>

            {/* Calendar / List Toggle Placeholder */}
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="bg-primary/10 text-primary border-primary/20">Calendario</Button>
                <Button variant="ghost" size="sm">Lista</Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calendar View */}
                <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-center text-muted-foreground bg-muted/20">
                    <div className="text-center">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Calendario Interactivo</p>
                        <p className="text-xs opacity-60">(Próximamente)</p>
                    </div>
                </div>

                {/* Upcoming / Quick Actions */}
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Sliders className="h-4 w-4 text-primary" /> Filtros Rápidos
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-secondary px-2 py-1 rounded-md cursor-pointer hover:text-primary">Conciertos</span>
                            <span className="text-xs bg-secondary px-2 py-1 rounded-md cursor-pointer hover:text-primary">Ensayos</span>
                            <span className="text-xs bg-secondary px-2 py-1 rounded-md cursor-pointer hover:text-primary">Grabación</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 rounded-2xl p-5">
                        <h3 className="font-bold text-primary mb-1">Próximo Gig</h3>
                        <p className="font-semibold text-lg">Indie Night @ Apolo</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4" /> Viernes, 24 Mar
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" /> Sala Apolo
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
