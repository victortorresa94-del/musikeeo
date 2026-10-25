import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardPaste, ExternalLink, FileUp, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { datosDelPegado, detectarTono, leerCancion, limpiarTexto, nombreTono, recortarCancion } from '../../lib/acordes';
import { LIMITE_TEXTO } from '../../services/cancioneroService';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { Segmentado } from '../../components/cancionero/Controles';
import type { Cancion } from '../../types/cancionero';

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
    ['Google', (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} acordes`)}`],
    ['LaCuerda', (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} site:lacuerda.net`)}`],
    ['Ultimate Guitar', (q: string) => `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(q)}`],
] as const;

function Formulario({ existente }: { existente?: Cancion }) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { crear, guardar, repertorios, guardarRepertorio } = useCancionero();
    // Desde un repertorio: la canción nueva entra en él y se vuelve allí
    const repertorio = repertorios.find(r => r.id === params.get('repertorio'));
    const [titulo, setTitulo] = useState(existente?.titulo ?? '');
    const [artista, setArtista] = useState(existente?.artista ?? '');
    const [texto, setTexto] = useState(existente?.texto ?? '');
    const [pestana, setPestana] = useState<'texto' | 'previa'>('texto');
    const archivoRef = useRef<HTMLInputElement>(null);

    const leida = useMemo(() => leerCancion(texto), [texto]);
    const tono = useMemo(() => detectarTono(leida.acordes), [leida]);
    const demasiado = texto.length > LIMITE_TEXTO;
    const puedeGuardar = !!texto.trim() && !demasiado;

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

    const abrir = async (f?: File) => {
        if (!f) return;
        if (f.size > 200_000) { toast.error('Ese archivo es demasiado grande para ser una canción.'); return; }
        meter(await f.text());
        if (!titulo.trim()) setTitulo(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    };

    const guardarCancion = () => {
        const datos = { titulo: titulo.trim(), artista: artista.trim(), texto: limpiarTexto(texto) };
        if (existente) {
            guardar({ ...existente, ...datos, titulo: datos.titulo || existente.titulo });
            navigate(`/cancionero/${existente.id}`, { replace: true });
        } else {
            const c = crear(datos);
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

            {!existente && (
                <div className="mt-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    <span className="shrink-0 text-[14px] text-muted-foreground">Buscar acordes en</span>
                    {BUSCADORES.map(([nombre, url]) => (
                        <a key={nombre} href={titulo.trim() ? url(`${titulo} ${artista}`.trim()) : undefined} target="_blank" rel="noopener noreferrer"
                            onClick={e => { if (!titulo.trim()) { e.preventDefault(); toast('Escribe primero el título de la canción.'); } }}
                            className="pulsable h-9 px-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                            {nombre} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                    ))}
                </div>
            )}

            <div className="mt-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <button onClick={pegar} className="pulsable h-9 px-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                    <ClipboardPaste className="h-4 w-4" /> Pegar lo copiado
                </button>
                <button onClick={() => archivoRef.current?.click()} className="pulsable h-9 px-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                    <FileUp className="h-4 w-4" /> Abrir archivo
                </button>
                <input ref={archivoRef} type="file" className="hidden" accept=".txt,.cho,.chopro,.chordpro,.crd,.pro,text/plain"
                    onChange={e => { void abrir(e.target.files?.[0]); e.target.value = ''; }} />
            </div>

            <div className="mt-3 md:hidden">
                <Segmentado etiqueta="Ver" valor={pestana} onCambio={setPestana} opciones={[['texto', 'Texto'], ['previa', 'Cómo queda']] as const} />
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className={cn(pestana !== 'texto' && 'hidden md:block')}>
                    <textarea
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
                        className="w-full min-h-[50dvh] md:min-h-[60vh] rounded-2xl bg-fill p-4 font-mono text-[14px] leading-[1.45] text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-foreground/10"
                    />
                    <p className={cn('mt-1.5 text-[13px]', demasiado ? 'text-destructive' : 'text-muted-foreground')}>
                        {demasiado
                            ? 'Es demasiado largo para una canción.'
                            : leida.acordes.length
                                ? `${leida.acordes.length} acordes${tono ? ` · Tono ${nombreTono(tono, leida.meta.cejilla ?? 0, leida.acordes.filter(a => a.latina).length > leida.acordes.length / 2 ? 'latina' : 'americana', false)}` : ''}`
                                : texto.trim() ? 'Aún no vemos acordes: tienen que ir en su línea, encima de la letra, o entre corchetes como [Am].' : 'Lo que no sea la canción (anuncios, botones) lo puedes borrar aquí.'}
                    </p>
                </div>
                <div className={cn(pestana !== 'previa' && 'hidden md:block')}>{previa}</div>
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
