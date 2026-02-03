import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RodrigoBanner = () => {
    return (
        <section className="py-16 px-4 md:px-10 bg-background relative z-10">
            <div className="max-w-[1200px] mx-auto bg-surface border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-10">

                {/* Decorational Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex-1 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold tracking-wide uppercase mb-4 border border-white/10">
                        <Sparkles size={14} className="text-primary" />
                        Asistente Rodrigo
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
                        Deja que Rodrigo organice tu evento
                    </h2>

                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                        ¿No sabes qué música va mejor con tu evento? ¿Necesitas ajustar presupuesto? Rodrigo te ayuda a curar la selección perfecta y negociar con los artistas.
                    </p>

                    <Link
                        to="/rodrigo"
                        className="h-12 px-6 rounded-lg bg-white text-background font-bold hover:bg-gray-100 transition-colors flex items-center justify-center md:justify-start gap-2 w-full md:w-auto"
                    >
                        Hablar con Rodrigo
                        <ArrowRight size={18} />
                    </Link>
                </div>

                <div className="w-full md:w-1/3 flex justify-center relative z-10">
                    <div className="relative w-64 h-64 md:w-80 md:h-80">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-green"></div>
                        <img
                            src="/rodrigo-persona.png"
                            alt="Rodrigo AI Persona"
                            className="w-full h-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-500 mask-image-gradient"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
