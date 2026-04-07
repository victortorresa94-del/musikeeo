import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Upload, X, Loader2, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import type { ListingCategory } from '../../types';

const CATEGORIES: { value: ListingCategory; label: string }[] = [
    { value: 'guitarras', label: 'Guitarras' },
    { value: 'bajos', label: 'Bajos' },
    { value: 'teclados', label: 'Teclados' },
    { value: 'bateria', label: 'Batería' },
    { value: 'viento', label: 'Viento' },
    { value: 'accesorios', label: 'Accesorios' },
    { value: 'pa_sonido', label: 'PA / Sonido' },
    { value: 'iluminacion', label: 'Iluminación' },
    { value: 'recording', label: 'Grabación' },
    { value: 'partituras', label: 'Partituras' },
    { value: 'otros', label: 'Otros' },
];

const CONDITIONS = [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'como_nuevo', label: 'Como nuevo' },
    { value: 'bueno', label: 'Bueno' },
    { value: 'aceptable', label: 'Aceptable' },
] as const;

export default function CreateListing() {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();

    const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<ListingCategory>('guitarras');
    const [type, setType] = useState<'venta' | 'alquiler' | 'prestamo'>('venta');
    const [price, setPrice] = useState('');
    const [priceUnit, setPriceUnit] = useState<'dia' | 'semana'>('dia');
    const [condition, setCondition] = useState<'nuevo' | 'como_nuevo' | 'bueno' | 'aceptable'>('bueno');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState(userProfile?.location || '');
    const [whatsApp, setWhatsApp] = useState('');
    const [urgent, setUrgent] = useState(false);
    const [shipping, setShipping] = useState(false);
    const [sellerType, setSellerType] = useState<'particular' | 'profesional'>('particular');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remaining = 3 - images.length;
        files.slice(0, remaining).forEach(file => {
            const preview = URL.createObjectURL(file);
            setImages(prev => [...prev, { file, preview }]);
        });
        e.target.value = '';
    };

    const handleImageRemove = (idx: number) => {
        setImages(prev => {
            URL.revokeObjectURL(prev[idx].preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!title.trim()) { setError('El título es obligatorio'); return; }
        if (images.length === 0) { setError('Añade al menos una foto'); return; }
        if (type !== 'prestamo' && (!price || Number(price) < 0)) {
            setError('Introduce un precio válido'); return;
        }

        setError('');
        setSubmitting(true);

        try {
            const urls = await Promise.all(
                images.map(({ file }) => {
                    const ext = file.name.split('.').pop() || 'jpg';
                    const path = `listings/${user.uid}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                    return storageService.uploadFile(file, path);
                })
            );

            await addDoc(collection(db, 'listings'), {
                userId: user.uid,
                userName: userProfile?.displayName || user.displayName || 'Usuario',
                userAvatar: userProfile?.photoURL || user.photoURL || null,
                userLocation: location,
                userWhatsApp: whatsApp || null,
                title: title.trim(),
                description: description.trim(),
                category,
                condition,
                type,
                price: type === 'prestamo' ? 0 : Number(price),
                priceUnit: type === 'alquiler' ? priceUnit : null,
                urgent,
                shipping,
                sellerType,
                available: true,
                images: urls,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            navigate('/market', { state: { toast: '¡Anuncio publicado! 🎸' } });
        } catch (err) {
            console.error('Error creating listing:', err);
            setError('Error al publicar. Inténtalo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-6 animate-fade-in-up">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
                <ArrowLeft className="w-4 h-4" /> Cancelar
            </Button>

            <div>
                <h1 className="text-2xl font-bold text-foreground">Publicar anuncio</h1>
                <p className="text-muted-foreground text-sm">Vende, alquila o presta equipo a la comunidad.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Photos */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Fotos <span className="text-gray-500">(máx. 3)</span></label>
                    <div className="flex gap-3 flex-wrap">
                        {images.map(({ preview }, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleImageRemove(idx)}
                                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-foreground hover:bg-black"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {images.length < 3 && (
                            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-all text-gray-500 hover:text-primary">
                                <Upload size={20} className="mb-1" />
                                <span className="text-xs">Añadir</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Título</label>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value.slice(0, 60))}
                        placeholder="Ej: Fender Stratocaster 2021 con funda..."
                        className="bg-muted border-border text-foreground"
                    />
                    <p className="text-xs text-gray-500 text-right">{title.length}/60</p>
                </div>

                {/* Category */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Categoría</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value as ListingCategory)}
                        className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value} className="bg-[#1a1a1a]">{c.label}</option>
                        ))}
                    </select>
                </div>

                {/* Type */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Tipo de anuncio</label>
                    <div className="flex rounded-xl bg-muted p-1 gap-1">
                        {(['venta', 'alquiler', 'prestamo'] as const).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${type === t ? 'bg-primary text-black' : 'text-gray-400 hover:text-foreground'}`}
                            >
                                {t === 'prestamo' ? 'Préstamo' : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price */}
                {type !== 'prestamo' && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">
                            Precio (€){type === 'alquiler' && <span className="text-gray-500 font-normal ml-1">por</span>}
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min="0"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0"
                                className="bg-muted border-border text-foreground flex-1"
                            />
                            {type === 'alquiler' && (
                                <select
                                    value={priceUnit}
                                    onChange={e => setPriceUnit(e.target.value as 'dia' | 'semana')}
                                    className="h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                                >
                                    <option value="dia" className="bg-[#1a1a1a]">día</option>
                                    <option value="semana" className="bg-[#1a1a1a]">semana</option>
                                </select>
                            )}
                        </div>
                    </div>
                )}

                {/* Condition */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Estado</label>
                    <div className="grid grid-cols-2 gap-2">
                        {CONDITIONS.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setCondition(c.value)}
                                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${condition === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-gray-400 hover:text-foreground'}`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Descripción</label>
                    <Textarea
                        value={description}
                        onChange={e => setDescription(e.target.value.slice(0, 300))}
                        placeholder="Describe el estado, antigüedad, accesorios incluidos..."
                        className="bg-muted border-border text-foreground min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-gray-500 text-right">{description.length}/300</p>
                </div>

                {/* Location */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Ubicación</label>
                    <Input
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="Ej: Barcelona, España"
                        className="bg-muted border-border text-foreground"
                    />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">WhatsApp <span className="text-gray-500 font-normal">(opcional)</span></label>
                    <Input
                        value={whatsApp}
                        onChange={e => setWhatsApp(e.target.value)}
                        placeholder="34612345678 (sin + ni espacios)"
                        className="bg-muted border-border text-foreground"
                    />
                </div>

                {/* Seller type */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Tipo de vendedor</label>
                    <div className="flex rounded-xl bg-muted p-1 gap-1">
                        {(['particular', 'profesional'] as const).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setSellerType(t)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors capitalize ${sellerType === t ? 'bg-primary text-black' : 'text-gray-400 hover:text-foreground'}`}
                            >
                                {t === 'particular' ? '👤 Particular' : '🏪 Profesional'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shipping toggle */}
                <button
                    type="button"
                    onClick={() => setShipping(v => !v)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${shipping ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted'}`}
                >
                    <span className="text-lg">{shipping ? '📦' : '📍'}</span>
                    <div className="text-left">
                        <p className={`text-sm font-bold ${shipping ? 'text-primary' : 'text-foreground'}`}>Envío disponible</p>
                        <p className="text-xs text-gray-500">Puedo enviar el artículo por mensajería</p>
                    </div>
                    <div className={`ml-auto w-10 h-6 rounded-full transition-colors flex items-center px-1 ${shipping ? 'bg-primary' : 'bg-muted'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${shipping ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </button>

                {/* Urgent toggle */}
                <button
                    type="button"
                    onClick={() => setUrgent(v => !v)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${urgent ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted'}`}
                >
                    <Zap size={18} className={urgent ? 'text-primary' : 'text-gray-500'} />
                    <div className="text-left">
                        <p className={`text-sm font-bold ${urgent ? 'text-primary' : 'text-foreground'}`}>Marcar como urgente ⚡</p>
                        <p className="text-xs text-gray-500">Necesito venderlo / alquilarlo rápido</p>
                    </div>
                    <div className={`ml-auto w-10 h-6 rounded-full transition-colors flex items-center px-1 ${urgent ? 'bg-primary' : 'bg-muted'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${urgent ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </button>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-primary text-black font-bold hover:bg-primary/90 text-base"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar anuncio'}
                </Button>
            </form>
        </div>
    );
}
