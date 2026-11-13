import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { antesQue } from '../../lib/bolos';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, MinusCircle, ChevronRight, Cloud, Download, FileText, FileUp, ListPlus, Loader2, MoreHorizontal, Pencil, Plus, Search, Smartphone, Table2, Trash2, X } from 'lucide-react';
import { BotonHoja, Hoja } from '../../components/cancionero/Hoja';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { cancioneroService } from '../../services/cancioneroService';
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
import { FilaConAcordes } from '../../components/cancionero/FilaDesplegable';
import { SelectorVista } from '../../components/cancionero/SelectorVista';
import { CifradoEnDirecto, HojaSet, SuenaFormas } from '../../components/cancionero/VistaCifrado';
import { useFormas } from '../../hooks/useFormas';
import { TableroBloques } from '../../components/cancionero/TableroBloques';
import { TablaCanciones } from '../../components/cancionero/TablaCanciones';
import { mover as moverEnTablero, type CampoTablero } from '../../lib/tablero';
import { temaDe } from '../../lib/compartir';
import { BarraFiltros } from '../../components/cancionero/Filtros';
import { useFiltrosGuardados } from '../../hooks/useFiltrosGuardados';
import { AnadirALista, BotonListas, EditorLista, MenuListas } from '../../components/cancionero/Listas';
import { ConMenu } from '../../components/cancionero/ConMenu';
import { AccionesLote } from '../../components/cancionero/AccionesLote';
import { cambiarGrupo } from '../../lib/grupos';
import { cancionesDeLista, nombreDeLista } from '../../lib/listas';
import type { Lista, ReglaLista } from '../../types/cancionero';
import { AnadirARepertorio } from '../../components/cancionero/AnadirARepertorio';
import { pesoVersion, agrupar as agruparCanciones, crearCopia, descargarCopia, filtrar, hayFiltros, SIN_FILTROS, tonoMostrado } from '../../lib/biblioteca';

const fechaCorta = (f: string) => {
    const [a, m, d] = f.split('-').map(Number);
    return a ? new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
};

