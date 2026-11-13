import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ClipboardPaste, ExternalLink, Headphones, Loader2, Pause, Play, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { buscarEnYouTube, idDeYouTube, minSeg } from '../../lib/seguir';
import type { Escuchar } from '../../hooks/useEscuchar';
import type { Cancion } from '../../types/cancionero';
import { BotonHoja, Hoja } from './Hoja';

// «Escuchar» en la fila de botones de la canción: sin vídeo, la hoja para pegar el enlace; con
// vídeo, abre el reproductor de abajo y suena (si ya está abierto, pausa y sigue)
export function BotonEscuchar({ escuchar, cancion, className }: { escuchar: Escuchar; cancion: Cancion; className?: string }) {
    const { abierto, sonando } = escuchar;
    return (
        <>
            <button type="button" onClick={escuchar.pulsar} aria-pressed={abierto}
                className={cn('pulsable h-9 pl-2.5 pr-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5 shrink-0',
                    abierto ? 'bg-foreground text-background' : 'bg-fill text-foreground', className)}>
                {sonando
                    ? <Pause className="h-[18px] w-[18px]" />
                    : <Headphones className={cn('h-[18px] w-[18px]', !abierto && 'text-pastel-rosa-ink')} />}
                {sonando ? 'Pausa' : 'Escuchar'}
            </button>
            <HojaVideo escuchar={escuchar} cancion={cancion} />
        </>
    );
}

