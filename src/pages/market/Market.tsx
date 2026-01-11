import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Star, Tag, Music, Mic } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { marketService } from '../../services/marketService';
import { type MarketItem } from '../../types';

const CATEGORIES = [
    { id: 'all', label: 'Todo' },
    { id: 'instruments', label: 'Instrumentos' },
    { id: 'recording', label: 'Estudio' },
    { id: 'services', label: 'Servicios' },
    { id: 'venues', label: 'Salas' },
];

export default function Market() {
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Mercado</h1>
                    <p className="text-muted-foreground">Equipment, servicios y espacios.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar guitarra, micro, sala..." className="pl-10 bg-white/5 border-white/10" />
                    </div>
                    <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5"><Filter className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5 relative">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-brand-cyan rounded-full border border-black"></span>
                    </Button>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {CATEGORIES.map((cat) => (
                    <Button
                        key={cat.id}
                        variant={activeCategory === cat.id ? 'glow' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`rounded-full px-4 ${activeCategory !== cat.id ? 'border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white' : ''}`}
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <Card key={item.id} className="bg-card border-white/5 hover:border-brand-cyan/50 transition-all group cursor-pointer overflow-hidden">
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
                            <CardContent className="p-4">
                                <h3 className="font-heading font-bold text-white text-base truncate mb-1">{item.title}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Tag className="h-3 w-3" /> {item.category}
                                    </span>
                                    <span className="font-bold text-brand-cyan text-lg">{item.price}€</span>
                                </div>
                                <Button className="w-full mt-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 h-8 text-xs">
                                    Ver Detalles
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
