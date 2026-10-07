import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight, ArrowUpRight, Search, Plus, MapPin, BadgeCheck, Sparkles,
    Guitar, Piano, Drum, Mic, Speaker, Headphones, Lightbulb, Wind,
    UserPlus, MessagesSquare, Music2, Instagram, Mail,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { getArtists } from '../../services/artistService';
import { useAuth } from '../../context/AuthContext';
import type { Artist, Listing } from '../../types';

// ─── Contenido ───────────────────────────────────────────────────────────────

const ROTATING_WORDS = ['músicos', 'técnicos', 'salas', 'DJs', 'equipo'];

const QUICK_SEARCHES = [
    { label: 'Banda para boda', to: '/discover?q=boda' },
    { label: 'DJ', to: '/discover?q=dj' },
    { label: 'Técnico de sonido', to: '/sonido' },
    { label: 'Alquilar PA', to: '/market?category=pa_sonido' },
];

const MARQUEE = ['Rock', 'Flamenco', 'Jazz', 'DJs', 'Técnicos de sonido', 'Salas', 'Backline', 'Bodas', 'Indie', 'Rumba', 'Iluminación', 'Festivales', 'Pop', 'Clásica'];

const ROLES = [
    {
        title: 'Músicos y bandas',
        desc: 'Un perfil profesional con tu música, vídeos y precios. Que te encuentren quienes buscan directo.',
        img: '/images/home/role-musico.webp',
        to: '/artistas',
        cta: 'Ver artistas',
        className: 'md:col-span-2 md:row-span-2 min-h-[320px] md:min-h-[520px]',
    },
    {
        title: 'DJs',
        desc: 'Sesiones para bodas, clubs y eventos privados.',
        img: '/images/home/role-dj.webp',
        to: '/discover?q=dj',
        cta: 'Encontrar DJ',
        className: 'min-h-[250px]',
    },
    {
        title: 'Técnicos',
        desc: 'Sonido, luces y backline para que todo suene.',
        img: '/images/home/role-tecnico.webp',
        to: '/sonido',
        cta: 'Ver técnicos',
        className: 'min-h-[250px]',
    },
    {
        title: 'Salas y promotores',
        desc: 'Publica tu fecha y recibe propuestas de artistas.',
        img: '/images/home/role-sala.webp',
        to: '/eventos',
        cta: 'Ver eventos',
        className: 'min-h-[250px]',
    },
    {
        title: 'Tiendas',
        desc: 'Vende y alquila equipo a músicos de tu zona.',
        img: '/images/home/role-tienda.webp',
        to: '/market',
        cta: 'Ir al mercado',
        className: 'min-h-[250px]',
    },
];

const GEAR_CATEGORIES = [
    { label: 'Guitarras', cat: 'guitarras', Icon: Guitar },
    { label: 'Teclados', cat: 'teclados', Icon: Piano },
    { label: 'Batería', cat: 'bateria', Icon: Drum },
    { label: 'PA y sonido', cat: 'pa_sonido', Icon: Speaker },
    { label: 'Grabación', cat: 'recording', Icon: Mic },
    { label: 'Iluminación', cat: 'iluminacion', Icon: Lightbulb },
    { label: 'Viento', cat: 'viento', Icon: Wind },
    { label: 'Accesorios', cat: 'accesorios', Icon: Headphones },
];

const STEPS = [
    { Icon: UserPlus, title: 'Crea tu perfil', desc: 'Gratis y en un minuto. Músico, técnico, sala o tienda.' },
    { Icon: Search, title: 'Encuentra o haz que te encuentren', desc: 'Busca por ciudad, estilo o fecha. Tu perfil trabaja por ti.' },
    { Icon: MessagesSquare, title: 'Cierra el trato directo', desc: 'Habla sin intermediarios ni comisiones ocultas. Y a sonar.' },
];

const RODRIGO_CHAT = [
    { from: 'user', text: 'Busco banda para una boda en Sevilla el 14 de junio, 1.500 € aprox.' },
    { from: 'rodrigo', text: 'Tengo 3 bandas de rumba y pop disponibles esa fecha dentro de tu presupuesto. ¿Te paso sus perfiles?' },
];

const TYPE_LABELS: Record<string, string> = { venta: 'Venta', alquiler: 'Alquiler', prestamo: 'Préstamo' };

