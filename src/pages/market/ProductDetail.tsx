import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MapPin, Tag, MessageSquare, Share2, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Listing } from '../../types';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;
            try {
                const snap = await getDoc(doc(db, 'listings', id));
                if (snap.exists()) {
                    setItem({ id: snap.id, ...snap.data() } as Listing);
                }
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-foreground mb-4">Producto no encontrado</h2>
                <Button onClick={() => navigate('/market')}>Volver al Mercado</Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Volver
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Gallery (Simple for MVP) */}
                <div className="space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-muted relative group">
                        {item.images?.[0] ? (
                            <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                Sin imagen
                            </div>
                        )}
                        <div className="absolute top-4 left-4">
                            <span className="bg-background/60 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1 rounded-full border border-border flex items-center gap-1">
                                <Tag className="h-3 w-3" /> {item.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">{item.title}</h1>
                            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted rounded-full">
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-primary" /> {item.userLocation || 'Sin ubicación'}
                            </div>
                        </div>
                    </div>

                    <div className="text-4xl font-bold text-primary">
                        {item.price}€
                    </div>

                    <div className="bg-muted border border-border rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-foreground">Descripción</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {item.description || "Este vendedor no ha proporcionado una descripción detallada, pero puedes contactarle directamente para más información."}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold h-12 text-lg"
                            onClick={() => navigate('/messages')}
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Contactar Vendedor
                        </Button>
                        <Button variant="outline" className="h-12 border-border hover:bg-muted">
                            Guardar
                        </Button>
                    </div>

                    {/* Seller Card */}
                    <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-card">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border">
                            <span className="font-bold text-foreground uppercase">{(item.userName || 'U').substring(0, 2)}</span>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Vendido por</p>
                            <p className="font-bold text-foreground">{item.userName || 'Usuario'}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="ml-auto text-primary hover:text-primary/80">
                            Ver Perfil
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
