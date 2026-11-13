import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { crearPlaylist, vueltaDeSpotify, type Pedido, type Resultado } from '../../lib/spotify';
import { LogoSpotify } from '../../components/cancionero/Spotify';
import { useApuntarSpotify } from '../../hooks/useApuntarSpotify';

// La vuelta de Spotify (/spotify): entra con el permiso y crea la playlist que se pidió. Se basta
// sola (el pedido viene en la dirección): en la app instalada del iPhone se abre en otra ventana
export default function SpotifyVuelta() {
    const [params] = useSearchParams();
    const apuntar = useApuntarSpotify();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [avance, setAvance] = useState<{ hechas: number; total: number } | null>(null);
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hecho = useRef(false);

    useEffect(() => {
        // Una sola vez (el código de Spotify solo vale una vez; en desarrollo React lo monta dos veces)
        if (hecho.current) return;
        hecho.current = true;
        void (async () => {
            try {
                const p = await vueltaDeSpotify(params);
                setPedido(p);
                const r = await crearPlaylist(p, (hechas, total) => setAvance({ hechas, total }));
                setResultado(r);
            } catch (e) {
                setError((e as Error).message === 'SIN_SESION' ? 'Spotify no ha dado permiso. Prueba otra vez desde el repertorio.' : (e as Error).message);
            }
        })();
    }, [params]);

    // Las pistas encontradas se apuntan en cada canción (si este navegador tiene el cancionero)
    const apuntado = useRef(false);
    useEffect(() => {
        if (!resultado || apuntado.current) return;
        apuntado.current = true;
        apuntar(resultado, pedido?.r);
    }, [resultado, pedido, apuntar]);

    return (
        <main className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-6">
            <div className="w-full max-w-sm text-center">
                <span className="mx-auto h-16 w-16 rounded-[20px] bg-pastel-menta text-pastel-menta-ink flex items-center justify-center"><LogoSpotify className="h-9 w-9" /></span>
                {error ? (
                    <>
                        <h1 className="mt-5 font-heading text-[24px] font-bold">No se ha podido crear</h1>
                        <p className="mt-2 text-[15px] text-muted-foreground">{error}</p>
                    </>
                ) : resultado ? (
                    <>
                        <h1 className="mt-5 font-heading text-[24px] font-bold">Playlist hecha</h1>
                        <p className="mt-2 text-[15px] text-muted-foreground">«{pedido?.n}» · {resultado.total} {resultado.total === 1 ? 'canción' : 'canciones'}</p>
                        {resultado.faltan.length > 0 && (
                            <p className="mt-3 rounded-2xl bg-fill px-3 py-2.5 text-left text-[14px] text-foreground">
                                <span className="font-semibold">No las encontré en Spotify:</span> {resultado.faltan.join(', ')}
                            </p>
                        )}
                        <a href={resultado.url} target="_blank" rel="noopener noreferrer"
                            className="pulsable mt-6 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-semibold flex items-center justify-center gap-2">
                            <LogoSpotify className="h-5 w-5" /> Abrir en Spotify
                        </a>
                    </>
                ) : (
                    <>
                        <h1 className="mt-5 font-heading text-[24px] font-bold">Creando la playlist…</h1>
                        <p className="mt-2 text-[15px] text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {avance ? `Buscando ${avance.hechas} de ${avance.total}` : 'Entrando en Spotify'}
                        </p>
                    </>
                )}
                {(error || resultado) && (
                    <Link to={pedido?.volver || '/cancionero?ver=repertorios'} className="mt-3 inline-flex h-11 px-5 rounded-full bg-fill text-[15px] font-semibold items-center">
                        Volver a Musikeeo
                    </Link>
                )}
            </div>
        </main>
    );
}
