import { Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import type { PublishEventState } from '../PublishEventPage';

interface RodrigoAdvisorProps {
    step: number;
    data: PublishEventState;
    update: (field: keyof PublishEventState, value: any) => void;
}

export default function RodrigoAdvisor({ step, data, update }: RodrigoAdvisorProps) {

    // AI Logic Simulation
    const getAdvice = () => {
        if (step === 1) {
            if (data.title.length > 0 && data.title.length < 10) {
                return {
                    title: "Título muy corto",
                    text: "Los anuncios con títulos descriptivos (ej: 'Banda de Jazz para Boda') reciben un 40% más de visitas.",
                    type: "warning"
                };
            }
            if (data.title && !data.location) {
                return {
                    title: "No olvides la ubicación",
                    text: "Es el factor #1 para que los músicos decidan aplicar.",
                    type: "info"
                };
            }
            return {
                title: "Consejo de Rodrigo",
                text: "Usa palabras clave en el título como el género musical o el tipo de evento para mejorar el SEO.",
                type: "default"
            };
        }

        if (step === 2) {
            if (data.budget > 0 && data.budget < 100) {
                return {
                    title: "Presupuesto bajo",
                    text: "Para este tipo de evento, el promedio suele ser mayor. Considera subirlo para atraer más talento.",
                    type: "warning"
                };
            }
            return {
                title: "Define bien el perfil",
                text: "Sé específico con los requisitos técnicos (rider) para evitar malentendidos.",
                type: "default"
            };
        }

        if (step === 3) {
            return {
                title: "Optimización SEO",
                text: "He analizado tu anuncio y puedo mejorar el título para aumentar el alcance un 15%.",
                action: "Mejorar Título",
                type: "suggestion"
            };
        }

        return { title: 'Dime qué necesitas', text: 'Estoy aquí para ayudarte.', type: 'default' };
    };

    const advice = getAdvice();

    return (
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-brand-yellow/30 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-brand-yellow/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-brand-yellow" />
            </div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center">
                        <span className="text-xl">🤖</span>
                    </div>
                    <span className="font-bold text-brand-yellow uppercase tracking-wider text-xs">Rodrigo AI Assistant</span>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        {advice.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        {advice.text}
                    </p>
                </div>

                {advice.type === 'suggestion' && (
                    <Button
                        onClick={() => update('title', `✨ ${data.title} (Optimizado)`)}
                        className="w-full bg-brand-yellow/20 hover:bg-brand-yellow/30 text-brand-yellow border border-brand-yellow/50 mt-2"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {advice.action}
                    </Button>
                )}

                {advice.type === 'warning' && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-200">⚠️ Esto podría reducir las postulaciones.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
