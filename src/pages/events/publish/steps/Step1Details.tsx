import type { PublishEventState } from '../PublishEventPage';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { MapPin, Calendar, Clock, Type } from 'lucide-react';

interface StepProps {
    data: PublishEventState;
    update: (field: keyof PublishEventState, value: any) => void;
    onNext: () => void;
}

export default function Step1Details({ data, update, onNext }: StepProps) {

    const isValid = data.title && data.type && data.date && data.location;

    return (
        <div className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">

            {/* Title */}
            <div className="space-y-3">
                <Label className="text-base text-white">Título del anuncio</Label>
                <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                        value={data.title}
                        onChange={(e) => update('title', e.target.value)}
                        placeholder="Ej: Buscamos Trío de Jazz para Cóctel"
                        className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-600 h-12"
                    />
                </div>
                <p className="text-xs text-gray-500">Sé claro y directo. Rodrigo te ayudará a optimizarlo luego.</p>
            </div>

            {/* Type */}
            <div className="space-y-3">
                <Label className="text-base text-white">Tipo de Evento</Label>
                <Select onValueChange={(val: string) => update('type', val)} value={data.type}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white h-12">
                        <SelectValue placeholder="Selecciona el tipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        {['Festival', 'Boda / Social', 'Evento Privado', 'Residencia / Bar', 'Otro'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div className="space-y-3">
                    <Label className="text-base text-white">Fecha</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            type="date"
                            value={data.date}
                            onChange={(e) => update('date', e.target.value)}
                            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-600 h-12"
                        />
                    </div>
                </div>

                {/* Time */}
                <div className="space-y-3">
                    <Label className="text-base text-white">Hora de inicio</Label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            type="time"
                            value={data.startTime}
                            onChange={(e) => update('startTime', e.target.value)}
                            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-600 h-12"
                        />
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
                <Label className="text-base text-white">Ubicación</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            value={data.location}
                            onChange={(e) => update('location', e.target.value)}
                            placeholder="Ciudad, Venue o Dirección"
                            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-600 h-12"
                        />
                    </div>
                    <Button variant="outline" className="h-12 border-white/10 text-gray-300 hover:text-white bg-transparent">
                        Confirmar en Mapa
                    </Button>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
                <Button
                    onClick={onNext}
                    disabled={!isValid}
                    className="bg-brand-yellow text-brand-black font-bold h-12 px-8 hover:bg-brand-warm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente Paso
                </Button>
            </div>
        </div>
    );
}
