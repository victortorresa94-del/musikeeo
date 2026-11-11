import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, ChevronRight, Cloud, Download, FileText, Loader2, Plus, Search, Smartphone, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { CANCION_EJEMPLO } from '../../components/cancionero/ejemplo';
import { Baldosa, TarjetaBolo, TarjetaEscuchar } from '../../components/cancionero/Baldosas';
import { ICONO, PASTEL, iconoRepertorio, pastelDe } from '../../components/cancionero/estilo';
import { ImportarCanciones } from '../../components/cancionero/ImportarCanciones';
import { PonerPortadas } from '../../components/cancionero/PonerPortadas';
import { PonerTempo } from '../../components/cancionero/PonerTempo';
import { CompletarLetras } from '../../components/cancionero/CompletarLetras';
import { leerCancion, lineasDeLetra } from '../../lib/acordes';
import { ResultadosCatalogo } from '../../components/cancionero/ResultadosCatalogo';
import { norm, pedirPantallaCompleta, tonoDe } from '../../components/cancionero/utilidades';
import type { Cancion } from '../../types/cancionero';
import { FilaCancion } from '../../components/cancionero/FilaCancion';
import { SelectorVista } from '../../components/cancionero/SelectorVista';
import { CifradoEnDirecto, HojaSet } from '../../components/cancionero/VistaCifrado';
import { TableroBloques } from '../../components/cancionero/TableroBloques';
import { mover as moverEnTablero, type CampoTablero } from '../../lib/tablero';
import { temaDe } from '../../lib/compartir';
import { BarraFiltros } from '../../components/cancionero/Filtros';
import { useFiltrosGuardados } from '../../hooks/useFiltrosGuardados';
import { AnadirARepertorio } from '../../components/cancionero/AnadirARepertorio';
import { agrupar as agruparCanciones, crearCopia, descargarCopia, filtrar, hayFiltros, tonoMostrado } from '../../lib/biblioteca';

const fechaCorta = (f: string) => {
    const [a, m, d] = f.split('-').map(Number);
    return a ? new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
};

