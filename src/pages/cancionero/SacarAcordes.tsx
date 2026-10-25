import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { compasesDe, hojaDeAcordes, nombreTonoEscuchado, type CompasEscuchado, type ResultadoEscucha } from '../../lib/escuchar';
import { descodificar, DURACION_MAX, ErrorDeAudio, escucharAparte } from '../../lib/sacarAcordes';
import { datosDeArchivo } from '../../lib/documentos';
import { unirConFicha } from '../../lib/acordes';
import { duracionTexto } from '../../lib/buscarCanciones';
import { ICONO, PASTEL } from '../../components/cancionero/estilo';
import { Pildora } from '../../components/cancionero/Baldosas';

type Fase =
    | { tipo: 'elegir' }
    | { tipo: 'escuchando'; nombre: string; progreso: number | null }
    | { tipo: 'listo'; resultado: ResultadoEscucha; url: string };

// Sacar los acordes de una grabación: el móvil la escucha (no se sube a ningún sitio) y salen
// los acordes por compases, el tono y el tempo. Con ?cancion=<id>, entran en esa ficha
export default function SacarAcordes() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { canciones, repertorios, nuevaCancion, guardar, guardarRepertorio } = useCancionero();
    const destino = canciones.find(c => c.id === params.get('cancion'));
    // Desde «Nueva canción» de un repertorio: la canción entra en él y se vuelve allí
    const repertorio = repertorios.find(r => r.id === params.get('repertorio'));
    const [fase, setFase] = useState<Fase>({ tipo: 'elegir' });
    const [titulo, setTitulo] = useState('');
    const [artista, setArtista] = useState('');
    const archivoRef = useRef<HTMLInputElement>(null);
    const cancelarRef = useRef<() => void>(() => {});

    // Al salir se para el análisis; el audio se suelta al cambiar de resultado o al salir
    useEffect(() => () => cancelarRef.current(), []);
    const url = fase.tipo === 'listo' ? fase.url : null;
    useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

    const abrir = async (archivo?: File) => {
        if (!archivo) return;
        setFase({ tipo: 'escuchando', nombre: archivo.name, progreso: null });
        try {
            const { muestras, sr } = await descodificar(archivo);
            const trabajo = escucharAparte(muestras, sr, p => setFase(f => (f.tipo === 'escuchando' ? { ...f, progreso: p } : f)));
            cancelarRef.current = trabajo.cancelar;
            const resultado = await trabajo.resultado;
            cancelarRef.current = () => {};
            // En la música es «Artista - Título» (en los documentos, al revés)
            const d = datosDeArchivo(archivo.name);
            setTitulo(t => t || (d.artista || d.titulo));
            setArtista(a => a || (d.artista ? d.titulo : ''));
            setFase({ tipo: 'listo', resultado, url: URL.createObjectURL(archivo) });
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') return;
            toast.error(e instanceof ErrorDeAudio ? e.message : 'No se ha podido escuchar el audio.');
            setFase({ tipo: 'elegir' });
        }
    };
    const cancelar = () => { cancelarRef.current(); cancelarRef.current = () => {}; setFase({ tipo: 'elegir' }); };

    const guardarCancion = () => {
        if (fase.tipo !== 'listo') return;
        const r = fase.resultado, hoja = hojaDeAcordes(r), duracion = Math.round(r.duracion);
        if (destino) {
            // En la ficha: se queda su cabecera y se lleva al tono del setlist
            const u = unirConFicha(destino.texto, hoja, destino.ajustes.semitonos);
            const semitonos = u ? (Math.abs(u.semitonos) >= 12 ? u.semitonos % 12 : u.semitonos) : destino.ajustes.semitonos;
            guardar({ ...destino, texto: u?.texto ?? hoja, ajustes: { ...destino.ajustes, semitonos, ajustar: false }, bpm: r.bpm, duracion: destino.duracion ?? duracion });
            navigate(`/cancionero/${destino.id}`, { replace: true });
        } else {
            const c = nuevaCancion({ titulo: titulo.trim() || 'Sin título', artista: artista.trim(), texto: hoja });
            guardar({ ...c, bpm: r.bpm, duracion });
            if (repertorio) {
                guardarRepertorio({ ...repertorio, canciones: [...repertorio.canciones, c.id] });
                navigate(`/cancionero/repertorio/${repertorio.id}`, { replace: true });
            } else {
                navigate(`/cancionero/${c.id}`, { replace: true });
            }
        }
        toast.success(repertorio && !destino ? `Añadida a «${repertorio.nombre}». Es un borrador: revisa los acordes tocando.` : 'Guardada. Es un borrador: revisa los acordes tocando.');
    };

    const volver = destino ? `/cancionero/${destino.id}` : repertorio ? `/cancionero/repertorio/${repertorio.id}` : '/cancionero';
    return (
        <div className="max-w-3xl mx-auto px-4 md:px-0 pt-3 md:pt-6 pb-36 md:pb-16">
            <div className="flex items-center justify-between gap-3">
                <Link to={volver} className="inline-flex items-center -ml-1.5 text-[15px] text-muted-foreground active:opacity-60">
                    <ChevronLeft className="h-5 w-5" /> {destino ? destino.titulo : repertorio ? repertorio.nombre : 'Cancionero'}
                </Link>
                {fase.tipo === 'listo' && (
                    <button onClick={() => archivoRef.current?.click()} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground">
                        Otro audio
                    </button>
                )}
            </div>
            <h1 className="mt-1 font-heading text-[28px] font-bold leading-tight text-foreground">Sacar acordes</h1>
            <p className="mt-0.5 text-[15px] text-muted-foreground">
                {destino ? <>Para «{destino.titulo}»: entran en su ficha, en su tono.</> : 'De cualquier grabación: un mp3, una nota de voz del ensayo, un directo…'}
            </p>

            <input ref={archivoRef} type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac" className="hidden"
                onChange={e => { void abrir(e.target.files?.[0]); e.target.value = ''; }} />

            {fase.tipo === 'elegir' && (
                <>
                    <div className={cn('mt-5 rounded-[22px] p-5 flex flex-col items-center text-center', PASTEL.menta.fondo)}>
                        <img src={ICONO.escuchar} alt="" draggable={false} className="h-28 w-28 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]" />
                        <p className="mt-2 text-[17px] font-bold text-foreground">Tu móvil la escucha y te dice los acordes</p>
                        <p className="mt-1 text-[14px] text-muted-foreground">También el tono y el tempo. El audio no sale del móvil.</p>
                        <button onClick={() => archivoRef.current?.click()}
                            className="pulsable mt-4 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px]">
                            Elegir audio
                        </button>
                        <p className="mt-2 text-[12px] text-muted-foreground">MP3, M4A o WAV · hasta {DURACION_MAX / 60} minutos</p>
                    </div>
                    <p className="mt-4 px-1 text-[13px] text-muted-foreground">
                        Es un borrador, como en Chordify: en nuestras pruebas acierta unos tres de cada cuatro acordes (más con el grupo entero que con una guitarra sola) y falla más en los cambios rápidos. Revísalo tocando con la grabación.
                    </p>
                </>
            )}

            {fase.tipo === 'escuchando' && (
                <div className="mt-5 rounded-[22px] bg-fill p-5">
                    <p className="truncate text-[15px] font-semibold text-foreground">{fase.nombre}</p>
                    <p className="mt-0.5 text-[14px] text-muted-foreground">
                        {fase.progreso === null ? 'Leyendo el audio…' : `Escuchando… ${Math.round(fase.progreso * 100)} %`}
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-fill-strong overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((fase.progreso ?? 0) * 100)}>
                        <div className="h-full rounded-full bg-foreground transition-[width] duration-200" style={{ width: `${Math.round((fase.progreso ?? 0.02) * 100)}%` }} />
                    </div>
                    <button onClick={cancelar} className="pulsable mt-4 h-9 px-3.5 rounded-full bg-sheet text-[14px] font-semibold text-foreground shadow-e1">Cancelar</button>
                </div>
            )}

            {fase.tipo === 'listo' && (
                <>
                    {!destino && (
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                            <input value={titulo} onChange={e => setTitulo(e.target.value.slice(0, 120))} placeholder="Título" aria-label="Título"
                                className="h-12 rounded-2xl bg-fill px-4 text-[16px] font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                            <input value={artista} onChange={e => setArtista(e.target.value.slice(0, 120))} placeholder="Artista (opcional)" aria-label="Artista"
                                className="h-12 rounded-2xl bg-fill px-4 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                        </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <Pildora texto={`Tono ${nombreTonoEscuchado(fase.resultado.tono)}`} pastel={PASTEL.mantequilla} />
                        <Pildora texto={`${fase.resultado.bpm} bpm`} pastel={null} />
                        <Pildora texto={`${fase.resultado.compas}/4`} pastel={null} />
                        <Pildora texto={duracionTexto(fase.resultado.duracion)} pastel={null} />
                    </div>
                    <Reproductor url={fase.url} resultado={fase.resultado} />

                    {/* Ordenador: al final. Móvil: fija encima de la barra de navegación */}
                    <button onClick={guardarCancion}
                        className="hidden md:block pulsable mt-5 px-10 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px]">
                        {destino ? 'Ponerlos en la ficha' : 'Guardar en el cancionero'}
                    </button>
                    {createPortal(
                        <div className="md:hidden fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-[45] px-4 py-3 bg-chrome backdrop-blur-2xl border-t border-hairline">
                            <button onClick={guardarCancion} className="pulsable w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px]">
                                {destino ? 'Ponerlos en la ficha' : 'Guardar en el cancionero'}
                            </button>
                        </div>,
                        document.body,
                    )}
                </>
            )}
        </div>
    );
}

