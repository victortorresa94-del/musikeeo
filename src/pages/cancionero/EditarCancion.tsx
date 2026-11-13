import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ExternalLink, FileText, Guitar, Link2, Loader2, Music2, NotebookPen, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { datosDelPegado, detectarTono, leerCancion, limpiarTexto, nombreTono, recortarCancion, separarCanciones } from '../../lib/acordes';
import { LIMITE_TEXTO } from '../../services/cancioneroService';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { Segmentado } from '../../components/cancionero/Controles';
import { AcordesRapidos } from '../../components/cancionero/AcordesRapidos';
import { Bloque, Campo, FichaBolo, FichaEnlace, FichaMusica } from '../../components/cancionero/EditorFicha';
import { claseCampo, resumenBolo, resumenEnlace, resumenMusica } from '../../components/cancionero/fichaResumen';
import { notasVacias, textoDeNotas } from '../../lib/notas';
import { textoPegado } from '../../lib/pegado';
import { FormatoLetra } from '../../components/cancionero/FormatoLetra';
import { ImportarCanciones } from '../../components/cancionero/ImportarCanciones';
import { fichaSegura, leerCopia } from '../../lib/biblioteca';
import { SiFalla } from '../../components/cancionero/SiFalla';
import { Sentry } from '../../lib/sentry';
import type EditorNotasTipo from '../../components/notas/EditorNotas';

// El editor de notas (Tiptap) va en su trozo: solo se baja al editar. Si ese trozo no llega (se
// publicó otra versión de la app mientras la tenías abierta, sin cobertura…), las notas no se
// pueden tocar ahora pero el resto se edita y se guarda igual: la pantalla no se cae
const EditorNotas = lazy(() => import('../../components/notas/EditorNotas')
    .catch(() => ({ default: NotasNoDisponibles as typeof EditorNotasTipo })));

function NotasNoDisponibles() {
    return <p className="text-[14px] text-muted-foreground">Las notas no se pueden editar ahora. Lo demás se guarda igual; para tocarlas, cierra la app y vuelve a abrirla.</p>;
}

