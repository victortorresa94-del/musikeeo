import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useCancionero } from '../../hooks/useCancionero';
import { Check } from 'lucide-react';
import { FormatoLetra } from './FormatoLetra';
import { cn } from '../../lib/utils';
import type { Cancion } from '../../types/cancionero';

// Editar la canción ahí mismo, sin ir a otra pantalla: el texto tal cual (acordes encima, [Am],
// partes, **negrita**, ==resaltado==, «> avisos»), en letra de máquina para que los acordes no se
// muevan de su sitio. Crece con el texto (la página se desliza, no el cuadro). «Listo» guarda.
// Lo usan la canción y Tocar: props { cancion, onGuardar(texto), onCerrar, lineaInicial? }
export function EditarEnSitio({ cancion, onGuardar, onCerrar, lineaInicial, className, barraArriba }: {
    cancion: Cancion;
    onGuardar: (texto: string) => void;
    onCerrar: () => void;
    lineaInicial?: number;      // la línea del texto donde se tocó: el cursor va ahí
    className?: string;
    barraArriba?: string;      // dónde se pega la barra al deslizar (clase «top-…»)
}) {
    const [texto, setTexto] = useState(cancion.texto);
    const areaRef = useRef<HTMLTextAreaElement>(null);
    const cambiado = texto !== cancion.texto;

    // Alto = el del texto: nada de barra de desplazamiento dentro del cuadro
    useLayoutEffect(() => {
        const a = areaRef.current;
        if (!a) return;
        a.style.height = 'auto';
        a.style.height = `${a.scrollHeight + 2}px`;
    }, [texto]);

    // Al abrir, el cursor en la línea tocada, sin que la página salte
    useEffect(() => {
        const a = areaRef.current;
        if (!a) return;
        const lineas = cancion.texto.split('\n');
        const n = Math.max(0, Math.min(lineaInicial ?? 0, lineas.length - 1));
        const pos = lineas.slice(0, n).reduce((s, l) => s + l.length + 1, 0);
        a.focus({ preventScroll: true });
        a.setSelectionRange(pos, pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cancelar = () => {
        if (cambiado && !window.confirm('¿Descartar los cambios?')) return;
        onCerrar();
    };
    const listo = () => {
        if (cambiado) onGuardar(texto);
        onCerrar();
    };

    // En el ordenador: Escape cancela, Ctrl/Cmd+Intro guarda
    const teclas = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar(); }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); listo(); }
    };

    return (
        <div className={cn('rounded-2xl border border-hairline-strong bg-sheet', className)} data-editar-en-sitio>
            {/* Arriba y pegada mientras se desliza: Cancelar · formato · Listo */}
            <div className={cn('sticky z-10', barraArriba ?? 'top-[calc(env(safe-area-inset-top)+56px)] md:top-16', ' flex items-center gap-2 px-2 py-2 rounded-t-2xl bg-sheet border-b border-hairline')}>
                <button onClick={cancelar} className="pulsable h-9 px-3 rounded-full text-[15px] text-muted-foreground shrink-0">Cancelar</button>
                <div className="flex-1 min-w-0 overflow-x-auto hide-scrollbar">
                    <FormatoLetra areaRef={areaRef} texto={texto} onCambio={setTexto} />
                </div>
                <button onClick={listo}
                    className="pulsable h-9 pl-3 pr-3.5 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold flex items-center gap-1 shrink-0">
                    <Check className="h-4 w-4" /> Listo
                </button>
            </div>
            <textarea ref={areaRef} value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={teclas}
                wrap="off" spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-label="Texto de la canción"
                className="block w-full resize-none overflow-x-auto overflow-y-hidden bg-transparent px-3 py-3 font-mono text-[15px] leading-[1.55] text-foreground outline-none" />
            <p className="px-3 pb-3 text-[12.5px] text-muted-foreground">
                Los acordes, en su línea encima de la letra (o así: [Am]). Partes: «Estribillo:». Se guarda en el móvil, también sin cobertura.
            </p>
        </div>
    );
}

// Lo mismo, encima de todo (para Tocar): guarda él mismo, con Deshacer, y no navega
export function EditarEnSitioHoja({ abierta, onCerrar, cancion }: { abierta: boolean; onCerrar: () => void; cancion: Cancion }) {
    const { guardar } = useCancionero();
    if (!abierta) return null;
    const alGuardar = (texto: string) => {
        const antes = cancion;
        guardar({ ...cancion, texto });
        toast.success('Canción guardada', { action: { label: 'Deshacer', onClick: () => guardar(antes) } });
    };
    return createPortal(
        <div className="fixed inset-0 z-[96] bg-background overflow-y-auto overscroll-contain px-3 pt-[calc(env(safe-area-inset-top)+8px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <p className="px-1 pb-2 text-[15px] font-semibold text-foreground truncate">{cancion.titulo}</p>
            <EditarEnSitio cancion={cancion} onGuardar={alGuardar} onCerrar={onCerrar} barraArriba="top-0" />
        </div>,
        document.body,
    );
}
