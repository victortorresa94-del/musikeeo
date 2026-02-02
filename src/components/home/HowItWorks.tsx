import { Search, MessageSquare, ShieldCheck } from 'lucide-react';

const steps = [
    {
        icon: Search,
        title: "1. Explora Talento",
        description: "Navega por perfiles de músicos verificados, escucha sus demos de alta calidad y lee reseñas reales."
    },
    {
        icon: MessageSquare,
        title: "2. Conecta con Rodrigo",
        description: "Usa nuestra IA para negociar detalles, verificar disponibilidad y asegurar el mejor precio al instante."
    },
    {
        icon: ShieldCheck,
        title: "3. Reserva Segura",
        description: "Realiza el pago a través de nuestra pasarela protegida. El artista recibe el pago solo después del show."
    }
];

export const HowItWorks = () => {
    return (
        <section className="py-20 px-4 md:px-10 bg-background relative z-10">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">Cómo funciona Musikeeo</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Tres pasos sencillos para llevar la mejor música en vivo a tu evento.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="bg-surface p-8 rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-2"
                        >
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-background transition-colors text-primary">
                                <step.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 font-heading">{step.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
