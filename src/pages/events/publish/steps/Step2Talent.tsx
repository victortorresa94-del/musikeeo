import type { PublishEventState } from '../PublishEventPage';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Switch } from '../../../../components/ui/switch';
import { DollarSign, Music, Image as ImageIcon } from 'lucide-react';
import { useRef } from 'react';

interface StepProps {
    data: PublishEventState;
    update: (field: keyof PublishEventState, value: any) => void;
    onNext: () => void;
    onPrev: () => void;
}

const ARTIST_TYPES = ['Banda', 'DJ', 'Solista', 'Mariachi', 'Jazz Trío', 'Orquesta', 'Otro'];

export default function Step2Talent({ data, update, onNext, onPrev }: StepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isValid = data.artistType.length > 0 && data.budget > 0 && data.description.length >= 10;

    const toggleArtistType = (type: string) => {
        if (data.artistType.includes(type)) {
            update('artistType', data.artistType.filter(t => t !== type));
        } else {
            // Single selection logic for simplicity, or multi if needed. Prompt says multi is possible but usually singular makes sense for main category.
            // Let's allow multi as per prompt hint "Selección múltiple"
            update('artistType', [...data.artistType, type]);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                update('image', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">

            {/* Artist Type */}
            <div className="space-y-4">
                <Label className="text-base text-white">¿Qué estás buscando?</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ARTIST_TYPES.map(type => {
                        const isSelected = data.artistType.includes(type);
                        return (
                            <div
                                key={type}
                                onClick={() => toggleArtistType(type)}
                                className={`cursor-pointer rounded-xl border p-4 text-center transition-all duration-200 ${isSelected
                                    ? 'bg-brand-yellow/10 border-brand-yellow text-brand-yellow font-bold'
                                    : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                                    }`}
                            >
                                <Music className={`mx-auto mb-2 w-5 h-5 ${isSelected ? 'text-brand-yellow' : 'text-gray-500'}`} />
                                <span className="text-sm">{type}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Budget */}
            <div className="space-y-4">
                <Label className="text-base text-white">Presupuesto</Label>
                <div className="flex gap-4 items-start">
                    <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            type="number"
                            value={data.budget || ''}
                            onChange={(e) => update('budget', Number(e.target.value))}
                            placeholder="Presupuesto"
                            className="pl-10 bg-black/40 border-white/10 text-white h-12" // Removed font-mono
                        />
                    </div>
                    <div className="w-24 flex items-center justify-center bg-white/5 border border-white/10 rounded-md h-12">
                        <span className="text-gray-400 font-medium">EUR (€)</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <Switch
                        checked={data.negotiable}
                        onCheckedChange={(checked) => update('negotiable', checked)}
                        className="data-[state=checked]:bg-brand-yellow"
                    />
                    <span className="text-sm text-gray-300">Abierto a negociación</span>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
                <Label className="text-base text-white">Descripción del Bolo</Label>
                <Textarea
                    value={data.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Describe los detalles: duración, rider técnico disponible, ambiente deseado..."
                    className="bg-black/40 border-white/10 text-white min-h-[120px]"
                />
                <p className="text-xs text-gray-500 text-right">{data.description.length}/40 caracteres mínimos</p>
            </div>

            {/* Image (Mock) */}
            <div className="space-y-3">
                <Label className="text-base text-white">Imagen de Portada (Opcional)</Label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/10 rounded-xl p-0 h-48 flex flex-col items-center justify-center bg-black/20 hover:bg-white/5 transition-colors cursor-pointer text-gray-500 hover:text-white overflow-hidden relative group"
                >
                    {data.image ? (
                        <>
                            <img src={data.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="flex items-center gap-2 font-medium text-white"><ImageIcon className="w-5 h-5" /> Cambiar Imagen</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm">Arrastra una imagen o haz clic para subir</span>
                            <span className="text-xs text-gray-600 mt-1">PNG, JPG hasta 10MB</span>
                        </>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-between">
                <Button
                    variant="ghost"
                    onClick={onPrev}
                    className="text-gray-400 hover:text-white"
                >
                    Atrás
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!isValid}
                    className="bg-brand-yellow text-brand-black font-bold h-12 px-8 hover:bg-brand-warm disabled:opacity-50"
                >
                    Siguiente Paso
                </Button>
            </div>
        </div>
    );
}
