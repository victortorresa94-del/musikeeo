import type { ReactNode } from 'react';
import { Columns3, List, Music2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type Vista = 'lista' | 'cifrado' | 'bloques';

const OPCIONES: Record<Vista, { nombre: string; icono: ReactNode }> = {
    lista: { nombre: 'Lista', icono: <List className="h-4 w-4" /> },
    cifrado: { nombre: 'Cifrado', icono: <Music2 className="h-4 w-4" /> },
    bloques: { nombre: 'Bloques', icono: <Columns3 className="h-4 w-4" /> },
};

// Cómo ver las canciones: la lista (para ordenar), el cifrado seguido (para tocar) o en bloques
export function SelectorVista({ valor, onCambio, opciones = ['lista', 'cifrado', 'bloques'], className }: {
    valor: Vista; onCambio: (v: Vista) => void; opciones?: Vista[]; className?: string;
}) {
    return (
        <div role="radiogroup" aria-label="Vista" className={cn('inline-flex p-1 rounded-full bg-fill gap-0.5', className)}>
            {opciones.map(v => (
                <button key={v} role="radio" aria-checked={valor === v} onClick={() => onCambio(v)}
                    className={cn('h-8 px-3 rounded-full text-[13.5px] font-semibold flex items-center gap-1.5',
                        valor === v ? 'bg-foreground text-background' : 'text-foreground')}>
                    {OPCIONES[v].icono}{OPCIONES[v].nombre}
                </button>
            ))}
        </div>
    );
}
