import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { textoDuracion } from '../../lib/biblioteca';
import { minutos } from '../../lib/cantar';
import { NOMBRE_TABLERO, columnas, type CampoTablero, type Columna } from '../../lib/tablero';
import type { Cancion } from '../../types/cancionero';
import { estiloBloque, pastelCanta, pastelDe } from './estilo';

// La vista Bloques: un tablero de columnas que se desliza de lado (como los bloques de la
// Agenda de Aura). Arrastrar una tarjeta por su asa a otra columna cambia ese dato de la ficha
export function TableroBloques({ canciones, campo, onCampo, campos, tonoDe, onMover, onAbrir, onAnadir }: {
    canciones: Cancion[];
    campo: CampoTablero;
    onCampo: (c: CampoTablero) => void;
    campos: CampoTablero[];
    tonoDe: (c: Cancion) => string | null;
    onMover: (c: Cancion, desde: string, hacia: string) => void;
    onAbrir: (c: Cancion) => void;
    onAnadir?: (columna: Columna) => void;
}) {
    const cols = useMemo(() => columnas(canciones, campo, tonoDe), [canciones, campo, tonoDe]);
    const [arrastre, setArrastre] = useState<{ cancion: Cancion; desde: string; x: number; y: number; sobre: string | null } | null>(null);
    const tableroRef = useRef<HTMLDivElement>(null);
    const autoRef = useRef(0);

    const columnaEn = (x: number, y: number) => {
        const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-columna]');
        return el ? el.dataset.columna ?? null : null;
    };

    const empezar = (e: React.PointerEvent, cancion: Cancion, desde: string) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setArrastre({ cancion, desde, x: e.clientX, y: e.clientY, sobre: desde });
    };
    const mover = (e: React.PointerEvent) => {
        if (!arrastre) return;
        const sobre = columnaEn(e.clientX, e.clientY);
        setArrastre(a => (a ? { ...a, x: e.clientX, y: e.clientY, sobre } : a));
        // Cerca del borde, el tablero se desliza solo
        const t = tableroRef.current;
        if (!t) return;
        const caja = t.getBoundingClientRect();
        const borde = 40;
        cancelAnimationFrame(autoRef.current);
        const d = e.clientX < caja.left + borde ? -12 : e.clientX > caja.right - borde ? 12 : 0;
        if (d) { const paso = () => { t.scrollLeft += d; autoRef.current = requestAnimationFrame(paso); }; autoRef.current = requestAnimationFrame(paso); }
    };
    const soltar = () => {
        cancelAnimationFrame(autoRef.current);
        if (arrastre && arrastre.sobre !== null && arrastre.sobre !== arrastre.desde) onMover(arrastre.cancion, arrastre.desde, arrastre.sobre);
        setArrastre(null);
    };

    return (
        <div>
            <div className="-mx-4 px-4 md:mx-0 md:px-0 mb-2 flex items-center gap-1.5 overflow-x-auto hide-scrollbar" role="radiogroup" aria-label="Agrupar los bloques por">
                <span className="shrink-0 text-[13px] font-semibold text-muted-foreground pr-1">Por</span>
                {campos.map(c => (
                    <button key={c} role="radio" aria-checked={campo === c} onClick={() => onCampo(c)}
                        className={cn('h-8 px-3 shrink-0 rounded-full text-[13.5px] font-semibold', campo === c ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                        {NOMBRE_TABLERO[c]}
                    </button>
                ))}
            </div>
            <div ref={tableroRef} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
                className={cn('-mx-4 px-4 md:mx-0 md:px-0 flex gap-3 overflow-x-auto pb-3 hide-scrollbar', !arrastre && 'snap-x snap-mandatory')}>
                {cols.map(col => (
                    <section key={col.clave || '_'} data-columna={col.clave} aria-label={col.titulo}
                        className={cn('snap-start shrink-0 w-[78vw] max-w-[300px] md:w-[280px] rounded-[20px] p-2 transition-colors',
                            arrastre?.sobre === col.clave && arrastre.desde !== col.clave ? 'bg-fill-strong ring-2 ring-foreground/20' : 'bg-fill')}>
                        <header className="px-1.5 pt-1 pb-2 flex items-center gap-2">
                            <span className={cn('h-3 w-3 shrink-0 rounded-full', colorColumna(campo, col).fondo)} aria-hidden />
                            <h3 className="flex-1 min-w-0 truncate text-[15px] font-bold text-foreground">{col.titulo}</h3>
                            <span className="shrink-0 text-[12.5px] font-semibold text-muted-foreground tabular-nums">
                                {col.canciones.length}{col.canciones.length > 0 && ` · ${col.estimada ? '≈ ' : ''}${textoDuracion(col.segundos)}`}
                            </span>
                        </header>
                        <ul className="space-y-1.5 min-h-[56px]">
                            {col.canciones.map(c => (
                                <li key={c.id} className={cn('rounded-[14px] bg-sheet shadow-e1 flex items-center', arrastre?.cancion.id === c.id && arrastre.desde === col.clave && 'opacity-40')}>
                                    <button onPointerDown={e => empezar(e, c, col.clave)} aria-label={`Arrastra «${c.titulo}» a otra columna`}
                                        className="h-[52px] w-8 shrink-0 flex items-center justify-center text-muted-foreground touch-none cursor-grab">
                                        <GripVertical className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => onAbrir(c)} className="flex-1 min-w-0 py-2 pr-2.5 text-left">
                                        <Tarjeta cancion={c} tono={tonoDe(c)} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {onAnadir && (
                            <button onClick={() => onAnadir(col)} className="mt-1.5 w-full h-10 rounded-[14px] text-[14px] font-semibold text-muted-foreground flex items-center justify-center gap-1 active:bg-fill-strong">
                                <Plus className="h-4 w-4" /> Añadir aquí
                            </button>
                        )}
                    </section>
                ))}
            </div>
            <p className="text-[12.5px] text-muted-foreground">Arrastra una tarjeta por su asa a otra columna para cambiarle {campo === 'bloque' ? 'el bloque' : `«${NOMBRE_TABLERO[campo].toLowerCase()}»`}.</p>
            {arrastre && createPortal(
                <div className="fixed z-[100] pointer-events-none w-[240px] rounded-[14px] bg-sheet shadow-e3 border border-hairline px-3 py-2 rotate-2"
                    style={{ left: arrastre.x - 30, top: arrastre.y - 26 }}>
                    <Tarjeta cancion={arrastre.cancion} tono={tonoDe(arrastre.cancion)} />
                </div>,
                document.body,
            )}
        </div>
    );
}

function colorColumna(campo: CampoTablero, col: Columna) {
    if (!col.clave) return { fondo: 'bg-hairline-strong' };
    if (campo === 'bloque' || campo === 'estilos') return estiloBloque(col.clave).pastel;
    if (campo === 'canta') return pastelCanta(col.clave);
    return pastelDe(`${campo}:${col.clave.toLowerCase()}`);
}

function Tarjeta({ cancion: c, tono }: { cancion: Cancion; tono: string | null }) {
    const canta = c.ficha?.canta;
    return (
        <span className="flex items-center gap-2">
            <span className="flex-1 min-w-0">
                <span className="block truncate text-[14.5px] font-semibold text-foreground">{c.titulo}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                    {canta && <span className={cn('h-[18px] px-1.5 rounded-full font-semibold flex items-center truncate max-w-[110px]', pastelCanta(canta).fondo, pastelCanta(canta).tinta)}>{canta}</span>}
                    {c.duracion ? <span className="tabular-nums">{minutos(c.duracion)}</span> : null}
                    {c.version && <span className="truncate">· {c.version}</span>}
                </span>
            </span>
            {tono && <span className="shrink-0 min-w-[30px] h-6 px-2 rounded-full bg-fill-strong text-[12px] font-bold text-foreground flex items-center justify-center">{tono}</span>}
        </span>
    );
}