// Pegar el enlace del vídeo (cualquier forma: youtu.be, watch?v=, shorts, music.youtube…)
function HojaVideo({ escuchar, cancion }: { escuchar: Escuchar; cancion: Cancion }) {
    const [texto, setTexto] = useState('');
    const id = idDeYouTube(texto);
    const cerrar = () => { setTexto(''); escuchar.cerrarHojaVideo(); };
    const pegar = async () => {
        try { setTexto((await navigator.clipboard.readText()).trim().slice(0, 500)); }
        catch { toast('No me deja leer lo copiado: mantén el dedo en el recuadro y pega'); }
    };
    const poner = () => { if (!id) return; setTexto(''); escuchar.ponerVideo(id); };
    return (
        <Hoja abierta={escuchar.hojaVideo} onCerrar={cerrar} titulo="Escuchar con YouTube"
            izquierda={<BotonHoja onClick={cerrar}>Cancelar</BotonHoja>}>
            <div className="px-4 pb-5 space-y-3">
                <p className="px-1 text-[14px] text-muted-foreground">La canción suena con su vídeo y la hoja va bajando con ella.</p>
                <ol className="rounded-2xl bg-fill p-3.5 space-y-1.5 text-[14px] text-foreground">
                    <li><b className="font-semibold">1.</b> Busca la canción en YouTube y abre el vídeo.</li>
                    <li><b className="font-semibold">2.</b> Compartir → Copiar enlace, vuelve aquí y pégalo.</li>
                </ol>
                <a href={buscarEnYouTube(cancion.titulo, cancion.artista)} target="_blank" rel="noopener noreferrer"
                    className="pulsable w-full h-11 rounded-full bg-fill text-[15px] font-semibold text-foreground flex items-center justify-center gap-2">
                    <Search className="h-4 w-4" /> Buscar en YouTube <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
                <div className="flex gap-2">
                    <input value={texto} onChange={e => setTexto(e.target.value.slice(0, 500))} onKeyDown={e => { if (e.key === 'Enter') poner(); }}
                        inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
                        placeholder="Pega aquí el enlace del vídeo" aria-label="Enlace del vídeo de YouTube"
                        className="flex-1 min-w-0 h-11 rounded-xl bg-fill px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                    <button type="button" onClick={pegar} className="pulsable h-11 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 shrink-0">
                        <ClipboardPaste className="h-4 w-4" /> Pegar
                    </button>
                </div>
                {texto.trim() && !id && <p className="px-1 text-[13px] text-destructive">Ese enlace no es de un vídeo de YouTube.</p>}
                <button type="button" onClick={poner} disabled={!id}
                    className="pulsable w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
                    <Play className="h-5 w-5" /> Escuchar
                </button>
                {escuchar.video && (
                    <div className="pt-1 space-y-2">
                        <p className="px-1 text-[13px] text-muted-foreground">
                            Ahora: <a href={`https://youtu.be/${escuchar.video}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline underline-offset-2">youtu.be/{escuchar.video}</a>
                            {escuchar.marcas > 0 && <> · {escuchar.marcas} {escuchar.marcas === 1 ? 'línea clavada' : 'líneas clavadas'}</>}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {escuchar.marcas > 0 && (
                                <button type="button" onClick={escuchar.borrarMarcas} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground">
                                    Borrar las marcas
                                </button>
                            )}
                            <button type="button" onClick={escuchar.quitarVideo} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-destructive">
                                Quitar el vídeo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Hoja>
    );
}

// El reproductor, abajo y fijo encima de la barra de la canción (o pegado abajo si no hay barra):
// el vídeo pequeño, el título, el tiempo, play/pausa, «Cambiar vídeo» y cerrar
export function ReproductorEscuchar({ escuchar, titulo, conBarra }: { escuchar: Escuchar; titulo: string; conBarra: boolean }) {
    const { abierto, estado, error, pideToque, leer, ponerBarra, ponerMarco, alternar, abrirHojaVideo, cerrar, irA } = escuchar;
    const [reloj, setReloj] = useState({ t: 0, duracion: 0 });
    useEffect(() => {
        if (!abierto) return;
        const id = setInterval(() => setReloj(leer()), 250);
        return () => clearInterval(id);
    }, [abierto, leer]);
    if (!abierto) return null;
    const sonando = estado === 'sonando';
    const parte = reloj.duracion > 0 ? Math.min(1, reloj.t / reloj.duracion) : 0;
    const saltar = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!reloj.duracion) return;
        const r = e.currentTarget.getBoundingClientRect();
        irA(((e.clientX - r.left) / r.width) * reloj.duracion);
    };
    return (
        <div ref={ponerBarra} data-escuchar=""
            className={cn('sticky z-20 mt-6 bg-sheet border-t border-hairline', conBarra ? 'bottom-[calc(61px+env(safe-area-inset-bottom))]' : 'bottom-0 pb-safe')}>
            <div className="max-w-xl mx-auto flex items-center gap-2.5 px-3 py-2">
                <div className="relative w-[112px] md:w-[144px] aspect-video shrink-0 rounded-lg overflow-hidden bg-black">
                    <div ref={ponerMarco} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
                    {estado === 'cargando' && !pideToque && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn('text-[14px] font-semibold leading-tight', error ? 'text-destructive line-clamp-2' : pideToque ? 'line-clamp-2 text-foreground' : 'truncate text-foreground')}>
                        {error ?? (pideToque ? 'Toca el vídeo para empezar' : titulo)}
                    </p>
                    {!error && (
                        <>
                            <p className="mt-0.5 text-[12.5px] tabular-nums text-muted-foreground">
                                {minSeg(reloj.t)}{reloj.duracion > 0 && <> / {minSeg(reloj.duracion)}</>}
                            </p>
                            <div onClick={saltar} role="slider" aria-label="Ir a un momento de la canción" aria-valuemin={0} aria-valuemax={Math.round(reloj.duracion)} aria-valuenow={Math.round(reloj.t)}
                                className="relative h-4 flex items-center cursor-pointer">
                                <span className="relative h-1 w-full rounded-full bg-fill-strong overflow-hidden">
                                    <span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-foreground" style={{ transform: `scaleX(${parte})` }} />
                                </span>
                            </div>
                        </>
                    )}
                </div>
                {!error && (
                    <button type="button" onClick={alternar} aria-label={sonando ? 'Pausa' : 'Reproducir'} disabled={estado === 'cargando' && !pideToque}
                        className="pulsable h-9 w-9 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-40">
                        {sonando ? <Pause className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px] translate-x-px" />}
                    </button>
                )}
                <button type="button" onClick={abrirHojaVideo} aria-label="Cambiar vídeo"
                    className={cn('pulsable h-9 shrink-0 rounded-full bg-fill text-foreground flex items-center justify-center gap-1.5 text-[14px] font-semibold', error ? 'px-3.5' : 'w-9 md:w-auto md:px-3.5')}>
                    <RefreshCw className="h-4 w-4" /><span className={cn(!error && 'hidden md:inline')}>Cambiar vídeo</span>
                </button>
                <button type="button" onClick={cerrar} aria-label="Cerrar el reproductor"
                    className="pulsable h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground">
                    <X className="h-[18px] w-[18px]" />
                </button>
            </div>
        </div>
    );
}
