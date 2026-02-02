import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import type { Event } from '../../types';

interface EventCardProps {
    event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
    // Format Date & Time
    const dateObj = new Date(event.date);
    const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Tag Styles
    const getTagStyle = (tag: string) => {
        switch (tag) {
            case 'Urgente': return 'bg-brand-yellow text-brand-black';
            case 'Premium': return 'bg-purple-500 text-white';
            case 'Nuevo': return 'bg-blue-500 text-white';
            case 'Recurrente': return 'bg-zinc-600 text-gray-200';
            default: return 'bg-zinc-700 text-gray-300';
        }
    };

    return (
        <article className="group relative flex flex-col rounded-2xl bg-card border border-white/5 overflow-hidden hover:border-brand-yellow/30 transition-all duration-300 shadow-lg hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">

            {/* Image Section */}
            <div className="h-48 relative overflow-hidden bg-zinc-900">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Top Tags */}
                <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
                    {(event.tags || []).map(tag => (
                        <span key={tag} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm ${getTagStyle(tag)}`}>
                            {
                                tag === 'Urgente' ? '⚡ Urgente' :
                                    tag === 'Premium' ? '💎 Premium' :
                                        tag === 'Nuevo' ? '✨ Nuevo' : tag
                            }
                        </span>
                    ))}
                </div>

                <div className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <span className="text-brand-yellow font-bold text-sm">
                        €{(event.price || 0).toLocaleString()}
                    </span>
                    {/* {event.type.includes('Residencia') && <span className="text-[10px] text-gray-400">/noche</span>} */}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col gap-3">
                {/* Category */}
                <span className="text-[10px] font-bold text-brand-yellow uppercase tracking-widest opacity-80">
                    {event.type}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-white leading-tight group-hover:text-brand-yellow transition-colors line-clamp-2">
                    {event.title}
                </h3>

                {/* Meta */}
                <div className="flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4 text-brand-cyan" />
                        <span>{dateStr} • {timeStr} hrs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="h-4 w-4 text-brand-petrol" />
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-2 opacity-50 text-xs text-gray-400">
                        {/* Fake applicants avatars would go here */}
                    </div>
                    <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white group-hover:translate-x-1 transition-transform">
                        Ver más <ArrowRight className="h-4 w-4 text-brand-yellow" />
                    </button>
                </div>
            </div>
        </article>
    );
};
