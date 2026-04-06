import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    collection, query, where, orderBy, limit,
    getDocs, startAfter, type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Plus, Zap, MapPin, MessageSquare, Phone, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Listing, ListingCategory } from '../../types';

const CATEGORIES: { value: ListingCategory | 'all'; label: string; emoji: string }[] = [
    { value: 'all', label: 'Todo', emoji: '🎵' },
    { value: 'guitarras', label: 'Guitarras', emoji: '🎸' },
    { value: 'bajos', label: 'Bajos', emoji: '🎸' },
    { value: 'teclados', label: 'Teclados', emoji: '🎹' },
    { value: 'bateria', label: 'Batería', emoji: '🥁' },
    { value: 'pa_sonido', label: 'PA / Sonido', emoji: '🎤' },
    { value: 'accesorios', label: 'Accesorios', emoji: '🎒' },
    { value: 'iluminacion', label: 'Iluminación', emoji: '💡' },
    { value: 'recording', label: 'Grabación', emoji: '🎙️' },
    { value: 'viento', label: 'Viento', emoji: '🎺' },
    { value: 'partituras', label: 'Partituras', emoji: '📄' },
    { value: 'otros', label: 'Otros', emoji: '📦' },
];

const TYPE_LABELS: Record<string, string> = {
    venta: 'VENTA', alquiler: 'ALQUILER', prestamo: 'PRÉSTAMO'
};

const TYPE_COLORS: Record<string, string> = {
    venta: 'bg-blue-500/20 text-blue-300',
    alquiler: 'bg-purple-500/20 text-purple-300',
    prestamo: 'bg-green-500/20 text-green-300',
};

const PAGE_SIZE = 20;

