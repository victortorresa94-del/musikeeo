import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, FileText, GripVertical, Loader2, MoreHorizontal, Play, Plus, Search, Share2, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { norm, pedirPantallaCompleta, tonoDe } from '../../components/cancionero/utilidades';
import { Portada } from '../../components/cancionero/Portada';
import { ICONO, PASTEL, bloqueDe, estiloBloque, etiquetasTema, pastelCanta } from '../../components/cancionero/estilo';
import { FilaCancion } from '../../components/cancionero/FilaCancion';
import { BarraFiltros } from '../../components/cancionero/Filtros';
import { useFiltrosGuardados } from '../../hooks/useFiltrosGuardados';
import { BotonHoja, Hoja } from '../../components/cancionero/Hoja';
import { ImportarCanciones } from '../../components/cancionero/ImportarCanciones';
import { ResultadosCatalogo } from '../../components/cancionero/ResultadosCatalogo';
import { minutos } from '../../lib/cantar';
import { pesoVersion, duracionDe, filtrar, mismoTitulo, mismoTonoSeguido, reparto, textoDuracion, tonoMostrado } from '../../lib/biblioteca';
import type { Cancion, Repertorio as TipoRepertorio } from '../../types/cancionero';
import { CompartirGrupo } from '../../components/cancionero/CompartirGrupo';
import { BotonDesplegar, PanelAcordes } from '../../components/cancionero/FilaDesplegable';
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
    const { canciones, guardar, guardarRepertorio, borrarRepertorio } = useCancionero();
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
    const [anadir, setAnadir] = useState(false);
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
            {/* Arriba: volver, el título (se edita tocándolo) y el ⋯ con lo que no es de cada día */}
            <div className="flex items-center justify-between gap-2">
                <Link to="/cancionero?ver=repertorios" className="inline-flex items-center -ml-1.5 text-[15px] text-muted-foreground active:opacity-60">
                    <ChevronLeft className="h-5 w-5" /> Repertorios
                </Link>
                <button onClick={() => setMenu(true)} aria-label="Más opciones del repertorio" className="pulsable h-9 w-9 rounded-full bg-fill flex items-center justify-center text-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>
            <input value={nombre} onChange={e => setNombre(e.target.value.slice(0, 120))} onBlur={() => nombre.trim() && nombre !== repertorio.nombre && cambiar({ nombre: nombre.trim() })}
                aria-label="Nombre del repertorio" placeholder="Nombre del repertorio"
                className="mt-1 w-full bg-transparent font-heading !text-[28px] font-bold leading-tight text-foreground placeholder:text-muted-foreground focus:outline-none" />

            {/* Una línea con lo que hay que saber: cuándo, cuántos, cuánto y si cabe en el hueco */}
            <button onClick={() => setMenu(true)} className="mt-1 w-full text-left" aria-label="Fecha y hueco del bolo">
                <span className="flex flex-wrap items-center gap-x-1.5 text-[15px] text-muted-foreground">
                    <span className="capitalize">{fechaCorta(repertorio.fecha)}</span>
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
                <div className="mt-3 xl:-mx-44">
                    <TablaCanciones canciones={temas} tonoDe={c => tonos[temas.indexOf(c)] ?? null} guardar={c => guardar(c)} onAbrir={c => navigate(`/cancionero/${c.id}`)}
                        clave="musikeeo-tabla-set" enSet todas={canciones} />
                </div>
            ) : ids.length > 0 && vista === 'bloques' ? (
                <div className="mt-3 xl:-mx-44">
                    <TableroBloques canciones={temas} campo={campoTablero} tonoDe={c => tonos[temas.indexOf(c)] ?? null}
                        onCampo={c => { setCampoTablero(c); try { localStorage.setItem('musikeeo-tablero-set', c); } catch { /* */ } }}
                        campos={['bloque', 'canta', 'estilos', 'tonos', 'energias', 'etiquetas']}
                        onMover={moverTema} onAbrir={c => navigate(`/cancionero/${c.id}`)} />
                </div>
            ) : ids.length > 0 && vista === 'cifrado' ? (
                <HojaSet temas={temasCifrado} tamano={17} formas={formas} ancho onAbrir={i => abrirDesdeCifrado(i, false)} className="mt-2 xl:-mx-44" />
            ) : ids.length > 0 ? (
                <Reorder.Group axis="y" values={ids} onReorder={orden => guardarRepertorio({ ...repertorio, canciones: orden }, { esperar: true })}
                    className="mt-2">
                    {ids.map((id, i) => {
                        // El bloque del bolo sale encima de su primer tema
                        const bloque = bloqueDe(porId.get(id)!);
                        const nuevoBloque = bloque && (i === 0 || bloque !== bloqueDe(porId.get(ids[i - 1])!)) ? bloque : null;
                        return (
                            <Fila key={id} id={id} n={i + 1} cancion={porId.get(id)!} tono={tonos[i]} bloque={nuevoBloque} mismoTono={repetidos.has(i)}
                                onQuitar={() => quitar(id)} onTocar={() => tocar(i)} />
                        );
                    })}
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

            <CifradoEnDirecto abierta={directo} onCerrar={() => cambiarParams({ directo: null })} titulo={repertorio.nombre} temas={temasCifrado} formas={formas} onFormas={setFormas}
                onAbrir={i => abrirDesdeCifrado(i, true)}
                scrollInicial={(() => { try { return Number(sessionStorage.getItem(`${claveScroll}:directo`)) || 0; } catch { return 0; } })()}
                onScroll={y => { try { sessionStorage.setItem(`${claveScroll}:directo`, String(Math.round(y))); } catch { /* */ } }} />
            <CompartirGrupo abierta={compartir} onCerrar={() => setCompartir(false)} repertorio={repertorio} canciones={canciones} />
            <ElegirCanciones abierto={anadir} onCerrar={() => setAnadir(false)} canciones={canciones}
                elegidas={repertorio.canciones} onAlternar={alternar} repertorio={repertorio} />
        </div>
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

function Fila({ id, n, cancion, tono, bloque, mismoTono, onQuitar, onTocar }: {
    id: string; n: number; cancion: Cancion; tono: string | null; bloque: string | null; mismoTono?: boolean; onQuitar: () => void; onTocar: () => void;
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
            <div className="flex items-center gap-1 pl-0 pr-1 min-h-[64px] border-b border-hairline">
            <button onPointerDown={e => arrastre.start(e)} aria-label="Arrastra para ordenar"
                className="h-11 w-9 shrink-0 flex items-center justify-center text-muted-foreground touch-none cursor-grab">
                <GripVertical className="h-5 w-5" />
            </button>
            {/* El número arranca el bolo desde este tema */}
            <button onClick={onTocar} aria-label={`Tocar desde ${cancion.titulo}`}
                className="h-9 w-7 shrink-0 rounded-full text-[13px] font-semibold text-muted-foreground tabular-nums active:bg-fill">{n}</button>
            <Link to={`/cancionero/${cancion.id}`} className="flex-1 min-w-0 py-2.5 flex items-center gap-3 active:opacity-60">
                <Portada src={cancion.portada} titulo={cancion.titulo} tamano="fila" />
                <span className="flex-1 min-w-0">
                    <span className="block truncate text-[16px] font-semibold text-foreground">{cancion.titulo}</span>
                    {(cancion.version || cancion.artista) && <span className="block truncate text-[13px] text-muted-foreground">{[cancion.version && `${cancion.favorita ? '⭐ ' : ''}Versión ${cancion.version}`, cancion.artista].filter(Boolean).join(' · ')}</span>}
                    {etiquetas.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                            {etiquetas.map(e => (
                                <span key={e.texto} className={cn('h-5 px-2 rounded-full text-[11.5px] font-semibold flex items-center',
                                    e.pastel ? cn(e.pastel.fondo, e.pastel.tinta) : 'bg-fill-strong text-muted-foreground')}>{e.texto}</span>
                            ))}
                        </span>
                    )}
                </span>
            </Link>
            {cancion.duracion ? <span className="shrink-0 pr-1 text-[13px] text-muted-foreground tabular-nums">{minutos(cancion.duracion)}</span> : null}
            {tono && (
                <span title={mismoTono ? 'Mismo tono que el tema de antes' : undefined}
                    className={cn('shrink-0 min-w-[36px] h-7 px-2.5 rounded-full text-[13px] font-bold flex items-center justify-center',
                        mismoTono ? cn(PASTEL.melocoton.fondo, PASTEL.melocoton.tinta) : 'bg-fill-strong text-foreground')}>{tono}</span>
            )}
            <BotonDesplegar abierta={abierta} onClick={() => setAbierta(a => !a)} titulo={cancion.titulo} />
            <button onClick={onQuitar} aria-label={`Quitar ${cancion.titulo}`} className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill">
                <X className="h-4 w-4" />
            </button>
            </div>
            {abierta && <div className="border-b border-hairline"><PanelAcordes cancion={cancion} /></div>}
        </Reorder.Item>
    );
}

