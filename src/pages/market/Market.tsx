import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Star, Tag, Music, Mic, Plus, Zap, Clock, Truck, Building2, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { marketService } from '../../services/marketService';
import { type MarketItem } from '../../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CATEGORIES = [
    { id: 'all', label: 'Todo' },
    { id: 'instruments', label: 'Instrumentos' },
    { id: 'recording', label: 'Estudio' },
    { id: 'services', label: 'Servicios' },
    { id: 'venues', label: 'Salas' },
];

// Mock data for Express stores
const EXPRESS_STORES = [
    {
        id: 'exp_1',
        name: 'MusicExpress BCN',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
        deliveryTime: '15-30 min',
        rating: 4.9,
        categories: ['Cables', 'Pilas', 'Accesorios'],
        isOpen: true
    },
    {
        id: 'exp_2',
        name: 'Pro Audio Store',
        image: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400&q=80',
        deliveryTime: '20-40 min',
        rating: 4.7,
        categories: ['Micrófonos', 'Cables XLR', 'Stands'],
        isOpen: true
    },
    {
        id: 'exp_3',
        name: 'Guitar Center Express',
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80',
        deliveryTime: '25-45 min',
        rating: 4.8,
        categories: ['Cuerdas', 'Púas', 'Pedales'],
        isOpen: false
    },
];

// Mock data for Rental companies
const RENTAL_COMPANIES = [
    {
        id: 'rent_1',
        name: 'SoundRent Pro',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
        priceFrom: 50,
        rating: 4.9,
        categories: ['PA Systems', 'Backline', 'Iluminación'],
        featured: true
    },
    {
        id: 'rent_2',
        name: 'BackLine Barcelona',
        image: 'https://images.unsplash.com/photo-1508854710579-5cecc3a9ff17?w=400&q=80',
        priceFrom: 35,
        rating: 4.6,
        categories: ['Amplificadores', 'Baterías', 'Teclados'],
        featured: false
    },
    {
        id: 'rent_3',
        name: 'Festival Gear',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80',
        priceFrom: 100,
        rating: 4.8,
        categories: ['Escenarios', 'Sonido Festival', 'Generadores'],
        featured: true
    },
];

export default function Market() {
    const navigate = useNavigate();
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("all");

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const data = await marketService.getItems(activeCategory);
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [activeCategory]);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            {/* Header - Mobile Optimized */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Mercado</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Equipos, servicios y espacios</p>
                    </div>
                    <Button
                        className="bg-brand-cyan text-black hover:bg-brand-cyan/90 font-bold h-10 px-4"
                        onClick={() => navigate('/market/create')}
                    >
                        <Plus className="h-4 w-4 mr-1.5" /> Vender
                    </Button>
                </div>

                {/* Search Row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar guitarra, micro, sala..."
                            className="pl-10 bg-white/5 border-white/10 h-11"
                        />
                    </div>
                    <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5 h-11 w-11 shrink-0">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5 h-11 w-11 shrink-0 relative">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-cyan rounded-full border-2 border-background text-[10px] font-bold flex items-center justify-center text-black">2</span>
                    </Button>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
                {CATEGORIES.map((cat) => (
                    <Button
                        key={cat.id}
                        variant={activeCategory === cat.id ? 'glow' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`rounded-full px-4 shrink-0 ${activeCategory !== cat.id ? 'border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white' : ''}`}
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Express Section */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                            <Zap className="h-4 w-4 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Express</h2>
                            <p className="text-xs text-muted-foreground">Entrega en minutos tipo Glovo</p>
                        </div>
                    </div>
                    <Button variant="link" className="text-brand-cyan p-0 h-auto text-sm">
                        Ver todo <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
                    {EXPRESS_STORES.map((store) => (
                        <motion.div
                            key={store.id}
                            whileHover={{ scale: 1.02 }}
                            className="min-w-[200px] md:min-w-[240px] shrink-0 bg-card border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-yellow-500/30 transition-all"
                        >
                            <div className="relative h-24">
                                <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                {store.isOpen ? (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        Abierto
                                    </div>
                                ) : (
                                    <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        Cerrado
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 right-2">
                                    <h3 className="font-bold text-white text-sm truncate">{store.name}</h3>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                        <Truck className="h-3 w-3" />
                                        <span className="font-medium">{store.deliveryTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Star className="h-3 w-3 fill-brand-lime text-brand-lime" />
                                        {store.rating}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {store.categories.slice(0, 2).map((cat, i) => (
                                        <span key={i} className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                                            {cat}
                                        </span>
                                    ))}
                                    {store.categories.length > 2 && (
                                        <span className="text-[10px] text-muted-foreground">+{store.categories.length - 2}</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Rental Section */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                            <Building2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Alquiler</h2>
                            <p className="text-xs text-muted-foreground">Empresas de alquiler de equipos</p>
                        </div>
                    </div>
                    <Button variant="link" className="text-brand-cyan p-0 h-auto text-sm">
                        Ver todo <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
                    {RENTAL_COMPANIES.map((company) => (
                        <motion.div
                            key={company.id}
                            whileHover={{ scale: 1.02 }}
                            className="min-w-[200px] md:min-w-[240px] shrink-0 bg-card border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-purple-500/30 transition-all"
                        >
                            <div className="relative h-24">
                                <img src={company.image} alt={company.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                {company.featured && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-purple-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        <Star className="h-2.5 w-2.5 fill-current" />
                                        Destacado
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 right-2">
                                    <h3 className="font-bold text-white text-sm truncate">{company.name}</h3>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1 text-purple-400 text-xs">
                                        <Clock className="h-3 w-3" />
                                        <span className="font-medium">Desde {company.priceFrom}€/día</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Star className="h-3 w-3 fill-brand-lime text-brand-lime" />
                                        {company.rating}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {company.categories.slice(0, 2).map((cat, i) => (
                                        <span key={i} className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                                            {cat}
                                        </span>
                                    ))}
                                    {company.categories.length > 2 && (
                                        <span className="text-[10px] text-muted-foreground">+{company.categories.length - 2}</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Marketplace Grid */}
            <section>
                <h2 className="text-lg font-bold text-white mb-4">Anuncios de particulares</h2>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((item) => (
                            <Card
                                key={item.id}
                                className="bg-card border-white/5 hover:border-brand-cyan/50 transition-all group cursor-pointer overflow-hidden"
                                onClick={() => navigate(`/market/${item.id}`)}
                            >
                                <div className="aspect-square bg-zinc-900 relative">
                                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />

                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <span className="bg-black/60 backdrop-blur-md text-brand-lime text-[10px] font-bold px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-current" /> {item.rating}
                                        </span>
                                    </div>

                                    {item.category === 'instrument' && (
                                        <div className="absolute bottom-2 left-2 bg-brand-petrol/80 backdrop-blur-md text-white p-1.5 rounded-full">
                                            <Music className="h-3 w-3" />
                                        </div>
                                    )}
                                    {item.category === 'service' && (
                                        <div className="absolute bottom-2 left-2 bg-purple-500/80 backdrop-blur-md text-white p-1.5 rounded-full">
                                            <Mic className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-3">
                                    <h3 className="font-bold text-white text-sm truncate mb-1">{item.title}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Tag className="h-2.5 w-2.5" /> {item.category}
                                        </span>
                                        <span className="font-bold text-brand-cyan">{item.price}€</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
