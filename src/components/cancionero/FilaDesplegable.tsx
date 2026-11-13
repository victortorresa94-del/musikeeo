import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { temaDe } from '../../lib/compartir';
import type { Cancion } from '../../types/cancionero';
import { TemaCifrado } from './VistaCifrado';

// Un botón para desplegar una fila de la lista y, debajo, sus acordes por partes y sus notas
// (sin salir de la lista). Va al lado de la fila; el panel, debajo
export function BotonDesplegar({ abierta, onClick, titulo }: { abierta: boolean; onClick: () => void; titulo: string }) {
    return (
        <button onClick={onClick} aria-expanded={abierta} aria-label={abierta ? `Plegar ${titulo}` : `Ver los acordes de ${titulo}`}
            className="h-9 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill-strong">
            <ChevronDown className={cn('h-5 w-5 transition-transform', abierta && 'rotate-180')} />
        </button>
    );
}

export function PanelAcordes({ cancion }: { cancion: Cancion }) {
    const tema = useMemo(() => temaDe(cancion, true), [cancion]);   // el cifrado rápido saca la estructura de la letra
    return (
        <div className="px-4 pb-3 pt-1">
            <TemaCifrado tema={tema} n={0} tamano={15} sinBorde sinCabecera />
            {!tema.x.trim() && <p className="text-[14px] text-muted-foreground">Sin acordes apuntados todavía.</p>}
            <Link to={`/cancionero/${cancion.id}`} className="mt-2 inline-flex h-8 px-3 rounded-full bg-fill-strong text-[13px] font-semibold text-foreground items-center">Abrir la canción</Link>
        </div>
    );
}

// Para las listas de Canciones: la fila de siempre con el botón de desplegar al lado
export function FilaConAcordes({ cancion, fila }: { cancion: Cancion; fila: (sinFlecha: boolean) => ReactNode }) {
    const [abierta, setAbierta] = useState(false);
    return (
        <div>
            <div className="flex items-center pr-2">
                <div className="flex-1 min-w-0">{fila(true)}</div>
                <BotonDesplegar abierta={abierta} onClick={() => setAbierta(a => !a)} titulo={cancion.titulo} />
            </div>
            {abierta && <PanelAcordes cancion={cancion} />}
        </div>
    );
}
