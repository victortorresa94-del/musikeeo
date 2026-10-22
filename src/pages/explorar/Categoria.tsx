import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, LayoutGrid, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { categoriaPorSlug, iconoCategoria, CATEGORIAS } from '../../config/categorias';
import { anunciosDe, artistasDe, explorarService, type ProviderConFoto, type Sala } from '../../services/explorarService';
import { TarjetaAnuncio, TarjetaSala, TarjetaTecnico } from '../../components/explorar/Tarjetas';
import { CeldaArtista, FilaAnuncio, FilaArtista, FilaSala, FilaTecnico } from '../../components/explorar-categoria/Tarjetas';
import { HojaFiltros, PanelFiltros, type Seccion } from '../../components/explorar-categoria/PanelFiltros';
import { CampoRodrigo, LineaRodrigo } from '../../components/explorar-categoria/PideleARodrigo';
import { pedirFiltros } from '../../components/explorar-categoria/rodrigoFiltros';
import {
    EXTRAS, FORMACIONES, ORDENES, TIPOS, VACIOS, cuantos, cuantosFiltros, ejemploRodrigo, escribirFiltros, facetas, filtrar, firma,
    leerFiltros, nombreFecha, nombrePrecio, pastillas, sinFiltros, type Datos, type Filtros, type Pastilla,
} from '../../components/explorar-categoria/filtros';
import type { Artist, Listing } from '../../types';

const CLAVE_CIUDAD = 'musikeeo-ciudad';
const CLAVE_VISTA = 'musikeeo-explorar-vista';
const claveRodrigo = (slug: string) => `musikeeo-explorar-rodrigo-${slug}`;
type Vista = 'lista' | 'rejilla';
interface Aplicado { firma: string; explicacion: string; fuente: 'rodrigo' | 'respaldo' }

const leer = (k: string, s: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) => { try { return s?.getItem(k) ?? null; } catch { return null; } };
const guardar = (k: string, v: string | null, s: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) => {
    try { if (v === null) s?.removeItem(k); else s?.setItem(k, v); } catch { /* sin almacenamiento */ }
};
const sesion = () => (typeof window !== 'undefined' ? window.sessionStorage : undefined);

