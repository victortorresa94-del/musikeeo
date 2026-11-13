import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronDown, ChevronLeft, ChevronRight, ListMusic, Loader2, MoreHorizontal, Pause, Pencil, Play, ScrollText, Shrink, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { useMusicaCancion } from '../../hooks/useMusicaCancion';
import { usePantallaEncendida } from '../../hooks/usePantallaEncendida';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { NotasRicas } from '../../components/notas/NotasRicas';
import { notasVacias } from '../../lib/notas';
import { BotonBarra, Paso } from '../../components/cancionero/Controles';
import { BotonClaqueta, DameElTono } from '../../components/cancionero/Cantante';
import { Portada } from '../../components/cancionero/Portada';
import { BotonHoja, Hoja } from '../../components/cancionero/Hoja';
import { EditarEnSitio } from '../../components/cancionero/EditarEnSitio';
import { Pildora } from '../../components/cancionero/Baldosas';
import { bloqueDe, estiloBloque, etiquetasDe, ICONO, pastelCanta, sinLoDeLasPildoras } from '../../components/cancionero/estilo';
import { tonoDe } from '../../components/cancionero/utilidades';
import { esperaDeIntro, minutos, RITMO_MAX, RITMO_MIN, segundosAuto, velocidadAlDesplazar, versosDe } from '../../lib/cantar';
import { aLaGuia, marcar, vecina } from '../../lib/teleprompter';
import { buscarEncaje, columnasPosibles, topeQueQuepa, type Encaje } from '../../components/cancionero/medir';
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
    // Modo auto: la hoja de cada canción baja sola a su ritmo (duración o tempo). Se recuerda en el móvil
    const [auto, setAuto] = useState(() => { try { return localStorage.getItem(CLAVE_AUTO) === '1'; } catch { return false; } });
    const alternarAuto = () => setAuto(a => {
        try { localStorage.setItem(CLAVE_AUTO, a ? '0' : '1'); } catch { /* sin almacenamiento */ }
        toast(a ? 'Modo auto apagado: «Bajar sola» va a velocidad fija' : 'Modo auto: el botón amarillo baja la hoja al ritmo de cada canción', { id: 'auto', duration: 2500 });
        return !a;
    });
    // Línea a línea (teleprompter): la línea que toca, en negrita; se corrige tocándola o con el pedal
    const [linea, setLinea] = useState(() => { try { return localStorage.getItem(CLAVE_LINEA) === '1'; } catch { return false; } });
    const alternarLinea = () => setLinea(l => {
        try { localStorage.setItem(CLAVE_LINEA, l ? '0' : '1'); } catch { /* sin almacenamiento */ }
        toast(l ? 'Línea a línea apagado' : 'Línea a línea: la que toca sale en negrita. Toca una línea o usa el pedal para corregir', { id: 'linea', duration: 3000 });
        return !l;
    });
    const lineaRef = useRef(linea);
    useEffect(() => { lineaRef.current = linea; }, [linea]);
    const actualRef = useRef(inicio);
    useEffect(() => { actualRef.current = actual; }, [actual]);
    const autoRef = useRef(auto), rodandoRef = useRef(rodando);
    useEffect(() => { autoRef.current = auto; rodandoRef.current = rodando; }, [auto, rodando]);
    // Montadas: la que suena y sus vecinas. Las vecinas cambian cuando el carrusel se para:
    // montar una canción larga a mitad del deslizamiento se comía fotogramas y retrasaba el título.
    // Al abrir, primero sale la que suena y las vecinas llegan justo después de pintarla
    const [cerca, setCerca] = useState<number | null>(null);
    const quieto = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => {
        let t: ReturnType<typeof setTimeout>;
        const f = requestAnimationFrame(() => { t = setTimeout(() => startTransition(() => setCerca(c => c ?? inicio))); });
        return () => { cancelAnimationFrame(f); clearTimeout(t); };
    }, [inicio]);

    usePantallaEncendida();

    const cancion = canciones[actual];
    const cambiar = (c: Cancion, cambio: Partial<AjustesCancion>) => guardar({ ...c, ajustes: { ...c.ajustes, ...cambio } }, { esperar: true });
    // Editar la letra ahí mismo (lápiz arriba): la canción que suena, sin salir de Tocar
    const [editando, setEditando] = useState<string | null>(null);
    const editandoRef = useRef(editando);
    useEffect(() => { editandoRef.current = editando; }, [editando]);
    const guardarTexto = (c: Cancion, texto: string) => {
        guardar({ ...c, texto });
        toast.success('Guardado', { action: { label: 'Deshacer', onClick: () => guardar(c) } });
    };

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
        setCerca(c => (c === null || Math.abs(i - c) > 1 ? i : c));
        el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
        setIndice(false);
    }, [canciones.length]);

    const salir = useCallback(() => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        navigate(`/cancionero/repertorio/${repertorioId}`);
    }, [navigate, repertorioId]);

    // Desplazamiento automático de la canción que suena. La velocidad se lee en cada fotograma:
    // cambiarla con − / + en directo no vuelve a esperar la intro
    const velocidadRef = useRef(18);
    const versos = useMemo(() => (cancion ? versosDe(cancion.texto) : 0), [cancion]);
    const introRef = useRef(0);
    // Va antes que el efecto que baja la hoja: al darle a ▶ ya están la velocidad y la intro
    useEffect(() => {
        const el = diapositivas.current[actual], opciones = auto ? { versos } : undefined;
        velocidadRef.current = cancion ? velocidadAlDesplazar(cancion, el, opciones) : 18;
        introRef.current = cancion ? esperaDeIntro(cancion, el, opciones) : 0;
    }, [cancion, actual, auto, versos, rodando]);
    useEffect(() => {
        if (!rodando) return;
        let raf = 0, ultimo = performance.now(), resto = 0;
        // Al ritmo (o en auto) y desde el principio, espera la intro
        const intro = introRef.current;
        if (intro) toast(`La hoja baja tras ${intro} s de intro`, { id: 'intro-hoja', duration: 2500 });
        const paso = (t: number) => {
            const el = diapositivas.current[actualRef.current];
            if (!el) return;
            resto += (velocidadRef.current * Math.min(100, t - ultimo)) / 1000;
            ultimo = t;
            const px = Math.floor(resto);
            if (px >= 1) { resto -= px; el.scrollTop += px; }
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) { setRodando(false); return; }
            raf = requestAnimationFrame(paso);
        };
        const empezar = setTimeout(() => { ultimo = performance.now(); raf = requestAnimationFrame(paso); }, intro * 1000);
        return () => { clearTimeout(empezar); cancelAnimationFrame(raf); if (intro) toast.dismiss('intro-hoja'); };
    }, [rodando, actual]);

    // Línea a línea: al bajar la hoja (sola o con el dedo) se marca la que cruza la guía
    useEffect(() => {
        const el = diapositivas.current[actual];
        if (!linea || !el) return;
        let marcada: HTMLElement | null = null, raf = 0;
        const pintar = () => { raf = 0; marcada = marcar(el, marcada); };
        const alMover = () => { if (!raf) raf = requestAnimationFrame(pintar); };
        pintar();
        el.addEventListener('scroll', alMover, { passive: true });
        window.addEventListener('resize', alMover);
        // Al cambiar el tono o el tamaño se vuelven a pintar las líneas: se marca otra vez
        const cambios = new MutationObserver(alMover);
        cambios.observe(el, { childList: true, subtree: true });
        return () => {
            cambios.disconnect();
            cancelAnimationFrame(raf);
            el.removeEventListener('scroll', alMover);
            window.removeEventListener('resize', alMover);
            marcada?.removeAttribute('data-ahora');
        };
    }, [linea, actual, cerca]);

    // La barra no se esconde sola al bajar la hoja: en el bolo todo tiene que estar a mano
    // (Víctor: «todo en la misma pantalla»). Se esconde y se enseña tocando la hoja

    // Pedal Bluetooth y teclado: adelante baja la canción y, al final, pasa a la siguiente
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            // Escribiendo (editar en sitio): las flechas y el espacio son del texto, no del pedal
            const t = e.target as HTMLElement | null;
            if (editandoRef.current || t?.closest('textarea, input, [contenteditable="true"]')) return;
            const el = diapositivas.current[actualRef.current];
            const i = actualRef.current;
            const adelante = ['PageDown', 'ArrowRight', 'ArrowDown'].includes(e.key);
            const atras = ['PageUp', 'ArrowLeft', 'ArrowUp'].includes(e.key);
            if (e.key === ' ' && !(e.target as HTMLElement).closest('button')) { e.preventDefault(); setRodando(r => !r); }
            else if (e.key === 'Escape') salir();
            else if (adelante && el && autoRef.current && !rodandoRef.current && el.scrollTop < 4) { e.preventDefault(); setRodando(true); }
            else if ((adelante || atras) && el && lineaRef.current) {
                e.preventDefault();
                const v = vecina(el, adelante ? 1 : -1);
                if (v) aLaGuia(el, v, !rodandoRef.current);
                else if (atras && el.scrollTop > 4) el.scrollTo({ top: 0, behavior: 'smooth' });
                else ir(adelante ? i + 1 : i - 1);
            } else if (adelante && el) {
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
                    <div key={c.id} ref={el => { diapositivas.current[i] = el; }} onClick={e => {
                        if (editando) return;
                        // Línea a línea: tocar una línea la lleva a la guía (sin parar la hoja)
                        const l = linea && i === actual ? (e.target as HTMLElement).closest<HTMLElement>('[data-hoja] [data-linea]') : null;
                        const el = diapositivas.current[i];
                        if (l && el) { aLaGuia(el, l, !rodando); return; }
                        if (auto && rodando) { setRodando(false); setControles(true); } else setControles(v => !v);
                    }} data-diapositiva
                        className={cn(linea && !c.ajustes.ajustar && 'teleprompter', 'relative h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-contain touch-pan-x touch-pan-y')}>
                        {i === actual || (cerca !== null && Math.abs(i - cerca) <= 1)
                            ? <Diapositiva cancion={c} n={i + 1} total={canciones.length} siguiente={canciones[i + 1]}
                                onSiguiente={() => ir(i + 1)} cambiar={cambio => cambiar(c, cambio)}
                                editando={editando === c.id} onGuardarTexto={texto => guardarTexto(c, texto)} onCerrarEdicion={() => setEditando(null)} repertorioId={repertorioId} />
                            : null}
                    </div>
                ))}
            </div>

            {/* Arriba: salir, dónde estoy y la lista */}
            <div className={cn('fixed inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)] bg-chrome backdrop-blur-2xl border-b border-hairline transition-all duration-200',
                controles ? 'opacity-100' : 'opacity-0 -translate-y-2 pointer-events-none')}>
                <div className="h-12 px-2 flex items-center gap-2">
                    <button onClick={salir} aria-label="Salir" className="pulsable h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-foreground"><X className="h-5 w-5" /></button>
                    <button onClick={() => setIndice(v => !v)} className="flex-1 min-w-0 flex items-center justify-center gap-1 text-[14px] font-semibold text-foreground active:opacity-60">
                        <span className="truncate"><span className="tabular-nums">{actual + 1} de {canciones.length}</span> · {nombre}</span>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', indice && 'rotate-180')} />
                    </button>
                    <BotonBarra etiqueta="Editar la letra" activo={editando === cancion?.id} onClick={() => { setRodando(false); setEditando(e => (e ? null : cancion?.id ?? null)); }}>
                        <Pencil className="h-[18px] w-[18px]" />
                    </BotonBarra>
                    <BotonBarra etiqueta="Lista de canciones" activo={indice} onClick={() => setIndice(v => !v)}><ListMusic className="h-[18px] w-[18px]" /></BotonBarra>
                </div>
            </div>

            {/* Abajo: tono, tamaño, que quepa y desplazar; y «Dame el tono», la cuenta, anterior y siguiente */}
            <ControlesCancion cancion={cancion} visibles={controles && !editando} rodando={rodando} auto={auto} versos={versos} linea={linea} onLinea={alternarLinea} onAuto={alternarAuto}
                tamanoVisto={() => Number(diapositivas.current[actual]?.querySelector('[data-tamano]')?.getAttribute('data-tamano')) || cancion.ajustes.tamano}
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

