import { Calendar, Clock, MapPin } from 'lucide-react';
import type { PublishEventState, ActualizaCampo } from '../PublishEventPage';
import { cn } from '../../../../lib/utils';
import { Campo, Pastilla } from '../components/Campos';
import { CAMPO, CIUDADES, TIPOS_EVENTO, TIPOS_RODRIGO, abrirSelector, fechaLocal, hoyISO } from '../opciones';

interface Props {
    data: PublishEventState;
    update: ActualizaCampo;
}

// Paso 2: qué tipo de evento es, cuándo y dónde
export default function PasoCuandoDonde({ data, update }: Props) {
    // Un borrador de Rodrigo puede traer un tipo que no está en la lista (gig, jam…): se enseña tal cual
    const tipoSuelto = data.type && !TIPOS_EVENTO.some(t => t.valor === data.type) ? data.type : '';

    return (
        <div className="mt-7 space-y-6">
            <Campo etiqueta="Tipo de evento">
                <div className="flex flex-wrap gap-1.5">
                    {TIPOS_EVENTO.map(t => (
                        <Pastilla key={t.valor} on={data.type === t.valor} onClick={() => update('type', t.valor)}>{t.texto}</Pastilla>
                    ))}
                    {tipoSuelto && <Pastilla on onClick={() => update('type', tipoSuelto)}>{TIPOS_RODRIGO[tipoSuelto.toLowerCase()] ?? tipoSuelto}</Pastilla>}
                </div>
            </Campo>

            <div className="grid grid-cols-2 gap-2.5">
                <Campo etiqueta="Fecha">
                    <label className="relative flex items-center gap-2.5 h-[52px] rounded-[14px] bg-fill px-4 focus-within:ring-2 focus-within:ring-foreground/10">
                        <Calendar className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                        <span className={cn('text-[16px] truncate', !data.date && 'text-muted-foreground')}>
                            {data.date
                                ? fechaLocal(data.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                                : 'Elige el día'}
                        </span>
                        <input
                            type="date"
                            value={data.date}
                            min={hoyISO()}
                            onChange={e => update('date', e.target.value)}
                            onClick={e => abrirSelector(e.currentTarget)}
                            aria-label="Fecha del bolo"
                            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                        />
                    </label>
                </Campo>
                <Campo etiqueta="Hora de inicio">
                    <label className="relative flex items-center gap-2.5 h-[52px] rounded-[14px] bg-fill px-4 focus-within:ring-2 focus-within:ring-foreground/10">
                        <Clock className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                        <span className={cn('text-[16px] truncate', !data.startTime && 'text-muted-foreground')}>
                            {data.startTime || 'A qué hora'}
                        </span>
                        <input
                            type="time"
                            value={data.startTime}
                            onChange={e => update('startTime', e.target.value)}
                            onClick={e => abrirSelector(e.currentTarget)}
                            aria-label="Hora de inicio"
                            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                        />
                    </label>
                </Campo>
            </div>

            <Campo etiqueta="¿Dónde?">
                <label className="relative block">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
                    <input
                        value={data.location}
                        onChange={e => update('location', e.target.value)}
                        placeholder="Ciudad, sala o dirección"
                        autoComplete="address-level2"
                        className={cn(CAMPO, 'pl-11')}
                    />
                </label>
                <div className="mt-2 -mx-4 px-4 flex gap-1.5 overflow-x-auto hide-scrollbar">
                    {CIUDADES.map(c => (
                        <Pastilla key={c} on={data.location.trim() === c} onClick={() => update('location', c)}>{c}</Pastilla>
                    ))}
                </div>
            </Campo>
        </div>
    );
}
