import type { PublishEventState } from '../PublishEventPage';
import { Button } from '../../../../components/ui/button';
import { EventCard } from '../../../../components/events/EventCard';
import type { MusikeeoEvent } from '../../../../services/eventsData';
import { Check, Edit2 } from 'lucide-react';
// useState removed as isPublishing is now a prop

interface StepProps {
    data: PublishEventState;
    onPublish: () => void;
    onPrev: () => void;
    isPublishing: boolean;
}

export default function Step3Review({ data, onPublish, onPrev, isPublishing }: StepProps) {
    // Local state removed, using parent state


    // Transform form data to EventCard preview format
    const previewEvent: MusikeeoEvent = {
        id: 'preview',
        title: data.title || 'Título del Evento',
        description: data.description,
        type: (data.type || 'Evento') as any,
        date: data.date || new Date().toISOString(),
        location: data.location || 'Ubicación',
        city: data.location?.split(',')[0] || 'Ciudad',
        budget: data.budget || 0,
        currency: 'EUR',
        imageUrl: data.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80',
        tags: data.artistType,
        visibilityScore: 100,
        createdAt: new Date().toISOString(),
        artistType: data.artistType.length > 0 ? data.artistType : ['Musician'],
        time: data.startTime || '20:00',
        organizerName: 'Organizador',
        organizerId: 'preview-organizer',
        verified: false
    };

    return (
        <div className="space-y-8">

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Preview Column */}
                    <div className="flex-1 space-y-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            Vista Previa del Anuncio
                            <span className="text-xs font-normal text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">Así lo verán los artistas</span>
                        </h3>

                        <div className="max-w-sm mx-auto md:mx-0 pointer-events-none opacity-90 scale-95 origin-top-left">
                            <EventCard event={previewEvent} />
                        </div>
                    </div>

                    {/* Summary Column */}
                    <div className="flex-1 space-y-6">
                        <h3 className="text-white font-bold">Resumen de Datos</h3>

                        <dl className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-gray-400">Título</dt>
                                <dd className="text-white font-medium text-right">{data.title}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-gray-400">Tipo</dt>
                                <dd className="text-white font-medium text-right">{data.type}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-gray-400">Talento</dt>
                                <dd className="text-white font-medium text-right">{data.artistType.join(', ')}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-gray-400">Presupuesto</dt>
                                <dd className="text-white font-medium text-right">
                                    {data.budget.toLocaleString()} EUR
                                    {data.negotiable && <span className="block text-xs text-brand-yellow font-normal">Negociable</span>}
                                </dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-gray-400">Fecha</dt>
                                <dd className="text-white font-medium text-right">{data.date} • {data.startTime}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-gray-400">Ubicación</dt>
                                <dd className="text-white font-medium text-right">{data.location}</dd>
                            </div>
                        </dl>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onPrev} className="flex-1 border-white/10 text-white hover:bg-white/5">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="w-full md:w-auto bg-brand-yellow text-brand-black font-bold h-14 px-10 text-lg hover:bg-brand-warm shadow-lg shadow-brand-yellow/20"
                >
                    {isPublishing ? (
                        <span className="animate-pulse">Publicando...</span>
                    ) : (
                        <>
                            Publicar Anuncio Ahora <Check className="ml-2 w-5 h-5" />
                        </>
                    )}
                </Button>
            </div>

        </div>
    );
}