// Añadir canciones al repertorio, rápido: busca en tu cancionero (con los filtros de la
// ficha), y si no la tienes, créala con ese título aquí mismo (también sin cobertura), cógela
// del catálogo con su portada, o importa sus papeles (PDF, Word) directos a este repertorio
function ElegirCanciones({ abierto, onCerrar, canciones, elegidas, onAlternar, repertorio }: {
    abierto: boolean; onCerrar: () => void; canciones: Cancion[]; elegidas: string[]; onAlternar: (id: string) => void; repertorio: TipoRepertorio;
}) {
    const { crear, guardarRepertorio } = useCancionero();
    const [q, setQ] = useState('');
    const [importar, setImportar] = useState(false);
    const [filtros, setFiltros] = useFiltrosGuardados('musikeeo-cancionero-elegir');
    const tonos = useMemo(() => new Map(canciones.map(c => [c.id, tonoMostrado(c, tonoDe(c))])), [canciones]);
    const tonoDeCancion = useCallback((c: Cancion) => tonos.get(c.id) ?? null, [tonos]);
    const termino = q.trim();
    const lista = useMemo(() => {
        const t = norm(termino);
        const base = filtrar(canciones, filtros, tonoDeCancion);
        const l = t ? base.filter(c => norm(`${c.titulo} ${c.version ?? ''} ${c.artista} ${c.ficha?.canta ?? ''} ${c.ficha?.estilo ?? ''}`).includes(t) || norm(tonos.get(c.id) ?? '') === t) : base;
        // Por título y, con el mismo título, tus versiones antes que la original
        return [...l].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es') || pesoVersion(a) - pesoVersion(b));
    }, [canciones, termino, filtros, tonoDeCancion, tonos]);
    // ¿Ya está con ese título? Entonces no se ofrece crearla otra vez
    const yaEsta = !!termino && canciones.some(c => mismoTitulo(c.titulo, termino));

    // Al final del repertorio (si ya estaba no se mueve)
    const meter = (c: Cancion) => {
        const actual = repertorio.canciones;
        if (!actual.includes(c.id)) guardarRepertorio({ ...repertorio, canciones: [...actual, c.id] });
        toast.success(`«${c.titulo}» añadida`);
        setQ('');
    };
    // Solo el título: sale como ficha y luego se le pega la letra (o se le pone el tono)
    const crearConTitulo = () => {
        if (!termino) return;
        const c = crear({ titulo: termino.slice(0, 120), artista: '', texto: '' });
        meter(c);
    };

    return (
        <>
            <Hoja abierta={abierto} onCerrar={onCerrar} titulo="Añadir canciones" alta
                derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}
                pie={(
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setImportar(true)} className="pulsable h-[60px] rounded-[16px] bg-pastel-melocoton pl-1.5 pr-3 flex items-center gap-1.5 text-left">
                            <img src={ICONO.importar} alt="" aria-hidden className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                            <span className="text-[14px] font-semibold leading-tight text-foreground">Importar PDF o Word</span>
                        </button>
                        <Link to={`/cancionero/nueva?repertorio=${repertorio.id}`} className="pulsable h-[60px] rounded-[16px] bg-pastel-lavanda pl-1.5 pr-3 flex items-center gap-1.5">
                            <img src={ICONO.repertorios} alt="" aria-hidden className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                            <span className="text-[14px] font-semibold leading-tight text-foreground">Pegar letra y acordes</span>
                        </Link>
                    </div>
                )}>
                <div className="px-4 pb-3">
                    <label className="relative block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Busca o escribe el título" aria-label="Buscar o escribir el título" enterKeyHint="done"
                            onKeyDown={e => { if (e.key === 'Enter' && termino && !yaEsta && !lista.length) crearConTitulo(); }}
                            className="w-full h-11 rounded-2xl bg-fill pl-12 pr-10 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                        {q && (
                            <button onClick={() => setQ('')} aria-label="Borrar" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </label>
                    <BarraFiltros className="mt-2.5" canciones={canciones} tonoDe={tonoDeCancion} filtros={filtros} onCambio={setFiltros} />
                </div>

                {/* No la tienes: créala con ese título y entra ya en el repertorio */}
                {termino && !yaEsta && (
                    <div className="px-4 pb-3">
                        <button onClick={crearConTitulo} className="pulsable w-full min-h-[60px] rounded-[16px] bg-pastel-mantequilla pl-1.5 pr-4 py-2 flex items-center gap-2 text-left">
                            <img src={ICONO.canciones} alt="" aria-hidden className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                            <span className="flex-1 min-w-0">
                                <span className="block truncate text-[15.5px] font-bold text-foreground">Añadir «{termino}»</span>
                                <span className="block text-[13px] text-muted-foreground">Entra ya; la letra y el tono se los pones luego</span>
                            </span>
                            <Plus className="h-5 w-5 shrink-0 text-pastel-mantequilla-ink" />
                        </button>
                    </div>
                )}

                <div className="divide-y divide-hairline border-t border-hairline">
                    {lista.map(c => (
                        <FilaCancion key={c.id} cancion={c} tono={tonos.get(c.id) ?? null} compacta
                            elegida={elegidas.includes(c.id)} onElegir={() => onAlternar(c.id)} />
                    ))}
                    {lista.length === 0 && !termino && (
                        <p className="px-4 py-8 text-center text-[15px] text-muted-foreground">
                            {canciones.length ? 'Ninguna canción con estos filtros.' : 'Escribe arriba el título de una canción y añádela aquí mismo.'}
                        </p>
                    )}
                </div>
                {/* Del catálogo, con su portada y su muestra (con cobertura) */}
                {termino.length >= 2 && (
                    <div className="px-4 pb-4">
                        <ResultadosCatalogo q={termino} onElegida={meter} />
                    </div>
                )}
            </Hoja>
            <ImportarCanciones abierto={importar} onCerrar={() => setImportar(false)} repertorioId={repertorio.id} />
        </>
    );
}

// «2026-11-14» → «sáb 14 nov»
function fechaCorta(f: string): string {
    const [a, m, d] = f.split('-').map(Number);
    return a ? new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
}