function ControlesCancion({ cancion, visibles, rodando, auto, versos, linea, onLinea, onAuto, onRodar, cambiar, onAnterior, onSiguiente, tamanoVisto }: {
    cancion: Cancion; visibles: boolean; rodando: boolean; auto: boolean; versos: number; linea: boolean; onLinea: () => void; onAuto: () => void; onRodar: () => void;
    cambiar: (c: Partial<AjustesCancion>) => void; onAnterior?: () => void; onSiguiente?: () => void; tamanoVisto: () => number;
}) {
    const { leida, tonoSuena, sinAcordes } = useMusicaCancion(cancion.texto, cancion.ajustes, cancion.ficha?.tono, cancion.ficha?.capo);
    const [mas, setMas] = useState(false);
    const a = cancion.ajustes;
    const cambiarTono = (d: number) => { const s = a.semitonos + d; cambiar({ semitonos: Math.abs(s) >= 12 ? 0 : s }); };
    // Desde el tamaño que se ve (con «que quepa» puede no ser el guardado): sin saltos
    const cambiarTamano = (d: number) => cambiar({ tamano: Math.min(TAMANO_MAX, Math.max(TAMANO_MIN, Math.round(tamanoVisto()) + d)), ajustar: false });
    const icono = 'pulsable h-11 w-11 shrink-0 rounded-full flex items-center justify-center disabled:opacity-25';
    const normal = cn(icono, 'bg-fill text-foreground');
    const activo = cn(icono, 'bg-foreground text-background');
    // Todo lo del directo a la vista, en dos filas finas (390 px): nada de abrir ⋯ en mitad del bolo.
    // En ⋯ solo la cuenta 1·2·3·4
    return (
        <div className={cn('fixed inset-x-0 bottom-0 z-10 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 px-3 bg-chrome backdrop-blur-2xl border-t border-hairline transition-all duration-200',
            visibles ? 'opacity-100' : 'opacity-0 translate-y-2 pointer-events-none')}>
            <div className="max-w-xl mx-auto">
                {auto && <FilaAuto cancion={cancion} versos={versos} cambiar={cambiar} />}
                <div className="flex items-center justify-between gap-1.5">
                    <Paso grande etiqueta="Tono" onMenos={() => cambiarTono(-1)} onMas={() => cambiarTono(1)} menosDesactivado={sinAcordes} masDesactivado={sinAcordes}
                        valor={<>{tonoSuena || 'Tono'}{a.semitonos !== 0 && <span className="ml-1 text-[12px] text-muted-foreground">{a.semitonos > 0 ? '+' : ''}{a.semitonos}</span>}</>} />
                    {tonoSuena && (
                        <DameElTono leida={leida} ajustes={a} className="h-11 min-w-11 px-1.5 text-[13px] bg-fill text-foreground">
                            <span className="sr-only">Dame el tono</span>
                        </DameElTono>
                    )}
                    <button onClick={() => cambiarTamano(-1)} aria-label="Letra más pequeña" className={normal}><span className="text-[13px] font-bold">A−</span></button>
                    <button onClick={() => cambiarTamano(1)} aria-label="Letra más grande" className={normal}><span className="text-[17px] font-bold">A+</span></button>
                    <button onClick={() => cambiar({ ajustar: !a.ajustar })} aria-label="Que quepa en la pantalla" aria-pressed={a.ajustar} className={a.ajustar ? activo : normal}>
                        <Shrink className="h-[18px] w-[18px]" />
                    </button>
                    <button onClick={() => setMas(true)} aria-label="Más ajustes" className={normal}><MoreHorizontal className="h-[18px] w-[18px]" /></button>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1.5">
                    <button onClick={onAnterior} disabled={!onAnterior} aria-label="Canción anterior" className={normal}><ChevronLeft className="h-6 w-6" /></button>
                    <button onClick={onLinea} aria-label="Línea a línea" aria-pressed={linea} className={cn(linea ? activo : normal, 'w-auto px-3 gap-1.5 text-[13px] font-semibold')}>
                        <ScrollText className="h-[18px] w-[18px]" /> Línea
                    </button>
                    <button onClick={onAuto} aria-label={auto ? 'Apagar el modo auto' : 'Modo auto: la hoja baja sola'} aria-pressed={auto} className={cn(auto ? activo : normal, 'w-auto px-3 text-[13px] font-semibold')}>
                        Auto
                    </button>
                    <button onClick={onRodar} aria-label={rodando ? 'Parar' : 'Desplazar sola'} aria-pressed={rodando}
                        className={cn(icono, 'w-auto px-3.5 gap-1.5 text-[13px] font-bold', rodando ? 'bg-foreground text-background' : 'bg-primary text-primary-foreground')}>
                        {rodando ? <Pause className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px]" />}
                        {rodando ? 'Parar' : 'Bajar'}
                    </button>
                    <button onClick={onSiguiente} disabled={!onSiguiente} aria-label="Canción siguiente" className={normal}><ChevronRight className="h-6 w-6" /></button>
                </div>
            </div>
            <Hoja abierta={mas} onCerrar={() => setMas(false)} titulo={cancion.titulo}
                derecha={<BotonHoja fuerte onClick={() => setMas(false)}>Listo</BotonHoja>}>
                <div className="px-4 pb-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[15px] text-foreground">Cuenta 1·2·3·4{cancion.bpm ? '' : ' (sin tempo)'}</span>
                        <BotonClaqueta bpm={cancion.bpm} />
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                        «Auto» baja la hoja en lo que dura la canción (o a su tempo); sin Auto, «Bajar» va a velocidad fija.
                        «Línea» pone en negrita la línea que toca cantar; corrígela tocando una línea o con el pedal.
                    </p>
                </div>
            </Hoja>
        </div>
    );
}

