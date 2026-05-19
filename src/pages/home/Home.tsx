import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    collection, query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { Search, ShoppingBag, Plus, UserPlus, Network, Sparkles, Music2, SlidersHorizontal, Building2, Store } from 'lucide-react';
import { db } from '../../lib/firebase';
import type { Listing } from '../../types';

const CHIP_CATEGORIES = [
    { label: 'Guitarras', cat: 'guitarras', emoji: '🎸' },
    { label: 'Teclados', cat: 'teclados', emoji: '🎹' },
    { label: 'Batería', cat: 'bateria', emoji: '🥁' },
    { label: 'PA Sonido', cat: 'pa_sonido', emoji: '🎤' },
    { label: 'Accesorios', cat: 'accesorios', emoji: '🎒' },
    { label: 'Viento', cat: 'viento', emoji: '🎺' },
];

const STEPS = [
    { Icon: UserPlus, title: 'Crea tu perfil', desc: 'Date de alta como músico, técnico, sala o tienda en menos de un minuto.' },
    { Icon: Network, title: 'Conecta con el ecosistema', desc: 'Encuentra talento, equipo y oportunidades cerca de ti.' },
    { Icon: Sparkles, title: 'Haz que pase', desc: 'Cierra el trato directamente, sin intermediarios. Conecta. Crea. Suena.' },
];

const PROFESSIONALS = [
    { Icon: Music2, title: 'Músicos', desc: 'Consigue bolos y muestra tu talento.', to: '/discover' },
    { Icon: SlidersHorizontal, title: 'Técnicos', desc: 'Ofrece sonido, luces y backline.', to: '/discover' },
    { Icon: Building2, title: 'Salas', desc: 'Llena tu agenda con artistas verificados.', to: '/discover' },
    { Icon: Store, title: 'Tiendas', desc: 'Vende y alquila equipo en el marketplace.', to: '/market' },
];

const formatPrice = (l: Listing) => {
    if (l.type === 'prestamo') return 'Préstamo gratuito';
    const unit = l.type === 'alquiler' && l.priceUnit ? `/${l.priceUnit === 'dia' ? 'día' : l.priceUnit === 'semana' ? 'semana' : ''}` : '';
    return `${l.price}€${unit}`;
};

const TYPE_LABELS: Record<string, string> = { venta: 'VENTA', alquiler: 'ALQUILER', prestamo: 'PRÉSTAMO' };

const Home = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDocs(query(
                    collection(db, 'listings'),
                    where('available', '==', true),
                    orderBy('urgent', 'desc'),
                    orderBy('createdAt', 'desc'),
                    limit(6),
                ));
                setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
            } catch (err) {
                console.error('Error fetching home listings:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="dark min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
            <main>
                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="relative overflow-hidden px-4 md:px-10 pt-24 pb-16 md:pt-32 md:pb-24">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(130,255,31,0.12),transparent_60%)]" />
                    <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
                        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight">
                            Todo lo que la música necesita<span className="text-primary">.</span>
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-xl">
                            Compra, alquila o presta equipo. Encuentra músicos y técnicos cerca de ti.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <Link
                                to="/discover"
                                className="h-12 px-6 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                            >
                                <Search size={18} /> Buscar artistas
                            </Link>
                            <Link
                                to="/market"
                                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_0_24px_rgba(130,255,31,0.4)]"
                            >
                                <ShoppingBag size={18} /> Ver marketplace
                            </Link>
                            <Link
                                to="/market/create"
                                className="h-12 px-6 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                            >
                                <Plus size={18} /> Publicar anuncio
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Categorías (chips scroll) ────────────────────────── */}
                <section className="px-4 md:px-10 pb-12">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                            {CHIP_CATEGORIES.map(({ label, cat, emoji }) => (
                                <Link
                                    key={cat}
                                    to={`/market?category=${cat}`}
                                    className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 text-sm font-medium transition-all"
                                >
                                    <span>{emoji}</span> {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Cómo funciona ────────────────────────────────────── */}
                <section className="px-4 md:px-10 py-12 md:py-16">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="font-heading text-2xl md:text-3xl font-black text-center mb-10">Cómo funciona</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {STEPS.map(({ Icon, title, desc }, i) => (
                                <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        <Icon size={22} />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-2">{i + 1}. {title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Listings reales ──────────────────────────────────── */}
                <section className="px-4 md:px-10 py-12 md:py-16">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-end justify-between mb-8">
                            <h2 className="font-heading text-2xl md:text-3xl font-black">Equipo recién publicado</h2>
                            <Link to="/market" className="text-primary text-sm font-bold hover:underline shrink-0">Ver todo →</Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="aspect-[4/5] rounded-2xl bg-card border border-border animate-pulse" />
                                ))}
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="bg-card border border-border rounded-2xl py-16 px-6 text-center">
                                <p className="text-4xl mb-3">🎸</p>
                                <p className="font-bold text-foreground">Aún no hay anuncios</p>
                                <p className="text-muted-foreground text-sm mt-1 mb-6">Sé el primero en publicar equipo en el marketplace.</p>
                                <Link
                                    to="/market/create"
                                    className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold transition-all"
                                >
                                    <Plus size={18} /> Publicar anuncio
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {listings.map(l => (
                                    <Link
                                        key={l.id}
                                        to={`/market/${l.id}`}
                                        className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors flex flex-col"
                                    >
                                        <div className="aspect-square bg-muted relative overflow-hidden">
                                            {l.images?.[0] ? (
                                                <img src={l.images[0]} alt={l.title} loading="lazy" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">🎵</div>
                                            )}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                {l.urgent && (
                                                    <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">URGENTE</span>
                                                )}
                                                <span className="bg-muted text-muted-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                    {TYPE_LABELS[l.type]}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 flex flex-col gap-1">
                                            <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{l.title}</p>
                                            <p className="text-lg font-black text-primary tracking-tighter">{formatPrice(l)}</p>
                                            <p className="text-xs text-muted-foreground truncate">{l.userLocation}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Para profesionales ───────────────────────────────── */}
                <section className="px-4 md:px-10 py-12 md:py-16">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="font-heading text-2xl md:text-3xl font-black text-center mb-10">Para profesionales</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {PROFESSIONALS.map(({ Icon, title, desc, to }) => (
                                <Link
                                    key={title}
                                    to={to}
                                    className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors flex flex-col gap-3"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{title}</h3>
                                        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Footer ───────────────────────────────────────────── */}
                <footer className="border-t border-border bg-[#0a0a0a] px-4 md:px-10 pt-12 pb-8">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                        <div className="max-w-xs">
                            <span className="font-heading font-black text-xl text-foreground">Musikeeo</span>
                            <p className="text-primary text-sm font-semibold mt-1">Conecta. Crea. Suena.</p>
                            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                                La red de música en vivo que conecta músicos, técnicos, salas y tiendas.
                            </p>
                        </div>
                        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                            <Link to="/discover" className="text-muted-foreground hover:text-primary transition-colors">Explorar</Link>
                            <Link to="/market" className="text-muted-foreground hover:text-primary transition-colors">Marketplace</Link>
                            <Link to="/eventos" className="text-muted-foreground hover:text-primary transition-colors">Eventos</Link>
                            <Link to="/rodrigo" className="text-muted-foreground hover:text-primary transition-colors">Rodrigo AI</Link>
                        </nav>
                    </div>
                    <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
                        <p>© {new Date().getFullYear()} Musikeeo. Todos los derechos reservados.</p>
                        <p>Hecho con ❤ en Barcelona, España</p>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Home;
