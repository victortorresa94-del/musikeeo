import { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ListMusic, Loader2, Pause, Play, Shrink, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { useMusicaCancion } from '../../hooks/useMusicaCancion';
import { usePantallaEncendida } from '../../hooks/usePantallaEncendida';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { BotonBarra, Paso } from '../../components/cancionero/Controles';
import { buscarEncaje, columnasPosibles, type Encaje } from '../../components/cancionero/medir';
import type { AjustesCancion, Cancion } from '../../types/cancionero';

const TAMANO_MIN = 11;
const TAMANO_MAX = 60;

// El bolo: el repertorio a pantalla completa. Se pasa de canción deslizando de lado
// (o con el pedal), se baja dentro de cada una y se hace zoom con dos dedos.
export default function TocarRepertorio() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const { repertorios, canciones, listo, nube } = useCancionero();
    const repertorio = repertorios.find(r => r.id === id);
    const lista = repertorio ? repertorio.canciones.map(c => canciones.find(x => x.id === c)).filter((c): c is Cancion => !!c) : [];

    // Lo que no está en el móvil puede llegar de la cuenta: se espera a que acabe de mirar
    if (!listo || (!lista.length && nube === 'sincronizando')) return <div className="h-[100dvh] flex items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
    if (!repertorio || !lista.length) {
        return (
            <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 bg-background px-8 text-center">
                <p className="text-[17px] font-semibold text-foreground">{repertorio ? 'Este repertorio no tiene canciones' : 'No encontramos este repertorio'}</p>
                <Link to={repertorio ? `/cancionero/repertorio/${repertorio.id}` : '/cancionero?ver=repertorios'}
                    className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center">Volver</Link>
            </div>
        );
    }
    const inicio = Math.min(lista.length - 1, Math.max(0, Number(params.get('n')) || 0));
    return <Escenario nombre={repertorio.nombre} repertorioId={repertorio.id} canciones={lista} inicio={inicio} />;
}

