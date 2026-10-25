import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Cloud, Loader2, Plus, Search, Smartphone, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { CANCION_EJEMPLO } from '../../components/cancionero/ejemplo';
import { Baldosa, TarjetaBolo, TarjetaEscuchar } from '../../components/cancionero/Baldosas';
import { ICONO, PASTEL, iconoRepertorio, pastelDe } from '../../components/cancionero/estilo';
import { ImportarCanciones } from '../../components/cancionero/ImportarCanciones';
import { Portada } from '../../components/cancionero/Portada';
import { PonerPortadas } from '../../components/cancionero/PonerPortadas';
import { ResultadosCatalogo } from '../../components/cancionero/ResultadosCatalogo';
import { norm, pedirPantallaCompleta, tonoDe } from '../../components/cancionero/utilidades';
import type { Cancion } from '../../types/cancionero';

const fechaCorta = (f: string) => {
    const [a, m, d] = f.split('-').map(Number);
    return a ? new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
};

// Tu cancionero: lo que pegas de cualquier web de acordes, limpio y a tu manera, y los
// repertorios para tocarlo en el bolo. Un solo buscador: tus canciones y, debajo, las del
// catálogo (con portada y muestra) para añadirlas
export default function Cancionero() {
    const { canciones, repertorios, listo, nube, conCuenta, crear, crearRepertorio } = useCancionero();
    const navigate = useNavigate();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const ver = params.get('ver') === 'repertorios' ? 'repertorios' : 'canciones';
    const [q, setQ] = useState('');
    const [importar, setImportar] = useState(false);
    const buscadorRef = useRef<HTMLInputElement>(null);

    // Para el bolo sin cobertura: se bajan ya las pantallas de leer y tocar
    useEffect(() => {
        void import('./LeerCancion');
        void import('./EditarCancion');
        void import('./Repertorio');
        void import('./TocarRepertorio');
    }, []);

    const tonos = useMemo(() => new Map(canciones.map(c => [c.id, tonoDe(c)])), [canciones]);
    const lista = useMemo(() => {
        const t = norm(q.trim());
        return t ? canciones.filter(c => norm(`${c.titulo} ${c.artista}`).includes(t) || norm(tonos.get(c.id) ?? '') === t) : canciones;
    }, [canciones, q, tonos]);
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
                <Link key={c.id} to={`/cancionero/${c.id}`} className="flex items-center gap-3 px-4 min-h-[64px] py-2.5 active:bg-fill">
                    <Portada src={c.portada} titulo={c.titulo} />
                    <span className="flex-1 min-w-0">
                        <span className="block truncate text-[16px] font-semibold text-foreground">{c.titulo}</span>
                        {c.artista && <span className="block truncate text-[14px] text-muted-foreground">{c.artista}</span>}
                    </span>
                    {tonos.get(c.id) && (
                        <span className="shrink-0 h-7 px-2.5 rounded-full bg-fill-strong text-[13px] font-semibold text-foreground flex items-center">
                            {tonos.get(c.id)}
                        </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
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
        <div className="max-w-3xl mx-auto px-4 md:px-0 pt-3 md:pt-6 pb-16">
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
                        <h2 className="font-heading text-[20px] font-bold text-foreground">
                            {ver === 'repertorios' ? 'Repertorios' : 'Tus canciones'}
                            <span className="ml-1.5 text-[15px] font-semibold text-muted-foreground">{ver === 'repertorios' ? reps.length || '' : canciones.length || ''}</span>
                        </h2>
                        {ver === 'repertorios' ? (
                            <button onClick={nuevoRepertorio} className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Nuevo
                            </button>
                        ) : canciones.length > 0 && (
                            <Link to="/cancionero/nueva" className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Añadir
                            </Link>
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
                            <PonerPortadas className="mb-3" />
                            {filas(lista)}
                        </>
                    )}
                </>
            )}

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

            <ImportarCanciones abierto={importar} onCerrar={() => setImportar(false)} />
        </div>
    );
}
