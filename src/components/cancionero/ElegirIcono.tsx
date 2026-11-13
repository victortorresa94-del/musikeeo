// Elegir el icono de un repertorio (13-nov, Víctor: «quiero poder elegir los iconos del reper»).
// Se aplica al tocarlo (se ve detrás, en la cabecera); «Automático» vuelve al de su nombre
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BotonHoja, Hoja } from './Hoja';
import { ICONOS_REPERTORIO, esIconoDeApp, iconoRepertorio, pastelDe } from './estilo';
import type { Repertorio } from '../../types/cancionero';

export function ElegirIcono({ abierta, onCerrar, repertorio, onElegir }: {
    abierta: boolean;
    onCerrar: () => void;
    repertorio: Repertorio;
    onElegir: (icono: string | undefined) => void;
}) {
    const pastel = pastelDe(repertorio.id);
    const elegido = esIconoDeApp(repertorio.icono) ? repertorio.icono : undefined;
    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Icono del repertorio" derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5">
                {/* El de siempre: según el nombre (una boda, una noche de rumba…) */}
                <button onClick={() => onElegir(undefined)} aria-pressed={!elegido}
                    className="w-full rounded-2xl bg-fill px-3 py-2.5 flex items-center gap-3 text-left active:bg-fill-strong">
                    <span className={cn('h-12 w-12 shrink-0 rounded-[13px] flex items-center justify-center', pastel.fondo)}>
                        <img src={iconoRepertorio(repertorio.nombre)} alt="" aria-hidden draggable={false} className="h-10 w-10 object-contain" />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold text-foreground">Automático</span>
                        <span className="block text-[13px] text-muted-foreground">Según el nombre del repertorio</span>
                    </span>
                    {!elegido && <Check className="h-5 w-5 shrink-0 text-foreground" />}
                </button>

                <p className="mt-5 mb-2 px-1 text-[13px] font-semibold text-muted-foreground">O elige uno</p>
                <div className="grid grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-3">
                    {ICONOS_REPERTORIO.map(({ src, nombre }) => {
                        const activo = elegido === src;
                        return (
                            <button key={src} onClick={() => onElegir(src)} aria-pressed={activo} aria-label={nombre}
                                className="pulsable flex flex-col items-center gap-1 min-w-0">
                                <span className={cn('w-full aspect-square rounded-2xl flex items-center justify-center', pastel.fondo,
                                    activo && 'ring-2 ring-foreground ring-offset-2 ring-offset-sheet')}>
                                    <img src={src} alt="" aria-hidden loading="lazy" draggable={false} className="h-14 w-14 object-contain" />
                                </span>
                                <span className={cn('max-w-full truncate text-[11.5px] leading-tight', activo ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground')}>{nombre}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </Hoja>
    );
}
