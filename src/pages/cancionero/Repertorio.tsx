import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { toast } from 'sonner';
import { Check, ChevronLeft, GripVertical, Loader2, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { norm, pedirPantallaCompleta, tonoDe } from '../../components/cancionero/utilidades';
import type { Cancion, Repertorio as TipoRepertorio } from '../../types/cancionero';

export default function Repertorio() {
    const { id } = useParams();
    const { repertorios, listo } = useCancionero();
    if (!listo) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
    const repertorio = repertorios.find(r => r.id === id);
    return repertorio ? <Editor key={repertorio.id} repertorio={repertorio} /> : <Navigate to="/cancionero?ver=repertorios" replace />;
}

function Editor({ repertorio }: { repertorio: TipoRepertorio }) {
    const navigate = useNavigate();
    const { canciones, guardarRepertorio, borrarRepertorio } = useCancionero();
    const [nombre, setNombre] = useState(repertorio.nombre);
    const [anadir, setAnadir] = useState(false);

    const porId = useMemo(() => new Map(canciones.map(c => [c.id, c])), [canciones]);
    const ids = repertorio.canciones.filter(c => porId.has(c));

    const cambiar = (cambio: Partial<TipoRepertorio>) => guardarRepertorio({ ...repertorio, ...cambio });
    const quitar = (id: string) => cambiar({ canciones: repertorio.canciones.filter(c => c !== id) });
    const alternar = (id: string) => cambiar({
        canciones: repertorio.canciones.includes(id) ? repertorio.canciones.filter(c => c !== id) : [...repertorio.canciones, id],
    });

    const tocar = (n = 0) => {
        pedirPantallaCompleta();
        navigate(`/cancionero/repertorio/${repertorio.id}/tocar${n ? `?n=${n}` : ''}`);
    };

    const borrar = () => {
        void borrarRepertorio(repertorio.id);
        toast('Repertorio borrado', { action: { label: 'Deshacer', onClick: () => guardarRepertorio(repertorio) } });
        navigate('/cancionero?ver=repertorios', { replace: true });
    };

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-0 pt-3 md:pt-6 pb-16">
            <Link to="/cancionero?ver=repertorios" className="inline-flex items-center -ml-1.5 text-[15px] text-muted-foreground active:opacity-60">
                <ChevronLeft className="h-5 w-5" /> Repertorios
            </Link>
            <input value={nombre} onChange={e => setNombre(e.target.value.slice(0, 120))} onBlur={() => nombre.trim() && nombre !== repertorio.nombre && cambiar({ nombre: nombre.trim() })}
                aria-label="Nombre del repertorio" placeholder="Nombre del repertorio"
                className="mt-1 w-full bg-transparent font-heading !text-[28px] font-bold leading-tight text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <div className="mt-1 flex items-center gap-2 text-[15px] text-muted-foreground">
                <input type="date" value={repertorio.fecha} onChange={e => cambiar({ fecha: e.target.value })} aria-label="Fecha del bolo"
                    className="bg-transparent text-muted-foreground focus:outline-none" />
                <span>· {ids.length} {ids.length === 1 ? 'canción' : 'canciones'}</span>
            </div>

            <button onClick={() => tocar()} disabled={!ids.length}
                className="pulsable mt-5 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40">
                <Play className="h-5 w-5" /> Tocar
            </button>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">Desliza de lado para pasar de canción. Funciona sin cobertura.</p>

            {ids.length > 0 ? (
                <Reorder.Group axis="y" values={ids} onReorder={orden => guardarRepertorio({ ...repertorio, canciones: orden }, { esperar: true })}
                    className="mt-6 rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                    {ids.map((id, i) => (
                        <Fila key={id} id={id} n={i + 1} cancion={porId.get(id)!} tono={tonoDe(porId.get(id)!)}
                            onQuitar={() => quitar(id)} onTocar={() => tocar(i)} />
                    ))}
                </Reorder.Group>
            ) : (
                <p className="mt-6 rounded-2xl bg-fill px-4 py-6 text-center text-[15px] text-muted-foreground">Añade las canciones en el orden en que las vas a tocar.</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setAnadir(true)} className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Añadir canciones
                </button>
                <Link to={`/cancionero/nueva?repertorio=${repertorio.id}`} className="pulsable h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold flex items-center gap-1.5">
                    Nueva canción
                </Link>
            </div>

            <button onClick={borrar} className="mt-10 h-11 px-1 flex items-center gap-2 text-[15px] text-destructive active:opacity-60">
                <Trash2 className="h-4 w-4" /> Borrar repertorio
            </button>

            <ElegirCanciones abierto={anadir} onCerrar={() => setAnadir(false)} canciones={canciones}
                elegidas={repertorio.canciones} onAlternar={alternar} repertorioId={repertorio.id} />
        </div>
    );
}

