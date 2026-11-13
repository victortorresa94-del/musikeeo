import { useCancionero } from './useCancionero';
import type { Resultado } from '../lib/spotify';

// Guarda en cada canción su pista de Spotify y en el repertorio su playlist (sin pisar lo que ya había)
export function useApuntarSpotify() {
    const { canciones, repertorios, guardarVarias, guardarRepertorio } = useCancionero();
    return (resultado: Resultado, repertorioId?: string) => {
        const cambiadas = canciones.filter(c => resultado.enlaces[c.id] && !c.spotify).map(c => ({ ...c, spotify: resultado.enlaces[c.id] }));
        if (cambiadas.length) guardarVarias(cambiadas);
        const r = repertorioId ? repertorios.find(x => x.id === repertorioId) : undefined;
        if (r) guardarRepertorio({ ...r, spotify: resultado.url });
    };
}