// Tu cancionero: lo que pegas de cualquier web de acordes, limpio y a tu manera, y los
// repertorios para tocarlo en el bolo. Un solo buscador: tus canciones y, debajo, las del
// catálogo (con portada y muestra) para añadirlas
export default function Cancionero() {
    const { canciones, repertorios, listo, nube, conCuenta, crear, crearRepertorio, guardar } = useCancionero();
    const navigate = useNavigate();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const ver = params.get('ver') === 'repertorios' ? 'repertorios' : 'canciones';
    const [q, setQ] = useState('');
    const [importar, setImportar] = useState(false);
    const buscadorRef = useRef<HTMLInputElement>(null);
    // La biblioteca: filtros por la ficha, grupos y elegir varias para un repertorio
    const [filtros, setFiltros, agrupar, setAgrupar] = useFiltrosGuardados('musikeeo-cancionero-biblioteca');
    const [elegidas, setElegidas] = useState<string[] | null>(null);
    const [aRepertorio, setARepertorio] = useState(false);
    const [completar, setCompletar] = useState(false);

    // Para el bolo sin cobertura: se bajan ya las pantallas de leer y tocar
    useEffect(() => {
        void import('./LeerCancion');
        void import('./EditarCancion');
        void import('./Repertorio');
        void import('./TocarRepertorio');
    }, []);

    // Canciones sin letra todavía (fichas del setlist, chuletas de acordes): para «Completar letras»
    const faltanLetra = useMemo(() => canciones.filter(c => lineasDeLetra(leerCancion(c.texto)) < 8).length, [canciones]);
    const tonos = useMemo(() => new Map(canciones.map(c => [c.id, tonoMostrado(c, tonoDe(c))])), [canciones]);
    const tonoDeCancion = useCallback((c: Cancion) => tonos.get(c.id) ?? null, [tonos]);
    // Busca en el título, el artista, el tono y la ficha (quién canta, estilo, grupo)
    const lista = useMemo(() => {
        const t = norm(q.trim());
        if (!t) return canciones;
        // Tus versiones primero: al buscar «Bamboléo» sale la tuya antes que la original
        return canciones.filter(c => norm(`${c.titulo} ${c.version ?? ''} ${c.artista} ${c.ficha?.canta ?? ''} ${c.ficha?.estilo ?? ''} ${(c.ficha?.proyectos ?? []).join(' ')}`).includes(t)
            || norm(tonos.get(c.id) ?? '') === t)
            .sort((a, b) => Number(!!b.version) - Number(!!a.version));
    }, [canciones, q, tonos]);
    // Sin buscar: filtradas por la ficha, en orden alfabético si se agrupan
    const filtradas = useMemo(() => filtrar(canciones, filtros, tonoDeCancion), [canciones, filtros, tonoDeCancion]);
    const grupos = useMemo(() => {
        const base = agrupar === 'nada' ? filtradas : [...filtradas].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
        return agruparCanciones(base, agrupar, tonoDeCancion);
    }, [filtradas, agrupar, tonoDeCancion]);
    // Vista Cifrado: las canciones filtradas, en el orden de la lista, seguidas con sus acordes
    const vista = params.get('vista') === 'cifrado' ? 'cifrado' : params.get('vista') === 'bloques' ? 'bloques' : 'lista';
    const [campoTablero, setCampoTablero] = useState<CampoTablero>(() => { try { return (localStorage.getItem('musikeeo-tablero-biblioteca') as CampoTablero) || 'estilos'; } catch { return 'estilos'; } });
    const directo = params.get('directo') === '1';
    const ordenadas = useMemo(() => grupos.flatMap(g => g.canciones).filter((c, i, l) => l.indexOf(c) === i), [grupos]);
    const temasCifrado = useMemo(() => (vista === 'cifrado' || directo ? ordenadas.map(c => temaDe(c, false)) : []), [vista, directo, ordenadas]);
    const cambiarParam = (k: string, v: string | null) => {
        const p = new URLSearchParams(params);
        if (v) p.set(k, v); else p.delete(k);
        setParams(p, { replace: true });
    };
    const abrirDesdeCifrado = (i: number) => {
        try { sessionStorage.setItem('musikeeo-cifrado-scroll:biblioteca', String(window.scrollY)); } catch { /* */ }
        navigate(`/cancionero/${ordenadas[i].id}`);
    };
    useEffect(() => {
        if (vista !== 'cifrado' || directo) return;
        let y = 0;
        try { y = Number(sessionStorage.getItem('musikeeo-cifrado-scroll:biblioteca')) || 0; sessionStorage.removeItem('musikeeo-cifrado-scroll:biblioteca'); } catch { /* */ }
        if (y) requestAnimationFrame(() => window.scrollTo({ top: y }));
    }, [vista, directo]);
    const alternarElegida = (id: string) => setElegidas(e => (e ?? []).includes(id) ? (e ?? []).filter(x => x !== id) : [...(e ?? []), id]);
    // El bolo que viene (el más cercano desde hoy) o, si no hay, el último
    const hoy = new Date().toLocaleDateString('sv-SE');
    const proximo = useMemo(() => {
        const con = repertorios.filter(r => r.canciones.length);
        return con.filter(r => r.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
            ?? [...con].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    }, [repertorios, hoy]);
    const reps = useMemo(() => [...repertorios].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.actualizadaEn.localeCompare(a.actualizadaEn)), [repertorios]);

    const cambiarVer = (v: 'canciones' | 'repertorios') => {
        const p = new URLSearchParams(params);
        if (v === 'repertorios') p.set('ver', v); else p.delete('ver');
        setParams(p, { replace: true });
    };
    const probarEjemplo = () => navigate(`/cancionero/${crear(CANCION_EJEMPLO).id}`);
    const buscando = !!q.trim();

    const filas = (l: Cancion[]) => (
        <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
            {l.map(c => (
                <FilaCancion key={c.id} cancion={c} tono={tonos.get(c.id) ?? null}
                    elegida={elegidas?.includes(c.id)} onElegir={elegidas ? () => alternarElegida(c.id) : undefined} />
            ))}
        </div>
    );
    const nuevoRepertorio = () => {
        const r = crearRepertorio(`Bolo ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`);
        navigate(`/cancionero/repertorio/${r.id}`);
    };

    const contar = (n: number, una: string, varias: string) => `${n} ${n === 1 ? una : varias}`;
    const temas = (ids: string[]) => ids.filter(id => canciones.some(c => c.id === id)).length;
    const tocarBolo = (id: string) => {
        pedirPantallaCompleta();
        navigate(`/cancionero/repertorio/${id}/tocar`);
    };

    return (
        <div className={cn('max-w-3xl mx-auto px-4 md:px-0 pt-3 md:pt-6', elegidas?.length ? 'pb-40' : 'pb-16')}>
            <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground">Cancionero</h1>
            <p className="mt-0.5 text-[17px] text-muted-foreground">¿Qué tocamos hoy?</p>

            {/* Un solo buscador: tus canciones (por título, artista o tono) y el catálogo */}
            <label className="relative mt-4 block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input ref={buscadorRef} value={q} onChange={e => setQ(e.target.value)} type="search" enterKeyHint="search"
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    placeholder="Busca una canción, artista o tono" aria-label="Buscar en el cancionero y en el catálogo"
                    className="w-full h-11 rounded-2xl bg-fill pl-12 pr-10 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 [&::-webkit-search-cancel-button]:hidden" />
                {q && (
                    <button onClick={() => setQ('')} aria-label="Borrar" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </label>

            {!listo ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
            ) : buscando ? (
                <>
                    {canciones.length > 0 && (lista.length > 0 ? (
                        <>
                            <p className="mt-4 mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">Tu cancionero</p>
                            {filas(lista)}
                        </>
                    ) : (
                        <p className="mt-4 px-1 text-[14px] text-muted-foreground">Nada con «{q.trim()}» en tu cancionero.</p>
                    ))}
                    <ResultadosCatalogo q={q} />
                </>
            ) : (
                <>
                    <div className="mt-4 grid grid-cols-4 gap-3">
                        <Baldosa icono={ICONO.canciones} etiqueta="Canciones" pastel={PASTEL.cielo} activa={ver === 'canciones'} onClick={() => cambiarVer('canciones')} />
                        <Baldosa icono={ICONO.repertorios} etiqueta="Repertorios" pastel={PASTEL.lavanda} activa={ver === 'repertorios'} onClick={() => cambiarVer('repertorios')} />
                        <Baldosa icono={ICONO.buscar} etiqueta="Buscar" pastel={PASTEL.menta} onClick={() => buscadorRef.current?.focus()} />
                        <Baldosa icono={ICONO.importar} etiqueta="Importar" pastel={PASTEL.melocoton} onClick={() => setImportar(true)} />
                    </div>

                    {proximo && (
                        <TarjetaBolo repertorio={proximo} temas={temas(proximo.canciones)} fecha={fechaCorta(proximo.fecha)}
                            etiqueta={proximo.fecha === hoy ? 'Hoy' : proximo.fecha > hoy ? 'Próximo bolo' : 'Último bolo'}
                            onTocar={() => tocarBolo(proximo.id)} />
                    )}
                    <TarjetaEscuchar />

                    <div className="mt-6 mb-2 flex items-center justify-between gap-3">
                        <h2 className="font-heading text-[20px] font-bold text-foreground whitespace-nowrap">
                            {ver === 'repertorios' ? 'Repertorios' : 'Tus canciones'}
                            <span className="ml-1.5 text-[15px] font-semibold text-muted-foreground">{ver === 'repertorios' ? reps.length || '' : canciones.length || ''}</span>
                        </h2>
                        {ver === 'repertorios' ? (
                            <button onClick={nuevoRepertorio} className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Nuevo
                            </button>
                        ) : canciones.length > 0 && (
                            <span className="flex items-center gap-2">
                                <button onClick={() => setElegidas(e => e ? null : [])} aria-pressed={!!elegidas}
                                    className={cn('pulsable h-9 px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5', elegidas ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                                    {elegidas ? 'Cancelar' : <><CheckSquare className="h-4 w-4" /> Elegir</>}
                                </button>
                                {!elegidas && (
                                    <Link to="/cancionero/nueva" className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                                        <Plus className="h-4 w-4" /> Añadir
                                    </Link>
                                )}
                            </span>
                        )}
                    </div>

                    {ver === 'repertorios' ? (
                        reps.length === 0 ? (
                            <div className="rounded-[22px] bg-pastel-lavanda p-5 md:p-7">
                                <img src={ICONO.repertorios} alt="" className="h-16 w-16 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
                                <p className="mt-3 font-heading text-[20px] font-bold leading-snug text-foreground">El repertorio del bolo, en orden</p>
                                <p className="mt-2 text-[15px] text-foreground/75">
                                    Ordena las canciones, pulsa «Tocar» y pasa de una a otra deslizando de lado o con el pedal. Cada una sale en su tono y su tamaño, y funciona sin cobertura.
                                </p>
                                <button onClick={nuevoRepertorio} className="pulsable mt-5 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-1.5">
                                    <Plus className="h-5 w-5" /> Nuevo repertorio
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                                {reps.map(r => (
                                    <Link key={r.id} to={`/cancionero/repertorio/${r.id}`} className="flex items-center gap-3 px-4 min-h-[68px] py-2.5 active:bg-fill">
                                        <span className={cn('h-11 w-11 shrink-0 rounded-[12px] flex items-center justify-center', pastelDe(r.id).fondo)}>
                                            <img src={iconoRepertorio(r.nombre)} alt="" loading="lazy" className="h-9 w-9 object-contain" />
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block truncate text-[16px] font-semibold text-foreground">{r.nombre}</span>
                                            <span className="block truncate text-[14px] text-muted-foreground">{fechaCorta(r.fecha)} · {contar(temas(r.canciones), 'canción', 'canciones')}</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                ))}
                            </div>
                        )
                    ) : canciones.length === 0 ? (
                        <div className="rounded-[22px] bg-pastel-cielo p-5 md:p-7">
                            <img src={ICONO.canciones} alt="" className="h-16 w-16 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
                            <p className="mt-3 font-heading text-[20px] font-bold leading-snug text-foreground">Tus canciones, limpias y a tu manera</p>
                            <ol className="mt-3 space-y-2 text-[15px] text-foreground/75">
                                <li><b className="font-semibold text-foreground">1.</b> Búscala arriba y añádela, o importa tus papeles de Word y PDF.</li>
                                <li><b className="font-semibold text-foreground">2.</b> Cambia el tono, pon la cejilla y elige el tamaño de la letra.</li>
                                <li><b className="font-semibold text-foreground">3.</b> Haz el repertorio del bolo y pasa de canción deslizando.</li>
                            </ol>
                            <Link to="/cancionero/nueva" className="pulsable mt-5 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-1.5">
                                <Plus className="h-5 w-5" /> Añadir una canción
                            </Link>
                            <button onClick={probarEjemplo} className="mt-2 w-full h-11 rounded-[14px] text-[15px] font-semibold text-foreground active:opacity-60">Ver un ejemplo</button>
                        </div>
                    ) : (
                        <>
                            <BarraFiltros className="mb-3" canciones={canciones} tonoDe={tonoDeCancion} filtros={filtros} onCambio={setFiltros}
                                agrupar={agrupar} onAgrupar={setAgrupar} />
                            {elegidas && (
                                <p className="mb-2 px-1 text-[14px] text-muted-foreground">Toca las canciones que quieras llevar a un repertorio.</p>
                            )}
                            {!elegidas && !hayFiltros(filtros) && (
                                <div className="mb-3 flex flex-wrap gap-2 empty:hidden">
                                    {faltanLetra > 0 && (
                                        <button type="button" onClick={() => setCompletar(true)} className="pulsable h-9 pl-3 pr-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                                            <FileText className="h-4 w-4" /> Completar letras · {faltanLetra}
                                        </button>
                                    )}
                                    <PonerPortadas /><PonerTempo />
                                </div>
                            )}
                            {!elegidas && filtradas.length > 0 && (
                                <div className="mb-3 flex items-center gap-2">
                                    <SelectorVista valor={vista} onCambio={v => cambiarParam('vista', v === 'lista' ? null : v)} />
                                    {vista === 'cifrado' && (
                                        <button onClick={() => cambiarParam('directo', '1')} className="pulsable ml-auto h-9 px-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold">En directo</button>
                                    )}
                                </div>
                            )}
                            {filtradas.length === 0 ? (
                                <p className="rounded-2xl bg-fill px-4 py-6 text-center text-[15px] text-muted-foreground">Ninguna canción con estos filtros.</p>
                            ) : vista === 'bloques' && !elegidas ? (
                                <TableroBloques canciones={ordenadas} campo={campoTablero} tonoDe={tonoDeCancion}
                                    onCampo={c => { setCampoTablero(c); try { localStorage.setItem('musikeeo-tablero-biblioteca', c); } catch { /* */ } }}
                                    campos={['estilos', 'proyectos', 'canta', 'tonos', 'energias', 'estados', 'etiquetas']}
                                    onMover={(c, desde, hacia) => {
                                        guardar(moverEnTablero(c, campoTablero, desde, hacia));
                                        toast.success(`«${c.titulo}» → ${hacia || 'sin dato'}`, { action: { label: 'Deshacer', onClick: () => guardar(c) } });
                                    }}
                                    onAbrir={c => navigate(`/cancionero/${c.id}`)}
                                    onAnadir={col => navigate(`/cancionero/nueva${col.clave ? `?campo=${campoTablero}&valor=${encodeURIComponent(col.clave)}` : ''}`)} />
                            ) : vista === 'cifrado' && !elegidas ? (
                                <HojaSet temas={temasCifrado} tamano={17} onAbrir={abrirDesdeCifrado} />
                            ) : grupos.map(g => (
                                <section key={g.titulo || 'todas'} className={g.titulo ? 'mt-4 first:mt-0' : ''}>
                                    {g.titulo && (
                                        <h3 className="mb-1.5 px-1 flex items-baseline gap-2 text-[15px] font-bold text-foreground">
                                            {g.titulo}<span className="text-[13px] font-semibold text-muted-foreground">{g.canciones.length}</span>
                                        </h3>
                                    )}
                                    {filas(g.canciones)}
                                </section>
                            ))}
                            {hayFiltros(filtros) && filtradas.length > 0 && (
                                <p className="mt-2 px-1 text-[13px] text-muted-foreground">{filtradas.length} de {canciones.length} canciones</p>
                            )}
                        </>
                    )}
                </>
            )}

            <CifradoEnDirecto abierta={directo} onCerrar={() => cambiarParam('directo', null)} titulo="Tus canciones" temas={temasCifrado}
                onAbrir={i => navigate(`/cancionero/${ordenadas[i].id}`)} />
            {listo && (
                <p className="mt-6 flex items-start gap-2 text-[13px] text-muted-foreground">
                    {conCuenta && nube === 'nube' ? <Cloud className="h-4 w-4 shrink-0 mt-px" /> : <Smartphone className="h-4 w-4 shrink-0 mt-px" />}
                    <span>
                        Son privadas: solo las ves tú. Funcionan sin cobertura.{' '}
                        {!conCuenta ? (
                            <>Se guardan en este dispositivo.{' '}
                                <Link to="/login" state={{ from: location.pathname }} className="font-semibold text-foreground underline underline-offset-2">Entra</Link>{' '}
                                para tenerlas también en el móvil y en el ordenador.</>
                        ) : nube === 'nube' ? 'Guardadas en tu cuenta: las tienes en el móvil y en el ordenador.'
                            : nube === 'sincronizando' ? 'Sincronizando con tu cuenta…'
                                : 'De momento se guardan en este dispositivo.'}
                    </span>
                </p>
            )}

            {listo && canciones.length > 0 && (
                <button onClick={() => descargarCopia(crearCopia(canciones, repertorios))}
                    className="mt-3 h-11 flex items-center gap-2 text-[14px] font-semibold text-foreground active:opacity-60">
                    <Download className="h-4 w-4" /> Guardar una copia del cancionero
                </button>
            )}

            {/* Elegir varias: la barra de abajo las lleva a un repertorio */}
            {elegidas && elegidas.length > 0 && (
                <div className="fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] md:bottom-0 z-[45] px-4 py-3 bg-chrome backdrop-blur-2xl border-t border-hairline">
                    <div className="max-w-3xl mx-auto flex items-center gap-3">
                        <button onClick={() => setElegidas([])} aria-label="Quitar la selección" className="h-11 w-11 shrink-0 rounded-full bg-fill flex items-center justify-center text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                        <button onClick={() => setARepertorio(true)} className="pulsable flex-1 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px]">
                            Añadir {elegidas.length} al repertorio
                        </button>
                    </div>
                </div>
            )}
            <AnadirARepertorio abierta={aRepertorio} onCerrar={() => setARepertorio(false)} ids={elegidas ?? []} onHecho={() => setElegidas(null)} />

            <ImportarCanciones abierto={importar} onCerrar={() => setImportar(false)} />
            <CompletarLetras abierta={completar} onCerrar={() => setCompletar(false)} />
        </div>
    );
}