export default function Market() {
    const navigate = useNavigate();
    const location = useLocation();

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ListingCategory | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'venta' | 'alquiler' | 'prestamo'>('all');
    const [urgentOnly, setUrgentOnly] = useState(false);
    const [locationFilter, setLocationFilter] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [contactListing, setContactListing] = useState<Listing | null>(null);

    const [toast, setToast] = useState<string>(location.state?.toast || '');
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(''), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const fetchListings = useCallback(async (reset = false) => {
        if (reset) setLoading(true); else setLoadingMore(true);
        try {
            const q = reset
                ? query(
                    collection(db, 'listings'),
                    where('available', '==', true),
                    orderBy('urgent', 'desc'),
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE)
                )
                : query(
                    collection(db, 'listings'),
                    where('available', '==', true),
                    orderBy('urgent', 'desc'),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(PAGE_SIZE)
                );

            const snap = await getDocs(q);
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
            setListings(prev => reset ? docs : [...prev, ...docs]);
            setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (err) {
            console.error('Error fetching listings:', err);
        } finally {
            if (reset) setLoading(false); else setLoadingMore(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastDoc]);

    useEffect(() => { fetchListings(true); }, []);

    // Read URL query param for category (from Home quick categories)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cat = params.get('category');
        if (cat) setCategoryFilter(cat as ListingCategory);
    }, [location.search]);

    const filtered = listings.filter(l => {
        if (typeFilter !== 'all' && l.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
        if (urgentOnly && !l.urgent) return false;
        if (locationFilter && !l.userLocation?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
        if (maxPrice && l.type !== 'prestamo' && l.price > Number(maxPrice)) return false;
        if (searchText && !l.title.toLowerCase().includes(searchText.toLowerCase())) return false;
        return true;
    });

    const formatPrice = (l: Listing) => {
        if (l.type === 'prestamo') return 'Préstamo gratuito';
        const unit = l.type === 'alquiler' && l.priceUnit ? `/${l.priceUnit === 'dia' ? 'día' : 'semana'}` : '';
        return `${l.price}€${unit}`;
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5 animate-fade-in-up pb-24">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-black font-bold px-6 py-3 rounded-xl shadow-lg"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Mercado</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Compra, alquila o presta equipo</p>
                </div>
                <Button
                    className="bg-primary text-black hover:bg-primary/90 font-bold h-10 px-4"
                    onClick={() => navigate('/market/create')}
                >
                    <Plus className="h-4 w-4 mr-1.5" /> Publicar
                </Button>
            </div>

            {/* Search + filter toggle */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar guitarra, micro, correa..."
                        className="pl-10 bg-white/5 border-white/10 h-11"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(v => !v)}
                    className={`border-white/10 h-11 w-11 shrink-0 ${showFilters ? 'bg-primary/10 border-primary/50 text-primary' : 'hover:bg-white/5'}`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
                {CATEGORIES.map(c => (
                    <button
                        key={c.value}
                        onClick={() => setCategoryFilter(c.value)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                            categoryFilter === c.value
                                ? 'bg-primary text-black border-primary'
                                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                        }`}
                    >
                        <span>{c.emoji}</span> {c.label}
                    </button>
                ))}
            </div>

            {/* Filters panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-surface border border-white/10 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="col-span-2 md:col-span-1 space-y-1">
                                <label className="text-xs font-medium text-gray-400">Tipo</label>
                                <select
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
                                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-white focus:outline-none"
                                >
                                    <option value="all" className="bg-[#1a1a1a]">Todos</option>
                                    <option value="venta" className="bg-[#1a1a1a]">Venta</option>
                                    <option value="alquiler" className="bg-[#1a1a1a]">Alquiler</option>
                                    <option value="prestamo" className="bg-[#1a1a1a]">Préstamo</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Ciudad</label>
                                <Input
                                    value={locationFilter}
                                    onChange={e => setLocationFilter(e.target.value)}
                                    placeholder="Barcelona..."
                                    className="h-9 bg-white/5 border-white/10 text-white text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Precio máx. (€)</label>
                                <Input
                                    type="number"
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)}
                                    placeholder="Sin límite"
                                    className="h-9 bg-white/5 border-white/10 text-white text-sm"
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <button
                                    onClick={() => setUrgentOnly(v => !v)}
                                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${urgentOnly ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-gray-400'}`}
                                >
                                    <Zap size={14} /> Solo urgentes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-4xl mb-3">🎸</p>
                    <p className="font-medium text-white">No hay anuncios todavía</p>
                    <p className="text-sm mt-1">¡Sé el primero en publicar!</p>
                    <Button className="mt-4 bg-primary text-black font-bold" onClick={() => navigate('/market/create')}>
                        Publicar anuncio
                    </Button>
                </div>
            ) : (
                <>
                    <p className="text-xs text-gray-500">{filtered.length} anuncio{filtered.length !== 1 ? 's' : ''}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(listing => (
                            <motion.div
                                key={listing.id}
                                whileHover={{ y: -2 }}
                                className="bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-colors flex flex-col"
                            >
                                <div className="aspect-square bg-white/5 relative overflow-hidden">
                                    {listing.images?.[0] ? (
                                        <img src={listing.images[0]} alt={listing.title} loading="lazy" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🎵</div>
                                    )}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {listing.urgent && (
                                            <span className="bg-[#82FF1F] text-black text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                <Zap size={8} className="fill-current" /> URGENTE
                                            </span>
                                        )}
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[listing.type]}`}>
                                            {TYPE_LABELS[listing.type]}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col gap-1.5 flex-1">
                                    <p className="text-white text-sm font-bold leading-tight line-clamp-2">{listing.title}</p>
                                    <p className="text-primary font-black text-sm">{formatPrice(listing)}</p>
                                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <MapPin size={10} />
                                        <span className="truncate">{listing.userLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto pt-1">
                                        {listing.userAvatar ? (
                                            <img src={listing.userAvatar} alt="" loading="lazy" className="w-5 h-5 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                                                {listing.userName?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-gray-500 text-xs truncate flex-1">{listing.userName}</span>
                                    </div>
                                    <button
                                        onClick={() => setContactListing(listing)}
                                        className="w-full mt-1 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                                    >
                                        Contactar
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {hasMore && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                onClick={() => fetchListings(false)}
                                disabled={loadingMore}
                                className="border-white/10 hover:bg-white/5"
                            >
                                {loadingMore ? 'Cargando...' : 'Ver más'}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Contact Modal */}
            <AnimatePresence>
                {contactListing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setContactListing(null)}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-white font-bold">Contactar vendedor</h3>
                                    <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{contactListing.title}</p>
                                </div>
                                <button onClick={() => setContactListing(null)} className="text-gray-500 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        navigate(`/messages?userId=${contactListing.userId}&ref=${contactListing.id}`);
                                        setContactListing(null);
                                    }}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 transition-colors text-left w-full"
                                >
                                    <div className="p-2 rounded-lg bg-primary/20">
                                        <MessageSquare size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Mensaje en Musikeeo</p>
                                        <p className="text-gray-500 text-xs">Escríbele desde la plataforma</p>
                                    </div>
                                </button>
                                {contactListing.userWhatsApp && (
                                    <a
                                        href={`https://wa.me/${contactListing.userWhatsApp}?text=${encodeURIComponent(`Hola, vi tu anuncio "${contactListing.title}" en Musikeeo 🎸`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors"
                                    >
                                        <div className="p-2 rounded-lg bg-green-500/20">
                                            <Phone size={18} className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">WhatsApp</p>
                                            <p className="text-gray-500 text-xs">Contacto directo</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
