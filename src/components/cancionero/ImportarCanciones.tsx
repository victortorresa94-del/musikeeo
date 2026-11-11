import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardPaste, FileUp, Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { leerCancion, lineasDeLetra, separarCanciones } from '../../lib/acordes';
import { leerSetlist, type CancionImportada } from '../../lib/setlist';
import { leerCopia, mismoTitulo, sacarFicha, unirFichas, type Copia } from '../../lib/biblioteca';
import { claveTitulo } from '../../lib/buscarCanciones';
import { norm } from './utilidades';
import type { Cancion } from '../../types/cancionero';

const AYUDA = `Pega el setlist del bolo, una línea por tema:

Hace calor — G
Bamboléo — Em (capo 3)

Cada tema sale como una ficha con su tono (y luego le pegas los acordes).

O canciones enteras con sus acordes, separadas por una línea con ---`;

const letra = (texto: string) => lineasDeLetra(leerCancion(texto));

// Word (.docx, también un Google Docs descargado como Word), PDF, texto y ChordPro
const ACEPTA = [
    '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pdf', 'application/pdf',
    '.txt', 'text/plain', '.cho', '.chopro', '.chordpro', '.crd', '.pro',
    '.json', 'application/json',
].join(',');

// Con qué canción del cancionero se junta lo que llega: si ya está, se reutiliza; una ficha
// del setlist (sin artista) o una chuleta de acordes sin letra se rellena con la canción entera
// Si el título exacto no está, vale el mismo sin lo de entre paréntesis («Hace calor (Mucho
// mejor)» = «Hace calor»), pero solo si es inequívoco: dos versiones no se juntan en una
function emparejar(canciones: Cancion[], t: CancionImportada, unica: boolean): { ya?: Cancion; rellena?: Cancion } {
    const casa = (c: Cancion) => t.ficha || !c.artista || !t.artista || norm(c.artista) === norm(t.artista);
    let c = canciones.find(c => norm(c.titulo) === norm(t.titulo) && casa(c));
    if (!c && unica) {
        const parecidas = canciones.filter(x => mismoTitulo(x.titulo, t.titulo) && casa(x));
        if (parecidas.length === 1) c = parecidas[0];
    }
    if (!c) return {};
    if (!t.ficha && c.texto.trim() !== t.texto.trim() && (!c.artista || (letra(t.texto) >= 8 && letra(c.texto) < 8))) return { rellena: c };
    return { ya: c };
}

