import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, GripVertical, Loader2, Play, Plus, Search, Trash2, X } from 'lucide-react';
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
import { duracionDe, filtrar, mismoTitulo, mismoTonoSeguido, reparto, textoDuracion, tonoMostrado } from '../../lib/biblioteca';
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
    const temas = ids.map(id => porId.get(id)!);
    // Lo que dura: lo que se sabe de cada canción y, de las demás, una media (≈)
    const { segundos, estimada } = duracionDe(temas.filter(c => bloqueDe(c) === null || !/banquillo|bis/i.test(bloqueDe(c) ?? '')));
    const duracion = ids.length ? `${estimada ? '≈ ' : ''}${textoDuracion(segundos)}` : '';
    // El tono de cada tema (el de la ficha, o el de sus acordes) y dónde se repite seguido
    const tonos = temas.map(c => tonoMostrado(c, tonoDe(c)));
    const repetidos = mismoTonoSeguido(tonos);
    const voces = reparto(temas);

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
                <span>· {ids.length} {ids.length === 1 ? 'tema' : 'temas'}{duracion && ` · ${duracion}`}</span>
            </div>
            {/* Quién canta cuántas: para repartir la voz */}
            {voces.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {voces.map(v => {
                        const p = pastelCanta(v.valor);
                        return (
                            <span key={v.valor} className={cn('h-7 pl-1 pr-2.5 rounded-full flex items-center gap-1 text-[13px] font-semibold', p.fondo, p.tinta)}>
                                <img src={ICONO.canciones} alt="" aria-hidden className="h-6 w-6 object-contain" />{v.valor} · {v.n}
                            </span>
                        );
                    })}
                </div>
            )}

            <button onClick={() => tocar()} disabled={!ids.length}
                className="pulsable mt-5 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40">
                <Play className="h-5 w-5 fill-current" /> Tocar el repertorio
            </button>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">Desliza de lado para pasar de canción. Toca un número para empezar desde ese tema.</p>

            {ids.length > 0 ? (
                <Reorder.Group axis="y" values={ids} onReorder={orden => guardarRepertorio({ ...repertorio, canciones: orden }, { esperar: true })}
                    className="mt-6">
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

            <ElegirCanciones abierto={anadir} onCerrar={() => setAnadir(false)} canciones={canciones}
                elegidas={repertorio.canciones} onAlternar={alternar} repertorio={repertorio} />
        </div>
    );
}

function Fila({ id, n, cancion, tono, bloque, mismoTono, onQuitar, onTocar }: {
    id: string; n: number; cancion: Cancion; tono: string | null; bloque: string | null; mismoTono?: boolean; onQuitar: () => void; onTocar: () => void;
}) {
    const arrastre = useDragControls();
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
                    {cancion.artista && <span className="block truncate text-[13px] text-muted-foreground">{cancion.artista}</span>}
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
            {tono && (
                <span title={mismoTono ? 'Mismo tono que el tema de antes' : undefined}
                    className={cn('shrink-0 min-w-[36px] h-7 px-2.5 rounded-full text-[13px] font-bold flex items-center justify-center',
                        mismoTono ? cn(PASTEL.melocoton.fondo, PASTEL.melocoton.tinta) : 'bg-fill-strong text-foreground')}>{tono}</span>
            )}
            <button onClick={onQuitar} aria-label={`Quitar ${cancion.titulo}`} className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill">
                <X className="h-4 w-4" />
            </button>
            </div>
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
        const l = t ? base.filter(c => norm(`${c.titulo} ${c.artista} ${c.ficha?.canta ?? ''} ${c.ficha?.estilo ?? ''}`).includes(t) || norm(tonos.get(c.id) ?? '') === t) : base;
        return [...l].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
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
