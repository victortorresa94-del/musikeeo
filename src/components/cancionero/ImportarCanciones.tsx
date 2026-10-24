import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { FileUp } from 'lucide-react';
import { Switch } from '../ui/switch';
import { useCancionero } from '../../hooks/useCancionero';
import { separarCanciones } from '../../lib/acordes';
import { norm } from './utilidades';

const AYUDA = `Pega varias canciones seguidas, separadas por una línea con ---

Primera canción - Artista
Am          F
Letra con sus acordes…
---
Segunda canción - Artista
…`;

// Un repertorio entero de golpe: pegado o en archivos (.txt, ChordPro). Si una canción ya
// está en el cancionero (mismo título y artista) no se duplica.
export function ImportarCanciones({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
    const navigate = useNavigate();
    const { canciones, crear, crearRepertorio } = useCancionero();
    const [texto, setTexto] = useState('');
    const [conRepertorio, setConRepertorio] = useState(true);
    const [nombre, setNombre] = useState('');
    const archivoRef = useRef<HTMLInputElement>(null);

    const encontradas = useMemo(() => separarCanciones(texto), [texto]);
    const yaEsta = (t: { titulo: string; artista: string }) =>
        canciones.find(c => norm(c.titulo) === norm(t.titulo) && norm(c.artista) === norm(t.artista));

    const abrir = async (archivos: FileList | null) => {
        if (!archivos?.length) return;
        const textos = await Promise.all([...archivos].filter(f => f.size < 2_000_000).map(f => f.text()));
        setTexto(t => [t.trim(), ...textos].filter(Boolean).join('\n---\n'));
        if (!nombre && archivos.length === 1) setNombre(archivos[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    };

    const importar = () => {
        const ids = encontradas.map(t => (yaEsta(t) ?? crear(t)).id);
        const nuevas = encontradas.filter(t => !yaEsta(t)).length;
        setTexto('');
        onCerrar();
        if (conRepertorio && ids.length > 1) {
            const r = crearRepertorio(nombre.trim() || `Bolo ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`, ids);
            toast.success(`${ids.length} canciones en el repertorio`);
            navigate(`/cancionero/repertorio/${r.id}`);
        } else {
            toast.success(nuevas === 1 ? 'Canción añadida' : `${nuevas} canciones añadidas`);
        }
    };

    return createPortal(
        <AnimatePresence>
            {abierto && (
                <motion.div className="fixed inset-0 z-[95] flex items-end md:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onCerrar} />
                    <motion.div role="dialog" aria-modal="true" aria-label="Importar canciones"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-lg max-h-[92dvh] overflow-y-auto bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        <div className="sticky top-0 z-10 bg-sheet px-4 pt-2 pb-2">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between">
                                <button onClick={onCerrar} className="w-[70px] text-left text-[15px] text-muted-foreground active:opacity-60">Cancelar</button>
                                <p className="font-semibold text-[16px] text-foreground">Importar canciones</p>
                                <span className="w-[70px]" />
                            </div>
                        </div>
                        <div className="px-4">
                            <button onClick={() => archivoRef.current?.click()} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                                <FileUp className="h-4 w-4" /> Abrir archivos
                            </button>
                            <input ref={archivoRef} type="file" multiple className="hidden" accept=".txt,.cho,.chopro,.chordpro,.crd,.pro,text/plain"
                                onChange={e => { void abrir(e.target.files); e.target.value = ''; }} />
                            <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder={AYUDA} wrap="off" spellCheck={false} aria-label="Canciones"
                                className="mt-3 w-full h-[34dvh] rounded-2xl bg-fill p-4 font-mono text-[13px] leading-[1.45] text-foreground placeholder:text-muted-foreground resize-y focus:outline-none" />

                            {encontradas.length > 0 && (
                                <>
                                    <p className="mt-3 text-[13px] font-semibold text-muted-foreground">
                                        {encontradas.length === 1 ? '1 canción' : `${encontradas.length} canciones`}
                                    </p>
                                    <ol className="mt-1 rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                                        {encontradas.map((t, i) => (
                                            <li key={i} className="px-4 py-2 flex items-center gap-3">
                                                <span className="w-5 text-[13px] font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                                                <span className="flex-1 min-w-0 truncate text-[15px] text-foreground">
                                                    {t.titulo}{t.artista && <span className="text-muted-foreground"> · {t.artista}</span>}
                                                </span>
                                                {yaEsta(t) && <span className="text-[12px] text-muted-foreground">ya la tienes</span>}
                                            </li>
                                        ))}
                                    </ol>
                                    {encontradas.length > 1 && (
                                        <div className="mt-3 rounded-2xl bg-fill px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[15px] font-semibold text-foreground">Hacer un repertorio con ellas</p>
                                                <Switch checked={conRepertorio} onCheckedChange={setConRepertorio} aria-label="Hacer un repertorio con ellas" />
                                            </div>
                                            {conRepertorio && (
                                                <input value={nombre} onChange={e => setNombre(e.target.value.slice(0, 120))} placeholder="Nombre (p. ej. Boda Marta y Jordi)" aria-label="Nombre del repertorio"
                                                    className="mt-2 w-full h-11 rounded-xl bg-sheet px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            <button onClick={importar} disabled={!encontradas.length}
                                className="pulsable mt-4 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] disabled:opacity-40">
                                {encontradas.length > 1 ? `Importar ${encontradas.length} canciones` : 'Importar'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
