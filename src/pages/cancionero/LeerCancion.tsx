import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, Maximize, Pause, Play, Shrink, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { juntarAcordesYLetra, lineasDeLetra } from '../../lib/acordes';
import { useCancionero } from '../../hooks/useCancionero';
import { useMusicaCancion } from '../../hooks/useMusicaCancion';
import { usePantallaEncendida } from '../../hooks/usePantallaEncendida';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { PanelAjustes } from '../../components/cancionero/PanelAjustes';
import { AnadirLetra } from '../../components/cancionero/AnadirLetra';
import { PortadaMuestra } from '../../components/cancionero/Portada';
import { BotonBarra, Paso } from '../../components/cancionero/Controles';
import { buscarEncaje, columnasPosibles, type Encaje } from '../../components/cancionero/medir';
import type { AjustesCancion, Cancion } from '../../types/cancionero';

export default function LeerCancion() {
    const { id } = useParams();
    const { canciones, listo, nube, conCuenta } = useCancionero();
    const cancion = canciones.find(c => c.id === id);

    if (!listo || (!cancion && nube === 'sincronizando')) {
        return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
    }
    if (!cancion) {
        return (
            <div className="max-w-md mx-auto px-6 py-20 text-center">
                <p className="text-[17px] font-semibold text-foreground">Esta canción no está aquí</p>
                <p className="mt-2 text-[15px] text-muted-foreground">
                    {conCuenta
                        ? 'Puede que la hayas borrado o que la guardaras en otro móvil sin cuenta.'
                        : 'Sin cuenta, las canciones se guardan solo en el móvil o el ordenador donde las añadiste. Entra para tenerlas en todos.'}
                </p>
                <Link to="/cancionero" className="pulsable mt-5 inline-flex h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">Ir al cancionero</Link>
            </div>
        );
    }
    return <Lector key={cancion.id} cancion={cancion} />;
}

const PASO_TAMANO = 1;
const TAMANO_MIN = 11;
const TAMANO_MAX = 44;