// Una canción del repertorio. Se mide sola para «que quepa» y se agranda con dos dedos.
function Diapositiva({ cancion, n, total, siguiente, onSiguiente, cambiar, editando, onGuardarTexto, onCerrarEdicion, repertorioId }: {
    cancion: Cancion; n: number; total: number; siguiente?: Cancion; onSiguiente: () => void;
    cambiar: (c: Partial<AjustesCancion>) => void;
    editando?: boolean; onGuardarTexto: (texto: string) => void; onCerrarEdicion: () => void; repertorioId?: string;
}) {
    const a = cancion.ajustes;
    const { leida, opciones } = useMusicaCancion(cancion.texto, a, cancion.ficha?.tono, cancion.ficha?.capo);
    const bloque = bloqueDe(cancion);
    const estiloDelBloque = bloque ? estiloBloque(bloque) : null;
    // Quién canta: lo que diga la ficha, si el texto no lo dice ya
    const etiquetas = useMemo(() => {
        const e = etiquetasDe(cancion);
        const canta = cancion.ficha?.canta?.trim();
        if (canta && !e.some(x => /^canta /i.test(x.texto))) e.unshift({ texto: `Canta ${canta}`, pastel: pastelCanta(canta), icono: ICONO.canciones });
        return e;
    }, [cancion]);
    const tonoSiguiente = siguiente ? tonoDe(siguiente) : null;
    const lineas = useMemo(() => sinLoDeLasPildoras(leida.lineas, bloque), [leida.lineas, bloque]);

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
        const alto = caja.clientHeight - zona.offsetTop - 132;
        if (alto < 120) return;
        const e = buscarEncaje(hoja, zona.clientWidth, alto, columnasPosibles(zona.clientWidth), topeQueQuepa());
        setEncaje(x => (x && x.tamano === e.tamano && x.columnas === e.columnas && x.cabe === e.cabe ? x : e));
    }, [a.ajustar, a.vista, opciones, lineas, medida]);

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
            className="min-h-full px-5 md:px-10 pt-[calc(env(safe-area-inset-top)+60px)] pb-[calc(env(safe-area-inset-bottom)+132px)]">
            <h2 className="font-heading text-[28px] font-bold leading-tight text-foreground">
                <span className="sr-only">{n} de {total}: </span>{cancion.titulo}
            </h2>
            {(bloque || etiquetas.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {bloque && estiloDelBloque && <Pildora texto={bloque} pastel={estiloDelBloque.pastel} icono={estiloDelBloque.icono} />}
                    {etiquetas.map(e => <Pildora key={e.texto} texto={e.texto} pastel={e.pastel} icono={e.icono} />)}
                </div>
            )}
            {/* Las notas con formato de la canción (avisos, entradas…), encima de la hoja */}
            {!notasVacias(cancion.notas) && <NotasRicas json={cancion.notas} className="mt-3 text-[15px]" />}
            <div ref={zonaRef} data-hoja data-tamano={tamano} className="mt-3">
                {editando
                    ? <EditarEnSitio cancion={cancion} onGuardar={onGuardarTexto} onCerrar={onCerrarEdicion} repertorioId={repertorioId} barraArriba="top-[calc(env(safe-area-inset-top)+48px)]" />
                    : <HojaCancion lineas={lineas} opciones={opciones} vista={a.vista} tamano={tamano} columnas={columnas} />}
            </div>
            {/* Copia invisible para medir, solo con «que quepa»: el tamaño y las columnas los pone buscarEncaje */}
            {a.ajustar && (
                <div className="fixed left-0 top-0 h-0 w-0 overflow-hidden invisible" aria-hidden>
                    <HojaCancion ref={medidorRef} lineas={lineas} opciones={opciones} vista={a.vista} tamano={TAMANO_MAX} columnas={1} className="hidden" />
                </div>
            )}
            {siguiente && (
                <button onClick={e => { e.stopPropagation(); onSiguiente(); }}
                    className="pulsable mt-6 w-full rounded-2xl bg-sheet border border-hairline shadow-e1 p-2 pr-4 flex items-center gap-3 text-left">
                    <Portada src={siguiente.portada} titulo={siguiente.titulo} tamano="lista" />
                    <span className="flex-1 min-w-0">
                        <span className="block text-[12px] text-muted-foreground">Siguiente</span>
                        <span className="block truncate text-[16px] font-semibold text-foreground">{siguiente.titulo}{tonoSiguiente && <> · {tonoSiguiente}</>}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}

const CLAVE_AUTO = 'musikeeo-tocar-auto';
const CLAVE_LINEA = 'musikeeo-tocar-linea';

// Modo auto: a qué ritmo baja esta canción y el ajuste a mano (se guarda con la canción)
function FilaAuto({ cancion, versos, cambiar }: { cancion: Cancion; versos: number; cambiar: (c: Partial<AjustesCancion>) => void }) {
    const ritmo = cancion.ajustes.ritmo ?? 1;
    const segundos = segundosAuto(cancion, versos);
    const mover = (d: number) => cambiar({ ritmo: Math.round(Math.min(RITMO_MAX, Math.max(RITMO_MIN, ritmo + d)) * 10) / 10 });
    const fuente = cancion.duracion ? `dura ${minutos(cancion.duracion)}` : cancion.bpm ? `${cancion.bpm} bpm` : null;
    return (
        <div className="mb-2 flex items-center gap-2">
            <p className="flex-1 min-w-0 truncate text-[13px] text-muted-foreground">
                {segundos
                    ? <>Auto · {fuente}{cancion.duracion && cancion.bpm ? ` · ${cancion.bpm} bpm` : ''} · baja en <b className="font-semibold text-foreground">{minutos(segundos / ritmo)}</b></>
                    : 'Auto · sin duración ni tempo: baja a velocidad fija'}
            </p>
            <Paso compacto etiqueta="Velocidad del modo auto" valor={`${Math.round(ritmo * 100)} %`}
                onMenos={() => mover(-0.1)} onMas={() => mover(0.1)} menosDesactivado={ritmo <= RITMO_MIN} masDesactivado={ritmo >= RITMO_MAX} />
        </div>
    );
}
