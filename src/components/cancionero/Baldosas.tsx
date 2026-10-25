import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { iconoRepertorio, type Pastel } from './estilo';
import type { Repertorio } from '../../types/cancionero';

// Una baldosa como las de Explorar: el objeto 3D sobre su pastel y el nombre debajo
export function Baldosa({ icono, etiqueta, pastel, onClick, activa }: {
    icono: string; etiqueta: string; pastel: Pastel; onClick: () => void; activa?: boolean;
}) {
    return (
        <button type="button" onClick={onClick} aria-pressed={activa} className="pulsable flex flex-col items-center gap-1.5 min-w-0">
            <span className={cn('w-full aspect-[8/7] rounded-2xl flex items-center justify-center transition-shadow', pastel.fondo,
                activa && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}>
                <img src={icono} alt="" draggable={false} className="h-[78%] w-[78%] object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
            </span>
            <span className="text-[12px] font-semibold leading-tight text-foreground text-center">{etiqueta}</span>
        </button>
    );
}

// El bolo que viene (o el último): se toca desde aquí sin entrar en el repertorio
export function TarjetaBolo({ repertorio, etiqueta, temas, fecha, onTocar }: {
    repertorio: Repertorio; etiqueta: string; temas: number; fecha: string; onTocar: () => void;
}) {
    return (
        <div className="relative mt-5 rounded-[22px] bg-pastel-mantequilla shadow-e1 overflow-hidden">
            <div className="relative z-10 w-[62%] pl-4 py-4">
                <Link to={`/cancionero/repertorio/${repertorio.id}`} className="block active:opacity-70">
                    <span className="block text-[12.5px] font-semibold text-pastel-mantequilla-ink">{etiqueta}</span>
                    <span className="mt-0.5 block font-heading text-[19px] font-bold leading-[1.15] text-foreground line-clamp-2">{repertorio.nombre}</span>
                    <span className="mt-1 block text-[13px] text-muted-foreground">{[fecha, `${temas} ${temas === 1 ? 'tema' : 'temas'}`].filter(Boolean).join(' · ')}</span>
                </Link>
                <button onClick={onTocar} className="pulsable mt-3 h-9 pl-3 pr-4 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center gap-1.5">
                    <Play className="h-4 w-4 fill-current" /> Tocar
                </button>
            </div>
            <img src={iconoRepertorio(repertorio.nombre)} alt="" draggable={false}
                className="pointer-events-none absolute bottom-2 right-2 h-[128px] w-[40%] object-contain object-bottom drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)]" />
        </div>
    );
}
