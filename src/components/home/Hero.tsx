import { useState } from 'react';
import { Search, Mic2, Calendar, ShoppingBag, Plus, MessageSquare, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const quickActions = [
    {
        label: 'Artistas',
        emoji: '🎤',
        to: '/discover',
        color: 'bg-white/5 hover:bg-white/10 border-white/10',
        textColor: 'text-white',
        icon: <Mic2 size={22} />,
    },
    {
        label: 'Eventos',
        emoji: '📅',
        to: '/eventos',
        color: 'bg-white/5 hover:bg-white/10 border-white/10',
        textColor: 'text-white',
        icon: <Calendar size={22} />,
    },
    {
        label: 'Marketplace',
        emoji: '🛒',
        to: '/market',
        color: 'bg-white/5 hover:bg-white/10 border-white/10',
        textColor: 'text-white',
        icon: <ShoppingBag size={22} />,
    },
    {
        label: 'Publicar',
        emoji: '🎸',
        to: '/market/create',
        color: 'bg-primary/10 hover:bg-primary/20 border-primary/30',
        textColor: 'text-primary',
        icon: <Plus size={22} />,
    },
    {
        label: 'Comunidad',
        emoji: '💬',
        to: '/feed',
        color: 'bg-white/5 hover:bg-white/10 border-white/10',
        textColor: 'text-white',
        icon: <MessageSquare size={22} />,
    },
    {
        label: 'Rodrigo AI',
        emoji: '⚡',
        to: '/rodrigo',
        color: 'bg-white/5 hover:bg-white/10 border-white/10',
        textColor: 'text-white',
        icon: <Zap size={22} />,
    },
];

export const Hero = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        const q = encodeURIComponent(searchQuery.trim());
        navigate(`/discover?q=${q}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <section className="px-4 pt-24 pb-10 md:pt-32 md:pb-16 max-w-2xl mx-auto md:max-w-4xl">

            {/* Compact header */}
            <div className="mb-7 md:mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-4">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Conecta. Crea. Suena.
                </div>
                <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight font-heading">
                    La red musical de{' '}
                    <span className="text-primary">España</span>
                </h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                    Artistas, técnicos, promotores y tiendas — todo en un solo lugar.
                </p>
            </div>

            {/* Search bar */}
            <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 h-14 focus-within:border-primary/50 transition-colors">
                    <Search className="text-gray-500 flex-none" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="¿Qué buscas? (artistas, equipos, eventos...)"
                        className="bg-transparent flex-1 text-white placeholder-gray-500 text-base outline-none h-full"
                    />
                    {searchQuery.trim() && (
                        <button
                            onClick={handleSearch}
                            className="flex-none h-9 px-4 rounded-lg bg-primary text-black text-sm font-bold transition-all hover:opacity-90"
                        >
                            Buscar
                        </button>
                    )}
                </div>
            </div>

            {/* Quick-action grid */}
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
                {quickActions.map((action) => (
                    <Link
                        key={action.to}
                        to={action.to}
                        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 md:p-5 transition-all active:scale-95 ${action.color}`}
                    >
                        <span className={`${action.textColor}`}>{action.icon}</span>
                        <span className={`text-xs font-semibold leading-tight text-center ${action.textColor}`}>
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Marketplace CTA strip — desktop gets it inline, mobile below grid */}
            <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-gray-500 text-xs mb-3 text-center font-medium uppercase tracking-wide">
                    ¿Tienes equipo que vender o alquilar?
                </p>
                <div className="flex gap-3">
                    <Link
                        to="/market"
                        className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <ShoppingBag size={15} /> Ver marketplace
                    </Link>
                    <Link
                        to="/market/create"
                        className="flex-1 h-11 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Plus size={15} /> Publicar anuncio
                    </Link>
                </div>

                {/* Quick categories */}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {[
                        { label: '🎸 Guitarras', cat: 'guitarras' },
                        { label: '🎹 Teclados', cat: 'teclados' },
                        { label: '🥁 Batería', cat: 'bateria' },
                        { label: '🎤 PA/Sonido', cat: 'pa_sonido' },
                        { label: '🎒 Accesorios', cat: 'accesorios' },
                    ].map(({ label, cat }) => (
                        <Link
                            key={cat}
                            to={`/market?category=${cat}`}
                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 text-xs font-medium transition-colors"
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </div>

        </section>
    );
};
