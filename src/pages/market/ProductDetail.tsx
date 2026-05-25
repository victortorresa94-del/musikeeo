import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MapPin, Tag, MessageSquare, Share2, Loader2, Zap, Phone, X, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Listing } from '../../types';

const TYPE_LABELS: Record<string, string> = {
    venta: 'VENTA', alquiler: 'ALQUILER', prestamo: 'PRÉSTAMO'
};

const CONDITION_LABELS: Record<string, string> = {
    nuevo: 'Nuevo', como_nuevo: 'Como nuevo', bueno: 'Buen estado', aceptable: 'Aceptable'
};

const formatPrice = (l: Listing) => {
    if (l.type === 'prestamo') return 'Préstamo gratuito';
    const unit = l.type === 'alquiler' && l.priceUnit
        ? `/${l.priceUnit === 'dia' ? 'día' : l.priceUnit === 'semana' ? 'semana' : 'total'}`
        : '';
    return `${l.price}€${unit}`;
};

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [contactOpen, setContactOpen] = useState(false);

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
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up bg-background min-h-screen">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 bg-card/80 backdrop-blur text-foreground rounded-full hover:bg-card">
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
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {item.urgent && (
                                <span className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30 flex items-center gap-1">
                                    <Zap size={10} className="fill-current" /> URGENTE
                                </span>
                            )}
                            <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full border border-border flex items-center gap-1">
                                <Tag className="h-3 w-3" /> {item.category}
                            </span>
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/30">
                                {TYPE_LABELS[item.type]}
                            </span>
                        </div>
                    </div>
                    {item.images && item.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {item.images.slice(0, 4).map((img, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                                    <img src={img} alt={`${item.title} ${i + 2}`} loading="lazy" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <h1 className="text-2xl font-black tracking-tighter text-foreground mb-2">{item.title}</h1>
                            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted rounded-full">
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {item.userLocation || 'Sin ubicación'}
                            </div>
                            <span>•</span>
                            <span>{CONDITION_LABELS[item.condition] ?? item.condition}</span>
                            {item.available ? (
                                <span className="flex items-center gap-1 text-primary">
                                    <CheckCircle2 className="h-3 w-3" /> Disponible
                                </span>
                            ) : (
                                <span className="text-red-500">No disponible</span>
                            )}
                        </div>
                    </div>

                    <div className="text-4xl font-black tracking-tighter text-primary">
                        {formatPrice(item)}
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-foreground">Descripción</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {item.description || "Este vendedor no ha proporcionado una descripción detallada, pero puedes contactarle directamente para más información."}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 rounded-xl"
                            onClick={() => setContactOpen(true)}
                            disabled={!item.available}
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Contactar
                        </Button>
                        <Button variant="outline" className="h-12 rounded-xl border-primary/40 text-primary hover:bg-primary/10 font-semibold">
                            Guardar
                        </Button>
                    </div>

                    {/* Seller Card */}
                    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden">
                            {item.userAvatar ? (
                                <img src={item.userAvatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-foreground uppercase">{(item.userName || 'U').substring(0, 2)}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Publicado por</p>
                            <p className="text-sm font-semibold text-foreground">{item.userName || 'Usuario'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            <AnimatePresence>
                {contactOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setContactOpen(false)}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-foreground font-bold">Contactar</h3>
                                    <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{item.title}</p>
                                </div>
                                <button onClick={() => setContactOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        navigate(`/messages?userId=${item.userId}&ref=${item.id}`);
                                        setContactOpen(false);
                                    }}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-border hover:border-primary/30 transition-colors text-left w-full"
                                >
                                    <div className="p-2 rounded-lg bg-primary/20">
                                        <MessageSquare size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium text-sm">Mensaje en Musikeeo</p>
                                        <p className="text-muted-foreground text-xs">Escríbele desde la plataforma</p>
                                    </div>
                                </button>
                                {item.userWhatsApp && (
                                    <a
                                        href={`https://wa.me/${item.userWhatsApp}?text=${encodeURIComponent(`Hola, vi tu anuncio "${item.title}" en Musikeeo 🎸`)}`}
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
