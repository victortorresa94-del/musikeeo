import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MapPin, Tag, Star, Music, MessageSquare, Share2 } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { type MarketItem } from '../../types';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<MarketItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;
            try {
                const data = await marketService.getItemById(id);
                setItem(data);
            } catch (error) {
                console.error("Failed to load item", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    if (loading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4">Producto no encontrado</h2>
                <Button onClick={() => navigate('/market')}>Volver al Mercado</Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Volver
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Gallery (Simple for MVP) */}
                <div className="space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative group">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                                <Tag className="h-3 w-3" /> {item.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-heading font-bold text-white mb-2">{item.title}</h1>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-brand-cyan" /> {item.location}
                            </div>
                            <div className="flex items-center gap-1 text-brand-lime">
                                <Star className="h-4 w-4 fill-current" /> {item.rating} (12 reviews)
                            </div>
                        </div>
                    </div>

                    <div className="text-4xl font-bold text-brand-cyan">
                        {item.price}€
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-white">Descripción</h3>
                        <p className="text-gray-300 leading-relaxed">
                            {item.description || "Este vendedor no ha proporcionado una descripción detallada, pero puedes contactarle directamente para más información."}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1 bg-brand-cyan text-black hover:bg-brand-cyan/90 font-bold h-12 text-lg"
                            onClick={() => navigate('/messages')}
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Contactar Vendedor
                        </Button>
                        <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5">
                            Guardar
                        </Button>
                    </div>

                    {/* Seller Card */}
                    <div className="border border-white/5 rounded-xl p-4 flex items-center gap-4 bg-black/20">
                        <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                            <span className="font-bold text-white uppercase">{item.seller.substring(0, 2)}</span>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Vendido por</p>
                            <p className="font-bold text-white">{item.seller}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="ml-auto text-brand-cyan hover:text-brand-cyan/80">
                            Ver Perfil
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
