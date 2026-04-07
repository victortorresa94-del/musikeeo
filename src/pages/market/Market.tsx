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

// Mock listings shown when collection is empty
const MOCK_LISTINGS: Listing[] = [
    { id: 'mock1', userId: 'mock', userName: 'Carlos G.', userLocation: 'Barcelona, España', userAvatar: undefined, userWhatsApp: undefined, title: 'Fender Stratocaster American Standard 2019', description: 'Excelente estado, con funda original y correa. Apenas tocada.', category: 'guitarras', condition: 'como_nuevo', type: 'venta', price: 850, urgent: false, available: true, shipping: true, sellerType: 'particular', images: ['https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400&q=80'], createdAt: '', updatedAt: '' },
    { id: 'mock2', userId: 'mock', userName: 'Pro Audio BCN', userLocation: 'Barcelona, España', userAvatar: undefined, userWhatsApp: '34612345678', title: 'Sistema PA QSC K12.2 + Subwoofer KSub', description: 'Alquiler por día o semana. Montaje incluido en zona BCN.', category: 'pa_sonido', condition: 'bueno', type: 'alquiler', price: 120, priceUnit: 'dia', urgent: true, available: true, shipping: false, sellerType: 'profesional', images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80'], createdAt: '', updatedAt: '' },
    { id: 'mock3', userId: 'mock', userName: 'Ana M.', userLocation: 'Madrid, España', userAvatar: undefined, userWhatsApp: undefined, title: 'Korg Minilogue XD — Syntetizador analógico', description: 'En perfectas condiciones. Incluye fuente de alimentación.', category: 'teclados', condition: 'como_nuevo', type: 'venta', price: 480, urgent: false, available: true, shipping: true, sellerType: 'particular', images: ['https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&q=80'], createdAt: '', updatedAt: '' },
    { id: 'mock4', userId: 'mock', userName: 'Drum Studio', userLocation: 'Valencia, España', userAvatar: undefined, userWhatsApp: '34698765432', title: 'Pearl Export 5 piezas — Batería completa', description: 'Batería de estudio. Disponible para préstamo a grupos en ensayo.', category: 'bateria', condition: 'bueno', type: 'prestamo', price: 0, urgent: false, available: true, shipping: false, sellerType: 'profesional', images: ['https://images.unsplash.com/photo-1461784180009-21121b2f204c?w=400&q=80'], createdAt: '', updatedAt: '' },
    { id: 'mock5', userId: 'mock', userName: 'Miguel R.', userLocation: 'Sevilla, España', userAvatar: undefined, userWhatsApp: undefined, title: 'Pedales Boss DS-1 + Boss CH-1 Chorus', description: 'Vendo pack de pedales. Funcionando perfectamente.', category: 'accesorios', condition: 'bueno', type: 'venta', price: 65, urgent: true, available: true, shipping: true, sellerType: 'particular', images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80'], createdAt: '', updatedAt: '' },
    { id: 'mock6', userId: 'mock', userName: 'RecordingHouse', userLocation: 'Madrid, España', userAvatar: undefined, userWhatsApp: '34677889900', title: 'Shure SM7B + Interface Focusrite Scarlett 2i2', description: 'Kit completo para grabación vocal. Alquiler por semana.', category: 'recording', condition: 'nuevo', type: 'alquiler', price: 80, priceUnit: 'semana', urgent: false, available: true, shipping: false, sellerType: 'profesional', images: ['https://images.unsplash.com/photo-1615247001958-f4bc92fa6a4a?w=400&q=80'], createdAt: '', updatedAt: '' },
];

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

    const displayListings = listings.length === 0 && !loading ? MOCK_LISTINGS : listings;

    const filtered = displayListings.filter(l => {
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
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mercado</h1>
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
                        className="pl-10 bg-muted border-border h-11"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(v => !v)}
                    className={`border-border h-11 w-11 shrink-0 ${showFilters ? 'bg-primary/10 border-primary/50 text-primary' : 'hover:bg-muted'}`}
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
                                : 'border-border bg-muted text-muted-foreground hover:text-foreground'
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
                        <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="col-span-2 md:col-span-1 space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                                <select
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
                                    className="w-full h-9 rounded-lg border border-border bg-muted px-2 text-sm text-foreground focus:outline-none"
                                >
                                    <option value="all" className="bg-card">Todos</option>
                                    <option value="venta" className="bg-card">Venta</option>
                                    <option value="alquiler" className="bg-card">Alquiler</option>
                                    <option value="prestamo" className="bg-card">Préstamo</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Ciudad</label>
                                <Input
                                    value={locationFilter}
                                    onChange={e => setLocationFilter(e.target.value)}
                                    placeholder="Barcelona..."
                                    className="h-9 bg-muted border-border text-foreground text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Precio máx. (€)</label>
                                <Input
                                    type="number"
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)}
                                    placeholder="Sin límite"
                                    className="h-9 bg-muted border-border text-foreground text-sm"
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <button
                                    onClick={() => setUrgentOnly(v => !v)}
                                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${urgentOnly ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}`}
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
                        <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse border border-border" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="font-medium text-foreground">Sin resultados para estos filtros</p>
                    <p className="text-sm mt-1">Prueba con otros criterios</p>
                </div>
            ) : (
                <>
                    <p className="text-xs text-muted-foreground">{filtered.length} anuncio{filtered.length !== 1 ? 's' : ''}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(listing => (
                            <motion.div
                                key={listing.id}
                                whileHover={{ y: -2 }}
                                className="bg-card border border-border rounded-xl overflow-hidden hover:border-foreground/20 transition-colors flex flex-col cursor-pointer"
                                onClick={() => navigate(`/market/${listing.id}`)}
                            >
                                <div className="aspect-square bg-muted relative overflow-hidden">
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
                                    <p className="text-foreground text-sm font-bold leading-tight line-clamp-2">{listing.title}</p>
                                    <p className="text-primary font-black text-sm">{formatPrice(listing)}</p>
                                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                        <MapPin size={10} />
                                        <span className="truncate">{listing.userLocation}</span>
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                        {listing.shipping && (
                                            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">📦 Envío</span>
                                        )}
                                        {listing.sellerType === 'profesional' && (
                                            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">🏪 Pro</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto pt-1">
                                        {listing.userAvatar ? (
                                            <img src={listing.userAvatar} alt="" loading="lazy" className="w-5 h-5 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground">
                                                {listing.userName?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-muted-foreground text-xs truncate flex-1">{listing.userName}</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setContactListing(listing); }}
                                        className="w-full mt-1 h-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors"
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
                                className="border-border hover:bg-muted"
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
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-foreground font-bold">Contactar vendedor</h3>
                                    <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{contactListing.title}</p>
                                </div>
                                <button onClick={() => setContactListing(null)} className="text-muted-foreground hover:text-foreground">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        navigate(`/messages?userId=${contactListing.userId}&ref=${contactListing.id}`);
                                        setContactListing(null);
                                    }}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-border hover:border-white/30 transition-colors text-left w-full"
                                >
                                    <div className="p-2 rounded-lg bg-primary/20">
                                        <MessageSquare size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium text-sm">Mensaje en Musikeeo</p>
                                        <p className="text-muted-foreground text-xs">Escríbele desde la plataforma</p>
                                    </div>
                                </button>
                                {contactListing.userWhatsApp && (
                                    <a
                                        href={`https://wa.me/${contactListing.userWhatsApp}?text=${encodeURIComponent(`Hola, vi tu anuncio "${contactListing.title}" en Musikeeo 🎸`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-border hover:border-green-500/50 transition-colors"
                                    >
                                        <div className="p-2 rounded-lg bg-green-500/20">
                                            <Phone size={18} className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-foreground font-medium text-sm">WhatsApp</p>
                                            <p className="text-muted-foreground text-xs">Contacto directo</p>
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
