import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { NECESIDADES, OTRAS_NECESIDADES } from '../opciones';

interface Props {
    elegida?: string;
    onElegir: (etiqueta: string) => void;
}

// Paso 1: seis teselas con su figura 3D, que asoma por arriba (como «Por momento» en Explorar)
export default function PasoNecesidad({ elegida, onElegir }: Props) {
    const [mas, setMas] = useState(() => !!elegida && OTRAS_NECESIDADES.includes(elegida));

    return (
        <div>
            {/* El pt y el gap-y dejan sitio a lo que asoma */}
            <div className="mt-6 pt-4 grid grid-cols-3 gap-x-2.5 gap-y-7 sm:gap-x-3.5 sm:gap-y-9">
                {NECESIDADES.map(n => {
                    const on = elegida === n.etiqueta;
                    return (
                        <button
                            key={n.etiqueta}
                            type="button"
                            onClick={() => onElegir(n.etiqueta)}
                            aria-pressed={on}
                            className={cn(
                                'pulsable relative h-[136px] sm:h-[176px] rounded-[20px] bg-card shadow-e1 border-2',
                                on ? 'border-foreground' : 'border-hairline',
                            )}
                        >
                            <img
                                src={n.imagen}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[46px] sm:bottom-[54px] h-[106px] sm:h-[142px] w-[98%] object-contain object-bottom drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
                            />
                            <span className="absolute inset-x-1 bottom-0 h-[46px] sm:h-[54px] flex items-center justify-center text-center text-[14px] sm:text-[15px] font-bold leading-[1.15]">
                                {n.etiqueta}
                            </span>
                            {on && (
                                // En la esquina, por fuera: así no pisa las etiquetas de dos líneas
                                <span className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-foreground text-background ring-[3px] ring-background flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {mas ? (
                <div className="mt-7">
                    <p className="text-center text-[13px] font-semibold text-muted-foreground">Otras cosas que se buscan</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                        {OTRAS_NECESIDADES.map(o => (
                            <button
                                key={o}
                                type="button"
                                onClick={() => onElegir(o)}
                                aria-pressed={elegida === o}
                                className={cn('pulsable h-9 px-3.5 rounded-full text-[14px] font-semibold', elegida === o ? 'bg-foreground text-background' : 'bg-fill')}
                            >
                                {o}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-5 flex justify-center">
                    <button type="button" onClick={() => setMas(true)} className="pulsable h-9 px-3.5 rounded-full text-[14px] font-semibold text-muted-foreground">
                        Más opciones
                    </button>
                </div>
            )}
        </div>
    );
}
