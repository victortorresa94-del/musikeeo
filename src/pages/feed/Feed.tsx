import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Feed() {

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* AI Narrator */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-md border border-primary/20 p-4 rounded-xl shadow-sm"
            >
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-primary mb-1">Resumen Diario</h2>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            ¡Buenos días, Alex! Tienes <span className="text-foreground font-semibold">3 nuevas propuestas de colaboración</span> pendientes.
                            El estudio "Sonic Wave" ha confirmado tu reserva para el Jueves.
                            <br />
                            <span className="text-xs text-muted-foreground mt-2 block">Tip: Sube tu último demo para aumentar tu visibilidad hoy un 15%.</span>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Feed Content */}
            <div className="space-y-4">
                {/* Mock Item 1 */}
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">AS</div>
                        <div>
                            <p className="font-semibold text-sm">Ana Singer</p>
                            <p className="text-xs text-muted-foreground">hace 2h • Barcelona</p>
                        </div>
                        <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-accent rounded text-accent-foreground">Collab</span>
                    </div>
                    <p className="text-sm mb-3">
                        Buscando bajista para sesión de Jazz Fusión este fin de semana. ¿Alguien disponible? 🎸🎷
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="bg-secondary px-2 py-1 rounded-md">#Jazz</span>
                        <span className="bg-secondary px-2 py-1 rounded-md">#Session</span>
                    </div>
                </div>

                {/* Mock Item 2 */}
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-500">SA</div>
                        <div>
                            <p className="font-semibold text-sm">Sala Apolo</p>
                            <p className="text-xs text-muted-foreground">hace 5h • Evento</p>
                        </div>
                        <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-accent rounded text-accent-foreground">Event</span>
                    </div>
                    <div className="w-full h-48 bg-muted rounded-lg mb-3 flex items-center justify-center text-muted-foreground text-xs border border-border/50">
                        [Imagen del Evento]
                    </div>
                    <p className="text-sm font-semibold mb-1">Noche de Indie Rock - Tickets Early Bird</p>
                    <p className="text-xs text-muted-foreground mb-3">Viernes 24 Marzo • 21:00h</p>
                </div>
            </div>
        </div>
    );
}
