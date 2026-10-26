import { useState } from 'react';
import { cn } from '../../lib/utils';
import { iniciales, type PuntoMapa } from '../../lib/mapa';
import { ESTILO_PAPEL, PUNTO_AHORA } from './estilo';

// La burbuja del mapa en React (hojas y vista previa): foto o iniciales, borde de su papel
export function Burbuja({ p, tamano = 'md', className }: {
    p: Pick<PuntoMapa, 'nombre' | 'foto' | 'papel'> & { ahora?: boolean };
    tamano?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const [rota, setRota] = useState(false);
    const e = ESTILO_PAPEL[p.papel];
    const lado = { sm: 'h-10 w-10 text-[13px] border-2', md: 'h-12 w-12 text-[15px] border-[3px]', lg: 'h-16 w-16 text-[20px] border-[3px]' }[tamano];
    return (
        <span className={cn('relative inline-flex shrink-0', className)}>
            <span className={cn('rounded-full overflow-hidden flex items-center justify-center font-bold', lado, e.borde, e.fondo, e.tinta)}>
                {p.foto && !rota
                    ? <img src={p.foto} alt="" referrerPolicy="no-referrer" onError={() => setRota(true)} className="h-full w-full object-cover" />
                    : iniciales(p.nombre)}
            </span>
            {p.ahora && <span className={cn('absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-sheet', PUNTO_AHORA)} />}
        </span>
    );
}
