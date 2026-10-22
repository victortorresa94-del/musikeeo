import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { objeto3dDeBolo } from '../../config/objetos3d';
import type { Event } from '../../types';
import { diaSemana, esUrgente, etiquetasDe, fechaDe, horaDe, mesCorto, norm, precioBolo, type FechaBolo } from './tablon';

// El tablón de bolos (concepto A): fecha, objeto 3D y precio, en una tarjeta blanca

// «Sonido incluido» es un extra del bolo, no un encargo de técnico: no debe pintar la mesa de mezclas
const paraObjeto = (e: Event) => ({ ...e, tags: (e.tags || []).filter(t => !norm(t).includes('incluid')) });

function BloqueFecha({ f }: { f: FechaBolo | null }) {
    return (
        <span className="w-[48px] md:w-[58px] h-[84px] shrink-0 rounded-xl bg-fill flex flex-col items-center justify-center">
            {f ? (
                <>
                    <span className="text-[13px] font-medium leading-none text-muted-foreground">{diaSemana(f.d)}</span>
                    <span className="mt-1 text-[26px] font-bold leading-none text-foreground">{f.d.getDate()}</span>
                    <span className="mt-1.5 text-[13px] font-medium leading-none text-muted-foreground">{mesCorto(f.d)}</span>
                </>
            ) : (
                <span className="px-1 text-center text-[12px] font-medium leading-tight text-muted-foreground">Sin fecha</span>
            )}
        </span>
    );
}

export function TarjetaBolo({ e, pasado }: { e: Event; pasado?: boolean }) {
    const f = fechaDe(e.date);
    const hora = horaDe(f);
    const urgente = esUrgente(e) && !pasado;
    const etiquetas = etiquetasDe(e);
    return (
        <Link
            to={`/eventos/${e.id}`}
            className={cn(
                'pulsable pulsable--flota h-full flex items-center gap-2.5 md:gap-3 p-3 rounded-2xl bg-card shadow-e1 border border-hairline',
                pasado && 'opacity-60',
            )}
        >
            <BloqueFecha f={f} />
            <img
                src={objeto3dDeBolo(paraObjeto(e))} alt="" loading="lazy" decoding="async"
                className="h-[84px] w-[72px] md:h-[96px] md:w-[96px] shrink-0 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
            />
            <span className="min-w-0 flex-1 py-0.5">
                {/* «Urgente» flota a la derecha: el título se le aparta solo en su primera línea */}
                <span className="block max-h-[60px] overflow-hidden">
                    {urgente && (
                        <span className="float-right ml-2 mt-px h-[22px] px-2 rounded-full bg-destructive/10 text-destructive text-[12px] font-semibold leading-[22px]">
                            Urgente
                        </span>
                    )}
                    <span className="block text-[16px] font-bold leading-5 text-foreground break-words">{e.title}</span>
                </span>
                <span className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
                    {e.location && <><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{e.location}</span></>}
                    {e.location && hora && <span aria-hidden className="shrink-0">·</span>}
                    {hora && <><Clock className="h-3.5 w-3.5 shrink-0" /><span className="shrink-0">{hora}</span></>}
                </span>
                <span className="mt-1 block text-[17px] font-bold leading-6 text-foreground">{precioBolo(e.price)}</span>
                {/* Una sola línea: las que no caben se quedan fuera, sin hacer la tarjeta más alta */}
                {etiquetas.length > 0 && (
                    <span className="mt-1.5 flex flex-wrap gap-1 h-6 overflow-hidden">
                        {etiquetas.map(t => (
                            <span key={t} className="max-w-full truncate h-6 px-2 rounded-full bg-fill text-[12px] font-medium leading-6 text-muted-foreground">{t}</span>
                        ))}
                    </span>
                )}
            </span>
        </Link>
    );
}

export function TarjetaBoloEsqueleto() {
    return (
        <div className="flex items-center gap-2.5 md:gap-3 p-3 rounded-2xl bg-card shadow-e1 border border-hairline animate-pulse" aria-hidden>
            <span className="w-[48px] md:w-[58px] h-[84px] shrink-0 rounded-xl bg-fill" />
            <span className="h-[72px] w-[72px] md:w-[96px] shrink-0 rounded-2xl bg-fill" />
            <span className="flex-1 space-y-2">
                <span className="block h-4 w-4/5 rounded bg-fill-strong" />
                <span className="block h-3 w-1/2 rounded bg-fill" />
                <span className="block h-4 w-1/4 rounded bg-fill-strong" />
                <span className="flex gap-1"><span className="h-5 w-12 rounded-full bg-fill" /><span className="h-5 w-16 rounded-full bg-fill" /></span>
            </span>
        </div>
    );
}