// La vista de una categoría del marketplace (conceptos A y B): cabecera con su icono 3D,
// buscador con filtros, pastillas rápidas, «Pídeselo a Rodrigo», ordenar, lista o rejilla.
// Los filtros viven en la URL: se pueden compartir y vuelven al ir atrás.
export default function Categoria() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const cat = categoriaPorSlug(slug);
    const [params, setParams] = useSearchParams();
    const [artistas, setArtistas] = useState<Artist[] | null>(null);
    const [tecnicos, setTecnicos] = useState<ProviderConFoto[] | null>(null);
    const [salas, setSalas] = useState<Sala[] | null>(null);
    const [anuncios, setAnuncios] = useState<Listing[] | null>(null);
    const [hoja, setHoja] = useState<{ seccion: Seccion | null } | null>(null);
    const [vista, setVista] = useState<Vista>(() => (leer(CLAVE_VISTA) === 'rejilla' ? 'rejilla' : 'lista'));
    const [ocupado, setOcupado] = useState(false);
    const [aplicado, setAplicado] = useState<Aplicado | null>(null);

    const filtros = useMemo(() => leerFiltros(params), [params]);
    const [texto, setTexto] = useState(filtros.q);

    useEffect(() => {
        if (!cat) return;
        if (cat.tipo === 'artistas') explorarService.artistas().then(setArtistas).catch(() => setArtistas([]));
        if (cat.tipo === 'tecnicos') explorarService.tecnicos().then(setTecnicos).catch(() => setTecnicos([]));
        if (cat.tipo === 'salas') explorarService.salas().then(setSalas).catch(() => setSalas([]));
        if (cat.tipo === 'equipo') explorarService.anuncios().then(setAnuncios).catch(() => setAnuncios([]));
    }, [cat]);

    // Lo último que entendió Rodrigo en esta categoría (vuelve al ir atrás)
    useEffect(() => {
        if (!slug) return;
        try { const v = JSON.parse(leer(claveRodrigo(slug), sesion()) || 'null'); setAplicado(v && typeof v.firma === 'string' ? v : null); } catch { setAplicado(null); }
    }, [slug]);
    const recordar = (a: Aplicado | null) => { setAplicado(a); if (slug) guardar(claveRodrigo(slug), a ? JSON.stringify(a) : null, sesion()); };

    // Lo de la categoría, sin filtrar: de aquí salen las facetas
    const base: Datos | null = useMemo(() => {
        if (!cat) return null;
        if (cat.tipo === 'artistas') return artistas ? { tipo: 'artistas', items: artistasDe(cat, artistas) } : null;
        if (cat.tipo === 'tecnicos') return tecnicos ? { tipo: 'tecnicos', items: tecnicos } : null;
        if (cat.tipo === 'salas') return salas ? { tipo: 'salas', items: salas } : null;
        return anuncios ? { tipo: 'equipo', items: anunciosDe(cat, anuncios) } : null;
    }, [cat, artistas, tecnicos, salas, anuncios]);
    const fac = useMemo(() => (base ? facetas(base) : null), [base]);
    const resultado = useMemo(() => (base ? filtrar(base, filtros) : null), [base, filtros]);
    const contar = useCallback((f: Filtros) => (base ? filtrar(base, f).items.length : 0), [base]);

    // Siempre sobre lo último (el buscador escribe con retraso y no debe pisar otro filtro)
    const ultimo = useRef(filtros);
    ultimo.current = filtros;
    const aplicar = useCallback((f: Filtros) => {
        if (f.ciudad !== ultimo.current.ciudad) guardar(CLAVE_CIUDAD, f.ciudad || '');
        setParams(prev => escribirFiltros(f, prev), { replace: true });
    }, [setParams]);

    // La ciudad que eligió en Explorar, si llega sin filtros y hay algo en esa ciudad
    const ciudadPuesta = useRef<string | null>(null);
    useEffect(() => {
        if (!fac || !slug || ciudadPuesta.current === slug) return;
        ciudadPuesta.current = slug;
        if (params.toString()) return;
        const suya = leer(CLAVE_CIUDAD);
        if (suya && fac.ciudades.includes(suya)) aplicar({ ...filtros, ciudad: suya });
    }, [fac, slug]); // eslint-disable-line react-hooks/exhaustive-deps

    // El buscador escribe en la URL con un poco de calma
    useEffect(() => { setTexto(filtros.q); }, [filtros.q]);
    useEffect(() => {
        const t = setTimeout(() => { if (texto.trim() !== ultimo.current.q.trim()) aplicar({ ...ultimo.current, q: texto }); }, 250);
        return () => clearTimeout(t);
    }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps

    const cambiarVista = (v: Vista) => { setVista(v); guardar(CLAVE_VISTA, v); };
    const cerrarHoja = useCallback(() => setHoja(null), []);

    if (!cat) return <Navigate to="/explorar" replace />;

    const cargando = !resultado || !fac;
    const n = resultado?.items.length ?? 0;
    const total = base?.items.length ?? 0;
    const puestos = cuantosFiltros(filtros);
    const pills = pastillas(filtros);

    const pedir = async (peticion: string) => {
        if (!fac) return;
        setOcupado(true);
        try {
            const r = await pedirFiltros(peticion, cat, fac);
            const nf: Filtros = { ...VACIOS, ...r.filtros, orden: filtros.orden };
            aplicar(nf);
            recordar({ firma: firma(nf), explicacion: r.explicacion, fuente: r.fuente });
        } finally {
            setOcupado(false);
        }
    };
    const verLinea = !!aplicado && aplicado.firma === firma(filtros) && pills.length > 0;
    const quitarPastilla = (p: Pastilla) => {
        const nf = p.quitar(filtros);
        aplicar(nf);
        if (aplicado) recordar({ ...aplicado, firma: firma(nf) });
    };

    const back = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1); else navigate('/explorar');
    };

    const vacio = {
        artistas: { texto: `Aún no hay ${cat.nombre.toLowerCase()} aquí.`, cta: 'Crear mi perfil de artista', to: '/panel/perfil' },
        tecnicos: { texto: 'Aún no hay técnicos.', cta: 'Crear mi ficha de técnico', to: '/panel/perfil-tecnico' },
        salas: { texto: 'Aún no hay salas.', cta: 'Publicar un bolo', to: '/publicar' },
        equipo: { texto: `Aún no hay anuncios de ${cat.nombre.toLowerCase()}.`, cta: 'Publicar anuncio', to: '/market/create' },
    }[cat.tipo];

    // ─── Pastillas rápidas (concepto A) ─────────────────────────────────────
    type Rapida = { id: string; texto: string; activo: boolean; desplegable?: boolean; onClick: () => void };
    const abrir = (seccion: Seccion) => () => setHoja({ seccion });
    const rapidas: Rapida[] = [];
    if (fac) {
        const donde: Rapida | null = fac.ciudades.length ? { id: 'donde', texto: filtros.ciudad || (cat.tipo === 'tecnicos' ? 'Zona' : 'Ciudad'), activo: !!filtros.ciudad, desplegable: true, onClick: abrir('donde') } : null;
        const precio: Rapida | null = fac.precios.length >= 2 ? { id: 'precio', texto: filtros.min !== null || filtros.max !== null ? nombrePrecio(filtros.min, filtros.max) : 'Precio', activo: filtros.min !== null || filtros.max !== null, desplegable: true, onClick: abrir('precio') } : null;
        const lista = (id: Seccion, nombre: string, elegidos: string[]): Rapida => ({ id, texto: elegidos.length ? `${elegidos[0]}${elegidos.length > 1 ? ` +${elegidos.length - 1}` : ''}` : nombre, activo: elegidos.length > 0, desplegable: true, onClick: abrir(id) });
        if (cat.tipo === 'artistas') {
            if (donde) rapidas.push(donde);
            if (fac.fechas) rapidas.push({ id: 'cuando', texto: filtros.fecha ? nombreFecha(filtros.fecha) : 'Fecha', activo: !!filtros.fecha, desplegable: true, onClick: abrir('cuando') });
            if (precio) rapidas.push(precio);
            if (fac.estilos.length) rapidas.push(lista('estilo', 'Estilo', filtros.estilos));
            if (fac.formaciones.length) rapidas.push({ id: 'formacion', texto: filtros.musicos ? FORMACIONES.find(x => x.id === filtros.musicos)!.pastilla : 'Nº músicos', activo: !!filtros.musicos, desplegable: true, onClick: abrir('formacion') });
            if (fac.extras.includes('sonido')) {
                const on = filtros.extras.includes('sonido');
                rapidas.push({ id: 'sonido', texto: EXTRAS[0].pastilla, activo: on, onClick: () => aplicar({ ...filtros, extras: on ? filtros.extras.filter(e => e !== 'sonido') : [...filtros.extras, 'sonido'] }) });
            }
            fac.ideal.slice(0, 2).forEach(i => {
                const on = filtros.ideal.includes(i);
                rapidas.push({ id: `ideal-${i}`, texto: `Para ${i.toLowerCase()}`, activo: on, onClick: () => aplicar({ ...filtros, ideal: on ? filtros.ideal.filter(x => x !== i) : [...filtros.ideal, i] }) });
            });
        } else if (cat.tipo === 'tecnicos') {
            if (donde) rapidas.push(donde);
            if (fac.servicios.length) rapidas.push(lista('servicios', 'Servicio', filtros.servicios));
            if (fac.equipo.length) rapidas.push(lista('equipo', 'Equipo', filtros.equipo));
            if (precio) rapidas.push(precio);
        } else if (cat.tipo === 'salas') {
            fac.ciudades.forEach(c => rapidas.push({ id: `c-${c}`, texto: c, activo: filtros.ciudad === c, onClick: () => aplicar({ ...filtros, ciudad: filtros.ciudad === c ? null : c }) }));
        } else {
            if (fac.tipos.length > 1) TIPOS.filter(t => fac.tipos.includes(t.id)).forEach(t =>
                rapidas.push({ id: `t-${t.id}`, texto: t.nombre, activo: filtros.tipo === t.id, onClick: () => aplicar({ ...filtros, tipo: filtros.tipo === t.id ? null : t.id }) }));
            if (fac.estados.length) rapidas.push({ id: 'estado', texto: filtros.estado.length ? `Estado (${filtros.estado.length})` : 'Estado', activo: filtros.estado.length > 0, desplegable: true, onClick: abrir('estado') });
            if (precio) rapidas.push(precio);
            if (donde) rapidas.push(donde);
            if (fac.urgente) rapidas.push({ id: 'urgente', texto: 'Urgente', activo: filtros.urgente, onClick: () => aplicar({ ...filtros, urgente: !filtros.urgente }) });
        }
    }
    const conVista = cat.tipo !== 'tecnicos';
    const ordenes = ORDENES.filter(o => fac?.ordenes.includes(o.id));

    // ─── Resultados ─────────────────────────────────────────────────────────
    const resultados = () => {
        if (!resultado) return null;
        const r = resultado;
        const rejilla = vista === 'rejilla';
        // En el PC siempre rejilla; en el móvil, la vista elegida
        const enLista = 'flex flex-col gap-3 md:hidden';
        if (r.tipo === 'artistas') return <>
            {!rejilla && <div className={enLista}>{r.items.map(a => <FilaArtista key={a.id} a={a} f={filtros} />)}</div>}
            <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4', !rejilla && 'hidden md:grid')}>{r.items.map(a => <CeldaArtista key={a.id} a={a} f={filtros} />)}</div>
        </>;
        if (r.tipo === 'equipo') return <>
            {!rejilla && <div className={enLista}>{r.items.map(l => <FilaAnuncio key={l.id} l={l} />)}</div>}
            <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4', !rejilla && 'hidden md:grid')}>{r.items.map(l => <TarjetaAnuncio key={l.id} l={l} />)}</div>
        </>;
        if (r.tipo === 'salas') return <>
            {!rejilla && <div className={enLista}>{r.items.map(s => <FilaSala key={s.uid} s={s} />)}</div>}
            <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4', !rejilla && 'hidden md:grid')}>{r.items.map(s => <TarjetaSala key={s.uid} s={s} />)}</div>
        </>;
        return <>
            <div className={enLista}>{r.items.map(p => <FilaTecnico key={p.id} p={p} />)}</div>
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-3">{r.items.map(p => <TarjetaTecnico key={p.id} p={p} />)}</div>
        </>;
    };

    return (
        <div className="max-w-[1200px] mx-auto pt-2 md:pt-4 pb-16 md:px-8">
            {/* Cabecera: el icono 3D de la categoría y cuántos hay */}
            <div className="px-4 md:px-0">
                <button onClick={back} className="h-10 -ml-2 pr-3 flex items-center text-[17px] text-foreground active:opacity-60">
                    <ChevronLeft className="h-6 w-6" /> Explorar
                </button>
                <div className="mt-1 flex items-center gap-4">
                    <img src={iconoCategoria(cat)} alt="" className="h-[80px] w-[92px] md:h-[92px] md:w-[106px] shrink-0 rounded-[20px] object-cover shadow-e2" />
                    <div className="min-w-0">
                        <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground">{cat.nombre}</h1>
                        <p className="mt-0.5 text-[15px] text-muted-foreground" aria-live="polite">
                            {cargando ? 'Buscando…' : `${cuantos(cat, n)} en ${filtros.ciudad || 'toda España'}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="md:mt-6 md:grid md:grid-cols-[272px_minmax(0,1fr)] md:gap-8 md:items-start">
                {/* PC: los filtros en una columna fija a la izquierda */}
                <aside className="hidden md:block sticky top-[72px] max-h-[calc(100dvh-88px)] overflow-y-auto overscroll-contain rounded-[20px] bg-card border border-hairline shadow-e1 px-4 pt-3 pb-2" aria-label="Filtros">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[20px] font-bold text-foreground">Filtros</h2>
                        {puestos > 0 && (
                            <button type="button" onClick={() => aplicar(sinFiltros(filtros))} className="pulsable h-9 px-1 text-[14px] font-semibold text-muted-foreground">Borrar todo</button>
                        )}
                    </div>
                    {fac ? <PanelFiltros cat={cat} fac={fac} f={filtros} onChange={aplicar} />
                        : <div className="mt-3 space-y-3 pb-3">{[0, 1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-fill animate-pulse" />)}</div>}
                </aside>

                <div className="min-w-0">
                    {/* Buscador con el botón de filtros y cuántos hay puestos */}
                    <div className="mt-4 md:mt-0 px-4 md:px-0 flex gap-2">
                        <label className="relative flex-1 block">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
                            <input value={texto} onChange={e => setTexto(e.target.value)} enterKeyHint="search"
                                placeholder={cat.tipo === 'artistas' ? 'Busca por nombre o estilo' : cat.tipo === 'equipo' ? 'Busca marca o modelo' : 'Busca por nombre'}
                                aria-label={`Buscar en ${cat.nombre.toLowerCase()}`}
                                className="w-full h-12 rounded-[14px] bg-fill pl-11 pr-10 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                            {texto && (
                                <button type="button" onClick={() => setTexto('')} aria-label="Borrar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </label>
                        <button type="button" onClick={() => setHoja({ seccion: null })} disabled={!fac}
                            aria-label={puestos ? `Filtros, ${puestos} puestos` : 'Filtros'}
                            className="pulsable md:hidden relative h-12 w-[52px] shrink-0 rounded-[14px] bg-fill flex items-center justify-center text-foreground disabled:opacity-50">
                            <SlidersHorizontal className="h-5 w-5" />
                            {puestos > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-foreground text-background text-[12px] font-bold flex items-center justify-center">{puestos}</span>
                            )}
                        </button>
                    </div>

                    {/* Pastillas de filtro rápido (en el PC están en la columna) */}
                    {rapidas.length > 0 && (
                        <div className="md:hidden mt-3 flex gap-2 overflow-x-auto hide-scrollbar px-4">
                            {rapidas.map(r => (
                                <button key={r.id} type="button" onClick={r.onClick} aria-pressed={r.activo}
                                    className={cn('pulsable shrink-0 h-9 rounded-full text-[14px] font-semibold flex items-center gap-1',
                                        r.desplegable ? 'pl-3.5 pr-2.5' : 'px-3.5', r.activo ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                                    {r.texto}
                                    {r.desplegable && <ChevronDown className="h-4 w-4 opacity-70" />}
                                    {!r.desplegable && r.id === 'sonido' && (
                                        <span className={cn('ml-1 relative h-[18px] w-[30px] rounded-full', r.activo ? 'bg-background/30' : 'bg-fill-strong')}>
                                            <span className={cn('absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-background shadow-e1 transition-transform', r.activo && 'translate-x-3')} />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Pídeselo a Rodrigo */}
                    <div className="mt-4 px-4 md:px-0">
                        <CampoRodrigo ejemplo={ejemploRodrigo(cat)} ocupado={ocupado || !fac} onPedir={pedir} />
                        {verLinea && aplicado && (
                            <LineaRodrigo fuente={aplicado.fuente} explicacion={aplicado.explicacion} pastillas={pills}
                                onQuitar={quitarPastilla} onCerrar={() => { aplicar(sinFiltros({ ...filtros, q: '' })); recordar(null); }} />
                        )}
                    </div>

                    {/* Ordenar y lista/rejilla */}
                    <div className="mt-4 px-4 md:px-0 flex items-center justify-between gap-3">
                        {ordenes.length > 1 ? (
                            <label className="relative h-9 flex items-center text-[15px] text-muted-foreground">
                                Ordenar:&nbsp;<b className="font-bold text-foreground">{ORDENES.find(o => o.id === filtros.orden)?.nombre}</b>
                                <ChevronDown className="ml-0.5 h-4 w-4 text-foreground" />
                                <select value={filtros.orden} onChange={e => aplicar({ ...filtros, orden: e.target.value as Filtros['orden'] })} aria-label="Ordenar"
                                    className="absolute inset-0 opacity-0 cursor-pointer">
                                    {ordenes.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                                </select>
                            </label>
                        ) : <span className="text-[15px] text-muted-foreground">{cargando ? '' : cuantos(cat, n)}</span>}
                        {conVista && (
                            <div className="md:hidden flex rounded-full bg-fill p-[3px]" role="group" aria-label="Cómo ver los resultados">
                                {([['lista', List, 'Ver en lista'], ['rejilla', LayoutGrid, 'Ver en rejilla']] as const).map(([v, Icono, nombre]) => (
                                    <button key={v} type="button" onClick={() => cambiarVista(v)} aria-pressed={vista === v} aria-label={nombre}
                                        className={cn('pulsable h-8 w-11 rounded-full flex items-center justify-center', vista === v ? 'bg-foreground text-background' : 'text-foreground')}>
                                        <Icono className="h-[18px] w-[18px]" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-3 px-4 md:px-0">
                        {cargando && (
                            <div className="flex flex-col md:grid md:grid-cols-3 gap-3">
                                {[0, 1, 2].map(i => <div key={i} className="h-[136px] md:h-[280px] rounded-[18px] bg-fill animate-pulse" />)}
                            </div>
                        )}

                        {/* Vacío de verdad: la categoría no tiene nada todavía */}
                        {!cargando && total === 0 && (
                            <div className="py-12 text-center">
                                <img src={iconoCategoria(cat)} alt="" className="h-16 w-[72px] mx-auto rounded-2xl object-cover opacity-90" />
                                <p className="mt-3 text-[15px] text-foreground font-semibold">{vacio.texto}</p>
                                <p className="mt-1 text-[14px] text-muted-foreground">Sé el primero: lo verán todos los que busquen aquí.</p>
                                <Link to={vacio.to} className="pulsable mt-5 inline-flex h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">{vacio.cta}</Link>
                            </div>
                        )}

                        {/* Hay, pero no con estos filtros */}
                        {!cargando && total > 0 && n === 0 && (
                            <div className="py-10 text-center">
                                <img src={iconoCategoria(cat)} alt="" className="h-16 w-[72px] mx-auto rounded-2xl object-cover opacity-90" />
                                <p className="mt-3 text-[16px] text-foreground font-semibold">No hay {cuantos(cat, 2).replace(/^2 /, '')} con estos filtros.</p>
                                <p className="mt-1 text-[14px] text-muted-foreground max-w-[320px] mx-auto">
                                    Hay {cuantos(cat, total)} en total. Quita algún filtro{pills.length > 1 ? ' o bórralos todos' : ''}.
                                </p>
                                {pills.length > 0 && (
                                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                                        {pills.map(p => (
                                            <button key={p.clave} type="button" onClick={() => quitarPastilla(p)} aria-label={`Quitar ${p.texto}`}
                                                className="pulsable h-8 pl-3 pr-2 rounded-full bg-fill text-foreground text-[13px] font-semibold flex items-center gap-1">
                                                {p.texto}<X className="h-3.5 w-3.5 opacity-60" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <button type="button" onClick={() => { aplicar(sinFiltros({ ...filtros, q: '' })); setTexto(''); }}
                                    className="pulsable mt-5 inline-flex h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">
                                    Borrar filtros
                                </button>
                                {cat.tipo === 'artistas' && (
                                    <p className="mt-4 text-[14px] text-muted-foreground">
                                        ¿Lo tienes claro? <Link to="/publicar" className="font-semibold text-foreground underline underline-offset-2">Publica el bolo</Link> y te escriben ellos.
                                    </p>
                                )}
                            </div>
                        )}

                        {!cargando && n > 0 && resultados()}
                    </div>

                    {/* Otras categorías del mismo grupo */}
                    <div className="mt-10 px-4 md:px-0">
                        <h2 className="text-[18px] font-bold text-foreground">{cat.grupo === 'Contratar' ? 'Más para contratar' : 'Más para comprar y alquilar'}</h2>
                        <div className="mt-3 flex gap-3 overflow-x-auto hide-scrollbar">
                            {CATEGORIAS.filter(c => c.grupo === cat.grupo && c.slug !== cat.slug).map(c => (
                                <Link key={c.slug} to={`/explorar/${c.slug}`} className="pulsable shrink-0 w-[76px] flex flex-col items-center gap-1">
                                    <img src={iconoCategoria(c)} alt="" loading="lazy" className="w-full aspect-[8/7] rounded-2xl object-cover" />
                                    <span className="text-[12px] font-semibold text-foreground text-center leading-tight">{c.nombre}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {fac && (
                <HojaFiltros abierta={!!hoja} seccion={hoja?.seccion ?? null} cat={cat} fac={fac} f={filtros} contar={contar}
                    onAplicar={f => { aplicar(f); setHoja(null); }} onCerrar={cerrarHoja} />
            )}

            {/* Portal: el contenedor de la página lleva transform y descolocaría el fixed */}
            {cat.tipo === 'equipo' && createPortal(
                <Link to="/market/create" className="pulsable fixed md:hidden left-1/2 -translate-x-1/2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 h-12 pl-4 pr-5 rounded-full bg-primary text-primary-foreground font-semibold shadow-e2 flex items-center gap-1.5">
                    <Plus className="h-5 w-5" /> Vender o alquilar
                </Link>,
                document.body,
            )}
        </div>
    );
}
