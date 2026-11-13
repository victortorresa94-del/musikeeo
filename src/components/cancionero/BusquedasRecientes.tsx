import { Clock, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Debajo del buscador, al tocarlo vacío: las búsquedas recientes. Un toque la repite; la ✕ la quita.
// onMouseDown evita que el buscador pierda el foco antes del toque
export function BusquedasRecientes({ recientes, onElegir, onQuitar, onBorrar, className }: {
    recientes: string[]; onElegir: (q: string) => void; onQuitar: (q: string) => void; onBorrar: () => void; className?: string;
}) {
    if (!recientes.length) return null;
    return (
        <div className={cn('rounded-2xl bg-sheet border border-hairline shadow-e3 overflow-hidden', className)} onMouseDown={e => e.preventDefault()}>
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Recientes</span>
                <button onClick={onBorrar} className="h-7 px-2 -mr-1 rounded-full text-[13px] font-semibold text-muted-foreground active:bg-fill">Borrar</button>
            </div>
            {recientes.map(r => (
                <div key={r} className="flex items-center">
                    <button onClick={() => onElegir(r)} className="flex-1 min-w-0 flex items-center gap-3 px-3 h-11 text-left active:bg-fill">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-[15.5px] text-foreground">{r}</span>
                    </button>
                    <button onClick={() => onQuitar(r)} aria-label={`Quitar «${r}» de recientes`} className="h-11 w-11 shrink-0 flex items-center justify-center text-muted-foreground active:bg-fill">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
