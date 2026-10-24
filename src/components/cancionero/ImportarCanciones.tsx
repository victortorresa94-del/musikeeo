import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardPaste, FileUp } from 'lucide-react';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { leerCancion, lineasDeLetra, separarCanciones } from '../../lib/acordes';
import { leerSetlist, type CancionImportada } from '../../lib/setlist';
import { norm } from './utilidades';
import type { Cancion } from '../../types/cancionero';

const AYUDA = `Pega el setlist del bolo, una línea por tema:

Hace calor — G
Bamboléo — Em (capo 3)

Cada tema sale como una ficha con su tono (y luego le pegas los acordes).

O canciones enteras con sus acordes, separadas por una línea con ---`;

const letra = (texto: string) => lineasDeLetra(leerCancion(texto));

// Con qué canción del cancionero se junta lo que llega: si ya está, se reutiliza; una ficha
// del setlist (sin artista) o una chuleta de acordes sin letra se rellena con la canción entera
function emparejar(canciones: Cancion[], t: CancionImportada): { ya?: Cancion; rellena?: Cancion } {
    const c = canciones.find(c => norm(c.titulo) === norm(t.titulo) && (t.ficha || !c.artista || !t.artista || norm(c.artista) === norm(t.artista)));
    if (!c) return {};
    if (!t.ficha && c.texto.trim() !== t.texto.trim() && (!c.artista || (letra(t.texto) >= 8 && letra(c.texto) < 8))) return { rellena: c };
    return { ya: c };
}

