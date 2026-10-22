import type { ReactNode } from 'react';
import { cn } from '../../../../lib/utils';

/** Etiqueta pequeña arriba y el control debajo */
export function Campo({ etiqueta, ayuda, children, className }: { etiqueta: string; ayuda?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <div className={className}>
            <p className="mb-1.5 text-[13px] font-semibold text-muted-foreground">{etiqueta}</p>
            {children}
            {ayuda && <div className="mt-1.5 text-[13px] text-muted-foreground">{ayuda}</div>}
        </div>
    );
}

/** Pastilla de elegir: gris, y la elegida en negro (blanco en oscuro) */
export function Pastilla({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={on}
            className={cn('pulsable shrink-0 h-9 px-3.5 rounded-full text-[14px] font-semibold', on ? 'bg-foreground text-background' : 'bg-fill text-foreground', className)}
        >
            {children}
        </button>
    );
}
