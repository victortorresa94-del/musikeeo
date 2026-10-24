import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

// Menos · valor · más, en una píldora
export function Paso({ etiqueta, valor, onMenos, onMas, menosDesactivado, masDesactivado, compacto, className }: {
    etiqueta: string; valor: React.ReactNode; onMenos: () => void; onMas: () => void;
    menosDesactivado?: boolean; masDesactivado?: boolean; compacto?: boolean; className?: string;
}) {
    const boton = cn('pulsable h-9 rounded-full flex items-center justify-center text-foreground disabled:opacity-30', compacto ? 'w-8' : 'w-9');
    return (
        <div className={cn('h-9 shrink-0 rounded-full bg-fill flex items-center', className)} role="group" aria-label={etiqueta}>
            <button type="button" onClick={onMenos} disabled={menosDesactivado} aria-label={`${etiqueta}: menos`} className={boton}>
                <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[36px] px-0.5 text-center text-[14px] font-semibold text-foreground tabular-nums whitespace-nowrap">{valor}</span>
            <button type="button" onClick={onMas} disabled={masDesactivado} aria-label={`${etiqueta}: más`} className={boton}>
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}

// Control segmentado estilo iOS
export function Segmentado<T extends string | number>({ opciones, valor, onCambio, etiqueta, desactivado }: {
    opciones: readonly (readonly [T, React.ReactNode])[]; valor: T; onCambio: (v: T) => void; etiqueta: string; desactivado?: boolean;
}) {
    return (
        <div className={cn('flex p-0.5 rounded-[10px] bg-fill', desactivado && 'opacity-40 pointer-events-none')} role="group" aria-label={etiqueta}>
            {opciones.map(([v, texto]) => (
                <button key={String(v)} type="button" onClick={() => onCambio(v)} aria-pressed={valor === v}
                    className={cn('flex-1 h-8 rounded-[8px] text-[13px] font-semibold whitespace-nowrap px-1 transition-colors',
                        valor === v ? 'bg-foreground text-background' : 'text-muted-foreground')}>
                    {texto}
                </button>
            ))}
        </div>
    );
}

// Botón redondo de la barra (seleccionado = invertido)
export function BotonBarra({ activo, etiqueta, onClick, children, className }: {
    activo?: boolean; etiqueta: string; onClick: () => void; children: React.ReactNode; className?: string;
}) {
    return (
        <button type="button" onClick={onClick} aria-label={etiqueta} title={etiqueta} aria-pressed={activo}
            className={cn('pulsable h-9 min-w-9 px-2.5 shrink-0 rounded-full flex items-center justify-center gap-1.5 text-[14px] font-semibold',
                activo ? 'bg-foreground text-background' : 'bg-fill text-foreground', className)}>
            {children}
        </button>
    );
}
