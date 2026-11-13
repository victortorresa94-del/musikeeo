import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronRight, Copy, ExternalLink, Loader2, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { crearPlaylist, enlaceEscuchar, irASpotify, pedidoDe, spotifyListo, tokenVivo } from '../../lib/spotify';
import { useApuntarSpotify } from '../../hooks/useApuntarSpotify';
import { BotonHoja, Hoja } from './Hoja';
import type { Cancion, Repertorio } from '../../types/cancionero';

// El logo de Spotify (para enlazar a Spotify), en el color del texto
export function LogoSpotify({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
    );
}

// Escuchar la canción en Spotify: la pista exacta si se sabe; si no, su búsqueda (abre la app)
export function BotonSpotify({ cancion, className }: { cancion: Cancion; className?: string }) {
    return (
        <a href={enlaceEscuchar(cancion)} target="_blank" rel="noopener noreferrer"
            className={cn('pulsable h-9 pl-2.5 pr-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 shrink-0', className)}>
            <LogoSpotify className="h-[18px] w-[18px] text-pastel-menta-ink" /> Spotify
        </a>
    );
}

// En el repertorio: escuchar su playlist o crearla con sus canciones (titulares y extras)
export function FilaSpotify({ repertorio, canciones, className }: { repertorio: Repertorio; canciones: Cancion[]; className?: string }) {
    const [abierta, setAbierta] = useState(false);
    const [haciendo, setHaciendo] = useState<{ hechas: number; total: number } | null>(null);
    const apuntar = useApuntarSpotify();
    const titulares = repertorio.canciones.map(id => canciones.find(c => c.id === id)).filter((c): c is Cancion => !!c);
    const extras = (repertorio.extras ?? []).map(id => canciones.find(c => c.id === id)).filter((c): c is Cancion => !!c);
    const [conExtras, setConExtras] = useState(false);
    const lista = conExtras ? [...titulares, ...extras] : titulares;

    const crear = async () => {
        if (!lista.length) return;
        const pedido = pedidoDe(repertorio.nombre, lista, `/cancionero/repertorio/${repertorio.id}`, repertorio.id);
        // Sin sesión de Spotify (o caducada): a Spotify, y la página de vuelta la crea
        if (!(await tokenVivo())) { void irASpotify(pedido); return; }
        setHaciendo({ hechas: 0, total: lista.length });
        try {
            const r = await crearPlaylist(pedido, (hechas, total) => setHaciendo({ hechas, total }));
            apuntar(r, repertorio.id);
            setAbierta(false);
            toast.success(`Playlist hecha: ${r.total} ${r.total === 1 ? 'canción' : 'canciones'}`, {
                description: r.faltan.length ? `No encontré en Spotify: ${r.faltan.slice(0, 4).join(', ')}${r.faltan.length > 4 ? '…' : ''}` : undefined,
                action: { label: 'Abrir', onClick: () => window.open(r.url, '_blank', 'noopener') },
                duration: 10000,
            });
        } catch (e) {
            if ((e as Error).message === 'SIN_SESION') { void irASpotify(pedido); return; }
            toast.error((e as Error).message);
        } finally { setHaciendo(null); }
    };
    // Los músicos no conectan Spotify (en desarrollo solo deja 5 cuentas): escuchan con el enlace
    const enviarPlaylist = async () => {
        const url = repertorio.spotify;
        if (!url) return;
        if (navigator.share) {
            try { await navigator.share({ title: repertorio.nombre, text: `${repertorio.nombre} · la playlist en Spotify`, url }); return; } catch (e) {
                if ((e as Error)?.name === 'AbortError') return;
            }
        }
        try { await navigator.clipboard.writeText(url); toast.success('Enlace de la playlist copiado. Pégalo en el grupo.'); } catch { toast('No se pudo copiar'); }
    };
    const copiarLista = async () => {
        const texto = lista.map((c, i) => `${i + 1}. ${c.titulo}${c.artista ? ` — ${c.artista}` : ''}`).join('\n');
        try { await navigator.clipboard.writeText(texto); toast.success('Lista copiada'); } catch { toast('No se pudo copiar'); }
    };

    return (
        <>
            <button onClick={() => setAbierta(true)} className={cn('w-full rounded-2xl bg-fill px-3 py-2.5 flex items-center gap-3 text-left active:bg-fill-strong', className)}>
                <span className="h-10 w-10 shrink-0 rounded-xl bg-pastel-menta flex items-center justify-center text-pastel-menta-ink"><LogoSpotify className="h-6 w-6" /></span>
                <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold text-foreground">{repertorio.spotify ? 'Su playlist en Spotify' : 'Crear playlist en Spotify'}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{repertorio.spotify ? 'Ábrela o vuelve a crearla' : `Con sus ${titulares.length} ${titulares.length === 1 ? 'canción' : 'canciones'}, para escucharlas`}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>

            <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} titulo="Spotify" derecha={<BotonHoja fuerte onClick={() => setAbierta(false)}>Listo</BotonHoja>}>
                <div className="px-4 pb-5 space-y-3">
                    {repertorio.spotify && (
                        <a href={repertorio.spotify} target="_blank" rel="noopener noreferrer"
                            className="pulsable w-full h-[52px] rounded-[14px] bg-foreground text-background text-[16px] font-semibold flex items-center justify-center gap-2">
                            <LogoSpotify className="h-5 w-5" /> Abrir su playlist
                        </a>
                    )}
                    {repertorio.spotify && (
                        <button onClick={() => void enviarPlaylist()}
                            className="pulsable w-full h-[52px] rounded-[14px] bg-fill text-foreground text-[16px] font-semibold flex items-center justify-center gap-2">
                            <Send className="h-5 w-5" /> Enviar a los músicos
                        </button>
                    )}
                    {spotifyListo() ? (
                        <>
                            <button onClick={crear} disabled={!!haciendo || !lista.length}
                                className="pulsable w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                                {haciendo
                                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Buscando {haciendo.hechas} de {haciendo.total}…</>
                                    : <>{repertorio.spotify ? 'Crearla otra vez' : 'Crear la playlist'} · {lista.length}</>}
                            </button>
                            {extras.length > 0 && (
                                <label className="flex items-center gap-2 px-1 text-[14px] text-foreground">
                                    <input type="checkbox" checked={conExtras} onChange={e => setConExtras(e.target.checked)} className="h-4 w-4" />
                                    Con los extras ({extras.length})
                                </label>
                            )}
                            <p className="px-1 text-[13px] text-muted-foreground">
                                Busco cada canción en Spotify y la creo en tu cuenta, pública para que tus músicos la abran con el enlace. La primera vez Spotify te pide permiso. Lo que no encuentre te lo digo.
                            </p>
                        </>
                    ) : (
                        <div className="rounded-2xl bg-fill p-3.5 text-[14px] text-foreground space-y-2">
                            <p className="font-semibold">Para crearla sola falta conectar Musikeeo con Spotify (una vez, 5 minutos).</p>
                            <p className="text-muted-foreground">Mientras, copia la lista o escucha cada canción con su botón de Spotify.</p>
                        </div>
                    )}
                    <button onClick={copiarLista} disabled={!lista.length}
                        className="pulsable w-full h-11 rounded-full bg-fill text-[15px] font-semibold text-foreground flex items-center justify-center gap-2 disabled:opacity-40">
                        <Copy className="h-4 w-4" /> Copiar la lista
                    </button>
                    {titulares.length > 0 && (
                        <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                            {titulares.slice(0, 40).map((c, i) => (
                                <a key={c.id} href={enlaceEscuchar(c)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 min-h-[48px] active:bg-fill-strong">
                                    <span className="w-6 text-right text-[13px] tabular-nums text-muted-foreground">{i + 1}</span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block truncate text-[15px] font-semibold text-foreground">{c.titulo}</span>
                                        {c.artista && <span className="block truncate text-[12.5px] text-muted-foreground">{c.artista}</span>}
                                    </span>
                                    {c.spotify ? <LogoSpotify className="h-4 w-4 text-pastel-menta-ink" /> : <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </Hoja>
        </>
    );
}