// Si algo de la pantalla falla, falla solo eso (con su aviso) y no la app entera
class Aguanta extends Component<{ donde: string; fallback: ReactNode; children: ReactNode }, { fallo: boolean }> {
    state = { fallo: false };
    static getDerivedStateFromError() { return { fallo: true }; }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[cancionero] falló ${this.props.donde}`, error, info.componentStack);
        Sentry.withScope(scope => { scope.setTag('donde', this.props.donde); scope.setExtras({ componentStack: info.componentStack }); Sentry.captureException(error); });
    }
    render() { return this.state.fallo ? this.props.fallback : this.props.children; }
}

function NoAbre({ id }: { id: string }) {
    return (
        <div className="max-w-md mx-auto px-6 py-20 text-center">
            <p className="text-[17px] font-semibold text-foreground">No se ha podido abrir el editor</p>
            <p className="mt-2 text-[15px] text-muted-foreground">La canción sigue guardada tal cual. Vuelve a ella y prueba otra vez.</p>
            <div className="mt-5 flex items-center justify-center gap-2">
                <Link to={`/cancionero/${id}`} replace className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold inline-flex items-center">Volver a la canción</Link>
                <button type="button" onClick={() => window.location.reload()} className="pulsable h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold">Recargar</button>
            </div>
        </div>
    );
}
import { ICONO, PASTEL, type Pastel } from '../../components/cancionero/estilo';
import type { Cancion, FichaCancion } from '../../types/cancionero';
import { mover as moverEnTablero, type CampoTablero } from '../../lib/tablero';

const EJEMPLO = `Pega aquí la canción tal cual, con los acordes encima de la letra:

Am                 F
  Cierran la persiana del bar de la esquina,
C                       G
  queda media cerveza y una canción.

También vale con los acordes dentro: Cierran la [Am]persiana…`;

const OPCIONES_PREVIA = { semitonos: 0, notacion: 'original', bemoles: null } as const;

// Los bloques del formulario, en su orden: primero los datos de la ficha y luego la canción
type IdBloque = 'basico' | 'musica' | 'bolo' | 'enlaces' | 'letra' | 'notas';
const BLOQUES: [IdBloque, string][] = [['basico', 'Lo básico'], ['musica', 'Música'], ['bolo', 'Bolo'], ['enlaces', 'Enlaces'], ['letra', 'Letra'], ['notas', 'Notas']];

// Volver a donde se estaba (la canción, la lista…) por el historial: así «Atrás» no vuelve al editor
const hayAtras = () => (window.history.state?.idx ?? 0) > 0;

export default function EditarCancion() {
    const { id } = useParams();
    const { canciones, listo } = useCancionero();
    if (!id) return <Formulario />;
    if (!listo) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
    const cancion = canciones.find(c => c.id === id);
    if (!cancion) return <Navigate to="/cancionero" replace />;
    return (
        <Aguanta key={cancion.id} donde="el editor de la canción" fallback={<NoAbre id={cancion.id} />}>
            <Formulario existente={cancion} />
        </Aguanta>
    );
}

// Buscar la canción en las webs de acordes (se abre aparte; luego se copia y se pega aquí)
const BUSCADORES = [
    ['Google', '/images/marcas/google.png', (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} acordes`)}`],
    ['LaCuerda', '/images/marcas/lacuerda.png', (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} site:lacuerda.net`)}`],
    ['Ultimate Guitar', '/images/marcas/ultimate-guitar.png', (q: string) => `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(q)}`],
    ['Cifra Club', '/images/marcas/cifraclub.png', (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} site:cifraclub.com`)}`],
    ['Chordify', '/images/marcas/chordify.png', (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} site:chordify.net`)}`],
] as const;

// Una acción grande con su objeto 3D, como las baldosas del inicio del Cancionero
function Accion({ icono, titulo, sub, pastel, onClick, href, cargando }: {
    icono: string; titulo: string; sub: string; pastel: Pastel; onClick?: () => void; href?: string; cargando?: boolean;
}) {
    const dentro = (
        <>
            <img src={icono} alt="" aria-hidden draggable={false} className="h-14 w-14 md:h-12 md:w-12 shrink-0 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
            <span className="min-w-0">
                <span className="block text-[15px] font-bold leading-tight text-foreground">{cargando ? 'Leyendo…' : titulo}</span>
                <span className="block text-[12.5px] leading-snug text-foreground/65">{sub}</span>
            </span>
        </>
    );
    const clase = cn('pulsable min-h-[76px] rounded-[18px] pl-1.5 pr-3 py-2 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-left', pastel.fondo);
    return href
        ? <Link to={href} className={clase}>{dentro}</Link>
        : <button type="button" onClick={onClick} disabled={cargando} className={clase}>{dentro}</button>;
}

function Formulario({ existente }: { existente?: Cancion }) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { crear, guardar, repertorios, guardarRepertorio, canciones } = useCancionero();
    // Desde un repertorio: la canción nueva entra en él y se vuelve allí
    const repertorio = repertorios.find(r => r.id === params.get('repertorio'));
    const [titulo, setTitulo] = useState(existente?.titulo ?? '');
    const [artista, setArtista] = useState(existente?.artista ?? '');
    const [texto, setTexto] = useState(existente?.texto ?? '');
    const [pestana, setPestana] = useState<'texto' | 'previa'>('texto');
    // Desde «Añadir aquí» de una columna de Bloques: la ficha ya trae ese dato
    const [ficha, setFicha] = useState<FichaCancion>(() => {
        if (existente) return fichaSegura(existente.ficha);
        const v = params.get('valor')?.slice(0, 40);
        if (!v) return {};
        const campo = params.get('campo') as CampoTablero | null;
        return campo && campo !== 'bloque' ? moverEnTablero({ ficha: {} } as Cancion, campo, '', v).ficha ?? {} : {};
    });
    const [bpm, setBpm] = useState<number | undefined>(existente?.bpm);
    const [duracion, setDuracion] = useState<number | undefined>(existente?.duracion);
    const [notas, setNotas] = useState<string | undefined>(existente?.notas);
    const [leyendo, setLeyendo] = useState(false);
    // Lo que cambia fuera mientras el formulario está abierto se coge si aquí no lo has tocado. Pasaba
    // al editar la letra en su sitio y tocar el lápiz de la ficha: lo escrito se guardaba al salir,
    // pero este formulario ya se había abierto con el texto de antes y «Guardar» lo borraba
    const vista = useRef(existente);
    useEffect(() => {
        const antes = vista.current;
        if (!existente || !antes || existente === antes) return;
        vista.current = existente;
        setTexto(t => (t === antes.texto ? existente.texto : t));
        setTitulo(t => (t === antes.titulo ? existente.titulo : t));
        setArtista(a => (a === antes.artista ? existente.artista : a));
        setNotas(n => (n === antes.notas ? existente.notas : n));
        setFicha(f => (JSON.stringify(f) === JSON.stringify(fichaSegura(antes.ficha)) ? fichaSegura(existente.ficha) : f));
    }, [existente]);
    const [copia, setCopia] = useState<string | null>(null);
    const areaRef = useRef<HTMLTextAreaElement>(null);
    const archivoRef = useRef<HTMLInputElement>(null);
    // Tu versión de la canción («Cataleya», «Víctor»): su nombre se puede cambiar aquí
    const [version, setVersion] = useState(existente?.version ?? '');

    // Los bloques abiertos. Una canción nueva: lo básico y la letra (el resto, cuando quieras).
    // Desde el lápiz de la ficha (#ficha): la música y el bolo, que es lo que se va a tocar
    const desdeFicha = typeof window !== 'undefined' && window.location.hash === '#ficha';
    const [abiertos, setAbiertos] = useState<Record<IdBloque, boolean>>(() => ({
        basico: !desdeFicha,
        musica: !!existente || !!resumenMusica(ficha, bpm, duracion),
        bolo: !!existente || !!resumenBolo(ficha),
        enlaces: !!ficha.enlace,
        letra: !desdeFicha || !texto.trim(),
        notas: !notasVacias(notas),
    }));
    const alternar = (b: IdBloque) => setAbiertos(a => ({ ...a, [b]: !a[b] }));
    const irA = (b: IdBloque) => {
        setAbiertos(a => ({ ...a, [b]: true }));
        requestAnimationFrame(() => document.getElementById(`bloque-${b}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    // Desde «Editar ficha» se baja directo a la ficha
    useEffect(() => {
        if (desdeFicha) setTimeout(() => document.getElementById('bloque-musica')?.scrollIntoView({ block: 'start' }), 60);
    }, [desdeFicha]);

    const leida = useMemo(() => leerCancion(texto), [texto]);
    // El tono que dicen los acordes es una ayuda: si algo raro lo impide, se sigue sin él
    const tono = useMemo(() => { try { return detectarTono(leida.acordes); } catch { return null; } }, [leida]);
    const tonoTexto = useMemo(() => {
        if (!tono) return null;
        try { return nombreTono(tono, leida.meta.cejilla ?? 0, leida.acordes.filter(a => a.latina).length > leida.acordes.length / 2 ? 'latina' : 'americana', false); } catch { return null; }
    }, [tono, leida]);
    const demasiado = texto.length > LIMITE_TEXTO;
    // Una ficha sin letra también vale (título y su tono): la letra se pega luego
    const puedeGuardar = (!!texto.trim() || !!titulo.trim()) && !demasiado;

    // Lo pegado se limpia y, si trae título, artista o cejilla, se aprovechan
    const meter = (crudo: string) => {
        let limpio = limpiarTexto(crudo);
        const datos = datosDelPegado(limpio);
        if (datos.primeraLineaEsTitulo) limpio = limpio.split('\n').slice(1).join('\n').replace(/^\n+/, '');
        // Solo letra copiada de una web con «Seleccionar todo»: fuera menús, botones y créditos
        if (!leerCancion(limpio).acordes.length) limpio = recortarCancion(limpio);
        if (datos.titulo && !titulo.trim()) setTitulo(datos.titulo);
        if (datos.artista && !artista.trim()) setArtista(datos.artista);
        setTexto(limpio);
    };

    const pegar = async () => {
        try {
            const t = await navigator.clipboard.readText();
            if (leerCopia(t)) setCopia(t);
            else if (t.trim()) meter(t);
            else toast('No hay nada copiado. Copia la canción en la web y vuelve.');
        } catch {
            toast('Mantén pulsado el recuadro y elige «Pegar».');
        }
    };

    // Texto, ChordPro, Word o PDF (el lector de Word y PDF se baja la primera vez que se usa)
    const abrir = async (f?: File) => {
        if (!f || leyendo) return;
        setLeyendo(true);
        try {
            const { textoDeArchivo } = await import('../../lib/documentos');
            const leido = await textoDeArchivo(f);
            // Una copia del cancionero (.json, aunque llegue como .txt o sin extensión): a Importar
            if (leerCopia(leido)) { setCopia(leido); return; }
            const varias = separarCanciones(leido);
            const primera = varias[0];
            if (varias.length > 1) toast(`El archivo trae ${varias.length} canciones: aquí va la primera. Para meterlas todas, usa «Importar» en el Cancionero.`);
            meter(primera ? primera.texto : leido);
            if (!titulo.trim()) setTitulo(primera && primera.titulo !== 'Sin título' ? primera.titulo : f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
            if (primera?.artista && !artista.trim()) setArtista(primera.artista);
        } catch (e) {
            toast.error(`No se pudo abrir «${f.name}»: ${e instanceof Error ? e.message : 'error desconocido'}`);
        } finally {
            setLeyendo(false);
        }
    };

    const guardarCancion = () => {
        const datos = { titulo: titulo.trim(), artista: artista.trim(), texto: limpiarTexto(texto) };
        const fichaLimpia = Object.keys(ficha).length ? ficha : undefined;
        if (existente) {
            guardar({ ...existente, ...datos, titulo: datos.titulo || existente.titulo, ficha: fichaLimpia, bpm, duracion, notas, ...(existente.version ? { version: version.trim().slice(0, 40) || existente.version } : {}) });
            // De vuelta a la canción por el historial (si se vino de ella): así «Atrás» no vuelve aquí
            if (hayAtras()) navigate(-1); else navigate(`/cancionero/${existente.id}`, { replace: true });
        } else {
            const c = guardar({ ...crear(datos), ficha: fichaLimpia, bpm, duracion, notas });
            if (repertorio) {
                guardarRepertorio({ ...repertorio, canciones: [...repertorio.canciones, c.id] });
                toast.success(`Añadida a «${repertorio.nombre}»`);
                navigate(`/cancionero/repertorio/${repertorio.id}`, { replace: true });
            } else {
                navigate(`/cancionero/${c.id}`, { replace: true });
            }
        }
    };

    // ⌘S / Ctrl+S guarda (en el ordenador, sin buscar el botón)
    const guardarRef = useRef(guardarCancion);
    guardarRef.current = guardarCancion;
    const puedeRef = useRef(puedeGuardar);
    puedeRef.current = puedeGuardar;
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (puedeRef.current) guardarRef.current(); }
        };
        window.addEventListener('keydown', f);
        return () => window.removeEventListener('keydown', f);
    }, []);

    const previa = (
        <div className="rounded-2xl border border-hairline p-4 min-h-[50dvh]">
            {leida.lineas.length
                ? <SiFalla texto={texto}><HojaCancion lineas={leida.lineas} opciones={OPCIONES_PREVIA} vista="completa" tamano={16} columnas={1} /></SiFalla>
                : <p className="text-[15px] text-muted-foreground">Aquí verás cómo queda.</p>}
        </div>
    );

    const resumenLetra = !texto.trim() ? '' : leida.acordes.length
        ? `${leida.acordes.length} acordes${tonoTexto ? ` · Tono ${tonoTexto}` : ''}`
        : `${texto.trim().split('\n').length} líneas, sin acordes`;
    const resumenNotas = notasVacias(notas) ? '' : textoDeNotas(notas).replace(/\s+/g, ' ').slice(0, 80);
    const botonGuardar = (clase: string, texto: string) => (
        <button type="button" onClick={guardarCancion} disabled={!puedeGuardar} className={cn('pulsable bg-primary text-primary-foreground font-semibold disabled:opacity-40', clase)}>{texto}</button>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-0 pt-3 md:pt-6 pb-32 md:pb-16">
            <div className="flex items-center justify-between gap-3">
                <button onClick={() => (hayAtras() ? navigate(-1) : navigate(existente ? `/cancionero/${existente.id}` : repertorio ? `/cancionero/repertorio/${repertorio.id}` : '/cancionero', { replace: true }))} className="text-[15px] text-muted-foreground active:opacity-60">Cancelar</button>
                <p className="min-w-0 truncate text-[16px] font-semibold text-foreground">{existente ? `Editar «${existente.titulo}»` : 'Nueva canción'}</p>
                <span className="w-[62px]" />
            </div>

            {/* Lo que se puede tocar aquí, de un vistazo, y el botón de guardar siempre a mano (en el móvil, abajo) */}
            <nav aria-label="Partes de la canción"
                className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] md:top-14 z-20 -mx-4 md:mx-0 mt-3 px-4 md:px-0 py-2 bg-chrome backdrop-blur-2xl border-b border-hairline flex items-center gap-2">
                <div className="flex-1 min-w-0 -mr-4 pr-4 md:mr-0 md:pr-0 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                    {BLOQUES.map(([b, nombre]) => (
                        <button key={b} type="button" onClick={() => irA(b)} className="pulsable h-9 shrink-0 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground">{nombre}</button>
                    ))}
                </div>
                {botonGuardar('hidden md:block h-9 px-5 rounded-full text-[15px] shrink-0', 'Guardar')}
            </nav>

            <div className="mt-4 space-y-3">
                <Bloque id="basico" titulo="Lo básico" icono={FileText} pastel={PASTEL.cielo} abierto={abiertos.basico} onAlternar={() => alternar('basico')}
                    ayuda="Cómo se llama y de quién es" resumen={[titulo.trim() || 'Sin título', artista.trim(), existente?.version && `Versión ${version || existente.version}`].filter(Boolean).join(' · ')}>
                    <div className="grid gap-3 md:grid-cols-2">
                        <Campo etiqueta="Título" para="cancion-titulo" ayuda={!existente && !titulo.trim() ? 'Si lo dejas vacío, se coge de lo que pegues.' : undefined}>
                            <input id="cancion-titulo" value={titulo} onChange={e => setTitulo(e.target.value.slice(0, 120))} placeholder="Ej.: Bamboléo"
                                className={cn(claseCampo, 'font-semibold placeholder:font-medium')} />
                        </Campo>
                        <Campo etiqueta="Artista" para="cancion-artista">
                            <input id="cancion-artista" value={artista} onChange={e => setArtista(e.target.value.slice(0, 120))} placeholder="Opcional" className={claseCampo} />
                        </Campo>
                    </div>
                    {existente?.version && (
                        <Campo etiqueta="Nombre de tu versión" para="cancion-version" ayuda="Es una copia de la original, con su letra, su tono y su ficha.">
                            <input id="cancion-version" value={version} onChange={e => setVersion(e.target.value.slice(0, 40))} placeholder={existente.version} className={cn(claseCampo, 'md:max-w-sm')} />
                        </Campo>
                    )}
                </Bloque>

                <Bloque id="musica" titulo="La música" icono={Music2} pastel={PASTEL.lavanda} abierto={abiertos.musica} onAlternar={() => alternar('musica')}
                    ayuda="Tono, cejilla, tempo y duración" resumen={resumenMusica(ficha, bpm, duracion)}>
                    <FichaMusica ficha={ficha} onCambio={setFicha} tonoDetectado={tonoTexto} bpm={bpm} onBpm={setBpm} duracion={duracion} onDuracion={setDuracion} />
                </Bloque>

                <Bloque id="bolo" titulo="Para el bolo" icono={Users} pastel={PASTEL.menta} abierto={abiertos.bolo} onAlternar={() => alternar('bolo')}
                    ayuda="Quién canta, grupo y estilo" resumen={resumenBolo(ficha)}>
                    <FichaBolo ficha={ficha} onCambio={setFicha} canciones={canciones} />
                </Bloque>

                <Bloque id="enlaces" titulo="Enlaces" icono={Link2} pastel={PASTEL.rosa} abierto={abiertos.enlaces} onAlternar={() => alternar('enlaces')}
                    ayuda="La web donde están sus acordes" resumen={resumenEnlace(ficha)}>
                    <FichaEnlace ficha={ficha} onCambio={setFicha} />
                </Bloque>

                <Bloque id="letra" titulo="Letra y acordes" icono={Guitar} pastel={PASTEL.melocoton} abierto={abiertos.letra} onAlternar={() => alternar('letra')}
                    ayuda="Pégala o ábrela de un archivo" resumen={resumenLetra}>
                    {/* Las maneras de meter la canción, grandes y con su objeto 3D */}
                    <div className={cn('grid gap-2', existente ? 'grid-cols-2' : 'grid-cols-3')}>
                        <Accion icono={ICONO.repertorios} titulo="Pegar" sub="Lo copiado de una web" pastel={PASTEL.lavanda} onClick={pegar} />
                        <Accion icono={ICONO.importar} titulo="Abrir archivo" sub="PDF, Word o texto" pastel={PASTEL.melocoton} onClick={() => archivoRef.current?.click()} cargando={leyendo} />
                        {!existente && (
                            <Accion icono={ICONO.escuchar} titulo="Desde un audio" sub="Saca los acordes" pastel={PASTEL.menta}
                                href={`/cancionero/escuchar${repertorio ? `?repertorio=${repertorio.id}` : ''}`} />
                        )}
                    </div>
                    <input ref={archivoRef} type="file" className="hidden" aria-label="Abrir archivo (PDF, Word o texto)"
                        accept=".txt,.json,application/json,.cho,.chopro,.chordpro,.crd,.pro,text/plain,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
                        onChange={e => { void abrir(e.target.files?.[0]); e.target.value = ''; }} />

                    {!existente && (
                        <Campo etiqueta="Buscar los acordes en">
                            <div className="-mx-3.5 px-3.5 md:-mx-4 md:px-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                                {BUSCADORES.map(([nombre, logo, url]) => (
                                    <a key={nombre} href={titulo.trim() ? url(`${titulo} ${artista}`.trim()) : undefined} target="_blank" rel="noopener noreferrer"
                                        onClick={e => { if (!titulo.trim()) { e.preventDefault(); toast('Escribe primero el título de la canción.'); } }}
                                        className="pulsable h-11 pl-1.5 pr-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-2">
                                        <img src={logo} alt="" aria-hidden className="h-8 w-8 rounded-full object-cover bg-sheet" />
                                        {nombre} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    </a>
                                ))}
                            </div>
                        </Campo>
                    )}

                    <div className="md:hidden">
                        <Segmentado etiqueta="Ver" valor={pestana} onCambio={setPestana} opciones={[['texto', 'Texto'], ['previa', 'Cómo queda']] as const} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className={cn('min-w-0', pestana !== 'texto' && 'hidden md:block')}>
                            <FormatoLetra areaRef={areaRef} texto={texto} onCambio={setTexto} />
                            <textarea
                                ref={areaRef}
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                onPaste={e => {
                                    if (texto.trim()) return;
                                    e.preventDefault();
                                    const pegado = textoPegado(e.clipboardData);
                                    if (leerCopia(pegado)) { setCopia(pegado); return; }
                                    meter(pegado);
                                }}
                                placeholder={EJEMPLO}
                                wrap="off"
                                spellCheck={false}
                                aria-label="Letra y acordes"
                                aria-describedby="cancion-letra-ayuda"
                                className={cn('w-full md:min-h-[60vh] rounded-2xl', texto.trim() ? 'min-h-[50dvh]' : 'min-h-[28dvh]', 'bg-fill p-4 font-mono text-[14px] leading-[1.45] text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-foreground/10')}
                            />
                            <p id="cancion-letra-ayuda" className={cn('mt-1.5 text-[13px]', demasiado ? 'text-destructive' : 'text-muted-foreground')}>
                                {demasiado
                                    ? 'Es demasiado largo para una canción.'
                                    : leida.acordes.length
                                        ? `${leida.acordes.length} acordes${tonoTexto ? ` · Tono ${tonoTexto}` : ''}`
                                        : !texto.trim() && titulo.trim() ? 'Puedes guardarla ya solo con el título y su ficha, y pegar la letra luego.'
                                        : texto.trim() ? 'Aún no vemos acordes: tienen que ir en su línea, encima de la letra, o entre corchetes como [Am].' : 'Lo que no sea la canción (anuncios, botones) lo puedes borrar aquí.'}
                            </p>
                            <AcordesRapidos texto={texto} onCambio={setTexto} />
                        </div>
                        <div className={cn(pestana !== 'previa' && 'hidden md:block')}>{previa}</div>
                    </div>
                </Bloque>

                <Bloque id="notas" titulo="Notas" icono={NotebookPen} pastel={PASTEL.mantequilla} abierto={abiertos.notas} onAlternar={() => alternar('notas')}
                    ayuda="Entradas, finales y avisos" resumen={resumenNotas}>
                    <div>
                        <div className="rounded-2xl border border-hairline p-3 md:p-4">
                            <Aguanta donde="las notas de la canción" fallback={<NotasNoDisponibles />}>
                                <Suspense fallback={<div className="min-h-32" />}>
                                    <EditorNotas valor={notas} onCambio={setNotas} placeholder="Ej.: Entra la batería en el segundo estribillo. Final: parón y «¡Olé!»…" />
                                </Suspense>
                            </Aguanta>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">Salen en la canción, en Tocar y en el enlace del grupo. Pulsa «/» para meter un título, un aviso o casillas.</p>
                    </div>
                </Bloque>
            </div>

            {copia !== null && <ImportarCanciones key={copia.length} abierto onCerrar={() => setCopia(null)} textoInicial={copia} />}
            {/* Móvil: el botón, fijo abajo (aquí no va la barra de la app) */}
            {createPortal(
                <div className="md:hidden fixed inset-x-0 bottom-0 z-[45] px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-chrome backdrop-blur-2xl border-t border-hairline">
                    {botonGuardar('w-full h-[52px] rounded-[14px] text-[16px]', 'Guardar canción')}
                </div>,
                document.body,
            )}
        </div>
    );
}
