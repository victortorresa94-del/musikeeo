import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, Upload, Loader2, DollarSign, MapPin } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { useAuth } from '../../context/AuthContext';

const listingSchema = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    description: z.string().min(20, "Describe tu producto con al menos 20 caracteres"),
    category: z.string().min(1, "Selecciona una categoría"),
    location: z.string().min(3, "Indica la ubicación"),
});

type ListingForm = z.infer<typeof listingSchema>;

export default function CreateListing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Mock image for MVP
    const [activeImage] = useState("https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&q=80");

    const { register, handleSubmit, formState: { errors } } = useForm<ListingForm>({
        resolver: zodResolver(listingSchema) as any,
        defaultValues: {
            category: 'instruments'
        }
    });

    const onSubmit = async (data: ListingForm) => {
        if (!user) return;
        setIsLoading(true);
        try {
            await marketService.createItem({
                ...data,
                category: data.category as any,
                image: activeImage,
                rating: 5.0, // Default for new
                sellerId: user.uid,
                seller: user.displayName || 'Usuario Anónimo',
                reviews: 0,
            });
            navigate('/market');
        } catch (error) {
            console.error("Error creating listing", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in-up">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Cancelar
            </Button>

            <div>
                <h1 className="text-3xl font-heading font-bold text-white">Publicar Anuncio</h1>
                <p className="text-muted-foreground">Vende instrumentos o servicios a la comunidad.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                {/* Image Upload Mock */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Fotos del Producto</label>
                    <div className="flex gap-4 items-start">
                        <div className="w-32 h-32 bg-black/40 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-brand-cyan/50 hover:bg-white/5 transition-all text-muted-foreground hover:text-brand-cyan">
                            <Upload className="h-6 w-6 mb-2" />
                            <span className="text-xs">Subir Foto</span>
                        </div>
                        <div className="w-32 h-32 rounded-xl overflow-hidden border border-white/10 relative">
                            <img src={activeImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">* Usando imagen de demostración por defecto</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Título del Anuncio</label>
                    <Input
                        placeholder="Ej: Fender Stratocaster 2019..."
                        {...register('title')}
                        className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Precio (€)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                placeholder="0.00"
                                className={`pl-9 ${errors.price ? 'border-red-500' : ''}`}
                                {...register('price')}
                            />
                        </div>
                        {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Categoría</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-black/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                            {...register('category')}
                        >
                            <option value="instrument">Instrumento</option>
                            <option value="service" >Servicio</option>
                            <option value="recording">Estudio/Grabación</option>
                            <option value="venue">Sala/Espacio</option>
                        </select>
                        {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Ubicación</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Ej: Madrid, zona centro"
                            className={`pl-9 ${errors.location ? 'border-red-500' : ''}`}
                            {...register('location')}
                        />
                    </div>
                    {errors.location && <p className="text-red-500 text-xs">{errors.location.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Descripción</label>
                    <Textarea
                        placeholder="Detalla el estado, antigüedad, especificaciones..."
                        className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
                        {...register('description')}
                    />
                    {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                </div>

                <Button type="submit" className="w-full bg-brand-cyan text-black hover:bg-brand-cyan/90 font-bold h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publicar Anuncio"}
                </Button>
            </form>
        </div>
    );
}
