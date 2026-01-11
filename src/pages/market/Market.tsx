import { Search, Filter, ShoppingCart, Star } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function Market() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-primary">Mercado</h1>
                    <p className="text-muted-foreground">Equipo, servicios y alquileres.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar..." className="pl-9 bg-secondary border-none" />
                    </div>
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon"><ShoppingCart className="h-4 w-4" /></Button>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['Todo', 'Instrumentos', 'Estudios', 'Sonido', 'Servicios', 'Alquiler'].map((cat) => (
                    <Button key={cat} variant="secondary" size="sm" className="whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors">
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                        <div className="aspect-square bg-muted relative">
                            {/* Image Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                                [Producto {item}]
                            </div>
                            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                Nuevo
                            </span>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-sm truncate">Fender Stratocaster</h3>
                                    <p className="text-xs text-muted-foreground">Guitarra Eléctrica</p>
                                </div>
                                <div className="flex items-center text-amber-500 text-xs">
                                    <Star className="h-3 w-3 fill-current" /> 4.8
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <span className="font-bold text-primary">850€</span>
                                <Button size="sm" className="h-7 text-xs">Ver</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
