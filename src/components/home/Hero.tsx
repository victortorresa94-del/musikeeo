import { useState } from 'react';
import { Search, MapPin, Mic2, Music, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Hero = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [city, setCity] = useState('');
    const [date, setDate] = useState('');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (city) params.set('city', city);
        if (date) params.set('date', date);

        navigate(`/artistas?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <section className="relative min-h-[85vh] flex items-center justify-center px-4 md:px-10 overflow-hidden pt-20">
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

            <div className="relative z-20 flex flex-col items-center text-center max-w-5xl mx-auto gap-8 pt-10">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    La nueva era del booking
                </div>

                {/* Heading */}
                <h1 className="text-white text-5xl sm:text-6xl md:text-7xl font-black leading-[1.1] tracking-tight font-heading drop-shadow-2xl">
                    Encuentra músicos, bandas o sonido para tu evento <span className="text-primary">— en minutos.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-gray-300 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                    La plataforma premium para conectar talento con escenarios. Desde bodas íntimas hasta festivales masivos.
                </p>

                {/* Main Actions */}
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
                    <Link
                        to="/artistas"
                        className="h-14 px-8 rounded-lg bg-primary hover:bg-primary-hover text-black text-base md:text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,216,77,0.4)] hover:shadow-[0_0_30px_rgba(255,216,77,0.6)] hover:-translate-y-1"
                    >
                        <Search size={20} className="stroke-[3]" />
                        Busco música
                    </Link>
                    <Link
                        to="/panel/perfil"
                        className="h-14 px-8 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white text-base md:text-lg font-bold flex items-center justify-center gap-2 backdrop-blur-sm transition-all hover:-translate-y-1"
                    >
                        <Mic2 size={20} />
                        Soy músico
                    </Link>
                </div>

                {/* Search Bar (Floating) */}
                <div className="w-full max-w-4xl mt-8">
                    <div className="bg-surface/80 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
                        {/* Genre/Query Input */}
                        <div className="flex-1 relative flex items-center px-4 h-14 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/5 transition-colors rounded-lg">
                            <Music className="text-gray-500 mr-3" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="¿Qué estás buscando? (Ej. Jazz, DJ, Mariachi)"
                                className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-gray-500 text-lg placeholder:text-base h-full outline-none"
                            />
                        </div>

                        {/* City Input */}
                        <div className="flex-1 relative flex items-center px-4 h-14 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/5 transition-colors rounded-lg">
                            <MapPin className="text-gray-500 mr-3" size={20} />
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ciudad o Código Postal"
                                className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-gray-500 text-lg placeholder:text-base h-full outline-none"
                            />
                        </div>

                        {/* Date Input */}
                        <div className="flex-1 relative flex items-center px-4 h-14 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/5 transition-colors rounded-lg">
                            <Calendar className="text-gray-500 mr-3" size={20} />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-gray-500 text-base h-full outline-none [color-scheme:dark]"
                            />
                        </div>

                        {/* Search Button */}
                        <div className="flex-none p-1">
                            <button
                                onClick={handleSearch}
                                className="w-full md:w-auto h-12 px-8 rounded-lg bg-primary hover:bg-primary-hover text-black font-bold transition-all hover:shadow-[0_0_20px_rgba(255,216,77,0.4)]"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 flex items-center gap-3 animate-fade-in text-sm text-muted-foreground/80">
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-gray-700"></div>
                        ))}
                    </div>
                    <p>Más de <span className="text-white font-bold">2,000+</span> artistas verificados</p>
                </div>

            </div>
        </section>
    );
};