function Lector({ cancion }: { cancion: Cancion }) {
    const navigate = useNavigate();
    const { guardar, borrar } = useCancionero();
    const [ajustes, setAjustes] = useState<AjustesCancion>(cancion.ajustes);
    const [panel, setPanel] = useState(false);
    const [rodando, setRodando] = useState(false);
    const [escenario, setEscenario] = useState(false);
    const [controles, setControles] = useState(true);
    const [imprimiendo, setImprimiendo] = useState(false);
    const [encaje, setEncaje] = useState<Encaje | null>(null);
    const [medida, setMedida] = useState(0);

    const zonaRef = useRef<HTMLDivElement>(null);
    const barraRef = useRef<HTMLDivElement>(null);
    const medidorRef = useRef<HTMLDivElement>(null);
    const escenarioRef = useRef<HTMLDivElement>(null);
    const zonaEscenarioRef = useRef<HTMLDivElement>(null);
    const impresionRef = useRef<HTMLDivElement>(null);
    const conPantallaCompleta = useRef(false);

    const cambiar = (cambio: Partial<AjustesCancion>) => {
        const nuevos = { ...ajustes, ...cambio };
        setAjustes(nuevos);
        guardar({ ...cancion, ajustes: nuevos }, { esperar: true });
    };

    // ---- La música: tono, cejilla y nombres de los acordes ----
    const { leida, opciones, tonoSuena, posturas, recomendada, dificilesAhora, formasRecomendadas, sinAcordes } = useMusicaCancion(cancion.texto, ajustes);
    // Acordes por un lado y letra por otro: se pueden poner los acordes encima, como en LaCuerda
    const juntada = useMemo(() => juntarAcordesYLetra(cancion.texto), [cancion.texto]);

    const cambiarTono = (d: number) => {
        const s = ajustes.semitonos + d;
        cambiar({ semitonos: Math.abs(s) >= 12 ? 0 : s });
    };

    // ---- Que quepa entera ----
    useEffect(() => {
        const f = () => setMedida(m => m + 1);
        window.addEventListener('resize', f);
        window.addEventListener('orientationchange', f);
        return () => { window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f); };
    }, []);

    const caja = useCallback((): { ancho: number; alto: number } | null => {
        if (escenario) {
            const fondo = escenarioRef.current, zona = zonaEscenarioRef.current;
            if (!fondo || !zona) return null;
            return { ancho: zona.clientWidth, alto: fondo.clientHeight - zona.offsetTop - 84 };
        }
        const zona = zonaRef.current, barra = barraRef.current;
        if (!zona || !barra) return null;
        const arriba = (parseFloat(getComputedStyle(barra).top) || 0) + barra.offsetHeight + 12;
        const barraInferior = document.querySelector<HTMLElement>('nav[aria-label="Navegación principal"]');
        const abajo = (barraInferior?.offsetHeight || 0) + 16;
        return { ancho: zona.clientWidth, alto: window.innerHeight - arriba - abajo };
    }, [escenario]);

    useLayoutEffect(() => {
        if (!ajustes.ajustar) return;
        const hoja = medidorRef.current;
        const c = caja();
        if (!hoja || !c || c.alto < 120) return;
        setEncaje(buscarEncaje(hoja, c.ancho, c.alto, columnasPosibles(c.ancho), TAMANO_MAX));
    }, [ajustes.ajustar, ajustes.vista, opciones, leida, escenario, medida, caja]);

    // Al activarlo, la hoja se coloca justo debajo de la barra
    useEffect(() => {
        if (!ajustes.ajustar || escenario) return;
        const zona = zonaRef.current, barra = barraRef.current;
        if (!zona || !barra) return;
        const arriba = (parseFloat(getComputedStyle(barra).top) || 0) + barra.offsetHeight + 12;
        window.scrollTo({ top: Math.max(0, zona.getBoundingClientRect().top + window.scrollY - arriba), behavior: 'smooth' });
    }, [ajustes.ajustar, escenario]);

    const ajustada = ajustes.ajustar && encaje?.cabe;
    const tamano = ajustada ? encaje!.tamano : ajustes.tamano;
    const columnas = ajustada ? encaje!.columnas : ajustes.columnas;

    const cambiarTamano = (d: number) => {
        const nuevo = Math.min(TAMANO_MAX, Math.max(TAMANO_MIN, Math.round(tamano) + d));
        cambiar({ tamano: nuevo, ajustar: false, columnas: ajustada ? (Math.min(3, columnas) as 1 | 2 | 3) : ajustes.columnas });
    };

    // ---- Desplazamiento automático ----
    const desplazable = useCallback(
        () => (escenario ? escenarioRef.current : (document.scrollingElement as HTMLElement | null)),
        [escenario],
    );
    useEffect(() => {
        if (!rodando) return;
        let raf = 0, ultimo = performance.now(), resto = 0;
        const paso = (t: number) => {
            const el = desplazable();
            if (!el) return;
            resto += (ajustes.velocidad * Math.min(100, t - ultimo)) / 1000;
            ultimo = t;
            const px = Math.floor(resto);
            if (px >= 1) { resto -= px; el.scrollTop += px; }
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) { setRodando(false); return; }
            raf = requestAnimationFrame(paso);
        };
        raf = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(raf);
    }, [rodando, ajustes.velocidad, desplazable]);

    // En el escenario, los controles se esconden solos mientras baja
    useEffect(() => {
        if (!escenario || !rodando || !controles) return;
        const t = setTimeout(() => setControles(false), 3000);
        return () => clearTimeout(t);
    }, [escenario, rodando, controles]);

    // ---- La pantalla no se apaga mientras lees ----
    usePantallaEncendida();

    // ---- Modo escenario ----
    const entrarEscenario = () => {
        setEscenario(true);
        setControles(true);
        document.documentElement.requestFullscreen?.().then(() => { conPantallaCompleta.current = true; }).catch(() => {});
    };
    const salirEscenario = useCallback(() => {
        setEscenario(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        conPantallaCompleta.current = false;
    }, []);
    useEffect(() => {
        const f = () => { if (!document.fullscreenElement && conPantallaCompleta.current) salirEscenario(); };
        document.addEventListener('fullscreenchange', f);
        return () => document.removeEventListener('fullscreenchange', f);
    }, [salirEscenario]);

    // ---- Teclado y pedal Bluetooth (mandan AvPág/RePág o flechas) ----
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (panel || t.closest('input, textarea, select, [contenteditable="true"]')) return;
            const el = desplazable();
            const pagina = escenario ? (el?.clientHeight || 0) * 0.85 : window.innerHeight * 0.7;
            const adelante = ['PageDown', 'ArrowRight'].includes(e.key) || (escenario && e.key === 'ArrowDown');
            const atras = ['PageUp', 'ArrowLeft'].includes(e.key) || (escenario && e.key === 'ArrowUp');
            if (e.key === ' ' && !t.closest('button')) { e.preventDefault(); setRodando(r => !r); }
            else if (adelante || atras) { e.preventDefault(); el?.scrollBy({ top: adelante ? pagina : -pagina, behavior: 'smooth' }); }
            else if (e.key === 'Escape' && escenario) salirEscenario();
        };
        window.addEventListener('keydown', f);
        return () => window.removeEventListener('keydown', f);
    }, [panel, escenario, desplazable, salirEscenario]);

    // ---- Imprimir (en una hoja A4 si cabe) ----
    useLayoutEffect(() => {
        if (!imprimiendo) return;
        const hoja = impresionRef.current;
        if (!hoja) return;
        const e = buscarEncaje(hoja, 700, 960, 2, 22);
        hoja.style.fontSize = `${e.cabe ? e.tamano : 11}px`;
        hoja.style.columnCount = String(e.cabe ? e.columnas : 2);
        if (!e.cabe) { hoja.style.height = 'auto'; hoja.style.overflow = 'visible'; hoja.style.columnFill = 'balance'; }
        document.body.classList.add('imprimiendo-cancion');
        const fin = () => { document.body.classList.remove('imprimiendo-cancion'); setImprimiendo(false); };
        window.addEventListener('afterprint', fin, { once: true });
        const t = requestAnimationFrame(() => window.print());
        return () => { cancelAnimationFrame(t); window.removeEventListener('afterprint', fin); };
    }, [imprimiendo]);

    const ponerLetra = (texto: string, cambio: Partial<AjustesCancion>) => {
        const antes = { ...cancion, ajustes };
        const nuevos = { ...ajustes, ...cambio };
        setAjustes(nuevos);
        guardar({ ...cancion, texto, ajustes: nuevos });
        window.scrollTo({ top: 0 });
        toast.success('Canción añadida en tu tono', {
            action: { label: 'Deshacer', onClick: () => { setAjustes(antes.ajustes); guardar(antes); } },
        });
    };

    const juntar = () => {
        if (!juntada) return;
        const antes = { ...cancion, ajustes };
        guardar({ ...cancion, texto: juntada, ajustes });
        toast.success('Acordes encima de la letra', {
            action: { label: 'Deshacer', onClick: () => guardar(antes) },
        });
    };

    const borrarCancion = () => {
        setPanel(false);
        void borrar(cancion.id);
        toast('Canción borrada', { action: { label: 'Deshacer', onClick: () => guardar({ ...cancion, ajustes }) } });
        navigate('/cancionero', { replace: true });
    };

    const hoja = (ref?: React.Ref<HTMLDivElement>, className?: string) => (
        <HojaCancion ref={ref} lineas={leida.lineas} opciones={opciones} vista={ajustes.vista}
            tamano={tamano} columnas={columnas} className={className} />
    );
    const datosTono = tonoSuena && (
        <>Tono <b className="font-semibold text-foreground">{tonoSuena}</b>{ajustes.cejilla > 0 && <> · Cejilla {ajustes.cejilla}{posturas && ` (posturas de ${posturas})`}</>}</>
    );
    const pasoTono = (
        <Paso compacto etiqueta="Tono" onMenos={() => cambiarTono(-1)} onMas={() => cambiarTono(1)}
            menosDesactivado={sinAcordes} masDesactivado={sinAcordes}
            valor={<span>{tonoSuena || 'Tono'}{ajustes.semitonos !== 0 && <span className="ml-1 text-[12px] text-muted-foreground">{ajustes.semitonos > 0 ? '+' : ''}{ajustes.semitonos}</span>}</span>} />
    );
    const pasoTamano = (
        <Paso compacto etiqueta="Tamaño de la letra" valor="Aa" onMenos={() => cambiarTamano(-PASO_TAMANO)} onMas={() => cambiarTamano(PASO_TAMANO)}
            menosDesactivado={!ajustada && tamano <= TAMANO_MIN} masDesactivado={!ajustada && tamano >= TAMANO_MAX} />
    );
    const botonAjustar = (
        <BotonBarra activo={ajustes.ajustar} etiqueta="Que quepa en la pantalla" onClick={() => cambiar({ ajustar: !ajustes.ajustar })}>
            <Shrink className="h-[18px] w-[18px]" /><span className="hidden md:inline">Que quepa</span>
        </BotonBarra>
    );
    const botonRodar = (
        <BotonBarra activo={rodando} etiqueta={rodando ? 'Parar' : 'Desplazar sola'} onClick={() => setRodando(r => !r)}>
            {rodando ? <Pause className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px]" />}
            <span className="hidden md:inline">{rodando ? 'Parar' : 'Desplazar'}</span>
        </BotonBarra>
    );

    return (
        <div className="pb-10">
            {/* Cabecera */}
            <div className="max-w-5xl mx-auto px-4 md:px-0 pt-3 md:pt-6">
                <div className="flex items-center justify-between gap-3">
                    <Link to="/cancionero" className="inline-flex items-center -ml-1.5 text-[15px] text-muted-foreground active:opacity-60">
                        <ChevronLeft className="h-5 w-5" /> Cancionero
                    </Link>
                    <BotonBarra etiqueta="Modo escenario: a pantalla completa" onClick={entrarEscenario}>
                        <Maximize className="h-4 w-4" /> Escenario
                    </BotonBarra>
                </div>
                <div className="mt-1 flex items-start gap-3">
                    {/* La portada; si hay muestra, al tocarla suenan 30 s de la grabación */}
                    {(cancion.portada || cancion.muestra) && (
                        <PortadaMuestra src={cancion.portada} titulo={cancion.titulo} muestra={cancion.muestra} tamano="cabecera" pararAlSalir />
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground">{cancion.titulo}</h1>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">
                            {cancion.artista}{cancion.artista && datosTono && ' · '}{datosTono}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div ref={barraRef} className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] md:top-14 z-20 mt-3 bg-chrome backdrop-blur-2xl backdrop-saturate-150 border-b border-hairline">
                <div className="max-w-5xl mx-auto px-4 md:px-0 h-[52px] flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                    {pasoTono}
                    {pasoTamano}
                    {botonAjustar}
                    {botonRodar}
                    <BotonBarra etiqueta="Ajustes" onClick={() => setPanel(true)} className="ml-auto">
                        <SlidersHorizontal className="h-[18px] w-[18px]" /><span className="hidden md:inline">Ajustes</span>
                    </BotonBarra>
                </div>
            </div>

            {/* La hoja */}
            <div className="max-w-5xl mx-auto px-4 md:px-0 mt-4">
                {/* Ficha o chuleta sin letra: buscarla, copiarla y pegarla, y entra en el tono del setlist */}
                {!leida.lineas.some(l => l.tipo === 'mixta') && lineasDeLetra(leida) < 8 && (
                    <AnadirLetra cancion={cancion} ajustes={ajustes} onPegar={ponerLetra} />
                )}
                {juntada && (
                    <div className="mb-4 rounded-2xl bg-fill px-4 py-3 flex items-center gap-3">
                        <p className="flex-1 text-[14px] text-muted-foreground">Los acordes y la letra están separados.</p>
                        <button onClick={juntar} className="pulsable h-9 px-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold shrink-0">
                            Ponerlos encima
                        </button>
                    </div>
                )}
                {sinAcordes && leida.lineas.length > 0 && (
                    <p className="mb-4 rounded-2xl bg-fill px-4 py-3 text-[14px] text-muted-foreground">
                        No hemos encontrado acordes. Tienen que ir en su propia línea, encima de la letra, o entre corchetes como [Am].{' '}
                        <Link to={`/cancionero/${cancion.id}/editar`} className="font-semibold text-foreground underline underline-offset-2">Editar</Link>
                    </p>
                )}
                {ajustes.ajustar && encaje && !encaje.cabe && (
                    <p className="mb-4 rounded-2xl bg-fill px-4 py-3 text-[14px] text-muted-foreground">
                        Es demasiado larga para verla entera en esta pantalla. Prueba con «Solo letra» o gira el móvil.
                    </p>
                )}
                {/* Con «que quepa», la hoja tiene que poder subir hasta la barra aunque la canción sea corta */}
                <div ref={zonaRef} className={cn(ajustes.ajustar && 'min-h-[100dvh]')}>{!escenario && hoja()}</div>
                {leida.lineas.length === 0 && (
                    <p className="py-10 text-center text-[15px] text-muted-foreground">Esta canción está vacía.</p>
                )}
            </div>

            {/* Copia invisible para medir */}
            <div className="fixed left-0 top-0 h-0 w-0 overflow-hidden invisible" aria-hidden>
                {hoja(medidorRef)}
            </div>

            {/* Escenario: la canción a pantalla completa, sin nada más */}
            {escenario && createPortal(
                <div className="fixed inset-0 z-[90] bg-background text-foreground">
                    <div ref={escenarioRef} onClick={() => setControles(c => !c)}
                        className="h-full overflow-y-auto overscroll-contain px-5 md:px-10 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+110px)]">
                        <p className="text-[13px] font-semibold text-muted-foreground truncate">
                            {cancion.titulo}{tonoSuena && <> · {tonoSuena}</>}{ajustes.cejilla > 0 && <> · Cejilla {ajustes.cejilla}</>}
                        </p>
                        <div ref={zonaEscenarioRef} className="mt-2">{hoja()}</div>
                    </div>
                    <div className={cn(
                        'fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+16px)] max-w-[calc(100vw-24px)] flex items-center gap-1.5 p-1.5 rounded-full bg-sheet border border-hairline shadow-e3 overflow-x-auto hide-scrollbar transition-all duration-200',
                        controles ? 'opacity-100' : 'opacity-0 translate-y-4 pointer-events-none',
                    )}>
                        {pasoTono}
                        {pasoTamano}
                        {botonAjustar}
                        {botonRodar}
                    </div>
                    <button onClick={salirEscenario} aria-label="Salir del escenario"
                        className={cn('pulsable fixed right-3 top-[calc(env(safe-area-inset-top)+8px)] h-9 w-9 rounded-full bg-sheet border border-hairline shadow-e2 flex items-center justify-center text-foreground transition-opacity duration-200',
                            controles ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                        <X className="h-[18px] w-[18px]" />
                    </button>
                </div>,
                document.body,
            )}

            {/* Para imprimir: solo existe mientras se imprime */}
            {imprimiendo && createPortal(
                <div className="hoja-impresion fixed left-[-10000px] top-0 invisible w-[700px] text-foreground">
                    <p className="text-[20px] font-bold leading-tight">{cancion.titulo}</p>
                    <p className="mb-3 text-[12px]">{cancion.artista}{cancion.artista && datosTono && ' · '}{datosTono}</p>
                    {hoja(impresionRef)}
                </div>,
                document.body,
            )}

            <PanelAjustes
                abierto={panel} onCerrar={() => setPanel(false)}
                ajustes={ajustes} cambiar={cambiar}
                tonoSuena={tonoSuena} posturas={posturas} recomendada={recomendada} formasRecomendadas={formasRecomendadas} dificilesAhora={dificilesAhora}
                onImprimir={() => { setPanel(false); setImprimiendo(true); }}
                onEditar={() => navigate(`/cancionero/${cancion.id}/editar`)}
                onBorrar={borrarCancion}
            />
        </div>
    );
}
