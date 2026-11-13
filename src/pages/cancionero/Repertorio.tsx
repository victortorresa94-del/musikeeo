import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpToLine, CalendarDays, ChevronLeft, ChevronRight, FileText, GripVertical, Loader2, MoreHorizontal, Play, Plus, Share2, Trash2, X } from 'lucide-react';
import { tituloYHoraDe } from '../../lib/compartirBolo';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { pedirPantallaCompleta, tonoDe } from '../../components/cancionero/utilidades';
import { Portada } from '../../components/cancionero/Portada';
import { ICONO, PASTEL, bloqueDe, estiloBloque, etiquetasTema, pastelCanta } from '../../components/cancionero/estilo';
import { ICONO_CAMPO } from '../../components/cancionero/iconosFicha';
import { BotonHoja, Hoja } from '../../components/cancionero/Hoja';
import { ElegirParaSet } from '../../components/cancionero/ElegirParaSet';
import { minutos } from '../../lib/cantar';
import { duracionDe, mismoTonoSeguido, reparto, textoDuracion, tonoMostrado } from '../../lib/biblioteca';
import type { Cancion, Repertorio as TipoRepertorio } from '../../types/cancionero';
import { CompartirGrupo } from '../../components/cancionero/CompartirGrupo';
import { FilaTareas } from '../../components/cancionero/Tareas';
import { BotonDesplegar, PanelAcordes } from '../../components/cancionero/FilaDesplegable';
import { ConMenu } from '../../components/cancionero/ConMenu';
import { SelectorVista, type Vista } from '../../components/cancionero/SelectorVista';
import { CifradoEnDirecto, HojaSet, SuenaFormas } from '../../components/cancionero/VistaCifrado';
import { useFormas } from '../../hooks/useFormas';
import { TableroBloques } from '../../components/cancionero/TableroBloques';
import { TablaCanciones } from '../../components/cancionero/TablaCanciones';
import { mover as moverEnTablero, type CampoTablero } from '../../lib/tablero';
import { temaDe } from '../../lib/compartir';
import { NotasRicas } from '../../components/notas/NotasRicas';
import { notasVacias } from '../../lib/notas';

// El editor de notas (Tiptap) va en su trozo: solo se baja al escribir la hoja del bolo
const EditorNotas = lazy(() => import('../../components/notas/EditorNotas'));

export default function Repertorio() {
    const { id } = useParams();
    const { repertorios, listo } = useCancionero();
    if (!listo) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
    const repertorio = repertorios.find(r => r.id === id);
    return repertorio ? <Editor key={repertorio.id} repertorio={repertorio} /> : <Navigate to="/cancionero?ver=repertorios" replace />;
}

