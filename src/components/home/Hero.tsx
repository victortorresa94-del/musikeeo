import { useState } from 'react';
import { Search, Mic2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Hero = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <section className="relative min-h-[80vh] flex items-center justify-center px-4 md:px-10 overflow-hidden pt-20">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 z-10"></div>
                <div
                    className="w-full h-full bg-cover bg-center bg-black"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop')",
                        filter: "saturate(1.2) contrast(1.1)"
                    }}
                ></div>
            </div>

            <div className="relative z-20 flex flex-col items-center text-center max-w-3xl mx-auto gap-6 pt-10">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    La nueva era del booking
                </div>

                {/* Heading */}
                <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] tracking-tight font-heading drop-shadow-2xl">
                    Todo lo que la música necesita<span className="text-primary">.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-gray-300 text-base md:text-xl max-w-xl font-light leading-relaxed">
                    Compra, alquila o presta equipo. Encuentra músicos y técnicos cerca de ti.
                </p>

                {/* Main Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <Link
                        to="/discover"
                        className="h-14 px-8 rounded-lg bg-primary hover:bg-primary/90 text-black text-base font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(130,255,31,0.4)] hover:shadow-[0_0_30px_rgba(130,255,31,0.6)] hover:-translate-y-1"
                    >
                        <Search size={20} className="stroke-[3]" />
                        Buscar artistas
                    </Link>
                    <Link
                        to="/panel/perfil"
                        className="h-14 px-8 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white text-base font-bold flex items-center justify-center gap-2 backdrop-blur-sm transition-all hover:-translate-y-1"
                    >
                        <Mic2 size={20} />
                        Soy músico
                    </Link>
                </div>

                {/* Single search pill */}
                <div className="w-full max-w-xl">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-5 h-14 focus-within:border-primary/50 transition-colors shadow-xl">
                        <Search className="text-gray-500 flex-none" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Jazz, DJ, sonido, mariachi..."
                            className="bg-transparent flex-1 text-white placeholder-gray-500 text-sm outline-none h-full"
                        />
                        {searchQuery.trim() && (
                            <button
                                onClick={handleSearch}
                                className="flex-none h-9 px-4 rounded-full bg-primary text-black text-sm font-bold transition-all hover:opacity-90"
                            >
                                Buscar
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
};