const formatPrice = (l: Listing) => {
    if (l.type === 'prestamo') return 'Gratis';
    const unit = l.type === 'alquiler' && l.priceUnit ? `/${l.priceUnit === 'dia' ? 'día' : 'semana'}` : '';
    return `${l.price}€${unit}`;
};

// ─── Animación ───────────────────────────────────────────────────────────────

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const Reveal = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
    <motion.div
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        transition={{ delay }}
    >
        {children}
    </motion.div>
);

const SectionTitle = ({ kicker, title, action }: { kicker: string; title: string; action?: React.ReactNode }) => (
    <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
        <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">{kicker}</p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tighter leading-[1.05] text-foreground">{title}</h2>
        </div>
        {action}
    </div>
);

// Barras de ecualizador decorativas
const Equalizer = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-end gap-[3px] h-5 ${className}`} aria-hidden>
        {[0.6, 1, 0.45, 0.85, 0.7].map((h, i) => (
            <motion.span
                key={i}
                className="w-[3px] rounded-full bg-primary"
                animate={{ height: [`${h * 40}%`, '100%', `${h * 30}%`, `${h * 90}%`] }}
                transition={{ duration: 1.1 + i * 0.15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            />
        ))}
    </div>
);

// ─── Secciones ───────────────────────────────────────────────────────────────

const Hero = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [q, setQ] = useState('');
    const [wordIdx, setWordIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setWordIdx(i => (i + 1) % ROTATING_WORDS.length), 2200);
        return () => clearInterval(t);
    }, []);

    const onSearch = (e: FormEvent) => {
        e.preventDefault();
        navigate(`/discover${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    };

    return (
        <section className="relative isolate overflow-hidden min-h-[calc(100svh-3.5rem)] flex items-center">
            {/* Fondo: foto de concierto + capas de color */}
            <img
                src="/images/home/hero-band.webp"
                alt=""
                className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center] opacity-50 scale-105"
                fetchPriority="high"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/30" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/40" />
            <div className="absolute -top-40 -left-40 -z-10 h-[520px] w-[520px] rounded-full bg-primary/20 blur-[140px]" />

            <div className="w-full max-w-6xl mx-auto px-4 md:px-10 py-16 md:py-24">
                <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="max-w-3xl">
                    <motion.div variants={fadeUp} className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-1.5 mb-8">
                        <Equalizer />
                        <span className="text-xs font-semibold text-foreground/80 tracking-wide">La red de la música en directo en España</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="font-heading font-bold tracking-tightest leading-[0.95] text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] text-foreground">
                        Conecta con
                        <br />
                        <span className="relative inline-flex h-[1.05em] overflow-hidden align-bottom">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={ROTATING_WORDS[wordIdx]}
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '-100%' }}
                                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-primary"
                                >
                                    {ROTATING_WORDS[wordIdx]}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                        <br />
                        cerca de ti<span className="text-primary">.</span>
                    </motion.h1>

                    <motion.p variants={fadeUp} className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                        Encuentra artistas para tu evento, consigue bolos, alquila equipo. Todo en un sitio, sin intermediarios.
                    </motion.p>

                    {/* Buscador */}
                    <motion.form variants={fadeUp} onSubmit={onSearch} className="mt-8 flex items-center gap-2 p-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-white/10 max-w-xl shadow-2xl shadow-black/40">
                        <Search className="ml-3 h-5 w-5 text-muted-foreground shrink-0" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Banda de rock, DJ, técnico de sonido…"
                            className="flex-1 min-w-0 bg-transparent h-11 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                            aria-label="Buscar en Musikeeo"
                        />
                        <button type="submit" className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shrink-0">
                            Buscar
                        </button>
                    </motion.form>

                    <motion.div variants={fadeUp} className="mt-4 flex flex-wrap gap-2">
                        {QUICK_SEARCHES.map(s => (
                            <Link key={s.label} to={s.to} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-foreground/80 hover:border-primary/50 hover:text-primary transition-colors">
                                {s.label}
                            </Link>
                        ))}
                    </motion.div>

                    <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3">
                        {user ? (
                            <Link to="/panel" className="group h-14 px-7 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_40px_var(--primary-glow)]">
                                Ir a mi panel <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        ) : (
                            <Link to="/register" className="group h-14 px-7 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_40px_var(--primary-glow)]">
                                Crear perfil gratis <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        )}
                        <Link to="/discover" className="h-14 px-7 rounded-2xl border border-white/15 bg-white/5 backdrop-blur text-foreground font-bold text-base flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                            Explorar sin cuenta
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