// Tu cancionero: lo que pegas de cualquier web de acordes, limpio y a tu manera, y los
// repertorios para tocarlo en el bolo. Un solo buscador: tus canciones y, debajo, las del
// catálogo (con portada y muestra) para añadirlas
export default function Cancionero() {
    const { canciones, repertorios, listas, listo, nube, conCuenta, crear, crearRepertorio, guardar, guardarLista, borrarLista } = useCancionero();
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
    const [mantenimiento, setMantenimiento] = useState(false);
    const [confirmarBorrar, setConfirmarBorrar] = useState(false);
    // Listas: la de ahora va en la dirección (?lista=), y en el ordenador el menú de la izquierda las enseña todas
    const [hojaListas, setHojaListas] = useState(false);
    const [editorLista, setEditorLista] = useState<{ lista: Lista | null } | null>(null);
    const [opcionesLista, setOpcionesLista] = useState<Lista | null>(null);
    const [aLista, setALista] = useState(false);
    const [lote, setLote] = useState(false);
    const [ancho] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches);

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
            .sort((a, b) => pesoVersion(a) - pesoVersion(b));
    }, [canciones, q, tonos]);
    // Sin buscar: filtradas por la ficha, en orden alfabético si se agrupan
    const listaId = params.get('lista') || 'todas';
    const listaPropia = listas.find(l => l.id === listaId) ?? null;
    const grupoActual = listaId.startsWith('grupo:') ? listaId.slice(6) : null;
    const enLista = useMemo(() => cancionesDeLista(listaId, canciones, listas, tonoDeCancion), [listaId, canciones, listas, tonoDeCancion]);
    const cuantas = useCallback((id: string) => cancionesDeLista(id, canciones, listas, tonoDeCancion).length, [canciones, listas, tonoDeCancion]);
    const filtradas = useMemo(() => filtrar(enLista, filtros, tonoDeCancion), [enLista, filtros, tonoDeCancion]);
    // Lo que se guardaría como lista inteligente: los filtros puestos y lo que hay en el buscador
    const reglaDeAhora = useMemo<ReglaLista | null>(() => {
        const f = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v.length));
        const texto = q.trim();
        return Object.keys(f).length || texto ? { ...(Object.keys(f).length ? { filtros: f } : {}), ...(texto ? { texto } : {}) } : null;
    }, [filtros, q]);
    const grupos = useMemo(() => {
        const base = agrupar === 'nada' ? filtradas : [...filtradas].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
        return agruparCanciones(base, agrupar, tonoDeCancion);
    }, [filtradas, agrupar, tonoDeCancion]);
    // Vista Cifrado: las canciones filtradas, en el orden de la lista, seguidas con sus acordes
    // En el ordenador, la Tabla por defecto (hay sitio); en el móvil, la Lista
    const vistaParam = params.get('vista') ?? (ancho ? 'tabla' : 'lista');
    const vista = vistaParam === 'cifrado' ? 'cifrado' : vistaParam === 'bloques' ? 'bloques' : vistaParam === 'tabla' ? 'tabla' : 'lista';
    const [campoTablero, setCampoTablero] = useState<CampoTablero>(() => { try { return (localStorage.getItem('musikeeo-tablero-biblioteca') as CampoTablero) || 'estilos'; } catch { return 'estilos'; } });
    const directo = params.get('directo') === '1';
    const [formas, setFormas] = useFormas();
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
        const con = repertorios.filter(r => r.canciones.length && r.fecha);
        return con.filter(r => r.fecha >= hoy).sort(antesQue)[0]
            ?? [...con].sort((a, b) => antesQue(b, a))[0];
    }, [repertorios, hoy]);
    const [verArchivados, setVerArchivados] = useState(false);
    const reps = useMemo(() => [...repertorios].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.actualizadaEn.localeCompare(a.actualizadaEn)), [repertorios]);

    const cambiarVer = (v: 'canciones' | 'repertorios') => {
        const p = new URLSearchParams(params);
        if (v === 'repertorios') p.set('ver', v); else p.delete('ver');
        setParams(p, { replace: true });
    };
    const probarEjemplo = () => navigate(`/cancionero/${crear(CANCION_EJEMPLO).id}`);
    const buscando = !!q.trim();

    // En la lista de un grupo o en una lista tuya, cada fila se puede quitar de ahí (con Deshacer)
    const quitarDeLista = (c: Cancion) => {
        if (buscando) return <></>;
        const desde = grupoActual ?? (listaPropia && !listaPropia.regla ? listaPropia.nombre : null);
        if (!desde) return <></>;
        return (
            <button onClick={e => {
                e.preventDefault(); e.stopPropagation();
                if (grupoActual) cambiarGrupo([c], grupoActual, false);
                else if (listaPropia) {
                    const antes = listaPropia;
                    guardarLista({ ...listaPropia, canciones: listaPropia.canciones.filter(id => id !== c.id) });
                    toast(`«${c.titulo}» fuera de «${antes.nombre}»`, { action: { label: 'Deshacer', onClick: () => guardarLista(antes) } });
                }
            }} aria-label={`Quitar «${c.titulo}» de ${desde}`} title={`Quitar de ${desde}`}
                className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill-strong">
                <MinusCircle className="h-[18px] w-[18px]" />
            </button>
        );
    };
    const filas = (l: Cancion[]) => (
        <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
            {l.map(c => (elegidas ? (
                <FilaCancion key={c.id} cancion={c} tono={tonos.get(c.id) ?? null}
                    elegida={elegidas.includes(c.id)} onElegir={() => alternarElegida(c.id)} />
            ) : (
                // Se despliega para ver sus acordes y notas sin salir de la lista
                <FilaConAcordes key={c.id} cancion={c} fila={() => <FilaCancion cancion={c} tono={tonos.get(c.id) ?? null} derecha={quitarDeLista(c)} />} />
            )))}
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

    const elegirLista = (id: string, vistaNueva?: string) => {
        const p = new URLSearchParams(params);
        p.delete('ver');
        if (id === 'todas') p.delete('lista'); else p.set('lista', id);
        if (vistaNueva) p.set('vista', vistaNueva);
        setParams(p, { replace: true });
        setHojaListas(false);
        setQ('');
    };
    const menuListas = (compacto: boolean) => (
        <MenuListas actual={ver === 'canciones' ? listaId : ''} onElegir={elegirLista} canciones={canciones} listas={listas} cuantas={cuantas} compacto={compacto}
            onNueva={() => setEditorLista({ lista: null })} onOpciones={l => setOpcionesLista(l)} />
    );

    return (
        <ConMenu activo={{ ver, lista: listaId }} onLista={elegirLista} onVer={cambiarVer} onOpcionesLista={l => setOpcionesLista(l)}>
        <div className={cn('max-w-3xl mx-auto lg:max-w-none lg:mx-0 px-4 md:px-0 pt-3 md:pt-6', elegidas?.length ? 'pb-40' : 'pb-16')}>
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
                            <p className="mt-4 mb-1.5 px-1 flex items-center justify-between gap-2 text-[13px] font-semibold text-muted-foreground">
                                Tu cancionero
                                <button onClick={() => setEditorLista({ lista: null })} className="text-foreground underline underline-offset-2">Guardar como lista</button>
                            </p>
                            {filas(lista)}
                        </>
                    ) : (
                        <p className="mt-4 px-1 text-[14px] text-muted-foreground">Nada con «{q.trim()}» en tu cancionero.</p>
                    ))}
                    <ResultadosCatalogo q={q} />
                </>
            ) : (
                <>
                    <div className="mt-4 grid grid-cols-4 gap-3 lg:hidden">
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
                        <h2 className="min-w-0 truncate font-heading text-[20px] font-bold text-foreground whitespace-nowrap">
                            {ver === 'repertorios' ? 'Repertorios' : listaId === 'todas' ? 'Tus canciones' : nombreDeLista(listaId, listas)}
                            <span className="ml-1.5 text-[15px] font-semibold text-muted-foreground">{ver === 'repertorios' ? reps.length || '' : enLista.length || ''}</span>
                        </h2>
                        {ver === 'repertorios' ? (
                            <button onClick={nuevoRepertorio} className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Nuevo
                            </button>
                        ) : canciones.length > 0 && (
                            <span className="shrink-0 flex items-center gap-2">
                                {/* En el móvil «Elegir» va solo con el icono: con el texto, el ⋯ se salía de la pantalla */}
                                <button onClick={() => setElegidas(e => e ? null : [])} aria-pressed={!!elegidas} aria-label={elegidas ? 'Cancelar la selección' : 'Elegir canciones'}
                                    className={cn('pulsable h-9 rounded-full text-[14px] font-semibold flex items-center gap-1.5', elegidas ? 'px-3.5 bg-foreground text-background' : 'w-9 justify-center sm:w-auto sm:px-3.5 bg-fill text-foreground')}>
                                    {elegidas ? 'Cancelar' : <><CheckSquare className="h-4 w-4" /> <span className="hidden sm:inline">Elegir</span></>}
                                </button>
                                {!elegidas && (
                                    <Link to="/cancionero/nueva" className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                                        <Plus className="h-4 w-4" /> Añadir
                                    </Link>
                                )}
                                {!elegidas && (
                                    <button onClick={() => setMantenimiento(true)} aria-label="Más: completar letras, portadas, tempo, importar, copia y borrar todo"
                                        className="pulsable relative h-9 w-9 rounded-full bg-fill flex items-center justify-center text-foreground">
                                        <MoreHorizontal className="h-5 w-5" />
                                        {faltanLetra > 0 && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" aria-hidden />}
                                    </button>
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
                                {/* Los que no tienen fecha (antiguos, importados) van plegados al final */}
                                {reps.filter(r => r.fecha || verArchivados).map(r => (
                                    <Link key={r.id} to={`/cancionero/repertorio/${r.id}`} className="flex items-center gap-3 px-4 min-h-[68px] py-2.5 active:bg-fill">
                                        <span className={cn('h-11 w-11 shrink-0 rounded-[12px] flex items-center justify-center', pastelDe(r.id).fondo)}>
                                            <img src={iconoRepertorio(r.nombre)} alt="" loading="lazy" className="h-9 w-9 object-contain" />
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block truncate text-[16px] font-semibold text-foreground">{r.nombre}</span>
                                            <span className="block truncate text-[14px] text-muted-foreground">{fechaCorta(r.fecha) || 'Sin fecha'} · {contar(temas(r.canciones), 'canción', 'canciones')}</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                ))}
                                {reps.some(r => !r.fecha) && (
                                    <button onClick={() => setVerArchivados(v => !v)} aria-expanded={verArchivados}
                                        className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left active:bg-fill">
                                        <span className="flex-1 text-[15px] font-semibold text-foreground">Archivados <span className="text-muted-foreground">· sin fecha · {reps.filter(r => !r.fecha).length}</span></span>
                                        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', verArchivados && 'rotate-90')} />
                                    </button>
                                )}
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
                            {/* En el móvil, la lista de ahora en un botón; en el ordenador están a la izquierda */}
                            <div className="mb-2 flex items-center gap-2 lg:hidden">
                                <BotonListas nombre={nombreDeLista(listaId, listas)} n={enLista.length} onClick={() => setHojaListas(true)} />
                                {listaPropia && (
                                    <button onClick={() => setOpcionesLista(listaPropia)} aria-label={`Opciones de ${listaPropia.nombre}`}
                                        className="pulsable h-9 w-9 shrink-0 rounded-full bg-fill flex items-center justify-center text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                                )}
                            </div>
                            <BarraFiltros className="mb-3" canciones={canciones} tonoDe={tonoDeCancion} filtros={filtros} onCambio={setFiltros}
                                agrupar={agrupar} onAgrupar={setAgrupar} />
                            {elegidas && (
                                <p className="mb-2 px-1 flex flex-wrap items-center gap-x-3 text-[14px] text-muted-foreground">
                                    Toca las canciones que quieras elegir.
                                    <button onClick={() => setElegidas(elegidas.length === filtradas.length ? [] : filtradas.map(c => c.id))}
                                        className="font-semibold text-foreground underline underline-offset-2">
                                        {elegidas.length === filtradas.length ? 'Quitar todas' : `Seleccionar todas (${filtradas.length})`}
                                    </button>
                                </p>
                            )}
                            {!elegidas && filtradas.length > 0 && (
                                <div className="mb-3 flex items-center gap-2">
                                    <SelectorVista valor={vista} onCambio={v => cambiarParam('vista', v === (ancho ? 'tabla' : 'lista') ? null : v)} />
                                    {vista === 'cifrado' && temasCifrado.some(t => t.m) && <SuenaFormas formas={formas} onCambio={setFormas} />}
                                    {vista === 'cifrado' && (
                                        <button onClick={() => cambiarParam('directo', '1')} className="pulsable ml-auto h-9 px-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold">En directo</button>
                                    )}
                                </div>
                            )}
                            {filtradas.length === 0 ? (
                                <p className="rounded-2xl bg-fill px-4 py-6 text-center text-[15px] text-muted-foreground">
                                    {enLista.length === 0 && listaPropia && !listaPropia.regla ? 'Lista vacía: toca «Elegir», marca canciones y «A una lista».'
                                        : enLista.length === 0 ? 'Ninguna canción en esta lista todavía.' : 'Ninguna canción con estos filtros.'}
                                </p>
                            ) : vista === 'tabla' && !elegidas ? (
                                <div><TablaCanciones canciones={ordenadas} tonoDe={tonoDeCancion} guardar={c => guardar(c)} onAbrir={c => navigate(`/cancionero/${c.id}`)}
                                    clave="musikeeo-tabla-biblioteca" todas={canciones} /></div>
                            ) : vista === 'bloques' && !elegidas ? (
                                <div><TableroBloques canciones={ordenadas} campo={campoTablero} tonoDe={tonoDeCancion}
                                    onCampo={c => { setCampoTablero(c); try { localStorage.setItem('musikeeo-tablero-biblioteca', c); } catch { /* */ } }}
                                    campos={['estilos', 'proyectos', 'canta', 'tonos', 'energias', 'estados', 'etiquetas']}
                                    onMover={(c, desde, hacia) => {
                                        guardar(moverEnTablero(c, campoTablero, desde, hacia));
                                        toast.success(`«${c.titulo}» → ${hacia || 'sin dato'}`, { action: { label: 'Deshacer', onClick: () => guardar(c) } });
                                    }}
                                    onAbrir={c => navigate(`/cancionero/${c.id}`)}
                                    onAnadir={col => navigate(`/cancionero/nueva${col.clave ? `?campo=${campoTablero}&valor=${encodeURIComponent(col.clave)}` : ''}`)} /></div>
                            ) : vista === 'cifrado' && !elegidas ? (
                                <HojaSet temas={temasCifrado} tamano={17} formas={formas} ancho onAbrir={abrirDesdeCifrado} />
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
                                <p className="mt-2 px-1 flex flex-wrap items-center gap-x-3 text-[13px] text-muted-foreground">
                                    {filtradas.length} de {enLista.length} canciones
                                    {!elegidas && <button onClick={() => setEditorLista({ lista: null })} className="font-semibold text-foreground underline underline-offset-2">Guardar como lista</button>}
                                </p>
                            )}
                        </>
                    )}
                </>
            )}

            <CifradoEnDirecto abierta={directo} onCerrar={() => cambiarParam('directo', null)} titulo="Tus canciones" temas={temasCifrado} formas={formas} onFormas={setFormas}
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
                        <button onClick={() => setLote(true)} aria-label="Más: grupo, borrar…" className="pulsable h-11 w-11 shrink-0 rounded-full bg-fill flex items-center justify-center text-foreground">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {grupoActual ? (
                            <button onClick={() => { cambiarGrupo(canciones.filter(c => elegidas.includes(c.id)), grupoActual, false); setElegidas(null); }}
                                className="pulsable h-[52px] px-3 min-w-0 shrink rounded-[14px] bg-fill text-foreground font-semibold text-[15px] truncate">Quitar de {grupoActual}</button>
                        ) : listaPropia && !listaPropia.regla ? (
                            <button onClick={() => {
                                const antes = listaPropia;
                                guardarLista({ ...listaPropia, canciones: listaPropia.canciones.filter(id => !elegidas.includes(id)) });
                                toast(`${elegidas.length} fuera de «${antes.nombre}»`, { action: { label: 'Deshacer', onClick: () => guardarLista(antes) } });
                                setElegidas(null);
                            }} className="pulsable h-[52px] px-4 shrink-0 rounded-[14px] bg-fill text-foreground font-semibold text-[15px]">Quitar de la lista</button>
                        ) : (
                            <button onClick={() => setALista(true)} className="pulsable h-[52px] px-4 shrink-0 rounded-[14px] bg-fill text-foreground font-semibold text-[15px] flex items-center gap-1.5">
                                <ListPlus className="h-5 w-5" /> A una lista
                            </button>
                        )}
                        <button onClick={() => setARepertorio(true)} className="pulsable flex-1 min-w-0 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] truncate px-3">
                            {elegidas.length} al repertorio
                        </button>
                    </div>
                </div>
            )}
            <AccionesLote abierta={lote} onCerrar={() => setLote(false)} elegidas={elegidas ?? []} onHecho={() => setElegidas(null)} />
            <AnadirALista abierta={aLista} onCerrar={() => setALista(false)} ids={elegidas ?? []} listas={listas} onHecho={() => setElegidas(null)}
                onNueva={() => { setALista(false); setEditorLista({ lista: null }); }} />
            <Hoja abierta={hojaListas} onCerrar={() => setHojaListas(false)} titulo="Listas" alta derecha={<BotonHoja fuerte onClick={() => setHojaListas(false)}>Listo</BotonHoja>}>
                <div className="px-3 pb-5">{menuListas(false)}</div>
            </Hoja>
            <EditorLista abierta={!!editorLista} onCerrar={() => setEditorLista(null)} lista={editorLista?.lista}
                reglaDeAhora={editorLista?.lista ? null : reglaDeAhora}
                onCreada={l => {
                    // Con canciones elegidas, la lista nueva se lleva esas
                    if (elegidas?.length && !l.regla) { guardarLista({ ...l, canciones: elegidas }); setElegidas(null); }
                    elegirLista(l.id);
                    if (l.regla) setFiltros(SIN_FILTROS);
                }} />
            <Hoja abierta={!!opcionesLista} onCerrar={() => setOpcionesLista(null)} titulo={opcionesLista?.nombre ?? ''} derecha={<BotonHoja fuerte onClick={() => setOpcionesLista(null)}>Listo</BotonHoja>}>
                {opcionesLista && (
                    <div className="px-4 pb-5">
                        <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                            {([
                                [Pencil, 'Nombre y color', () => { setEditorLista({ lista: opcionesLista }); setOpcionesLista(null); }],
                                [Plus, 'Hacer un repertorio con esta lista', () => {
                                    const ids = cancionesDeLista(opcionesLista.id, canciones, listas, tonoDeCancion).map(c => c.id);
                                    const r = crearRepertorio(opcionesLista.nombre, ids);
                                    setOpcionesLista(null);
                                    navigate(`/cancionero/repertorio/${r.id}`);
                                }],
                                [Table2, 'Verla en Cifrado', () => { elegirLista(opcionesLista.id, 'cifrado'); setOpcionesLista(null); }],
                            ] as const).map(([Icono, t, f]) => (
                                <button key={t} onClick={f} className="w-full h-12 px-4 flex items-center gap-2.5 text-left text-[15px] text-foreground active:bg-fill-strong">
                                    <Icono className="h-[18px] w-[18px]" /> {t}
                                </button>
                            ))}
                            <button onClick={() => {
                                const l = opcionesLista;
                                void borrarLista(l.id);
                                if (listaId === l.id) elegirLista('todas');
                                setOpcionesLista(null);
                                toast(`Lista «${l.nombre}» borrada (las canciones siguen)`, { action: { label: 'Deshacer', onClick: () => guardarLista(l) } });
                            }} className="w-full h-12 px-4 flex items-center gap-2.5 text-left text-[15px] text-destructive active:bg-fill-strong">
                                <Trash2 className="h-[18px] w-[18px]" /> Borrar la lista
                            </button>
                        </div>
                    </div>
                )}
            </Hoja>
            <AnadirARepertorio abierta={aRepertorio} onCerrar={() => setARepertorio(false)} ids={elegidas ?? []} onHecho={() => setElegidas(null)} />

            <ImportarCanciones abierto={importar} onCerrar={() => setImportar(false)} />
            <CompletarLetras abierta={completar} onCerrar={() => setCompletar(false)} />
            {/* ⋯: lo de poner al día el cancionero, fuera del primer plano */}
            <Hoja abierta={mantenimiento} onCerrar={() => { setMantenimiento(false); setConfirmarBorrar(false); }} titulo="Tu cancionero" derecha={<BotonHoja fuerte onClick={() => setMantenimiento(false)}>Listo</BotonHoja>}>
                <div className="px-4 pb-5 space-y-2">
                    {faltanLetra > 0 && (
                        <button type="button" onClick={() => { setMantenimiento(false); setCompletar(true); }} className="pulsable w-full h-12 px-4 rounded-2xl bg-fill text-[15px] font-semibold text-foreground flex items-center gap-2.5">
                            <FileText className="h-[18px] w-[18px]" /> Completar letras <span className="ml-auto text-muted-foreground">{faltanLetra}</span>
                        </button>
                    )}
                    <PonerPortadas className="w-full h-12 px-4 rounded-2xl text-[15px] gap-2.5" />
                    <PonerTempo className="w-full h-12 px-4 rounded-2xl text-[15px] gap-2.5" />
                    <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        <button onClick={() => { setMantenimiento(false); setImportar(true); }} className="w-full h-12 px-4 flex items-center gap-2.5 text-[15px] text-foreground active:bg-fill-strong">
                            <FileUp className="h-[18px] w-[18px]" /> Importar canciones o una copia
                        </button>
                        <button onClick={() => descargarCopia(crearCopia(canciones, repertorios))} className="w-full h-12 px-4 flex items-center gap-2.5 text-[15px] text-foreground active:bg-fill-strong">
                            <Download className="h-[18px] w-[18px]" /> Guardar una copia del cancionero
                        </button>
                    </div>
                    {(canciones.length > 0 || repertorios.length > 0) && (
                        !confirmarBorrar ? (
                            <button onClick={() => setConfirmarBorrar(true)} className="w-full h-12 px-4 rounded-2xl bg-fill flex items-center gap-2.5 text-[15px] text-destructive active:bg-fill-strong">
                                <Trash2 className="h-[18px] w-[18px]" /> Borrar todo y empezar de cero
                            </button>
                        ) : (
                            <div className="rounded-2xl bg-fill p-4 space-y-3">
                                <p className="text-[15px] text-foreground">
                                    Se borran tus {canciones.length} canciones, {repertorios.length} {repertorios.length === 1 ? 'repertorio' : 'repertorios'}{listas.length ? ' y tus listas' : ''}
                                    {conCuenta ? ', aquí y en tu cuenta' : ''}. Antes se descarga una copia por si acaso.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setConfirmarBorrar(false)} className="pulsable h-11 rounded-[14px] bg-sheet text-[15px] font-semibold text-foreground">Cancelar</button>
                                    <button onClick={() => {
                                        descargarCopia(crearCopia(canciones, repertorios));
                                        void cancioneroService.vaciarTodo();
                                        setConfirmarBorrar(false);
                                        setMantenimiento(false);
                                        toast('Cancionero vacío. Ya puedes importar lo nuevo.');
                                        setImportar(true);
                                    }} className="pulsable h-11 rounded-[14px] bg-destructive text-[15px] font-semibold text-destructive-foreground">Borrar todo</button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </Hoja>
        </div>
        </ConMenu>
    );
}