function Fila({ id, n, cancion, tono, onQuitar, onTocar }: {
    id: string; n: number; cancion: Cancion; tono: string | null; onQuitar: () => void; onTocar: () => void;
}) {
    const arrastre = useDragControls();
    return (
        <Reorder.Item value={id} dragListener={false} dragControls={arrastre} className="relative bg-sheet flex items-center gap-1 pl-1 pr-2 min-h-[60px]">
            <button onPointerDown={e => arrastre.start(e)} aria-label="Arrastra para ordenar"
                className="h-11 w-9 shrink-0 flex items-center justify-center text-muted-foreground touch-none cursor-grab">
                <GripVertical className="h-5 w-5" />
            </button>
            <span className="w-6 shrink-0 text-[14px] font-semibold text-muted-foreground tabular-nums">{n}</span>
            <Link to={`/cancionero/${cancion.id}`} className="flex-1 min-w-0 py-2.5 active:opacity-60">
                <span className="block truncate text-[16px] font-semibold text-foreground">{cancion.titulo}</span>
                {cancion.artista && <span className="block truncate text-[13px] text-muted-foreground">{cancion.artista}</span>}
            </Link>
            {tono && <span className="shrink-0 h-7 px-2.5 rounded-full bg-fill-strong text-[13px] font-semibold text-foreground flex items-center">{tono}</span>}
            <button onClick={onTocar} aria-label={`Tocar desde ${cancion.titulo}`} className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-foreground active:bg-fill">
                <Play className="h-4 w-4" />
            </button>
            <button onClick={onQuitar} aria-label={`Quitar ${cancion.titulo}`} className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill">
                <X className="h-4 w-4" />
            </button>
        </Reorder.Item>
    );
}

function ElegirCanciones({ abierto, onCerrar, canciones, elegidas, onAlternar, repertorioId }: {
    abierto: boolean; onCerrar: () => void; canciones: Cancion[]; elegidas: string[]; onAlternar: (id: string) => void; repertorioId: string;
}) {
    const [q, setQ] = useState('');
    const lista = useMemo(() => {
        const t = norm(q.trim());
        const l = t ? canciones.filter(c => norm(`${c.titulo} ${c.artista}`).includes(t)) : canciones;
        return [...l].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    }, [canciones, q]);
    return createPortal(
        <AnimatePresence>
            {abierto && (
                <motion.div className="fixed inset-0 z-[95] flex items-end md:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onCerrar} />
                    <motion.div role="dialog" aria-modal="true" aria-label="Añadir canciones"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-md h-[85dvh] md:h-[70vh] flex flex-col bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3 pb-[env(safe-area-inset-bottom)]">
                        <div className="px-4 pt-2 pb-3">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between">
                                <span className="w-[62px]" />
                                <p className="font-semibold text-[16px] text-foreground">Añadir canciones</p>
                                <button onClick={onCerrar} className="w-[62px] text-right text-[15px] font-semibold text-foreground active:opacity-60">Listo</button>
                            </div>
                            <label className="relative mt-3 block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en tu cancionero" aria-label="Buscar"
                                    className="w-full h-11 rounded-2xl bg-fill pl-12 pr-4 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                            </label>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-hairline border-t border-hairline">
                            {lista.map(c => {
                                const dentro = elegidas.includes(c.id);
                                return (
                                    <button key={c.id} onClick={() => onAlternar(c.id)} className="w-full min-h-[56px] px-4 py-2 flex items-center gap-3 text-left active:bg-fill">
                                        <span className="flex-1 min-w-0">
                                            <span className="block truncate text-[16px] font-semibold text-foreground">{c.titulo}</span>
                                            {c.artista && <span className="block truncate text-[13px] text-muted-foreground">{c.artista}</span>}
                                        </span>
                                        <span className={cn('h-7 w-7 shrink-0 rounded-full flex items-center justify-center', dentro ? 'bg-foreground text-background' : 'border border-hairline-strong')}>
                                            {dentro && <Check className="h-4 w-4" />}
                                        </span>
                                    </button>
                                );
                            })}
                            {lista.length === 0 && (
                                <p className="px-4 py-8 text-center text-[15px] text-muted-foreground">
                                    {canciones.length ? `Nada con «${q}».` : 'Aún no tienes canciones en el cancionero.'}
                                </p>
                            )}
                        </div>
                        <div className="p-3 border-t border-hairline">
                            <Link to={`/cancionero/nueva?repertorio=${repertorioId}`} className="pulsable h-11 rounded-[14px] bg-fill text-foreground text-[15px] font-semibold flex items-center justify-center gap-1.5">
                                <Plus className="h-4 w-4" /> Pegar una canción nueva
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