const Marquee = () => (
    <div className="relative overflow-hidden bg-primary py-4 -rotate-1 scale-[1.02] my-6" aria-hidden>
        <motion.div
            className="flex w-max gap-8 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
            {[...MARQUEE, ...MARQUEE].map((w, i) => (
                <span key={i} className="flex items-center gap-8 font-heading font-bold uppercase text-xl md:text-2xl tracking-tight text-primary-foreground">
                    {w} <Music2 className="h-5 w-5 opacity-60" />
                </span>
            ))}
        </motion.div>
    </div>
);

const Roles = () => (
    <section className="px-4 md:px-10 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
            <Reveal>
                <SectionTitle kicker="Para todo el directo" title="Un sitio para cada parte del escenario." />
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4">
                {ROLES.map((r, i) => (
                    <Reveal key={r.title} delay={i * 0.06} className={r.className}>
                        <Link to={r.to} className="group relative block h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-card">
                            <img src={r.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/5" />
                            <div className="relative h-full flex flex-col justify-end p-5 md:p-6">
                                <h3 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-white">{r.title}</h3>
                                <p className="mt-1 text-sm text-white/70 max-w-sm leading-relaxed">{r.desc}</p>
                                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                                    {r.cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </span>
                            </div>
                        </Link>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

const ArtistsRow = () => {
    const [artists, setArtists] = useState<Artist[]>([]);

    useEffect(() => {
        getArtists().then(list => {
            // Primero perfiles más completos y con foto
            const sorted = [...list]
                .filter(a => a.artistName)
                .sort((a, b) => Number(!!b.profilePhoto) - Number(!!a.profilePhoto) || (b.profileCompleteness ?? 0) - (a.profileCompleteness ?? 0));
            setArtists(sorted.slice(0, 8));
        });
    }, []);

    // Sin artistas reales no mostramos relleno falso
    if (artists.length === 0) return null;

    return (
        <section className="py-16 md:py-24 border-t border-white/5">
            <div className="max-w-6xl mx-auto px-4 md:px-10">
                <Reveal>
                    <SectionTitle
                        kicker="En Musikeeo"
                        title="Artistas que ya están sonando."
                        action={<Link to="/artistas" className="hidden sm:inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline shrink-0">Ver todos <ArrowRight className="h-4 w-4" /></Link>}
                    />
                </Reveal>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory px-4 md:px-[max(2.5rem,calc((100%-72rem)/2+2.5rem))] pb-2">
                {artists.map(a => {
                    const img = a.profilePhoto || a.coverPhoto || a.multimedia?.photos?.[0]?.url;
                    return (
                        <Link
                            key={a.id}
                            to={a.slug ? `/artist/${a.slug}` : `/profile/${a.userId}`}
                            className="group snap-start shrink-0 w-[220px] md:w-[260px] rounded-3xl overflow-hidden border border-white/10 bg-card hover:border-primary/40 transition-colors"
                        >
                            <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                                {img ? (
                                    <img src={img} alt={a.artistName} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                                        <span className="font-heading text-6xl font-bold text-primary/70">{a.artistName.slice(0, 1)}</span>
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                {a.genres?.[0] && (
                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] font-semibold text-white">{a.genres[0]}</span>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="font-heading font-bold text-foreground truncate flex items-center gap-1.5">
                                    {a.artistName}
                                    {a.isVerified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 truncate">
                                    <MapPin className="h-3 w-3 shrink-0" /> {a.city || 'España'}
                                    {a.priceFrom ? <span className="ml-auto text-foreground font-semibold">desde {a.priceFrom}€</span> : null}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

const Gear = () => {
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
                    limit(8),
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
        <section className="px-4 md:px-10 py-16 md:py-24 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <Reveal>
                    <SectionTitle
                        kicker="Mercado"
                        title="Compra, alquila o presta equipo."
                        action={<Link to="/market" className="hidden sm:inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline shrink-0">Ver mercado <ArrowRight className="h-4 w-4" /></Link>}
                    />
                </Reveal>

                <Reveal className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3 mb-10">
                    {GEAR_CATEGORIES.map(({ label, cat, Icon }) => (
                        <Link
                            key={cat}
                            to={`/market?category=${cat}`}
                            className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-card py-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-[11px] md:text-xs font-semibold text-foreground/80 text-center leading-tight">{label}</span>
                        </Link>
                    ))}
                </Reveal>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="aspect-[4/5] rounded-3xl bg-card border border-white/10 animate-pulse" />)}
                    </div>
                ) : listings.length === 0 ? (
                    <Reveal className="relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                        <div className="relative">
                            <p className="font-heading text-2xl md:text-3xl font-bold tracking-tight">¿Tienes equipo cogiendo polvo?</p>
                            <p className="text-muted-foreground mt-2 max-w-md">Véndelo, alquílalo o préstalo a músicos de tu zona. Publicar es gratis.</p>
                        </div>
                        <Link to="/market/create" className="relative shrink-0 h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors">
                            <Plus className="h-5 w-5" /> Publicar anuncio
                        </Link>
                    </Reveal>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {listings.map((l, i) => (
                            <Reveal key={l.id} delay={i * 0.04}>
                                <Link to={`/market/${l.id}`} className="group block rounded-3xl overflow-hidden border border-white/10 bg-card hover:border-primary/40 transition-colors">
                                    <div className="relative aspect-square bg-muted overflow-hidden">
                                        {l.images?.[0] ? (
                                            <img src={l.images[0]} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center"><Guitar className="h-10 w-10 text-muted-foreground" /></div>
                                        )}
                                        <div className="absolute top-3 left-3 flex gap-1.5">
                                            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] font-semibold text-white">{TYPE_LABELS[l.type]}</span>
                                            {l.urgent && <span className="px-2.5 py-1 rounded-full bg-red-500 text-[11px] font-bold text-white">Urgente</span>}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.5em]">{l.title}</p>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <p className="font-heading text-lg font-bold text-primary tracking-tight">{formatPrice(l)}</p>
                                            {l.userLocation && <p className="text-xs text-muted-foreground truncate">{l.userLocation.split(',')[0]}</p>}
                                        </div>
                                    </div>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

const RodrigoSection = () => (
    <section className="px-4 md:px-10 py-16 md:py-24">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-card via-card to-primary/10 p-8 md:p-14">
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
            <div className="relative grid md:grid-cols-2 gap-10 md:gap-14 items-center">
                <Reveal>
                    <p className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="h-4 w-4" /> Inteligencia artificial
                    </p>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tighter leading-[1.05]">
                        Conoce a Rodrigo, tu mánager de bolsillo.
                    </h2>
                    <p className="mt-5 text-muted-foreground text-lg leading-relaxed max-w-md">
                        Cuéntale qué necesitas y te recomienda artistas, te ayuda a publicar tu evento o a poner precio a tu bolo.
                    </p>
                    <Link to="/rodrigo" className="group mt-8 inline-flex h-12 px-6 rounded-2xl bg-foreground text-background font-bold items-center gap-2 hover:opacity-90 transition-opacity">
                        Hablar con Rodrigo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Reveal>

                <Reveal delay={0.1} className="flex flex-col gap-3">
                    {RODRIGO_CHAT.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.6, duration: 0.4 }}
                            className={m.from === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[90%] flex items-end gap-2.5'}
                        >
                            {m.from === 'rodrigo' && (
                                <img src="/images/home/rodrigo.webp" alt="Rodrigo" className="h-9 w-9 rounded-full object-cover border border-primary/40 shrink-0" />
                            )}
                            <p className={m.from === 'user'
                                ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3 text-sm font-medium'
                                : 'rounded-2xl rounded-bl-md bg-background/80 border border-white/10 text-foreground px-4 py-3 text-sm'}>
                                {m.text}
                            </p>
                        </motion.div>
                    ))}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.6 }}
                        className="self-start ml-11 flex gap-1 rounded-full bg-background/80 border border-white/10 px-4 py-3"
                    >
                        {[0, 1, 2].map(i => (
                            <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                        ))}
                    </motion.div>
                </Reveal>
            </div>
        </div>
    </section>
);

const HowItWorks = () => (
    <section className="px-4 md:px-10 py-16 md:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
            <Reveal>
                <SectionTitle kicker="Cómo funciona" title="Tres pasos y a sonar." />
            </Reveal>
            <div className="grid md:grid-cols-3 gap-4">
                {STEPS.map(({ Icon, title, desc }, i) => (
                    <Reveal key={title} delay={i * 0.08} className="relative rounded-3xl border border-white/10 bg-card p-7 overflow-hidden">
                        <span className="absolute -top-4 right-4 font-heading text-[120px] font-bold leading-none text-white/[0.04] select-none">0{i + 1}</span>
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="mt-6 font-heading text-xl font-bold tracking-tight">{title}</h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">{desc}</p>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

const FinalCta = () => {
    const { user } = useAuth();
    return (
        <section className="px-4 md:px-10 pb-20 md:pb-28">
            <Reveal className="max-w-6xl mx-auto relative overflow-hidden rounded-[2rem] bg-primary px-8 py-14 md:px-16 md:py-20">
                <div className="absolute right-8 bottom-6 md:right-16 md:bottom-12 opacity-20 scale-[4] origin-bottom-right">
                    <Equalizer className="[&>span]:bg-primary-foreground" />
                </div>
                <h2 className="relative font-heading text-4xl md:text-6xl font-bold tracking-tightest leading-[0.95] text-primary-foreground max-w-2xl">
                    Tu próximo bolo empieza aquí.
                </h2>
                <p className="relative mt-5 text-primary-foreground/70 text-lg max-w-lg">
                    Crea tu perfil gratis y deja que la música haga el resto.
                </p>
                <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
                    <Link to={user ? '/panel' : '/register'} className="group h-14 px-7 rounded-2xl bg-primary-foreground text-primary font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                        {user ? 'Completar mi perfil' : 'Crear perfil gratis'} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link to="/publicar" className="h-14 px-7 rounded-2xl border-2 border-primary-foreground/20 text-primary-foreground font-bold flex items-center justify-center hover:bg-primary-foreground/5 transition-colors">
                        Busco músicos para un evento
                    </Link>
                </div>
            </Reveal>
        </section>
    );
};

const HomeFooter = () => (
    <footer className="border-t border-white/5 px-4 md:px-10 pt-14 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5">
                    <img src="/logo-musikeeo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
                    <span className="font-heading font-bold tracking-wide text-foreground">MUSIK<span className="text-primary">EEO</span></span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">La red de la música en directo. Conecta. Crea. Suena.</p>
                <div className="mt-4 flex gap-2">
                    <a href="mailto:hola@musikeeo.com" aria-label="Email" className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"><Mail className="h-4 w-4" /></a>
                    <a href="https://instagram.com/musikeeo" target="_blank" rel="noreferrer" aria-label="Instagram" className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"><Instagram className="h-4 w-4" /></a>
                </div>
            </div>
            {[
                { title: 'Explora', links: [['Artistas', '/artistas'], ['Técnicos', '/sonido'], ['Eventos', '/eventos'], ['Mercado', '/market'], ['Rodrigo IA', '/rodrigo']] },
                { title: 'Tu cuenta', links: [['Crear cuenta', '/register'], ['Entrar', '/login'], ['Publicar evento', '/publicar'], ['Publicar anuncio', '/market/create']] },
                { title: 'Legal', links: [['Aviso legal', '/aviso-legal'], ['Privacidad', '/privacidad'], ['Cookies', '/cookies'], ['Términos', '/terminos']] },
            ].map(col => (
                <div key={col.title}>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-foreground mb-4">{col.title}</p>
                    <nav className="flex flex-col gap-2.5 text-sm">
                        {col.links.map(([label, to]) => (
                            <Link key={to} to={to} className="text-muted-foreground hover:text-primary transition-colors">{label}</Link>
                        ))}
                    </nav>
                </div>
            ))}
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Musikeeo</p>
            <p>Hecho con ❤ en Barcelona</p>
        </div>
    </footer>
);

// ─── Página ──────────────────────────────────────────────────────────────────

const Home = () => (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
        <Hero />
        <Marquee />
        <Roles />
        <ArtistsRow />
        <Gear />
        <RodrigoSection />
        <HowItWorks />
        <FinalCta />
        <HomeFooter />
    </div>
);

export default Home;
