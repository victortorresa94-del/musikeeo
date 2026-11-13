import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, ChevronDown, ChevronLeft, Plus, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { useFiltrosGuardados } from '../../hooks/useFiltrosGuardados';
import { duracionDe, filtrar, mismoTitulo, pesoVersion, textoDuracion, tonoMostrado, type CampoFiltro } from '../../lib/biblioteca';
import { columnas, NOMBRE_TABLERO } from '../../lib/tablero';
import type { Cancion, Repertorio } from '../../types/cancionero';
import { norm, tonoDe } from './utilidades';
import { ICONO, bloqueDe, estiloBloque, pastelDe, pastelValor, type Pastel } from './estilo';
import { FilaCancion } from './FilaCancion';
import { BarraFiltros } from './Filtros';
import { ImportarCanciones } from './ImportarCanciones';
import { ResultadosCatalogo, TituloResultados } from './ResultadosCatalogo';
import { useHuecoDelMenu } from './ConMenu';
import { BusquedasRecientes } from './BusquedasRecientes';
import { useBusquedasRecientes } from '../../hooks/useBusquedasRecientes';

// «Añadir canciones» al repertorio a pantalla completa (13-nov, víspera de Pallejà). Víctor:
// «quiero una vista mucho mejor que ese popup… por categorías, organizarlo de distintas formas,
// por ejemplo para decir: a ver qué rumbas meto». Tu cancionero agrupado por estilo, grupo,
// quién canta, tono, energía, estado o etiqueta; un toque mete la canción en el set o en los
// extras (la recámara), y otro la saca. Arriba, lo que va durando el set.

type Agrupar = CampoFiltro | 'nada';
type Destino = 'set' | 'extras';
const AGRUPAR: Agrupar[] = ['estilos', 'proyectos', 'canta', 'tonos', 'energias', 'estados', 'etiquetas', 'nada'];
const NOMBRE_AGRUPAR: Record<Agrupar, string> = { ...NOMBRE_TABLERO, nada: 'A–Z' } as Record<Agrupar, string>;
const CLAVE_AGRUPAR = 'musikeeo-elegir-agrupar';
const TIPO_COLOR: Partial<Record<CampoFiltro, 'grupo' | 'estilo' | 'etiqueta' | 'canta'>> = { proyectos: 'grupo', estilos: 'estilo', etiquetas: 'etiqueta', canta: 'canta' };

// En el ordenador (desde md, cuando sale el menú de la app) no tapa nada: ocupa el hueco del
// contenido, con los menús a la vista. En el móvil, a pantalla completa
const MQ_PC = '(min-width: 768px)';
const suscribirPC = (f: () => void) => {
    const m = window.matchMedia(MQ_PC);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
};
const esPC = () => window.matchMedia(MQ_PC).matches;

function aspectoGrupo(campo: Agrupar, valor: string): { pastel: Pastel; icono: string } {
    if (!valor) return { pastel: { fondo: 'bg-fill', tinta: 'text-muted-foreground' }, icono: ICONO.canciones };
    if (campo === 'estilos') return estiloBloque(valor);
    const tipo = campo !== 'nada' ? TIPO_COLOR[campo] : undefined;
    return { pastel: (tipo && pastelValor(tipo, valor)) || pastelDe(`${campo}:${valor}`), icono: campo === 'canta' ? ICONO.canciones : ICONO.repertorios };
}