function Escenario({ nombre, repertorioId, canciones, inicio }: { nombre: string; repertorioId: string; canciones: Cancion[]; inicio: number }) {
    const navigate = useNavigate();
    const { guardar } = useCancionero();
    const carruselRef = useRef<HTMLDivElement>(null);
    const diapositivas = useRef<(HTMLDivElement | null)[]>([]);
    const [actual, setActual] = useState(inicio);
    const [controles, setControles] = useState(true);
    const [rodando, setRodando] = useState(false);
    const [indice, setIndice] = useState(false);
    const actualRef = useRef(inicio);
    useEffect(() => { actualRef.current = actual; }, [actual]);
    // Montadas: la que suena y sus vecinas. Las vecinas cambian cuando el carrusel se para:
    // montar una canción larga a mitad del deslizamiento se comía fotogramas y retrasaba el título
    const [cerca, setCerca] = useState(inicio);
    const quieto = useRef<ReturnType<typeof setTimeout>>(undefined);

    usePantallaEncendida();

    const cancion = canciones[actual];
    const cambiar = (c: Cancion, cambio: Partial<AjustesCancion>) => guardar({ ...c, ajustes: { ...c.ajustes, ...cambio } }, { esperar: true });

    // Empieza en la canción pedida y, al girar el móvil, se queda en la misma
    useLayoutEffect(() => {
        const el = carruselRef.current;
        if (el) el.scrollLeft = inicio * el.clientWidth;
    }, [inicio]);
    useEffect(() => {
        const f = () => { const el = carruselRef.current; if (el) el.scrollLeft = actualRef.current * el.clientWidth; };
        window.addEventListener('resize', f);
        return () => window.removeEventListener('resize', f);
    }, []);

    const alDeslizar = () => {
        const el = carruselRef.current;
        if (!el) return;
        const i = Math.round(el.scrollLeft / el.clientWidth);
        if (i !== actualRef.current && i >= 0 && i < canciones.length) { setActual(i); setRodando(false); }
        clearTimeout(quieto.current);
        quieto.current = setTimeout(() => {
            const j = Math.min(canciones.length - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)));
            startTransition(() => setCerca(j));
        }, 150);
    };

    const ir = useCallback((i: number) => {
        const el = carruselRef.current;
        if (!el || i < 0 || i >= canciones.length) return;
        const d = diapositivas.current[i];
        if (d) d.scrollTop = 0;
        // Un salto desde la lista: la de destino se monta ya, para que esté al llegar
        setCerca(c => (Math.abs(i - c) > 1 ? i : c));
        el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
        setIndice(false);
    }, [canciones.length]);

    const salir = useCallback(() => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        navigate(`/cancionero/repertorio/${repertorioId}`);
    }, [navigate, repertorioId]);

    // Desplazamiento automático de la canción que suena
    useEffect(() => {
        if (!rodando) return;
        let raf = 0, ultimo = performance.now(), resto = 0;
        const velocidad = canciones[actual]?.ajustes.velocidad ?? 18;
        const paso = (t: number) => {
            const el = diapositivas.current[actualRef.current];
            if (!el) return;
            resto += (velocidad * Math.min(100, t - ultimo)) / 1000;
            ultimo = t;
            const px = Math.floor(resto);
            if (px >= 1) { resto -= px; el.scrollTop += px; }
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) { setRodando(false); return; }
            raf = requestAnimationFrame(paso);
        };
        raf = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(raf);
    }, [rodando, actual, canciones]);

    useEffect(() => {
        if (!rodando || !controles) return;
        const t = setTimeout(() => setControles(false), 2500);
        return () => clearTimeout(t);
    }, [rodando, controles]);

    // Pedal Bluetooth y teclado: adelante baja la canción y, al final, pasa a la siguiente
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            const el = diapositivas.current[actualRef.current];
            const i = actualRef.current;
            const adelante = ['PageDown', 'ArrowRight', 'ArrowDown'].includes(e.key);
            const atras = ['PageUp', 'ArrowLeft', 'ArrowUp'].includes(e.key);
            if (e.key === ' ' && !(e.target as HTMLElement).closest('button')) { e.preventDefault(); setRodando(r => !r); }
            else if (e.key === 'Escape') salir();
            else if (adelante && el) {
                e.preventDefault();
                if (el.scrollTop + el.clientHeight < el.scrollHeight - 4) el.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' });
                else ir(i + 1);
            } else if (atras && el) {
                e.preventDefault();
                if (el.scrollTop > 4) el.scrollBy({ top: -el.clientHeight * 0.8, behavior: 'smooth' });
                else ir(i - 1);
            }
        };
        window.addEventListener('keydown', f);
        return () => window.removeEventListener('keydown', f);
    }, [ir, salir]);

    return (
        <div className="fixed inset-0 bg-background text-foreground overflow-hidden">
            <div ref={carruselRef} onScroll={alDeslizar}
                className="h-full w-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar overscroll-x-contain">
                {canciones.map((c, i) => (
                    <div key={c.id} ref={el => { diapositivas.current[i] = el; }} onClick={() => setControles(v => !v)} data-diapositiva
                        className="relative h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-contain touch-pan-x touch-pan-y">
                        {Math.abs(i - cerca) <= 1 || i === actual
                            ? <Diapositiva cancion={c} n={i + 1} total={canciones.length} siguiente={canciones[i + 1]}
                                onSiguiente={() => ir(i + 1)} cambiar={cambio => cambiar(c, cambio)} />
                            : null}
                    </div>
                ))}
            </div>

            {/* Arriba: salir, dónde estoy y la lista */}
            <div className={cn('fixed inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)] bg-chrome backdrop-blur-2xl border-b border-hairline transition-all duration-200',
                controles ? 'opacity-100' : 'opacity-0 -translate-y-2 pointer-events-none')}>
                <div className="h-12 px-2 flex items-center gap-2">
                    <button onClick={salir} aria-label="Salir" className="pulsable h-9 w-9 rounded-full flex items-center justify-center text-foreground"><X className="h-5 w-5" /></button>
                    <button onClick={() => setIndice(v => !v)} className="flex-1 min-w-0 text-center active:opacity-60">
                        <span className="block truncate text-[15px] font-semibold text-foreground">{cancion.titulo}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">{actual + 1} de {canciones.length} · {nombre}</span>
                    </button>
                    <BotonBarra etiqueta="Lista de canciones" activo={indice} onClick={() => setIndice(v => !v)}><ListMusic className="h-[18px] w-[18px]" /></BotonBarra>
                </div>
            </div>

            {/* Abajo: anterior, tono, tamaño, que quepa, desplazar y siguiente */}
            <ControlesCancion cancion={cancion} visibles={controles} rodando={rodando}
                onRodar={() => setRodando(r => !r)} cambiar={cambio => cambiar(cancion, cambio)}
                onAnterior={actual > 0 ? () => ir(actual - 1) : undefined}
                onSiguiente={actual < canciones.length - 1 ? () => ir(actual + 1) : undefined} />

            {/* Saltar a cualquier canción */}
            {indice && (
                <div className="fixed inset-0 z-20" onClick={() => setIndice(false)}>
                    <div onClick={e => e.stopPropagation()}
                        className="absolute left-2 right-2 md:left-auto md:right-4 md:w-[380px] top-[calc(env(safe-area-inset-top)+52px)] max-h-[70dvh] overflow-y-auto rounded-2xl bg-sheet border border-hairline shadow-e3 divide-y divide-hairline">
                        {canciones.map((c, i) => (
                            <button key={c.id} onClick={() => ir(i)}
                                className={cn('w-full h-12 px-4 flex items-center gap-3 text-left active:bg-fill', i === actual && 'bg-fill')}>
                                <span className="w-6 text-[13px] font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                                <span className="flex-1 truncate text-[15px] text-foreground">{c.titulo}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ControlesCancion({ cancion, visibles, rodando, onRodar, cambiar, onAnterior, onSiguiente }: {
    cancion: Cancion; visibles: boolean; rodando: boolean; onRodar: () => void;
    cambiar: (c: Partial<AjustesCancion>) => void; onAnterior?: () => void; onSiguiente?: () => void;
}) {
    const { tonoSuena, sinAcordes } = useMusicaCancion(cancion.texto, cancion.ajustes);
    const a = cancion.ajustes;
    const cambiarTono = (d: number) => { const s = a.semitonos + d; cambiar({ semitonos: Math.abs(s) >= 12 ? 0 : s }); };
    const cambiarTamano = (d: number) => cambiar({ tamano: Math.min(TAMANO_MAX, Math.max(TAMANO_MIN, Math.round(a.tamano) + d)), ajustar: false });
    const flecha = 'pulsable h-9 w-9 shrink-0 rounded-full bg-fill flex items-center justify-center text-foreground disabled:opacity-25';
    return (
        <div className={cn('fixed inset-x-0 bottom-0 z-10 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 px-2 bg-chrome backdrop-blur-2xl border-t border-hairline transition-all duration-200',
            visibles ? 'opacity-100' : 'opacity-0 translate-y-2 pointer-events-none')}>
            <div className="flex items-center justify-center gap-1.5 overflow-x-auto hide-scrollbar">
                <button onClick={onAnterior} disabled={!onAnterior} aria-label="Canción anterior" className={flecha}><ChevronLeft className="h-5 w-5" /></button>
                <Paso compacto etiqueta="Tono" onMenos={() => cambiarTono(-1)} onMas={() => cambiarTono(1)} menosDesactivado={sinAcordes} masDesactivado={sinAcordes}
                    valor={<span>{tonoSuena || 'Tono'}{a.semitonos !== 0 && <span className="ml-1 text-[12px] text-muted-foreground">{a.semitonos > 0 ? '+' : ''}{a.semitonos}</span>}</span>} />
                <Paso compacto etiqueta="Tamaño de la letra" valor="Aa" onMenos={() => cambiarTamano(-1)} onMas={() => cambiarTamano(1)} />
                <BotonBarra etiqueta="Que quepa en la pantalla" activo={a.ajustar} onClick={() => cambiar({ ajustar: !a.ajustar })}><Shrink className="h-[18px] w-[18px]" /></BotonBarra>
                <BotonBarra etiqueta={rodando ? 'Parar' : 'Desplazar sola'} activo={rodando} onClick={onRodar}>
                    {rodando ? <Pause className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px]" />}
                </BotonBarra>
                <button onClick={onSiguiente} disabled={!onSiguiente} aria-label="Canción siguiente" className={flecha}><ChevronRight className="h-5 w-5" /></button>
            </div>
        </div>
    );
}

// Una canción del repertorio. Se mide sola para «que quepa» y se agranda con dos dedos.
function Diapositiva({ cancion, n, total, siguiente, onSiguiente, cambiar }: {
    cancion: Cancion; n: number; total: number; siguiente?: Cancion; onSiguiente: () => void;
    cambiar: (c: Partial<AjustesCancion>) => void;
}) {
    const a = cancion.ajustes;
    const { leida, opciones, tonoSuena } = useMusicaCancion(cancion.texto, a);
    const zonaRef = useRef<HTMLDivElement>(null);
    const medidorRef = useRef<HTMLDivElement>(null);
    const [encaje, setEncaje] = useState<Encaje | null>(null);
    const [medida, setMedida] = useState(0);
    const [pellizco, setPellizco] = useState<number | null>(null);
    const gesto = useRef<{ d0: number; base: number; ultimo: number | null; fotograma: number } | null>(null);

    useEffect(() => {
        const f = () => setMedida(m => m + 1);
        window.addEventListener('resize', f);
        return () => window.removeEventListener('resize', f);
    }, []);

    useLayoutEffect(() => {
        if (!a.ajustar) return;
        const zona = zonaRef.current, hoja = medidorRef.current;
        const caja = zona?.closest<HTMLElement>('[data-diapositiva]');
        if (!caja || !zona || !hoja) return;
        // Arriba y abajo quedan las barras de controles (se esconden, pero mejor que no tapen)
        const alto = caja.clientHeight - zona.offsetTop - 84;
        if (alto < 120) return;
        const e = buscarEncaje(hoja, zona.clientWidth, alto, columnasPosibles(zona.clientWidth), TAMANO_MAX);
        setEncaje(x => (x && x.tamano === e.tamano && x.columnas === e.columnas && x.cabe === e.cabe ? x : e));
    }, [a.ajustar, a.vista, opciones, leida, medida]);

    const ajustada = a.ajustar && encaje?.cabe;
    const tamanoBase = ajustada ? encaje!.tamano : a.tamano;
    const tamano = pellizco ?? tamanoBase;
    const columnas = ajustada ? encaje!.columnas : a.columnas;

    // Zoom con dos dedos: cambia el tamaño de la letra (no la página), y se guarda.
    // Como mucho un tamaño nuevo por fotograma: cada uno vuelve a colocar toda la letra
    const distancia = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const alEmpezar = (e: React.TouchEvent) => {
        if (e.touches.length === 2) gesto.current = { d0: distancia(e.touches), base: tamanoBase, ultimo: null, fotograma: 0 };
    };
    const alMover = (e: React.TouchEvent) => {
        const g = gesto.current;
        if (!g || e.touches.length !== 2) return;
        const t = g.base * (distancia(e.touches) / g.d0);
        g.ultimo = Math.min(TAMANO_MAX, Math.max(TAMANO_MIN, Math.round(t * 2) / 2));
        if (!g.fotograma) g.fotograma = requestAnimationFrame(() => { g.fotograma = 0; setPellizco(g.ultimo); });
    };
    const alSoltar = () => {
        const g = gesto.current;
        if (!g) return;
        gesto.current = null;
        cancelAnimationFrame(g.fotograma);
        const final = g.ultimo ?? pellizco;
        if (final !== null && Math.abs(final - tamanoBase) >= 0.5) cambiar({ tamano: Math.round(final), ajustar: false, columnas: Math.min(3, columnas) as 1 | 2 | 3 });
        setPellizco(null);
    };

    return (
        <div onTouchStart={alEmpezar} onTouchMove={alMover} onTouchEnd={alSoltar} onTouchCancel={alSoltar}
            className="min-h-full px-5 md:px-10 pt-[calc(env(safe-area-inset-top)+60px)] pb-[calc(env(safe-area-inset-bottom)+80px)]">
            <p className="text-[13px] font-semibold text-muted-foreground truncate">
                {n} de {total}{tonoSuena && <> · {tonoSuena}</>}{a.cejilla > 0 && <> · Cejilla {a.cejilla}</>}
            </p>
            <h2 className="text-[22px] font-bold leading-tight text-foreground">{cancion.titulo}</h2>
            <div ref={zonaRef} className="mt-2">
                <HojaCancion lineas={leida.lineas} opciones={opciones} vista={a.vista} tamano={tamano} columnas={columnas} />
            </div>
            {/* Copia invisible para medir, solo con «que quepa»: el tamaño y las columnas los pone buscarEncaje */}
            {a.ajustar && (
                <div className="fixed left-0 top-0 h-0 w-0 overflow-hidden invisible" aria-hidden>
                    <HojaCancion ref={medidorRef} lineas={leida.lineas} opciones={opciones} vista={a.vista} tamano={TAMANO_MAX} columnas={1} />
                </div>
            )}
            {siguiente && (
                <button onClick={e => { e.stopPropagation(); onSiguiente(); }}
                    className="pulsable mt-6 w-full h-14 rounded-2xl bg-fill px-4 flex items-center gap-3 text-left">
                    <span className="flex-1 min-w-0">
                        <span className="block text-[12px] text-muted-foreground">Siguiente</span>
                        <span className="block truncate text-[16px] font-semibold text-foreground">{siguiente.titulo}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}
