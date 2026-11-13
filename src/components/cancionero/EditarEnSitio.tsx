import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useCancionero } from '../../hooks/useCancionero';
import { AlignLeft, Bold, Check, Heading, Highlighter, Loader2, Megaphone, MoreHorizontal, Redo2, Undo2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Cancion } from '../../types/cancionero';
import type { EditorLetraApi } from './EditorLetra';
import { cargarEditorLetra, editorLetraCargado } from './cargarEditorLetra';

// Editar la canción ahí mismo, encima de la hoja y con su aspecto (13-nov, Víctor: «sin que
// cambie el formato y se convierta en un editor de texto rudimentario»; y del «¿Cómo la guardo?»:
// «esta barbaridad de UI/UX para guardar»). Se escribe como en Notion: los acordes en negrita,
// las partes con su color, la **negrita** y el ==resaltado== se ven al ponerlos. «Listo» guarda
// (quien lo usa avisa con Deshacer); «Guardar como versión nueva» y «Descartar», en el ⋯.
// Lo usan la canción y Tocar: props { cancion, onGuardar(texto), onCerrar, lineaInicial? }.
// Con repertorioId, la versión nueva ocupa el sitio de la original en ese repertorio
export function EditarEnSitio({ cancion, onGuardar, onCerrar, lineaInicial, yInicial, className, barraArriba, repertorioId, onNueva, onNuevaDeshecha, tamano, onTamano }: {
    cancion: Cancion;
    onGuardar: (texto: string) => void;
    onCerrar: () => void;
    lineaInicial?: number;      // la línea del texto donde se tocó: el cursor va ahí
    yInicial?: number | null;   // dónde estaba el dedo: esa línea se queda ahí al abrir
    className?: string;
    barraArriba?: string;      // dónde se pega la barra al deslizar (clase «top-…»)
    repertorioId?: string;     // editando desde un repertorio: la copia nueva va en su sitio
    onNueva?: (nueva: Cancion) => void;
    onNuevaDeshecha?: () => void;  // Deshacer la copia: volver a la original
    tamano?: number;           // el tamaño de letra con que se estaba viendo
    onTamano?: (d: -1 | 1) => void;  // A− / A+: cambia el tamaño de la canción (se guarda en ella)
}) {
    const { canciones, repertorios, nuevaCancion, guardar, borrar, guardarRepertorio } = useCancionero();
    const api = useRef<EditorLetraApi>(null);
    const [texto, setTexto] = useState(cancion.texto);
    const [alinear, setAlinear] = useState(() => { try { return localStorage.getItem('musikeeo-editor-alinear') === '1'; } catch { return false; } });
    const [menu, setMenu] = useState(false);
    const repertorio = repertorioId ? repertorios.find(r => r.id === repertorioId) : undefined;
    const [nombreVersion, setNombreVersion] = useState(repertorio?.nombre.slice(0, 40) ?? 'Mi versión');
    const cambiado = texto !== cancion.texto;
    // El editor, ya precargado al abrir la canción (si no, llega en un momento)
    const [Editor, setEditor] = useState(() => editorLetraCargado());
    useEffect(() => { if (!Editor) void cargarEditorLetra().then(c => setEditor(() => c)); }, [Editor]);

    // Si se sale sin «Listo» (otra página, atrás), lo escrito no se pierde
    const pendiente = useRef<string | null>(null);
    useEffect(() => { pendiente.current = cambiado ? texto : null; }, [texto, cambiado]);
    const guardarRef = useRef(onGuardar);
    useEffect(() => { guardarRef.current = onGuardar; }, [onGuardar]);
    useEffect(() => () => { if (pendiente.current !== null) guardarRef.current(pendiente.current); }, []);

    const listo = () => {
        const final = api.current?.texto() ?? texto;
        pendiente.current = null;
        if (final !== cancion.texto) onGuardar(final);
        onCerrar();
    };
    const descartar = () => {
        pendiente.current = null;
        setMenu(false);
        onCerrar();
        if (cambiado) toast('Cambios descartados');
    };
    // Una canción nueva con el texto editado: una versión unida a la original (que no se toca)
    const comoNueva = () => {
        const final = api.current?.texto() ?? texto;
        const base = cancion.original ? canciones.find(c => c.id === cancion.original) ?? cancion : cancion;
        const version = nombreVersion.trim().slice(0, 40) || 'Mi versión';
        const nueva: Cancion = {
            ...nuevaCancion({ titulo: base.titulo, artista: base.artista, texto: final }),
            ajustes: { ...cancion.ajustes }, ficha: cancion.ficha && { ...cancion.ficha },
            portada: cancion.portada, duracion: cancion.duracion, muestra: cancion.muestra, bpm: cancion.bpm,
            notas: cancion.notas, version, original: base.id,
        };
        pendiente.current = null;
        guardar(nueva);
        const antesRep = repertorio;
        if (repertorio) guardarRepertorio({ ...repertorio, canciones: repertorio.canciones.map(id => (id === cancion.id ? nueva.id : id)) });
        toast.success(`Guardada como «${base.titulo}» (versión ${version})`, {
            description: repertorio ? `Está en «${repertorio.nombre}» en lugar de la otra. La original no cambia.` : 'La original no cambia.',
            action: { label: 'Deshacer', onClick: () => { if (antesRep) guardarRepertorio(antesRep); onNuevaDeshecha?.(); void borrar(nueva.id); } },
        });
        onNueva?.(nueva);
        onCerrar();
    };
    const cambiarAlinear = () => setAlinear(a => { try { localStorage.setItem('musikeeo-editor-alinear', a ? '0' : '1'); } catch { /* */ } return !a; });

    const e = () => api.current?.editor;
    const boton = 'pulsable h-9 min-w-9 px-2.5 rounded-full flex items-center justify-center gap-1.5 text-[14px] font-semibold text-foreground hover:bg-fill shrink-0';
    return (
        <div className={cn('relative', className)} data-editar-en-sitio>
            {/* Arriba y pegada mientras se desliza: formato · ⋯ · Listo */}
            <div className={cn('sticky z-10 -mx-1 mb-2', barraArriba ?? 'top-[calc(env(safe-area-inset-top)+56px)] md:top-16')}>
                <div className="flex items-center gap-1 rounded-full bg-sheet border border-hairline shadow-e2 p-1">
                    <div className="flex-1 min-w-0 flex items-center gap-0.5 overflow-x-auto hide-scrollbar" role="toolbar" aria-label="Formato">
                        <button onMouseDown={ev => ev.preventDefault()} onClick={() => e()?.chain().focus().undo().run()} aria-label="Deshacer" className={boton}><Undo2 className="h-4 w-4" /></button>
                        <button onMouseDown={ev => ev.preventDefault()} onClick={() => e()?.chain().focus().redo().run()} aria-label="Rehacer" className={boton}><Redo2 className="h-4 w-4" /></button>
                        <span className="mx-0.5 h-5 w-px bg-hairline-strong shrink-0" aria-hidden />
                        <button onMouseDown={ev => ev.preventDefault()} onClick={() => e()?.chain().focus().toggleBold().run()} aria-label="Negrita" className={boton}><Bold className="h-4 w-4" /><span className="hidden sm:inline">Negrita</span></button>
                        <button onMouseDown={ev => ev.preventDefault()} onClick={() => e()?.chain().focus().toggleHighlight().run()} aria-label="Resaltar" className={boton}><Highlighter className="h-4 w-4" /><span className="hidden sm:inline">Resaltar</span></button>
                        <button onMouseDown={ev => ev.preventDefault()} onClick={() => api.current?.alternarPrefijo('# ')} aria-label="Título" className={boton}><Heading className="h-4 w-4" /><span className="hidden sm:inline">Título</span></button>
                        <button onMouseDown={ev => ev.preventDefault()} onClick={() => api.current?.alternarPrefijo('> ')} aria-label="Aviso" className={boton}><Megaphone className="h-4 w-4" /><span className="hidden sm:inline">Aviso</span></button>
                        <button onMouseDown={ev => ev.preventDefault()} onClick={cambiarAlinear} aria-pressed={alinear} aria-label="Alinear acordes con letra de máquina"
                            className={cn(boton, alinear && 'bg-foreground text-background hover:bg-foreground')}><AlignLeft className="h-4 w-4" /><span className="hidden sm:inline">Alinear</span></button>
                        {/* El tamaño de la letra, ahí mismo (13-nov, Víctor: «poder hacer más pequeña la letra desde aquí») */}
                        {onTamano && <>
                            <span className="mx-0.5 h-5 w-px bg-hairline-strong shrink-0" aria-hidden />
                            <button onMouseDown={ev => ev.preventDefault()} onClick={() => onTamano(-1)} aria-label="Letra más pequeña" className={boton}><span className="text-[13px] font-bold">A−</span></button>
                            <button onMouseDown={ev => ev.preventDefault()} onClick={() => onTamano(1)} aria-label="Letra más grande" className={boton}><span className="text-[17px] font-bold">A+</span></button>
                        </>}
                    </div>
                    <div className="relative shrink-0">
                        <button onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label="Más: guardar como versión nueva o descartar" className={boton}><MoreHorizontal className="h-5 w-5" /></button>
                        {menu && (
                            <div className="absolute right-0 top-11 z-20 w-[280px] rounded-2xl bg-sheet border border-hairline shadow-e3 p-2">
                                <p className="px-1 text-[13px] font-semibold text-muted-foreground">Guardar como versión nueva</p>
                                <input value={nombreVersion} onChange={ev => setNombreVersion(ev.target.value.slice(0, 40))} aria-label="Nombre de la versión"
                                    onKeyDown={ev => { if (ev.key === 'Enter') comoNueva(); }} enterKeyHint="done"
                                    className="mt-1 w-full h-10 rounded-xl bg-fill px-3 text-[16px] text-foreground outline-none" />
                                <button onClick={comoNueva} className="pulsable mt-1.5 w-full h-10 rounded-xl bg-fill-strong text-[14px] font-semibold text-foreground">
                                    Guardar como versión{repertorio ? ' (en este repertorio)' : ''}
                                </button>
                                <p className="mt-1 px-1 text-[12px] text-muted-foreground">La original no cambia.</p>
                                <button onClick={descartar} className="mt-2 w-full h-10 rounded-xl text-[14px] font-semibold text-destructive hover:bg-fill">Descartar los cambios</button>
                            </div>
                        )}
                    </div>
                    <button onClick={listo} className="pulsable h-9 pl-3 pr-3.5 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold flex items-center gap-1 shrink-0">
                        <Check className="h-4 w-4" /> Listo
                    </button>
                </div>
            </div>
            {Editor
                ? <Editor ref={api} texto={cancion.texto} lineaInicial={lineaInicial} yInicial={yInicial} tamano={tamano} alinear={alinear}
                    onCambio={setTexto} onTeclaListo={listo} />
                : <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        </div>
    );
}

// Lo mismo, encima de todo (para Tocar): guarda él mismo, con Deshacer, y no navega
export function EditarEnSitioHoja({ abierta, onCerrar, cancion, repertorioId }: { abierta: boolean; onCerrar: () => void; cancion: Cancion; repertorioId?: string }) {
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
            <EditarEnSitio cancion={cancion} onGuardar={alGuardar} onCerrar={onCerrar} barraArriba="top-0" repertorioId={repertorioId} />
        </div>,
        document.body,
    );
}