// Un repertorio entero de golpe: el setlist (una ficha por tema) o canciones enteras, pegado o
// en archivos (.txt, ChordPro). Lo que ya está en el cancionero no se duplica: una ficha se
// une a la canción del mismo título (que ya trae sus acordes).
export function ImportarCanciones({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
    const navigate = useNavigate();
    const { canciones, repertorios, nuevaCancion, guardarVarias, crearRepertorio } = useCancionero();
    const [texto, setTexto] = useState('');
    const [conRepertorio, setConRepertorio] = useState(true);
    const [nombre, setNombre] = useState('');
    const archivoRef = useRef<HTMLInputElement>(null);

    const encontradas: CancionImportada[] = useMemo(() => leerSetlist(texto) ?? separarCanciones(texto), [texto]);
    const esSetlist = encontradas.some(t => t.ficha);
    const parejas = useMemo(() => encontradas.map(t => emparejar(canciones, t)), [encontradas, canciones]);

    const pegar = async () => {
        try {
            const t = await navigator.clipboard.readText();
            if (t.trim()) setTexto(t); else toast('No hay nada copiado.');
        } catch {
            toast('Mantén pulsado el recuadro y elige «Pegar».');
        }
    };

    const abrir = async (archivos: FileList | null) => {
        if (!archivos?.length) return;
        const textos = await Promise.all([...archivos].filter(f => f.size < 2_000_000).map(f => f.text()));
        setTexto(t => [t.trim(), ...textos].filter(Boolean).join('\n---\n'));
        if (!nombre && archivos.length === 1) setNombre(archivos[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    };

    const importar = () => {
        const corta = (t: CancionImportada) => t.ficha || t.texto.split('\n').length <= 25;
        let nuevas = 0, rellenas = 0;
        const aGuardar: Cancion[] = [];
        let ids: string[];
        try {
            ids = encontradas.map((t, i) => {
                const { ya, rellena } = parejas[i];
                if (ya) return ya.id;
                if (rellena) {
                    rellenas++;
                    aGuardar.push({ ...rellena, artista: t.artista || rellena.artista, texto: t.texto, ajustes: { ...rellena.ajustes, ajustar: corta(t) } });
                    return rellena.id;
                }
                nuevas++;
                // Lo corto (fichas y chuletas de acordes) se ve entero y grande: «que quepa»
                const nueva = nuevaCancion(t, corta(t) ? { ajustar: true } : {});
                aGuardar.push(nueva);
                return nueva.id;
            });
            guardarVarias(aGuardar);
        } catch (e) {
            toast.error(`No se pudo importar: ${e instanceof Error ? e.message : 'error desconocido'}`);
            return;
        }
        setTexto('');
        onCerrar();
        const aviso = [nuevas && `${nuevas} nuevas`, rellenas && `${rellenas} fichas completadas`].filter(Boolean).join(' y ') || 'Ya las tenías';
        // Si ya hay un repertorio con estas mismas canciones (se rellenaron sus fichas), se abre ese
        const mismo = repertorios.find(r => r.canciones.length === ids.length && r.canciones.every((c, i) => c === ids[i]));
        // Si solo se completaron fichas, no hace falta otro repertorio: se abre el que ya las tiene
        const contiene = nuevas ? undefined : repertorios.find(r => ids.every(id => r.canciones.includes(id)));
        if (conRepertorio && ids.length > 1) {
            const r = mismo ?? contiene ?? crearRepertorio(nombre.trim() || `Bolo ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`, ids);
            toast.success(aviso);
            navigate(`/cancionero/repertorio/${r.id}`);
        } else {
            toast.success(aviso);
        }
    };

    return createPortal(
        <AnimatePresence>
            {abierto && (
                <motion.div className="fixed inset-0 z-[95] flex items-end md:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onCerrar} />
                    <motion.div role="dialog" aria-modal="true" aria-label="Importar canciones"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-lg max-h-[92dvh] overflow-y-auto overscroll-contain bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        <div className="sticky top-0 z-10 bg-sheet px-4 pt-2 pb-2">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between">
                                <button onClick={onCerrar} className="w-[70px] text-left text-[15px] text-muted-foreground active:opacity-60">Cancelar</button>
                                <p className="font-semibold text-[16px] text-foreground">Importar canciones</p>
                                <button onClick={importar} disabled={!encontradas.length}
                                    className="w-[70px] text-right text-[15px] font-semibold text-foreground disabled:opacity-30 active:opacity-60">Importar</button>
                            </div>
                        </div>
                        <div className="px-4">
                            <div className="flex gap-2">
                                <button onClick={pegar} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                                    <ClipboardPaste className="h-4 w-4" /> Pegar lo copiado
                                </button>
                                <button onClick={() => archivoRef.current?.click()} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                                    <FileUp className="h-4 w-4" /> Abrir archivos
                                </button>
                            </div>
                            <input ref={archivoRef} type="file" multiple className="hidden" accept=".txt,.cho,.chopro,.chordpro,.crd,.pro,text/plain"
                                onChange={e => { void abrir(e.target.files); e.target.value = ''; }} />
                            <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder={AYUDA} wrap="off" spellCheck={false} aria-label="Canciones"
                                className={cn('mt-3 w-full rounded-2xl bg-fill p-4 font-mono text-[13px] leading-[1.45] text-foreground placeholder:text-muted-foreground resize-y focus:outline-none', encontradas.length ? 'h-[16dvh]' : 'h-[34dvh]')} />

                            {encontradas.length > 0 && (
                                <>
                                    <p className="mt-3 text-[13px] font-semibold text-muted-foreground">
                                        {encontradas.length === 1 ? '1 canción' : `${encontradas.length} ${esSetlist ? 'fichas del setlist' : 'canciones'}`}
                                    </p>
                                    <ol className="mt-1 rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                                        {encontradas.map((t, i) => (
                                            <li key={i} className="px-4 py-2 flex items-center gap-3">
                                                <span className="w-5 text-[13px] font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                                                <span className="flex-1 min-w-0 truncate text-[15px] text-foreground">
                                                    {t.titulo}{t.artista && <span className="text-muted-foreground"> · {t.artista}</span>}
                                                </span>
                                                {parejas[i]?.ya ? <span className="text-[12px] text-muted-foreground">ya la tienes</span>
                                                    : parejas[i]?.rellena && <span className="text-[12px] text-muted-foreground">rellena la ficha</span>}
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