// Un repertorio entero de golpe: el setlist (una ficha por tema) o canciones enteras, pegado o
// en archivos (Word, PDF, .txt, ChordPro). Lo que ya está en el cancionero no se duplica: una
// ficha se une a la canción del mismo título (que ya trae sus acordes).
// Con repertorioId (desde un repertorio) todo lo importado entra al final de ese repertorio.
// Una copia del cancionero (.json) trae canciones con su ficha y sus repertorios
export function ImportarCanciones({ abierto, onCerrar, repertorioId }: { abierto: boolean; onCerrar: () => void; repertorioId?: string }) {
    const navigate = useNavigate();
    const { canciones, repertorios, nuevaCancion, guardarVarias, crearRepertorio, guardarRepertorio } = useCancionero();
    const destino = repertorios.find(r => r.id === repertorioId);
    const [texto, setTexto] = useState('');
    const [conRepertorio, setConRepertorio] = useState(true);
    const [nombre, setNombre] = useState('');
    const [leyendo, setLeyendo] = useState(false);
    const archivoRef = useRef<HTMLInputElement>(null);

    const copia: Copia | null = useMemo(() => leerCopia(texto), [texto]);
    const encontradas: CancionImportada[] = useMemo(() => {
        if (copia) return copia.canciones.map(c => ({
            // Una chuleta (acordes y notas, sin letra) cuenta como ficha: nunca pisa la letra que ya tengas
            titulo: c.titulo.slice(0, 120), artista: (c.artista ?? '').slice(0, 120), texto: c.texto ?? '', ficha: letra(c.texto ?? '') < 8,
            datos: c.ficha, bpm: c.bpm, duracion: c.duracion, portada: c.portada,
        }));
        // {tono: …} {canta: …} {grupo: …}: a la ficha del tema
        return (leerSetlist(texto) ?? separarCanciones(texto)).map(t => {
            const { ficha, texto: resto } = sacarFicha(t.texto);
            return ficha ? { ...t, texto: resto, datos: ficha } : t;
        });
    }, [texto, copia]);
    const esSetlist = encontradas.some(t => t.ficha);
    const parejas = useMemo(() => {
        const veces = new Map<string, number>();
        for (const t of encontradas) { const k = claveTitulo(t.titulo); veces.set(k, (veces.get(k) ?? 0) + 1); }
        return encontradas.map(t => emparejar(canciones, t, veces.get(claveTitulo(t.titulo)) === 1));
    }, [encontradas, canciones]);
    // Una biblioteca entera no es un repertorio: con muchas, el interruptor empieza apagado
    const muchas = encontradas.length > 40;

    const pegar = async () => {
        try {
            const t = await navigator.clipboard.readText();
            if (t.trim()) setTexto(t); else toast('No hay nada copiado.');
        } catch {
            toast('Mantén pulsado el recuadro y elige «Pegar».');
        }
    };

    // Word, PDF, .txt y ChordPro: cada archivo pasa a texto en la caja (y de ahí, lo de siempre:
    // emparejar con lo que ya hay y guardar todo de una vez). El lector de documentos (con
    // mammoth y pdf.js, cada uno en su trozo) se descarga solo la primera vez que se abre algo
    const abrir = async (lista: FileList | null) => {
        const archivos = lista ? [...lista] : [];
        if (!archivos.length || leyendo) return;
        setLeyendo(true);
        const textos: string[] = [];
        const fallos: string[] = [];
        try {
            const { textoDeArchivo } = await import('../../lib/documentos');
            // Uno detrás de otro: varios PDF a la vez se comen la memoria del iPhone
            for (const f of archivos) {
                try {
                    const t = (await textoDeArchivo(f, x => !!leerSetlist(x))).trim();
                    if (t) textos.push(t); else fallos.push(`«${f.name}»: está vacío.`);
                } catch (e) {
                    fallos.push(`«${f.name}»: ${e instanceof Error ? e.message : 'no se pudo leer.'}`);
                }
            }
        } catch {
            fallos.push('No se pudo cargar el lector de documentos. Mira la conexión y vuelve a probar.');
        } finally {
            setLeyendo(false);
        }
        if (textos.length) {
            setTexto(t => [t.trim(), ...textos].filter(Boolean).join('\n---\n'));
            if (!nombre && archivos.length === 1) setNombre(archivos[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim());
            if (textos.join('\n').split('\n---\n').length > 40) setConRepertorio(false);
        }
        if (fallos.length === 1) toast.error(`No se pudo abrir ${fallos[0]}`);
        else if (fallos.length > 1) toast.error(`No se pudieron abrir ${fallos.length} archivos`, { description: fallos.join('\n') });
    };

    const importar = () => {
        const corta = (t: CancionImportada) => t.ficha || t.texto.split('\n').length <= 25;
        let nuevas = 0, rellenas = 0, conFicha = 0;
        const aGuardar: Cancion[] = [];
        let ids: string[];
        // Lo que se sabe de la grabación solo rellena lo que falta
        const extra = (c: Cancion, t: CancionImportada): Cancion => ({
            ...c, ficha: unirFichas(c.ficha, t.datos),
            bpm: c.bpm ?? t.bpm, duracion: c.duracion ?? t.duracion, portada: c.portada ?? t.portada,
        });
        try {
            ids = encontradas.map((t, i) => {
                const { ya, rellena } = parejas[i];
                if (ya) {
                    // Ya estaba: se queda su letra, y la ficha que llega se suma a la suya
                    const sinTexto = !ya.texto.trim() && t.texto.trim();
                    if (t.datos || sinTexto || t.bpm || t.duracion) {
                        conFicha++;
                        aGuardar.push(extra(sinTexto ? { ...ya, texto: t.texto, artista: ya.artista || t.artista } : ya, t));
                    }
                    return ya.id;
                }
                if (rellena) {
                    rellenas++;
                    aGuardar.push(extra({ ...rellena, artista: t.artista || rellena.artista, texto: t.texto, ajustes: { ...rellena.ajustes, ajustar: corta(t) } }, t));
                    return rellena.id;
                }
                nuevas++;
                // Lo corto (fichas y chuletas de acordes) se ve entero y grande: «que quepa»
                const nueva = extra(nuevaCancion(t, corta(t) ? { ajustar: true } : {}), t);
                aGuardar.push(nueva);
                return nueva.id;
            });
            // La misma canción dos veces en lo importado: se guarda una vez (la última versión)
            const unicas = [...new Map(aGuardar.map(c => [c.id, c])).values()];
            guardarVarias(unicas);
        } catch (e) {
            toast.error(`No se pudo importar: ${e instanceof Error ? e.message : 'error desconocido'}`);
            return;
        }
        setTexto('');
        onCerrar();
        const aviso = [nuevas && `${nuevas} nuevas`, rellenas && `${rellenas} fichas completadas`, conFicha && `${conFicha} actualizadas`].filter(Boolean).join(', ') || 'Ya las tenías';
        // Desde un repertorio: todo al final de ese, sin repetir
        if (destino) {
            const faltan = [...new Set(ids)].filter(id => !destino.canciones.includes(id));
            guardarRepertorio({ ...destino, canciones: [...destino.canciones, ...faltan] });
            toast.success(`${aviso} · ${faltan.length} en «${destino.nombre}»`);
            return;
        }
        // Una copia trae sus repertorios: el que ya existe con ese nombre se pone al día
        if (copia?.repertorios.length) {
            for (const r of copia.repertorios) {
                const lista = [...new Set(r.canciones.map(i => ids[i]).filter(Boolean))];
                const ya = repertorios.find(x => norm(x.nombre) === norm(r.nombre));
                if (ya) guardarRepertorio({ ...ya, canciones: lista, fecha: r.fecha || ya.fecha });
                else {
                    const nuevo = crearRepertorio(r.nombre, lista);
                    if (r.fecha && r.fecha !== nuevo.fecha) guardarRepertorio({ ...nuevo, fecha: r.fecha });
                }
            }
            toast.success(`${aviso} · ${copia.repertorios.length} ${copia.repertorios.length === 1 ? 'repertorio' : 'repertorios'}`);
            navigate('/cancionero?ver=repertorios');
            return;
        }
        // Si ya hay un repertorio con estas mismas canciones (se rellenaron sus fichas), se abre ese
        const mismo = repertorios.find(r => r.canciones.length === ids.length && r.canciones.every((c, i) => c === ids[i]));
        // Si solo se completaron fichas, no hace falta otro repertorio: se abre el que ya las tiene
        const contiene = nuevas ? undefined : repertorios.find(r => ids.every(id => r.canciones.includes(id)));
        if (conRepertorio && !muchas && ids.length > 1) {
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
                                <button onClick={importar} disabled={!encontradas.length || leyendo}
                                    className="w-[70px] text-right text-[15px] font-semibold text-foreground disabled:opacity-30 active:opacity-60">Importar</button>
                            </div>
                        </div>
                        <div className="px-4">
                            <div className="flex gap-2">
                                <button onClick={pegar} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                                    <ClipboardPaste className="h-4 w-4" /> Pegar lo copiado
                                </button>
                                <button onClick={() => archivoRef.current?.click()} disabled={leyendo} aria-busy={leyendo}
                                    className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 disabled:opacity-60">
                                    {leyendo ? <><Loader2 className="h-4 w-4 animate-spin" /> Leyendo…</> : <><FileUp className="h-4 w-4" /> Abrir archivos</>}
                                </button>
                            </div>
                            {/* Word y PDF con su tipo y su extensión: el iPhone filtra por las dos */}
                            <input ref={archivoRef} type="file" multiple className="hidden" aria-label="Abrir archivos (Word, PDF o texto)"
                                accept={ACEPTA} onChange={e => { void abrir(e.target.files); e.target.value = ''; }} />
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
                                                {parejas[i]?.ya ? <span className="text-[12px] text-muted-foreground">{t.datos ? 'suma la ficha' : 'ya la tienes'}</span>
                                                    : parejas[i]?.rellena && <span className="text-[12px] text-muted-foreground">rellena la ficha</span>}
                                            </li>
                                        ))}
                                    </ol>
                                    {(copia || destino) && (
                                        <p className="mt-3 px-1 text-[14px] text-muted-foreground">
                                            {destino ? `Entran al final de «${destino.nombre}».`
                                                : `Copia del cancionero${copia!.repertorios.length ? ` con ${copia!.repertorios.length} ${copia!.repertorios.length === 1 ? 'repertorio' : 'repertorios'}` : ''}. Lo que ya tienes no se duplica: se le suma la ficha.`}
                                        </p>
                                    )}
                                    {!copia && !destino && encontradas.length > 1 && !muchas && (
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

                            <button onClick={importar} disabled={!encontradas.length || leyendo}
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