export function ElegirParaSet({ abierto, onCerrar, repertorio, destinoInicial = 'set' }: {
    abierto: boolean; onCerrar: () => void; repertorio: Repertorio; destinoInicial?: Destino;
}) {
    const { canciones, crear, guardarRepertorio } = useCancionero();
    const [q, setQ] = useState('');
    // Desde «Añadir extras» se entra con «A extras» marcado (13-nov: Víctor entró por ahí y la
    // canción se fue al set). Quien lo usa le da un `key` por destino, así arranca con el bueno
    const [destino, setDestino] = useState<Destino>(destinoInicial);
    const [agrupar, setAgruparEstado] = useState<Agrupar>(() => {
        try { const v = localStorage.getItem(CLAVE_AGRUPAR) as Agrupar | null; return v && AGRUPAR.includes(v) ? v : 'estilos'; } catch { return 'estilos'; }
    });
    const setAgrupar = (a: Agrupar) => { setAgruparEstado(a); setAbiertos(new Set()); try { localStorage.setItem(CLAVE_AGRUPAR, a); } catch { /* */ } };
    const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
    const [importar, setImportar] = useState(false);
    const [filtros, setFiltros] = useFiltrosGuardados('musikeeo-cancionero-elegir');
    const pc = useSyncExternalStore(suscribirPC, esPC);
    const menu = useHuecoDelMenu();
    const enSitio = abierto && pc && !!menu?.hueco;
    const tapar = menu?.tapar;

    // Escape cierra
    useEffect(() => {
        if (!abierto) return;
        const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', f);
        return () => window.removeEventListener('keydown', f);
    }, [abierto, onCerrar]);
    // A pantalla completa, la página de detrás no se mueve; en el ordenador se pinta en el hueco
    // del contenido y esconde la página del repertorio mientras está
    useEffect(() => {
        if (!abierto || enSitio) return;
        const antes = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = antes; };
    }, [abierto, enSitio]);
    useLayoutEffect(() => {
        if (!enSitio || !tapar) return;
        tapar(true);
        return () => tapar(false);
    }, [enSitio, tapar]);

    const tonos = useMemo(() => new Map(canciones.map(c => [c.id, tonoMostrado(c, tonoDe(c))])), [canciones]);
    const tonoDeCancion = useCallback((c: Cancion) => tonos.get(c.id) ?? null, [tonos]);
    const termino = q.trim();
    const { recientes, apuntar: apuntarBusqueda, quitar: quitarBusqueda, borrarTodas: borrarBusquedas } = useBusquedasRecientes('musikeeo-busquedas-anadir', q);
    const [enBuscador, setEnBuscador] = useState(false);
    // Buscando, los filtros pueden esconder una tuya («Marcha» no salía con «Lady Jarana» puesto
    // y Víctor creyó que no la tenía): se cuentan las de fuera y se pueden ver sin quitar el filtro
    const [verFuera, setVerFuera] = useState(false);
    if (verFuera && !termino) setVerFuera(false);
    const { lista, fuera } = useMemo(() => {
        const t = norm(termino);
        const coinciden = t ? canciones.filter(c => norm(`${c.titulo} ${c.version ?? ''} ${c.artista} ${c.ficha?.canta ?? ''} ${c.ficha?.estilo ?? ''} ${(c.ficha?.proyectos ?? []).join(' ')}`).includes(t) || norm(tonos.get(c.id) ?? '') === t) : canciones;
        const enFiltro = filtrar(coinciden, filtros, tonoDeCancion);
        const l = t && verFuera ? coinciden : enFiltro;
        return {
            lista: [...l].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es') || pesoVersion(a) - pesoVersion(b)),
            fuera: t ? coinciden.length - enFiltro.length : 0,
        };
    }, [canciones, termino, filtros, tonoDeCancion, tonos, verFuera]);
    const nombreFiltro = Object.values(filtros).flat().filter(Boolean).join(', ');
    const grupos = useMemo(() => (agrupar === 'nada'
        ? [{ clave: '·', titulo: 'Todas', canciones: lista }]
        : columnas(lista, agrupar, tonoDeCancion).filter(g => g.canciones.length)
    ), [lista, agrupar, tonoDeCancion]);
    // Buscando o con una sola columna, todo a la vista; si no, se abre el grupo que toques
    const todoAbierto = !!termino || grupos.length <= 1;
    const yaEsta = !!termino && canciones.some(c => mismoTitulo(c.titulo, termino));

    // Lo que dura el set (sin banquillo ni bis) y los extras
    const porId = useMemo(() => new Map(canciones.map(c => [c.id, c])), [canciones]);
    const enSet = repertorio.canciones.filter(id => porId.has(id));
    const extras = (repertorio.extras ?? []).filter(id => porId.has(id) && !repertorio.canciones.includes(id));
    const { segundos, estimada } = duracionDe(enSet.map(id => porId.get(id)!).filter(c => !/banquillo|bis/i.test(bloqueDe(c) ?? '')));
    const pasa = !!repertorio.hueco && segundos / 60 > repertorio.hueco + 1;

    // Un toque: entra (en el set o en extras, según lo marcado arriba); otro toque: sale del
    // repertorio, esté en el set o en extras. Para pasar de uno a otro, en el repertorio
    const alternar = (c: Cancion) => {
        const set = repertorio.canciones, ext = repertorio.extras ?? [];
        const dentro = set.includes(c.id) || ext.includes(c.id);
        const nuevo: Repertorio = dentro
            ? { ...repertorio, canciones: set.filter(x => x !== c.id), extras: ext.filter(x => x !== c.id) }
            : destino === 'set'
                ? { ...repertorio, canciones: [...set, c.id] }
                : { ...repertorio, extras: [...ext, c.id] };
        guardarRepertorio(nuevo);
        if (dentro) toast(`«${c.titulo}» fuera del repertorio`, { action: { label: 'Deshacer', onClick: () => guardarRepertorio(repertorio) } });
    };
    const meter = (c: Cancion) => {
        const set = repertorio.canciones, ext = repertorio.extras ?? [];
        if (destino === 'set' && !set.includes(c.id)) guardarRepertorio({ ...repertorio, canciones: [...set, c.id], extras: ext.filter(x => x !== c.id) });
        if (destino === 'extras' && !ext.includes(c.id)) guardarRepertorio({ ...repertorio, canciones: set.filter(x => x !== c.id), extras: [...ext, c.id] });
        toast.success(`«${c.titulo}» ${destino === 'set' ? 'al set' : 'a extras'}`);
        setQ('');
    };
    const crearConTitulo = () => {
        if (!termino) return;
        meter(crear({ titulo: termino.slice(0, 120), artista: '', texto: '' }));
    };
    const alternarGrupo = (k: string) => setAbiertos(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

    if (!abierto) return null;

    // Arriba: volver, el set (cuántas, cuánto dura) y a dónde van. En el ordenador se queda
    // pegada debajo de la barra de arriba de la app (h-14) mientras baja la lista
    const cabecera = (
        <div className={cn('shrink-0 border-b border-hairline', enSitio ? 'sticky top-14 z-10 bg-background' : 'pt-[env(safe-area-inset-top)] bg-chrome backdrop-blur-2xl')}>
            <div className={enSitio ? 'pt-6 pb-3' : 'max-w-5xl mx-auto px-4 pt-1 pb-2.5'}>
                <div className="flex items-center justify-between gap-2">
                    <button onClick={onCerrar} className="-ml-1.5 h-9 pr-2 inline-flex items-center text-[15px] text-muted-foreground active:opacity-60">
                        <ChevronLeft className="h-5 w-5" /> Repertorio
                    </button>
                    <button onClick={onCerrar} className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold">Listo</button>
                </div>
                <h2 className={cn('font-heading font-bold leading-tight text-foreground line-clamp-1', enSitio ? 'text-[24px]' : 'text-[18px]')}>Añadir a {repertorio.nombre}</h2>
                <p className="text-[13.5px] text-muted-foreground">
                    {enSet.length} en el set
                    {enSet.length > 0 && <> · <b className={cn('font-semibold', pasa ? 'text-destructive' : 'text-foreground')}>{estimada ? '≈ ' : ''}{textoDuracion(segundos)}</b>{repertorio.hueco ? ` de ${repertorio.hueco} min` : ''}</>}
                    {extras.length > 0 && <> · {extras.length} {extras.length === 1 ? 'extra' : 'extras'}</>}
                </p>

                {/* A dónde va lo que toques */}
                <div className="mt-2 flex items-center gap-2">
                    <div className={cn('flex-1 rounded-[12px] bg-fill p-0.5 grid grid-cols-2 gap-0.5', enSitio && 'max-w-md')} role="radiogroup" aria-label="A dónde van las que toques">
                        {([['set', 'Al set'], ['extras', 'A extras']] as const).map(([v, t]) => (
                            <button key={v} role="radio" aria-checked={destino === v} onClick={() => setDestino(v)}
                                className={cn('h-9 rounded-[10px] text-[14.5px] font-semibold', destino === v ? 'bg-foreground text-background' : 'text-foreground')}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {destino === 'set' ? 'Las que toques van al final del set y cuentan en la duración.' : 'Las que toques van a la recámara: no cuentan en la duración.'} Otro toque la saca.
                </p>

                <label className="mt-2 relative block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Busca o escribe el título" aria-label="Buscar o escribir el título" enterKeyHint="done"
                        onKeyDown={e => { if (e.key === 'Enter') { apuntarBusqueda(q); if (termino && !yaEsta && !lista.length) crearConTitulo(); } }}
                        onFocus={() => setEnBuscador(true)} onBlur={() => setEnBuscador(false)}
                        className="w-full h-11 rounded-2xl bg-fill pl-12 pr-10 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                    {q && (
                        <button onClick={() => setQ('')} aria-label="Borrar" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    {enBuscador && !q && (
                        <BusquedasRecientes recientes={recientes} onElegir={setQ} onQuitar={quitarBusqueda} onBorrar={borrarBusquedas}
                            className="absolute left-0 right-0 top-full mt-1.5 z-30" />
                    )}
                </label>

                {/* Cómo se agrupa: «a ver qué rumbas meto» = por estilo */}
                <div className={cn('mt-2.5 flex items-center gap-1.5 overflow-x-auto hide-scrollbar', !enSitio && '-mx-4 px-4')}>
                    <span className="shrink-0 text-[13px] font-semibold text-muted-foreground">Por</span>
                    {AGRUPAR.map(a => (
                        <button key={a} onClick={() => setAgrupar(a)} aria-pressed={agrupar === a}
                            className={cn('shrink-0 h-8 px-3 rounded-full text-[13.5px] font-semibold', agrupar === a ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                            {NOMBRE_AGRUPAR[a]}
                        </button>
                    ))}
                </div>
                <BarraFiltros className="mt-2" canciones={canciones} tonoDe={tonoDeCancion} filtros={filtros} onCambio={setFiltros} />
            </div>
        </div>
    );

    const cuerpo = (
        <div className={enSitio ? 'pt-3 pb-16' : 'max-w-5xl mx-auto px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+32px)]'}>
            {/* No la tienes: créala con ese título y entra ya */}
            {termino && !yaEsta && (
                <button onClick={crearConTitulo} className="pulsable mb-3 w-full min-h-[60px] rounded-[16px] bg-pastel-mantequilla pl-1.5 pr-4 py-2 flex items-center gap-2 text-left">
                    <img src={ICONO.canciones} alt="" aria-hidden className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                    <span className="flex-1 min-w-0">
                        <span className="block truncate text-[15.5px] font-bold text-foreground">Añadir «{termino}» {destino === 'set' ? 'al set' : 'a extras'}</span>
                        <span className="block text-[13px] text-muted-foreground">Entra ya; la letra y el tono se los pones luego</span>
                    </span>
                    <Plus className="h-5 w-5 shrink-0 text-pastel-mantequilla-ink" />
                </button>
            )}

            {/* Buscando: primero las tuyas (con su título, como «En el catálogo» debajo), y si el
                filtro deja alguna fuera, se dice y se puede ver */}
            {termino && canciones.length > 0 && (
                <>
                    <TituloResultados titulo="Tus canciones" n={lista.length} />
                    {lista.length === 0 && fuera === 0 && (
                        <p className="mb-3 px-1 text-[14px] text-muted-foreground">Nada con «{termino}» en tu cancionero.</p>
                    )}
                    {fuera > 0 && (
                        <div className="mb-3 rounded-2xl bg-fill pl-4 pr-2 py-2 flex items-center gap-3">
                            <p className="flex-1 min-w-0">
                                <span className="block text-[14px] text-foreground">
                                    {verFuera
                                        ? <>Se ven también {fuera === 1 ? 'la tuya' : `las ${fuera} tuyas`} de fuera del filtro</>
                                        : <><b className="font-semibold">{fuera} {fuera === 1 ? 'tuya' : 'tuyas'}{lista.length ? ' más' : ''}</b> fuera del filtro</>}
                                </span>
                                {nombreFiltro && <span className="block truncate text-[13px] text-muted-foreground">Filtro: {nombreFiltro}</span>}
                            </p>
                            <button onClick={() => setVerFuera(v => !v)} className="pulsable h-9 px-3.5 shrink-0 rounded-full bg-foreground text-background text-[14px] font-semibold">
                                {verFuera ? 'Solo el filtro' : fuera === 1 ? 'Verla' : 'Ver todas'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* En dos columnas solo si hay varios grupos: uno solo, a lo ancho */}
            <div className={cn(grupos.length > 1 && 'lg:columns-2 lg:gap-4')}>
                {grupos.map(g => {
                    const abierta = todoAbierto || abiertos.has(g.clave);
                    const { pastel, icono } = aspectoGrupo(agrupar, g.clave === '·' ? '' : g.clave);
                    const dentro = g.canciones.filter(c => repertorio.canciones.includes(c.id) || (repertorio.extras ?? []).includes(c.id)).length;
                    return (
                        <section key={g.clave} className="mb-3 break-inside-avoid rounded-[20px] bg-fill overflow-hidden">
                            {grupos.length > 1 && (
                                <button onClick={() => alternarGrupo(g.clave)} aria-expanded={abierta}
                                    className={cn('pulsable relative w-full h-[64px] pl-4 pr-[88px] flex items-center text-left', pastel.fondo)}>
                                    <span className="min-w-0">
                                        <span className="block font-heading text-[18px] font-bold leading-tight text-foreground truncate">{g.titulo}</span>
                                        <span className={cn('block text-[13px] font-semibold', pastel.tinta)}>
                                            {g.canciones.length} {g.canciones.length === 1 ? 'canción' : 'canciones'}{dentro ? ` · ${dentro} en este repertorio` : ''}
                                        </span>
                                    </span>
                                    <img src={icono} alt="" aria-hidden className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 h-[54px] w-[54px] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                                    <ChevronDown className={cn('absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/70 transition-transform', abierta && 'rotate-180')} />
                                </button>
                            )}
                            {abierta && (
                                <div className="divide-y divide-hairline">
                                    {g.canciones.map(c => {
                                        const enEsteSet = repertorio.canciones.includes(c.id);
                                        const esExtra = !enEsteSet && (repertorio.extras ?? []).includes(c.id);
                                        return (
                                            <FilaCancion key={c.id} cancion={c} tono={tonos.get(c.id) ?? null} compacta onElegir={() => alternar(c)}
                                                derecha={
                                                    enEsteSet ? <span className="shrink-0 h-7 pl-1.5 pr-2.5 rounded-full bg-foreground text-background text-[12.5px] font-bold flex items-center gap-0.5"><Check className="h-4 w-4" />Set</span>
                                                    : esExtra ? <span className="shrink-0 h-7 pl-1.5 pr-2.5 rounded-full bg-pastel-cielo text-pastel-cielo-ink text-[12.5px] font-bold flex items-center gap-0.5"><Check className="h-4 w-4" />Extra</span>
                                                    : <span className="shrink-0 h-7 w-7 rounded-full border border-hairline-strong flex items-center justify-center text-muted-foreground" aria-label={destino === 'set' ? 'Añadir al set' : 'Añadir a extras'}><Plus className="h-4 w-4" /></span>
                                                } />
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
            {lista.length === 0 && !termino && (
                <p className="px-4 py-8 text-center text-[15px] text-muted-foreground">
                    {canciones.length ? 'Ninguna canción con estos filtros.' : 'Escribe arriba el título de una canción y añádela aquí mismo.'}
                </p>
            )}
            {termino.length >= 2 && <div className="mt-2"><ResultadosCatalogo q={termino} onElegida={meter} etiquetaElegir={destino === 'set' ? 'Al set' : 'A extras'} /></div>}

            <div className="mt-4 grid grid-cols-2 gap-2 lg:max-w-xl">
                <button onClick={() => setImportar(true)} className="pulsable h-[60px] rounded-[16px] bg-pastel-melocoton pl-1.5 pr-3 flex items-center gap-1.5 text-left">
                    <img src={ICONO.importar} alt="" aria-hidden className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                    <span className="text-[14px] font-semibold leading-tight text-foreground">Importar PDF o Word</span>
                </button>
                <Link to={`/cancionero/nueva?repertorio=${repertorio.id}`} className="pulsable h-[60px] rounded-[16px] bg-pastel-lavanda pl-1.5 pr-3 flex items-center gap-1.5">
                    <img src={ICONO.repertorios} alt="" aria-hidden className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                    <span className="text-[14px] font-semibold leading-tight text-foreground">Pegar letra y acordes</span>
                </Link>
            </div>
        </div>
    );
    const hojaImportar = <ImportarCanciones abierto={importar} onCerrar={() => setImportar(false)} repertorioId={repertorio.id} />;

    // En el ordenador, en el hueco del contenido del Cancionero: los menús siguen a la vista
    if (enSitio && menu?.hueco) {
        return createPortal(
            // Entre md y lg no hay menú del Cancionero y el hueco llega al borde: algo de aire
            <section aria-label={`Añadir canciones a ${repertorio.nombre}`} className="md:px-5 lg:px-0">
                {cabecera}
                {cuerpo}
                {hojaImportar}
            </section>,
            menu.hueco,
        );
    }
    // En el móvil, a pantalla completa. En un portal: dentro de la página, un contenedor con
    // transform lo dejaba debajo de la cabecera. Si algún día se monta fuera del Cancionero,
    // en el ordenador deja a la vista el menú de la app (md:left-64, su ancho)
    return createPortal(
        <div className="fixed inset-0 md:left-64 z-[95] bg-background flex flex-col" role="dialog" aria-modal="true" aria-label={`Añadir canciones a ${repertorio.nombre}`}>
            {cabecera}
            <div className="flex-1 overflow-y-auto overscroll-contain">{cuerpo}</div>
            {hojaImportar}
        </div>,
        document.body,
    );
}