function Editor({ repertorio }: { repertorio: TipoRepertorio }) {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const { canciones, guardar, guardarRepertorio, borrarRepertorio, bolos, crearBolo } = useCancionero();
    const [campoTablero, setCampoTablero] = useState<CampoTablero>(() => { try { return (localStorage.getItem('musikeeo-tablero-set') as CampoTablero) || 'bloque'; } catch { return 'bloque'; } });
    // La vista va en la dirección: al volver de una canción se queda donde estaba
    const vista: Vista = params.get('vista') === 'cifrado' ? 'cifrado' : params.get('vista') === 'bloques' ? 'bloques' : params.get('vista') === 'tabla' ? 'tabla' : 'lista';
    const directo = params.get('directo') === '1';
    const cambiarParams = (cambio: Record<string, string | null>) => {
        const p = new URLSearchParams(params);
        for (const [k, v] of Object.entries(cambio)) { if (v) p.set(k, v); else p.delete(k); }
        setParams(p, { replace: true });
    };
    const claveScroll = `musikeeo-cifrado-scroll:${repertorio.id}`;
    const [formas, setFormas] = useFormas();
    const [nombre, setNombre] = useState(repertorio.nombre);
    const [anadir, setAnadir] = useState<false | 'set' | 'extras'>(false);
    const [compartir, setCompartir] = useState(false);
    const [editandoHoja, setEditandoHoja] = useState(false);
    const [menu, setMenu] = useState(false);
    // ¿Se ve el botón grande de «Tocar»? Si no, sale uno pequeño en la barra fija
    const tocarRef = useRef<HTMLButtonElement>(null);
    const [tocarALaVista, setTocarALaVista] = useState(true);
    useEffect(() => {
        const el = tocarRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const o = new IntersectionObserver(([e]) => setTocarALaVista(e.isIntersecting), { rootMargin: '-56px 0px 0px 0px' });
        o.observe(el);
        return () => o.disconnect();
    }, []);
    // La hoja del bolo se guarda sola mientras escribes (al parar)
    const ultimo = useRef(repertorio);
    useEffect(() => { ultimo.current = repertorio; }, [repertorio]);
    const guardarHoja = (notas: string | undefined) => guardarRepertorio({ ...ultimo.current, notas }, { esperar: true });

    const porId = useMemo(() => new Map(canciones.map(c => [c.id, c])), [canciones]);
    const ids = repertorio.canciones.filter(c => porId.has(c));
    // La canción del panel de la derecha (en el ordenador ancho): la que se toca en la lista, o la primera
    const [panel, setPanel] = useState<string | null>(null);
    // El nombre ocupa las líneas que necesita, ni una más (en el ordenador cabe en una)
    const tituloRef = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        const el = tituloRef.current;
        if (!el) return;
        const ajustar = () => { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; };
        ajustar();
        window.addEventListener('resize', ajustar);
        return () => window.removeEventListener('resize', ajustar);
    }, [nombre]);
    const enPanel = panel && ids.includes(panel) ? panel : ids[0] ?? '';
    const temas = ids.map(id => porId.get(id)!);
    // Lo que dura: lo que se sabe de cada canción y, de las demás, una media (≈)
    const { segundos, estimada } = duracionDe(temas.filter(c => bloqueDe(c) === null || !/banquillo|bis/i.test(bloqueDe(c) ?? '')));
    const duracion = ids.length ? `${estimada ? '≈ ' : ''}${textoDuracion(segundos)}` : '';
    // El tono de cada tema (el de la ficha, o el de sus acordes) y dónde se repite seguido
    const tonos = temas.map(c => tonoMostrado(c, tonoDe(c)));
    const repetidos = mismoTonoSeguido(tonos);
    const voces = reparto(temas);
    // ¿Se pasa del hueco del bolo? (la barra y la duración se ponen en rojo)
    const pasa = !!repertorio.hueco && ids.length > 0 && segundos / 60 > repertorio.hueco + 1;
    const temasCifrado = useMemo(() => (vista === 'cifrado' || directo ? temas.map(c => temaDe(c, false)) : []), [vista, directo, temas]);
    // Bloques: pasar un tema a otro bloque del set le cambia el bloque y lo lleva detrás del
    // último de ese bloque; con otro campo, cambia ese dato de su ficha
    const moverTema = (c: Cancion, desde: string, hacia: string) => {
        const nueva = moverEnTablero(c, campoTablero, desde, hacia);
        guardar(nueva);
        if (campoTablero === 'bloque') {
            const orden = repertorio.canciones.filter(x => x !== c.id);
            const ultimo = hacia ? [...orden].reverse().find(x => porId.get(x) && bloqueDe(porId.get(x)!) === hacia) : undefined;
            const pos = ultimo ? orden.indexOf(ultimo) + 1 : orden.length;
            orden.splice(pos, 0, c.id);
            guardarRepertorio({ ...repertorio, canciones: orden });
        }
        toast.success(`«${c.titulo}» → ${hacia || 'sin ' + (campoTablero === 'bloque' ? 'bloque' : 'dato')}`, { action: { label: 'Deshacer', onClick: () => { guardar(c); guardarRepertorio(repertorio); } } });
    };
    const abrirDesdeCifrado = (i: number, enDirecto: boolean) => {
        if (!enDirecto) { try { sessionStorage.setItem(claveScroll, String(window.scrollY)); } catch { /* */ } }
        navigate(`/cancionero/${ids[i]}`);
    };
    // Al volver de una canción abierta desde el cifrado, la hoja vuelve a donde estaba
    useEffect(() => {
        if (vista !== 'cifrado' || directo) return;
        let y = 0;
        try { y = Number(sessionStorage.getItem(claveScroll)) || 0; sessionStorage.removeItem(claveScroll); } catch { /* */ }
        if (y) requestAnimationFrame(() => window.scrollTo({ top: y }));
    }, [vista, directo, claveScroll]);

    const cambiar = (cambio: Partial<TipoRepertorio>) => guardarRepertorio({ ...repertorio, ...cambio });
    const quitar = (id: string) => {
        cambiar({ canciones: repertorio.canciones.filter(c => c !== id) });
        toast(`«${porId.get(id)?.titulo}» fuera del repertorio`, { action: { label: 'Deshacer', onClick: () => guardarRepertorio(repertorio) } });
    };
    // Extras (la recámara): fuera del orden y de la duración; se pasan al set y vuelven
    const extras = (repertorio.extras ?? []).filter(id => porId.has(id) && !repertorio.canciones.includes(id));
    const aExtras = (id: string) => {
        cambiar({ canciones: repertorio.canciones.filter(c => c !== id), extras: [...(repertorio.extras ?? []).filter(c => c !== id), id] });
        toast(`«${porId.get(id)?.titulo}» a extras`, { action: { label: 'Deshacer', onClick: () => guardarRepertorio(repertorio) } });
    };
    const alSet = (id: string) => {
        cambiar({ canciones: [...repertorio.canciones.filter(c => c !== id), id], extras: (repertorio.extras ?? []).filter(c => c !== id) });
        toast(`«${porId.get(id)?.titulo}» a titulares (al final)`, { action: { label: 'Deshacer', onClick: () => guardarRepertorio(repertorio) } });
    };
    // Una sola lista que se arrastra: titulares · raya «Extras» · extras. Lo que queda por encima de
    // la raya es el set y lo de debajo, la recámara (13-nov, Víctor: «quiero poder mover de extras a
    // titulares y viceversa»). Lo que no está en el móvil (otra cuenta) se conserva al final
    const reordenar = (orden: string[]) => {
        const corte = orden.indexOf(RAYA_EXTRAS);
        if (corte < 0) return;
        const ocultasSet = repertorio.canciones.filter(c => !porId.has(c));
        const ocultasExtras = (repertorio.extras ?? []).filter(c => !porId.has(c));
        guardarRepertorio({ ...repertorio, canciones: [...orden.slice(0, corte), ...ocultasSet], extras: [...orden.slice(corte + 1), ...ocultasExtras] }, { esperar: true });
    };
    const quitarExtra = (id: string) => {
        cambiar({ extras: (repertorio.extras ?? []).filter(c => c !== id) });
        toast(`«${porId.get(id)?.titulo}» fuera de extras`, { action: { label: 'Deshacer', onClick: () => guardarRepertorio(repertorio) } });
    };
    const cerrarAnadir = useCallback(() => setAnadir(false), []);
    // En la vista Lista, titulares y extras van en una sola lista que se arrastra
    const listaUnida = vista === 'lista' && ids.length + extras.length > 0;
    const botonesAnadir = (
        <>
            {listaUnida && !ids.length && <p className="mt-2 rounded-2xl bg-fill px-4 py-6 text-center text-[15px] text-muted-foreground">Añade las canciones en el orden en que las vas a tocar, o sube aquí una de extras.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setAnadir('set')} className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Añadir canciones
                </button>
                <Link to={`/cancionero/nueva?repertorio=${repertorio.id}`} className="pulsable h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold flex items-center gap-1.5">
                    Nueva canción
                </Link>
            </div>
        </>
    );

    const tocar = (n = 0) => {
        pedirPantallaCompleta();
        navigate(`/cancionero/repertorio/${repertorio.id}/tocar${n ? `?n=${n}` : ''}`);
    };

    // El bolo de este set: si ya hay uno que lo lleva, se abre; si no, se crea con lo que se sabe
    // («Lady Jarana · RTF Pallejà 12:30» → bolo «Lady Jarana · RTF Pallejà», set a las 12:30)
    const boloDelSet = bolos.find(b => b.sets.some(s => s.repertorioId === repertorio.id));
    const abrirBolo = () => {
        if (boloDelSet) { navigate(`/cancionero/bolo/${boloDelSet.id}`); return; }
        const { titulo, hora } = tituloYHoraDe(repertorio.nombre);
        const b = crearBolo({ titulo, fecha: repertorio.fecha || undefined, sets: [{ repertorioId: repertorio.id, ...(hora ? { hora } : {}) }] });
        navigate(`/cancionero/bolo/${b.id}`);
    };

    const borrar = () => {
        void borrarRepertorio(repertorio.id);
        toast('Repertorio borrado', { action: { label: 'Deshacer', onClick: () => guardarRepertorio(repertorio) } });
        navigate('/cancionero?ver=repertorios', { replace: true });
    };

    return (
        <ConMenu activo={{ ver: 'repertorios' }}>
        <div className="max-w-3xl mx-auto lg:max-w-none lg:mx-0 px-4 md:px-0 pt-3 md:pt-6 pb-16">
            {/* Arriba: volver, el título (se edita tocándolo) y el ⋯ con lo que no es de cada día */}
            <div className="flex items-center justify-between gap-2">
                <Link to="/cancionero?ver=repertorios" className="inline-flex items-center -ml-1.5 text-[15px] text-muted-foreground active:opacity-60">
                    <ChevronLeft className="h-5 w-5" /> Repertorios
                </Link>
                <button onClick={() => setMenu(true)} aria-label="Más opciones del repertorio" className="pulsable h-9 w-9 rounded-full bg-fill flex items-center justify-center text-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>
            {/* Un nombre largo salta a dos líneas, nunca se corta («Cataleya · RTF Pallejà 19:00») */}
            <textarea ref={tituloRef} value={nombre} onChange={e => setNombre(e.target.value.replace(/\n/g, ' ').slice(0, 120))}
                onBlur={() => nombre.trim() && nombre !== repertorio.nombre && cambiar({ nombre: nombre.trim() })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                rows={1} aria-label="Nombre del repertorio" placeholder="Nombre del repertorio"
                className="mt-1 w-full resize-none overflow-hidden bg-transparent font-heading !text-[28px] font-bold leading-tight text-foreground placeholder:text-muted-foreground focus:outline-none" />

            {/* Una línea con lo que hay que saber: cuándo, cuántos, cuánto y si cabe en el hueco */}
            <button onClick={() => setMenu(true)} className="mt-1 w-full text-left" aria-label="Fecha y hueco del bolo">
                <span className="flex flex-wrap items-center gap-x-1.5 text-[15px] text-muted-foreground">
                    <span>{fechaCorta(repertorio.fecha) || 'Sin fecha'}</span>
                    <span>· {ids.length} {ids.length === 1 ? 'tema' : 'temas'}</span>
                    {duracion && <span>· <b className={cn('font-semibold', pasa ? 'text-destructive' : 'text-foreground')}>{duracion}</b>{repertorio.hueco ? ` de ${repertorio.hueco} min` : ''}</span>}
                </span>
                {!!repertorio.hueco && ids.length > 0 && (
                    <span className="mt-1.5 block h-1.5 rounded-full bg-fill overflow-hidden" aria-hidden>
                        <span className={cn('block h-full rounded-full', pasa ? 'bg-destructive' : 'bg-foreground')} style={{ width: `${Math.min(100, (segundos / 60 / repertorio.hueco) * 100)}%` }} />
                    </span>
                )}
            </button>
            {/* Quién canta cuántas, en pequeño */}
            {voces.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                    {voces.map(v => {
                        const p = pastelCanta(v.valor);
                        return (
                            <span key={v.valor} title={`${v.valor} canta ${v.n}`} className={cn('h-6 pl-0.5 pr-2 rounded-full flex items-center gap-1 text-[12.5px] font-semibold', p.fondo, p.tinta)}>
                                <span className="h-5 w-5 rounded-full bg-sheet/70 flex items-center justify-center text-[11px]">{v.valor.charAt(0).toUpperCase()}</span>{v.valor} {v.n}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Lo principal, grande y solo: tocar. Al lado, mandarlo al grupo */}
            <div className="mt-4 flex items-center gap-2">
                <button ref={tocarRef} onClick={() => tocar()} disabled={!ids.length}
                    className="pulsable relative flex-1 h-[60px] rounded-[18px] bg-primary text-primary-foreground font-bold text-[19px] flex items-center pl-5 gap-2 overflow-hidden disabled:opacity-40">
                    <Play className="h-5 w-5 fill-current" /> Tocar
                    <img src={ICONO.canciones} alt="" aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-[54px] w-[54px] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)]" />
                </button>
                <button onClick={() => setCompartir(true)} disabled={!ids.length} aria-label="Compartir con el grupo"
                    className="pulsable h-[60px] w-[60px] shrink-0 rounded-[18px] bg-fill text-foreground flex items-center justify-center disabled:opacity-40">
                    <Share2 className="h-5 w-5" />
                </button>
            </div>

            {/* La hoja del bolo: una fila; se abre al tocarla (nunca una caja vacía) */}
            <section className="mt-3" aria-labelledby="hoja-bolo">
                {editandoHoja ? (
                    <div className="rounded-2xl border border-hairline p-3 md:p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 id="hoja-bolo" className="text-[16px] font-bold text-foreground">Hoja del bolo</h2>
                            <button onClick={() => setEditandoHoja(false)} className="h-8 px-3 rounded-full text-[14px] font-semibold text-foreground active:bg-fill">Listo</button>
                        </div>
                        <Suspense fallback={<div className="min-h-32" />}>
                            <EditorNotas valor={repertorio.notas} onCambio={guardarHoja} autoFocus
                                placeholder="Horarios, prueba de sonido, quién trae qué, el orden de los bises… Pulsa «/» para títulos, avisos y casillas." />
                        </Suspense>
                    </div>
                ) : (
                    <button onClick={() => setEditandoHoja(true)} className="w-full rounded-2xl bg-fill px-4 py-3 text-left flex items-start gap-3 active:bg-fill-strong">
                        <span className="flex-1 min-w-0">
                            <span id="hoja-bolo" className="block text-[15px] font-semibold text-foreground">Hoja del bolo</span>
                            {notasVacias(repertorio.notas)
                                ? <span className="block text-[13px] text-muted-foreground">Horarios, prueba de sonido, quién trae qué…</span>
                                : <span className="mt-1 block max-h-[4.5rem] overflow-hidden"><NotasRicas json={repertorio.notas} className="text-[14px]" /></span>}
                        </span>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                )}
            </section>
            {/* Lo que queda por preparar de este repertorio y de sus canciones */}
            <FilaTareas de={`r:${repertorio.id}`} className="mt-2" />

            {/* ⋯: fecha, hueco, compartir, hoja del bolo y borrar */}
            <Hoja abierta={menu} onCerrar={() => setMenu(false)} titulo="El repertorio" derecha={<BotonHoja fuerte onClick={() => setMenu(false)}>Listo</BotonHoja>}>
                <div className="px-4 pb-5 space-y-3">
                    <label className="h-12 px-4 rounded-2xl bg-fill flex items-center justify-between gap-3 text-[15px] font-semibold text-foreground">
                        Fecha del bolo
                        <input type="date" value={repertorio.fecha} onChange={e => cambiar({ fecha: e.target.value })} aria-label="Fecha del bolo"
                            className="bg-transparent text-right text-muted-foreground focus:outline-none" />
                    </label>
                    <div className="px-1">
                        <Hueco minutos={repertorio.hueco} segundos={ids.length ? segundos : 0} estimada={estimada} onCambio={h => cambiar({ hueco: h })} />
                    </div>
                    <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        <button onClick={() => { setMenu(false); setCompartir(true); }} disabled={!ids.length} className="w-full h-12 px-4 flex items-center gap-3 text-[15px] text-foreground active:bg-fill-strong disabled:opacity-40">
                            <Share2 className="h-[18px] w-[18px]" /> Compartir con el grupo
                        </button>
                        <button onClick={() => { setMenu(false); abrirBolo(); }} className="w-full h-12 px-4 flex items-center gap-3 text-[15px] text-foreground active:bg-fill-strong">
                            <CalendarDays className="h-[18px] w-[18px]" /> {boloDelSet ? `Bolo: ${boloDelSet.titulo}` : 'Crear un bolo con este repertorio'}
                        </button>
                        <button onClick={() => { setMenu(false); setEditandoHoja(true); }} className="w-full h-12 px-4 flex items-center gap-3 text-[15px] text-foreground active:bg-fill-strong">
                            <FileText className="h-[18px] w-[18px]" /> Hoja del bolo
                        </button>
                        <button onClick={() => { setMenu(false); borrar(); }} className="w-full h-12 px-4 flex items-center gap-3 text-[15px] text-destructive active:bg-fill-strong">
                            <Trash2 className="h-[18px] w-[18px]" /> Borrar repertorio
                        </button>
                    </div>
                </div>
            </Hoja>

            {ids.length > 0 && (
                <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] md:top-14 z-10 -mx-4 px-4 md:mx-0 md:px-0 mt-4 py-2 bg-background flex items-center gap-2">
                    {/* Al bajar, «Tocar» sigue a un toque aquí */}
                    {!tocarALaVista && (
                        <button onClick={() => tocar()} aria-label="Tocar el repertorio" className="pulsable order-last ml-auto h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Play className="h-4 w-4 fill-current" />
                        </button>
                    )}
                    <SelectorVista valor={vista} onCambio={v => cambiarParams({ vista: v === 'lista' ? null : v })} />
                    {vista === 'cifrado' && temasCifrado.some(t => t.m) && <SuenaFormas formas={formas} onCambio={setFormas} />}
                    {vista === 'cifrado' && (
                        <button onClick={() => cambiarParams({ directo: '1' })} className="pulsable ml-auto h-9 px-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold">
                            En directo
                        </button>
                    )}
                </div>
            )}
            {ids.length > 0 && vista === 'tabla' ? (
                <div className="mt-3">
                    <TablaCanciones canciones={temas} tonoDe={c => tonos[temas.indexOf(c)] ?? null} guardar={c => guardar(c)} onAbrir={c => navigate(`/cancionero/${c.id}?repertorio=${repertorio.id}`)}
                        clave="musikeeo-tabla-set" enSet todas={canciones} />
                </div>
            ) : ids.length > 0 && vista === 'bloques' ? (
                <div className="mt-3">
                    <TableroBloques canciones={temas} campo={campoTablero} tonoDe={c => tonos[temas.indexOf(c)] ?? null}
                        onCampo={c => { setCampoTablero(c); try { localStorage.setItem('musikeeo-tablero-set', c); } catch { /* */ } }}
                        campos={['bloque', 'canta', 'estilos', 'tonos', 'energias', 'etiquetas']}
                        onMover={moverTema} onAbrir={c => navigate(`/cancionero/${c.id}?repertorio=${repertorio.id}`)} />
                </div>
            ) : ids.length > 0 && vista === 'cifrado' ? (
                <HojaSet temas={temasCifrado} tamano={17} formas={formas} ancho onAbrir={i => abrirDesdeCifrado(i, false)} className="mt-2" />
            ) : vista === 'lista' && ids.length + extras.length > 0 ? (
                // En un ordenador ancho (≥ 1280 px), al lado de la lista va el panel de la canción elegida
                <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] xl:gap-6 xl:items-start">
                <Reorder.Group axis="y" values={[...ids, RAYA_EXTRAS, ...extras]} onReorder={reordenar}
                    className="mt-2">
                    {ids.map((id, i) => {
                        // El bloque del bolo sale encima de su primer tema
                        const bloque = bloqueDe(porId.get(id)!);
                        const nuevoBloque = bloque && (i === 0 || bloque !== bloqueDe(porId.get(ids[i - 1])!)) ? bloque : null;
                        return (
                            <Fila key={id} id={id} repertorioId={repertorio.id} n={i + 1} cancion={porId.get(id)!} tono={tonos[i]} bloque={nuevoBloque} mismoTono={repetidos.has(i)}
                                onQuitar={() => quitar(id)} onCambiarLado={() => aExtras(id)} onTocar={() => tocar(i)}
                                elegida={enPanel === id} onElegir={() => setPanel(id)} />
                        );
                    })}
                    {/* La raya: no se arrastra; lo que se suelta debajo pasa a extras y lo de encima, a titulares */}
                    <Reorder.Item value={RAYA_EXTRAS} dragListener={false} className="relative bg-background">
                        {botonesAnadir}
                        <CabeceraExtras n={extras.length} className="mt-8" />
                        {!extras.length && <p className="mt-2 px-1 text-[14px] text-muted-foreground">Arrastra aquí una canción por el asa, o pásala con su flecha ↓. Salen al final en Tocar y en el enlace del grupo.</p>}
                    </Reorder.Item>
                    {extras.map((id, j) => {
                        const c = porId.get(id)!;
                        return (
                            <Fila key={id} id={id} repertorioId={repertorio.id} n={ids.length + j + 1} cancion={c} tono={tonoMostrado(c, tonoDe(c))} bloque={null} extra
                                onQuitar={() => quitarExtra(id)} onCambiarLado={() => alSet(id)} onTocar={() => tocar(ids.length + j)}
                                elegida={enPanel === id} onElegir={() => setPanel(id)} />
                        );
                    })}
                </Reorder.Group>
                {porId.get(enPanel) && (
                    <PanelCancion cancion={porId.get(enPanel)!} tono={ids.includes(enPanel) ? tonos[ids.indexOf(enPanel)] ?? null : tonoMostrado(porId.get(enPanel)!, tonoDe(porId.get(enPanel)!))}
                        onTocar={() => tocar(ids.includes(enPanel) ? ids.indexOf(enPanel) : extras.includes(enPanel) ? ids.length + extras.indexOf(enPanel) : 0)} />
                )}
                </div>
            ) : (
                <p className="mt-6 rounded-2xl bg-fill px-4 py-6 text-center text-[15px] text-muted-foreground">Añade las canciones en el orden en que las vas a tocar.</p>
            )}

            {listaUnida ? (
                <button onClick={() => setAnadir('extras')} className="pulsable mt-3 h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Añadir extras
                </button>
            ) : <>
            {botonesAnadir}

            {/* Extras: las canciones en la recámara. A mano en el bolo, fuera del orden y de la duración */}
            <section className="mt-8" aria-label="Extras">
                <CabeceraExtras n={extras.length} />
                {extras.length > 0 ? (
                    <div className="mt-1">
                        {extras.map((id, j) => {
                            const c = porId.get(id)!;
                            const t = tonoMostrado(c, tonoDe(c));
                            return (
                                <div key={id} className="flex items-center gap-1 pr-1 min-h-[60px] border-b border-hairline">
                                    <button onClick={() => tocar(ids.length + j)} aria-label={`Tocar ${c.titulo}`}
                                        className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill"><Play className="h-4 w-4" /></button>
                                    <Link to={`/cancionero/${c.id}?repertorio=${repertorio.id}`} className="flex-1 min-w-0 py-2 active:opacity-60">
                                        <span className="block truncate text-[16px] font-semibold leading-snug text-foreground">{c.titulo}</span>
                                        {(c.version || c.artista || c.duracion) && (
                                            <span className="block truncate text-[13px] text-muted-foreground">{[c.version && `Versión ${c.version}`, c.artista, c.duracion && minutos(c.duracion)].filter(Boolean).join(' · ')}</span>
                                        )}
                                    </Link>
                                    {t && <span className="shrink-0 min-w-[36px] h-7 px-2.5 rounded-full bg-fill-strong text-[13px] font-bold text-foreground flex items-center justify-center">{t}</span>}
                                    <button onClick={() => alSet(id)} aria-label={`Pasar ${c.titulo} a titulares`}
                                        className="shrink-0 h-8 px-2.5 rounded-full bg-fill text-[13px] font-semibold text-foreground flex items-center gap-1 active:opacity-60">
                                        <ArrowUpToLine className="h-4 w-4" /> A titulares
                                    </button>
                                    <button onClick={() => quitarExtra(id)} aria-label={`Quitar ${c.titulo} de extras`}
                                        className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill"><X className="h-4 w-4" /></button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-2 px-1 text-[14px] text-muted-foreground">Las que tienes por si acaso: salen al final en Tocar y en el enlace del grupo.</p>
                )}
                <button onClick={() => setAnadir('extras')} className="pulsable mt-3 h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Añadir extras
                </button>
            </section>
            </>}

            <button onClick={borrar} className="mt-10 h-11 px-1 flex items-center gap-2 text-[15px] text-destructive active:opacity-60">
                <Trash2 className="h-4 w-4" /> Borrar repertorio
            </button>

            <CifradoEnDirecto abierta={directo} onCerrar={() => cambiarParams({ directo: null })} titulo={repertorio.nombre} temas={temasCifrado} formas={formas} onFormas={setFormas}
                onAbrir={i => abrirDesdeCifrado(i, true)}
                scrollInicial={(() => { try { return Number(sessionStorage.getItem(`${claveScroll}:directo`)) || 0; } catch { return 0; } })()}
                onScroll={y => { try { sessionStorage.setItem(`${claveScroll}:directo`, String(Math.round(y))); } catch { /* */ } }} />
            <CompartirGrupo abierta={compartir} onCerrar={() => setCompartir(false)} repertorio={repertorio} canciones={canciones} />
            <ElegirParaSet key={anadir || 'cerrado'} abierto={!!anadir} onCerrar={cerrarAnadir} repertorio={repertorio} destinoInicial={anadir || 'set'} />
        </div>
        </ConMenu>
    );
}

// El hueco del bolo (60 min, 2 × 45…) frente a lo que dura el set: «te pasas 4 min»
function Hueco({ minutos: hueco, segundos, estimada, onCambio }: { minutos?: number; segundos: number; estimada: boolean; onCambio: (m: number | undefined) => void }) {
    const [texto, setTexto] = useState(hueco ? String(hueco) : '');
    const [editando, setEditando] = useState(false);
    const fijar = () => {
        const n = parseInt(texto, 10);
        onCambio(n > 0 && n <= 1440 ? n : undefined);
        if (!(n > 0 && n <= 1440)) setTexto('');
        setEditando(false);
    };
    const diferencia = hueco ? Math.round(segundos / 60 - hueco) : 0;
    const aviso = !hueco || !segundos ? null
        : Math.abs(diferencia) <= 1 ? { texto: 'Clavado al hueco', clase: cn(PASTEL.menta.fondo, PASTEL.menta.tinta) }
        : diferencia > 0 ? { texto: `Te pasas ${estimada ? '≈ ' : ''}${diferencia} min`, clase: cn(PASTEL.melocoton.fondo, PASTEL.melocoton.tinta) }
        : { texto: `Te sobran ${estimada ? '≈ ' : ''}${-diferencia} min`, clase: cn(PASTEL.cielo.fondo, PASTEL.cielo.tinta) };
    return (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px]">
            {editando || !hueco ? (
                <label className="h-8 pl-3 pr-1 rounded-full bg-fill flex items-center gap-1.5 text-muted-foreground">
                    Hueco del bolo
                    <input value={texto} autoFocus={editando} inputMode="numeric" onChange={e => setTexto(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onBlur={fijar} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        placeholder="60" aria-label="Minutos del hueco del bolo"
                        className="w-12 h-6 rounded-full bg-sheet px-2 text-center text-[14px] font-semibold text-foreground focus:outline-none" />
                    <span className="pr-2">min</span>
                </label>
            ) : (
                <button onClick={() => setEditando(true)} className="h-8 px-3 rounded-full bg-fill text-foreground font-semibold">Hueco {hueco} min</button>
            )}
            {aviso && <span className={cn('h-8 px-3 rounded-full font-semibold flex items-center', aviso.clase)}>{aviso.texto}</span>}
            {aviso && estimada && <span className="text-[12.5px] text-muted-foreground">Algún tema sin duración: cuenta 3:30</span>}
        </div>
    );
}

function Fila({ id, repertorioId, n, cancion, tono, bloque, mismoTono, onQuitar, onCambiarLado, onTocar, elegida, onElegir, extra }: {
    id: string; repertorioId: string; n: number; cancion: Cancion; tono: string | null; bloque: string | null; mismoTono?: boolean; onQuitar: () => void; onCambiarLado: () => void; onTocar: () => void;
    elegida?: boolean; onElegir?: () => void;
    extra?: boolean;            // en la recámara: sin número (no es del orden) y su flecha sube a titulares
}) {
    const arrastre = useDragControls();
    const [abierta, setAbierta] = useState(false);
    const etiquetas = etiquetasTema(cancion);
    const estilo = bloque ? estiloBloque(bloque) : null;
    return (
        <Reorder.Item value={id} dragListener={false} dragControls={arrastre} className="relative bg-background">
            {bloque && estilo && (
                <div className={cn('relative mt-5 mb-1 h-[68px] rounded-[18px] overflow-hidden flex items-center pl-4 pr-[96px]', estilo.pastel.fondo)}>
                    <span className="font-heading text-[19px] font-bold leading-tight text-foreground line-clamp-2">{bloque}</span>
                    <img src={estilo.icono} alt="" loading="lazy" draggable={false}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-[64px] w-[84px] object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
                </div>
            )}
            <div onClick={e => { if (onElegir && !(e.target as HTMLElement).closest('a,button') && window.matchMedia('(min-width: 1280px)').matches) onElegir(); }}
                className={cn('flex items-center gap-1 pl-0 pr-1 min-h-[64px] border-b border-hairline', elegida && 'xl:bg-fill xl:rounded-xl')}>
            <button onPointerDown={e => arrastre.start(e)} aria-label="Arrastra para ordenar"
                className="h-11 w-9 shrink-0 flex items-center justify-center text-muted-foreground touch-none cursor-grab">
                <GripVertical className="h-5 w-5" />
            </button>
            {/* El número arranca el bolo desde este tema (un extra no tiene número: no es del orden) */}
            <button onClick={onTocar} aria-label={`Tocar desde ${cancion.titulo}`}
                className="h-9 w-7 shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold text-muted-foreground tabular-nums active:bg-fill">{extra ? <Play className="h-4 w-4" /> : n}</button>
            <Link to={`/cancionero/${cancion.id}?repertorio=${repertorioId}`}
                className="flex-1 min-w-0 py-2.5 flex items-center gap-3 active:opacity-60">
                {/* En el móvil sin portada: el número ya dice cuál es y el título necesita el sitio */}
                <span className="hidden sm:block shrink-0"><Portada src={cancion.portada} titulo={cancion.titulo} tamano="fila" /></span>
                <span className="flex-1 min-w-0">
                    <span className="block line-clamp-2 text-[16px] font-semibold leading-snug text-foreground">{cancion.titulo}</span>
                    {(cancion.version || cancion.artista || cancion.duracion) && (
                        <span className="block truncate text-[13px] text-muted-foreground">
                            {[cancion.version && `${cancion.favorita ? '⭐ ' : ''}Versión ${cancion.version}`, cancion.artista, cancion.duracion && minutos(cancion.duracion)].filter(Boolean).join(' · ')}
                        </span>
                    )}
                    {etiquetas.length > 0 && (
                        <span className="mt-1 flex flex-nowrap gap-1 overflow-hidden">
                            {etiquetas.map(e => (
                                <span key={e.texto} className={cn('shrink-0 h-5 px-2 rounded-full text-[11.5px] font-semibold flex items-center',
                                    e.pastel ? cn(e.pastel.fondo, e.pastel.tinta) : 'bg-fill-strong text-muted-foreground')}>{e.tipo && (() => { const I = ICONO_CAMPO[e.tipo]; return <I className="h-3 w-3 mr-0.5 shrink-0" aria-hidden />; })()}{e.texto}</span>
                            ))}
                        </span>
                    )}
                </span>
            </Link>
            {tono && (
                <span title={mismoTono ? 'Mismo tono que el tema de antes' : undefined}
                    className={cn('shrink-0 min-w-[36px] h-7 px-2.5 rounded-full text-[13px] font-bold flex items-center justify-center',
                        mismoTono ? cn(PASTEL.melocoton.fondo, PASTEL.melocoton.tinta) : 'bg-fill-strong text-foreground')}>{tono}</span>
            )}
            <BotonDesplegar abierta={abierta} onClick={() => setAbierta(a => !a)} titulo={cancion.titulo} />
            {/* Al otro lado: titulares ↓ extras, extras ↑ titulares (también arrastrando por el asa) */}
            <button onClick={onCambiarLado} aria-label={extra ? `Pasar ${cancion.titulo} a titulares` : `Pasar ${cancion.titulo} a extras`}
                title={extra ? 'A titulares' : 'A extras'}
                className={cn('flex h-9 w-7 sm:w-9 shrink-0 rounded-full items-center justify-center active:bg-fill', extra ? 'text-foreground' : 'text-pastel-cielo-ink')}>
                {extra ? <ArrowUpToLine className="h-4 w-4" /> : <ArrowDownToLine className="h-4 w-4" />}
            </button>
            {/* Quitar, siempre a la vista (13-nov: en el móvil vivía escondida al desplegar y no se encontraba) */}
            <button onClick={onQuitar} aria-label={extra ? `Quitar ${cancion.titulo} de extras` : `Quitar ${cancion.titulo} del repertorio`} className="flex h-9 w-7 sm:w-9 shrink-0 rounded-full items-center justify-center text-muted-foreground active:bg-fill">
                <X className="h-4 w-4" />
            </button>
            </div>
            {abierta && (
                <div className="border-b border-hairline">
                    <PanelAcordes cancion={cancion} />
                    <div className="mx-3 mb-3 flex flex-wrap gap-2">
                        <button onClick={onCambiarLado} className="h-9 px-3.5 rounded-full bg-pastel-cielo text-pastel-cielo-ink text-[14px] font-semibold flex items-center gap-1.5">
                            {extra ? <><ArrowUpToLine className="h-4 w-4" /> Pasar a titulares</> : <><ArrowDownToLine className="h-4 w-4" /> Pasar a extras</>}
                        </button>
                        <button onClick={onQuitar} className="h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-destructive flex items-center gap-1.5">
                            <X className="h-4 w-4" /> {extra ? 'Quitar de extras' : 'Quitar del repertorio'}
                        </button>
                    </div>
                </div>
            )}
        </Reorder.Item>
    );
}

// La raya que separa titulares de extras en la lista que se arrastra
const RAYA_EXTRAS = '__extras__';

function CabeceraExtras({ n, className }: { n: number; className?: string }) {
    return (
        <div className={cn('relative min-h-[68px] rounded-[18px] overflow-hidden flex items-center pl-4 pr-[96px] py-2 bg-pastel-cielo', className)}>
            <span className="min-w-0">
                <span className="block font-heading text-[19px] font-bold leading-tight text-foreground">Extras{n ? ` · ${n}` : ''}</span>
                <span className="block text-[13px] font-semibold text-pastel-cielo-ink">En la recámara · no cuentan en la duración</span>
            </span>
            <img src={ICONO.repertorios} alt="" aria-hidden draggable={false}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-[64px] w-[84px] object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
        </div>
    );
}

// «2026-11-14» → «Sábado, 14 de noviembre» (como en la página del grupo)
function fechaCorta(f: string): string {
    const [a, m, d] = (f || '').split('-').map(Number);
    if (!a) return '';
    const t = new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
}

// En el ordenador ancho: la canción elegida en la lista, con su ficha y su cifrado, sin cambiar de página
function PanelCancion({ cancion, tono, onTocar }: { cancion: Cancion; tono: string | null; onTocar: () => void }) {
    const etiquetas = etiquetasTema(cancion);
    return (
        <aside aria-label={`${cancion.titulo}: ficha y acordes`} className="hidden xl:block sticky top-20 mt-2 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[22px] bg-fill border border-hairline">
            <div className="px-4 pt-4">
                <p className="font-heading text-[20px] font-bold leading-snug text-foreground">{cancion.titulo}</p>
                <p className="text-[14px] text-muted-foreground">{[cancion.artista, tono && `Tono ${tono}`, cancion.duracion && minutos(cancion.duracion), cancion.bpm && `${cancion.bpm} bpm`].filter(Boolean).join(' · ')}</p>
                {etiquetas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {etiquetas.map(e => (
                            <span key={e.texto} className={cn('h-6 px-2.5 rounded-full text-[12.5px] font-semibold flex items-center',
                                e.pastel ? cn(e.pastel.fondo, e.pastel.tinta) : 'bg-fill-strong text-muted-foreground')}>{e.tipo && (() => { const I = ICONO_CAMPO[e.tipo]; return <I className="h-3.5 w-3.5 mr-0.5 shrink-0" aria-hidden />; })()}{e.texto}</span>
                        ))}
                    </div>
                )}
                <div className="mt-3 flex gap-2">
                    <button onClick={onTocar} className="pulsable h-9 px-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1.5">
                        <Play className="h-4 w-4" /> Tocar desde aquí
                    </button>
                </div>
            </div>
            <PanelAcordes cancion={cancion} />
        </aside>
    );
}
