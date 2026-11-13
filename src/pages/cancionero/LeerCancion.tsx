import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ConMenu } from '../../components/cancionero/ConMenu';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Eye, Guitar, Loader2, Maximize, MoreHorizontal, Pause, Pencil, Play, Shrink, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { juntarAcordesYLetra, lineasDeLetra, nombreAcorde } from '../../lib/acordes';
import { verAcordes } from '../../lib/verAcorde';
import { useCancionero } from '../../hooks/useCancionero';
import { useMusicaCancion } from '../../hooks/useMusicaCancion';
import { usePantallaEncendida } from '../../hooks/usePantallaEncendida';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { SiFalla } from '../../components/cancionero/SiFalla';
import { PanelAjustes, type SeccionAjustes } from '../../components/cancionero/PanelAjustes';
import { AnadirLetra } from '../../components/cancionero/AnadirLetra';
import { HacerVersion } from '../../components/cancionero/HacerVersion';
import { PortadaMuestra } from '../../components/cancionero/Portada';
import { BotonBarra, Paso } from '../../components/cancionero/Controles';
import { AjustesCantante, BotonClaqueta, DameElTono } from '../../components/cancionero/Cantante';
import { esperaDeIntro, velocidadAlDesplazar } from '../../lib/cantar';
import { buscarEncaje, topeQueQuepa, sueloQueQuepa, columnasPosibles, type Encaje } from '../../components/cancionero/medir';
import type { AjustesCancion, Cancion } from '../../types/cancionero';
import { cn as unir } from '../../lib/utils';
import { cejillaDeFicha, versionesDe } from '../../lib/biblioteca';
import { NotasRicas } from '../../components/notas/NotasRicas';
import { EditarEnSitio } from '../../components/cancionero/EditarEnSitio';
import { VersionesAnteriores } from '../../components/cancionero/VersionesAnteriores';
import { precargarEditorLetra } from '../../components/cancionero/cargarEditorLetra';
import { precargarEditarCancion } from '../../components/cancionero/cargarEditarCancion';
import { FichaEnSitio } from '../../components/cancionero/FichaEnSitio';
import { BotonWebs } from '../../components/cancionero/BotonWebs';
import { BotonTareas } from '../../components/cancionero/Tareas';
import { BotonSpotify } from '../../components/cancionero/Spotify';
import { notasVacias } from '../../lib/notas';

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
    // Si los ajustes cambian desde fuera (el tono de la ficha, Deshacer), se siguen
    const [ajustesVistos, setAjustesVistos] = useState(cancion.ajustes);
    if (cancion.ajustes !== ajustesVistos) { setAjustesVistos(cancion.ajustes); setAjustes(cancion.ajustes); }
    // La hoja abierta de la barra de abajo (una sola cosa cada vez), o ninguna
    const [panel, setPanelSeccion] = useState<SeccionAjustes | null>(null);
    const setPanel = (v: false) => { if (!v) setPanelSeccion(null); };
    const [versionando, setVersionando] = useState(false);
    const [historial, setHistorial] = useState(0);   // abierto: la marca de cuándo (para montarlo de nuevo)
    // Editando el texto ahí mismo: la línea donde se tocó y a qué altura de la pantalla estaba
    const [editando, setEditando] = useState<{ linea: number; y: number | null } | null>(null);
    // El editor de la letra, listo antes de tocarla (en el iPhone, así se abre el teclado al momento)
    // y la pantalla de editar (con la ficha): si se publica otra versión mientras tanto, abre igual
    useEffect(() => { precargarEditorLetra(); precargarEditarCancion(); }, []);
    // Abierta desde un repertorio: «Guardar como canción nueva» la pone en su sitio en ese repertorio
    const [params] = useSearchParams();
    const desdeRepertorio = params.get('repertorio');
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
    const { leida, opciones, tonoSuena, posturas, recomendada, dificilesAhora, formasRecomendadas, sinAcordes } = useMusicaCancion(cancion.texto, ajustes, cancion.ficha?.tono, cancion.ficha?.capo);
    // Acordes por un lado y letra por otro: se pueden poner los acordes encima, como en LaCuerda
    const juntada = useMemo(() => juntarAcordesYLetra(cancion.texto), [cancion.texto]);

    const cejillaFormas = ajustes.cejilla || ajustes.cejillaGuardada || cejillaDeFicha(cancion);
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
        // Arriba, la cabecera de la app; abajo, la barra de la canción (y la de navegación debajo)
        const arriba = arribaLibre();
        const abajo = window.innerHeight - barra.getBoundingClientRect().top + 12;
        return { ancho: zona.clientWidth, alto: window.innerHeight - arriba - abajo };
    }, [escenario]);

    useLayoutEffect(() => {
        if (!ajustes.ajustar) return;
        const hoja = medidorRef.current;
        const c = caja();
        if (!hoja || !c || c.alto < 120) return;
        setEncaje(buscarEncaje(hoja, c.ancho, c.alto, columnasPosibles(c.ancho), topeQueQuepa(), sueloQueQuepa()));
    }, [ajustes.ajustar, ajustes.vista, opciones, leida, escenario, medida, caja]);

    // Una ficha o una chuleta sin letra: arriba sale «Falta la letra» para pegarla
    const faltaLetra = !leida.lineas.some(l => l.tipo === 'mixta') && lineasDeLetra(leida) < 8;
    const [verAnadir, setVerAnadir] = useState(false);

    // Al activarlo, la hoja se coloca justo debajo de la barra. Si falta la letra, no: taparía
    // el recuadro para pegarla (las fichas del setlist llegan con «que quepa»)
    useEffect(() => {
        if (!ajustes.ajustar || escenario || faltaLetra) return;
        const zona = zonaRef.current;
        if (!zona) return;
        const arriba = arribaLibre();
        window.scrollTo({ top: Math.max(0, zona.getBoundingClientRect().top + window.scrollY - arriba), behavior: 'smooth' });
    }, [ajustes.ajustar, escenario, faltaLetra]);

    const ajustada = ajustes.ajustar && encaje?.cabe;
    const tamano = ajustada ? encaje!.tamano : ajustes.tamano;
    const columnas = ajustada ? encaje!.columnas : ajustes.columnas;

    const cambiarTamano = (d: number) => {
        const nuevo = Math.min(TAMANO_MAX, Math.max(TAMANO_MIN, Math.round(tamano) + d));
        cambiar({ tamano: nuevo, ajustar: false, columnas: ajustada ? (Math.min(3, columnas) as 1 | 2 | 3) : ajustes.columnas });
    };

    // ---- Desplazamiento automático ----
    const duracion = cancion.duracion;
    const desplazable = useCallback(
        () => (escenario ? escenarioRef.current : (document.scrollingElement as HTMLElement | null)),
        [escenario],
    );
    useEffect(() => {
        if (!rodando) return;
        let raf = 0, ultimo = performance.now(), resto = 0;
        // La de los ajustes o, al ritmo de la canción, la que la baja entera en lo que dura
        const velocidad = velocidadAlDesplazar({ duracion, ajustes }, desplazable());
        // Al ritmo y desde el principio, espera la intro
        const intro = esperaDeIntro({ duracion, ajustes }, desplazable());
        if (intro) toast(`La hoja baja tras ${intro} s de intro`, { id: 'intro-hoja', duration: 2500 });
        const paso = (t: number) => {
            const el = desplazable();
            if (!el) return;
            resto += (velocidad * Math.min(100, t - ultimo)) / 1000;
            ultimo = t;
            const px = Math.floor(resto);
            if (px >= 1) { resto -= px; el.scrollTop += px; }
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) { setRodando(false); return; }
            raf = requestAnimationFrame(paso);
        };
        const empezar = setTimeout(() => { ultimo = performance.now(); raf = requestAnimationFrame(paso); }, intro * 1000);
        return () => { clearTimeout(empezar); cancelAnimationFrame(raf); if (intro) toast.dismiss('intro-hoja'); };
    }, [rodando, ajustes, duracion, desplazable]);

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

    // Elegir otro tono en la ficha: los acordes se mueven para que suene en ese tono
    const transporteHacia = (nuevo: string): Partial<AjustesCancion> | null => {
        const a = tonoNumero(tonoSuena), b = tonoNumero(nuevo);
        if (sinAcordes || !a || !b) return null;
        // De mayor a menor (o al revés) se compara con su relativo: Bm y D son los mismos acordes
        const destino = a.menor === b.menor ? b.raiz : b.raiz + (b.menor ? 3 : -3);
        const x = ajustes.semitonos + destino - a.raiz;
        return { semitonos: ((((x + 6) % 12) + 12) % 12) - 6 };
    };

    // ---- Editar el texto ahí mismo ----
    const editarEn = (linea: number, y: number | null) => {
        setRodando(false);
        setPanel(false);
        setEditando({ linea, y });
    };
    // Tocar la letra la abre para editar en la línea tocada (no en un acorde: eso enseña su diagrama)
    const alTocarHoja = (e: React.MouseEvent) => {
        const t = e.target as HTMLElement;
        if (t.closest('[data-acorde], a, button')) return;
        if (window.getSelection()?.toString()) return;
        const el = t.closest('[data-linea]');
        if (!el && !t.closest('[data-hoja-cancion]')) return;
        editarEn(lineaDelTexto(cancion.texto, el?.textContent ?? '', el), e.clientY);
    };
    const guardarTexto = (texto: string) => {
        const antes = { ...cancion, ajustes };
        guardar({ ...cancion, texto, ajustes });
        toast.success('Canción guardada', { action: { label: 'Deshacer', onClick: () => guardar(antes) } });
    };
    const cerrarEdicion = () => {
        // Que la canción siga a la misma altura al volver a pintarse
        const antes = zonaRef.current?.getBoundingClientRect().top ?? null;
        setEditando(null);
        requestAnimationFrame(() => {
            const ahora = zonaRef.current?.getBoundingClientRect().top;
            if (antes !== null && ahora !== undefined && ahora !== antes) window.scrollBy({ top: ahora - antes });
        });
    };

    const hoja = (ref?: React.Ref<HTMLDivElement>, className?: string) => (
        <SiFalla texto={cancion.texto} className={className}>
            <HojaCancion ref={ref} lineas={leida.lineas} opciones={opciones} vista={ajustes.vista}
                tamano={tamano} columnas={columnas} className={className} />
        </SiFalla>
    );
    const datosTono = tonoSuena && (
        <>Tono <b className="font-semibold text-foreground">{tonoSuena}</b>{ajustes.cejilla > 0 && <> · Cejilla {ajustes.cejilla}{posturas && ` (posturas de ${posturas})`}</>}</>
    );
    const pasoTono = (
        <Paso compacto etiqueta="Tono" onMenos={() => cambiarTono(-1)} onMas={() => cambiarTono(1)}
            menosDesactivado={sinAcordes} masDesactivado={sinAcordes}
            valor={<>{tonoSuena || 'Tono'}{ajustes.semitonos !== 0 && <span className="ml-1 text-[12px] text-muted-foreground">{ajustes.semitonos > 0 ? '+' : ''}{ajustes.semitonos}</span>}</>} />
    );
    const dameElTono = (className: string) => !!tonoSuena && (
        <DameElTono leida={leida} ajustes={ajustes} className={className}>Dame el tono</DameElTono>
    );
    const botonClaqueta = <BotonClaqueta bpm={cancion.bpm} />;
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
        <ConMenu activo={null}>
        <div className="pb-10">
            {/* Cabecera */}
            <div className="max-w-5xl mx-auto lg:max-w-none px-4 md:px-0 pt-3 md:pt-6">
                <div className="flex items-center justify-between gap-3">
                    <Link to="/cancionero" className="inline-flex items-center -ml-1.5 text-[15px] text-muted-foreground active:opacity-60">
                        <ChevronLeft className="h-5 w-5" /> Cancionero
                    </Link>
                    <span className="flex items-center gap-2">
                        <button onClick={() => editarEn(0, null)} aria-label="Editar el texto de la canción aquí" disabled={!!editando}
                            className="pulsable h-9 pl-3 pr-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 disabled:opacity-40">
                            <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <BotonBarra etiqueta="Modo escenario: a pantalla completa" onClick={entrarEscenario}>
                            <Maximize className="h-4 w-4" />
                        </BotonBarra>
                    </span>
                </div>
                <div className="mt-1 flex items-start gap-3">
                    {/* La portada; si hay muestra, al tocarla suenan 30 s de la grabación */}
                    {(cancion.portada || cancion.muestra) && (
                        <PortadaMuestra src={cancion.portada} titulo={cancion.titulo} muestra={cancion.muestra} tamano="cabecera" pararAlSalir />
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground">{cancion.titulo}</h1>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">
                            {cancion.version && <span className="font-semibold text-foreground">Versión {cancion.version}{(cancion.artista || datosTono) && ' · '}</span>}
                            {cancion.artista}{cancion.artista && datosTono && ' · '}{datosTono}
                        </p>
                    </div>
                </div>
                <FichaEnSitio cancion={cancion} onTono={transporteHacia} />
                <Versiones cancion={cancion} />
                {/* Las dos vistas de la cejilla: como suena o con las formas que se tocan */}
                {cejillaFormas > 0 && tonoSuena && !sinAcordes && (
                    <div className="mt-2.5 inline-flex p-1 rounded-full bg-fill gap-0.5" role="radiogroup" aria-label="Ver los acordes">
                        <button role="radio" aria-checked={ajustes.cejilla === 0} onClick={() => ajustes.cejilla !== 0 && cambiar({ cejilla: 0, cejillaGuardada: ajustes.cejilla })}
                            className={cn('h-8 px-3 rounded-full text-[13.5px] font-semibold', ajustes.cejilla === 0 ? 'bg-foreground text-background' : 'text-foreground')}>Suena en {tonoSuena}</button>
                        <button role="radio" aria-checked={ajustes.cejilla > 0} onClick={() => ajustes.cejilla === 0 && cambiar({ cejilla: cejillaFormas })}
                            className={cn('h-8 px-3 rounded-full text-[13.5px] font-semibold', ajustes.cejilla > 0 ? 'bg-foreground text-background' : 'text-foreground')}>Formas (cejilla {cejillaFormas})</button>
                    </div>
                )}
                {/* Las notas con formato de la canción */}
                {!notasVacias(cancion.notas) && (
                    <div className="mt-3 rounded-2xl bg-fill px-4 py-3">
                        <NotasRicas json={cancion.notas} className="text-[15px]" />
                    </div>
                )}
                {/* Lo de quien canta, antes de entrar: el tono y la cuenta */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {(!!tonoSuena || !!cancion.bpm) && dameElTono('h-9 pl-1.5 pr-3.5 text-[14px]')}
                    {(!!tonoSuena || !!cancion.bpm) && botonClaqueta}
                    {!sinAcordes && (
                        <button onClick={() => verAcordes([...new Set(leida.acordes.map(a => nombreAcorde(a, opciones)))].slice(0, 30))}
                            className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground">Ver acordes</button>
                    )}
                    <BotonWebs cancion={cancion} />
                    <BotonSpotify cancion={cancion} />
                    <BotonTareas de={`c:${cancion.id}`} />
                </div>
            </div>

            {/* La hoja */}
            <div className="max-w-5xl mx-auto lg:max-w-none px-4 md:px-0 mt-4">
                {/* Ficha o chuleta sin letra: buscarla, copiarla y pegarla, y entra en el tono del setlist */}
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
                <div ref={zonaRef} className={cn(ajustes.ajustar && !editando && 'min-h-[100dvh]')}
                    onClick={editando || rodando ? undefined : alTocarHoja}>
                    {editando ? (
                        <EditarEnSitio cancion={cancion} lineaInicial={editando.linea} yInicial={editando.y} tamano={tamano} onTamano={cambiarTamano}
                            onGuardar={guardarTexto} onCerrar={cerrarEdicion}
                            repertorioId={desdeRepertorio ?? undefined}
                            onNueva={n => navigate(`/cancionero/${n.id}${desdeRepertorio ? `?repertorio=${desdeRepertorio}` : ''}`, { replace: true })}
                            onNuevaDeshecha={() => navigate(`/cancionero/${cancion.id}${desdeRepertorio ? `?repertorio=${desdeRepertorio}` : ''}`, { replace: true })} />
                    ) : !escenario && hoja()}
                </div>
                {/* Ficha o chuleta sin letra: primero la canción; buscar y pegar la letra, plegado debajo */}
                {faltaLetra && (
                    verAnadir ? (
                        <div className="mt-4"><AnadirLetra cancion={cancion} ajustes={ajustes} onPegar={ponerLetra} /></div>
                    ) : (
                        <button onClick={() => setVerAnadir(true)} className="pulsable mt-4 w-full h-12 px-4 rounded-2xl bg-fill flex items-center gap-2 text-left">
                            <span className="text-[15px] font-semibold text-foreground">Falta la letra</span>
                            <span className="flex-1 truncate text-[14px] text-muted-foreground">· Buscarla o pegarla</span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                    )
                )}
                {leida.lineas.length === 0 && (
                    <p className="py-10 text-center text-[15px] text-muted-foreground">Esta canción está vacía.</p>
                )}
            </div>

            {/* Copia invisible para medir: solo con «que quepa» (pintar la canción dos veces cuesta el doble).
                El tamaño y las columnas los pone buscarEncaje: no sigue al de la hoja */}
            {ajustes.ajustar && (
                <div className="fixed left-0 top-0 h-0 w-0 overflow-hidden invisible" aria-hidden>
                    <HojaCancion ref={medidorRef} lineas={leida.lineas} opciones={opciones} vista={ajustes.vista} tamano={TAMANO_MAX} columnas={1} className="hidden" />
                </div>
            )}

            {/* Escenario: la canción a pantalla completa, sin nada más */}
            {escenario && createPortal(
                <div className="fixed inset-0 z-[90] bg-background text-foreground">
                    <div ref={escenarioRef} onClick={() => setControles(c => !c)}
                        className="h-full overflow-y-auto overscroll-contain px-5 md:px-10 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+110px)]">
                        <p className="text-[13px] font-semibold text-muted-foreground truncate">
                            {cancion.titulo}{tonoSuena && <> · {tonoSuena}</>}{ajustes.cejilla > 0 && <> · Cejilla {ajustes.cejilla}</>}
                        </p>
                        {!notasVacias(cancion.notas) && <NotasRicas json={cancion.notas} className="mt-2 text-[15px]" />}
                        <div ref={zonaEscenarioRef} className="mt-2">{hoja()}</div>
                    </div>
                    <div className={cn(
                        'fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+16px)] max-w-[calc(100vw-24px)] flex items-center gap-1.5 p-1.5 rounded-full bg-sheet border border-hairline shadow-e3 overflow-x-auto hide-scrollbar transition-all duration-200',
                        controles ? 'opacity-100' : 'opacity-0 translate-y-4 pointer-events-none',
                    )}>
                        {dameElTono('h-9 pl-1.5 pr-3.5 text-[14px]')}
                        {pasoTono}
                        {pasoTamano}
                        {botonAjustar}
                        {botonRodar}
                        {botonClaqueta}
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

            {/* La barra de la canción, abajo y al alcance del pulgar: cada botón abre UNA cosa */}
            {!escenario && !editando && (
                <div ref={barraRef} className="sticky bottom-0 z-20 mt-6 pb-safe bg-sheet border-t border-hairline">
                    <div className="max-w-xl mx-auto grid grid-cols-5 h-[60px]">
                        <BotonDeBarra etiqueta="Tono" activo={ajustes.semitonos !== 0} onClick={() => setPanelSeccion('tono')} desactivado={sinAcordes}>
                            <span className="text-[17px] font-bold leading-none">{tonoSuena || '—'}</span>
                        </BotonDeBarra>
                        <BotonDeBarra etiqueta={ajustes.cejilla ? `Cejilla ${ajustes.cejilla}` : 'Cejilla'} activo={ajustes.cejilla > 0} onClick={() => setPanelSeccion('cejilla')} desactivado={sinAcordes}>
                            <Guitar className="h-5 w-5" />
                        </BotonDeBarra>
                        <BotonDeBarra etiqueta="Ver" activo={ajustes.ajustar || ajustes.vista === 'letra' || ajustes.vista === 'acordes'} onClick={() => setPanelSeccion('ver')}>
                            <Eye className="h-5 w-5" />
                        </BotonDeBarra>
                        <BotonDeBarra etiqueta={rodando ? 'Parar' : 'Bajar'} activo={rodando} onClick={() => setRodando(r => !r)}>
                            {rodando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </BotonDeBarra>
                        <BotonDeBarra etiqueta="Más" onClick={() => setPanelSeccion('mas')}>
                            <MoreHorizontal className="h-5 w-5" />
                        </BotonDeBarra>
                    </div>
                </div>
            )}

            <HacerVersion cancion={cancion} abierta={versionando} onCerrar={() => setVersionando(false)} />
            {historial > 0 && <VersionesAnteriores key={historial} cancion={cancion} abierta onCerrar={() => setHistorial(0)} />}
            <PanelAjustes
                seccion={panel ?? undefined} abierto={panel !== null} onCerrar={() => setPanel(false)}
                onEscenario={() => { setPanel(false); entrarEscenario(); }}
                tamano={<div className="py-3 flex items-center justify-between gap-3"><p className="text-[15px] font-semibold text-foreground">Tamaño de la letra</p>{pasoTamano}</div>}
                ajustes={ajustes} cambiar={cambiar}
                tonoSuena={tonoSuena} posturas={posturas} recomendada={recomendada} formasRecomendadas={formasRecomendadas} dificilesAhora={dificilesAhora}
                onImprimir={() => { setPanel(false); setImprimiendo(true); }}
                onEditar={() => navigate(`/cancionero/${cancion.id}/editar`)}
                onBorrar={borrarCancion}
                onVersion={() => { setPanel(false); setVersionando(true); }}
                onVersiones={() => { setPanel(false); setHistorial(Date.now()); }}
                duracion={duracion} cantante={<AjustesCantante cancion={cancion} ajustes={ajustes} leida={leida} />}
            />
        </div>
        </ConMenu>
    );
}

// Las versiones de la misma canción (la tuya, la de Cataleya…) y cuál es la ⭐ favorita:
// la que sale primero al buscar y al añadir a un repertorio
function Versiones({ cancion }: { cancion: Cancion }) {
    const { canciones, guardarVarias } = useCancionero();
    const familia = versionesDe(cancion, canciones);
    if (familia.length < 2) return null;
    const marcar = () => {
        const yaLoEra = !!cancion.favorita;
        guardarVarias(familia.filter(c => (c.id === cancion.id ? true : c.favorita)).map(c => ({ ...c, favorita: c.id === cancion.id ? !yaLoEra || undefined : undefined })));
        toast.success(yaLoEra ? 'Ya no es la favorita' : '⭐ Esta versión sale primero');
    };
    return (
        <div className="mt-2 -mx-4 px-4 md:mx-0 md:px-0 flex flex-nowrap md:flex-wrap items-center gap-1.5 overflow-x-auto hide-scrollbar [&>*]:shrink-0 [&>*]:whitespace-nowrap">
            <span className="text-[13px] font-semibold text-muted-foreground">Versiones</span>
            {familia.map(c => (
                <Link key={c.id} to={`/cancionero/${c.id}`} replace aria-current={c.id === cancion.id ? 'page' : undefined}
                    className={unir('h-7 px-2.5 rounded-full text-[13px] font-semibold flex items-center', c.id === cancion.id ? 'bg-foreground text-background' : 'bg-fill-strong text-foreground')}>
                    {c.favorita && '⭐ '}{c.version || 'Original'}
                </Link>
            ))}
            <button onClick={marcar} className="h-7 px-2.5 rounded-full border border-hairline-strong text-[13px] font-semibold text-foreground active:opacity-60">
                {cancion.favorita ? 'Quitar ⭐' : '⭐ Favorita'}
            </button>
        </div>
    );
}

// Un botón de la barra de la canción: icono (o el tono) y su nombre debajo, como la barra de iOS
function BotonDeBarra({ etiqueta, activo, desactivado, onClick, children }: {
    etiqueta: string; activo?: boolean; desactivado?: boolean; onClick: () => void; children: React.ReactNode;
}) {
    return (
        <button type="button" onClick={onClick} disabled={desactivado} aria-label={etiqueta} aria-pressed={activo}
            className={cn('pulsable flex flex-col items-center justify-center gap-1 text-[11px] font-semibold disabled:opacity-30', activo ? 'text-foreground' : 'text-muted-foreground')}>
            <span className={cn('h-8 min-w-8 px-2 rounded-full flex items-center justify-center', activo ? 'bg-foreground text-background' : 'text-foreground')}>{children}</span>
            {etiqueta}
        </button>
    );
}

// Lo que tapa la cabecera de la app por arriba (en el móvil y en el ordenador)
function arribaLibre(): number {
    const cabecera = document.querySelector<HTMLElement>('header');
    return Math.max(0, cabecera?.getBoundingClientRect().bottom ?? 0) + 12;
}

// La línea del texto guardado que corresponde a la que se tocó (por su contenido; si no se
// encuentra, por su posición en la hoja)
function lineaDelTexto(texto: string, tocada: string, el: Element | null): number {
    const plano = (x: string) => x.replace(/\*\*|==|\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const buscada = plano(tocada);
    const lineas = texto.split('\n');
    if (el) {
        // Sin los acordes de encima: solo la letra de esa línea
        const copia = el.cloneNode(true) as Element;
        copia.querySelectorAll('[data-acorde]').forEach(n => n.remove());
        const letra = plano(copia.textContent ?? '');
        if (letra.length >= 3) {
            const i = lineas.findIndex(l => { const p = plano(l); return p.length >= 3 && p.includes(letra); });
            if (i >= 0) return i;
        }
    }
    if (buscada.length >= 3) {
        const i = lineas.findIndex(l => { const p = plano(l); return p.length >= 3 && (p.includes(buscada) || buscada.includes(p)); });
        if (i >= 0) return i;
    }
    if (el) {
        const todas = [...(el.closest('[data-hoja-cancion]') ?? document).querySelectorAll('[data-linea]')];
        const n = todas.indexOf(el);
        if (n >= 0 && todas.length) return Math.round((n / todas.length) * lineas.length);
    }
    return 0;
}

const NOTA: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function tonoNumero(t: string | null | undefined): { raiz: number; menor: boolean } | null {
    const m = /^\s*([A-G][#b]?)(m(?!aj))?/.exec(t ?? '');
    return m && NOTA[m[1]] !== undefined ? { raiz: NOTA[m[1]], menor: !!m[2] } : null;
}
