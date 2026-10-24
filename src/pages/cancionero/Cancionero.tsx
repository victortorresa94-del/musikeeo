import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Cloud, FileDown, ListMusic, Loader2, Plus, Search, Smartphone, X } from 'lucide-react';
import { useCancionero } from '../../hooks/useCancionero';
import { CANCION_EJEMPLO } from '../../components/cancionero/ejemplo';
import { Segmentado } from '../../components/cancionero/Controles';
import { ImportarCanciones } from '../../components/cancionero/ImportarCanciones';
import { norm, tonoDe } from '../../components/cancionero/utilidades';

const fechaCorta = (f: string) => {
    const [a, m, d] = f.split('-').map(Number);
    return a ? new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
};

// Tu cancionero: lo que pegas de cualquier web de acordes, limpio y a tu manera, y los
// repertorios para tocarlo en el bolo
export default function Cancionero() {
    const { canciones, repertorios, listo, nube, conCuenta, crear, crearRepertorio } = useCancionero();
    const navigate = useNavigate();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const ver = params.get('ver') === 'repertorios' ? 'repertorios' : 'canciones';
    const [q, setQ] = useState('');
    const [importar, setImportar] = useState(false);

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
        return t ? canciones.filter(c => norm(`${c.titulo} ${c.artista}`).includes(t)) : canciones;
    }, [canciones, q]);
    const reps = useMemo(() => [...repertorios].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.actualizadaEn.localeCompare(a.actualizadaEn)), [repertorios]);

    const cambiarVer = (v: 'canciones' | 'repertorios') => {
        const p = new URLSearchParams(params);
        if (v === 'repertorios') p.set('ver', v); else p.delete('ver');
        setParams(p, { replace: true });
    };
    const probarEjemplo = () => navigate(`/cancionero/${crear(CANCION_EJEMPLO).id}`);
    const nuevoRepertorio = () => {
        const r = crearRepertorio(`Bolo ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`);
        navigate(`/cancionero/repertorio/${r.id}`);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-0 pt-3 md:pt-6 pb-16">
            <div className="flex items-center justify-between gap-3">
                <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground">Cancionero</h1>
                {listo && (ver === 'repertorios' ? (
                    <button onClick={nuevoRepertorio} className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Nuevo
                    </button>
                ) : canciones.length > 0 && (
                    <Link to="/cancionero/nueva" className="pulsable h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Añadir
                    </Link>
                ))}
            </div>
            <p className="mt-1 text-[15px] text-muted-foreground">Letras y acordes sin anuncios, en tu tono y del tamaño que quieras.</p>

            <div className="mt-4">
                <Segmentado etiqueta="Ver" valor={ver} onCambio={cambiarVer}
                    opciones={[['canciones', `Canciones${canciones.length ? ` · ${canciones.length}` : ''}`], ['repertorios', `Repertorios${repertorios.length ? ` · ${repertorios.length}` : ''}`]] as const} />
            </div>

            {!listo ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
            ) : ver === 'repertorios' ? (
                reps.length === 0 ? (
                    <div className="mt-4 rounded-[22px] bg-fill p-5 md:p-7">
                        <ListMusic className="h-9 w-9 text-foreground" strokeWidth={1.6} />
                        <p className="mt-3 font-heading text-[20px] font-bold leading-snug text-foreground">El repertorio del bolo, en orden</p>
                        <p className="mt-2 text-[15px] text-muted-foreground">
                            Ordena las canciones, pulsa «Tocar» y pasa de una a otra deslizando de lado o con el pedal. Cada una sale en su tono y su tamaño, y funciona sin cobertura.
                        </p>
                        <button onClick={nuevoRepertorio} className="pulsable mt-5 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-1.5">
                            <Plus className="h-5 w-5" /> Nuevo repertorio
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        {reps.map(r => {
                            const n = r.canciones.filter(id => canciones.some(c => c.id === id)).length;
                            return (
                                <Link key={r.id} to={`/cancionero/repertorio/${r.id}`} className="flex items-center gap-3 px-4 min-h-[60px] py-2.5 active:bg-fill">
                                    <span className="flex-1 min-w-0">
                                        <span className="block truncate text-[16px] font-semibold text-foreground">{r.nombre}</span>
                                        <span className="block truncate text-[14px] text-muted-foreground">{fechaCorta(r.fecha)} · {n} {n === 1 ? 'canción' : 'canciones'}</span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </Link>
                            );
                        })}
                    </div>
                )
            ) : canciones.length === 0 ? (
                <div className="mt-4 rounded-[22px] bg-fill p-5 md:p-7">
                    <ListMusic className="h-9 w-9 text-foreground" strokeWidth={1.6} />
                    <p className="mt-3 font-heading text-[20px] font-bold leading-snug text-foreground">Tus canciones, limpias y a tu manera</p>
                    <ol className="mt-3 space-y-2 text-[15px] text-muted-foreground">
                        <li><b className="font-semibold text-foreground">1.</b> Busca la canción en tu web de acordes, cópiala y pégala aquí.</li>
                        <li><b className="font-semibold text-foreground">2.</b> Cambia el tono, pon la cejilla y elige el tamaño de la letra.</li>
                        <li><b className="font-semibold text-foreground">3.</b> Haz el repertorio del bolo y pasa de canción deslizando.</li>
                    </ol>
                    <Link to="/cancionero/nueva" className="pulsable mt-5 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-1.5">
                        <Plus className="h-5 w-5" /> Añadir una canción
                    </Link>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button onClick={() => setImportar(true)} className="h-11 rounded-[14px] text-[15px] font-semibold text-foreground active:opacity-60">Importar varias</button>
                        <button onClick={probarEjemplo} className="h-11 rounded-[14px] text-[15px] font-semibold text-foreground active:opacity-60">Ver un ejemplo</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="mt-4 flex items-center gap-2">
                        <label className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar canción o artista" aria-label="Buscar en el cancionero"
                                className="w-full h-11 rounded-2xl bg-fill pl-12 pr-10 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                            {q && (
                                <button onClick={() => setQ('')} aria-label="Borrar" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </label>
                        <button onClick={() => setImportar(true)} aria-label="Importar varias canciones" title="Importar varias canciones"
                            className="pulsable h-11 w-11 shrink-0 rounded-2xl bg-fill flex items-center justify-center text-foreground">
                            <FileDown className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        {lista.map(c => (
                            <Link key={c.id} to={`/cancionero/${c.id}`} className="flex items-center gap-3 px-4 min-h-[60px] py-2.5 active:bg-fill">
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
                        {lista.length === 0 && <p className="px-4 py-6 text-center text-[15px] text-muted-foreground">Nada con «{q}».</p>}
                    </div>
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
