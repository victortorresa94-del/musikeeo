import { Calendar, Clock, MapPin } from 'lucide-react';
import { objeto3dDeBolo } from '../../../../config/objetos3d';
import type { Event } from '../../../../types';
import { cn } from '../../../../lib/utils';
import { fechaLocal, miles } from '../opciones';

interface Props {
    titulo: string;
    tipo: string;
    fecha: string;
    hora: string;
    lugar: string;
    precio: number;
    etiquetas: string[];
    imagen?: string;
}

// La fila del bolo en la lista: el día, su dibujo (o la foto que se suba), título, sitio, hora y precio.
// Lo que aún falta se ve en gris, para que se note qué queda por rellenar
export default function VistaPreviaBolo({ titulo, tipo, fecha, hora, lugar, precio, etiquetas, imagen }: Props) {
    const dia = fecha ? fechaLocal(fecha) : null;
    const ciudad = lugar.split(',')[0].trim();
    const objeto = objeto3dDeBolo({ type: tipo as Event['type'], tags: etiquetas, title: titulo });

    return (
        <article className="flex items-center gap-3 p-3 rounded-[20px] bg-card border border-hairline shadow-e2">
            <div className="w-[52px] shrink-0 self-stretch rounded-[14px] bg-fill flex flex-col items-center justify-center py-2">
                {dia ? (
                    <>
                        <span className="text-[13px] text-muted-foreground leading-none">{dia.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</span>
                        <span className="mt-1 text-[24px] font-bold leading-none">{dia.getDate()}</span>
                        <span className="mt-1 text-[13px] text-muted-foreground leading-none">{dia.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
                    </>
                ) : (
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                )}
            </div>

            <div className="h-[84px] w-[84px] shrink-0 flex items-center justify-center">
                {imagen
                    ? <img src={imagen} alt="" className="h-full w-full rounded-[14px] object-cover" />
                    : <img src={objeto} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]" />}
            </div>

            <div className="min-w-0 flex-1">
                <h3 className={cn('text-[16px] font-bold leading-snug line-clamp-2', !titulo.trim() && 'text-muted-foreground')}>
                    {titulo.trim() || 'El título de tu bolo'}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{ciudad || 'Ciudad'}</span>
                    {hora && (
                        <>
                            <span aria-hidden>·</span>
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{hora}</span>
                        </>
                    )}
                </p>
                <p className={cn('mt-1 text-[17px] font-bold leading-tight', !(precio > 0) && 'text-muted-foreground')}>
                    {precio > 0 ? `${miles(precio)} €` : 'Sin precio'}
                </p>
                {etiquetas.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        {etiquetas.slice(0, 3).map(t => (
                            <span key={t} className="h-6 px-2 rounded-full bg-fill text-[12px] text-muted-foreground flex items-center">{t}</span>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}