// La grabación con sus compases debajo: el que suena se ilumina y, al tocar uno, salta ahí
function Reproductor({ url, resultado }: { url: string; resultado: ResultadoEscucha }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const celdas = useRef<(HTMLButtonElement | null)[]>([]);
    const compases = useMemo(() => compasesDe(resultado), [resultado]);
    const [sonando, setSonando] = useState(false);
    const [actual, setActual] = useState(-1);
    const [segundo, setSegundo] = useState(0);

    // Mientras suena, en cada fotograma: qué compás es (solo se repinta cuando cambia)
    useEffect(() => {
        if (!sonando) return;
        let f = 0;
        const paso = () => {
            const t = audioRef.current?.currentTime ?? 0;
            setSegundo(Math.floor(t));
            setActual(compasEn(compases, t));
            f = requestAnimationFrame(paso);
        };
        f = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(f);
    }, [sonando, compases]);
    useEffect(() => {
        if (sonando && actual >= 0) celdas.current[actual]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, [actual, sonando]);

    const ir = (i: number) => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = compases[i].inicio;
        setActual(i);
        setSegundo(Math.floor(compases[i].inicio));
        if (a.paused) void a.play();
    };
    const alternar = () => { const a = audioRef.current; if (a) { if (a.paused) void a.play(); else a.pause(); } };

    // Se repinta al cambiar de compás o de segundo: un puñado de botones, nada más
    const cuadricula = (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
            {compases.map((c, i) => (
                <button key={i} ref={el => { celdas.current[i] = el; }} onClick={() => ir(i)}
                    aria-label={`Compás ${i + 1}: ${c.acordes.join(', ')}`}
                    className={cn('relative h-14 rounded-xl px-1 flex items-center justify-center gap-1.5 font-bold transition-colors',
                        c.acordes.length > 1 ? 'text-[14px]' : 'text-[17px]',
                        i === actual ? cn(PASTEL.mantequilla.fondo, PASTEL.mantequilla.tinta) : 'bg-fill text-foreground')}>
                    {i % 4 === 0 && <span className="absolute left-1.5 top-1 text-[10px] font-semibold text-muted-foreground tabular-nums">{i + 1}</span>}
                    {c.acordes.map((a, k) => <span key={k} className={cn(a === 'N.C.' && 'text-[12px] font-semibold text-muted-foreground')}>{a}</span>)}
                </button>
            ))}
        </div>
    );

    return (
        <>
            <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] md:top-14 z-20 -mx-4 md:mx-0 mt-4 px-4 md:px-0 py-2 bg-chrome backdrop-blur-2xl border-b border-hairline flex items-center gap-3">
                <button onClick={alternar} aria-label={sonando ? 'Pausar' : 'Escuchar'}
                    className="pulsable h-11 w-11 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center">
                    {sonando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
                <input type="range" min={0} max={Math.floor(resultado.duracion)} value={segundo} aria-label="Ir a"
                    onChange={e => { const a = audioRef.current; if (a) { a.currentTime = +e.target.value; setSegundo(+e.target.value); setActual(compasEn(compases, +e.target.value)); } }}
                    className="flex-1 accent-foreground" />
                <span className="shrink-0 text-[13px] font-semibold text-muted-foreground tabular-nums">{duracionTexto(segundo) || '0:00'} / {duracionTexto(resultado.duracion)}</span>
                <audio ref={audioRef} src={url} preload="auto" onPlay={() => setSonando(true)} onPause={() => setSonando(false)} onEnded={() => setSonando(false)} />
            </div>
            {cuadricula}
        </>
    );
}

// El compás que suena en el segundo t (búsqueda binaria: se mira en cada fotograma)
function compasEn(compases: CompasEscuchado[], t: number): number {
    let a = 0, b = compases.length - 1;
    if (b < 0 || t < compases[0].inicio) return -1;
    while (a < b) {
        const m = (a + b + 1) >> 1;
        if (compases[m].inicio <= t) a = m; else b = m - 1;
    }
    return t < compases[a].fin ? a : -1;
}
