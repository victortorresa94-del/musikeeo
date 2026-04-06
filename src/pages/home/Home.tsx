import { ShoppingBag, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/home/Navbar';
import { Hero } from '../../components/home/Hero';
import { Footer } from '../../components/layout/Footer';

const CATEGORIES = [
    { label: '🎸 Guitarras', cat: 'guitarras' },
    { label: '🎹 Teclados', cat: 'teclados' },
    { label: '🥁 Batería', cat: 'bateria' },
    { label: '🎤 PA/Sonido', cat: 'pa_sonido' },
    { label: '🎒 Accesorios', cat: 'accesorios' },
    { label: '🎙 Grabación', cat: 'recording' },
];

const Home = () => {
    return (
        <div className="min-h-screen bg-background text-white selection:bg-brand-yellow selection:text-brand-black">
            <Navbar />
            <main>
                <Hero />

                {/* Marketplace section */}
                <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
                    <div className="text-center mb-6">
                        <h2 className="text-white text-2xl md:text-3xl font-black font-heading mb-2">
                            Mercado de equipo musical
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base">
                            Compra, alquila o presta instrumentos y equipo de sonido.
                        </p>
                    </div>

                    {/* Quick categories */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {CATEGORIES.map(({ label, cat }) => (
                            <Link
                                key={cat}
                                to={`/market?category=${cat}`}
                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/10 text-sm font-medium transition-all"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <Link
                            to="/market"
                            className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <ShoppingBag size={16} /> Ver marketplace
                        </Link>
                        <Link
                            to="/market/create"
                            className="flex-1 h-12 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <Plus size={16} /> Publicar anuncio
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Home;
