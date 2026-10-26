import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// Hoja inferior del mapa (el patrón de HojaPropuesta del chat): sube con muelle, se cierra
// tocando fuera, con la X o con Escape. En el ordenador sale centrada.
export function Hoja({ abierta, onCerrar, titulo, etiqueta, children }: {
    abierta: boolean;
    onCerrar: () => void;
    titulo?: string;
    etiqueta: string;
    children: ReactNode;
}) {
    useEffect(() => {
        if (!abierta) return;
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [abierta, onCerrar]);

    return createPortal(
        <AnimatePresence>
            {abierta && (
                <motion.div key="hoja-mapa" className="fixed inset-0 z-[85] flex items-end md:items-center justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/30" onClick={onCerrar} />
                    <motion.div role="dialog" aria-modal="true" aria-label={etiqueta}
                        initial={{ y: 48 }} animate={{ y: 0 }} exit={{ y: 48 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-md max-h-[88dvh] flex flex-col bg-sheet text-foreground rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3">
                        <header className="shrink-0 px-4 pt-2">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between gap-3">
                                {titulo ? <h2 className="text-[17px] font-bold">{titulo}</h2> : <span />}
                                <button onClick={onCerrar} aria-label="Cerrar" className="pulsable h-9 w-9 shrink-0 rounded-full bg-fill flex items-center justify-center">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
