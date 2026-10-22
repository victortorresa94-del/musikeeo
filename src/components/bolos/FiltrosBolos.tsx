import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TIPOS_ENCARGO, type TipoEncargo } from './tablon';

// Los filtros de antes (tipo de encargo y ciudad), en una hoja para que el tablón quede limpio

const Chip = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} aria-pressed={activo}
        className={cn('pulsable shrink-0 h-9 px-3.5 rounded-full text-[14px] font-semibold', activo ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
        {children}
    </button>
);

export function FiltrosBolos({ open, onClose, tipo, onTipo, ciudad, onCiudad, ciudades, resultados }: {
    open: boolean;
    onClose: () => void;
    tipo: TipoEncargo;
    onTipo: (t: TipoEncargo) => void;
    ciudad: string;
    onCiudad: (c: string) => void;
    ciudades: string[];
    resultados: number;
}) {
    useEffect(() => {
        if (!open) return;
        const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [open, onClose]);

    const hayFiltros = tipo !== 'todos' || !!ciudad;

    // Portal: el contenedor de la página lleva transform y descolocaría el fixed
    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar filtros" className="absolute inset-0 bg-black/40" onClick={onClose} />
                    <motion.div
                        role="dialog" aria-modal="true" aria-label="Filtros de bolos"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-md max-h-[88dvh] overflow-y-auto bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]"
                    >
                        <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                        <div className="mt-3 flex items-center justify-between">
                            <h2 className="text-[20px] font-bold text-foreground">Filtros</h2>
                            <button onClick={onClose} aria-label="Cerrar" className="pulsable h-9 w-9 rounded-full bg-fill flex items-center justify-center text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="mt-5 text-[15px] font-semibold text-foreground">Tipo de encargo</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {TIPOS_ENCARGO.map(t => <Chip key={t.id} activo={tipo === t.id} onClick={() => onTipo(t.id)}>{t.nombre}</Chip>)}
                        </div>

                        <p className="mt-6 text-[15px] font-semibold text-foreground">Ciudad</p>
                        <label className="relative mt-2 block">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <input
                                value={ciudad}
                                onChange={e => onCiudad(e.target.value)}
                                placeholder="Madrid, Barcelona…"
                                aria-label="Filtrar por ciudad"
                                className="w-full h-11 rounded-xl bg-fill pl-10 pr-10 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                            />
                            {ciudad && (
                                <button onClick={() => onCiudad('')} aria-label="Borrar ciudad" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </label>
                        {ciudades.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {ciudades.map(c => <Chip key={c} activo={ciudad === c} onClick={() => onCiudad(ciudad === c ? '' : c)}>{c}</Chip>)}
                            </div>
                        )}

                        <div className="mt-8 flex gap-2">
                            <button
                                onClick={() => { onTipo('todos'); onCiudad(''); }}
                                disabled={!hayFiltros}
                                className="pulsable flex-1 h-[52px] rounded-[14px] bg-fill text-[16px] font-semibold text-foreground disabled:opacity-40"
                            >
                                Borrar filtros
                            </button>
                            <button onClick={onClose} className="pulsable flex-[1.4] h-[52px] rounded-[14px] bg-foreground text-background text-[16px] font-semibold">
                                {resultados === 0 ? 'Ver resultados' : `Ver ${resultados} ${resultados === 1 ? 'bolo' : 'bolos'}`}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
