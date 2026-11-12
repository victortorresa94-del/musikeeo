import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// Una hoja que sube desde abajo (en el ordenador, centrada), como las de iOS: título en medio,
// «Cancelar»/«Borrar» a la izquierda y la acción a la derecha
export function Hoja({ abierta, onCerrar, titulo, izquierda, derecha, children, alta, encima, pie }: {
    abierta: boolean;
    onCerrar: () => void;
    titulo: string;
    izquierda?: ReactNode;
    derecha?: ReactNode;
    children: ReactNode;
    alta?: boolean;          // ocupa casi toda la pantalla (listas largas)
    encima?: boolean;        // sobre otra hoja ya abierta
    pie?: ReactNode;         // fijo abajo
}) {
    // En el ordenador, Escape la cierra (antes que cualquier otro atajo de la página, como salir de Tocar)
    useEffect(() => {
        if (!abierta) return;
        const f = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onCerrar(); } };
        window.addEventListener('keydown', f, true);
        return () => window.removeEventListener('keydown', f, true);
    }, [abierta, onCerrar]);
    return createPortal(
        <AnimatePresence>
            {abierta && (
                <motion.div className={cn('fixed inset-0 flex items-end md:items-center justify-center', encima ? 'z-[100]' : 'z-[95]')}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onCerrar} />
                    <motion.div role="dialog" aria-modal="true" aria-label={titulo}
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className={cn('relative w-full md:max-w-md flex flex-col bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3 pb-[env(safe-area-inset-bottom)]',
                            alta ? 'h-[88dvh] md:h-[75vh]' : 'max-h-[85dvh]')}>
                        <div className="shrink-0 px-4 pt-2 pb-2">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="w-[76px] text-left">{izquierda}</span>
                                <p className="flex-1 min-w-0 truncate text-center font-semibold text-[16px] text-foreground">{titulo}</p>
                                <span className="w-[76px] text-right">{derecha}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
                        {pie && <div className="shrink-0 p-3 border-t border-hairline">{pie}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

export function BotonHoja({ children, onClick, fuerte, disabled }: { children: ReactNode; onClick: () => void; fuerte?: boolean; disabled?: boolean }) {
    return (
        <button onClick={onClick} disabled={disabled}
            className={cn('text-[15px] active:opacity-60 disabled:opacity-30', fuerte ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
            {children}
        </button>
    );
}
