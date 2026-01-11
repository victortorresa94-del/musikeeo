import { Plus, MoreHorizontal, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function Projects() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-primary">Proyectos</h1>
                    <p className="text-muted-foreground">Gestiona tus lanzamientos y colaboraciones.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Crear Proyecto
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Planning */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-sm text-foreground/80">Planificación</h3>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">2</span>
                    </div>

                    {[1, 2].map((i) => (
                        <div key={i} className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">EP Launch</span>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h4 className="font-bold text-sm mb-1">Neon Skies - Single</h4>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">Coordinar sesión de fotos y máster final.</p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> 12 Oct
                                </div>
                                <div className="flex -space-x-2">
                                    <div className="h-6 w-6 rounded-full bg-secondary border-2 border-card"></div>
                                    <div className="h-6 w-6 rounded-full bg-primary/20 border-2 border-card"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Column 2: In Progress */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-sm text-foreground/80">En Progreso</h3>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">1</span>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">Gira</span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h4 className="font-bold text-sm mb-1">Summer Tour 2024</h4>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">Contactar salas de Madrid y Valencia.</p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> En curso
                            </div>
                            <div className="flex -space-x-2">
                                <div className="h-6 w-6 rounded-full bg-secondary border-2 border-card"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Done */}
                <div className="space-y-4 opacity-70">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-sm text-foreground/80">Completado</h3>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">5</span>
                    </div>
                    {/* Simplified Item */}
                    <div className="bg-muted/30 border border-border p-3 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm line-through text-muted-foreground">Revisión Contrato</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
