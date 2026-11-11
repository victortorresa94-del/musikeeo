import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { datosDelPegado, detectarTono, leerCancion, limpiarTexto, nombreTono, recortarCancion, separarCanciones } from '../../lib/acordes';
import { LIMITE_TEXTO } from '../../services/cancioneroService';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { Segmentado } from '../../components/cancionero/Controles';
import { AcordesRapidos } from '../../components/cancionero/AcordesRapidos';
import { EditorFicha } from '../../components/cancionero/EditorFicha';
import { FormatoLetra } from '../../components/cancionero/FormatoLetra';

// El editor de notas (Tiptap) va en su trozo: solo se baja al editar
const EditorNotas = lazy(() => import('../../components/notas/EditorNotas'));
import { ICONO, PASTEL, type Pastel } from '../../components/cancionero/estilo';
import type { Cancion, FichaCancion } from '../../types/cancionero';

const EJEMPLO = `Pega aquí la canción tal cual, con los acordes encima de la letra:

Am                 F
  Cierran la persiana del bar de la esquina,
C                       G
  queda media cerveza y una canción.

También vale con los acordes dentro: Cierran la [Am]persiana…`;

export default function EditarCancion() {
    const { id } = useParams();
    const { canciones, listo } = useCancionero();
    if (!id) return <Formulario />;
    if (!listo) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
    const cancion = canciones.find(c => c.id === id);
    return cancion ? <Formulario key={cancion.id} existente={cancion} /> : <Navigate to="/cancionero" replace />;
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
    const [ficha, setFicha] = useState<FichaCancion>(existente?.ficha ?? {});
    const [bpm, setBpm] = useState<number | undefined>(existente?.bpm);
    const [duracion, setDuracion] = useState<number | undefined>(existente?.duracion);
    const [notas, setNotas] = useState<string | undefined>(existente?.notas);
    const [leyendo, setLeyendo] = useState(false);
    const areaRef = useRef<HTMLTextAreaElement>(null);
    const archivoRef = useRef<HTMLInputElement>(null);
    // Desde «Editar ficha» se baja directo a la ficha
    useEffect(() => {
        if (window.location.hash === '#ficha') setTimeout(() => document.getElementById('ficha')?.scrollIntoView({ block: 'start' }), 50);
    }, []);

    const leida = useMemo(() => leerCancion(texto), [texto]);
    const tono = useMemo(() => detectarTono(leida.acordes), [leida]);
    const tonoTexto = tono ? nombreTono(tono, leida.meta.cejilla ?? 0, leida.acordes.filter(a => a.latina).length > leida.acordes.length / 2 ? 'latina' : 'americana', false) : null;
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
            if (t.trim()) meter(t);
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
            guardar({ ...existente, ...datos, titulo: datos.titulo || existente.titulo, ficha: fichaLimpia, bpm, duracion, notas });
            navigate(`/cancionero/${existente.id}`, { replace: true });
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

    const previa = (
        <div className="rounded-2xl border border-hairline p-4 min-h-[50dvh]">
            {leida.lineas.length
                ? <HojaCancion lineas={leida.lineas} opciones={{ semitonos: 0, notacion: 'original', bemoles: null }} vista="completa" tamano={16} columnas={1} />
                : <p className="text-[15px] text-muted-foreground">Aquí verás cómo queda.</p>}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-0 pt-3 md:pt-6 pb-32 md:pb-16">
            <div className="flex items-center justify-between gap-3">
                <button onClick={() => navigate(existente ? `/cancionero/${existente.id}` : repertorio ? `/cancionero/repertorio/${repertorio.id}` : '/cancionero')} className="text-[15px] text-muted-foreground active:opacity-60">Cancelar</button>
                <p className="text-[16px] font-semibold text-foreground">{existente ? 'Editar canción' : 'Nueva canción'}</p>
                <span className="w-[62px]" />
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
                <input value={titulo} onChange={e => setTitulo(e.target.value.slice(0, 120))} placeholder="Título" aria-label="Título"
                    className="h-12 rounded-2xl bg-fill px-4 text-[16px] font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                <input value={artista} onChange={e => setArtista(e.target.value.slice(0, 120))} placeholder="Artista (opcional)" aria-label="Artista"
                    className="h-12 rounded-2xl bg-fill px-4 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>

            {/* Las tres maneras de meter la canción, grandes y con su objeto 3D */}
            <div className={cn('mt-4 grid gap-2', existente ? 'grid-cols-2' : 'grid-cols-3')}>
                <Accion icono={ICONO.repertorios} titulo="Pegar" sub="Lo copiado de una web" pastel={PASTEL.lavanda} onClick={pegar} />
                <Accion icono={ICONO.importar} titulo="Abrir archivo" sub="PDF, Word o texto" pastel={PASTEL.melocoton} onClick={() => archivoRef.current?.click()} cargando={leyendo} />
                {!existente && (
                    <Accion icono={ICONO.escuchar} titulo="Desde un audio" sub="Saca los acordes" pastel={PASTEL.menta}
                        href={`/cancionero/escuchar${repertorio ? `?repertorio=${repertorio.id}` : ''}`} />
                )}
            </div>
            <input ref={archivoRef} type="file" className="hidden" aria-label="Abrir archivo (PDF, Word o texto)"
                accept=".txt,.cho,.chopro,.chordpro,.crd,.pro,text/plain,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
                onChange={e => { void abrir(e.target.files?.[0]); e.target.value = ''; }} />

            {!existente && (
                <div className="mt-4">
                    <p className="mb-1.5 text-[13px] font-semibold text-muted-foreground">Buscar los acordes en</p>
                    <div className="-mx-4 px-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                        {BUSCADORES.map(([nombre, logo, url]) => (
                            <a key={nombre} href={titulo.trim() ? url(`${titulo} ${artista}`.trim()) : undefined} target="_blank" rel="noopener noreferrer"
                                onClick={e => { if (!titulo.trim()) { e.preventDefault(); toast('Escribe primero el título de la canción.'); } }}
                                className="pulsable h-11 pl-1.5 pr-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-2">
                                <img src={logo} alt="" aria-hidden className="h-8 w-8 rounded-full object-cover bg-sheet" />
                                {nombre} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-3 md:hidden">
                <Segmentado etiqueta="Ver" valor={pestana} onCambio={setPestana} opciones={[['texto', 'Texto'], ['previa', 'Cómo queda']] as const} />
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className={cn('min-w-0', pestana !== 'texto' && 'hidden md:block')}>
                    <FormatoLetra areaRef={areaRef} texto={texto} onCambio={setTexto} />
                    <textarea
                        ref={areaRef}
                        value={texto}
                        onChange={e => setTexto(e.target.value)}
                        onPaste={e => {
                            if (texto.trim()) return;
                            e.preventDefault();
                            meter(e.clipboardData.getData('text/plain'));
                        }}
                        placeholder={EJEMPLO}
                        wrap="off"
                        spellCheck={false}
                        aria-label="Letra y acordes"
                        className={cn('w-full md:min-h-[60vh] rounded-2xl', texto.trim() ? 'min-h-[50dvh]' : 'min-h-[28dvh]', 'bg-fill p-4 font-mono text-[14px] leading-[1.45] text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-foreground/10')}
                    />
                    <p className={cn('mt-1.5 text-[13px]', demasiado ? 'text-destructive' : 'text-muted-foreground')}>
                        {demasiado
                            ? 'Es demasiado largo para una canción.'
                            : leida.acordes.length
                                ? `${leida.acordes.length} acordes${tono ? ` · Tono ${nombreTono(tono, leida.meta.cejilla ?? 0, leida.acordes.filter(a => a.latina).length > leida.acordes.length / 2 ? 'latina' : 'americana', false)}` : ''}`
                                : !texto.trim() && titulo.trim() ? 'Puedes guardarla ya solo con el título y su ficha, y pegar la letra luego.'
                                : texto.trim() ? 'Aún no vemos acordes: tienen que ir en su línea, encima de la letra, o entre corchetes como [Am].' : 'Lo que no sea la canción (anuncios, botones) lo puedes borrar aquí.'}
                    </p>
                    <AcordesRapidos texto={texto} onCambio={setTexto} />
                </div>
                <div className={cn(pestana !== 'previa' && 'hidden md:block')}>{previa}</div>
            </div>

            {/* Notas con formato: lo que quieras apuntar de la canción, a tu manera */}
            <section className="mt-6" aria-labelledby="titulo-notas">
                <h2 id="titulo-notas" className="text-[17px] font-bold text-foreground">Notas de la canción</h2>
                <p className="mt-0.5 mb-2 text-[13px] text-muted-foreground">Títulos, negritas, colores, avisos y casillas. Salen en la canción, en Tocar y en el enlace para el grupo. Pulsa «/» para meter un bloque.</p>
                <div className="rounded-2xl border border-hairline p-3 md:p-4">
                    <Suspense fallback={<div className="min-h-32" />}>
                        <EditorNotas valor={notas} onCambio={setNotas} placeholder="Ej.: Entra la batería en el segundo estribillo. Final: parón y «¡Olé!»…" />
                    </Suspense>
                </div>
            </section>

            <div className="mt-5 md:max-w-xl">
                <EditorFicha ficha={ficha} onCambio={setFicha} canciones={canciones} tonoDetectado={tonoTexto} bpm={bpm} onBpm={setBpm} duracion={duracion} onDuracion={setDuracion} />
            </div>

            {/* Ordenador: al final. Móvil: fija encima de la barra de navegación */}
            <button onClick={guardarCancion} disabled={!puedeGuardar}
                className="hidden md:block pulsable mt-5 px-10 h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] disabled:opacity-40">
                Guardar canción
            </button>
            {createPortal(
                <div className="md:hidden fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-[45] px-4 py-3 bg-chrome backdrop-blur-2xl border-t border-hairline">
                    <button onClick={guardarCancion} disabled={!puedeGuardar}
                        className="pulsable w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] disabled:opacity-40">
                        Guardar canción
                    </button>
                </div>,
                document.body,
            )}
        </div>
    );
}
